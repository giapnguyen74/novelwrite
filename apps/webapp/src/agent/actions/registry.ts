import { buildShellPrompt } from "../prompts/context";
import { cleanPlainProse, assertUsablePlainProse } from "../utils/markdown";
import { ActionSpec, HarnessAction } from "./types";

function getPriorWords(fullText: string, selectionText: string, wordCount: number): string {
  if (!selectionText || !fullText) return "";
  const index = fullText.indexOf(selectionText);
  if (index === -1) return "";

  const beforeText = fullText.slice(0, index);
  const words = beforeText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordCount) return beforeText;

  return "..." + words.slice(-wordCount).join(" ");
}

function getFollowingWords(fullText: string, selectionText: string, wordCount: number): string {
  if (!selectionText || !fullText) return "";
  const index = fullText.indexOf(selectionText);
  if (index === -1) return "";

  const afterText = fullText.slice(index + selectionText.length);
  const words = afterText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordCount) return afterText;

  return words.slice(0, wordCount).join(" ") + "...";
}

function formatWorkingContext(selection: string, fullText?: string): string {
  if (selection && fullText && fullText.includes(selection)) {
    const prior = getPriorWords(fullText, selection, 1000);
    const following = getFollowingWords(fullText, selection, 500);

    return `PRECEEDING PROSE (Immediate setup context):\n---\n${prior}\n---\n\nTARGET SELECTION (Passage to act on):\n---\n${selection}\n---\n\nFOLLOWING PROSE (Subsequent context):\n---\n${following}\n---`;
  }
  return `Passage/context:\n---\n${selection}\n---`;
}

export const continueWritingSpec: ActionSpec = {
  id: "continue_writing",
  label: "Continue Writing",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.continue_writing;
    return {
      temperature: 0.8,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: formatWorkingContext(input.selection, input.activeArtifactContent),
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const rewriteSelectionSpec: ActionSpec = {
  id: "rewrite_selection",
  label: "Rewrite Passage",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.rewrite_selection;
    return {
      temperature: 0.7,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: formatWorkingContext(input.selection, input.activeArtifactContent),
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const expandSelectionSpec: ActionSpec = {
  id: "expand_selection",
  label: "Expand Passage",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.expand_selection;
    return {
      temperature: 0.8,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: formatWorkingContext(input.selection, input.activeArtifactContent),
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const tightenSelectionSpec: ActionSpec = {
  id: "tighten_selection",
  label: "Tighten Passage",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.tighten_selection;
    return {
      temperature: 0.5,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: formatWorkingContext(input.selection, input.activeArtifactContent),
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const improveDialogueSpec: ActionSpec = {
  id: "improve_dialogue",
  label: "Polish Dialogue",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.improve_dialogue;
    return {
      temperature: 0.7,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: formatWorkingContext(input.selection, input.activeArtifactContent),
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const extractStyleSpec: ActionSpec = {
  id: "extract_style",
  label: "Style Capture",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.extract_style;
    return {
      temperature: 0.6,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `User Style Inputs and Sample Prose:\n---\n${input.selection}\n---`,
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const captureCharactersSpec: ActionSpec = {
  id: "capture_characters",
  label: "Character Capture",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.capture_characters;
    return {
      temperature: 0.6,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Source Text to Analyze:\n---\n${input.selection}\n---`,
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    let clean = raw.trim();
    // Remove markdown code fences if present
    if (clean.startsWith("```")) {
      const lines = clean.split(/\r?\n/);
      if (lines[0].startsWith("```")) {
        lines.shift();
      }
      if (lines.length > 0 && lines[lines.length - 1].startsWith("```")) {
        lines.pop();
      }
      clean = lines.join("\n").trim();
    }
    return clean;
  },
};

export const summarizeContinuitySpec: ActionSpec = {
  id: "summarize_continuity",
  label: "Summarize Continuity",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.summarize_continuity;
    return {
      temperature: 0.5,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Scene/Chapter Prose to Summarize:\n---\n${input.selection}\n---`,
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const checkContinuitySpec: ActionSpec = {
  id: "check_continuity",
  label: "Check Continuity",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.check_continuity;
    return {
      temperature: 0.4,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Prose to Analyze:\n---\n${input.selection}\n---`,
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const beatWriteSpec: ActionSpec = {
  id: "beat_write",
  label: "Write Beat",
  buildPrompt(input) {
    const templates = input.languagePack.actionPrompts.beat_write;
    return {
      temperature: 0.8,
      messages: buildShellPrompt({
        task: templates.task,
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: formatWorkingContext(input.selection, input.activeArtifactContent),
        rules: templates.rules,
        outputFormat: templates.outputFormat,
      }),
    };
  },
  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};

export const ACTION_REGISTRY = new Map<HarnessAction, ActionSpec>([
  ["continue_writing", continueWritingSpec],
  ["rewrite_selection", rewriteSelectionSpec],
  ["expand_selection", expandSelectionSpec],
  ["tighten_selection", tightenSelectionSpec],
  ["improve_dialogue", improveDialogueSpec],
  ["extract_style", extractStyleSpec],
  ["capture_characters", captureCharactersSpec],
  ["summarize_continuity", summarizeContinuitySpec],
  ["check_continuity", checkContinuitySpec],
  ["beat_write", beatWriteSpec],
]);

export function getActionSpec(action: HarnessAction): ActionSpec {
  const spec = ACTION_REGISTRY.get(action);
  if (!spec) {
    throw new Error(`Unsupported harness action: ${action}`);
  }
  return spec;
}
