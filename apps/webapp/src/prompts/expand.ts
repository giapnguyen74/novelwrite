import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type ExpandInput = {
  selection: string;
  projectMd?: string;
  styleMd?: string;
  charactersMd?: string;
  continuityMd?: string;
  userInstruction?: string;
};

export const expandPrompt: PromptSpec<ExpandInput> = {
  id: "expand.v2",
  feature: "expand",
  version: 2,

  build(input) {
    return {
      temperature: 0.8,
      messages: buildShellPrompt({
        task: "Add depth, atmosphere, interiority, sensory detail, or subtext to the selection.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Passage to expand:\n---\n${input.selection}\n---`,
        rules: `1. Preserve original plot direction.\n2. Add depth without changing core events.\n3. Do not introduce major new facts unless requested.\n4. Preserve POV, tense, tone, and character voice.`,
        outputFormat: "Return the expanded passage only. Do not include commentary, labels, explanations, markdown fences, or surrounding quotation marks.",
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
