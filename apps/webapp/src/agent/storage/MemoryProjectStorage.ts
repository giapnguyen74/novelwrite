import { ProjectStorage } from "./ProjectStorage";

export class MemoryProjectStorage implements ProjectStorage {
  private files = new Map<string, string>();

  async readFile(path: string): Promise<string | null> {
    return this.files.get(path) ?? null;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.files.keys());
    if (!prefix) return keys;
    return keys.filter((k) => k.startsWith(prefix));
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  clear() {
    this.files.clear();
  }
}
