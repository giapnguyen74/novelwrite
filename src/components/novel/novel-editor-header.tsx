import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import {
  Check,
  Clock,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Redo,
  RefreshCcw,
  Undo,
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
};

export function NovelEditorHeader({
  editor,
  leftPanelOpen,
  onOpenLeft,
  rightPanelOpen,
  onOpenRight,
  wordCount,
  isSaving,
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
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100"
          {...SOON}
          aria-label="More options (coming soon)"
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100"
          {...SOON}
          aria-label="Comments (coming soon)"
        >
          <MessageSquare size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100"
          {...SOON}
          aria-label="History (coming soon)"
        >
          <Clock size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="rounded-md p-1 transition-colors hover:bg-gray-100"
          {...SOON}
          aria-label="Fullscreen (coming soon)"
        >
          <Maximize2 size={18} aria-hidden />
        </button>
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
