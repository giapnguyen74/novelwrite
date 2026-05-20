import { EditorContent, type Editor } from "@tiptap/react";
import type { Chapter } from "@/types/novel";
import type { FontSize, PageWidth, SceneDivider } from "./novel-format-toolbar";
import { NovelBrandIcon } from "./novel-brand-icon";

type Props = {
  activeChapter: Chapter | null;
  editor: Editor | null;
  onTitleChange: (title: string) => void;
  onCreateChapter: () => void;
  selectedFont?: string;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: "1.0" | "1.15" | "1.5" | "2.0";
  paragraphSpacing: "none" | "small" | "medium" | "large";
  firstLineIndent: boolean;
  fontSize?: FontSize;
  pageWidth?: PageWidth;
  sceneDivider?: SceneDivider;
};

export function NovelEditorWorkspace({
  activeChapter,
  editor,
  onTitleChange,
  onCreateChapter,
  selectedFont = "merriweather",
  textAlign,
  lineHeight,
  paragraphSpacing,
  firstLineIndent,
  fontSize = "normal",
  pageWidth = "normal",
  sceneDivider = "none",
}: Props) {
  if (!activeChapter) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
        <NovelBrandIcon size={48} className="mb-4 opacity-20 text-gray-400" />
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

  const fontClass = selectedFont === "lora"
    ? "font-lora"
    : selectedFont === "garamond"
    ? "font-garamond"
    : selectedFont === "sans"
    ? "font-sans-geist"
    : selectedFont === "courier"
    ? "font-courier"
    : "font-merriweather";

  // Convert spacing types to margins
  const spacingMargin =
    paragraphSpacing === "none"
      ? "0px"
      : paragraphSpacing === "small"
      ? "8px"
      : paragraphSpacing === "medium"
      ? "16px"
      : "24px";

  // Convert line height spacing values
  const lineHeightValue =
    lineHeight === "1.0"
      ? "1.2"
      : lineHeight === "1.15"
      ? "1.35"
      : lineHeight === "1.5"
      ? "1.65"
      : "2.1";

  // Font size map
  const fontSizeValue: Record<FontSize, string> = {
    small: "0.95rem",
    normal: "1.1rem",
    large: "1.2rem",
    xlarge: "1.35rem",
  };

  // Page width map (max-width of content area)
  const pageMaxWidth: Record<PageWidth, string> = {
    narrow: "42rem",
    normal: "56rem",
    wide: "72rem",
  };

  // Compute standard book first-line indents
  const indentStyle = firstLineIndent
    ? `
      .ProseMirror p {
        text-indent: 2em;
        margin-bottom: 0px !important;
      }
      .ProseMirror p:first-of-type,
      .ProseMirror h1 + p,
      .ProseMirror h2 + p,
      .ProseMirror h3 + p,
      .ProseMirror blockquote + p {
        text-indent: 0 !important;
      }
    `
    : `
      .ProseMirror p {
        margin-bottom: ${spacingMargin} !important;
      }
    `;

  let dividerStyle = "";
  if (sceneDivider === "asterisks") {
    dividerStyle = `
      .ProseMirror hr {
        border: none;
        text-align: center;
        height: auto;
        margin: 28px 0;
      }
      .ProseMirror hr::after {
        content: "* * *";
        font-family: inherit;
        font-size: 1.25rem;
        font-weight: bold;
        color: #4b5563;
        letter-spacing: 0.6em;
        padding-left: 0.6em;
        display: block;
        text-align: center;
      }
    `;
  } else if (sceneDivider === "boxes") {
    dividerStyle = `
      .ProseMirror hr {
        border: none;
        text-align: center;
        height: auto;
        margin: 28px 0;
      }
      .ProseMirror hr::after {
        content: "■  ■  ■";
        font-family: inherit;
        font-size: 0.85rem;
        color: #4b5563;
        letter-spacing: 0.8em;
        padding-left: 0.8em;
        display: block;
        text-align: center;
      }
    `;
  } else if (sceneDivider === "line") {
    dividerStyle = `
      .ProseMirror hr {
        border: none;
        border-top: 1.5px solid #e5e7eb;
        height: 0;
        margin: 28px auto;
        width: 60%;
      }
    `;
  } else {
    dividerStyle = `
      .ProseMirror hr {
        border: none;
        border-top: 1px dashed transparent;
        height: 12px;
        margin: 20px 0;
      }
    `;
  }

  return (
    <div className={`flex-1 overflow-y-auto p-6 lg:p-8 xl:px-12 ${fontClass}`}>
      {/* Scoped manuscript dynamic formatting styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror {
          text-align: ${textAlign} !important;
          font-size: ${fontSizeValue[fontSize]} !important;
        }
        .ProseMirror p, .ProseMirror li {
          line-height: ${lineHeightValue} !important;
        }
        ${indentStyle}
        ${dividerStyle}
      `}} />

      <div
        className="mx-auto flex h-full flex-col"
        style={{ maxWidth: pageMaxWidth[pageWidth] }}
      >
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
  );
}
