import type { Chapter, NovelStorageDocument } from "@/types/novel";
import { NOVEL_STORAGE_VERSION } from "@/types/novel";

export const NOVEL_STORAGE_KEY = "novelwrite-chapters";

export type ParseFailureReason =
  | "empty"
  | "invalid_json"
  | "invalid_shape"
  | "invalid_chapters"
  | "unknown_version";

export type ParseResult =
  | { ok: true; data: NovelStorageDocument }
  | { ok: false; reason: ParseFailureReason };

export function isChapter(value: unknown): value is Chapter {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string"
  );
}

function normalizeActiveId(
  chapters: Chapter[],
  raw: unknown
): string | null {
  if (typeof raw === "string" && chapters.some((c) => c.id === raw)) {
    return raw;
  }
  if (raw === null) return null;
  return chapters[0]?.id ?? null;
}

/** Migrate legacy payload: raw JSON array of chapters. */
function fromLegacyArray(parsed: unknown[]): NovelStorageDocument | null {
  if (!parsed.every(isChapter)) return null;
  return {
    version: NOVEL_STORAGE_VERSION,
    updatedAt: Date.now(),
    chapters: parsed,
    activeChapterId: parsed[0]?.id ?? null,
  };
}

export function parseStoredNovel(raw: string | null): ParseResult {
  if (raw == null || raw.trim() === "") {
    return { ok: false, reason: "empty" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  if (Array.isArray(parsed)) {
    const doc = fromLegacyArray(parsed);
    if (!doc) return { ok: false, reason: "invalid_chapters" };
    return { ok: true, data: doc };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "invalid_shape" };
  }

  const o = parsed as Record<string, unknown>;
  if (o.version !== NOVEL_STORAGE_VERSION) {
    return { ok: false, reason: "unknown_version" };
  }
  if (!Array.isArray(o.chapters)) {
    return { ok: false, reason: "invalid_shape" };
  }
  if (!o.chapters.every(isChapter)) {
    return { ok: false, reason: "invalid_chapters" };
  }

  const chapters = o.chapters as Chapter[];
  const updatedAt =
    typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt)
      ? o.updatedAt
      : Date.now();

  return {
    ok: true,
    data: {
      version: NOVEL_STORAGE_VERSION,
      updatedAt,
      chapters,
      activeChapterId: normalizeActiveId(chapters, o.activeChapterId),
    },
  };
}

export function buildDocument(
  chapters: Chapter[],
  activeChapterId: string | null
): NovelStorageDocument {
  return {
    version: NOVEL_STORAGE_VERSION,
    updatedAt: Date.now(),
    chapters,
    activeChapterId,
  };
}

export function serializeDocument(doc: NovelStorageDocument): string {
  return JSON.stringify(doc);
}

export function createInitialChapters(): Chapter[] {
  return [{ id: Date.now().toString(), title: "Chapter 1", content: "" }];
}
