import type { ChatMessage } from "@/lib/ai/ai-types";

export type BasicPromptContext = {
  projectTitle?: string;
  genre?: string;
  povAndTense?: string;
  styleNotes?: string;
};

export function buildBasicContext(input: BasicPromptContext): string {
  return [
    input.projectTitle ? `Project title: ${input.projectTitle}` : null,
    input.genre ? `Genre: ${input.genre}` : null,
    input.povAndTense ? `POV / tense: ${input.povAndTense}` : null,
    input.styleNotes ? `Style notes: ${input.styleNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatOptionalInstruction(userInstruction?: string): string {
  const trimmed = userInstruction?.trim();
  return trimmed ? `\n\nAdditional instruction:\n${trimmed}` : "";
}

// ==========================================
// V3 Storage & AI Context Shell Implementation
// ==========================================

export type StoryContext = {
  projectMd?: string;
  styleMd?: string;
  charactersMd?: string;
  continuityMd?: string;
};

export type ShellPromptInput = {
  task: string;
  userInstruction?: string;
  storyContext?: StoryContext;
  workingContext?: string;
  input?: string;
  rules: string;
  outputFormat: string;
};

/**
 * Builds standard ChatMessage[] array based on the General Prompt Shell in Section 7:
 * System prompt contains role, and the single user prompt contains structured blocks in priority order.
 */
export function buildShellPrompt(input: ShellPromptInput): ChatMessage[] {
  const systemContent = "You are an AI writing assistant for a novelist.";

  const userParts = [
    `TASK:\n${input.task}`,
    input.userInstruction?.trim() ? `USER INSTRUCTION:\n${input.userInstruction.trim()}` : null,
    input.storyContext?.projectMd?.trim() ? `PROJECT CONTEXT:\n${input.storyContext.projectMd.trim()}` : null,
    input.storyContext?.charactersMd?.trim() ? `CHARACTER CONTEXT:\n${input.storyContext.charactersMd.trim()}` : null,
    input.storyContext?.styleMd?.trim() ? `STYLE CONTEXT:\n${input.storyContext.styleMd.trim()}` : null,
    input.storyContext?.continuityMd?.trim() ? `CONTINUITY CONTEXT:\n${input.storyContext.continuityMd.trim()}` : null,
    input.workingContext?.trim() ? `WORKING CONTEXT:\n${input.workingContext.trim()}` : null,
    input.input?.trim() ? `INPUT:\n${input.input.trim()}` : null,
    `RULES:\n${input.rules}`,
    `OUTPUT FORMAT:\n${input.outputFormat}`
  ].filter(Boolean);

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userParts.join("\n\n") }
  ];
}
