import type { PromptSpec } from "./types";
import { buildBasicContext } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type DescribeInput = {
  selection: string; // Subject / context
  projectTitle?: string;
  genre?: string;
  povAndTense?: string;
  styleNotes?: string;
  userInstruction?: string; // Optional focus description/sensory details
};

export const describePrompt: PromptSpec<DescribeInput> = {
  id: "describe.v1",
  feature: "describe" as any,
  version: 1,

  build(input) {
    const context = buildBasicContext(input);
    const focus = input.userInstruction ? input.userInstruction.trim() : "General sensory detail (sight, sound, smell, touch, taste)";

    return {
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: "You are a fiction writer specializing in vivid, concrete description (show, don’t tell). Write a descriptive passage suitable to insert into the current scene. Match point of view and tense. Avoid clichés. Return only the description, no labels.",
        },
        {
          role: "user",
          content: `${context ? `${context}\n\n` : ""}Subject / context:\n---\n${input.selection}\n---\n\nFocus: ${focus}`,
        },
      ],
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
