import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type WriteInput = {
  selection: string; // Text before cursor / context so far
  projectMd?: string;
  styleMd?: string;
  charactersMd?: string;
  continuityMd?: string;
  userInstruction?: string;
  wordTarget?: number;
};

export const writePrompt: PromptSpec<WriteInput> = {
  id: "write.v2",
  feature: "write" as any,
  version: 2,

  build(input) {
    const targetWords = input.wordTarget || 150;

    return {
      temperature: 0.8,
      messages: buildShellPrompt({
        task: "Continue writing the story prose naturally from the cursor state.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Story text so far:\n---\n${input.selection}\n---`,
        rules: `1. Continue from the exact current narrative state.\n2. Preserve POV, tense, tone, and pacing from the context.\n3. Use Characters.md to keep character motivations, relationships, and speech patterns consistent.\n4. Use hidden continuity memory to avoid contradictions.\n5. Do not resolve conflict too quickly.\n6. Do not invent major canon facts unless clearly implied or requested.\n7. Write approximately ${targetWords} words.`,
        outputFormat: "Return only the continued story prose. Do not include commentary, labels, explanations, markdown fences, or surrounding quotation marks.",
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
