import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Editor } from "@tiptap/react";
import {
  ChevronDown,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
} from "lucide-react";

// ─── Small SVG icon helpers ───────────────────────────────────────────────────

/** Three horizontal bars at different vertical spacings to represent line-height */
function LineHeightIcon({ density }: { density: "compact" | "normal" | "relaxed" }) {
  const gap = density === "compact" ? 2 : density === "normal" ? 4 : 7;
  const lh = 2;
  const total = lh * 3 + gap * 2;
  const y0 = (16 - total) / 2;
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" fill="currentColor" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect key={i} x="2" y={y0 + i * (lh + gap)} width="14" height={lh} rx="1" />
      ))}
    </svg>
  );
}

/** Indented paragraph icons */
function IndentIcon({ style }: { style: "none" | "first" | "hanging" }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden>
      {style === "none" && (
        <>
          <rect x="1" y="2" width="18" height="2" rx="1" />
          <rect x="1" y="7" width="18" height="2" rx="1" />
          <rect x="1" y="12" width="18" height="2" rx="1" />
        </>
      )}
      {style === "first" && (
        <>
          <rect x="6" y="2" width="13" height="2" rx="1" />
          <rect x="1" y="7" width="18" height="2" rx="1" />
          <rect x="1" y="12" width="18" height="2" rx="1" />
        </>
      )}
      {style === "hanging" && (
        <>
          <rect x="1" y="2" width="18" height="2" rx="1" />
          <rect x="6" y="7" width="13" height="2" rx="1" />
          <rect x="6" y="12" width="13" height="2" rx="1" />
        </>
      )}
    </svg>
  );
}

/** Paragraph spacing icons */
function SpacingIcon({ size }: { size: "none" | "small" | "large" }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden>
      {size === "none" && (
        <>
          <rect x="1" y="2" width="18" height="2" rx="1" />
          <rect x="1" y="5" width="14" height="2" rx="1" />
          <rect x="1" y="8" width="18" height="2" rx="1" />
          <rect x="1" y="11" width="12" height="2" rx="1" />
        </>
      )}
      {size === "small" && (
        <>
          <rect x="1" y="1" width="18" height="2" rx="1" />
          <rect x="1" y="4" width="14" height="2" rx="1" />
          <rect x="1" y="9" width="18" height="2" rx="1" />
          <rect x="1" y="12" width="12" height="2" rx="1" />
        </>
      )}
      {size === "large" && (
        <>
          <rect x="1" y="1" width="18" height="2" rx="1" />
          <rect x="1" y="4" width="14" height="2" rx="1" />
          <rect x="1" y="11" width="18" height="2" rx="1" />
          <rect x="1" y="14" width="12" height="2" rx="1" />
        </>
      )}
    </svg>
  );
}

/** Page width icons */
function PageWidthIcon({ width }: { width: "narrow" | "normal" | "wide" }) {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="currentColor" aria-hidden>
      {width === "narrow" && (
        <>
          <rect x="1" y="1" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="5" y="4" width="10" height="1.5" rx="0.75" />
          <rect x="5" y="7" width="10" height="1.5" rx="0.75" />
          <rect x="5" y="10" width="7" height="1.5" rx="0.75" />
        </>
      )}
      {width === "normal" && (
        <>
          <rect x="1" y="1" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="4" width="14" height="1.5" rx="0.75" />
          <rect x="3" y="7" width="14" height="1.5" rx="0.75" />
          <rect x="3" y="10" width="10" height="1.5" rx="0.75" />
        </>
      )}
      {width === "wide" && (
        <>
          <rect x="1" y="1" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2" y="4" width="16" height="1.5" rx="0.75" />
          <rect x="2" y="7" width="16" height="1.5" rx="0.75" />
          <rect x="2" y="10" width="11" height="1.5" rx="0.75" />
        </>
      )}
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontSize = "small" | "normal" | "large" | "xlarge";
export type PageWidth = "narrow" | "normal" | "wide";
export type IndentStyle = "none" | "first" | "hanging";
export type SceneDivider = "none" | "asterisks" | "boxes" | "line";

type Props = {
  editor: Editor | null;
  textAlign: "left" | "center" | "right" | "justify";
  onTextAlignChange: (align: "left" | "center" | "right" | "justify") => void;
  lineHeight: "1.0" | "1.15" | "1.5" | "2.0";
  onLineHeightChange: (lh: "1.0" | "1.15" | "1.5" | "2.0") => void;
  paragraphSpacing: "none" | "small" | "medium" | "large";
  onParagraphSpacingChange: (spacing: "none" | "small" | "medium" | "large") => void;
  firstLineIndent: boolean;
  onFirstLineIndentChange: (indent: boolean) => void;
  // Typography panel extras
  selectedFont?: string;
  onFontChange?: (font: string) => void;
  fontSize?: FontSize;
  onFontSizeChange?: (size: FontSize) => void;
  pageWidth?: PageWidth;
  onPageWidthChange?: (width: PageWidth) => void;
  indentStyle?: IndentStyle;
  onIndentStyleChange?: (style: IndentStyle) => void;
  sceneDivider?: SceneDivider;
  onSceneDividerChange?: (divider: SceneDivider) => void;
};

// ─── Grouped button helper ────────────────────────────────────────────────────

function IconGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; icon: React.ReactNode; title: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      )}
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex items-center justify-center rounded-lg border p-1.5 transition-all cursor-pointer",
              value === opt.value
                ? "border-primary bg-purple-50 text-primary shadow-sm"
                : "border-gray-100 bg-gray-50/60 text-gray-500 hover:border-gray-200 hover:bg-gray-100/60"
            )}
          >
            {opt.icon}
            {value === opt.value && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                <Check size={7} className="text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const SOON = { disabled: true, title: "Coming soon" } as const;

export function NovelFormatToolbar({
  editor,
  textAlign,
  onTextAlignChange,
  lineHeight,
  onLineHeightChange,
  paragraphSpacing,
  onParagraphSpacingChange,
  firstLineIndent,
  onFirstLineIndentChange,
  selectedFont = "merriweather",
  onFontChange,
  fontSize = "normal",
  onFontSizeChange,
  pageWidth = "normal",
  onPageWidthChange,
  indentStyle = "none",
  onIndentStyleChange,
  sceneDivider = "none",
  onSceneDividerChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getActiveLabel = () => {
    if (!editor) return "Paragraph";
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor.isActive("blockquote")) return "Blockquote";
    return "Paragraph";
  };

  const fontSizeMap: Record<FontSize, string> = {
    small: "0.95rem",
    normal: "1.1rem",
    large: "1.2rem",
    xlarge: "1.35rem",
  };

  const FONT_OPTIONS = [
    { value: "merriweather", label: "Merriweather" },
    { value: "lora", label: "Lora" },
    { value: "garamond", label: "EB Garamond" },
    { value: "sans", label: "Geist Sans" },
    { value: "courier", label: "Courier Prime" },
  ];

  const SCENE_DIVIDER_OPTIONS: SceneDivider[] = ["none", "asterisks", "boxes", "line"];
  const sceneDividerLabel: Record<SceneDivider, string> = {
    none: "None",
    asterisks: "* * *",
    boxes: "Boxes",
    line: "Line",
  };

  return (
    <div className="flex h-12 items-center gap-4 overflow-visible whitespace-nowrap border-b border-gray-100 px-4 text-gray-600">
      {/* ── Paragraph / Typography button ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer",
            open && "bg-gray-50 border-gray-200"
          )}
          aria-label="Typography settings"
          aria-expanded={open}
        >
          <span className="text-gray-700">{getActiveLabel()}</span>
          <ChevronDown
            size={13}
            className={cn("text-gray-400 transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full z-50 mt-1.5 w-[340px] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
            role="dialog"
            aria-label="Typography panel"
          >
            {/* ── Block style ── */}
            <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">
              Paragraph Style
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                {
                  label: "Paragraph",
                  active: editor?.isActive("paragraph") && !editor.isActive("heading") && !editor.isActive("blockquote"),
                  action: () => editor?.chain().focus().setParagraph().run(),
                },
                {
                  label: "Heading 1",
                  active: editor?.isActive("heading", { level: 1 }),
                  action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
                },
                {
                  label: "Heading 2",
                  active: editor?.isActive("heading", { level: 2 }),
                  action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                },
                {
                  label: "Heading 3",
                  active: editor?.isActive("heading", { level: 3 }),
                  action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                },
                {
                  label: "Blockquote",
                  active: editor?.isActive("blockquote"),
                  action: () => editor?.chain().focus().toggleBlockquote().run(),
                },
              ].map(({ label, active, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    action();
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                    active
                      ? "border-primary bg-purple-50 text-primary"
                      : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-3 h-px bg-gray-100" />

            {/* ── Typography heading ── */}
            <p className="mb-3 text-[9px] font-bold uppercase tracking-wider text-gray-400">
              Typography
            </p>

            {/* Row: Font family | Text size */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  Font Family
                </p>
                <select
                  value={selectedFont}
                  onChange={(e) => onFontChange?.(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-primary cursor-pointer"
                  aria-label="Font family"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  Text Size
                </p>
                <div className="flex gap-1">
                  {(["small", "normal", "large", "xlarge"] as FontSize[]).map((sz, i) => {
                    const sizes = ["text-[10px]", "text-xs", "text-sm", "text-base"];
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onFontSizeChange?.(sz)}
                        title={sz.charAt(0).toUpperCase() + sz.slice(1)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border font-bold font-serif transition-all cursor-pointer",
                          sizes[i],
                          fontSize === sz
                            ? "border-primary bg-purple-50 text-primary"
                            : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        Ab
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Row: Line height | Text indent */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <IconGroup
                label="Line Height"
                value={
                  lineHeight === "1.0"
                    ? "compact"
                    : lineHeight === "2.0"
                    ? "relaxed"
                    : "normal"
                }
                onChange={(v) => {
                  const map: Record<string, "1.0" | "1.15" | "1.5" | "2.0"> = {
                    compact: "1.0",
                    normal: "1.5",
                    relaxed: "2.0",
                  };
                  onLineHeightChange(map[v]);
                }}
                options={[
                  { value: "compact", icon: <LineHeightIcon density="compact" />, title: "Compact" },
                  { value: "normal", icon: <LineHeightIcon density="normal" />, title: "Normal" },
                  { value: "relaxed", icon: <LineHeightIcon density="relaxed" />, title: "Relaxed" },
                ]}
              />

              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  Text Indent
                </p>
                <div className="flex gap-1">
                  {(["none", "first", "hanging"] as IndentStyle[]).map((style) => {
                    const titles: Record<IndentStyle, string> = {
                      none: "No indent",
                      first: "First line indent",
                      hanging: "Hanging indent",
                    };
                    const isActive = indentStyle === style ||
                      (style === "first" && firstLineIndent && indentStyle === "none") ||
                      (style === "none" && !firstLineIndent && indentStyle === "none");
                    const trueActive =
                      style === "none"
                        ? !firstLineIndent && indentStyle === "none"
                        : style === "first"
                        ? firstLineIndent || indentStyle === "first"
                        : indentStyle === "hanging";
                    return (
                      <button
                        key={style}
                        type="button"
                        title={titles[style]}
                        onClick={() => {
                          onIndentStyleChange?.(style);
                          onFirstLineIndentChange(style === "first");
                        }}
                        className={cn(
                          "relative flex items-center justify-center rounded-lg border p-1.5 transition-all cursor-pointer",
                          trueActive
                            ? "border-primary bg-purple-50 text-primary shadow-sm"
                            : "border-gray-100 bg-gray-50/60 text-gray-500 hover:border-gray-200 hover:bg-gray-100/60"
                        )}
                      >
                        <IndentIcon style={style} />
                        {trueActive && (
                          <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                            <Check size={7} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <label className="mt-1.5 flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={indentStyle === "hanging"}
                    onChange={(e) => {
                      const next: IndentStyle = e.target.checked ? "hanging" : "none";
                      onIndentStyleChange?.(next);
                      onFirstLineIndentChange(false);
                    }}
                    className="h-3 w-3 cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] text-gray-500">Chicago Style</span>
                </label>
              </div>
            </div>

            {/* Row: Paragraph spacing | Page width */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <IconGroup
                label="Paragraph Spacing"
                value={
                  paragraphSpacing === "none"
                    ? "none"
                    : paragraphSpacing === "large"
                    ? "large"
                    : "small"
                }
                onChange={(v) => {
                  const map: Record<string, "none" | "small" | "medium" | "large"> = {
                    none: "none",
                    small: "small",
                    large: "large",
                  };
                  onParagraphSpacingChange(map[v]);
                }}
                options={[
                  { value: "none", icon: <SpacingIcon size="none" />, title: "No spacing" },
                  { value: "small", icon: <SpacingIcon size="small" />, title: "Small spacing" },
                  { value: "large", icon: <SpacingIcon size="large" />, title: "Large spacing" },
                ]}
              />

              <IconGroup
                label="Page Width"
                value={pageWidth}
                onChange={(v) => onPageWidthChange?.(v)}
                options={[
                  { value: "narrow", icon: <PageWidthIcon width="narrow" />, title: "Narrow" },
                  { value: "normal", icon: <PageWidthIcon width="normal" />, title: "Normal" },
                  { value: "wide", icon: <PageWidthIcon width="wide" />, title: "Wide" },
                ]}
              />
            </div>

            {/* Row: Text Align | Scene Divider */}
            <div className="grid grid-cols-2 gap-3">
              <IconGroup
                label="Text Align"
                value={textAlign}
                onChange={onTextAlignChange}
                options={[
                  { value: "left", icon: <AlignLeft size={15} aria-hidden />, title: "Left align" },
                  { value: "center", icon: <AlignCenter size={15} aria-hidden />, title: "Center" },
                  { value: "right", icon: <AlignRight size={15} aria-hidden />, title: "Right align" },
                  { value: "justify", icon: <AlignJustify size={15} aria-hidden />, title: "Justify" },
                ]}
              />

              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                  Scene Divider
                </p>
                <select
                  value={sceneDivider}
                  onChange={(e) => onSceneDividerChange?.(e.target.value as SceneDivider)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-primary cursor-pointer"
                  aria-label="Scene divider style"
                >
                  {SCENE_DIVIDER_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {sceneDividerLabel[d]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-gray-200" aria-hidden />

      {/* ── Bold / Italic / Underline / Strike ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(
            "rounded-md p-1.5 font-serif font-bold transition-colors",
            editor?.isActive("bold") ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
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
            editor?.isActive("italic") ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
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
            editor?.isActive("underline") ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
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
            editor?.isActive("strike") ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
          )}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          S
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200" aria-hidden />

      {/* ── Lists ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("bulletList") ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
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
            editor?.isActive("orderedList") ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
          )}
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered size={18} aria-hidden />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200" aria-hidden />

      {/* ── Heading shortcuts ── */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("heading", { level: 1 }) ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
          )}
          title="Heading 1"
          aria-label="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("heading", { level: 2 }) ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
          )}
          title="Heading 2"
          aria-label="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            editor?.isActive("heading", { level: 3 }) ? "bg-purple-100 text-primary" : "hover:bg-gray-100"
          )}
          title="Heading 3"
          aria-label="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="flex-1" />
    </div>
  );
}
