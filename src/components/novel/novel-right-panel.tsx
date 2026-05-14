import { cn } from "@/lib/utils";
import { PanelRightClose, Settings, Sparkles } from "lucide-react";

export type RightPanelTab = "assistant" | "history" | "notes";

type Props = {
  tab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  onClose: () => void;
  selectionText: string;
  rewriteLoading: boolean;
  rewriteError: string | null;
  rewriteResult: string | null;
  onRewrite: () => void;
};

const SOON = { disabled: true, title: "Coming soon" } as const;

export function NovelRightPanel({
  tab,
  onTabChange,
  onClose,
  selectionText,
  rewriteLoading,
  rewriteError,
  rewriteResult,
  onRewrite,
}: Props) {
  return (
    <aside className="flex w-[340px] shrink-0 flex-col gap-3 overflow-y-auto">
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTabChange("assistant")}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === "assistant"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            Assistant
          </button>
          <button
            type="button"
            className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
            {...SOON}
            aria-label="History tab (coming soon)"
          >
            History
          </button>
          <button
            type="button"
            className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
            {...SOON}
            aria-label="Notes tab (coming soon)"
          >
            Notes
          </button>
        </div>
        <div className="flex items-center gap-2 pr-2">
          <button
            type="button"
            className="text-gray-400 transition-colors hover:text-gray-600"
            {...SOON}
            aria-label="Assistant settings (coming soon)"
          >
            <Settings size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="text-gray-400 transition-colors hover:text-gray-600"
            onClick={onClose}
            aria-label="Hide assistant panel"
          >
            <PanelRightClose size={18} aria-hidden />
          </button>
        </div>
      </div>

      {tab === "assistant" && (
        <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
            <Sparkles className="h-8 w-8 text-primary" aria-hidden />
          </div>
          <h3 className="font-bold text-gray-800">AI Assistant</h3>
          <p className="text-sm leading-relaxed text-gray-500">
            Select text in the editor, then run <strong>Rewrite</strong> to call
            the stub API route at{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">
              /api/assistant/rewrite
            </code>
            .
          </p>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-left text-sm text-gray-700">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Selection
            </div>
            {selectionText.trim() ? (
              <p className="max-h-32 overflow-y-auto whitespace-pre-wrap font-serif text-[0.95rem] leading-relaxed">
                {selectionText}
              </p>
            ) : (
              <p className="text-gray-400">No selection</p>
            )}
          </div>

          <button
            type="button"
            onClick={onRewrite}
            disabled={!selectionText.trim() || rewriteLoading}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rewriteLoading ? "Rewriting…" : "Rewrite selection"}
          </button>

          {rewriteError && (
            <p className="text-left text-sm text-red-600" role="alert">
              {rewriteError}
            </p>
          )}

          {rewriteResult && (
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-left">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Result
              </div>
              <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {rewriteResult}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
