import { describe, expect, it } from "vitest";
import { migrateFromMarkdown } from "./migrateFromMarkdown";

describe("migrateFromMarkdown tests", () => {
  it("parses character list from Markdown correctly into structured CharactersDocument", () => {
    const md = `
# Characters

## Sarah Vance (also: Sarah, Ms. Vance)
Pronouns: she/her
Role: protagonist
Age: early 30s
Status: alive
Highlight Color: #0000ff

### Appearance
Scarred ex-sailor, distant, calculates before she speaks.

### Traits
- stoic
- stubborn
- loyal

### Relationships
- **Anh Tú** (mentor): Taught her navigation.
- **John** (former lover)

### Secrets
- Fear of open ocean
- Drafted at fifteen

### Important Facts
- Lost her left eye in the war.

### Evidence
- [Chapter: 3] "Sarah stared at the sea."
    `;

    const doc = migrateFromMarkdown(md);
    expect(doc.schemaVersion).toBe(1);
    expect(doc.characters).toHaveLength(1);

    const sarah = doc.characters[0];
    expect(sarah.name).toBe("Sarah Vance");
    expect(sarah.aliases).toContain("Sarah Vance");
    expect(sarah.aliases).toContain("Sarah");
    expect(sarah.aliases).toContain("Ms. Vance");
    expect(sarah.pronouns).toBe("she/her");
    expect(sarah.role).toBe("protagonist");
    expect(sarah.age).toBe("early 30s");
    expect(sarah.status).toBe("alive");
    expect(sarah.tintHex).toBe("#0000ff");
    expect(sarah.appearance).toBe(
      "Scarred ex-sailor, distant, calculates before she speaks."
    );
    expect(sarah.traits).toEqual(["stoic", "stubborn", "loyal"]);
    expect(sarah.relationships).toHaveLength(2);
    expect(sarah.relationships[0].targetName).toBe("Anh Tú");
    expect(sarah.relationships[0].label).toBe("mentor");
    expect(sarah.relationships[0].notes).toBe("Taught her navigation.");
    expect(sarah.relationships[1].targetName).toBe("John");
    expect(sarah.relationships[1].label).toBe("former lover");
    expect(sarah.relationships[1].notes).toBeUndefined();

    expect(sarah.secrets).toEqual(["Fear of open ocean", "Drafted at fifteen"]);
    expect(sarah.importantFacts).toEqual(["Lost her left eye in the war."]);
    expect(sarah.evidence).toHaveLength(1);
    expect(sarah.evidence![0].chapterId).toBe("3");
    expect(sarah.evidence![0].quote).toBe("Sarah stared at the sea.");
  });

  it("splits slash double-names (name/alias) correctly during migration", () => {
    const md = `
# Characters

## Lolita/Dolly
Role: protagonist
    `;
    const doc = migrateFromMarkdown(md);
    expect(doc.characters).toHaveLength(1);
    const lolita = doc.characters[0];
    expect(lolita.name).toBe("Lolita");
    expect(lolita.aliases).toContain("Lolita");
    expect(lolita.aliases).toContain("Dolly");
  });
});
