import { describe, expect, it } from "vitest";
import { mergeCharacters } from "./mergeCharacters";
import { Character, createDefaultCharacter } from "./characterSchema";

describe("mergeCharacters tests", () => {
  it("idempotently merges incoming characters into existing characters", () => {
    const existing: Character[] = [
      {
        ...createDefaultCharacter("Sarah Vance"),
        id: "sarah-1",
        aliases: ["Sarah Vance", "Sarah"],
        traits: ["stoic", "stubborn"],
        role: "protagonist",
        secrets: ["Fear of open ocean"],
        importantFacts: ["Lost her left eye in the war"],
        evidence: [
          {
            chapterId: "ch-1",
            quote: "Sarah stared at the sea.",
            addedAt: 1000,
          },
        ],
      },
    ];

    const incoming: Character[] = [
      {
        ...createDefaultCharacter("Sarah Vance"),
        aliases: ["Sarah Vance", "Vance"],
        traits: ["stoic", "loyal"],
        role: "hero", // should not overwrite existing protagonist role
        secrets: ["Fear of open ocean", "Drafted at fifteen"], // draft at fifteen is new
        importantFacts: ["Lost her left eye in the war", "Excellent chess player"],
        evidence: [
          {
            chapterId: "ch-1",
            quote: "Sarah stared at the sea.", // duplicate, should not add
            addedAt: 2000,
          },
          {
            chapterId: "ch-2",
            quote: "Vance smiled warmly.", // new evidence, should be added
            addedAt: 2500,
          },
        ],
      },
      {
        ...createDefaultCharacter("Anh Tú"),
        aliases: ["Anh Tú", "Tú"],
        traits: ["wise"],
      },
    ];

    const result = mergeCharacters(existing, incoming);

    expect(result).toHaveLength(2);

    const sarah = result.find(c => c.id === "sarah-1")!;
    expect(sarah).toBeDefined();
    // aliases must be unified: Sarah Vance, Sarah, Vance
    expect(sarah.aliases).toEqual(["Sarah Vance", "Sarah", "Vance"]);
    // traits: stoic, stubborn, loyal
    expect(sarah.traits).toEqual(["stoic", "stubborn", "loyal"]);
    // role: should remain protagonist
    expect(sarah.role).toBe("protagonist");
    // secrets: unified
    expect(sarah.secrets).toEqual(["Fear of open ocean", "Drafted at fifteen"]);
    // importantFacts: unified
    expect(sarah.importantFacts).toEqual([
      "Lost her left eye in the war",
      "Excellent chess player",
    ]);
    // evidence: duplicates removed
    expect(sarah.evidence).toHaveLength(2);
    expect(sarah.evidence![0].quote).toBe("Sarah stared at the sea.");
    expect(sarah.evidence![1].quote).toBe("Vance smiled warmly.");

    const tu = result.find(c => c.name === "Anh Tú")!;
    expect(tu).toBeDefined();
    expect(tu.id).not.toBe("sarah-1");
    expect(tu.aliases).toEqual(["Anh Tú", "Tú"]);
    expect(tu.traits).toEqual(["wise"]);
  });

  it("normalizes slash-separated names (name/alias) during merge", () => {
    const existing: Character[] = [
      {
        ...createDefaultCharacter("Lolita"),
        id: "l-1",
        aliases: ["Lolita"],
        traits: ["rebellious"],
      },
    ];
    const incoming: Character[] = [
      {
        ...createDefaultCharacter("Lolita/Dolly"),
        aliases: ["Lolita/Dolly"],
        traits: ["clever"],
      },
    ];
    const result = mergeCharacters(existing, incoming);
    expect(result).toHaveLength(1);
    const lolita = result[0];
    expect(lolita.name).toBe("Lolita");
    expect(lolita.aliases).toContain("Lolita");
    expect(lolita.aliases).toContain("Dolly");
    expect(lolita.traits).toEqual(["rebellious", "clever"]);
  });
});
