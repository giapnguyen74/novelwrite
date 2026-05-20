import { ProjectStorage } from "../storage/ProjectStorage";
import { loadManifest } from "../project/manifest";

export interface CompileOptions {
  chapterIds?: string[];
  includeSceneDividers?: boolean;
  includeChapterNumbers?: boolean;
  stripPlaceholders?: boolean;
  title?: string;
  author?: string;
  dedication?: string;
}

export interface CompiledChapter {
  id: string;
  title: string;
  markdown: string;
}

export interface CompiledBook {
  title: string;
  author: string;
  dedication?: string;
  chapters: CompiledChapter[];
}

function parseChapter(raw: string): { title: string; content: string } {
  const lines = raw.split("\n");
  let title = "Untitled Chapter";
  let startIndex = 0;
  if (lines[0]?.startsWith("# ")) {
    title = lines[0].substring(2).trim();
    startIndex = 1;
    if (lines[1]?.trim() === "") {
      startIndex = 2;
    }
  }
  const content = lines.slice(startIndex).join("\n");
  return { title, content };
}

export async function compileBook(
  storage: ProjectStorage,
  options: CompileOptions = {}
): Promise<CompiledBook> {
  const manifest = await loadManifest(storage);
  if (!manifest) {
    throw new Error("Manifest not initialized");
  }

  let projectTitle = options.title || manifest.title || "My Novel";
  let author = options.author || "";
  
  const projectJsonRaw = await storage.readFile("Project.json");
  if (projectJsonRaw) {
    try {
      const proj = JSON.parse(projectJsonRaw);
      if (!options.title && proj.title) projectTitle = proj.title;
      if (!options.author && proj.author) author = proj.author;
    } catch {}
  }

  const prefix = manifest.files.artifactsDir;
  const files = await storage.listFiles(prefix);
  const mdFiles = files.filter(f => f.endsWith(".md") && !f.includes(".history"));

  // Outline order (alphabetical full path comparison)
  mdFiles.sort((a, b) => a.localeCompare(b));

  const chapters: CompiledChapter[] = [];
  for (let i = 0; i < mdFiles.length; i++) {
    const file = mdFiles[i];
    if (options.chapterIds && !options.chapterIds.includes(file)) {
      continue;
    }

    const rawContent = await storage.readFile(file);
    if (rawContent === null) continue;

    let { title, content } = parseChapter(rawContent);

    // Always strip beat anchor tags completely from export
    content = content
      .replace(/<beat[^>]*>[\s\S]*?<\/beat>/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Strip "Begin your writing here..." placeholder
    if (options.stripPlaceholders) {
      content = content.replace(/Begin your writing here\.\.\./gi, "").trim();
    }

    let compiledTitle = title;
    if (options.includeChapterNumbers) {
      compiledTitle = `Chapter ${chapters.length + 1}: ${title}`;
    }

    if (options.includeSceneDividers) {
      // Safely replace empty lines with scene dividers without recursive bloat
      const paragraphs = content.split(/\n\s*\n/);
      content = paragraphs.join("\n\n* * *\n\n");
    }

    chapters.push({
      id: file,
      title: compiledTitle,
      markdown: content,
    });
  }

  return {
    title: projectTitle,
    author,
    dedication: options.dedication,
    chapters,
  };
}
