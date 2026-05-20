import { describe, expect, it } from "vitest";
import { Schema } from "@tiptap/pm/model";
import {
  parseCharactersFromMarkdown,
  buildCharacterIndex,
} from "./character-index";

const basicSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
    },
    text: { group: "inline" }
  }
});
import { buildDecorations } from "./character-highlight";

describe("Character Index Parsing and Regex Matching Tests", () => {
  it("parses character names and explicit aliases from Markdown", () => {
    const md = `
# Characters

## Sarah Vance
Aliases: Sarah, Ms. Vance, Vance

## Anh Tú (also: Tú, Master Tú)
Role: Mentor

## John
    `;

    const parsed = parseCharactersFromMarkdown(md);
    expect(parsed).toHaveLength(3);

    const sarah = parsed.find(c => c.name === "Sarah Vance");
    expect(sarah).toBeDefined();
    expect(sarah?.aliases).toContain("Sarah Vance");
    expect(sarah?.aliases).toContain("Sarah");
    expect(sarah?.aliases).toContain("Ms. Vance");
    expect(sarah?.aliases).toContain("Vance");

    const tu = parsed.find(c => c.name === "Anh Tú");
    expect(tu).toBeDefined();
    expect(tu?.aliases).toContain("Anh Tú");
    expect(tu?.aliases).toContain("Tú");
    expect(tu?.aliases).toContain("Master Tú");

    const john = parsed.find(c => c.name === "John");
    expect(john).toBeDefined();
    expect(john?.aliases).toEqual(["John"]);
  });

  it("builds the index and compiles a Unicode-safe regular expression", () => {
    const characters = [
      { name: "Sarah Vance", aliases: ["Sarah Vance", "Sarah", "Ms. Vance"] },
      { name: "Anh Tú", aliases: ["Anh Tú", "Tú"] },
    ];

    const index = buildCharacterIndex(characters);
    expect(index.regex).toBeDefined();

    const lookupVance = index.lookup.get("sarah vance");
    expect(lookupVance?.canonicalName).toBe("Sarah Vance");

    const lookupTu = index.lookup.get("tú");
    expect(lookupTu?.canonicalName).toBe("Anh Tú");
  });

  it("prioritizes longer aliases first to avoid overlapping sub-matches", () => {
    const characters = [
      { name: "Sarah", aliases: ["Sarah"] },
      { name: "Sarah Vance", aliases: ["Sarah Vance"] },
    ];

    const index = buildCharacterIndex(characters);
    expect(index.regex).toBeDefined();

    // The regex source pattern must list "Sarah Vance" before "Sarah"
    const source = index.regex!.source;
    const vancePos = source.indexOf("Sarah\\ Vance");
    const sarahPos = source.indexOf("Sarah");
    expect(vancePos).toBeLessThan(sarahPos);
  });

  it("supports Unicode boundary lookarounds for Vietnamese without matching sub-syllables", () => {
    const characters = [
      { name: "Anh Tú", aliases: ["Anh Tú", "Tú"] },
    ];
    const index = buildCharacterIndex(characters);
    const regex = index.regex!;

    // "Tú" must match in these cases
    expect("Tú".match(regex)).toBeTruthy();
    expect("Anh Tú".match(regex)).toBeTruthy();
    expect("gặp Tú ở đây".match(regex)).toBeTruthy();

    // "Tú" must NOT match inside "Túy" or "Túi" or other longer words
    regex.lastIndex = 0;
    expect("Túy".match(regex)).toBeNull();
    expect("Túi".match(regex)).toBeNull();
  });

  it("generates correct ProseMirror inline decorations over text blocks", () => {
    const characters = [
      { name: "Sarah Vance", aliases: ["Sarah Vance", "Sarah"] },
      { name: "Anh Tú", aliases: ["Anh Tú", "Tú"] },
    ];
    const index = buildCharacterIndex(characters);

    // Create a mock ProseMirror paragraph node
    const doc = basicSchema.node("doc", null, [
      basicSchema.node("paragraph", null, [
        basicSchema.text("Sarah met with Anh Tú at Annapolis."),
      ]),
    ]);

    const decoSet = buildDecorations(doc, index);
    const decorations = decoSet.find();

    expect(decorations).toHaveLength(2);

    // First decoration is "Sarah" (starts at index 1 in ProseMirror node offset)
    const sarahDeco = decorations[0];
    expect(sarahDeco.from).toBe(1); // "S" is at position 1 (0 is paragraph start)
    expect(sarahDeco.to).toBe(6);   // "Sarah" length is 5
    expect(sarahDeco.spec.charName).toBe("Sarah Vance");

    // Second decoration is "Anh Tú"
    const tuDeco = decorations[1];
    expect(tuDeco.from).toBe(16); // offset check
    expect(tuDeco.spec.charName).toBe("Anh Tú");
  });
});
