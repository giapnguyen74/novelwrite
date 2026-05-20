import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type CharacterCaptureInput = {
  selection: string; // Source text / scene / chapter / user notes
  projectMd?: string;
  charactersMd?: string; // Existing characters.md
  continuityMd?: string;
  userInstruction?: string;
};

export const characterCapturePrompt: PromptSpec<CharacterCaptureInput> = {
  id: "characterCapture.v1",
  feature: "characterCapture" as any,
  version: 1,

  build(input) {
    return {
      temperature: 0.3,
      messages: buildShellPrompt({
        task: "Extract and merge character information into the existing character bible (Characters.md).",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Source Text to Analyze:\n---\n${input.selection}\n---`,
        rules: `1. Extract only character-relevant information.\n2. Preserve existing user-written information in the bible unless the source text explicitly adds more detail or corrects it.\n3. Do not delete existing character entries or fields unless explicitly requested.\n4. Separate confirmed facts from uncertain implications.\n5. Capture character voice and speech patterns when visible.\n6. Capture relationships, secrets, desires, fears, and development.\n7. Avoid inventing information not supported by the source text.`,
        outputFormat: `Return a complete updated Characters.md using the template layout:

# Characters

## Character Name
[Repeat for each character, merging new facts into existing blocks if they exist, or creating new character blocks if they are new]

### Role
[Role in story, e.g. protagonist, antagonist, mentor, sidekick]

### Current Status
[e.g. alive, active, deceased, hidden]

### Personality
[Bullet points of traits]

### Voice / Speech Pattern
[Specific speech habits, speed, dialect, vocabulary choice]

### Core Desire
[What do they want most in the scene/novel]

### Core Fear
[What are they afraid of or running from]

### Relationships
[Track alliances/enmities/romance/feelings toward other characters]

### Secrets
[Secrets they are keeping from other characters or the audience]

### Important Facts
[Specific physical details, background facts, abilities]

### Development So Far
[How they have grown or changed through the story]`,
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
