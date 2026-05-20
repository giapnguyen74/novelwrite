import { ProjectStorage } from "../storage/ProjectStorage";
import { loadManifest } from "./manifest";
import { CharactersDocumentSchema } from "../characters/characterSchema";
import { renderCharactersMarkdown } from "../characters/renderCharactersMarkdown";

export type ProjectContext = {
  title: string;
  language: string;
  projectMd: string;
  styleMd: string;
  charactersMd: string;
  continuityMd: string;
  activeArtifactPath?: string;
  activeArtifactContent?: string;
};

export async function loadProjectContext(
  storage: ProjectStorage,
  activeArtifactOverride?: string
): Promise<ProjectContext | null> {
  const manifest = await loadManifest(storage);
  if (!manifest) return null;

  const rawProject = (await storage.readFile(manifest.files.project)) ?? "";
  let projectMd = "";
  if (manifest.files.project && manifest.files.project.endsWith(".json")) {
    try {
      const obj = JSON.parse(rawProject);
      projectMd = `# Project Settings\n\n` + 
        Object.entries(obj)
          .map(([k, v]) => `## ${k}\n${v}`)
          .join("\n\n");
    } catch {
      projectMd = rawProject;
    }
  } else {
    projectMd = rawProject;
  }
  const styleMd = (await storage.readFile(manifest.files.style)) ?? "";
  
  let charactersMd = "";
  const charactersJsonPath = manifest.files.charactersJson || "Characters.json";
  const rawCharactersJson = await storage.readFile(charactersJsonPath);
  
  if (rawCharactersJson) {
    try {
      const parsed = JSON.parse(rawCharactersJson);
      const validated = CharactersDocumentSchema.parse(parsed);
      charactersMd = renderCharactersMarkdown(validated);
    } catch (e) {
      // Schema validation or parse failed, fallback to raw Characters.md
      charactersMd = (await storage.readFile(manifest.files.characters)) ?? "";
    }
  } else {
    charactersMd = (await storage.readFile(manifest.files.characters)) ?? "";
  }
  
  const continuityMd = (await storage.readFile(manifest.files.continuity)) ?? "";

  const activeArtifactPath = activeArtifactOverride ?? manifest.activeArtifact;
  let activeArtifactContent: string | undefined;
  if (activeArtifactPath) {
    activeArtifactContent = (await storage.readFile(activeArtifactPath)) ?? undefined;
  }

  return {
    title: manifest.title,
    language: manifest.language,
    projectMd,
    styleMd,
    charactersMd,
    continuityMd,
    activeArtifactPath,
    activeArtifactContent,
  };
}
