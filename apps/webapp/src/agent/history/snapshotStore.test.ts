import { describe, expect, it } from "vitest";
import { MemoryProjectStorage } from "../storage/MemoryProjectStorage";
import {
  takeSnapshot,
  listSnapshots,
  readSnapshot,
  restoreSnapshot,
  deleteSnapshot,
} from "./snapshotStore";

describe("snapshotStore tests", () => {
  it("should capture and retrieve snapshots, and correctly skip duplicate contents", async () => {
    const storage = new MemoryProjectStorage();
    const chapterPath = "Artifacts/chapter-001.md";

    await storage.writeFile(chapterPath, "Initial content");

    // 1. Take first snapshot
    const ts1 = await takeSnapshot(storage, chapterPath, "manual", "first");
    expect(ts1).not.toBeNull();

    // 2. Take duplicate snapshot (should be skipped)
    const ts2 = await takeSnapshot(storage, chapterPath, "manual", "second");
    expect(ts2).toBeNull();

    // Verify list contains 1 entry
    const list1 = await listSnapshots(storage, chapterPath);
    expect(list1).toHaveLength(1);
    expect(list1[0].label).toBe("first");
    expect(list1[0].kind).toBe("manual");

    // 3. Mutate and take second snapshot
    await storage.writeFile(chapterPath, "Modified content");
    const ts3 = await takeSnapshot(storage, chapterPath, "pre-ai", "before rewrite");
    expect(ts3).not.toBeNull();

    const list2 = await listSnapshots(storage, chapterPath);
    expect(list2).toHaveLength(2);
    expect(list2[1].label).toBe("before rewrite");
    expect(list2[1].kind).toBe("pre-ai");

    // 4. Read snapshot contents
    const content1 = await readSnapshot(storage, chapterPath, ts1!);
    expect(content1).toBe("Initial content");

    const content3 = await readSnapshot(storage, chapterPath, ts3!);
    expect(content3).toBe("Modified content");
  });

  it("should enforce capping at last 50 snapshots", async () => {
    const storage = new MemoryProjectStorage();
    const chapterPath = "Artifacts/chapter-001.md";

    for (let i = 1; i <= 55; i++) {
      await storage.writeFile(chapterPath, `Content version ${i}`);
      await takeSnapshot(storage, chapterPath, "interval", `Save ${i}`);
    }

    const list = await listSnapshots(storage, chapterPath);
    expect(list).toHaveLength(50);
    // The oldest 5 should be pruned, first entry in list should be Save 6
    expect(list[0].label).toBe("Save 6");
    expect(list[49].label).toBe("Save 55");
  });

  it("should support restoring a version and automatically capture pre-restore backup", async () => {
    const storage = new MemoryProjectStorage();
    const chapterPath = "Artifacts/chapter-001.md";

    await storage.writeFile(chapterPath, "First State");
    const ts1 = await takeSnapshot(storage, chapterPath, "manual", "State 1");

    await storage.writeFile(chapterPath, "Second State");
    const ts2 = await takeSnapshot(storage, chapterPath, "manual", "State 2");

    // Verify current is Second State
    expect(await storage.readFile(chapterPath)).toBe("Second State");

    // Restore to State 1
    const restored = await restoreSnapshot(storage, chapterPath, ts1!);
    expect(restored).toBe(true);

    // Current must be First State
    expect(await storage.readFile(chapterPath)).toBe("First State");

    // Verify list contains a pre-restore snapshot as backup
    const list = await listSnapshots(storage, chapterPath);
    expect(list.some(e => e.kind === "pre-restore")).toBe(true);
  });

  it("should support deleting a specific snapshot", async () => {
    const storage = new MemoryProjectStorage();
    const chapterPath = "Artifacts/chapter-001.md";

    await storage.writeFile(chapterPath, "Content A");
    const tsA = await takeSnapshot(storage, chapterPath, "manual", "A");

    await storage.writeFile(chapterPath, "Content B");
    const tsB = await takeSnapshot(storage, chapterPath, "manual", "B");

    let list = await listSnapshots(storage, chapterPath);
    expect(list).toHaveLength(2);

    const deleted = await deleteSnapshot(storage, chapterPath, tsA!);
    expect(deleted).toBe(true);

    list = await listSnapshots(storage, chapterPath);
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe("B");
  });
});
