"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { NovelCrossTabBanner } from "@/components/novel/novel-cross-tab-banner";
import { NovelEditorHeader } from "@/components/novel/novel-editor-header";
import { NovelEditorWorkspace } from "@/components/novel/novel-editor-workspace";
import { NovelFormatToolbar, type FontSize, type PageWidth, type IndentStyle, type SceneDivider } from "@/components/novel/novel-format-toolbar";
import { NovelLeftSidebar } from "@/components/novel/novel-left-sidebar";
import {
  NovelRightPanel,
  type RightPanelTab,
  type AssistantFeature,
} from "@/components/novel/novel-right-panel";
import { NovelSettingsModal } from "@/components/novel/novel-settings-modal";
import { NovelStoryBibleWorkspace } from "@/components/novel/novel-story-bible-workspace";
import { NovelCompileModal } from "@/components/novel/novel-compile-modal";
import { CharacterHoverCard } from "@/components/novel/characters/CharacterHoverCard";
import {
  useNovelEditor,
  type EditorSelectionRange,
} from "@/hooks/useNovelEditor";
import { useNovelPersistence } from "@/hooks/useNovelPersistence";
import { runAiFeature } from "@/lib/ai/ai-runner";

/**
 * Main entry point. Guards the entire application with an isLoaded check.
 * This prevents SSR hydration mismatches and avoids calling editor hooks 
 * on the server, which silences Tiptap's SSR warnings.
 */
export default function NovelWriteMVP() {
  const persistence = useNovelPersistence();

  if (!persistence.isLoaded) {
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

  return <NovelDashboard persistence={persistence} />;
}

/**
 * The actual dashboard component. This runs only on the client.
 */
function NovelDashboard({ persistence }: { persistence: ReturnType<typeof useNovelPersistence> }) {
  const {
    chapters,
    setChapters,
    activeChapterId,
    setActiveChapterId,
    isSaving,
    reloadFromOtherTab,
    dismissReloadBanner,
    clearAllData,
    exportJson,
    importJsonString,
    activeProject,
    updateActiveProject,
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
  } = persistence;

  // View state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [storyBibleActive, setStoryBibleActive] = useState(false);
  const [rightTab, setRightTab] = useState<RightPanelTab>("assistant");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compileModalOpen, setCompileModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFirstTimeSetup) {
      setSettingsOpen(true);
    }
  }, [isFirstTimeSetup]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const handleOpenHistory = useCallback(() => {
    setRightPanelOpen(true);
    setRightTab("history");
  }, []);

  const [highlightEnabled, setHighlightEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("novelwrite-highlight-enabled");
      return stored !== "false";
    }
    return true;
  });

  const typographySettings = useMemo(() => {
    const defaults = {
      editorFont: "merriweather",
      textAlign: "left" as "left" | "center" | "right" | "justify",
      lineHeight: "1.5" as "1.0" | "1.15" | "1.5" | "2.0",
      paragraphSpacing: "small" as "none" | "small" | "medium" | "large",
      firstLineIndent: false,
      fontSize: "normal" as FontSize,
      pageWidth: "normal" as PageWidth,
      indentStyle: "none" as IndentStyle,
      sceneDivider: "none" as SceneDivider,
    };

    if (!activeProject?.projectMd) return defaults;
    try {
      const parsed = JSON.parse(activeProject.projectMd);
      return {
        editorFont: parsed.editorFont || defaults.editorFont,
        textAlign: parsed.textAlign || defaults.textAlign,
        lineHeight: parsed.lineHeight || defaults.lineHeight,
        paragraphSpacing: parsed.paragraphSpacing || defaults.paragraphSpacing,
        firstLineIndent: parsed.firstLineIndent !== undefined ? parsed.firstLineIndent : defaults.firstLineIndent,
        fontSize: parsed.fontSize || defaults.fontSize,
        pageWidth: parsed.pageWidth || defaults.pageWidth,
        indentStyle: parsed.indentStyle || defaults.indentStyle,
        sceneDivider: parsed.sceneDivider || defaults.sceneDivider,
      };
    } catch {
      return defaults;
    }
  }, [activeProject?.projectMd]);

  const updateTypographySettings = useCallback((updates: Partial<typeof typographySettings>) => {
    if (!activeProject) return;
    let parsed: any = {};
    try {
      parsed = JSON.parse(activeProject.projectMd);
    } catch {
      parsed = {
        title: activeProject.title || "My Novel",
        author: "",
        genre: "",
        pov: "Third Person Limited",
        tense: "Past",
        language: "vi",
        targetWordCount: 50000,
        description: activeProject.projectMd || "High-level plan and setup for this novel."
      };
    }
    const nextProjectMd = JSON.stringify({ ...parsed, ...updates }, null, 2);
    updateActiveProject({ projectMd: nextProjectMd });
  }, [activeProject, updateActiveProject]);

  const handleToggleHighlight = useCallback(() => {
    setHighlightEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("novelwrite-highlight-enabled", String(next));
      return next;
    });
  }, []);

  const activeProjectRef = useRef(activeProject);
  const activeChapterIdRef = useRef(activeChapterId);
  const continuityRef = useRef(precedingChapterContinuity);

  useEffect(() => {
    activeProjectRef.current = activeProject;
    activeChapterIdRef.current = activeChapterId;
    continuityRef.current = precedingChapterContinuity;
  }, [activeProject, activeChapterId, precedingChapterContinuity]);

  useEffect(() => {
    const handleOpenChar = () => {
      setStoryBibleActive(true);
    };

    const handleGenerateBeat = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const {
        id,
        beatType,
        description,
        precedingText,
        followingText,
        wordCount,
        onStart,
        onSuccess,
        onError,
      } = customEvent.detail;

      const proj = activeProjectRef.current;
      if (!proj) {
        onError("No active project configured.");
        return;
      }

      onStart();

      try {
        let language = "en";
        try {
          const parsed = JSON.parse(proj.projectMd);
          if (parsed.language) {
            language = parsed.language;
          }
        } catch {}

        const mockArtifactContent = precedingText + "\n\n" + description + "\n\n" + followingText;

        const targetType = beatType || "guide";
        const targetWords = wordCount || 400;

        const enhancedInstruction = [
          `Beat Type: ${targetType.toUpperCase()}`,
          `Target Prose Length: ~${targetWords} words`,
          `Beat Description / Narrative Goal:`,
          description,
        ].join("\n");

        const res = await runAiFeature(
          "beatWrite",
          {
            selection: description,
            projectMd: proj.projectMd,
            styleMd: proj.styleMd,
            charactersMd: proj.charactersMd,
            continuityMd: continuityRef.current || "",
            activeArtifact: activeChapterIdRef.current || "Artifacts/chapter-001.md",
            activeArtifactContent: mockArtifactContent,
            userInstruction: enhancedInstruction,
            language: language,
          },
          proj.ai
        );

        onSuccess(res.displayText);
      } catch (err: any) {
        onError(err instanceof Error ? err.message : "AI generation failed.");
      }
    };

    window.addEventListener("novelwrite:openCharacter", handleOpenChar);
    window.addEventListener("novelwrite:generateBeat", handleGenerateBeat);
    return () => {
      window.removeEventListener("novelwrite:openCharacter", handleOpenChar);
      window.removeEventListener("novelwrite:generateBeat", handleGenerateBeat);
    };
  }, []);

  // Editor selection state
  const [selection, setSelection] = useState<EditorSelectionRange | null>(null);

  // Assistant state
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantResult, setAssistantResult] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<AssistantFeature | null>(null);
  const [pinnedRange, setPinnedRange] = useState<{
    from: number;
    to: number;
    text: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopAssistant = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // User direct guidance state
  const [userInstruction, setUserInstruction] = useState("");
  const [expandMode, setExpandMode] = useState<"replace" | "append">("replace");

  const activeChapter = useMemo(
    () => chapters.find((c) => c.id === activeChapterId) ?? null,
    [chapters, activeChapterId]
  );

  const estimatedTokens = useMemo(() => {
    if (!activeProject) return 0;
    const projectMd = activeProject.projectMd || "";
    const styleMd = activeProject.styleMd || "";
    const charactersMd = activeProject.charactersMd || "";
    const continuityMd = activeProject.continuityMd || "";
    const chapterContent = activeChapter?.content || "";
    const contextLength = projectMd.length + styleMd.length + charactersMd.length + continuityMd.length + chapterContent.length;
    // Standard estimation of ~3.8 characters per token
    return Math.round(contextLength / 3.8);
  }, [activeProject, activeChapter]);

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

  const handleSelectionChange = useCallback(
    (next: EditorSelectionRange | null) => {
      setSelection(next);
      // Reset assistant output upon new manual selections to avoid range mismatch
      setAssistantResult(null);
      setAssistantError(null);
      setPinnedRange(null);
      setAssistantMode(null);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    },
    []
  );

  const { editor, replaceSelectionAt } = useNovelEditor({
    activeChapter,
    activeChapterId,
    onMarkdownChange: handleMarkdownChange,
    onSelectionChange: handleSelectionChange,
    charactersMd: activeProject?.charactersMd || "",
    highlightEnabled: highlightEnabled,
  });

  const selectionText = selection?.text ?? "";

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
    const id = `Artifacts/chapter-${Date.now()}.md`;
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
      const res = await importJsonString(text);
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

  // AI assistant runner
  const runAssistant = useCallback(
    async (feature: AssistantFeature) => {
      const targetText = pinnedRange?.text ?? selection?.text ?? "";
      const targetFrom = pinnedRange?.from ?? selection?.from ?? 0;
      const targetTo = pinnedRange?.to ?? selection?.to ?? 0;
      
      let finalSelection = targetText;
      let targetChapterId = activeChapterId;
      let targetChapterContent = activeChapter?.content || "";

      if (!finalSelection.trim()) {
        if (feature === "write") {
          finalSelection = editor?.getText() ?? activeChapter?.content ?? "";
        } else if (
          feature === "summarize" ||
          feature === "checkContinuity" ||
          feature === "characterCapture"
        ) {
          finalSelection = activeChapter?.content ?? "";
        } else {
          // If a prose polishing feature is triggered without selection, notify the user.
          setAssistantError("Please select a passage in the editor first.");
          setRightTab("assistant");
          return;
        }
      }

      const project = activeProject;
      if (!project) return;

      setAssistantLoading(true);
      setAssistantError(null);
      setAssistantResult("");
      setAssistantMode(feature);

      // Pin range for editor replacement actions
      const isProseEdit = ["rewrite", "expand", "tighten", "improveDialogue"].includes(feature);
      if (isProseEdit && !pinnedRange && targetText.trim()) {
        setPinnedRange({
          from: targetFrom,
          to: targetTo,
          text: targetText,
        });
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let language = "en";
        try {
          const parsed = JSON.parse(project.projectMd);
          if (parsed.language) {
            language = parsed.language;
          }
        } catch {}

        const res = await runAiFeature(
          feature,
          {
            selection: finalSelection,
            projectMd: project.projectMd,
            styleMd: project.styleMd,
            charactersMd: project.charactersMd,
            continuityMd: precedingChapterContinuity || "",
            activeArtifact: targetChapterId || "Artifacts/chapter-001.md",
            activeArtifactContent: targetChapterContent,
            userInstruction: userInstruction,
            language: language,
            signal: controller.signal,
          },
          project.ai,
          (chunk) => {
            setAssistantResult((prev) => (prev ? prev + chunk : chunk));
          }
        );
        setAssistantResult(res.displayText);
      } catch (error: any) {
        if (error.name === "AbortError" || error.message?.includes("aborted")) {
          // Treated as a discard, not a failure
          setAssistantResult(null);
          setAssistantMode(null);
          setPinnedRange(null);
          return;
        }
        setAssistantError(
          error instanceof Error ? error.message : "AI assistant request failed."
        );
        if (!pinnedRange) {
          setPinnedRange(null);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setAssistantLoading(false);
      }
    },
    [selection, pinnedRange, activeProject, userInstruction, activeChapter, editor]
  );

  const applyAssistant = useCallback(async () => {
    if (!assistantResult?.trim()) return;

    // Capture Assistants output routing
    if (assistantMode === "styleCapture") {
      updateActiveProject({ styleMd: assistantResult });
      setAssistantResult(null);
      setAssistantError(null);
      setAssistantMode(null);
      setUserInstruction("");
      window.alert("Successfully saved updated voice notes into Style.md!");
      return;
    }

    if (assistantMode === "characterCapture") {
      updateActiveProject({ charactersMd: assistantResult });
      setAssistantResult(null);
      setAssistantError(null);
      setAssistantMode(null);
      setUserInstruction("");
      window.alert("Successfully merged new facts into Characters.md!");
      return;
    }

    if (assistantMode === "summarize") {
      await updateActiveChapterContinuity(assistantResult);
      setAssistantResult(null);
      setAssistantError(null);
      setAssistantMode(null);
      setUserInstruction("");
      window.alert("Successfully updated this chapter's continuity summary!");
      return;
    }

    if (assistantMode === "checkContinuity") {
      // Just a report, dismiss upon click
      setAssistantResult(null);
      setAssistantError(null);
      setAssistantMode(null);
      setUserInstruction("");
      return;
    }

    // Prose actions output routing
    let ok = false;
    if (assistantMode === "write") {
      const cursor = editor?.state.selection.to ?? 0;
      ok = replaceSelectionAt(cursor, cursor, "\n\n" + assistantResult);
    } else if (assistantMode === "expand" && expandMode === "append" && pinnedRange) {
      ok = replaceSelectionAt(pinnedRange.to, pinnedRange.to, "\n" + assistantResult);
    } else if (pinnedRange) {
      ok = replaceSelectionAt(pinnedRange.from, pinnedRange.to, assistantResult);
    } else if (activeChapterId) {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapterId ? { ...c, content: assistantResult } : c
        )
      );
      ok = true;
    }

    if (!ok) {
      setAssistantError(
        "Could not apply changes. The selection or document may have changed—try again."
      );
      return;
    }

    setAssistantResult(null);
    setPinnedRange(null);
    setAssistantError(null);
    setAssistantMode(null);
    setUserInstruction("");
  }, [
    assistantResult,
    pinnedRange,
    assistantMode,
    expandMode,
    replaceSelectionAt,
    activeChapterId,
    setChapters,
    updateActiveProject,
    updateActiveChapterContinuity,
    editor,
  ]);

  const cancelAssistant = useCallback(() => {
    setAssistantResult(null);
    setPinnedRange(null);
    setAssistantError(null);
    setAssistantMode(null);
  }, []);

  const wordCount = activeChapter
    ? activeChapter.content.trim().split(/\s+/).filter(Boolean).length
    : 0;

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
            onExport={() => setCompileModalOpen(true)}
            onImportFile={handleImportFile}
            storyBibleActive={storyBibleActive}
            onToggleStoryBible={() => setStoryBibleActive((s) => !s)}
            onClearAll={handleClearAll}
            onOpenSettings={() => setSettingsOpen(true)}
            projectTitle={activeProject?.title}
            estimatedTokens={estimatedTokens}
            chaptersWithContinuity={chaptersWithContinuity}
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
            highlightEnabled={highlightEnabled}
            onToggleHighlight={handleToggleHighlight}
            onOpenHistory={handleOpenHistory}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
          {storyBibleActive && activeProject ? (
            <NovelStoryBibleWorkspace
              project={activeProject}
              onUpdateProject={updateActiveProject}
              charactersDoc={charactersDoc}
              hasCharactersJson={hasCharactersJson}
              updateCharacters={updateCharacters}
              saveMigratedCharacters={saveMigratedCharacters}
            />
          ) : (
            <>
              <NovelFormatToolbar
                editor={editor}
                textAlign={typographySettings.textAlign}
                onTextAlignChange={(align) => updateTypographySettings({ textAlign: align })}
                lineHeight={typographySettings.lineHeight}
                onLineHeightChange={(lh) => updateTypographySettings({ lineHeight: lh })}
                paragraphSpacing={typographySettings.paragraphSpacing}
                onParagraphSpacingChange={(spacing) => updateTypographySettings({ paragraphSpacing: spacing })}
                firstLineIndent={typographySettings.firstLineIndent}
                onFirstLineIndentChange={(indent) => updateTypographySettings({ firstLineIndent: indent })}
                selectedFont={typographySettings.editorFont}
                onFontChange={(font) => updateTypographySettings({ editorFont: font })}
                fontSize={typographySettings.fontSize}
                onFontSizeChange={(size) => updateTypographySettings({ fontSize: size })}
                pageWidth={typographySettings.pageWidth}
                onPageWidthChange={(width) => updateTypographySettings({ pageWidth: width })}
                indentStyle={typographySettings.indentStyle}
                onIndentStyleChange={(style) => updateTypographySettings({ indentStyle: style })}
                sceneDivider={typographySettings.sceneDivider}
                onSceneDividerChange={(divider) => updateTypographySettings({ sceneDivider: divider })}
              />
              <NovelEditorWorkspace
                activeChapter={activeChapter}
                editor={editor}
                onTitleChange={handleTitleChange}
                onCreateChapter={handleCreateChapter}
                selectedFont={typographySettings.editorFont}
                textAlign={typographySettings.textAlign}
                lineHeight={typographySettings.lineHeight}
                paragraphSpacing={typographySettings.paragraphSpacing}
                firstLineIndent={typographySettings.firstLineIndent}
                fontSize={typographySettings.fontSize}
                pageWidth={typographySettings.pageWidth}
                sceneDivider={typographySettings.sceneDivider}
              />
            </>
          )}
        </main>

        {rightPanelOpen && (
          <NovelRightPanel
            tab={rightTab}
            onTabChange={setRightTab}
            onClose={() => setRightPanelOpen(false)}
            selectionText={selectionText}
            assistantLoading={assistantLoading}
            assistantError={assistantError}
            assistantResult={assistantResult}
            assistantMode={assistantMode}
            onRunAssistant={runAssistant}
            onApplyAssistant={applyAssistant}
            onCancelAssistant={cancelAssistant}
            userInstruction={userInstruction}
            onUserInstructionChange={setUserInstruction}
            expandMode={expandMode}
            onExpandModeChange={setExpandMode}
            onOpenSettings={() => setSettingsOpen(true)}
            estimatedTokens={estimatedTokens}
            isAiConfigured={!!activeProject?.ai?.baseUrl}
            onStopAssistant={handleStopAssistant}
            activeChapterId={activeChapterId}
            activeChapter={activeChapter}
            loadSnapshots={loadSnapshots}
            triggerManualSnapshot={triggerManualSnapshot}
            getSnapshotContent={getSnapshotContent}
            triggerRestoreSnapshot={triggerRestoreSnapshot}
            triggerDeleteSnapshot={triggerDeleteSnapshot}
            activeChapterContinuity={activeChapterContinuity}
            precedingChapterContinuity={precedingChapterContinuity}
            updateActiveChapterContinuity={updateActiveChapterContinuity}
            updatePrecedingChapterContinuity={updatePrecedingChapterContinuity}
            isFirstChapter={(() => {
              if (!activeChapterId || chapters.length === 0) return false;
              const sorted = [...chapters].map((c) => c.id).sort((a, b) => a.localeCompare(b));
              return sorted[0] === activeChapterId;
            })()}
            chapters={chapters}
            chaptersWithContinuity={chaptersWithContinuity}
            editor={editor}
          />
        )}
      </div>

      {activeProject && (
        <NovelSettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          project={activeProject}
          onSave={updateActiveProject}
          onClearAll={handleClearAll}
        />
      )}
      <NovelCompileModal
        isOpen={compileModalOpen}
        onClose={() => setCompileModalOpen(false)}
        chapters={chapters}
        projectTitle={activeProject?.title || "My Novel"}
        onExportJson={exportJson}
      />
      {persistence.charactersDoc && (
        <CharacterHoverCard charactersDoc={persistence.charactersDoc} />
      )}
    </div>
  );
}
