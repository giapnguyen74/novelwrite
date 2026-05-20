"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  PanelRightClose,
  Settings,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  X,
  Type,
  Maximize2,
  Minimize2,
  MessageSquare,
  Search,
  BookOpen,
  User,
  Plus,
  AlertCircle,
  Compass,
  Zap,
  RotateCcw,
  Brain,
  Target,
  Wind,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

import type { BeatType } from "@/types/beats";

export type RightPanelTab = "assistant" | "history" | "notes" | "continuity";

import type { Chapter } from "@/types/novel";

export type AssistantFeature =
  | "rewrite"
  | "expand"
  | "tighten"
  | "improveDialogue"
  | "checkContinuity"
  | "styleCapture"
  | "characterCapture"
  | "summarize"
  | "write";

import { NovelHistoryTab } from "./novel-history-tab";
import { NovelContinuityTab } from "./novel-continuity-tab";

type Props = {
  tab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  onClose: () => void;
  selectionText: string;

  // Assistant states
  assistantLoading: boolean;
  assistantError: string | null;
  assistantResult: string | null;
  assistantMode: AssistantFeature | null;

  // Actions
  onRunAssistant: (feature: AssistantFeature) => void;
  onApplyAssistant: () => void;
  onCancelAssistant: () => void;

  // Inputs
  userInstruction: string;
  onUserInstructionChange: (val: string) => void;

  // Mode for expand
  expandMode: "replace" | "append";
  onExpandModeChange: (mode: "replace" | "append") => void;

  onOpenSettings?: () => void;
  estimatedTokens?: number;
  isAiConfigured?: boolean;
  onStopAssistant?: () => void;

  // History callbacks
  activeChapterId: string | null;
  activeChapter: any | null;
  loadSnapshots: (path: string) => Promise<any[]>;
  triggerManualSnapshot: (path: string, label?: string) => Promise<string | null>;
  getSnapshotContent: (path: string, timestamp: string) => Promise<string | null>;
  triggerRestoreSnapshot: (path: string, timestamp: string) => Promise<boolean>;
  triggerDeleteSnapshot: (path: string, timestamp: string) => Promise<boolean>;

  // Continuity bindings
  activeChapterContinuity: string | null;
  precedingChapterContinuity: string | null;
  updateActiveChapterContinuity: (content: string) => Promise<void>;
  updatePrecedingChapterContinuity: (content: string) => Promise<void>;
  isFirstChapter?: boolean;
  chapters?: Chapter[];
  chaptersWithContinuity?: string[];
  editor?: any | null;
};

const SOON = { disabled: true, title: "Coming soon" } as const;

export function NovelRightPanel({
  tab,
  onTabChange,
  onClose,
  selectionText,
  assistantLoading,
  assistantError,
  assistantResult,
  assistantMode,
  onRunAssistant,
  onApplyAssistant,
  onCancelAssistant,
  userInstruction,
  onUserInstructionChange,
  expandMode,
  onExpandModeChange,
  onOpenSettings,
  estimatedTokens = 0,
  isAiConfigured = false,
  onStopAssistant,
  activeChapterId,
  activeChapter,
  loadSnapshots,
  triggerManualSnapshot,
  getSnapshotContent,
  triggerRestoreSnapshot,
  triggerDeleteSnapshot,
  activeChapterContinuity,
  precedingChapterContinuity,
  updateActiveChapterContinuity,
  updatePrecedingChapterContinuity,
  isFirstChapter = false,
  chapters = [],
  chaptersWithContinuity = [],
  editor = null,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"prose" | "capture" | "continue">("prose");
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  const handleGenerateAllPending = async () => {
    const pendingBeats = beats.filter(b => b.status === "pending");
    if (pendingBeats.length === 0 || !editor) return;

    setIsBulkGenerating(true);

    for (let i = 0; i < pendingBeats.length; i++) {
      const beat = pendingBeats[i];
      setBulkProgress(`Beat ${i + 1} of ${pendingBeats.length}...`);

      await new Promise<void>((resolve) => {
        let currentPos = -1;
        let currentNode: any = null;
        editor.state.doc.descendants((n: any, p: number) => {
          if (n.type.name === "beatAnchor" && n.attrs.id === beat.id) {
            currentPos = p;
            currentNode = n;
          }
        });

        if (currentPos === -1 || !currentNode) {
          resolve();
          return;
        }

        const precedingText = editor.state.doc.textBetween(0, currentPos, "\n");
        const followingText = editor.state.doc.textBetween(
          currentPos + currentNode.nodeSize,
          editor.state.doc.content.size,
          "\n"
        );

        window.dispatchEvent(
          new CustomEvent("novelwrite:generateBeat", {
            detail: {
              id: beat.id,
              beatType: beat.type,
              description: beat.description,
              precedingText,
              followingText,
              onStart: () => {},
              onSuccess: (generatedProse: string) => {
                editor
                  .chain()
                  .focus()
                  .insertContentAt(currentPos + currentNode.nodeSize, "\n\n" + generatedProse + "\n\n")
                  .run();

                const tr = editor.state.tr;
                let foundPos = -1;
                tr.doc.descendants((n: any, p: number) => {
                  if (n.type.name === "beatAnchor" && n.attrs.id === beat.id) {
                    foundPos = p;
                  }
                });
                if (foundPos !== -1) {
                  editor.view.dispatch(tr.setNodeMarkup(foundPos, undefined, {
                    ...currentNode.attrs,
                    status: "drafted"
                  }));
                }
                resolve();
              },
              onError: (errMsg: string) => {
                console.error(`Bulk generation failed for ${beat.id}:`, errMsg);
                resolve();
              },
            },
          })
        );
      });
    }

    setIsBulkGenerating(false);
    setBulkProgress("");
  };

  const precedingSummaryMissing = useMemo(() => {
    if (!activeChapterId || !chapters || chapters.length === 0) return false;
    const sorted = [...chapters].map((c) => c.id).sort((a, b) => a.localeCompare(b));
    const activeIndex = sorted.indexOf(activeChapterId);
    if (activeIndex > 0) {
      const prevChapterId = sorted[activeIndex - 1];
      return !chaptersWithContinuity.includes(prevChapterId);
    }
    return false;
  }, [activeChapterId, chapters, chaptersWithContinuity]);

  const beats = useMemo(() => {
    const list: {
      id: string;
      type: BeatType;
      description: string;
      status: "pending" | "drafted" | "done";
      pos: number;
    }[] = [];
    if (!editor || !editor.state) return list;

    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === "beatAnchor") {
        list.push({
          id: node.attrs.id,
          type: node.attrs.beatType || "guide",
          description: node.attrs.description || "",
          status: node.attrs.status || "pending",
          pos,
        });
      }
    });
    return list;
  }, [editor, activeChapter?.content]);

  // Compute metrics
  let totalBytes = 0;
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalBytes += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }
  }
  const storageLimit = 5 * 1024 * 1024; // 5MB limit
  const storagePercentage = Math.min((totalBytes / storageLimit) * 100, 100);
  const formattedStorage = (totalBytes / 1024).toFixed(1) + " KB";

  const contextBudget = 32768; // 32k tokens standard
  const contextPercentage = Math.min((estimatedTokens / contextBudget) * 100, 100);

  const handleCopy = async () => {
    if (!assistantResult) return;
    try {
      await navigator.clipboard.writeText(assistantResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const getActionLabel = (feature: AssistantFeature) => {
    switch (feature) {
      case "rewrite":
        return "Rewrite Selection";
      case "expand":
        return "Expand Selection";
      case "tighten":
        return "Tighten Prose";
      case "improveDialogue":
        return "Polish Dialogue";
      case "checkContinuity":
        return "Check Continuity";
      case "styleCapture":
        return "Style Capture";
      case "characterCapture":
        return "Capture Characters";
      case "summarize":
        return "Summarize Progress";
      case "write":
        return "Continue Writing";
    }
  };

  const getApplyButtonLabel = () => {
    if (!assistantMode) return "Apply to chapter";
    if (assistantMode === "styleCapture") return "Save to Style.md";
    if (assistantMode === "characterCapture") return "Save to Characters.md";
    if (assistantMode === "summarize") return "Save to Continuity";
    if (assistantMode === "checkContinuity") return "Ack / Close";
    return "Apply to chapter";
  };

  return (
    <aside className="flex w-[350px] shrink-0 flex-col gap-3 overflow-y-auto">
      {/* Tabs list */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange("assistant")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === "assistant"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            Assistant
          </button>
          <button
            type="button"
            onClick={() => onTabChange("continuity")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === "continuity"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            Continuity
          </button>
          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              tab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
            aria-label="History tab"
          >
            History
          </button>
          <button
            type="button"
            className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
            {...SOON}
            aria-label="Notes tab (coming soon)"
          >
            Notes
          </button>
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button
            type="button"
            className="text-gray-400 transition-colors hover:text-gray-600 cursor-pointer"
            onClick={onOpenSettings}
            aria-label="Assistant settings"
          >
            <Settings size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="text-gray-400 transition-colors hover:text-gray-600 cursor-pointer"
            onClick={onClose}
            aria-label="Hide assistant panel"
          >
            <PanelRightClose size={18} aria-hidden />
          </button>
        </div>
      </div>
      {tab === "assistant" && (
        <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm overflow-y-auto">
          <h3 className="text-center font-bold text-gray-800 shrink-0">AI Novel Assistant</h3>

          {precedingSummaryMissing && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs leading-normal text-amber-800 text-left animate-in fade-in duration-200 shrink-0">
              <span className="mt-0.5 shrink-0 text-amber-600 font-bold">⚠️</span>
              <div>
                <p className="text-[10px] mt-0.5 text-amber-700">
                  The preceding chapter has no continuity summary.
                </p>
              </div>
            </div>
          )}

          {/* Selection details */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-left text-sm text-gray-700">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Selected context
              </span>
              {selectionText.trim() ? (
                <span className="text-[10px] text-gray-400 font-medium">
                  {selectionText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              ) : (
                <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
                  Using full/cursor text
                </span>
              )}
            </div>
            {selectionText.trim() ? (
              <p className="max-h-20 overflow-y-auto whitespace-pre-wrap font-serif text-[0.85rem] leading-relaxed text-gray-600 italic pr-1">
                &ldquo;{selectionText}&rdquo;
              </p>
            ) : (
              <p className="text-gray-400 text-xs italic">No selection: Will run on chapter text or before cursor context.</p>
            )}
          </div>

          {/* User instructions field */}
          <div className="text-left">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Instructions / Guidance
            </label>
            <textarea
              value={userInstruction}
              onChange={(e) => onUserInstructionChange(e.target.value)}
              placeholder="e.g. Make it more suspenseful, describe the sound of thunder, keep sentences short..."
              disabled={assistantLoading}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Category Tabs for actions */}
          <div className="flex border-b border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory("prose")}
              className={cn(
                "flex-1 pb-2 font-bold transition-colors cursor-pointer",
                activeCategory === "prose" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Prose
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("capture")}
              className={cn(
                "flex-1 pb-2 font-bold transition-colors cursor-pointer",
                activeCategory === "capture" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Capture
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("continue")}
              className={cn(
                "flex-1 pb-2 font-bold transition-colors cursor-pointer",
                activeCategory === "continue" ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Write
            </button>
          </div>

          {/* Actions panel */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeCategory === "prose" && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onRunAssistant("rewrite")}
                  disabled={!selectionText.trim() || assistantLoading}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs font-semibold text-primary transition-all hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in"
                >
                  <Type size={16} />
                  Rewrite Selection
                </button>
                <button
                  type="button"
                  onClick={() => onRunAssistant("expand")}
                  disabled={!selectionText.trim() || assistantLoading}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs font-semibold text-primary transition-all hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in"
                >
                  <Maximize2 size={16} />
                  Expand Selection
                </button>
                <button
                  type="button"
                  onClick={() => onRunAssistant("tighten")}
                  disabled={!selectionText.trim() || assistantLoading}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs font-semibold text-primary transition-all hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in"
                >
                  <Minimize2 size={16} />
                  Tighten Prose
                </button>
                <button
                  type="button"
                  onClick={() => onRunAssistant("improveDialogue")}
                  disabled={!selectionText.trim() || assistantLoading}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs font-semibold text-primary transition-all hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in"
                >
                  <MessageSquare size={16} />
                  Polish Dialogue
                </button>
              </div>
            )}

            {activeCategory === "capture" && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onRunAssistant("styleCapture")}
                  disabled={!selectionText.trim() || assistantLoading}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs font-semibold text-primary transition-all hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in"
                >
                  <Sparkles size={16} />
                  Extract Style
                </button>
                <button
                  type="button"
                  onClick={() => onRunAssistant("characterCapture")}
                  disabled={!selectionText.trim() || assistantLoading}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-xs font-semibold text-primary transition-all hover:bg-purple-100/50 disabled:cursor-not-allowed disabled:opacity-40 animate-in fade-in"
                >
                  <User size={16} />
                  Capture Character
                </button>
              </div>
            )}



            {activeCategory === "continue" && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] leading-relaxed text-gray-500 mb-1">
                  Continue writing story prose naturally starting from the cursor or selection state, respecting the full Story Bible context.
                </p>
                <button
                  type="button"
                  onClick={() => onRunAssistant("write")}
                  disabled={assistantLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
                >
                  {assistantLoading && assistantMode === "write" ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Continue Writing
                </button>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {assistantLoading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-primary">
              <RefreshCw size={14} className="animate-spin" />
              <span>Generating response...</span>
              {onStopAssistant && (
                <button
                  type="button"
                  onClick={onStopAssistant}
                  className="ml-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-100 cursor-pointer"
                >
                  Stop
                </button>
              )}
            </div>
          )}

          {/* Error display */}
          {assistantError && (
            <div
              className="rounded-xl border border-red-100 bg-red-50 p-3 text-left text-xs leading-relaxed text-red-700"
              role="alert"
            >
              {assistantError}
            </div>
          )}

          {/* Results preview and apply panel */}
          {assistantResult && (
            <div className="mt-1 flex flex-col gap-3 rounded-xl border border-purple-100/50 bg-white p-4 text-left shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200 max-h-[280px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {getActionLabel(assistantMode!)} Output
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelAssistant}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    title="Clear response"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Output preview */}
              <div className="max-h-36 overflow-y-auto font-sans text-xs leading-relaxed text-gray-700 pr-1 space-y-2 border border-gray-100 bg-gray-50/30 rounded-xl p-3">
                <span
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(assistantResult) }}
                />
                {assistantLoading && <span className="streaming-caret" />}
              </div>

              {/* Option toggle for expand mode */}
              {assistantMode === "expand" && (
                <div className="flex flex-col gap-1.5 border-t border-gray-50 pt-2 text-xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Apply behavior
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onExpandModeChange("replace")}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium text-center transition-colors cursor-pointer",
                        expandMode === "replace"
                          ? "border-primary bg-purple-50 text-primary"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      Replace selection
                    </button>
                    <button
                      type="button"
                      onClick={() => onExpandModeChange("append")}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium text-center transition-colors cursor-pointer",
                        expandMode === "append"
                          ? "border-primary bg-purple-50 text-primary"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      Append after
                    </button>
                  </div>
                </div>
              )}

              {/* Operations */}
              <div className="flex gap-2 border-t border-gray-50 pt-3">
                <button
                  type="button"
                  onClick={() => onRunAssistant(assistantMode!)}
                  disabled={assistantLoading}
                  className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
                <button
                  type="button"
                  disabled={assistantLoading}
                  onClick={onApplyAssistant}
                  className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {getApplyButtonLabel()}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "history" && (
        <NovelHistoryTab
          activeChapterId={activeChapterId}
          activeChapter={activeChapter}
          loadSnapshots={loadSnapshots}
          triggerManualSnapshot={triggerManualSnapshot}
          getSnapshotContent={getSnapshotContent}
          triggerRestoreSnapshot={triggerRestoreSnapshot}
          triggerDeleteSnapshot={triggerDeleteSnapshot}
        />
      )}
      {tab === "continuity" && (
        <NovelContinuityTab
          activeChapterId={activeChapterId}
          activeChapterContinuity={activeChapterContinuity}
          precedingChapterContinuity={precedingChapterContinuity}
          updateActiveChapterContinuity={updateActiveChapterContinuity}
          onRunAssistant={onRunAssistant as any}
          assistantLoading={assistantLoading}
          isFirstChapter={isFirstChapter}
        />
      )}
    </aside>
  );
}

function renderMarkdown(md: string): string {
  if (!md) return "";
  // Escape HTML entities to prevent XSS
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Headers
  html = html.replace(/^### (.*?)$/gm, "<h4 class='text-[11px] font-bold text-gray-900 mt-2 mb-0.5 uppercase tracking-wider'>$1</h4>");
  html = html.replace(/^## (.*?)$/gm, "<h3 class='text-xs font-bold text-gray-950 mt-3 mb-1 border-b border-gray-100 pb-0.5'>$1</h3>");
  html = html.replace(/^# (.*?)$/gm, "<h2 class='text-sm font-bold text-gray-950 mt-4 mb-1.5'>$1</h2>");

  // Lists
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, "<li class='ml-3 list-disc text-gray-600 my-0.5'>$1</li>");
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, "<li class='ml-3 list-decimal text-gray-600 my-0.5'>$1</li>");

  // Paragraphs
  const paragraphs = html.split(/\n\n+/);
  return paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<li") || trimmed.startsWith("<h")) {
        return trimmed;
      }
      return `<p class="text-gray-600 mb-1 leading-normal">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

const BEAT_ITEM_CONFIGS: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<any>;
    colorClass: string;
    bgClass: string;
    textClass: string;
  }
> = {
  guide: { label: "Guide", icon: Compass, colorClass: "from-indigo-500 to-cyan-500", bgClass: "bg-indigo-50/50 dark:bg-indigo-950/10", textClass: "text-indigo-600 dark:text-indigo-400" },
  action: { label: "Action", icon: Zap, colorClass: "from-amber-500 to-orange-500", bgClass: "bg-amber-50/50 dark:bg-amber-950/10", textClass: "text-amber-600 dark:text-amber-400" },
  reaction: { label: "Reaction", icon: RotateCcw, colorClass: "from-orange-500 to-red-500", bgClass: "bg-orange-50/50 dark:bg-orange-950/10", textClass: "text-orange-600 dark:text-orange-400" },
  dialogue: { label: "Dialogue", icon: MessageSquare, colorClass: "from-blue-500 to-indigo-500", bgClass: "bg-blue-50/50 dark:bg-blue-950/10", textClass: "text-blue-600 dark:text-blue-400" },
  realization: { label: "Realization", icon: Brain, colorClass: "from-purple-500 to-pink-500", bgClass: "bg-purple-50/50 dark:bg-purple-950/10", textClass: "text-purple-600 dark:text-purple-400" },
  decision: { label: "Decision", icon: Target, colorClass: "from-emerald-500 to-teal-500", bgClass: "bg-emerald-50/50 dark:bg-emerald-950/10", textClass: "text-emerald-600 dark:text-emerald-400" },
  transition: { label: "Transition", icon: Wind, colorClass: "from-gray-500 to-slate-500", bgClass: "bg-gray-50/50 dark:bg-gray-950/10", textClass: "text-gray-600 dark:text-gray-400" },
};

