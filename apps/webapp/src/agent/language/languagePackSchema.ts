import { HarnessAction } from "../actions/types";
import enPackJson from "./packs/en.json";
import viPackJson from "./packs/vi.json";

export type ActionPromptTemplate = {
  task: string;
  rules: string;
  outputFormat: string;
};

export type LanguagePack = {
  language: string;
  name: string;

  globalRules: {
    outputLanguage: string;
    preserveRegister?: boolean;
    avoidTranslationese?: boolean;
    preserveSocialPronouns?: boolean;
  };

  registerSchema?: {
    pronounPairs?: string[];
    dialogueParticles?: string[];
    dialectFields?: string[];
  };

  actionPrompts: Record<HarnessAction, ActionPromptTemplate>;
};

export const EN_PACK = enPackJson as LanguagePack;
export const VI_PACK = viPackJson as LanguagePack;

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
] as const;

export function loadLanguagePack(lang: string): LanguagePack {
  if (lang === "vi") return VI_PACK;
  return EN_PACK;
}
