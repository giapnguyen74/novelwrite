import { EditorContent, type Editor } from "@tiptap/react";
import type { Chapter } from "@/types/novel";
import { Feather, MessageSquare, MoreHorizontal, Sparkles } from "lucide-react";

const SOON = { disabled: true, title: "Coming soon" } as const;

type Props = {
  activeChapter: Chapter | null;
  editor: Editor | null;
  onTitleChange: (title: string) => void;
  onCreateChapter: () => void;
};

export function NovelEditorWorkspace({
  activeChapter,
  editor,
  onTitleChange,
  onCreateChapter,
}: Props) {
  if (!activeChapter) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
        <Feather size={48} className="mb-4 opacity-20" aria-hidden />
        <p>No chapter selected</p>
        <button
          type="button"
          onClick={onCreateChapter}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          Create Chapter
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 xl:px-32">
        <div className="mx-auto flex h-full max-w-3xl flex-col">
          <label className="sr-only" htmlFor="novel-chapter-title">
            Chapter title
          </label>
          <input
            id="novel-chapter-title"
            type="text"
            value={activeChapter.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="mb-6 w-full bg-transparent font-serif text-3xl font-bold tracking-tight text-gray-900 outline-none placeholder:text-gray-300"
            placeholder="Chapter Title"
          />
          <EditorContent editor={editor} className="w-full flex-1" />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-gray-100 bg-white px-2 py-1.5 shadow-lg">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-purple-100"
          {...SOON}
          aria-label="AI write (coming soon)"
        >
          <Sparkles size={16} aria-hidden /> Write
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          {...SOON}
          aria-label="Describe (coming soon)"
        >
          <MessageSquare size={16} aria-hidden /> Describe
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          {...SOON}
          aria-label="Brainstorm (coming soon)"
        >
          <Sparkles size={16} aria-hidden /> Brainstorm
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
          {...SOON}
          aria-label="More AI actions (coming soon)"
        >
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </div>
    </>
  );
}
