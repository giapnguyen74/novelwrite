import { describe, expect, it, vi, afterEach } from "vitest";
import { completeChat } from "./ai-client";
import { runAiFeature } from "./ai-runner";
import { cleanPlainProse } from "@/prompts/output";

describe("cleanPlainProse", () => {
  it("trims whitespace and removes code blocks", () => {
    expect(cleanPlainProse("  ```markdown\nHello world\n```  ")).toBe("Hello world");
    expect(cleanPlainProse("```\nHello\n```")).toBe("Hello");
  });

  it("strips think and thought tags and contents", () => {
    expect(
      cleanPlainProse("<think>Analyzing prose...</think>This is the final text.")
    ).toBe("This is the final text.");
    expect(
      cleanPlainProse("<thought>Thinking process...</thought>\nOnce upon a time.")
    ).toBe("Once upon a time.");
  });

  it("removes common prefix labels", () => {
    expect(cleanPlainProse("rewritten passage: Once upon a time")).toBe("Once upon a time");
    expect(cleanPlainProse("Output: Here is the text")).toBe("Here is the text");
  });

  it("removes assistant chatter", () => {
    expect(cleanPlainProse("Sure! Once upon a time")).toBe("Once upon a time");
    expect(cleanPlainProse("Of course! Once upon a time")).toBe("Once upon a time");
  });

  it("removes enclosing quotes", () => {
    expect(cleanPlainProse('"Once upon a time"')).toBe("Once upon a time");
    expect(cleanPlainProse('“Once upon a time”')).toBe("Once upon a time");
  });
});

describe("completeChat transport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends standard headers and custom headers", async () => {
    const config = {
      baseUrl: "http://localhost:4000/v1",
      apiKey: "test-key",
      model: "test-model",
      headers: { "X-Custom-Header": "value" },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "OK" } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await completeChat(config, {
      model: "test-model",
      messages: [{ role: "user", content: "hi" }],
    });

    expect(res).toBe("OK");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-key",
          "X-Custom-Header": "value",
        }),
      })
    );
  });

  it("handles 401 unauthorized errors", async () => {
    const config = {
      baseUrl: "http://localhost:4000/v1",
      model: "test-model",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      })
    );

    await expect(
      completeChat(config, {
        model: "test-model",
        messages: [],
      })
    ).rejects.toThrow("Check your AI proxy API key.");
  });

  it("falls back to reasoning if content is empty or blank", async () => {
    const config = {
      baseUrl: "http://localhost:4000/v1",
      model: "test-model",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "   ",
                reasoning: "Here is the thinking process content.",
              },
            },
          ],
        }),
      })
    );

    const res = await completeChat(config, {
      model: "test-model",
      messages: [],
    });

    expect(res).toBe("Here is the thinking process content.");
  });
});

describe("runAiFeature spec runner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs registered feature, builds messages, and post-processes response", async () => {
    const config = {
      baseUrl: "http://localhost:4000/v1",
      model: "test-model",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '```markdown\n"Once upon a time"\n```',
              },
            },
          ],
        }),
      })
    );

    const result = await runAiFeature(
      "rewrite",
      {
        selection: "Once upon a time",
        projectMd: "# Project\n",
        styleMd: "# Style\n",
        charactersMd: "# Characters\n",
        continuityMd: "# Continuity\n",
        activeArtifact: "Artifacts/chapter-001.md",
        activeArtifactContent: "Once upon a time",
      },
      config
    );

    expect(result.displayText).toBe("Once upon a time");
  });
});
