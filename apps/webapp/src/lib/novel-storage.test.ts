import { describe, expect, it } from "vitest";
import {
  buildDocument,
  isChapter,
  parseStoredNovel,
  serializeDocument,
} from "./novel-storage";
import type { Chapter } from "@/types/novel";

describe("isChapter", () => {
  it("accepts valid chapter objects", () => {
    const c: Chapter = { id: "1", title: "T", content: "x" };
    expect(isChapter(c)).toBe(true);
  });
  it("rejects missing fields", () => {
    expect(isChapter({ id: "1", title: "T" })).toBe(false);
    expect(isChapter(null)).toBe(false);
  });
});

describe("parseStoredNovel", () => {
  it("returns empty for null", () => {
    expect(parseStoredNovel(null).ok).toBe(false);
  });

  it("parses legacy array format and migrates to V3", () => {
    const raw = JSON.stringify([
      { id: "a", title: "One", content: "# Hi" },
    ]);
    const r = parseStoredNovel(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.projects).toHaveLength(1);
    expect(r.data.projects[0].chapters).toHaveLength(1);
    expect(r.data.projects[0].chapters[0].id).toBe("a");
    expect(r.data.activeChapterId).toBe("a");
    expect(r.data.version).toBe(3);
    expect(r.data.projects[0].projectMd).toContain("My First Project");
    expect(r.data.projects[0].styleMd).toBeDefined();
    expect(r.data.projects[0].charactersMd).toBeDefined();
    expect(r.data.projects[0].continuityMd).toBeDefined();
  });

  it("parses version 1 document and migrates to V3", () => {
    const raw = JSON.stringify({
      version: 1,
      updatedAt: 123,
      chapters: [{ id: "b", title: "Two", content: "" }],
      activeChapterId: "b",
    });
    const r = parseStoredNovel(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.updatedAt).toBe(123);
    expect(r.data.projects[0].chapters[0].id).toBe("b");
    expect(r.data.activeChapterId).toBe("b");
    expect(r.data.version).toBe(3);
  });

  it("parses version 2 document and migrates to V3", () => {
    const raw = JSON.stringify({
      version: 2,
      updatedAt: 123,
      projects: [
        {
          id: "p1",
          title: "Legacy Project",
          chapters: [{ id: "c1", title: "Ch1", content: "" }],
          genre: "Sci-Fi",
          povAndTense: "Third Past",
          styleNotes: "Short sentences",
        },
      ],
      activeProjectId: "p1",
      activeChapterId: "c1",
    });
    const r = parseStoredNovel(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.projects[0].projectMd).toContain("Sci-Fi");
    expect(r.data.projects[0].projectMd).toContain("Third Past");
    expect(r.data.projects[0].styleMd).toContain("Short sentences");
    expect(r.data.version).toBe(3);
  });

  it("parses versioned V3 document", () => {
    const doc = buildDocument(
      [
        {
          id: "default-project",
          title: "My First Project",
          chapters: [{ id: "b", title: "Two", content: "" }],
          projectMd: "Proj",
          styleMd: "Style",
          charactersMd: "Chars",
          continuityMd: "Cont",
        },
      ],
      "default-project",
      "b"
    );
    doc.updatedAt = 123;
    const r = parseStoredNovel(serializeDocument(doc));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.updatedAt).toBe(123);
    expect(r.data.activeChapterId).toBe("b");
    expect(r.data.activeProjectId).toBe("default-project");
    expect(r.data.projects[0].projectMd).toBe("Proj");
  });

  it("rejects invalid chapter in array", () => {
    const raw = JSON.stringify([{ id: 1, title: "x", content: "y" }]);
    expect(parseStoredNovel(raw).ok).toBe(false);
  });

  it("rejects unknown version", () => {
    const raw = JSON.stringify({
      version: 99,
      updatedAt: 1,
      projects: [{ id: "1", title: "", chapters: [] }],
    });
    expect(parseStoredNovel(raw).ok).toBe(false);
  });
});
