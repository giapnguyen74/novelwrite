import { ProjectStorage } from "../storage/ProjectStorage";
import { loadManifest, writeManifest } from "./manifest";

export async function listArtifacts(storage: ProjectStorage): Promise<string[]> {
  const manifest = await loadManifest(storage);
  if (!manifest) return [];

  const prefix = manifest.files.artifactsDir;
  const files = await storage.listFiles(prefix);
  // Return only markdown files in the artifacts directory (excluding snapshots)
  return files.filter((f) => f.endsWith(".md") && !f.includes(".history"));
}

export async function createArtifact(
  storage: ProjectStorage,
  type: string,
  title: string
): Promise<string> {
  const manifest = await loadManifest(storage);
  if (!manifest) throw new Error("Manifest not initialized");

  const artifactsDir = manifest.files.artifactsDir;
  // Slugify title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  
  const filename = `${slug || "untitled"}.md`;
  const path = `${artifactsDir}/${filename}`;

  const initialContent = `# ${title}\n\nType: ${type}\n\nDraft your content here...`;
  await storage.writeFile(path, initialContent);

  // Set as active artifact
  manifest.activeArtifact = path;
  await writeManifest(storage, manifest);

  return path;
}
