"use client";

import { useEffect, useState, useCallback } from "react";
import {
  History,
  RotateCcw,
  GitCompare,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Chapter } from "@/types/novel";

// Longest Common Subsequence (LCS) Line-by-Line Diff Engine
function computeLineDiff(oldStr: string, newStr: string) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");

  const dp: number[][] = Array(oldLines.length + 1)
    .fill(null)
    .map(() => Array(newLines.length + 1).fill(0));

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: Array<{ value: string; type: "added" | "removed" | "normal" }> = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ value: oldLines[i - 1], type: "normal" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ value: newLines[j - 1], type: "added" });
      j--;
    } else {
      result.unshift({ value: oldLines[i - 1], type: "removed" });
      i--;
    }
  }

  return result;
}

interface SnapshotEntry {
  timestamp: string;
  kind: string;
  label: string;
  byteSize: number;
  hash: string;
  filename: string;
}

interface Props {
  activeChapterId: string | null;
  activeChapter: Chapter | null;
  loadSnapshots: (path: string) => Promise<SnapshotEntry[]>;
  triggerManualSnapshot: (path: string, label?: string) => Promise<string | null>;
  getSnapshotContent: (path: string, timestamp: string) => Promise<string | null>;
  triggerRestoreSnapshot: (path: string, timestamp: string) => Promise<boolean>;
  triggerDeleteSnapshot: (path: string, timestamp: string) => Promise<boolean>;
}

export function NovelHistoryTab({
  activeChapterId,
  activeChapter,
  loadSnapshots,
  triggerManualSnapshot,
  getSnapshotContent,
  triggerRestoreSnapshot,
  triggerDeleteSnapshot,
}: Props) {
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualLabel, setManualLabel] = useState("");
  
  // Selected Snapshot for details
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotEntry | null>(null);
  const [snapshotContent, setSnapshotContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "compare">("preview");
  const [diffLines, setDiffLines] = useState<Array<{ value: string; type: string }>>([]);

  const refreshList = useCallback(async () => {
    if (!activeChapterId) return;
    setLoading(true);
    try {
      const list = await loadSnapshots(activeChapterId);
      // Sort newest first
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setSnapshots(list);
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    } finally {
      setLoading(false);
    }
  }, [activeChapterId, loadSnapshots]);

  useEffect(() => {
    refreshList();
    setSelectedSnapshot(null);
    setSnapshotContent(null);
  }, [activeChapterId, refreshList]);

  // Handle selected snapshot loading
  const handleSelectSnapshot = async (entry: SnapshotEntry) => {
    if (!activeChapterId) return;
    if (selectedSnapshot?.timestamp === entry.timestamp) {
      // Toggle off
      setSelectedSnapshot(null);
      setSnapshotContent(null);
      return;
    }
    setSelectedSnapshot(entry);
    setSnapshotContent(null);
    setDiffLines([]);

    try {
      const content = await getSnapshotContent(activeChapterId, entry.timestamp);
      setSnapshotContent(content);
      if (content !== null && activeChapter) {
        const diff = computeLineDiff(content, `# ${activeChapter.title}\n\n${activeChapter.content}`);
        setDiffLines(diff);
      }
    } catch (err) {
      console.error("Failed to read snapshot:", err);
    }
  };

  const handleTakeManual = async () => {
    if (!activeChapterId) return;
    try {
      const ts = await triggerManualSnapshot(activeChapterId, manualLabel.trim() || undefined);
      if (ts) {
        setManualLabel("");
        refreshList();
      } else {
        window.alert("No changes since the last snapshot. Skipped backup!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (entry: SnapshotEntry) => {
    if (!activeChapterId) return;
    const confirm = window.confirm(
      `Are you sure you want to restore the chapter to version "${entry.label || entry.kind}" from ${formatTime(entry.timestamp)}?\n\nThis will overwrite the current content. A backup snapshot of the current state will be taken automatically.`
    );
    if (!confirm) return;

    try {
      const ok = await triggerRestoreSnapshot(activeChapterId, entry.timestamp);
      if (ok) {
        window.alert("Chapter successfully rolled back!");
        refreshList();
        setSelectedSnapshot(null);
        setSnapshotContent(null);
      } else {
        window.alert("Rollback failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, entry: SnapshotEntry) => {
    e.stopPropagation();
    if (!activeChapterId) return;
    const confirm = window.confirm("Are you sure you want to delete this snapshot? This cannot be undone.");
    if (!confirm) return;

    try {
      const ok = await triggerDeleteSnapshot(activeChapterId, entry.timestamp);
      if (ok) {
        refreshList();
        if (selectedSnapshot?.timestamp === entry.timestamp) {
          setSelectedSnapshot(null);
          setSnapshotContent(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ts: string) => {
    // Standard timestamp e.g. "2026-05-19T07-13-00.000Z"
    // Restore colons to make it ISO string parseable
    const originalIso = ts.replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/, "$1T$2:$3:$4");
    try {
      const date = new Date(originalIso);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const getKindBadgeClass = (kind: string) => {
    switch (kind) {
      case "manual":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "pre-ai":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "interval":
        return "bg-gray-50 text-gray-600 border-gray-100";
      case "pre-clear":
      case "pre-restore":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  if (!activeChapterId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-gray-400">
        <History size={36} className="text-gray-300" />
        <p className="text-sm font-medium">Select a chapter to manage its history.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm min-h-0">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
          <History size={16} className="text-primary" />
          Chapter History
        </h3>
        <button
          onClick={refreshList}
          disabled={loading}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title="Refresh history log"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Take Snapshot Form */}
      <div className="flex gap-2 text-xs">
        <input
          type="text"
          value={manualLabel}
          onChange={(e) => setManualLabel(e.target.value)}
          placeholder="Label e.g. Before Chapter 1 Rewrite..."
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleTakeManual}
          className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 font-semibold text-white shadow-sm transition-all hover:bg-primary-hover whitespace-nowrap cursor-pointer"
        >
          <Plus size={14} />
          Snapshot Now
        </button>
      </div>

      {/* Snapshot Entries List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {loading && snapshots.length === 0 ? (
          <div className="flex justify-center py-8 text-xs text-gray-400">
            Loading version logs...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-gray-400">
            <History size={24} className="text-gray-200" />
            <p className="text-xs">No snapshots taken yet. Make edits or click Snapshot Now to create one!</p>
          </div>
        ) : (
          snapshots.map((entry) => {
            const isSelected = selectedSnapshot?.timestamp === entry.timestamp;
            return (
              <div
                key={entry.timestamp}
                className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? "border-primary bg-primary-50/10 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
                onClick={() => handleSelectSnapshot(entry)}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between p-3 text-left">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {formatTime(entry.timestamp)}
                      </span>
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${getKindBadgeClass(
                          entry.kind
                        )}`}
                      >
                        {entry.kind}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {entry.label || <span className="italic text-gray-400">Untitled backup</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, entry)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition-colors"
                      title="Delete version"
                    >
                      <Trash2 size={13} />
                    </button>
                    {isSelected ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {/* Dropdown Content */}
                {isSelected && (
                  <div className="border-t border-gray-100/50 bg-gray-50/30 p-3 space-y-3">
                    {/* Mode toggles */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 text-[10px]">
                        <button
                          onClick={() => setViewMode("preview")}
                          className={`rounded-lg px-2.5 py-1 font-bold border transition-colors ${
                            viewMode === "preview"
                              ? "bg-white border-primary text-primary shadow-xs"
                              : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => setViewMode("compare")}
                          className={`rounded-lg px-2.5 py-1 font-bold border transition-colors ${
                            viewMode === "compare"
                              ? "bg-white border-primary text-primary shadow-xs"
                              : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          Compare to current
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRestore(entry)}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs hover:bg-green-700 cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        Restore
                      </button>
                    </div>

                    {/* Content View */}
                    <div className="rounded-xl border border-gray-100 bg-white p-3 max-h-56 overflow-y-auto text-left font-serif text-[11px] leading-relaxed text-gray-600">
                      {snapshotContent === null ? (
                        <div className="flex items-center justify-center py-4 text-xs text-gray-400 gap-1.5">
                          <RefreshCw size={12} className="animate-spin" />
                          Loading version content...
                        </div>
                      ) : viewMode === "preview" ? (
                        <pre className="whitespace-pre-wrap font-serif leading-relaxed italic pr-1">
                          {snapshotContent}
                        </pre>
                      ) : (
                        <div className="space-y-0.5 font-mono text-[9px] leading-tight">
                          {diffLines.map((line, idx) => {
                            if (line.type === "added") {
                              return (
                                <div key={idx} className="bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded-sm">
                                  + {line.value}
                                </div>
                              );
                            }
                            if (line.type === "removed") {
                              return (
                                <div key={idx} className="bg-red-50 text-red-700 px-1 py-0.5 rounded-sm line-through">
                                  - {line.value}
                                </div>
                              );
                            }
                            return (
                              <div key={idx} className="text-gray-400 px-1">
                                  {line.value}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
