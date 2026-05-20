import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import {
  Check,
  Clock,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
  Redo,
  RefreshCcw,
  Undo,
  Users,
} from "lucide-react";

const SOON = { disabled: true, title: "Coming soon" } as const;

type Props = {
  editor: Editor | null;
  leftPanelOpen: boolean;
  onOpenLeft: () => void;
  rightPanelOpen: boolean;
  onOpenRight: () => void;
  wordCount: number;
  isSaving: boolean;
  highlightEnabled?: boolean;
  onToggleHighlight?: () => void;
  onOpenHistory?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export function NovelEditorHeader({
  editor,
  leftPanelOpen,
  onOpenLeft,
  rightPanelOpen,
  onOpenRight,
  wordCount,
  isSaving,
  highlightEnabled = true,
  onToggleHighlight,
  onOpenHistory,
  isFullscreen = false,
  onToggleFullscreen,
}: Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-100 px-4 text-gray-500">
      <div className="flex items-center gap-3">
        {!leftPanelOpen && (
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100"
            onClick={onOpenLeft}
            aria-label="Show outline panel"
          >
            <PanelLeft size={18} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100 disabled:opacity-40"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          title="Undo"
          aria-label="Undo"
        >
          <Undo size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100 disabled:opacity-40"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          title="Redo"
          aria-label="Redo"
        >
          <Redo size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100"
          {...SOON}
          aria-label="Refresh (coming soon)"
        >
          <RefreshCcw size={18} aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs font-medium">
        <button
          type="button"
          onClick={onToggleHighlight}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer",
            highlightEnabled
              ? "border-purple-100 bg-purple-50/50 text-primary hover:bg-purple-100/50 shadow-sm"
              : "border-gray-100 bg-gray-50/50 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          )}
          title={highlightEnabled ? "Character highlighting active" : "Highlighting disabled"}
        >
          <Users size={13} />
          <span>Cast</span>
        </button>

        <span>Words: {wordCount}</span>
        <span
          className={cn(
            "flex items-center gap-1 transition-colors",
            isSaving ? "text-gray-400" : "text-green-600"
          )}
        >
          {isSaving ? "Saving..." : "Saved"}{" "}
          {!isSaving && <Check size={14} aria-hidden />}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {onOpenHistory && (
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            onClick={onOpenHistory}
            title="Open History Snapshots"
            aria-label="Open History"
          >
            <Clock size={18} aria-hidden />
          </button>
        )}
        {onToggleFullscreen && (
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
          </button>
        )}
        {!rightPanelOpen && (
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100"
            onClick={onOpenRight}
            aria-label="Show assistant panel"
          >
            <PanelRight size={18} aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}
