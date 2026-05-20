import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type TightenInput = {
  selection: string;
  projectMd?: string;
  styleMd?: string;
  userInstruction?: string;
};

export const tightenPrompt: PromptSpec<TightenInput> = {
  id: "tighten.v1",
  feature: "tighten" as any,
  version: 1,

  build(input) {
    return {
      temperature: 0.5,
      messages: buildShellPrompt({
        task: "Shorten and sharpen the selected prose.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
        },
        workingContext: `Passage to tighten:\n---\n${input.selection}\n---`,
        rules: `1. Remove redundancy and bloat.\n2. Preserve meaning, voice, and atmosphere.\n3. Do not make the prose feel rushed.\n4. Preserve POV and tense.`,
        outputFormat: "Return the tightened passage only. Do not include commentary, labels, explanations, markdown fences, or surrounding quotation marks.",
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
