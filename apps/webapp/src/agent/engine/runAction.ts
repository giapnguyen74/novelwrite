import { ProjectStorage } from "../storage/ProjectStorage";
import { HarnessAction } from "../actions/types";
import { LLMClient } from "../llm/LLMClient";
import { ProjectPatch, ProjectPatchOperation } from "./applyPatch";
import { BuiltPrompt, buildPrompt } from "./buildPrompt";
import { loadProjectContext } from "../project/loadProjectContext";
import { getActionSpec } from "../actions/registry";
import { loadManifest } from "../project/manifest";
import { loadLanguagePack } from "../language/languagePackSchema";
import { mergeCharacters } from "../characters/mergeCharacters";
import { renderCharactersMarkdown } from "../characters/renderCharactersMarkdown";
import { migrateFromMarkdown } from "../characters/migrateFromMarkdown";

export type RunActionInput = {
  storage: ProjectStorage;
  action: HarnessAction;
  userInput: string;
  activeArtifact?: string;
  selectedText?: string;
  llmClient: LLMClient;
  onToken?: (chunk: string) => void;
  signal?: AbortSignal;
};

export type RunActionResult = {
  action: HarnessAction;
  status: "ok" | "warning" | "error";
  prompt: BuiltPrompt;
  rawOutput?: string;
  parsedOutput?: string;
  displayText: string;
  warnings: string[];
  proposedPatch?: ProjectPatch;
};

export async function runAction(input: RunActionInput): Promise<RunActionResult> {
  const manifest = await loadManifest(input.storage);
  if (!manifest) {
    return {
      action: input.action,
      status: "error",
      prompt: { messages: [], temperature: 0.7 },
      displayText: "This folder is not a valid Novelwrite project. (Missing Novelwrite.json)",
      warnings: ["uninitialized"],
    };
  }

  // Load context
  const context = await loadProjectContext(input.storage, input.activeArtifact);
  if (!context) {
    return {
      action: input.action,
      status: "error",
      prompt: { messages: [], temperature: 0.7 },
      displayText: "Failed to load project context files.",
      warnings: ["missing_context"],
    };
  }

  // Resolve the active selection
  const selectionText = input.selectedText || context.activeArtifactContent || "";

  // Resolve language pack based on project manifest language
  const languagePack = loadLanguagePack(manifest.language || "en");

  // Build prompt
  const prompt = buildPrompt({
    action: input.action,
    selection: selectionText,
    activeArtifactContent: context.activeArtifactContent || "",
    projectMd: context.projectMd,
    styleMd: context.styleMd,
    charactersMd: context.charactersMd,
    continuityMd: context.continuityMd,
    userInstruction: input.userInput,
    languagePack,
  });

  try {
    // Run LLM
    const spec = getActionSpec(input.action);
    let response;

    if (input.onToken && input.llmClient.streamGenerate) {
      response = await input.llmClient.streamGenerate({
        messages: prompt.messages,
        temperature: prompt.temperature,
        signal: input.signal,
      }, input.onToken);
    } else {
      response = await input.llmClient.generate({
        messages: prompt.messages,
        temperature: prompt.temperature,
        signal: input.signal,
      });
    }

    // Postprocess output
    const parsedOutput = spec.postprocess(response.text);

    // Generate proposed patch
    const proposedOperations: ProjectPatchOperation[] = [];
    const targetArtifact = input.activeArtifact || manifest.activeArtifact;

    if (input.action === "continue_writing" && targetArtifact) {
      proposedOperations.push({
        type: "append_file",
        path: targetArtifact,
        content: parsedOutput,
      });
    } else if (input.action === "rewrite_selection" && targetArtifact) {
      const content = context.activeArtifactContent || "";
      if (input.selectedText && content.includes(input.selectedText)) {
        const start = content.indexOf(input.selectedText);
        const end = start + input.selectedText.length;
        proposedOperations.push({
          type: "replace_range",
          path: targetArtifact,
          start,
          end,
          content: parsedOutput,
        });
      } else {
        proposedOperations.push({
          type: "write_file",
          path: targetArtifact,
          content: parsedOutput,
        });
      }
    } else if (
      input.action === "expand_selection" ||
      input.action === "tighten_selection" ||
      input.action === "improve_dialogue"
    ) {
      if (targetArtifact) {
        const content = context.activeArtifactContent || "";
        if (input.selectedText && content.includes(input.selectedText)) {
          const start = content.indexOf(input.selectedText);
          const end = start + input.selectedText.length;
          proposedOperations.push({
            type: "replace_range",
            path: targetArtifact,
            start,
            end,
            content: parsedOutput,
          });
        } else {
          proposedOperations.push({
            type: "write_file",
            path: targetArtifact,
            content: parsedOutput,
          });
        }
      }
    } else if (input.action === "extract_style") {
      proposedOperations.push({
        type: "write_file",
        path: manifest.files.style,
        content: parsedOutput,
      });
    } else if (input.action === "capture_characters") {
      const charactersJsonPath = manifest.files.charactersJson || "Characters.json";
      const rawExistingJson = await input.storage.readFile(charactersJsonPath);
      let existingCharacters: any[] = [];
      if (rawExistingJson) {
        try {
          const doc = JSON.parse(rawExistingJson);
          if (doc && Array.isArray(doc.characters)) {
            existingCharacters = doc.characters;
          }
        } catch {}
      } else {
        // Fallback: migrate from existing Characters.md if it exists
        const rawExistingMd = await input.storage.readFile(manifest.files.characters);
        if (rawExistingMd) {
          try {
            const migrated = migrateFromMarkdown(rawExistingMd);
            existingCharacters = migrated.characters;
          } catch {}
        }
      }

      // Parse incoming characters from LLM parsedOutput
      let incomingCharacters: any[] = [];
      try {
        const parsed = JSON.parse(parsedOutput);
        if (Array.isArray(parsed)) {
          incomingCharacters = parsed;
        } else if (parsed && Array.isArray(parsed.characters)) {
          incomingCharacters = parsed.characters;
        }
      } catch {}

      // Add evidence trace back if a chapter / artifact is active
      const activeArtifactName = input.activeArtifact || manifest.activeArtifact || "";
      if (activeArtifactName && incomingCharacters.length > 0) {
        const chapterId = activeArtifactName.replace(/^Artifacts\//, "").replace(/\.md$/, "");
        for (const char of incomingCharacters) {
          if (!char.evidence) char.evidence = [];
          if (char.evidence.length === 0) {
            char.evidence.push({
              chapterId,
              quote: `Extracted from chapter text`,
              addedAt: Date.now(),
            });
          } else {
            for (const ev of char.evidence) {
              ev.chapterId = ev.chapterId || chapterId;
              ev.addedAt = ev.addedAt || Date.now();
            }
          }
        }
      }

      const mergedList = mergeCharacters(existingCharacters, incomingCharacters);
      const updatedDoc = {
        schemaVersion: 1 as const,
        characters: mergedList,
      };

      proposedOperations.push({
        type: "write_file",
        path: charactersJsonPath,
        content: JSON.stringify(updatedDoc, null, 2),
      });

      proposedOperations.push({
        type: "write_file",
        path: manifest.files.characters,
        content: renderCharactersMarkdown(updatedDoc),
      });
    } else if (input.action === "summarize_continuity") {
      proposedOperations.push({
        type: "write_file",
        path: manifest.files.continuity,
        content: parsedOutput,
      });
    }

    const proposedPatch = proposedOperations.length > 0 ? { operations: proposedOperations } : undefined;

    return {
      action: input.action,
      status: "ok",
      prompt,
      rawOutput: response.text,
      parsedOutput,
      displayText: parsedOutput,
      warnings: [],
      proposedPatch,
    };
  } catch (err: any) {
    return {
      action: input.action,
      status: "error",
      prompt,
      displayText: `Action execution failed: ${err.message || err}`,
      warnings: [err.message || "execution_failed"],
    };
  }
}
