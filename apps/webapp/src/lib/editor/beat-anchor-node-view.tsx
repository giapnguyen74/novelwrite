import React, { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  Sparkles,
  Trash2,
  CheckCircle2,
  Compass,
  Zap,
  RotateCcw,
  MessageSquare,
  Brain,
  Target,
  Wind,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Activity,
  ArrowDown,
  Plus,
  PenTool,
} from "lucide-react";
import type { BeatType } from "@/types/beats";

const BEAT_CONFIGS: Record<
  BeatType,
  {
    label: string;
    icon: React.ComponentType<any>;
    colorClass: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
  }
> = {
  guide: {
    label: "Guide",
    icon: Compass,
    colorClass: "from-indigo-500 to-cyan-500",
    borderClass: "border-indigo-500/30 focus-within:border-indigo-500/60",
    bgClass: "bg-indigo-50/40 dark:bg-indigo-950/10",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
  action: {
    label: "Action",
    icon: Zap,
    colorClass: "from-amber-500 to-orange-500",
    borderClass: "border-amber-500/30 focus-within:border-amber-500/60",
    bgClass: "bg-amber-50/40 dark:bg-amber-950/10",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  reaction: {
    label: "Reaction",
    icon: RotateCcw,
    colorClass: "from-orange-500 to-red-500",
    borderClass: "border-orange-500/30 focus-within:border-orange-500/60",
    bgClass: "bg-orange-50/40 dark:bg-orange-950/10",
    textClass: "text-orange-600 dark:text-orange-400",
  },
  dialogue: {
    label: "Dialogue",
    icon: MessageSquare,
    colorClass: "from-blue-500 to-indigo-500",
    borderClass: "border-blue-500/30 focus-within:border-blue-500/60",
    bgClass: "bg-blue-50/40 dark:bg-blue-950/10",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  realization: {
    label: "Realization",
    icon: Brain,
    colorClass: "from-purple-500 to-pink-500",
    borderClass: "border-purple-500/30 focus-within:border-purple-500/60",
    bgClass: "bg-purple-50/40 dark:bg-purple-950/10",
    textClass: "text-purple-600 dark:text-purple-400",
  },
  decision: {
    label: "Decision",
    icon: Target,
    colorClass: "from-emerald-500 to-teal-500",
    borderClass: "border-emerald-500/30 focus-within:border-emerald-500/60",
    bgClass: "bg-emerald-50/40 dark:bg-emerald-950/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  transition: {
    label: "Transition",
    icon: Wind,
    colorClass: "from-gray-500 to-slate-500",
    borderClass: "border-gray-500/30 focus-within:border-gray-500/60",
    bgClass: "bg-gray-50/40 dark:bg-gray-950/10",
    textClass: "text-gray-600 dark:text-gray-400",
  },
};

function stripBeatAnchors(text: string): string {
  if (!text) return "";
  return text
    .replace(/<beat\b[^>]*>(.*?)<\/beat>/gi, "")
    .replace(/<beat\b[^>]*>/gi, "")
    .replace(/<\/beat>/gi, "");
}

export function BeatAnchorNodeView({
  node,
  editor,
  getPos,
  updateAttributes,
}: NodeViewProps) {
  const { id, beatType, description, status, wordCount } = node.attrs as {
    id: string;
    beatType: BeatType;
    description: string;
    status: "pending" | "drafted" | "done";
    wordCount: number;
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(status !== "done");
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const config = BEAT_CONFIGS[beatType] || BEAT_CONFIGS.guide;
  const IconComponent = config.icon;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateAttributes({ description: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateAttributes({ beatType: e.target.value as BeatType });
  };

  const handleStatusChange = (newStatus: "pending" | "drafted" | "done") => {
    updateAttributes({ status: newStatus });
    if (newStatus === "done") {
      setIsExpanded(false);
    }
  };

  const handleDelete = () => {
    if (typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") {
        editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
      }
    }
  };

  const handleGenerate = () => {
    if (!description.trim()) {
      alert("Please enter a beat description first before generating prose.");
      return;
    }

    if (typeof getPos !== "function") return;

    const pos = getPos();
    if (typeof pos !== "number") return;

    const precedingText = editor.state.doc.textBetween(0, pos, "\n");
    const followingText = editor.state.doc.textBetween(
      pos + node.nodeSize,
      editor.state.doc.content.size,
      "\n"
    );

    const cleanPrecedingText = stripBeatAnchors(precedingText);
    const cleanFollowingText = stripBeatAnchors(followingText);

    // Clear previous generation before starting
    setGeneratedText(null);

    // Dispatch custom event to let app handle generation
    window.dispatchEvent(
      new CustomEvent("novelwrite:generateBeat", {
        detail: {
          id,
          beatType,
          description,
          precedingText: cleanPrecedingText,
          followingText: cleanFollowingText,
          wordCount: wordCount || 400,
          onStart: () => setIsGenerating(true),
          onSuccess: (generatedProse: string) => {
            setIsGenerating(false);
            setGeneratedText(generatedProse);
            updateAttributes({ status: "drafted" });
          },
          onError: (errMsg: string) => {
            setIsGenerating(false);
            alert(`AI Generation failed: ${errMsg}`);
          },
        },
      })
    );
  };

  const handleApply = () => {
    if (!generatedText || typeof getPos !== "function") return;
    const pos = getPos();
    if (typeof pos !== "number") return;

    // Insert generated content after beat node
    editor
      .chain()
      .focus()
      .insertContentAt(pos + node.nodeSize, "\n\n" + generatedText + "\n\n")
      .run();

    // Mark done
    updateAttributes({ status: "done" });
    setGeneratedText(null);
    setIsExpanded(false);
  };

  const handleDiscard = () => {
    setGeneratedText(null);
    updateAttributes({ status: "pending" });
  };

  return (
    <NodeViewWrapper
      className="my-6 block cursor-default select-none"
      style={{
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        textAlign: "left",
        textIndent: "0px",
        lineHeight: "1.5",
      }}
    >
      {/* Collapsed Done View */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className={`group flex items-center justify-between rounded-lg border border-dashed py-2 px-4 transition-all duration-300 hover:border-gray-400 bg-white hover:bg-gray-50 cursor-pointer shadow-sm`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${config.colorClass} text-white shadow-sm`}
            >
              <IconComponent size={13} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {config.label} Beat
            </span>
            <span className="text-sm font-medium text-gray-600 line-clamp-1">
              — {description || "Empty description"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> done
            </span>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Rich Expanded Editor Card */
        <div
          className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow"
        >
          {/* Top Panel Actions */}
          <div className="mb-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-gray-400">
              <GripVertical size={13} className="cursor-grab active:cursor-grabbing hover:text-gray-600" />
              <Sparkles size={13} className="text-purple-500 fill-purple-100" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-sans">
                SCENE BEAT
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Hide
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                title="Delete beat anchor"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {generatedText ? (
            /* Staged AI Generation Preview Block */
            <div className="rounded-lg border border-purple-100 bg-purple-50/20 p-3.5 select-text shadow-inner">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 font-sans select-none">
                <Sparkles size={11} className="animate-pulse" />
                <span>Generated Draft</span>
              </div>
              <div 
                className="text-sm text-gray-800 leading-relaxed font-serif text-justify"
                style={{ fontStyle: "italic" }}
              >
                {generatedText}
              </div>
              
              {/* Staged Actions Row */}
              <div className="mt-4 flex items-center gap-2 select-none">
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Apply</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-600 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw size={13} className={isGenerating ? "animate-spin" : ""} />
                  <span>{isGenerating ? "Writing..." : "Retry"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscard}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Discard</span>
                </button>
              </div>
            </div>
          ) : (
            /* Editing State */
            <>
              {/* Description Textarea */}
              <div className="mb-3">
                <textarea
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="What happens in this beat? Describe the moment..."
                  rows={2}
                  className="w-full bg-transparent resize-none border-0 p-0 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-0 leading-relaxed font-sans"
                />
              </div>

              {/* Controls Row (Middle) */}
              <div className="mb-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 select-none">
                {/* Word Limits */}
                <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100/70">
                  {[200, 400, 600].map((length) => {
                    const isActive = (wordCount || 400) === length;
                    return (
                      <button
                        key={length}
                        type="button"
                        onClick={() => updateAttributes({ wordCount: length })}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-all cursor-pointer ${
                          isActive
                            ? "bg-white text-gray-800 shadow-sm border border-gray-200/80"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {length}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors cursor-pointer"
                  title="Edit target length"
                >
                  <PenTool size={12} />
                </button>

                {/* Type selector */}
                <div className="ml-auto flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100/70">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1">
                    Type:
                  </span>
                  <select
                    value={beatType}
                    onChange={handleTypeChange}
                    className="bg-transparent text-[10px] font-bold text-gray-600 outline-none cursor-pointer hover:text-gray-800 pr-1 py-0.5 border-0 focus:ring-0 focus:outline-none"
                  >
                    {Object.entries(BEAT_CONFIGS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 select-none">
                <span className="text-[10px] text-gray-400 font-bold tracking-tight">
                  {status === "done"
                    ? "✓ Prose matches beat"
                    : status === "drafted"
                    ? "⚡ Prose drafted"
                    : "✏️ Ready to write"}
                </span>

                {/* Right Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !description.trim()}
                  className={`flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] cursor-pointer ${
                    isGenerating || !description.trim()
                      ? "opacity-50 cursor-not-allowed pointer-events-none bg-gray-50 text-gray-400"
                      : ""
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-primary" />
                      <span>Writing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown size={12} className="text-gray-500" />
                      <span>Write Beat</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}
