import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useEditor, type Editor, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import type { Chapter } from "@/types/novel";
import { characterHighlightKey, characterHighlightPlugin } from "@/lib/editor/character-highlight";
import { buildCharacterIndex, parseCharactersFromMarkdown, type CharacterIndex } from "@/lib/editor/character-index";
import { BeatAnchorExtension } from "@/lib/editor/beat-anchor-extension";

/** 
 * StarterKit v3 already registers Underline; however, tiptap-markdown v0.9 
 * also registers it, causing a duplicate extension warning. 
 * We explicitly disable it in StarterKit to resolve the collision.
 */
const TIPTAP_EXTENSIONS = [
  StarterKit.configure({
    underline: false,
  }),
  Markdown,
  BeatAnchorExtension,
];

const CharacterHighlightExtension = Extension.create<{
  getIndex: () => CharacterIndex | null;
  getEnabled: () => boolean;
}>({
  name: "characterHighlight",
  addProseMirrorPlugins() {
    return [
      characterHighlightPlugin(
        this.options.getIndex,
        this.options.getEnabled
      ),
    ];
  },
});

type MarkdownEditorStorage = {
  markdown?: { getMarkdown: () => string };
};

function getMarkdown(editor: Editor): string {
  const storage = editor.storage as MarkdownEditorStorage;
  return storage.markdown?.getMarkdown() ?? "";
}

export type EditorSelectionRange = {
  from: number;
  to: number;
  text: string;
};

type UseNovelEditorArgs = {
  activeChapter: Chapter | null;
  activeChapterId: string | null;
  onMarkdownChange: (markdown: string) => void;
  onSelectionChange: (selection: EditorSelectionRange | null) => void;
  charactersMd: string;
  highlightEnabled: boolean;
};

export function useNovelEditor({
  activeChapter,
  activeChapterId,
  onMarkdownChange,
  onSelectionChange,
  charactersMd,
  highlightEnabled,
}: UseNovelEditorArgs) {
  const onMarkdownRef = useRef(onMarkdownChange);
  const onSelectionRef = useRef(onSelectionChange);

  const indexRef = useRef<CharacterIndex | null>(null);
  const enabledRef = useRef<boolean>(highlightEnabled);

  useLayoutEffect(() => {
    onMarkdownRef.current = onMarkdownChange;
    onSelectionRef.current = onSelectionChange;
  }, [onMarkdownChange, onSelectionChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...TIPTAP_EXTENSIONS,
      CharacterHighlightExtension.configure({
        getIndex: () => indexRef.current,
        getEnabled: () => enabledRef.current,
      }),
    ],
    content: activeChapter?.content ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-stone mx-auto w-full h-full min-h-[500px] outline-none text-[1.1rem] leading-relaxed text-gray-800 bg-transparent placeholder-gray-300 pb-20 focus:outline-none max-w-none prose-p:my-0 prose-p:indent-8 prose-headings:mt-6 prose-headings:mb-4",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = getMarkdown(editor);
      onMarkdownRef.current(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        onSelectionRef.current(null);
        return;
      }
      onSelectionRef.current({
        from,
        to,
        text: editor.state.doc.textBetween(from, to, "\n"),
      });
    },
  });

  const replaceSelectionAt = useCallback(
    (from: number, to: number, text: string): boolean => {
      if (!editor || from > to) return false;
      return editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, text)
        .run();
    },
    [editor]
  );

  const refreshDecorations = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const { state, view } = editor;
    const tr = state.tr.setMeta(characterHighlightKey, true);
    view.dispatch(tr);
  }, [editor]);

  // Update indices and trigger decoration rebuilds on Characters list or toggle state changes
  useEffect(() => {
    enabledRef.current = highlightEnabled;
    const parsed = parseCharactersFromMarkdown(charactersMd);
    indexRef.current = buildCharacterIndex(parsed);
    refreshDecorations();
  }, [charactersMd, highlightEnabled, refreshDecorations]);

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

  return { editor, replaceSelectionAt };
}
