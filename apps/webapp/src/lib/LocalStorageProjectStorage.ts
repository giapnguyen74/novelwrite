import { ProjectStorage } from "@novelwrite/novel-agent";

export class LocalStorageProjectStorage implements ProjectStorage {
  async readFile(path: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.setItem(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(path);
  }

  async listFiles(prefix?: string): Promise<string[]> {
    if (typeof window === "undefined") return [];
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (!prefix || key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    }
    return keys;
  }

  async exists(path: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(path) !== null;
  }
}
