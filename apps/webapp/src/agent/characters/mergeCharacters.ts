import { Character, generateCharacterId } from "./characterSchema";

export function mergeCharacters(
  existing: Character[],
  incoming: Character[]
): Character[] {
  const normalizeChar = (char: Character): Character => {
    if (char.name.includes("/")) {
      const parts = char.name.split("/").map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const mainName = parts[0];
        const extraAliases = parts.slice(1);
        const uniqueAliases = Array.from(
          new Set([mainName, ...extraAliases, ...char.aliases])
        );
        return {
          ...char,
          name: mainName,
          aliases: uniqueAliases,
        };
      }
    }
    return char;
  };

  const normalizedExisting = existing.map(normalizeChar);
  const normalizedIncoming = incoming.map(normalizeChar);

  const mergedList = normalizedExisting.map(char => ({
    ...char,
    aliases: [...char.aliases],
    caseSensitiveAliases: char.caseSensitiveAliases ? [...char.caseSensitiveAliases] : [],
    traits: [...char.traits],
    relationships: char.relationships.map(r => ({ ...r })),
    secrets: [...char.secrets],
    importantFacts: [...char.importantFacts],
    tags: [...char.tags],
    evidence: char.evidence ? char.evidence.map(e => ({ ...e })) : [],
  }));

  for (const incomingChar of normalizedIncoming) {
    const incomingNameLower = incomingChar.name.toLowerCase().trim();
    
    // Find index of character with same name (case-insensitive)
    const matchIndex = mergedList.findIndex(
      char => char.name.toLowerCase().trim() === incomingNameLower
    );

    if (matchIndex !== -1) {
      const existingChar = mergedList[matchIndex];

      // Update timestamps
      existingChar.updatedAt = Date.now();

      // Merge simple properties only if existing is empty
      if (!existingChar.pronouns && incomingChar.pronouns) {
        existingChar.pronouns = incomingChar.pronouns;
      }
      if (!existingChar.role && incomingChar.role) {
        existingChar.role = incomingChar.role;
      }
      if (!existingChar.status && incomingChar.status) {
        existingChar.status = incomingChar.status;
      }
      if (!existingChar.age && incomingChar.age) {
        existingChar.age = incomingChar.age;
      }
      if (!existingChar.appearance && incomingChar.appearance) {
        existingChar.appearance = incomingChar.appearance;
      }
      if (!existingChar.voice && incomingChar.voice) {
        existingChar.voice = incomingChar.voice;
      }
      if (!existingChar.design && incomingChar.design) {
        existingChar.design = incomingChar.design;
      }
      if (!existingChar.coreDesire && incomingChar.coreDesire) {
        existingChar.coreDesire = incomingChar.coreDesire;
      }
      if (!existingChar.coreFear && incomingChar.coreFear) {
        existingChar.coreFear = incomingChar.coreFear;
      }
      if (!existingChar.internalConflict && incomingChar.internalConflict) {
        existingChar.internalConflict = incomingChar.internalConflict;
      }
      if (!existingChar.developmentArc && incomingChar.developmentArc) {
        existingChar.developmentArc = incomingChar.developmentArc;
      }
      if (!existingChar.notes && incomingChar.notes) {
        existingChar.notes = incomingChar.notes;
      }
      if (!existingChar.tintHex && incomingChar.tintHex) {
        existingChar.tintHex = incomingChar.tintHex;
      }
      if (!existingChar.firstSeenChapter && incomingChar.firstSeenChapter) {
        existingChar.firstSeenChapter = incomingChar.firstSeenChapter;
      }
      if (!existingChar.lastSeenChapter && incomingChar.lastSeenChapter) {
        existingChar.lastSeenChapter = incomingChar.lastSeenChapter;
      }

      // Union aliases
      const existingAliasesLower = new Set(existingChar.aliases.map(a => a.toLowerCase().trim()));
      for (const alias of incomingChar.aliases) {
        const trimmedAlias = alias.trim();
        if (trimmedAlias && !existingAliasesLower.has(trimmedAlias.toLowerCase())) {
          existingChar.aliases.push(trimmedAlias);
          existingAliasesLower.add(trimmedAlias.toLowerCase());
        }
      }

      // Union caseSensitiveAliases
      if (incomingChar.caseSensitiveAliases) {
        const existingCSAliasesLower = new Set(
          (existingChar.caseSensitiveAliases || []).map(a => a.toLowerCase().trim())
        );
        for (const alias of incomingChar.caseSensitiveAliases) {
          const trimmedAlias = alias.trim();
          if (trimmedAlias && !existingCSAliasesLower.has(trimmedAlias.toLowerCase())) {
            if (!existingChar.caseSensitiveAliases) {
              existingChar.caseSensitiveAliases = [];
            }
            existingChar.caseSensitiveAliases.push(trimmedAlias);
            existingCSAliasesLower.add(trimmedAlias.toLowerCase());
          }
        }
      }

      // Union traits
      const existingTraitsLower = new Set(existingChar.traits.map(t => t.toLowerCase().trim()));
      for (const trait of incomingChar.traits) {
        const trimmedTrait = trait.trim();
        if (trimmedTrait && !existingTraitsLower.has(trimmedTrait.toLowerCase())) {
          existingChar.traits.push(trimmedTrait);
          existingTraitsLower.add(trimmedTrait.toLowerCase());
        }
      }

      // Union tags
      const existingTagsLower = new Set(existingChar.tags.map(t => t.toLowerCase().trim()));
      for (const tag of incomingChar.tags) {
        const trimmedTag = tag.trim();
        if (trimmedTag && !existingTagsLower.has(trimmedTag.toLowerCase())) {
          existingChar.tags.push(trimmedTag);
          existingTagsLower.add(trimmedTag.toLowerCase());
        }
      }

      // Union secrets
      const existingSecretsLower = new Set(existingChar.secrets.map(s => s.toLowerCase().trim()));
      for (const secret of incomingChar.secrets) {
        const trimmedSecret = secret.trim();
        if (trimmedSecret && !existingSecretsLower.has(trimmedSecret.toLowerCase())) {
          existingChar.secrets.push(trimmedSecret);
          existingSecretsLower.add(trimmedSecret.toLowerCase());
        }
      }

      // Union importantFacts
      const existingFactsLower = new Set(existingChar.importantFacts.map(f => f.toLowerCase().trim()));
      for (const fact of incomingChar.importantFacts) {
        const trimmedFact = fact.trim();
        if (trimmedFact && !existingFactsLower.has(trimmedFact.toLowerCase())) {
          existingChar.importantFacts.push(trimmedFact);
          existingFactsLower.add(trimmedFact.toLowerCase());
        }
      }

      // Union evidence
      const existingEv = existingChar.evidence || [];
      for (const incomingEv of (incomingChar.evidence || [])) {
        const isDuplicate = existingEv.some(
          ex =>
            ex.chapterId === incomingEv.chapterId &&
            ex.quote.trim().toLowerCase() === incomingEv.quote.trim().toLowerCase()
        );
        if (!isDuplicate) {
          existingEv.push({ ...incomingEv });
        }
      }
      existingChar.evidence = existingEv;

      // Union relationships
      for (const incomingRel of incomingChar.relationships) {
        const hasMatchingRel = existingChar.relationships.some(
          rel =>
            (rel.targetId && incomingRel.targetId && rel.targetId === incomingRel.targetId) ||
            (rel.targetName.toLowerCase().trim() === incomingRel.targetName.toLowerCase().trim())
        );
        if (!hasMatchingRel) {
          existingChar.relationships.push({ ...incomingRel });
        }
      }
    } else {
      // New character
      const newChar = {
        ...incomingChar,
        id: incomingChar.id || generateCharacterId(),
        aliases: incomingChar.aliases && incomingChar.aliases.length > 0 
          ? [...incomingChar.aliases] 
          : [incomingChar.name],
        caseSensitiveAliases: incomingChar.caseSensitiveAliases ? [...incomingChar.caseSensitiveAliases] : [],
        traits: incomingChar.traits ? [...incomingChar.traits] : [],
        relationships: incomingChar.relationships ? incomingChar.relationships.map(r => ({ ...r })) : [],
        secrets: incomingChar.secrets ? [...incomingChar.secrets] : [],
        importantFacts: incomingChar.importantFacts ? [...incomingChar.importantFacts] : [],
        tags: incomingChar.tags ? [...incomingChar.tags] : [],
        evidence: incomingChar.evidence ? incomingChar.evidence.map(e => ({ ...e })) : [],
        createdAt: incomingChar.createdAt || Date.now(),
        updatedAt: incomingChar.updatedAt || Date.now(),
      };
      
      // Ensure name is in aliases
      if (!newChar.aliases.includes(newChar.name)) {
        newChar.aliases.unshift(newChar.name);
      }
      
      mergedList.push(newChar);
    }
  }

  return mergedList;
}
