import { z } from "zod";

export const CharacterRelationshipSchema = z.object({
  targetId: z.string().optional(),
  targetName: z.string(),
  label: z.string(),
  notes: z.string().optional(),
});

export const CharacterEvidenceSchema = z.object({
  chapterId: z.string(),
  quote: z.string(),
  addedAt: z.number(),
});

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  caseSensitiveAliases: z.array(z.string()).optional(),
  pronouns: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  age: z.string().optional(),

  // Identity & design
  appearance: z.string().optional(),
  voice: z.string().optional(),
  design: z.string().optional(),

  // Psychology
  coreDesire: z.string().optional(),
  coreFear: z.string().optional(),
  internalConflict: z.string().optional(),
  traits: z.array(z.string()),

  // World
  relationships: z.array(CharacterRelationshipSchema),
  secrets: z.array(z.string()),
  importantFacts: z.array(z.string()),
  developmentArc: z.string().optional(),

  // Bookkeeping
  tags: z.array(z.string()),
  tintHex: z.string().optional(),
  notes: z.string().optional(),
  firstSeenChapter: z.string().optional(),
  lastSeenChapter: z.string().optional(),
  evidence: z.array(CharacterEvidenceSchema).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const CharactersDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  characters: z.array(CharacterSchema),
});

export type CharacterRelationship = z.infer<typeof CharacterRelationshipSchema>;
export type CharacterEvidence = z.infer<typeof CharacterEvidenceSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type CharactersDocument = z.infer<typeof CharactersDocumentSchema>;

// Safe nanoid-like generator using alphanumeric characters: 21 characters
export function generateCharacterId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = "";
  for (let i = 0; i < 21; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return id;
}

export function createDefaultCharacter(name: string, overrides?: Partial<Character>): Character {
  const now = Date.now();
  return {
    id: generateCharacterId(),
    name,
    aliases: [name],
    caseSensitiveAliases: [],
    pronouns: "",
    role: "",
    status: "",
    age: "",
    appearance: "",
    voice: "",
    design: "",
    coreDesire: "",
    coreFear: "",
    internalConflict: "",
    traits: [],
    relationships: [],
    secrets: [],
    importantFacts: [],
    developmentArc: "",
    tags: [],
    tintHex: "",
    notes: "",
    firstSeenChapter: "",
    lastSeenChapter: "",
    evidence: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createDefaultCharactersDocument(): CharactersDocument {
  return {
    schemaVersion: 1,
    characters: [],
  };
}
