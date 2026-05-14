"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import UnderlineExtension from "@tiptap/extension-underline";
import type { Chapter } from "@/types/novel";

const TIPTAP_EXTENSIONS = [
  StarterKit,
  UnderlineExtension,
  Markdown,
];

type MarkdownEditorStorage = {
  markdown?: { getMarkdown: () => string };
};

function getMarkdown(editor: Editor): string {
  const storage = editor.storage as MarkdownEditorStorage;
  return storage.markdown?.getMarkdown() ?? "";
}

type UseNovelEditorArgs = {
  activeChapter: Chapter | null;
  activeChapterId: string | null;
  onMarkdownChange: (markdown: string) => void;
  onSelectionText: (text: string) => void;
};

export function useNovelEditor({
  activeChapter,
  activeChapterId,
  onMarkdownChange,
  onSelectionText,
}: UseNovelEditorArgs): Editor | null {
  const onMarkdownRef = useRef(onMarkdownChange);
  const onSelectionRef = useRef(onSelectionText);

  useLayoutEffect(() => {
    onMarkdownRef.current = onMarkdownChange;
    onSelectionRef.current = onSelectionText;
  }, [onMarkdownChange, onSelectionText]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: TIPTAP_EXTENSIONS,
    content: activeChapter?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-stone mx-auto w-full h-full min-h-[500px] outline-none font-serif text-[1.1rem] leading-relaxed text-gray-800 bg-transparent placeholder-gray-300 pb-20 focus:outline-none max-w-none prose-p:my-0 prose-p:indent-8 prose-headings:mt-6 prose-headings:mb-4",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = getMarkdown(editor);
      onMarkdownRef.current(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text =
        from === to ? "" : editor.state.doc.textBetween(from, to, "\n");
      onSelectionRef.current(text);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!activeChapterId) {
      editor.commands.clearContent(false);
    }
  }, [activeChapterId, editor]);

  useEffect(() => {
    if (!editor || !activeChapter) return;
    const currentMarkdown = getMarkdown(editor);
    if (currentMarkdown !== activeChapter.content) {
      editor.commands.setContent(activeChapter.content);
    }
    // Intentionally depend only on chapter id so typing does not reset the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterId, editor]);

  return editor;
}
