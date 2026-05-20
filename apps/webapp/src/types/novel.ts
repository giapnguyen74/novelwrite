export type Chapter = {
  id: string;
  title: string;
  content: string;
};

export type ProjectAiConfig = {
  /** OpenAI-compatible proxy base URL, without trailing slash. */
  baseUrl: string;

  /** Optional. Many local proxies do not require a key. */
  apiKey?: string;

  /** Model name as understood by the proxy. */
  model: string;

  /** Optional custom headers for gateways such as LiteLLM or private proxies. */
  headers?: Record<string, string>;
};

export type NovelProject = {
  id: string;
  title: string;
  chapters: Chapter[];
  ai?: ProjectAiConfig;
  // Three Context Layers:
  projectMd: string;     // Story Control: Project.md
  styleMd: string;       // Story Control: Style.md
  charactersMd: string;  // Story Control: Characters.md
  continuityMd: string;  // Continuity: hidden .ai/Continuity.md
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

