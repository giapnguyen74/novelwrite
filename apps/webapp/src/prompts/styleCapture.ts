import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type StyleCaptureInput = {
  selection: string; // The user style input, favorite authors, style examples, etc.
  projectMd?: string;
  userInstruction?: string;
};

export const styleCapturePrompt: PromptSpec<StyleCaptureInput> = {
  id: "styleCapture.v1",
  feature: "styleCapture" as any,
  version: 1,

  build(input) {
    return {
      temperature: 0.5,
      messages: buildShellPrompt({
        task: "Extract a reusable prose style guide from the user's style input or sample text.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
        },
        workingContext: `User Style Preferences & Samples:\n---\n${input.selection}\n---`,
        rules: `1. Convert vague style preferences into concrete writing guidance.\n2. Do not imitate copyrighted text directly.\n3. Do not overfit to one passage.\n4. Describe sentence rhythm, description style, dialogue style, emotional style, pacing, preferred techniques, and things to avoid.\n5. Keep the output practical for future novel-writing prompts.`,
        outputFormat: `Return a complete Style.md using this structure:

# Style

## Style Summary
[A concise summary of the overall voice, mood, and rhythm]

## Sentence Rhythm
[e.g. short/punchy, rolling clauses, complex, lyrical, etc.]

## Description Style
[e.g. sensory-dense, minimalist, atmospheric, metaphor-heavy, etc.]

## Dialogue Style
[e.g. snappy/subtextual, realistic, formal, dialect usage, tags preference]

## Emotional Style
[e.g. internal/subjective, detached, hyper-observant, etc.]

## Pacing
[e.g. slow/reflective, breakneck, variable, scene-to-narrative ratio]

## Preferred Techniques
[e.g. close third person, free indirect discourse, show-don't-tell rules]

## Avoid
[Bullet points of cliches, words, or prose styles to strictly avoid]

## Reference Influences
[List any authors or genres that influence this style]

## Extracted Voice Notes
[List any grammatical or structural voice properties discovered]

## Sample Passage
[Include a short paragraph (100 words) demonstrating this voice in action]`,
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
