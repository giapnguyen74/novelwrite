"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";
import { 
  Bold, 
  Italic, 
  List, 
  Heading1, 
  Heading2, 
  Undo, 
  Redo, 
  Strikethrough
} from "lucide-react";

type Props = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
};

const TIPTAP_EXTENSIONS = [
  StarterKit.configure({
    underline: false,
  }),
  Markdown,
];

export function NovelBibleEditor({ content, onChange, placeholder, readOnly = false }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: TIPTAP_EXTENSIONS,
    content: content || "",
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-stone max-w-none focus:outline-none p-6 min-h-[300px] overflow-y-auto max-h-[500px] font-sans leading-relaxed text-gray-700 bg-gray-50/10 focus:bg-white transition-colors",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown?.getMarkdown() ?? "";
      onChangeRef.current(markdown);
    },
  });

  // Track editable state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  // Track outer content updates
  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = (editor.storage as any).markdown?.getMarkdown() ?? "";
    if (content !== currentMarkdown) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner h-full">
      {/* Visual Formatter Menu Bar (hidden in read-only mode) */}
      {!readOnly && (
        <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50/60 p-2 text-gray-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors hover:bg-gray-200 cursor-pointer ${
            editor.isActive("bold") ? "bg-purple-100 text-primary font-bold" : ""
          }`}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors hover:bg-gray-200 cursor-pointer ${
            editor.isActive("italic") ? "bg-purple-100 text-primary font-bold" : ""
          }`}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors hover:bg-gray-200 cursor-pointer ${
            editor.isActive("strike") ? "bg-purple-100 text-primary font-bold" : ""
          }`}
          title="Strike"
        >
          <Strikethrough size={15} />
        </button>
        
        <div className="h-4 w-px bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded transition-colors hover:bg-gray-200 cursor-pointer ${
            editor.isActive("heading", { level: 1 }) ? "bg-purple-100 text-primary font-bold" : ""
          }`}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition-colors hover:bg-gray-200 cursor-pointer ${
            editor.isActive("heading", { level: 2 }) ? "bg-purple-100 text-primary font-bold" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors hover:bg-gray-200 cursor-pointer ${
            editor.isActive("bulletList") ? "bg-purple-100 text-primary font-bold" : ""
          }`}
          title="Bullet List"
        >
          <List size={15} />
        </button>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded transition-colors hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
          title="Undo"
        >
          <Undo size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded transition-colors hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
          title="Redo"
        >
          <Redo size={15} />
        </button>
      </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}
