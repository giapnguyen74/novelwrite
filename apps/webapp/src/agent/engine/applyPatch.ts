import { ProjectStorage } from "../storage/ProjectStorage";
import { takeSnapshot } from "../history/snapshotStore";

export type ProjectPatchOperation =
  | {
      type: "write_file";
      path: string;
      content: string;
    }
  | {
      type: "append_file";
      path: string;
      content: string;
    }
  | {
      type: "replace_range";
      path: string;
      start: number;
      end: number;
      content: string;
    }
  | {
      type: "delete_file";
      path: string;
    };

export type ProjectPatch = {
  operations: ProjectPatchOperation[];
};

export async function applyPatch(storage: ProjectStorage, patch: ProjectPatch): Promise<void> {
  for (const op of patch.operations) {
    if (
      (op.type === "write_file" || op.type === "append_file" || op.type === "replace_range") &&
      op.path.startsWith("Artifacts/")
    ) {
      try {
        await takeSnapshot(storage, op.path, "pre-ai", `pre-${op.type}`);
      } catch {}
    }

    switch (op.type) {
      case "write_file": {
        await storage.writeFile(op.path, op.content);
        break;
      }
      case "append_file": {
        const existing = (await storage.readFile(op.path)) ?? "";
        // Ensure nice spacing between chapters/prose
        const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
        await storage.writeFile(op.path, existing + separator + op.content);
        break;
      }
      case "replace_range": {
        const existing = (await storage.readFile(op.path)) ?? "";
        const before = existing.substring(0, op.start);
        const after = existing.substring(op.end);
        await storage.writeFile(op.path, before + op.content + after);
        break;
      }
      case "delete_file": {
        await storage.deleteFile(op.path);
        break;
      }
      default: {
        throw new Error(`Unsupported patch operation: ${(op as any).type}`);
      }
    }
  }
}
