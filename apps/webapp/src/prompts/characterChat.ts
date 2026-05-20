import type { PromptSpec } from "./types";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type CharacterChatInput = {
  selection: string; // The user message or character context
  characterName: string;
  characterCard: string;
  userInstruction: string; // The specific chat message from the user
  maxReplyWords?: number;
};

export const characterChatPrompt: PromptSpec<CharacterChatInput> = {
  id: "characterChat.v1",
  feature: "characterChat" as any,
  version: 1,

  build(input) {
    const maxWords = input.maxReplyWords || 100;

    return {
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `You are playing the character ${input.characterName} in the author’s novel. Stay in character and in the story world. Use the character card as ground truth. You may discuss craft OOC only if the author prefixes with "OOC:". Do not invent major plot events unless asked. Refuse harmful or sexual content involving minors. Keep replies under ${maxWords} words unless asked for more.\n\nCharacter card:\n${input.characterCard}`,
        },
        {
          role: "user",
          content: input.userInstruction,
        },
      ],
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
