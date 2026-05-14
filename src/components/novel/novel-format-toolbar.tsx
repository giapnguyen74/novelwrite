import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import { ChevronDown, List, ListOrdered, PenTool } from "lucide-react";

const SOON = { disabled: true, title: "Coming soon" } as const;

type Props = {
  editor: Editor | null;
};

export function NovelFormatToolbar({ editor }: Props) {
  return (
    <div className="flex h-12 items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-gray-100 px-4 text-gray-600">
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-gray-900"
        {...SOON}
        aria-label="Paragraph style (coming soon)"
      >
        Paragraph <ChevronDown size={14} className="ml-1" aria-hidden />
      </button>

      <div className="h-4 w-px bg-gray-200" aria-hidden />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(
            "rounded-md p-1.5 font-serif font-bold transition-colors",
            editor?.isActive("bold")
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Bold"
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn(
            "rounded-md p-1.5 font-serif italic transition-colors",
            editor?.isActive("italic")
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Italic"
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={cn(
            "rounded-md p-1.5 font-serif underline transition-colors",
            editor?.isActive("underline")
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Underline"
          aria-label="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={cn(
            "rounded-md p-1.5 font-serif line-through transition-colors",
            editor?.isActive("strike")
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          S
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200" aria-hidden />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("bulletList")
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Bulleted list"
          aria-label="Bulleted list"
        >
          <List size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("orderedList")
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered size={18} aria-hidden />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200" aria-hidden />

      <div className="flex items-center gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("heading", { level: 1 })
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Heading 1"
          aria-label="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("heading", { level: 2 })
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Heading 2"
          aria-label="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("heading", { level: 3 })
              ? "bg-purple-100 text-primary"
              : "hover:bg-gray-100"
          )}
          title="Heading 3"
          aria-label="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
        {...SOON}
        aria-label="Annotation tools (coming soon)"
      >
        <PenTool size={18} aria-hidden />
      </button>
    </div>
  );
}
