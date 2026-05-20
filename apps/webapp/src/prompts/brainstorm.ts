import type { PromptSpec } from "./types";
import { buildBasicContext } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type BrainstormInput = {
  selection: string; // Subject / context
  projectTitle?: string;
  genre?: string;
  povAndTense?: string;
  styleNotes?: string;
  userInstruction: string; // The brainstorm request
};

export const brainstormPrompt: PromptSpec<BrainstormInput> = {
  id: "brainstorm.v1",
  feature: "brainstorm" as any,
  version: 1,

  build(input) {
    const context = buildBasicContext(input);

    return {
      temperature: 1.0,
      messages: [
        {
          role: "system",
          content: "You are a creative writing brainstorming partner. Generate diverse, concrete ideas. Format as a numbered list (8–12 items). Do not pick a single winner or explain at length. Stay consistent with the story context provided.",
        },
        {
          role: "user",
          content: `${context ? `${context}\n\n` : ""}${input.selection ? `Story fragment for context:\n---\n${input.selection}\n---\n\n` : ""}Brainstorm request: ${input.userInstruction}`,
        },
      ],
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
