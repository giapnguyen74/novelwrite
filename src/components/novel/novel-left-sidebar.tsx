import { cn } from "@/lib/utils";
import type { Chapter } from "@/types/novel";
import {
  ChevronDown,
  Feather,
  PanelLeftClose,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useRef } from "react";

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
}: Props) {
  const importRef = useRef<HTMLInputElement>(null);

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
          <Feather className="h-6 w-6 fill-primary/20 text-primary" aria-hidden />
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
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-2.5 transition-colors hover:border-gray-300"
          {...SOON}
          aria-label="Project switcher (coming soon)"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="rounded-md bg-purple-100 p-1.5 text-primary">
              <Feather size={14} aria-hidden />
            </span>
            My First Project
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
              </div>
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
        <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="rounded-md bg-purple-100 p-1.5 text-primary">
                <Feather size={14} aria-hidden />
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
                "h-5 w-10 rounded-full p-0.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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
          <p className="text-xs leading-relaxed text-gray-500">
            Keep character notes, outline beats, and world rules here so the
            assistant can stay consistent with your story.
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-2 px-2 text-sm font-medium text-gray-500 transition-colors hover:text-red-600"
        >
          <Trash2 size={16} aria-hidden /> Clear All Data
        </button>
      </div>
    </aside>
  );
}
