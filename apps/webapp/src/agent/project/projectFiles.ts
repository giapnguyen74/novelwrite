import { ProjectStorage } from "../storage/ProjectStorage";
import { NovelwriteManifest } from "../types/novel";

export function createDefaultProjectMd(title: string, genre: string = "", povAndTense: string = ""): string {
  return `# Project

## Title
${title || "Untitled Project"}

## Language
English

## Genre
${genre || ""}

## Target Audience


## POV
${povAndTense || ""}

## Tense


## Tone


## Premise


## Main Conflict


## Themes


## Content Boundaries


## Author Preferences


## Do Not Do
- `;
}

export function createDefaultStyleMd(styleNotes: string = ""): string {
  return `# Style

## Style Summary
${styleNotes || ""}

## Sentence Rhythm


## Description Style


## Dialogue Style


## Emotional Style


## Pacing


## Preferred Techniques


## Avoid


## Reference Influences


## Extracted Voice Notes


## Sample Passage
`;
}

export function createDefaultCharactersMd(): string {
  return `# Characters

## Character Name

### Role

### Current Status

### Personality

### Voice / Speech Pattern

### Core Desire

### Core Fear

### Relationships

### Secrets

### Important Facts

### Development So Far
`;
}

export function createDefaultContinuityMd(): string {
  return `# Continuity Memory

## Full Story Summary

## Chapter Summaries

## Timeline

## Plot Progress

## Confirmed Facts

## Character State Changes

## Relationship Changes

## World / Setting Facts

## Open Questions

## Unresolved Threads

## Continuity Risks
`;
}

export async function writeInitialProjectFiles(
  storage: ProjectStorage,
  options: { title: string; language: string }
): Promise<NovelwriteManifest> {
  const createdAt = new Date().toISOString();
  
  const manifest: NovelwriteManifest = {
    app: "novelwrite",
    schemaVersion: 1,
    title: options.title,
    language: options.language,
    activeArtifact: "Artifacts/chapter-001.md",
    createdAt,
    updatedAt: createdAt,
    files: {
      project: "Project.json",
      style: "Style.md",
      characters: "Characters.md",
      charactersJson: "Characters.json",
      continuity: "Continuity.md",
      artifactsDir: "Artifacts",
    },
  };

  await storage.writeFile("Novelwrite.json", JSON.stringify(manifest, null, 2));
  
  const defaultProjectJson = {
    title: options.title || "My Novel",
    author: "",
    genre: "",
    pov: "Third Person Limited",
    tense: "Past",
    language: options.language || "vi",
    targetWordCount: 50000,
    description: "High-level plan and setup for this novel."
  };
  await storage.writeFile("Project.json", JSON.stringify(defaultProjectJson, null, 2));
  await storage.writeFile("Style.md", createDefaultStyleMd());
  await storage.writeFile("Characters.md", createDefaultCharactersMd());
  await storage.writeFile("Characters.json", JSON.stringify({ schemaVersion: 1, characters: [] }, null, 2));
  await storage.writeFile("Continuity.md", createDefaultContinuityMd());
  
  // Create Artifacts folder sentinel or first chapter
  await storage.writeFile("Artifacts/chapter-001.md", "# Chapter 1\n\nBegin your writing here...");

  return manifest;
}
