import type { PromptSpec } from "./types";
import { assertUsablePlainProse } from "./output";

export type ExtractCharactersInput = {
  selection: string; // Text to analyze
  existingBibleJson?: string; // Existing characters in JSON
};

export const extractCharactersPrompt: PromptSpec<ExtractCharactersInput> = {
  id: "extractCharacters.v1",
  feature: "extractCharacters" as any,
  version: 1,

  build(input) {
    const existing = input.existingBibleJson ? input.existingBibleJson.trim() : "[]";

    return {
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: 'You extract fiction characters from prose for an author’s story bible. Return valid JSON only, no markdown fences. Schema: { "characters": [ { "name": string, "role": string, "traits": string[], "relationships": string, "evidence": string } ] }. Merge with existing names when the same person appears. If uncertain, omit rather than invent.',
        },
        {
          role: "user",
          content: `Existing characters (if any):\n${existing}\n\nText to analyze:\n---\n${input.selection}\n---`,
        },
      ],
    };
  },

  postprocess(raw) {
    // Return clean JSON string
    return assertUsablePlainProse(
      raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim()
    );
  },
};
