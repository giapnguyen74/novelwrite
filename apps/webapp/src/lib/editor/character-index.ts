export type CharacterEntry = {
  name: string;
  aliases: string[];
};

export type CharacterIndex = {
  regex: RegExp | null;
  lookup: Map<string, { name: string; canonicalName: string }>;
};

/**
 * Fallback: parse Characters.md headers.
 * Any line of the form `## <name>` or `### <name>` becomes a character.
 * Aliases are extracted from inline tags like `(also: Alias1, Alias2)` or an explicit `Aliases: Alias1, Alias2` line.
 */
export function parseCharactersFromMarkdown(md: string): CharacterEntry[] {
  const characters: CharacterEntry[] = [];
  if (!md) return characters;

  const lines = md.split(/\r?\n/);
  let currentCharacter: CharacterEntry | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Match ## Name or ### Name
    const headerMatch = line.match(/^(?:##|###)\s+(.+)$/);
    if (headerMatch) {
      const headerTitle = headerMatch[1].trim();

      // Skip structural headers
      const lowerTitle = headerTitle.toLowerCase();
      if (
        lowerTitle === "characters" ||
        lowerTitle === "aliases" ||
        lowerTitle === "role" ||
        lowerTitle === "personality" ||
        lowerTitle === "voice / speech pattern" ||
        lowerTitle === "core desire" ||
        lowerTitle === "core fear" ||
        lowerTitle === "relationships" ||
        lowerTitle === "secrets" ||
        lowerTitle === "important facts" ||
        lowerTitle === "development so far"
      ) {
        continue;
      }

      // Check if there is an inline alias like "Sarah Vance (also: Sarah, Ms. Vance)"
      const aliasInlineMatch = headerTitle.match(/^([^(]+)\s+\((?:also|aliases):\s*([^)]+)\)$/i);
      if (aliasInlineMatch) {
        const name = aliasInlineMatch[1].trim();
        const aliases = aliasInlineMatch[2]
          .split(",")
          .map(a => a.trim())
          .filter(Boolean);
        currentCharacter = { name, aliases: [name, ...aliases] };
        characters.push(currentCharacter);
      } else {
        currentCharacter = { name: headerTitle, aliases: [headerTitle] };
        characters.push(currentCharacter);
      }
      continue;
    }

    // Look for aliases block under an active character section
    if (currentCharacter) {
      const aliasLineMatch = line.match(/^(?:[-*]\s+)?(?:aliases|also):\s*(.+)$/i);
      if (aliasLineMatch) {
        const aliases = aliasLineMatch[1]
          .split(",")
          .map(a => a.trim())
          .filter(Boolean);
        for (const alias of aliases) {
          if (!currentCharacter.aliases.includes(alias)) {
            currentCharacter.aliases.push(alias);
          }
        }
      }
    }
  }

  // Deduplicate and filter out single-letter aliases
  return characters.map(c => ({
    name: c.name,
    aliases: Array.from(new Set(c.aliases)).filter(alias => alias.length > 1),
  }));
}

/**
 * Builds a Unicode-safe character index regex.
 * Aliases are sorted descending by length so that longer matches (e.g. "Sarah Vance")
 * take precedence over shorter sub-matches ("Sarah").
 */
export function buildCharacterIndex(characters: CharacterEntry[]): CharacterIndex {
  const lookup = new Map<string, { name: string; canonicalName: string }>();
  const allAliases: string[] = [];

  for (const char of characters) {
    for (const alias of char.aliases) {
      const aliasLower = alias.toLowerCase();
      if (!lookup.has(aliasLower)) {
        lookup.set(aliasLower, { name: char.name, canonicalName: char.name });
      }
      if (!allAliases.includes(alias)) {
        allAliases.push(alias);
      }
    }
  }

  // Sort descending by length so longer aliases match first in the regex alternation
  allAliases.sort((a, b) => b.length - a.length);

  if (allAliases.length === 0) {
    return { regex: null, lookup };
  }

  const escapedAliases = allAliases.map(alias => escapeRegExp(alias));

  // Unicode character class ranges supporting Vietnamese and standard word characters
  const pattern = `(?<![a-zA-Z0-9_À-ỹđĐ])(${escapedAliases.join("|")})(?![a-zA-Z0-9_À-ỹđĐ])`;
  const regex = new RegExp(pattern, "gi");

  return { regex, lookup };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
