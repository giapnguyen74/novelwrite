import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type ImproveDialogueInput = {
  selection: string;
  projectMd?: string;
  styleMd?: string;
  charactersMd?: string;
  continuityMd?: string;
  userInstruction?: string;
};

export const improveDialoguePrompt: PromptSpec<ImproveDialogueInput> = {
  id: "improveDialogue.v1",
  feature: "improveDialogue" as any,
  version: 1,

  build(input) {
    return {
      temperature: 0.7,
      messages: buildShellPrompt({
        task: "Make dialogue more natural, character-specific, and subtextual.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Dialogue passage to revise:\n---\n${input.selection}\n---`,
        rules: `1. Preserve the factual information exchanged and character intention.\n2. Make each voice match Characters.md traits and speech patterns.\n3. Prefer subtext over direct explanation.\n4. Avoid exposition dumps.`,
        outputFormat: "Return the revised dialogue passage only. Do not include commentary, labels, explanations, markdown fences, or surrounding quotation marks.",
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
