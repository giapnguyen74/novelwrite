import {
  Character,
  CharactersDocument,
  createDefaultCharacter,
} from "./characterSchema";

export function migrateFromMarkdown(md: string): CharactersDocument {
  const characters: Character[] = [];
  if (!md) {
    return { schemaVersion: 1, characters };
  }

  // Split by ## headers (characters)
  // Look for either \n## or start of string ##
  const sections = md.split(/(?:^|\r?\n)##\s+/);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    // The first section might be "# Characters" intro if it doesn't contain character content
    if (i === 0 && !md.startsWith("##")) {
      continue;
    }

    // Parse individual character section
    const lines = section.split(/\r?\n/);
    if (lines.length === 0) continue;

    // The first line is the name
    let name = lines[0].trim();
    if (!name) continue;

    // Check if there is inline alias like "Sarah Vance (also: Sarah, Ms. Vance)"
    let inlineAliases: string[] = [];
    const aliasInlineMatch = name.match(/^([^(]+)\s+\((?:also|aliases):\s*([^)]+)\)$/i);
    if (aliasInlineMatch) {
      name = aliasInlineMatch[1].trim();
      inlineAliases = aliasInlineMatch[2]
        .split(",")
        .map(a => a.trim())
        .filter(Boolean);
    }

    // Check if there is a slash double-name representation (name + alias)
    if (name.includes("/")) {
      const parts = name.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        name = parts[0];
        inlineAliases = Array.from(new Set([...inlineAliases, ...parts.slice(1)]));
      }
    }

    const char = createDefaultCharacter(name);
    char.aliases = Array.from(new Set([name, ...inlineAliases]));

    // Split the rest of the content by subheading `###`
    const restContent = lines.slice(1).join("\n");
    const subSections = restContent.split(/(?:^|\r?\n)###\s+/);

    // The first subSection is the properties directly under `## Name`
    const rootProperties = subSections[0];
    parseRootProperties(rootProperties, char);

    // Parse subsequent `### ` subheadings
    for (let j = 1; j < subSections.length; j++) {
      const subSec = subSections[j].trim();
      if (!subSec) continue;

      const subLines = subSec.split(/\r?\n/);
      const subHeader = subLines[0].trim().toLowerCase();
      const subBody = subLines.slice(1).join("\n").trim();

      switch (subHeader) {
        case "aliases":
        case "also": {
          const parsed = parseListOrBullets(subBody);
          char.aliases = Array.from(new Set([...char.aliases, ...parsed]));
          break;
        }
        case "role":
          char.role = subBody;
          break;
        case "pronouns":
          char.pronouns = subBody;
          break;
        case "status":
          char.status = subBody;
          break;
        case "age":
          char.age = subBody;
          break;
        case "appearance":
          char.appearance = subBody;
          break;
        case "voice":
          char.voice = subBody;
          break;
        case "design":
          char.design = subBody;
          break;
        case "traits":
          char.traits = parseListOrBullets(subBody);
          break;
        case "secrets":
          char.secrets = parseBullets(subBody);
          break;
        case "important facts":
        case "importantfacts":
          char.importantFacts = parseBullets(subBody);
          break;
        case "development":
        case "developmentarc":
          char.developmentArc = subBody;
          break;
        case "tags":
          char.tags = parseListOrBullets(subBody);
          break;
        case "evidence":
          char.evidence = parseEvidence(subBody);
          break;
        case "relationships":
          char.relationships = parseRelationships(subBody);
          break;
        default:
          // Unrecognized subheading lands in notes
          if (char.notes) {
            char.notes += `\n\n### ${subLines[0].trim()}\n${subBody}`;
          } else {
            char.notes = `### ${subLines[0].trim()}\n${subBody}`;
          }
          break;
      }
    }

    // Filter out single-letter aliases
    char.aliases = char.aliases.filter(a => a.length > 1);

    characters.push(char);
  }

  return { schemaVersion: 1, characters };
}

function parseRootProperties(content: string, char: Character) {
  if (!content) return;
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check key-value pairs
    const match = trimmed.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();

      switch (key) {
        case "aliases":
        case "also": {
          const parsed = val
            .split(",")
            .map(a => a.trim())
            .filter(Boolean);
          char.aliases = Array.from(new Set([...char.aliases, ...parsed]));
          break;
        }
        case "pronouns":
          char.pronouns = val;
          break;
        case "role":
          char.role = val;
          break;
        case "status":
          char.status = val;
          break;
        case "age":
          char.age = val;
          break;
        case "highlight color":
        case "tintcolor":
        case "tinthex":
          char.tintHex = val;
          break;
      }
    } else {
      // Loose text under ## Name lands in appearance if empty, otherwise notes
      if (!char.appearance) {
        char.appearance = trimmed;
      } else {
        char.notes = char.notes ? char.notes + "\n" + trimmed : trimmed;
      }
    }
  }
}

function parseListOrBullets(content: string): string[] {
  if (!content) return [];
  if (content.includes("\n")) {
    return parseBullets(content);
  }
  return content
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function parseBullets(content: string): string[] {
  if (!content) return [];
  return content
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim();
      // Match bullet points like - item, * item, 1. item
      const bulletMatch = trimmed.match(/^(?:[-*+]\s+|\d+\.\s+)(.+)$/);
      return bulletMatch ? bulletMatch[1].trim() : trimmed;
    })
    .filter(Boolean);
}

function parseEvidence(
  content: string
): Array<{ chapterId: string; quote: string; addedAt: number }> {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const evidence: Array<{ chapterId: string; quote: string; addedAt: number }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match - [Chapter: ch-id] "quote"
    const match = trimmed.match(
      /^(?:[-*+]\s+)?\[Chapter:\s*([^\]]+)\]\s*["'«“](.+)["'»”]$/i
    );
    if (match) {
      evidence.push({
        chapterId: match[1].trim(),
        quote: match[2].trim(),
        addedAt: Date.now(),
      });
    }
  }
  return evidence;
}

function parseRelationships(
  content: string
): Array<{ targetId?: string; targetName: string; label: string; notes?: string }> {
  if (!content) return [];
  const lines = content.split(/\r?\n/);
  const relationships: Array<{
    targetId?: string;
    targetName: string;
    label: string;
    notes?: string;
  }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match bullets like: - **Name** (label): notes
    // Or: - Name (label): notes
    const match = trimmed.match(
      /^(?:[-*+]\s+)?(?:\*\*)?([^*(-]+)(?:\*\*)?\s*\(([^)]+)\)(?::\s*(.+))?$/
    );
    if (match) {
      relationships.push({
        targetName: match[1].trim(),
        label: match[2].trim(),
        notes: match[3] ? match[3].trim() : undefined,
      });
    }
  }
  return relationships;
}
