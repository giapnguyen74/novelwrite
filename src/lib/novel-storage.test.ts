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
  it("parses legacy array format", () => {
    const raw = JSON.stringify([
      { id: "a", title: "One", content: "# Hi" },
    ]);
    const r = parseStoredNovel(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.chapters).toHaveLength(1);
    expect(r.data.chapters[0].id).toBe("a");
    expect(r.data.activeChapterId).toBe("a");
    expect(r.data.version).toBe(1);
  });
  it("parses versioned document", () => {
    const doc = buildDocument(
      [{ id: "b", title: "Two", content: "" }],
      "b"
    );
    doc.updatedAt = 123;
    const r = parseStoredNovel(serializeDocument(doc));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.updatedAt).toBe(123);
    expect(r.data.activeChapterId).toBe("b");
  });
  it("rejects invalid chapter in array", () => {
    const raw = JSON.stringify([{ id: 1, title: "x", content: "y" }]);
    expect(parseStoredNovel(raw).ok).toBe(false);
  });
  it("rejects unknown version", () => {
    const raw = JSON.stringify({
      version: 99,
      updatedAt: 1,
      chapters: [{ id: "1", title: "", content: "" }],
    });
    expect(parseStoredNovel(raw).ok).toBe(false);
  });
});
