import type {
  Chapter,
  NovelProject,
  NovelProjectV2,
  NovelStorageDocument,
  NovelStorageDocumentV1,
  NovelStorageDocumentV2,
} from "@/types/novel";
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

/** Migrate legacy payload: raw JSON array of chapters. */
function fromLegacyArray(parsed: unknown[]): NovelStorageDocumentV1 | null {
  if (!parsed.every(isChapter)) return null;
  return {
    version: 1,
    updatedAt: Date.now(),
    chapters: parsed,
    activeChapterId: parsed[0]?.id ?? null,
  };
}

function parseV1(o: Record<string, unknown>): { ok: true; data: NovelStorageDocumentV1 } | { ok: false; reason: ParseFailureReason } {
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
      version: 1,
      updatedAt,
      chapters,
      activeChapterId: typeof o.activeChapterId === "string" ? o.activeChapterId : (chapters[0]?.id ?? null),
    },
  };
}

function parseV2(o: Record<string, unknown>): { ok: true; data: NovelStorageDocumentV2 } | { ok: false; reason: ParseFailureReason } {
  if (!Array.isArray(o.projects)) {
    return { ok: false, reason: "invalid_shape" };
  }

  for (const proj of o.projects) {
    if (!proj || typeof proj !== "object") return { ok: false, reason: "invalid_shape" };
    const p = proj as Record<string, unknown>;
    if (typeof p.id !== "string" || typeof p.title !== "string" || !Array.isArray(p.chapters)) {
      return { ok: false, reason: "invalid_shape" };
    }
    if (!p.chapters.every(isChapter)) {
      return { ok: false, reason: "invalid_chapters" };
    }
  }

  const projects = o.projects as NovelProjectV2[];
  const updatedAt =
    typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt)
      ? o.updatedAt
      : Date.now();

  const activeProjectId = typeof o.activeProjectId === "string" ? o.activeProjectId : (projects[0]?.id ?? null);
  const activeChapterId = typeof o.activeChapterId === "string" ? o.activeChapterId : null;

  return {
    ok: true,
    data: {
      version: 2,
      updatedAt,
      projects,
      activeProjectId,
      activeChapterId,
    },
  };
}

export function createDefaultProjectMd(title: string, genre: string = "", povAndTense: string = ""): string {
  return `# Project

## Title
${title || "Untitled Project"}

## Language
English

## Genre
${genre || ""}

## Target Audience


## POV
${povAndTense || ""}

## Tense


## Tone


## Premise


## Main Conflict


## Themes


## Content Boundaries


## Author Preferences


## Do Not Do
- `;
}

export function createDefaultStyleMd(styleNotes: string = ""): string {
  return `# Style

## Style Summary
${styleNotes || ""}

## Sentence Rhythm


## Description Style


## Dialogue Style


## Emotional Style


## Pacing


## Preferred Techniques


## Avoid


## Reference Influences


## Extracted Voice Notes


## Sample Passage
`;
}

export function createDefaultCharactersMd(): string {
  return `# Characters

## Character Name

### Role

### Current Status

### Personality

### Voice / Speech Pattern

### Core Desire

### Core Fear

### Relationships

### Secrets

### Important Facts

### Development So Far
`;
}

export function createDefaultContinuityMd(): string {
  return `# Continuity Memory

## Full Story Summary

## Chapter Summaries

## Timeline

## Plot Progress

## Confirmed Facts

## Character State Changes

## Relationship Changes

## World / Setting Facts

## Open Questions

## Unresolved Threads

## Continuity Risks
`;
}

function migrateV1toV2(docV1: NovelStorageDocumentV1): NovelStorageDocumentV2 {
  return {
    version: 2,
    updatedAt: docV1.updatedAt,
    projects: [
      {
        id: "default-project",
        title: "My First Project",
        chapters: docV1.chapters,
      },
    ],
    activeProjectId: "default-project",
    activeChapterId: docV1.activeChapterId ?? docV1.chapters[0]?.id ?? null,
  };
}

function migrateV2toV3(docV2: NovelStorageDocumentV2): NovelStorageDocument {
  const projectsV3 = docV2.projects.map((p) => {
    return {
      id: p.id,
      title: p.title,
      chapters: p.chapters,
      ai: p.ai,
      projectMd: createDefaultProjectMd(p.title, p.genre, p.povAndTense),
      styleMd: createDefaultStyleMd(p.styleNotes),
      charactersMd: createDefaultCharactersMd(),
      continuityMd: createDefaultContinuityMd(),
    };
  });

  return {
    version: 3,
    updatedAt: docV2.updatedAt,
    projects: projectsV3,
    activeProjectId: docV2.activeProjectId ?? projectsV3[0]?.id ?? null,
    activeChapterId: docV2.activeChapterId ?? null,
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
    const docV1 = fromLegacyArray(parsed);
    if (!docV1) return { ok: false, reason: "invalid_chapters" };
    return { ok: true, data: migrateV2toV3(migrateV1toV2(docV1)) };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "invalid_shape" };
  }

  const o = parsed as Record<string, unknown>;

  if (o.version === 1) {
    const v1Result = parseV1(o);
    if (!v1Result.ok) return v1Result;
    return { ok: true, data: migrateV2toV3(migrateV1toV2(v1Result.data)) };
  }

  if (o.version === 2) {
    const v2Result = parseV2(o);
    if (!v2Result.ok) return v2Result;
    return { ok: true, data: migrateV2toV3(v2Result.data) };
  }

  if (o.version !== NOVEL_STORAGE_VERSION) {
    return { ok: false, reason: "unknown_version" };
  }

  if (!Array.isArray(o.projects)) {
    return { ok: false, reason: "invalid_shape" };
  }

  for (const proj of o.projects) {
    if (!proj || typeof proj !== "object") return { ok: false, reason: "invalid_shape" };
    const p = proj as Record<string, unknown>;
    if (
      typeof p.id !== "string" ||
      typeof p.title !== "string" ||
      !Array.isArray(p.chapters) ||
      typeof p.projectMd !== "string" ||
      typeof p.styleMd !== "string" ||
      typeof p.charactersMd !== "string" ||
      typeof p.continuityMd !== "string"
    ) {
      return { ok: false, reason: "invalid_shape" };
    }
    if (!p.chapters.every(isChapter)) {
      return { ok: false, reason: "invalid_chapters" };
    }
  }

  const projects = o.projects as NovelProject[];
  const updatedAt =
    typeof o.updatedAt === "number" && Number.isFinite(o.updatedAt)
      ? o.updatedAt
      : Date.now();

  const activeProjectId = typeof o.activeProjectId === "string" ? o.activeProjectId : (projects[0]?.id ?? null);
  const activeChapterId = typeof o.activeChapterId === "string" ? o.activeChapterId : null;

  return {
    ok: true,
    data: {
      version: NOVEL_STORAGE_VERSION,
      updatedAt,
      projects,
      activeProjectId,
      activeChapterId,
    },
  };
}

export function buildDocument(
  projects: NovelProject[],
  activeProjectId: string | null,
  activeChapterId: string | null
): NovelStorageDocument {
  return {
    version: NOVEL_STORAGE_VERSION,
    updatedAt: Date.now(),
    projects,
    activeProjectId,
    activeChapterId,
  };
}

export function serializeDocument(doc: NovelStorageDocument): string {
  return JSON.stringify(doc);
}

export function createInitialChapters(): Chapter[] {
  return [{ id: Date.now().toString(), title: "Chapter 1", content: "" }];
}

export function createInitialProjects(): NovelProject[] {
  return [
    {
      id: "default-project",
      title: "My First Project",
      chapters: createInitialChapters(),
      projectMd: createDefaultProjectMd("My First Project"),
      styleMd: createDefaultStyleMd(),
      charactersMd: createDefaultCharactersMd(),
      continuityMd: createDefaultContinuityMd(),
    },
  ];
}
