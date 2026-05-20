import * as fs from "fs/promises";
import * as path from "path";
import { ProjectStorage } from "./ProjectStorage";

export class DirectoryProjectStorage implements ProjectStorage {
  constructor(private rootPath: string) {}

  private resolvePath(subPath: string): string {
    const resolved = path.resolve(this.rootPath, subPath);
    if (!resolved.startsWith(path.resolve(this.rootPath))) {
      throw new Error(`Directory traversal attempt blocked: ${subPath}`);
    }
    return resolved;
  }

  async readFile(subPath: string): Promise<string | null> {
    const fullPath = this.resolvePath(subPath);
    try {
      return await fs.readFile(fullPath, "utf-8");
    } catch {
      return null;
    }
  }

  async writeFile(subPath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
  }

  async deleteFile(subPath: string): Promise<void> {
    const fullPath = this.resolvePath(subPath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if not present
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    const results: string[] = [];
    const scanDir = async (dir: string) => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const relative = path.relative(this.rootPath, full);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== ".next") {
            await scanDir(full);
          }
        } else {
          results.push(relative);
        }
      }
    };

    await scanDir(this.rootPath);

    if (!prefix) return results;
    return results.filter((r) => r.startsWith(prefix));
  }

  async exists(subPath: string): Promise<boolean> {
    const fullPath = this.resolvePath(subPath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
