export type Chapter = {
  id: string;
  title: string;
  content: string;
};

export type ProjectAiConfig = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
};

export type NovelProject = {
  id: string;
  title: string;
  chapters: Chapter[];
  ai?: ProjectAiConfig;
  projectMd: string;     // Story Control: Project.md
  styleMd: string;       // Story Control: Style.md
  charactersMd: string;  // Story Control: Characters.md
  continuityMd: string;  // Continuity: Continuity.md
};

export type NovelProjectV2 = {
  id: string;
  title: string;
  chapters: Chapter[];
  ai?: ProjectAiConfig;
  genre?: string;
  povAndTense?: string;
  styleNotes?: string;
};

export const NOVEL_STORAGE_VERSION = 3 as const;

export type NovelStorageDocument = {
  version: typeof NOVEL_STORAGE_VERSION;
  updatedAt: number;
  projects: NovelProject[];
  activeProjectId?: string | null;
  activeChapterId?: string | null;
};

export type NovelStorageDocumentV2 = {
  version: 2;
  updatedAt: number;
  projects: NovelProjectV2[];
  activeProjectId?: string | null;
  activeChapterId?: string | null;
};

export type NovelStorageDocumentV1 = {
  version: 1;
  updatedAt: number;
  chapters: Chapter[];
  activeChapterId?: string | null;
};

export type NovelwriteManifest = {
  app: "novelwrite";
  schemaVersion: number;
  title: string;
  language: string;
  activeArtifact?: string;
  createdAt: string;
  updatedAt: string;
  files: {
    project: string;
    style: string;
    characters: string;
    charactersJson?: string; // canonical source
    continuity: string;
    artifactsDir: string;
  };
};

export type { Character, CharactersDocument } from "../characters/characterSchema";

