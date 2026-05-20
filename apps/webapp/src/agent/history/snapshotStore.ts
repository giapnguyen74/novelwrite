import { ProjectStorage } from "../storage/ProjectStorage";

export interface SnapshotEntry {
  timestamp: string; // ISO string with colons replaced by dashes (e.g. 2026-05-19T07-13-00.000Z)
  kind: string;      // "manual" | "pre-ai" | "interval" | "pre-clear"
  label: string;     // e.g. "before rewrite"
  byteSize: number;
  hash: string;
  filename: string;
}

function getHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getHistoryDir(path: string): string {
  const parts = path.split("/");
  const filename = parts.pop() || "";
  const baseName = filename.replace(/\.md$/, "");
  const parentDir = parts.join("/");
  return parentDir ? `${parentDir}/.history/${baseName}` : `.history/${baseName}`;
}

export async function readIndex(storage: ProjectStorage, historyDir: string): Promise<SnapshotEntry[]> {
  const indexPath = `${historyDir}/index.json`;
  try {
    const content = await storage.readFile(indexPath);
    if (content) {
      return JSON.parse(content) as SnapshotEntry[];
    }
  } catch {}
  return [];
}

export async function writeIndex(
  storage: ProjectStorage,
  historyDir: string,
  entries: SnapshotEntry[]
): Promise<void> {
  const indexPath = `${historyDir}/index.json`;
  await storage.writeFile(indexPath, JSON.stringify(entries, null, 2));
}

/**
 * Capture a new snapshot of an active chapter.
 * Skips automatically if the content matches the last snapshot (by content hash).
 */
export async function takeSnapshot(
  storage: ProjectStorage,
  path: string,
  kind: string,
  label?: string
): Promise<string | null> {
  const content = await storage.readFile(path);
  if (content === null) {
    return null;
  }

  const historyDir = getHistoryDir(path);
  let entries = await readIndex(storage, historyDir);
  const currentHash = getHash(content);

  // Skip duplicate snapshots (no change -> no snapshot) for standard entries
  const isSystemLandmark = kind === "pre-clear" || kind === "pre-restore";
  if (!isSystemLandmark && entries.length > 0 && entries[entries.length - 1].hash === currentHash) {
    return null;
  }

  const baseTimestamp = new Date().toISOString().replace(/:/g, "-");
  let timestamp = baseTimestamp;
  let counter = 1;
  while (entries.some(e => e.timestamp === timestamp)) {
    timestamp = `${baseTimestamp}-${counter}`;
    counter++;
  }

  const filename = `${timestamp}--${kind}.md`;
  const snapshotPath = `${historyDir}/${filename}`;

  // Save snapshot file
  await storage.writeFile(snapshotPath, content);

  // Append new entry to the index
  const newEntry: SnapshotEntry = {
    timestamp,
    kind,
    label: label || "",
    byteSize: content.length,
    hash: currentHash,
    filename,
  };
  entries.push(newEntry);

  // Prune snapshots:
  // 1. Prune older than 14 days
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const prunedEntries: SnapshotEntry[] = [];

  for (const entry of entries) {
    const originalIso = entry.timestamp.replace(
      /(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/,
      "$1T$2:$3:$4"
    );
    const time = Date.parse(originalIso);
    if (!isNaN(time) && time < fourteenDaysAgo) {
      try {
        await storage.deleteFile(`${historyDir}/${entry.filename}`);
      } catch {}
    } else {
      prunedEntries.push(entry);
    }
  }

  entries = prunedEntries;

  // 2. Cap at last 50 snapshots
  const maxSnapshots = 50;
  if (entries.length > maxSnapshots) {
    const toPrune = entries.slice(0, entries.length - maxSnapshots);
    for (const entry of toPrune) {
      try {
        await storage.deleteFile(`${historyDir}/${entry.filename}`);
      } catch {}
    }
    entries = entries.slice(entries.length - maxSnapshots);
  }

  await writeIndex(storage, historyDir, entries);
  return timestamp;
}

/**
 * List all snapshots for a given chapter/artifact.
 */
export async function listSnapshots(storage: ProjectStorage, path: string): Promise<SnapshotEntry[]> {
  const historyDir = getHistoryDir(path);
  return readIndex(storage, historyDir);
}

/**
 * Read the file content of a specific snapshot version.
 */
export async function readSnapshot(
  storage: ProjectStorage,
  path: string,
  timestamp: string
): Promise<string | null> {
  const historyDir = getHistoryDir(path);
  const entries = await readIndex(storage, historyDir);
  const entry = entries.find(e => e.timestamp === timestamp);
  if (!entry) {
    return null;
  }
  return storage.readFile(`${historyDir}/${entry.filename}`);
}

/**
 * Restore a specific snapshot. Overwrites the active artifact file with the snapshot content.
 */
export async function restoreSnapshot(
  storage: ProjectStorage,
  path: string,
  timestamp: string
): Promise<boolean> {
  const content = await readSnapshot(storage, path, timestamp);
  if (content === null) {
    return false;
  }

  // Before restoring, take a pre-restore/pre-clear snapshot of current state
  await takeSnapshot(storage, path, "pre-restore", `Before restoring ${timestamp}`);

  await storage.writeFile(path, content);
  return true;
}

/**
 * Delete a specific snapshot entry and its backing file.
 */
export async function deleteSnapshot(
  storage: ProjectStorage,
  path: string,
  timestamp: string
): Promise<boolean> {
  const historyDir = getHistoryDir(path);
  const entries = await readIndex(storage, historyDir);
  const index = entries.findIndex(e => e.timestamp === timestamp);
  if (index === -1) {
    return false;
  }

  const entry = entries[index];
  try {
    await storage.deleteFile(`${historyDir}/${entry.filename}`);
  } catch {}

  entries.splice(index, 1);
  await writeIndex(storage, historyDir, entries);
  return true;
}
