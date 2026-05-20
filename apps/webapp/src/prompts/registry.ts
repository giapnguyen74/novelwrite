import { brainstormPrompt } from "./brainstorm";
import { characterChatPrompt } from "./characterChat";
import { describePrompt } from "./describe";
import { expandPrompt } from "./expand";
import { extractCharactersPrompt } from "./extractCharacters";
import { rewritePrompt } from "./rewrite";
import { sceneBeatsPrompt } from "./sceneBeats";
import { summarizePrompt } from "./summarize";
import { writePrompt } from "./write";
import { tightenPrompt } from "./tighten";
import { improveDialoguePrompt } from "./improveDialogue";
import { checkContinuityPrompt } from "./checkContinuity";
import { styleCapturePrompt } from "./styleCapture";
import { characterCapturePrompt } from "./characterCapture";

export const promptRegistry = {
  rewrite: rewritePrompt,
  expand: expandPrompt,
  summarize: summarizePrompt,
  write: writePrompt,
  describe: describePrompt,
  brainstorm: brainstormPrompt,
  extractCharacters: extractCharactersPrompt,
  characterChat: characterChatPrompt,
  sceneBeats: sceneBeatsPrompt,
  tighten: tightenPrompt,
  improveDialogue: improveDialoguePrompt,
  checkContinuity: checkContinuityPrompt,
  styleCapture: styleCapturePrompt,
  characterCapture: characterCapturePrompt,
} as const;

export type RegisteredPromptId = keyof typeof promptRegistry;
