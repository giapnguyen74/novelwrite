"use client";

import { useEffect, useState, useRef } from "react";
import { BookOpen, AlertCircle, RefreshCw, CheckCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  activeChapterId: string | null;
  activeChapterContinuity: string | null;
  precedingChapterContinuity: string | null;
  updateActiveChapterContinuity: (content: string) => Promise<void>;
  onRunAssistant: (feature: "summarize" | "checkContinuity") => void;
  assistantLoading: boolean;
  isFirstChapter: boolean;
};

const CONTINUITY_TEMPLATE = `# Continuity

## Summary
- [Key event 1]
- [Key event 2]

## Characters State
- Character A: [Current location, emotion, status]
- Character B: [Current location, emotion, status]

## Reader Knowledge
- What the reader knows: [Details revealed so far]
- What is still secret: [Mysteries unresolved]

## Open Threads & Constraints
- [Thread 1]
- [Thread 2]
`;

export function NovelContinuityTab({
  activeChapterId,
  activeChapterContinuity,
  precedingChapterContinuity,
  updateActiveChapterContinuity,
  onRunAssistant,
  assistantLoading,
  isFirstChapter,
}: Props) {
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state from persistence layer
  useEffect(() => {
    if (activeChapterContinuity !== null) {
      setContent(activeChapterContinuity || CONTINUITY_TEMPLATE);
    } else {
      setContent(CONTINUITY_TEMPLATE);
    }
  }, [activeChapterContinuity]);

  // Debounced auto-save
  const handleChange = (val: string) => {
    setContent(val);
    setSaveStatus("saving");

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await updateActiveChapterContinuity(val);
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((current) => (current === "saved" ? "idle" : current));
      }, 2000);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!activeChapterId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-400 h-full min-h-[300px]">
        <div className="rounded-full bg-purple-50 p-4 mb-4">
          <BookOpen size={32} className="text-purple-400" />
        </div>
        <h4 className="text-sm font-bold text-gray-700 mb-1">No Chapters Yet</h4>
        <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
          Create or import a chapter in the outline to begin planning story continuity.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-left animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Story Continuity</h3>
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium animate-pulse">
            <RefreshCw size={10} className="animate-spin" /> Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
            <CheckCircle size={10} /> Saved
          </span>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-gray-500">
        Document the narrative state of your novel **after** this chapter. The AI reads this file to prevent plot and character contradictions in the next chapter.
      </p>

      {/* Action buttons grid */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onRunAssistant("summarize")}
          disabled={assistantLoading}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Summarize the active chapter to establish continuity memory"
        >
          {assistantLoading ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <BookOpen size={12} />
          )}
          Generate Continuity
        </button>

        {!isFirstChapter && (
          <button
            type="button"
            onClick={() => onRunAssistant("checkContinuity")}
            disabled={assistantLoading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/50 py-2.5 text-xs font-semibold text-purple-700 shadow-sm transition-all hover:bg-purple-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Verify active chapter consistency against the preceding continuity"
          >
            {assistantLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Search size={12} />
            )}
            Verify Chapter
          </button>
        )}
      </div>

      {/* Markdown template editor */}
      <div className="flex-1 flex flex-col text-left">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
          Active Continuity Draft (Markdown)
        </label>
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Narrative state after this chapter..."
          className="w-full flex-1 min-h-[220px] rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none resize-none leading-relaxed bg-gray-50/10 focus:bg-white transition-colors"
        />
      </div>
    </div>
  );
}
