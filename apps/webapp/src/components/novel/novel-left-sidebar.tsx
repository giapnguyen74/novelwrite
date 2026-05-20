import { cn } from "@/lib/utils";
import type { Chapter } from "@/types/novel";
import {
  ChevronDown,
  Feather,
  PanelLeftClose,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import { NovelBrandIcon } from "./novel-brand-icon";

const SOON = { disabled: true, title: "Coming soon" } as const;

type Props = {
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onClose: () => void;
  onNewChapter: () => void;
  onDeleteChapter: (id: string, e: React.MouseEvent) => void;
  onExport: () => void;
  onImportFile: (file: File) => Promise<void>;
  storyBibleActive: boolean;
  onToggleStoryBible: () => void;
  onClearAll: () => void;
  onOpenSettings?: () => void;
  projectTitle?: string;
  estimatedTokens?: number;
  chaptersWithContinuity?: string[];
};

export function NovelLeftSidebar({
  chapters,
  activeChapterId,
  onSelectChapter,
  onClose,
  onNewChapter,
  onDeleteChapter,
  onExport,
  onImportFile,
  storyBibleActive,
  onToggleStoryBible,
  onClearAll,
  onOpenSettings,
  projectTitle,
  estimatedTokens = 0,
  chaptersWithContinuity = [],
}: Props) {
  const importRef = useRef<HTMLInputElement>(null);

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

  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await onImportFile(file);
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <NovelBrandIcon size={24} />
          <span className="text-lg font-bold tracking-tight">NovelWrite</span>
        </div>
        <button
          type="button"
          className="text-gray-400 transition-colors hover:text-gray-600"
          onClick={onClose}
          aria-label="Hide outline panel"
        >
          <PanelLeftClose size={18} aria-hidden />
        </button>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onNewChapter}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Plus size={18} aria-hidden /> New Chapter
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportChange}
          aria-hidden
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Import
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Export
          </button>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="mb-2 text-xs font-bold tracking-wider text-gray-400">
          PROJECT
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-2.5 transition-colors hover:border-gray-300 cursor-pointer"
          aria-label="Project settings"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="rounded-md bg-purple-100 p-1 text-primary">
              <NovelBrandIcon size={16} />
            </span>
            {projectTitle || "My First Project"}
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <ChevronDown size={16} aria-hidden />
            <Settings
              size={16}
              className="ml-1"
              aria-hidden
            />
          </div>
        </button>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="mb-2 text-xs font-bold tracking-wider text-gray-400">
          OUTLINE
        </div>
        <div className="space-y-1">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectChapter(chapter.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onSelectChapter(chapter.id);
                }
              }}
              className={cn(
                "group flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-sm transition-colors",
                activeChapterId === chapter.id
                  ? "bg-purple-50 font-medium text-primary"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    activeChapterId === chapter.id
                      ? "text-primary"
                      : "text-gray-400"
                  )}
                >
                  <Feather size={16} aria-hidden />
                </span>
                <span className="truncate">{chapter.title || "Untitled"}</span>
                {chaptersWithContinuity.includes(chapter.id) && (
                  <span className="text-purple-500 shrink-0" title="Narrative continuity established">
                    <Sparkles size={11} className="fill-purple-500/20" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {/* Beat Count Badge */}
                {(() => {
                  const { total, completed } = parseChapterBeatCounts(chapter.content);
                  if (total === 0) return null;
                  const isAllDone = total === completed;
                  return (
                    <span
                      title={`${completed} of ${total} beats completed`}
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-tight transition-colors shrink-0",
                        isAllDone
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {isAllDone ? `✓ ${completed}/${total}` : `${completed}/${total}`}
                    </span>
                  );
                })()}

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => onDeleteChapter(chapter.id, e)}
                    className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    aria-label={`Delete ${chapter.title || "Untitled"}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onNewChapter}
          className="mt-3 flex items-center gap-2 px-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
        >
          <Plus size={16} aria-hidden /> Add Chapter
        </button>
      </div>

      <div className="border-t border-gray-100 p-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-md bg-purple-100 p-1 text-primary">
                <NovelBrandIcon size={16} />
              </span>
              Story Bible
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={storyBibleActive}
              aria-label="Toggle Story Bible"
              onClick={onToggleStoryBible}
              className={cn(
                "h-5 w-10 rounded-full p-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer",
                storyBibleActive ? "bg-primary" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  storyBibleActive ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
          
          <div className="space-y-2.5 border-t border-gray-200/50 pt-2.5">
            {/* LLM Context Filled */}
            <div>
              <div className="mb-1 flex justify-between text-[10px] font-medium text-gray-500">
                <span>Context filled</span>
                <span className="font-semibold text-gray-700">
                  {Math.round(contextPercentage)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    contextPercentage > 85
                      ? "bg-red-500"
                      : contextPercentage > 60
                      ? "bg-yellow-500"
                      : "bg-purple-500"
                  )}
                  style={{ width: `${contextPercentage}%` }}
                />
              </div>
            </div>

            {/* LocalStorage Filled */}
            <div>
              <div className="mb-1 flex justify-between text-[10px] font-medium text-gray-500">
                <span>Storage filled</span>
                <span className="font-semibold text-gray-700">
                  {storagePercentage.toFixed(2)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    storagePercentage > 85
                      ? "bg-red-500"
                      : storagePercentage > 60
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  )}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function parseChapterBeatCounts(content: string): { total: number; completed: number } {
  if (!content) return { total: 0, completed: 0 };
  const beatRegex = /<beat\s+[^>]*>/gi;
  const statusRegex = /status="([^"]+)"/i;
  const matches = content.match(beatRegex) || [];
  let total = matches.length;
  let completed = 0;
  for (const match of matches) {
    const statusMatch = match.match(statusRegex);
    if (statusMatch && statusMatch[1] === "done") {
      completed++;
    }
  }
  return { total, completed };
}
