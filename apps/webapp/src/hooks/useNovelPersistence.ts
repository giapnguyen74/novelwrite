"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import type { Chapter, NovelProject } from "@/types/novel";
import { LocalStorageProjectStorage } from "@/lib/LocalStorageProjectStorage";
import {
  CharactersDocument,
  Character,
  renderCharactersMarkdown,
  takeSnapshot,
  listSnapshots,
  readSnapshot,
  restoreSnapshot,
  deleteSnapshot,
} from "@novelwrite/novel-agent";

// Parse chapter helper
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

export function useNovelPersistence() {
  const [manifest, setManifest] = useState<any>(null);
  const [config, setConfig] = useState<any>({ apiKey: "", apiUrl: "", model: "gpt-4o" });
  const [projectMd, setProjectMd] = useState("");
  const [styleMd, setStyleMd] = useState("");
  const [charactersMd, setCharactersMd] = useState("");
  const [continuityMd, setContinuityMd] = useState("");
  const [chapters, setChaptersState] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterIdState] = useState<string | null>(null);
  const [activeChapterContinuity, setActiveChapterContinuity] = useState<string | null>(null);
  const [precedingChapterContinuity, setPrecedingChapterContinuity] = useState<string | null>(null);
  const [chaptersWithContinuity, setChaptersWithContinuity] = useState<string[]>([]);
  const lastSnapshotTimesRef = useRef<{ [chapterId: string]: number }>({});

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving] = useState(false);
  const [reloadFromOtherTab, setReloadFromOtherTab] = useState(false);

  const [charactersDoc, setCharactersDoc] = useState<CharactersDocument>({ schemaVersion: 1, characters: [] });
  const [hasCharactersJson, setHasCharactersJson] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  // Computed state to maintain full compatibility with frontend visual components
  const activeProject = useMemo<NovelProject | null>(() => {
    if (!manifest) return null;
    return {
      id: "local-project",
      title: manifest.title || "My Novel",
      chapters,
      projectMd,
      styleMd,
      charactersMd,
      continuityMd,
      ai: config,
    };
  }, [manifest, projectMd, styleMd, charactersMd, continuityMd, chapters, config]);

  const projects = useMemo<NovelProject[]>(() => {
    return activeProject ? [activeProject] : [];
  }, [activeProject]);

  const activeProjectId = "local-project";

  const loadFromStorage = useCallback(async () => {
    const storage = new LocalStorageProjectStorage();

    // Manifest
    const manifestRaw = await storage.readFile("Novelwrite.json");
    if (!manifestRaw) return;
    const manifestObj = JSON.parse(manifestRaw);
    setManifest(manifestObj);

    // Bibles
    const hasProjectJson = await storage.exists("Project.json");
    let pContent = "";
    if (hasProjectJson) {
      pContent = (await storage.readFile("Project.json")) ?? "";
    } else {
      pContent = (await storage.readFile("Project.md")) ?? "";
    }
    setProjectMd(pContent);
    setStyleMd((await storage.readFile("Style.md")) ?? "");
    setCharactersMd((await storage.readFile("Characters.md")) ?? "");
    setContinuityMd((await storage.readFile("Continuity.md")) ?? "");

    // Characters JSON
    const charactersJsonRaw = await storage.readFile("Characters.json");
    if (charactersJsonRaw) {
      try {
        const parsed = JSON.parse(charactersJsonRaw);
        setCharactersDoc(parsed);
        setHasCharactersJson(true);
      } catch {
        setHasCharactersJson(false);
      }
    } else {
      setHasCharactersJson(false);
    }

    // Config
    const configRaw = await storage.readFile("config.json");
    if (configRaw) {
      try {
        setConfig(JSON.parse(configRaw));
      } catch { }
    }

    // Chapters
    const rawFiles = await storage.listFiles("Artifacts/");
    const files = rawFiles.filter((f) => !f.includes(".history"));
    const parsedChapters: Chapter[] = [];
    for (const file of files) {
      const rawContent = await storage.readFile(file);
      if (rawContent !== null) {
        const parsed = parseChapter(rawContent);
        parsedChapters.push({
          id: file,
          title: parsed.title,
          content: parsed.content,
        });
      }
    }

    // Sort chapters by path identifier
    parsedChapters.sort((a, b) => a.id.localeCompare(b.id));

    setChaptersState(parsedChapters);

    // Active Chapter
    const activePath = manifestObj.activeArtifact || parsedChapters[0]?.id || null;
    setActiveChapterIdState(activePath);
  }, []);

  // Initialize and migrate legacy data if present
  useEffect(() => {
    const storage = new LocalStorageProjectStorage();

    async function init() {
      // 1. Check if legacy data exists
      const legacyRaw = localStorage.getItem("novelwrite-chapters");

      // 2. Check if sentinel exists
      const sentinelExists = await storage.exists("Novelwrite.json");

      if (!sentinelExists && !legacyRaw) {
        setIsFirstTimeSetup(true);
      }

      if (!sentinelExists && legacyRaw) {
        // Perform seamless migration to new individual files structure!
        try {
          const legacy = JSON.parse(legacyRaw);
          const legacyProj = legacy.projects?.[0] || legacy;
          const legacyChapters = Array.isArray(legacyProj) ? legacyProj : (legacyProj.chapters || []);

          const activeChId = legacy.activeChapterId || legacyChapters[0]?.id || "001";
          const manifestObj = {
            app: "novelwrite",
            schemaVersion: 1,
            title: legacyProj.title || "My Novel",
            language: legacyProj.language || "vi",
            activeArtifact: `Artifacts/chapter-${activeChId}.md`,
            files: {
              project: "Project.json",
              style: "Style.md",
              characters: "Characters.md",
              continuity: "Continuity.md"
            }
          };
          await storage.writeFile("Novelwrite.json", JSON.stringify(manifestObj, null, 2));

          // Write Bibles
          let finalProjectJson = legacyProj.projectMd || "";
          if (!finalProjectJson.trim().startsWith("{")) {
            const parsedProj = {
              title: legacyProj.title || "My Novel",
              author: "",
              genre: legacyProj.genre || "",
              pov: legacyProj.povAndTense || "Third Person Limited",
              tense: "Past",
              language: legacyProj.language || "vi",
              targetWordCount: 50000,
              description: legacyProj.projectMd || "High-level plan and setup for this novel.",
              editorFont: "merriweather"
            };
            finalProjectJson = JSON.stringify(parsedProj, null, 2);
          }
          await storage.writeFile("Project.json", finalProjectJson);
          await storage.writeFile("Style.md", legacyProj.styleMd || "");
          await storage.writeFile("Characters.md", legacyProj.charactersMd || "");
          await storage.writeFile("Continuity.md", legacyProj.continuityMd || "");

          // Write config
          const configObj = legacyProj.ai || { apiKey: "", apiUrl: "", model: "gpt-4o" };
          await storage.writeFile("config.json", JSON.stringify(configObj, null, 2));

          // Write Chapters
          for (const ch of legacyChapters) {
            const chContent = `# ${ch.title}\n\n${ch.content}`;
            await storage.writeFile(`Artifacts/chapter-${ch.id}.md`, chContent);
          }

          // Delete legacy key
          localStorage.removeItem("novelwrite-chapters");
        } catch (e) {
          console.error("Migration failed:", e);
        }
      }

      // If still no sentinel, write fresh project files
      const sentinelExistsNow = await storage.exists("Novelwrite.json");
      if (!sentinelExistsNow) {
        const manifestObj = {
          app: "novelwrite",
          schemaVersion: 1,
          title: "My Novel",
          language: "vi",
          activeArtifact: "Artifacts/chapter-001.md",
          files: {
            project: "Project.json",
            style: "Style.md",
            characters: "Characters.md",
            charactersJson: "Characters.json",
            continuity: "Continuity.md"
          }
        };
        await storage.writeFile("Novelwrite.json", JSON.stringify(manifestObj, null, 2));
        const defaultProject = {
          title: "My Novel",
          author: "",
          genre: "",
          pov: "Third Person Limited",
          tense: "Past",
          language: "vi",
          targetWordCount: 50000,
          description: "High-level plan and setup for this novel.",
          editorFont: "merriweather"
        };
        await storage.writeFile("Project.json", JSON.stringify(defaultProject, null, 2));
        await storage.writeFile("Style.md", `# Style\n\n## Style Summary\n`);
        await storage.writeFile("Characters.md", `# Characters\n`);
        await storage.writeFile("Characters.json", JSON.stringify({ schemaVersion: 1, characters: [] }, null, 2));
        await storage.writeFile("Continuity.md", `# Continuity Memory\n`);
        await storage.writeFile("config.json", JSON.stringify({ apiKey: "", apiUrl: "", model: "gpt-4o" }, null, 2));
        await storage.writeFile("Artifacts/chapter-001.md", `# Chapter 1\n\nBegin your writing here...`);
      }

      // Load all files into state
      await loadFromStorage();
      setIsLoaded(true);
    }

    init();
  }, [loadFromStorage]);

  // Sync state changes back to individual key-value localStorage files
  const setChapters = useCallback((newChaptersOrFn: Chapter[] | ((prev: Chapter[]) => Chapter[])) => {
    setChaptersState((prev) => {
      const next = typeof newChaptersOrFn === "function" ? newChaptersOrFn(prev) : newChaptersOrFn;
      const storage = new LocalStorageProjectStorage();

      // Delete removed chapters from storage
      const nextIds = new Set(next.map(c => c.id));
      for (const ch of prev) {
        if (!nextIds.has(ch.id)) {
          storage.deleteFile(ch.id);
          const continuityId = ch.id.replace("Artifacts/", "Continuity/");
          storage.deleteFile(continuityId);
        }
      }

      // Save new/updated chapters
      for (const ch of next) {
        const serialized = `# ${ch.title}\n\n${ch.content}`;
        storage.writeFile(ch.id, serialized);

        // Interval snapshot check (30 minutes)
        const now = Date.now();
        const lastTime = lastSnapshotTimesRef.current[ch.id] || 0;
        if (now - lastTime > 30 * 60 * 1000) {
          lastSnapshotTimesRef.current[ch.id] = now;
          takeSnapshot(storage, ch.id, "interval", "Interval backup");
        }
      }

      return next;
    });
  }, []);

  const setActiveChapterId = useCallback((id: string | null) => {
    setActiveChapterIdState(id);
    if (id && manifest) {
      const storage = new LocalStorageProjectStorage();
      const updatedManifest = { ...manifest, activeArtifact: id };
      setManifest(updatedManifest);
      storage.writeFile("Novelwrite.json", JSON.stringify(updatedManifest, null, 2));
    }
  }, [manifest]);

  const updateActiveProject = useCallback(async (updates: Partial<Omit<NovelProject, "id" | "chapters">>) => {
    const storage = new LocalStorageProjectStorage();

    if (updates.projectMd !== undefined) {
      setProjectMd(updates.projectMd);
      const hasProjectJson = await storage.exists("Project.json");
      const isJson = manifest?.files?.project?.endsWith(".json") || hasProjectJson;
      if (isJson) {
        storage.writeFile("Project.json", updates.projectMd);
      } else {
        storage.writeFile("Project.md", updates.projectMd);
      }
    }
    if (updates.styleMd !== undefined) {
      setStyleMd(updates.styleMd);
      storage.writeFile("Style.md", updates.styleMd);
    }
    if (updates.charactersMd !== undefined) {
      setCharactersMd(updates.charactersMd);
      storage.writeFile("Characters.md", updates.charactersMd);
    }
    if (updates.continuityMd !== undefined) {
      setContinuityMd(updates.continuityMd);
      storage.writeFile("Continuity.md", updates.continuityMd);
    }
    if (updates.ai !== undefined) {
      setConfig(updates.ai);
      storage.writeFile("config.json", JSON.stringify(updates.ai, null, 2));
    }
    if (updates.title !== undefined && manifest) {
      const updatedManifest = { ...manifest, title: updates.title };
      setManifest(updatedManifest);
      storage.writeFile("Novelwrite.json", JSON.stringify(updatedManifest, null, 2));
    }
  }, [manifest]);

  const createInitialChapter = useCallback(() => {
    const id = `Artifacts/chapter-${Date.now()}.md`;
    const newCh = {
      id,
      title: `Chapter ${chapters.length + 1}`,
      content: "Begin your writing here...",
    };
    setChapters([...chapters, newCh]);
    setActiveChapterId(id);
  }, [chapters, setChapters, setActiveChapterId]);

  const clearAllData = useCallback(async () => {
    const storage = new LocalStorageProjectStorage();

    // Take pre-clear snapshots of all chapters before wiping
    for (const ch of chapters) {
      try {
        await takeSnapshot(storage, ch.id, "pre-clear", "Before clearing project");
      } catch { }
    }

    // Safely clear only non-history keys
    const keysToKeep: { [key: string]: string | null } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("/.history/")) {
        keysToKeep[key] = localStorage.getItem(key);
      }
    }

    localStorage.clear();

    for (const [key, val] of Object.entries(keysToKeep)) {
      if (val !== null) {
        localStorage.setItem(key, val);
      }
    }

    const freshManifest = {
      app: "novelwrite",
      schemaVersion: 1,
      title: "My Novel",
      language: "vi",
      activeArtifact: "Artifacts/chapter-001.md",
      files: {
        project: "Project.json",
        style: "Style.md",
        characters: "Characters.md",
        charactersJson: "Characters.json",
        continuity: "Continuity.md"
      }
    };
    storage.writeFile("Novelwrite.json", JSON.stringify(freshManifest, null, 2));
    const defaultProject = {
      title: "My Novel",
      author: "",
      genre: "",
      pov: "Third Person Limited",
      tense: "Past",
      language: "vi",
      targetWordCount: 50000,
      description: "High-level plan and setup for this novel."
    };
    storage.writeFile("Project.json", JSON.stringify(defaultProject, null, 2));
    storage.writeFile("Style.md", `# Style\n\n## Style Summary\n`);
    storage.writeFile("Characters.md", `# Characters\n`);
    storage.writeFile("Characters.json", JSON.stringify({ schemaVersion: 1, characters: [] }, null, 2));
    storage.writeFile("Continuity.md", `# Continuity Memory\n`);
    storage.writeFile("config.json", JSON.stringify({ apiKey: "", apiUrl: "", model: "gpt-4o" }, null, 2));
    storage.writeFile("Artifacts/chapter-001.md", `# Chapter 1\n\nBegin your writing here...`);

    loadFromStorage();
  }, [loadFromStorage]);

  const exportJson = useCallback(async () => {
    const storage = new LocalStorageProjectStorage();
    const files = await storage.listFiles();
    const backup: Record<string, string> = {};
    for (const f of files) {
      const content = await storage.readFile(f);
      if (content !== null) {
        backup[f] = content;
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `novelwrite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importJsonString = useCallback(
    async (json: string): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        const backup = JSON.parse(json);
        if (typeof backup !== "object" || backup === null) {
          return { ok: false, message: "Invalid backup format." };
        }

        const storage = new LocalStorageProjectStorage();
        // Take pre-clear snapshots of all chapters before wiping
        for (const ch of chapters) {
          try {
            await takeSnapshot(storage, ch.id, "pre-clear", "Before importing new data");
          } catch { }
        }

        // Safely clear only non-history keys
        const keysToKeep: { [key: string]: string | null } = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes("/.history/")) {
            keysToKeep[key] = localStorage.getItem(key);
          }
        }

        localStorage.clear();

        for (const [key, val] of Object.entries(keysToKeep)) {
          if (val !== null) {
            localStorage.setItem(key, val);
          }
        }

        for (const [key, val] of Object.entries(backup)) {
          if (typeof val === "string") {
            localStorage.setItem(key, val);
          }
        }

        // Auto-migrate legacy payload format if present in the imported keys
        const legacyRaw = localStorage.getItem("novelwrite-chapters");
        const sentinelExists = localStorage.getItem("Novelwrite.json") !== null;

        if (!sentinelExists && legacyRaw) {
          try {
            const legacy = JSON.parse(legacyRaw);
            const legacyProj = legacy.projects?.[0] || legacy;
            const legacyChapters = Array.isArray(legacyProj) ? legacyProj : (legacyProj.chapters || []);

            const activeChId = legacy.activeChapterId || legacyChapters[0]?.id || "001";
            const manifestObj = {
              app: "novelwrite",
              schemaVersion: 1,
              title: legacyProj.title || "My Novel",
              language: legacyProj.language || "vi",
              activeArtifact: `Artifacts/chapter-${activeChId}.md`,
              files: {
                project: "Project.json",
                style: "Style.md",
                characters: "Characters.md",
                continuity: "Continuity.md"
              }
            };
            localStorage.setItem("Novelwrite.json", JSON.stringify(manifestObj, null, 2));

            // Write Bibles
            let finalProjectJson = legacyProj.projectMd || "";
            if (!finalProjectJson.trim().startsWith("{")) {
              const parsedProj = {
                title: legacyProj.title || "My Novel",
                author: "",
                genre: legacyProj.genre || "",
                pov: legacyProj.povAndTense || "Third Person Limited",
                tense: "Past",
                language: legacyProj.language || "vi",
                targetWordCount: 50000,
                description: legacyProj.projectMd || "High-level plan and setup for this novel."
              };
              finalProjectJson = JSON.stringify(parsedProj, null, 2);
            }
            localStorage.setItem("Project.json", finalProjectJson);
            localStorage.setItem("Style.md", legacyProj.styleMd || "");
            localStorage.setItem("Characters.md", legacyProj.charactersMd || "");
            localStorage.setItem("Continuity.md", legacyProj.continuityMd || "");

            // Write config
            const configObj = legacyProj.ai || { apiKey: "", apiUrl: "", model: "gpt-4o" };
            localStorage.setItem("config.json", JSON.stringify(configObj, null, 2));

            // Write Chapters
            for (const ch of legacyChapters) {
              const chContent = `# ${ch.title}\n\n${ch.content}`;
              localStorage.setItem(`Artifacts/chapter-${ch.id}.md`, chContent);
            }

            // Clean up legacy key
            localStorage.removeItem("novelwrite-chapters");
          } catch (e) {
            console.error("Migration failed inside import handler:", e);
          }
        }

        // If imported key had absolutely no project payload, initialize fresh files
        const sentinelExistsNow = localStorage.getItem("Novelwrite.json") !== null;
        if (!sentinelExistsNow) {
          const manifestObj = {
            app: "novelwrite",
            schemaVersion: 1,
            title: "My Novel",
            language: "vi",
            activeArtifact: "Artifacts/chapter-001.md",
            files: {
              project: "Project.json",
              style: "Style.md",
              characters: "Characters.md",
              charactersJson: "Characters.json",
              continuity: "Continuity.md"
            }
          };
          localStorage.setItem("Novelwrite.json", JSON.stringify(manifestObj, null, 2));
          const defaultProject = {
            title: "My Novel",
            author: "",
            genre: "",
            pov: "Third Person Limited",
            tense: "Past",
            language: "vi",
            targetWordCount: 50000,
            description: "High-level plan and setup for this novel."
          };
          localStorage.setItem("Project.json", JSON.stringify(defaultProject, null, 2));
          localStorage.setItem("Style.md", `# Style\n\n## Style Summary\n`);
          localStorage.setItem("Characters.md", `# Characters\n`);
          localStorage.setItem("Characters.json", JSON.stringify({ schemaVersion: 1, characters: [] }, null, 2));
          localStorage.setItem("Continuity.md", `# Continuity Memory\n`);
          localStorage.setItem("config.json", JSON.stringify({ apiKey: "", apiUrl: "", model: "gpt-4o" }, null, 2));
          localStorage.setItem("Artifacts/chapter-001.md", `# Chapter 1\n\nBegin your writing here...`);
        }

        loadFromStorage();
        return { ok: true };
      } catch (e) {
        return { ok: false, message: "Failed to parse backup JSON." };
      }
    },
    [loadFromStorage]
  );

  const updateCharacters = useCallback(async (updater: (doc: CharactersDocument) => void) => {
    const storage = new LocalStorageProjectStorage();
    setCharactersDoc((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as CharactersDocument;
      updater(next);
      storage.writeFile("Characters.json", JSON.stringify(next, null, 2));
      setHasCharactersJson(true);
      const renderedMd = renderCharactersMarkdown(next);
      setCharactersMd(renderedMd);
      storage.writeFile("Characters.md", renderedMd);
      return next;
    });
  }, []);

  const saveMigratedCharacters = useCallback(async (doc: CharactersDocument) => {
    const storage = new LocalStorageProjectStorage();
    setCharactersDoc(doc);
    setHasCharactersJson(true);
    await storage.writeFile("Characters.json", JSON.stringify(doc, null, 2));
    const renderedMd = renderCharactersMarkdown(doc);
    setCharactersMd(renderedMd);
    await storage.writeFile("Characters.md", renderedMd);
  }, []);

  const loadSnapshots = useCallback(async (path: string) => {
    const storage = new LocalStorageProjectStorage();
    return listSnapshots(storage, path);
  }, []);

  const triggerManualSnapshot = useCallback(async (path: string, label?: string) => {
    const storage = new LocalStorageProjectStorage();
    const ts = await takeSnapshot(storage, path, "manual", label);
    return ts;
  }, []);

  const getSnapshotContent = useCallback(async (path: string, timestamp: string) => {
    const storage = new LocalStorageProjectStorage();
    return readSnapshot(storage, path, timestamp);
  }, []);

  const triggerRestoreSnapshot = useCallback(async (path: string, timestamp: string) => {
    const storage = new LocalStorageProjectStorage();
    const ok = await restoreSnapshot(storage, path, timestamp);
    if (ok) {
      await loadFromStorage();
    }
    return ok;
  }, [loadFromStorage]);

  const triggerDeleteSnapshot = useCallback(async (path: string, timestamp: string) => {
    const storage = new LocalStorageProjectStorage();
    return deleteSnapshot(storage, path, timestamp);
  }, []);

  // --- Position-dependent Continuity logic ---
  useEffect(() => {
    async function loadContinuity() {
      if (!activeChapterId) {
        setActiveChapterContinuity(null);
        setPrecedingChapterContinuity(null);
        return;
      }
      const storage = new LocalStorageProjectStorage();

      // 1. Load active chapter's continuity
      const continuityId = activeChapterId.replace("Artifacts/", "Continuity/");
      const rawContinuity = await storage.readFile(continuityId);
      setActiveChapterContinuity(rawContinuity || "");

      // 2. Resolve preceding chapter sequence order
      const prefix = manifest?.files?.artifactsDir || "Artifacts";
      const files = await storage.listFiles(prefix + "/");
      const mdFiles = files.filter(f => f.endsWith(".md") && !f.includes(".history"));
      mdFiles.sort((a, b) => a.localeCompare(b));

      const activeIndex = mdFiles.indexOf(activeChapterId);
      if (activeIndex > 0) {
        const prevChapterId = mdFiles[activeIndex - 1];
        const precedingContinuityId = prevChapterId.replace("Artifacts/", "Continuity/");
        const rawPreceding = await storage.readFile(precedingContinuityId);
        setPrecedingChapterContinuity(rawPreceding);
      } else {
        setPrecedingChapterContinuity(null);
      }
    }
    if (isLoaded) {
      loadContinuity();
    }
  }, [activeChapterId, chapters, isLoaded, manifest]);

  const updateActiveChapterContinuity = useCallback(async (content: string) => {
    if (!activeChapterId) return;
    const storage = new LocalStorageProjectStorage();
    const continuityId = activeChapterId.replace("Artifacts/", "Continuity/");
    await storage.writeFile(continuityId, content);
    setActiveChapterContinuity(content);
  }, [activeChapterId]);

  const updatePrecedingChapterContinuity = useCallback(async (content: string) => {
    if (!activeChapterId) return;
    const mdFiles = [...chapters]
      .map((c) => c.id)
      .sort((a, b) => a.localeCompare(b));
    const activeIndex = mdFiles.indexOf(activeChapterId);
    if (activeIndex > 0) {
      const prevChapterId = mdFiles[activeIndex - 1];
      const storage = new LocalStorageProjectStorage();
      const continuityId = prevChapterId.replace("Artifacts/", "Continuity/");
      await storage.writeFile(continuityId, content);
      setPrecedingChapterContinuity(content);
    }
  }, [activeChapterId, chapters]);

  useEffect(() => {
    if (!isLoaded) return;
    const updateContinuityList = () => {
      const keys = Object.keys(localStorage);
      const withSummary: string[] = [];
      for (const key of keys) {
        if (key.startsWith("Continuity/")) {
          const content = localStorage.getItem(key);
          if (content && content.trim().length > 50) {
            const chapId = key.replace("Continuity/", "Artifacts/");
            withSummary.push(chapId);
          }
        }
      }
      setChaptersWithContinuity(withSummary);
    };
    updateContinuityList();
  }, [chapters, isLoaded, activeChapterContinuity, precedingChapterContinuity]);

  return {
    projects,
    setProjects: () => { },
    activeProjectId,
    setActiveProjectId: () => { },
    activeProject,
    updateActiveProject,
    chapters,
    setChapters,
    activeChapterId,
    setActiveChapterId,
    isLoaded,
    isSaving,
    reloadFromOtherTab,
    dismissReloadBanner: () => setReloadFromOtherTab(false),
    createInitialChapter,
    clearAllData,
    exportJson,
    importJsonString,
    charactersDoc,
    hasCharactersJson,
    updateCharacters,
    saveMigratedCharacters,
    loadSnapshots,
    triggerManualSnapshot,
    getSnapshotContent,
    triggerRestoreSnapshot,
    triggerDeleteSnapshot,
    activeChapterContinuity,
    precedingChapterContinuity,
    updateActiveChapterContinuity,
    updatePrecedingChapterContinuity,
    chaptersWithContinuity,
    isFirstTimeSetup,
  };
}
