import { getActionSpec } from "../actions/registry";
import { HarnessAction } from "../actions/types";
import { ChatMessage } from "../prompts/context";
import { LanguagePack } from "../language/languagePackSchema";

export type BuildPromptInput = {
  action: HarnessAction;
  selection: string;
  activeArtifactContent?: string;
  projectMd: string;
  styleMd: string;
  charactersMd: string;
  continuityMd: string;
  userInstruction?: string;
  languagePack: LanguagePack;
};

export type BuiltPrompt = {
  messages: ChatMessage[];
  temperature: number;
};

export function buildPrompt(input: BuildPromptInput): BuiltPrompt {
  const spec = getActionSpec(input.action);
  const result = spec.buildPrompt({
    selection: input.selection,
    activeArtifactContent: input.activeArtifactContent || "",
    projectMd: input.projectMd,
    styleMd: input.styleMd,
    charactersMd: input.charactersMd,
    continuityMd: input.continuityMd,
    userInstruction: input.userInstruction,
    languagePack: input.languagePack,
  });

  return {
    messages: result.messages,
    temperature: result.temperature ?? 0.7,
  };
}
