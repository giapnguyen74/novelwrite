import { CharactersDocument } from "./characterSchema";

export function renderCharactersMarkdown(doc: CharactersDocument): string {
  let md = "# Characters\n\n";

  // Sort characters by name to keep rendering completely deterministic
  const sortedCharacters = [...doc.characters].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const char of sortedCharacters) {
    md += `## ${char.name}\n`;
    const extraAliases = char.aliases.filter(
      a => a.toLowerCase().trim() !== char.name.toLowerCase().trim()
    );
    if (extraAliases.length > 0) {
      md += `Aliases: ${extraAliases.join(", ")}\n`;
    }
    if (char.pronouns) {
      md += `Pronouns: ${char.pronouns}\n`;
    }
    if (char.role) {
      md += `Role: ${char.role}\n`;
    }
    if (char.status) {
      md += `Status: ${char.status}\n`;
    }
    if (char.age) {
      md += `Age: ${char.age}\n`;
    }
    if (char.tintHex) {
      md += `Highlight Color: ${char.tintHex}\n`;
    }
    md += "\n";

    if (char.appearance) {
      md += `### Appearance\n${char.appearance}\n\n`;
    }
    if (char.voice) {
      md += `### Voice\n${char.voice}\n\n`;
    }
    if (char.design) {
      md += `### Design\n${char.design}\n\n`;
    }
    if (char.traits && char.traits.length > 0) {
      md += `### Traits\n${char.traits.map(t => `- ${t}`).join("\n")}\n\n`;
    }
    if (char.relationships && char.relationships.length > 0) {
      md += `### Relationships\n${char.relationships
        .map(
          r =>
            `- **${r.targetName}** (${r.label})${r.notes ? `: ${r.notes}` : ""}`
        )
        .join("\n")}\n\n`;
    }
    if (char.secrets && char.secrets.length > 0) {
      md += `### Secrets\n${char.secrets.map(s => `- ${s}`).join("\n")}\n\n`;
    }
    if (char.importantFacts && char.importantFacts.length > 0) {
      md += `### Important Facts\n${char.importantFacts.map(f => `- ${f}`).join("\n")}\n\n`;
    }
    if (char.developmentArc) {
      md += `### Development\n${char.developmentArc}\n\n`;
    }
    if (char.tags && char.tags.length > 0) {
      md += `### Tags\n${char.tags.join(", ")}\n\n`;
    }
    if (char.notes) {
      md += `### Notes\n${char.notes}\n\n`;
    }
    if (char.evidence && char.evidence.length > 0) {
      md += `### Evidence\n${char.evidence
        .map(e => `- [Chapter: ${e.chapterId}] "${e.quote}"`)
        .join("\n")}\n\n`;
    }
  }

  return md.trim() + "\n";
}
