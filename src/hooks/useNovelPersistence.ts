"use client";

import { useCallback, useEffect, useState } from "react";
import type { Chapter } from "@/types/novel";
import {
  NOVEL_STORAGE_KEY,
  buildDocument,
  createInitialChapters,
  parseStoredNovel,
  serializeDocument,
} from "@/lib/novel-storage";

export function useNovelPersistence() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadFromOtherTab, setReloadFromOtherTab] = useState(false);

  const createInitialChapter = useCallback(() => {
    const initial = createInitialChapters();
    setChapters(initial);
    setActiveChapterId(initial[0].id);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const raw = localStorage.getItem(NOVEL_STORAGE_KEY);
      const result = parseStoredNovel(raw);
      if (result.ok && result.data.chapters.length > 0) {
        setChapters(result.data.chapters);
        setActiveChapterId(
          result.data.activeChapterId ?? result.data.chapters[0]?.id ?? null
        );
      } else {
        createInitialChapter();
      }
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [createInitialChapter]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== NOVEL_STORAGE_KEY || e.newValue == null) return;
      const result = parseStoredNovel(e.newValue);
      if (!result.ok || result.data.chapters.length === 0) return;
      setChapters(result.data.chapters);
      setActiveChapterId(
        result.data.activeChapterId ?? result.data.chapters[0]?.id ?? null
      );
      setReloadFromOtherTab(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const savingId = window.setTimeout(() => setIsSaving(true), 0);
    const timer = window.setTimeout(() => {
      const doc = buildDocument(chapters, activeChapterId);
      localStorage.setItem(NOVEL_STORAGE_KEY, serializeDocument(doc));
      setIsSaving(false);
    }, 500);
    return () => {
      window.clearTimeout(savingId);
      window.clearTimeout(timer);
    };
  }, [chapters, activeChapterId, isLoaded]);

  const clearAllData = useCallback(() => {
    localStorage.removeItem(NOVEL_STORAGE_KEY);
    createInitialChapter();
  }, [createInitialChapter]);

  const exportJson = useCallback(() => {
    const doc = buildDocument(chapters, activeChapterId);
    const blob = new Blob([serializeDocument(doc)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `novelwrite-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chapters, activeChapterId]);

  const importJsonString = useCallback(
    (json: string): { ok: true } | { ok: false; message: string } => {
      const result = parseStoredNovel(json);
      if (!result.ok || result.data.chapters.length === 0) {
        return { ok: false, message: "Invalid or empty backup file." };
      }
      setChapters(result.data.chapters);
      setActiveChapterId(
        result.data.activeChapterId ?? result.data.chapters[0]?.id ?? null
      );
      return { ok: true };
    },
    []
  );

  return {
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
  };
}
