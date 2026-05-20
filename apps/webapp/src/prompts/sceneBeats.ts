import type { PromptSpec } from "./types";
import { buildBasicContext } from "./context";
import { assertUsablePlainProse } from "./output";

export type SceneBeatsInput = {
  selection: string; // The chapter context or existing outline
  projectTitle?: string;
  genre?: string;
  povAndTense?: string;
  styleNotes?: string;
  chapterTitle?: string;
  userInstruction?: string; // Author notes or guidelines
};

export const sceneBeatsPrompt: PromptSpec<SceneBeatsInput> = {
  id: "sceneBeats.v1",
  feature: "sceneBeats" as any,
  version: 1,

  build(input) {
    const context = buildBasicContext(input);
    const chapterTitle = input.chapterTitle || "Untitled Scene";
    const notes = input.userInstruction ? input.userInstruction.trim() : "None provided.";

    return {
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: 'You are a story structure coach. Produce a beat sheet for one scene. Return valid JSON only: { "sceneTitle": string, "beats": [ { "beat": string, "goal": string, "conflict": string, "outcome": string } ] }. Use 5–9 beats. Align with provided context; do not write full prose.',
        },
        {
          role: "user",
          content: `${context ? `${context}\n\n` : ""}Scene/chapter: ${chapterTitle}\nAuthor notes: ${notes}\n\nOutline context:\n---\n${input.selection}\n---`,
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
