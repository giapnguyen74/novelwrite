import { describe, expect, it } from "vitest";
import { MemoryProjectStorage } from "../storage/MemoryProjectStorage";
import { compileBook } from "./compile";
import { buildDocxDocument } from "./toDocx";
import * as docx from "docx";

describe("book compiled export tests", () => {
  it("should compile chapters in outline order and respect export options", async () => {
    const storage = new MemoryProjectStorage();

    // 1. Setup mock project structure
    await storage.writeFile(
      "Novelwrite.json",
      JSON.stringify({
        app: "novelwrite",
        schemaVersion: 1,
        title: "Original Title",
        language: "en",
        files: {
          project: "Project.json",
          style: "Style.md",
          characters: "Characters.md",
          continuity: "Continuity.md",
          artifactsDir: "Artifacts",
        },
      })
    );

    await storage.writeFile(
      "Project.json",
      JSON.stringify({
        title: "Test Novel",
        author: "Jane Doe",
      })
    );

    await storage.writeFile(
      "Artifacts/chapter-002.md",
      `# Second Chapter\n\nBegin your writing here...\n\nFirst paragraph.\n\nSecond paragraph.`
    );

    await storage.writeFile(
      "Artifacts/chapter-001.md",
      `# First Chapter\n\nThis is **bold** text and -- em-dash text.`
    );

    // 2. Compile book with options
    const book = await compileBook(storage, {
      stripPlaceholders: true,
      includeChapterNumbers: true,
      includeSceneDividers: true,
      dedication: "For the tests.",
    });

    // 3. Assertions on compiled contents
    expect(book.title).toBe("Test Novel");
    expect(book.author).toBe("Jane Doe");
    expect(book.dedication).toBe("For the tests.");
    expect(book.chapters.length).toBe(2);

    // Sorted by path alphabetical order: chapter-001 comes before chapter-002
    expect(book.chapters[0].title).toBe("Chapter 1: First Chapter");
    expect(book.chapters[0].markdown).toContain("bold");
    expect(book.chapters[0].markdown).toContain("-- em-dash"); // Raw MD remains unchanged

    expect(book.chapters[1].title).toBe("Chapter 2: Second Chapter");
    expect(book.chapters[1].markdown).not.toContain("Begin your writing here..."); // stripped
    expect(book.chapters[1].markdown).toContain("* * *"); // scene break injected because of double newlines

    // 4. Verify DOCX build works without throwing
    const doc = buildDocxDocument(book);
    expect(doc).toBeInstanceOf(docx.Document);
  });
});
