import { describe, expect, it } from "vitest";
import { MemoryProjectStorage } from "./storage/MemoryProjectStorage";
import { writeInitialProjectFiles } from "./project/projectFiles";
import { isNovelwriteProject } from "./project/manifest";
import { loadProjectContext } from "./project/loadProjectContext";
import { runAction } from "./engine/runAction";
import { MockLLMClient } from "./llm/MockLLMClient";
import { applyPatch } from "./engine/applyPatch";

describe("NovelWrite AI Harness Core Engine", () => {
  it("should initialize a new project with standard templates", async () => {
    const storage = new MemoryProjectStorage();
    
    const manifest = await writeInitialProjectFiles(storage, {
      title: "Secrets of the Bayou",
      language: "en",
    });

    expect(manifest.title).toBe("Secrets of the Bayou");
    expect(manifest.language).toBe("en");
    expect(manifest.activeArtifact).toBe("Artifacts/chapter-001.md");

    const isProject = await isNovelwriteProject(storage);
    expect(isProject).toBe(true);

    const projectJsonStr = await storage.readFile("Project.json");
    expect(projectJsonStr).toBeDefined();
    const projectJson = JSON.parse(projectJsonStr || "{}");
    expect(projectJson.title).toBe("Secrets of the Bayou");

    const styleMd = await storage.readFile("Style.md");
    expect(styleMd).toContain("# Style");

    const charactersMd = await storage.readFile("Characters.md");
    expect(charactersMd).toContain("# Characters");

    const continuityMd = await storage.readFile("Continuity.md");
    expect(continuityMd).toContain("# Continuity Memory");

    const activeChapter = await storage.readFile("Artifacts/chapter-001.md");
    expect(activeChapter).toContain("# Chapter 1");
  });

  it("should aggregate context and run a continue_writing action", async () => {
    const storage = new MemoryProjectStorage();
    await writeInitialProjectFiles(storage, {
      title: "Chronicles",
      language: "en",
    });

    const llmClient = new MockLLMClient();
    llmClient.nextResponse = " The dark carriage rattled along the cobblestones.";

    const result = await runAction({
      storage,
      action: "continue_writing",
      userInput: "Add details about the wet street",
      llmClient,
    });

    expect(result.status).toBe("ok");
    expect(result.displayText).toBe("The dark carriage rattled along the cobblestones.");
    expect(result.proposedPatch).toBeDefined();
    expect(result.proposedPatch?.operations[0]).toEqual({
      type: "append_file",
      path: "Artifacts/chapter-001.md",
      content: "The dark carriage rattled along the cobblestones.",
    });

    // Apply the patch
    await applyPatch(storage, result.proposedPatch!);

    // Verify file content mutated
    const chapterContent = await storage.readFile("Artifacts/chapter-001.md");
    expect(chapterContent).toContain("The dark carriage rattled along the cobblestones.");
  });

  it("should aggregate context and run character capture", async () => {
    const storage = new MemoryProjectStorage();
    await writeInitialProjectFiles(storage, {
      title: "Chronicles",
      language: "en",
    });

    const llmClient = new MockLLMClient();
    llmClient.nextResponse = '[{"name": "Arthur", "role": "Protagonist"}]';

    const result = await runAction({
      storage,
      action: "capture_characters",
      userInput: "Extract Arthur",
      selectedText: "Arthur walks into the room with his signature hat.",
      llmClient,
    });

    expect(result.status).toBe("ok");
    expect(result.proposedPatch?.operations).toHaveLength(2);
    
    // First operation: Characters.json
    expect(result.proposedPatch?.operations[0].type).toBe("write_file");
    expect(result.proposedPatch?.operations[0].path).toBe("Characters.json");
    
    // Second operation: Characters.md
    expect(result.proposedPatch?.operations[1].type).toBe("write_file");
    expect(result.proposedPatch?.operations[1].path).toBe("Characters.md");
    expect(result.proposedPatch?.operations[1].content).toContain("## Arthur");
    expect(result.proposedPatch?.operations[1].content).toContain("Role: Protagonist");
  });

  it("should support token streaming when streamGenerate is available", async () => {
    const storage = new MemoryProjectStorage();
    await writeInitialProjectFiles(storage, {
      title: "Streaming Chronicles",
      language: "en",
    });

    const llmClient = new MockLLMClient();
    llmClient.nextResponse = "First token second token.";

    const tokens: string[] = [];
    const result = await runAction({
      storage,
      action: "continue_writing",
      userInput: "Stream details",
      llmClient,
      onToken: (chunk) => {
        tokens.push(chunk);
      },
    });

    expect(result.status).toBe("ok");
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join("")).toBe("First token second token.");
  });
});
