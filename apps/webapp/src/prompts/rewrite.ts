import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type RewriteInput = {
  selection: string;
  projectMd?: string;
  styleMd?: string;
  charactersMd?: string;
  continuityMd?: string;
  userInstruction?: string;
};

export const rewritePrompt: PromptSpec<RewriteInput> = {
  id: "rewrite.v2",
  feature: "rewrite",
  version: 2,

  build(input) {
    return {
      temperature: 0.6,
      messages: buildShellPrompt({
        task: "Improve selected prose while preserving meaning and story facts.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Passage to rewrite:\n---\n${input.selection}\n---`,
        rules: `1. Preserve meaning.\n2. Preserve POV and tense from Project.md.\n3. Preserve character voice.\n4. Do not add new plot events.\n5. Do not create new facts.\n6. Follow Style.md style rules.`,
        outputFormat: "Return the rewritten passage only. Do not include commentary, labels, explanations, markdown fences, or surrounding quotation marks.",
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
