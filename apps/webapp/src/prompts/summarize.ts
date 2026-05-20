import type { PromptSpec } from "./types";
import { buildShellPrompt } from "./context";
import { assertUsablePlainProse, cleanPlainProse } from "./output";

export type SummarizeInput = {
  selection: string; // The accepted chapter text to summarize
  projectMd?: string;
  continuityMd?: string;
  userInstruction?: string;
};

export const summarizePrompt: PromptSpec<SummarizeInput> = {
  id: "summarize.v2",
  feature: "summarize" as any,
  version: 2,

  build(input) {
    return {
      temperature: 0.3,
      messages: buildShellPrompt({
        task: "Update hidden continuity memory from the accepted story text.",
        userInstruction: input.userInstruction,
        storyContext: {
          projectMd: input.projectMd,
          continuityMd: input.continuityMd,
        },
        workingContext: `Accepted Story Text:\n---\n${input.selection}\n---`,
        rules: `1. Summarize only accepted story progress.\n2. Keep memory compact and concise.\n3. Track timeline, plot progress, confirmed facts, open questions, unresolved threads, relationship changes, and continuity risks.\n4. Do not rewrite prose or copy paragraphs of story text.\n5. Do not change Project.md, Style.md, or Characters.md.\n6. Do not treat ambiguous implications as confirmed facts.`,
        outputFormat: `Return a complete updated Continuity Memory using this exact markdown structure:

# Continuity Memory

## Full Story Summary
[Provide/update a 2-3 sentence overview of the entire novel's arc so far]

## Chapter Summaries
### Chapter [Name/Number]
[Bullet point summary of key beats]

## Timeline
[Track sequence of days/times and events]

## Plot Progress
[List major plot milestones reached]

## Confirmed Facts
[List concrete facts established in the story]

## Character State Changes
[e.g. Character A is now injured/married/dead]

## Relationship Changes
[Track alliance/animosity shifts]

## World / Setting Facts
[Bullet points of lore or setting details]

## Open Questions
[List mysteries or questions introduced]

## Unresolved Threads
[List outstanding tasks/conflicts to resolve]

## Continuity Risks
[Highlight any potential contradictions or plot holes found]`,
      }),
    };
  },

  postprocess(raw) {
    return assertUsablePlainProse(cleanPlainProse(raw));
  },
};
