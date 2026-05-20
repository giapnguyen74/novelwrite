import { describe, expect, it } from "vitest";

function getPriorWords(fullText: string, selectionText: string, wordCount: number): string {
  if (!selectionText || !fullText) return "";
  const index = fullText.indexOf(selectionText);
  if (index === -1) return "";

  const beforeText = fullText.slice(0, index);
  const words = beforeText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordCount) return beforeText;

  return "..." + words.slice(-wordCount).join(" ");
}

function getFollowingWords(fullText: string, selectionText: string, wordCount: number): string {
  if (!selectionText || !fullText) return "";
  const index = fullText.indexOf(selectionText);
  if (index === -1) return "";

  const afterText = fullText.slice(index + selectionText.length);
  const words = afterText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordCount) return afterText;

  return words.slice(0, wordCount).join(" ") + "...";
}

describe("Prose Slicing Tokenizer", () => {
  const sampleProse = "The quick brown fox jumps over the lazy dog. A swift wind blew through the tall green trees, shaking the branches.";

  it("extracts preceding words within bounds", () => {
    const prior = getPriorWords(sampleProse, "fox jumps", 2);
    expect(prior).toBe("...quick brown");
  });

  it("returns full preceding text if count is larger than preceding words", () => {
    const prior = getPriorWords(sampleProse, "fox jumps", 100);
    expect(prior).toBe("The quick brown ");
  });

  it("extracts following words within bounds", () => {
    const following = getFollowingWords(sampleProse, "fox jumps", 4);
    expect(following).toBe("over the lazy dog....");
  });

  it("returns full following text if count is larger than following words", () => {
    const following = getFollowingWords(sampleProse, "fox jumps", 100);
    expect(following).toBe(" over the lazy dog. A swift wind blew through the tall green trees, shaking the branches.");
  });

  it("handles missing target selection gracefully", () => {
    const prior = getPriorWords(sampleProse, "unicorn", 5);
    const following = getFollowingWords(sampleProse, "unicorn", 5);
    expect(prior).toBe("");
    expect(following).toBe("");
  });
});
