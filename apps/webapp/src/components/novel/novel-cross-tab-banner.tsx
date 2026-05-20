import { cn } from "@/lib/utils";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function NovelCrossTabBanner({ visible, onDismiss }: Props) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
      )}
      role="status"
    >
      <span>Manuscript reloaded from another browser tab.</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-200"
      >
        Dismiss
      </button>
    </div>
  );
}
