export type Chapter = {
  id: string;
  title: string;
  content: string;
};

export const NOVEL_STORAGE_VERSION = 1 as const;

export type NovelStorageDocument = {
  version: typeof NOVEL_STORAGE_VERSION;
  updatedAt: number;
  chapters: Chapter[];
  activeChapterId?: string | null;
};
