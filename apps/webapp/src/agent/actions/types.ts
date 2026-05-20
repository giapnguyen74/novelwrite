import { ChatMessage } from "../prompts/context";
import { LanguagePack } from "../language/languagePackSchema";

export type HarnessAction =
  | "continue_writing"
  | "rewrite_selection"
  | "expand_selection"
  | "tighten_selection"
  | "improve_dialogue"
  | "extract_style"
  | "capture_characters"
  | "summarize_continuity"
  | "check_continuity"
  | "beat_write";

export type ActionInput = {
  selection: string;
  activeArtifactContent?: string;
  projectMd: string;
  styleMd: string;
  charactersMd: string;
  continuityMd: string;
  userInstruction?: string;
  languagePack: LanguagePack;
};

export type ActionSpec = {
  id: HarnessAction;
  label: string;
  buildPrompt(input: ActionInput): {
    messages: ChatMessage[];
    temperature?: number;
  };
  postprocess(rawOutput: string): string;
};
