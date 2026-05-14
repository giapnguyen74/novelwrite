"use client";

import { useCallback, useMemo, useState } from "react";
import { NovelCrossTabBanner } from "@/components/novel/novel-cross-tab-banner";
import { NovelEditorHeader } from "@/components/novel/novel-editor-header";
import { NovelEditorWorkspace } from "@/components/novel/novel-editor-workspace";
import { NovelFormatToolbar } from "@/components/novel/novel-format-toolbar";
import { NovelLeftSidebar } from "@/components/novel/novel-left-sidebar";
import {
  NovelRightPanel,
  type RightPanelTab,
} from "@/components/novel/novel-right-panel";
import { useNovelEditor } from "@/hooks/useNovelEditor";
import { useNovelPersistence } from "@/hooks/useNovelPersistence";

export default function NovelWriteMVP() {
  const {
    chapters,
    setChapters,
    activeChapterId,
    setActiveChapterId,
    isLoaded,
    isSaving,
    reloadFromOtherTab,
    dismissReloadBanner,
    clearAllData,
    exportJson,
    importJsonString,
  } = useNovelPersistence();

  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [storyBibleActive, setStoryBibleActive] = useState(false);
  const [rightTab, setRightTab] = useState<RightPanelTab>("assistant");
  const [selectionText, setSelectionText] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);

  const activeChapter = useMemo(
    () => chapters.find((c) => c.id === activeChapterId) ?? null,
    [chapters, activeChapterId]
  );

  const handleMarkdownChange = useCallback(
    (markdown: string) => {
      if (!activeChapterId) return;
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapterId ? { ...c, content: markdown } : c
        )
      );
    },
    [activeChapterId, setChapters]
  );

  const handleSelectionText = useCallback((text: string) => {
    setSelectionText(text);
    setRewriteResult(null);
    setRewriteError(null);
  }, []);

  const editor = useNovelEditor({
    activeChapter,
    activeChapterId,
    onMarkdownChange: handleMarkdownChange,
    onSelectionText: handleSelectionText,
  });

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!activeChapterId) return;
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapterId ? { ...c, title } : c
        )
      );
    },
    [activeChapterId, setChapters]
  );

  const handleCreateChapter = useCallback(() => {
    const id = Date.now().toString();
    setChapters((prev) => {
      const chapter = {
        id,
        title: `Chapter ${prev.length + 1}`,
        content: "",
      };
      return [...prev, chapter];
    });
    setActiveChapterId(id);
  }, [setChapters, setActiveChapterId]);

  const handleDeleteChapter = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newChapters = chapters.filter((c) => c.id !== id);
      setChapters(newChapters);
      if (activeChapterId === id) {
        setActiveChapterId(newChapters[0]?.id ?? null);
      }
    },
    [chapters, activeChapterId, setChapters, setActiveChapterId]
  );

  const handleImportFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      if (
        !window.confirm(
          "Replace the current manuscript with this backup? This cannot be undone."
        )
      ) {
        return;
      }
      const res = importJsonString(text);
      if (!res.ok) {
        window.alert(res.message);
      }
    },
    [importJsonString]
  );

  const handleClearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      clearAllData();
    }
  }, [clearAllData]);

  const runRewrite = useCallback(async () => {
    const text = selectionText.trim();
    if (!text) return;
    setRewriteLoading(true);
    setRewriteError(null);
    try {
      const res = await fetch("/api/assistant/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (!res.ok) {
        setRewriteError(data.error ?? "Request failed");
        return;
      }
      setRewriteResult(data.result ?? "");
    } catch {
      setRewriteError("Network error");
    } finally {
      setRewriteLoading(false);
    }
  }, [selectionText]);

  const wordCount = activeChapter
    ? activeChapter.content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (!isLoaded) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center bg-[#f6f6f8] text-gray-600"
        role="status"
        aria-live="polite"
      >
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col gap-3 overflow-hidden bg-[#f6f6f8] p-3 font-sans text-gray-800">
      <NovelCrossTabBanner
        visible={reloadFromOtherTab}
        onDismiss={dismissReloadBanner}
      />
      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
        {leftPanelOpen && (
          <NovelLeftSidebar
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={setActiveChapterId}
            onClose={() => setLeftPanelOpen(false)}
            onNewChapter={handleCreateChapter}
            onDeleteChapter={handleDeleteChapter}
            onExport={exportJson}
            onImportFile={handleImportFile}
            storyBibleActive={storyBibleActive}
            onToggleStoryBible={() => setStoryBibleActive((s) => !s)}
            onClearAll={handleClearAll}
          />
        )}

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <NovelEditorHeader
            editor={editor}
            leftPanelOpen={leftPanelOpen}
            onOpenLeft={() => setLeftPanelOpen(true)}
            rightPanelOpen={rightPanelOpen}
            onOpenRight={() => setRightPanelOpen(true)}
            wordCount={wordCount}
            isSaving={isSaving}
          />
          <NovelFormatToolbar editor={editor} />
          <NovelEditorWorkspace
            activeChapter={activeChapter}
            editor={editor}
            onTitleChange={handleTitleChange}
            onCreateChapter={handleCreateChapter}
          />
        </main>

        {rightPanelOpen && (
          <NovelRightPanel
            tab={rightTab}
            onTabChange={setRightTab}
            onClose={() => setRightPanelOpen(false)}
            selectionText={selectionText}
            rewriteLoading={rewriteLoading}
            rewriteError={rewriteError}
            rewriteResult={rewriteResult}
            onRewrite={runRewrite}
          />
        )}
      </div>
    </div>
  );
}
