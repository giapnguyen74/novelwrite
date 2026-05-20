import { ProjectStorage } from "../storage/ProjectStorage";
import { NovelwriteManifest } from "../types/novel";

export async function isNovelwriteProject(storage: ProjectStorage): Promise<boolean> {
  const raw = await storage.readFile("Novelwrite.json");
  if (!raw) return false;

  try {
    const manifest = JSON.parse(raw);
    return manifest.app === "novelwrite" && typeof manifest.schemaVersion === "number";
  } catch {
    return false;
  }
}

export async function loadManifest(storage: ProjectStorage): Promise<NovelwriteManifest | null> {
  const raw = await storage.readFile("Novelwrite.json");
  if (!raw) return null;

  try {
    const manifest = JSON.parse(raw) as NovelwriteManifest;
    if (manifest && manifest.files && !manifest.files.charactersJson) {
      manifest.files.charactersJson = "Characters.json";
    }
    return manifest;
  } catch {
    return null;
  }
}

export async function writeManifest(storage: ProjectStorage, manifest: NovelwriteManifest): Promise<void> {
  if (manifest && manifest.files && !manifest.files.charactersJson) {
    manifest.files.charactersJson = "Characters.json";
  }
  await storage.writeFile("Novelwrite.json", JSON.stringify(manifest, null, 2));
}
