"use client";

import { useState, useEffect } from "react";
import { FileText, FileJson, Check, X, ShieldAlert, Sparkles, BookOpen } from "lucide-react";
import type { Chapter } from "@/types/novel";
import { compileBook, buildDocxDocument } from "@novelwrite/novel-agent";
import { LocalStorageProjectStorage } from "@/lib/LocalStorageProjectStorage";
import { Packer } from "docx";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  projectTitle: string;
  onExportJson: () => void;
}

export function NovelCompileModal({
  isOpen,
  onClose,
  chapters,
  projectTitle,
  onExportJson,
}: Props) {
  const [format, setFormat] = useState<"docx" | "json">("docx");
  
  // Chapter checklist
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  
  // Front matter
  const [title, setTitle] = useState(projectTitle);
  const [author, setAuthor] = useState("");
  const [dedication, setDedication] = useState("");

  // Styling toggles
  const [includeSceneDividers, setIncludeSceneDividers] = useState(true);
  const [includeChapterNumbers, setIncludeChapterNumbers] = useState(true);
  const [stripPlaceholders, setStripPlaceholders] = useState(true);

  const [compiling, setCompiling] = useState(false);

  // Sync chapters and defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedChapters(chapters.map((c) => c.id));
      setTitle(projectTitle);
      
      // Load author from Project.json if available
      const loadAuthor = async () => {
        try {
          const storage = new LocalStorageProjectStorage();
          const projectJson = await storage.readFile("Project.json");
          if (projectJson) {
            const parsed = JSON.parse(projectJson);
            if (parsed.author) setAuthor(parsed.author);
          }
        } catch {}
      };
      loadAuthor();
    }
  }, [isOpen, chapters, projectTitle]);

  if (!isOpen) return null;

  // Toggle chapter selection
  const handleToggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedChapters.length === chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(chapters.map((c) => c.id));
    }
  };

  // Live output preview filename
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "manuscript";
  const outputFilename = `${sanitizedTitle}.${format}`;

  const handleCompile = async () => {
    if (format === "json") {
      onExportJson();
      onClose();
      return;
    }

    if (selectedChapters.length === 0) {
      window.alert("Please select at least one chapter to compile.");
      return;
    }

    setCompiling(true);
    try {
      const storage = new LocalStorageProjectStorage();
      
      // 1. Compile book markdown sections
      const book = await compileBook(storage, {
        chapterIds: selectedChapters,
        includeSceneDividers,
        includeChapterNumbers,
        stripPlaceholders,
        title,
        author: author.trim() || undefined,
        dedication: dedication.trim() || undefined,
      });

      // 2. Build structured Docx elements
      const doc = buildDocxDocument(book);

      // 3. Pack to Blob
      const blob = await Packer.toBlob(doc);

      // 4. Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outputFilename;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (err) {
      console.error(err);
      window.alert("Export compilation failed. Please verify project health.");
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Compile & Export Manuscript
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-left">
          {/* Format selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("docx")}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all text-left ${
                  format === "docx"
                    ? "border-primary bg-primary-50/10 shadow-xs"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`rounded-lg p-2 ${format === "docx" ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-400"}`}>
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Microsoft Word (.docx)</div>
                  <div className="text-xs text-gray-400">Georgia typography, perfect for Google Docs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all text-left ${
                  format === "json"
                    ? "border-primary bg-primary-50/10 shadow-xs"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`rounded-lg p-2 ${format === "json" ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-400"}`}>
                  <FileJson size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Standard Project JSON</div>
                  <div className="text-xs text-gray-400">Full backup of your manuscript and story bible</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional panels */}
          {format === "docx" && (
            <>
              {/* Front Matter Inputs */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Book Front Matter
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-600">Book Title</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. The Quiet Symphony"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-gray-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-gray-600">Author Name</span>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-gray-800 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <span className="text-xs font-semibold text-gray-600">Dedication (Optional)</span>
                  <textarea
                    rows={2}
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    placeholder="e.g. For those who stayed in the dark..."
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-gray-800 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Design Toggles */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Novel Compilation Options
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Numbering */}
                  <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/30 p-3 hover:border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeChapterNumbers}
                      onChange={(e) => setIncludeChapterNumbers(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-gray-700">Chapter Numbers</div>
                      <div className="text-[10px] text-gray-400">Prefix "Chapter N:"</div>
                    </div>
                  </label>

                  {/* Scene Break Dividers */}
                  <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/30 p-3 hover:border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSceneDividers}
                      onChange={(e) => setIncludeSceneDividers(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-gray-700">Scene Dividers</div>
                      <div className="text-[10px] text-gray-400">Injects "*  *  *" dividers</div>
                    </div>
                  </label>

                  {/* Strip Placeholders */}
                  <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/30 p-3 hover:border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stripPlaceholders}
                      onChange={(e) => setStripPlaceholders(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-primary focus:ring-primary border-gray-300"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-gray-700">Clean Placeholders</div>
                      <div className="text-[10px] text-gray-400">Strips "Begin writing..."</div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Chapter Outline Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Chapter Selection ({selectedChapters.length} / {chapters.length})
              </label>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs font-semibold text-primary hover:text-primary-hover"
              >
                {selectedChapters.length === chapters.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2.5 space-y-1">
              {chapters.map((ch, idx) => {
                const isSelected = selectedChapters.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleToggleChapter(ch.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-2.5 text-xs transition-colors hover:bg-gray-50 ${
                      isSelected ? "bg-primary-50/5 font-semibold text-gray-700" : "text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${
                        isSelected ? "border-primary bg-primary text-white" : "border-gray-300 bg-white"
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{ch.title || `Chapter ${idx + 1}`}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono shrink-0 select-none">
                      {ch.id.replace("Artifacts/", "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output Filename Preview */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/30 p-3.5 flex items-center justify-between">
            <div className="text-xs">
              <div className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
                Output Filename Preview
              </div>
              <div className="font-mono text-gray-700 mt-0.5">{outputFilename}</div>
            </div>
            <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {format === "docx" ? "Google Docs Ready" : "Backup JSON"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 bg-gray-50/30 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-600 transition-colors hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCompile}
            disabled={compiling || (format === "docx" && selectedChapters.length === 0)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 font-semibold text-white shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
          >
            {compiling ? "Compiling..." : `Compile & Export`}
          </button>
        </div>
      </div>
    </div>
  );
}
