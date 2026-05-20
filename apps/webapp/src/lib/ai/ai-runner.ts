import {
  OpenAIClient,
  runAction,
  HarnessAction,
  MemoryProjectStorage,
} from "@novelwrite/novel-agent";
import type { AiClientConfig } from "./ai-types";

const FEATURE_MAP: Record<string, HarnessAction> = {
  rewrite: "rewrite_selection",
  expand: "expand_selection",
  tighten: "tighten_selection",
  improveDialogue: "improve_dialogue",
  write: "continue_writing",
  summarize: "summarize_continuity",
  checkContinuity: "check_continuity",
  styleCapture: "extract_style",
  characterCapture: "capture_characters",
  beatWrite: "beat_write",
};

export async function runAiFeature(
  feature: string,
  input: {
    selection: string;
    projectMd: string;
    styleMd: string;
    charactersMd: string;
    continuityMd: string;
    activeArtifact: string;
    activeArtifactContent: string;
    userInstruction?: string;
    language?: string;
    signal?: AbortSignal;
  },
  config?: AiClientConfig,
  onToken?: (chunk: string) => void
): Promise<any> {
  const action = FEATURE_MAP[feature];
  if (!action) {
    throw new Error(`Unsupported AI feature: ${feature}`);
  }

  if (!config?.baseUrl || !config.baseUrl.trim()) {
    throw new Error("AI connection is not configured. Please open Project Settings and set up your proxy URL.");
  }

  const llmClient = new OpenAIClient({
    baseUrl: config.baseUrl.trim(),
    apiKey: config.apiKey,
    model: config.model || "gpt-4o-mini",
    headers: config.headers,
  });

  const storage = new MemoryProjectStorage();

  // Populate sentinel manifest
  await storage.writeFile("Novelwrite.json", JSON.stringify({
    app: "novelwrite",
    schemaVersion: 1,
    title: "Web Project",
    language: input.language || "en",
    activeArtifact: input.activeArtifact || "Artifacts/chapter-001.md",
    files: {
      project: "Project.md",
      style: "Style.md",
      characters: "Characters.md",
      continuity: "Continuity.md"
    }
  }, null, 2));

  // Populate project bibles
  await storage.writeFile("Project.md", input.projectMd);
  await storage.writeFile("Style.md", input.styleMd);
  await storage.writeFile("Characters.md", input.charactersMd);
  await storage.writeFile("Continuity.md", input.continuityMd);

  // Populate the active chapter artifact
  const targetArtifact = input.activeArtifact || "Artifacts/chapter-001.md";
  await storage.writeFile(targetArtifact, input.activeArtifactContent);

  try {
    const result = await runAction({
      storage,
      action,
      userInput: input.userInstruction || "",
      activeArtifact: targetArtifact,
      selectedText: input.selection,
      llmClient,
      onToken,
      signal: input.signal,
    });

    if (result.status === "error") {
      throw new Error(result.displayText);
    }

    return result;
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes("<!DOCTYPE html") || msg.includes("<html>") || msg.includes("status 404")) {
      throw new Error("AI connection failed: The proxy endpoint returned a 404 or HTML page. Please verify your proxy URL in Project Settings.");
    }
    throw error;
  }
}
