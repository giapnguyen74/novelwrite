import type { ChatMessage } from "@/lib/ai/ai-types";

export type AiFeatureId =
  | "rewrite"
  | "expand"
  | "summarize"
  | "write"
  | "describe"
  | "brainstorm"
  | "extractCharacters"
  | "characterChat"
  | "sceneBeats"
  | "tighten"
  | "improveDialogue"
  | "checkContinuity"
  | "styleCapture"
  | "characterCapture";

export type PromptBuildResult = {
  messages: ChatMessage[];
  temperature: number;
  maxTokens?: number;
};

export type PromptSpec<TInput> = {
  id: string;
  feature: AiFeatureId;
  version: number;
  build(input: TInput): PromptBuildResult;
  postprocess(raw: string): string;
};
