import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type CheckContinuityInput = {
  selection: string; // Selection or full chapter text to verify
  projectMd?: string;
  styleMd?: string;
  charactersMd?: string;
  continuityMd?: string;
  userInstruction?: string;
};

export const checkContinuityPrompt: PromptSpec<CheckContinuityInput> = {
  id: "checkContinuity.v1",
  feature: "checkContinuity" as any,
  version: 1,

  build(input) {
    return {
      temperature: 0.3,
      messages: buildShellPrompt({
        task: "Detect possible contradictions, timeline discrepancies, or character consistency errors in the text.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          styleMd: input.styleMd,
          charactersMd: input.charactersMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Text to analyze:\n---\n${input.selection}\n---`,
        rules: `1. Identify explicit or implicit contradictions with Project.md, Characters.md, or hidden Continuity memory.\n2. Identify timeline/sequence issues.\n3. Identify character-state conflicts (e.g. actions not matching their knowledge/desires/secrets/current physical state).\n4. Identify unresolved or dropped threads.\n5. Do not rewrite the prose unless explicitly requested. Keep the report clear and constructive.`,
        outputFormat: `Return a detailed markdown continuity report using this structure:

### Continuity Analysis

#### 1. Discrepancies & Contradictions
* [List any plot holes or direct factual contradictions]

#### 2. Character & Relationship Consistency
* [List any speech pattern mismatches or relationship/secret inconsistencies]

#### 3. Timeline & Pacing
* [Note any issues with temporal consistency or rushed narrative pacing]

#### 4. Recommendations & Fixes
* [Suggest concrete editorial revisions to resolve these conflicts]

*If no issues are found, confirm that the text is consistent with the story bible and continuity memory.*`,
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
