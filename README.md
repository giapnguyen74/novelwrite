# NovelWrite Monorepo

Welcome to **NovelWrite**, a premium, modular novel-writing ecosystem that couples a beautiful visual Next.js editor with a robust terminal-based writing agent.

This repository is structured as a type-safe npm workspaces monorepo, allowing the browser webapp and terminal CLI to consume the exact same platform-independent AI agent core.

---

## 🗺️ Monorepo Architecture

The workspace is divided into three focused layers:

```mermaid
graph TD
    A[apps/novelwrite-cli] -->|Imports| C[@novelwrite/novel-agent]
    B[apps/webapp Next.js] -->|Imports| C
    
    C -->|ProjectStorage Interface| D[Storage Abstraction]
    C -->|LLMClient Interface| E[LLM Abstraction]
    
    A -->|Implements DirectoryProjectStorage| D
    B -->|Implements LocalStorageProjectStorage| D
```

### 1. [`packages/novel-agent`](./packages/novel-agent) (AI Engine Core)
The platform-independent core library that handles AI prompt construction, context priority compilation, structured LLM generation, output postprocessors, and transactional patching.
*   **Decoupled Storage (`ProjectStorage`)**: Can write to Node's filesystem (using `DirectoryProjectStorage`) or browser local storage (using `MemoryProjectStorage`).
*   **Dynamic Language Packs**: Keeps prompt tasks, instructions, and rules completely localized inside dynamic JSON files under [`packages/novel-agent/src/language/packs/`](./packages/novel-agent/src/language/packs/).

### 2. [`apps/novelwrite-cli`](./apps/novelwrite-cli) (Terminal CLI Writing REPL)
An interactive terminal REPL shell to plan, highlight, rewrite, and write stories with AI assistance directly from your console.
*   Features: Live directory parsing, context metrics, multiline pastes (`select paste`), terminal highlights, and a structured `y / n / prompt` patch transaction flow.

### 3. [`apps/webapp`](./apps/webapp) (Next.js Dashboard Editor)
A responsive, high-performance visual dashboard that brings the power of the `@novelwrite/novel-agent` prompts into a premium three-column rich-text editing experience using Tiptap.

---

## ⚡ Getting Started

### 1. Installation
Install all monorepo dependencies and link local workspaces:
```bash
npm install
```

### 2. Configure Environment & LLM Credentials

The CLI REPL supports loading your LLM credentials from two different sources, giving you complete flexibility:

#### 📂 Option A: Portable `config.json` inside your project folder (Recommended)
You can create a `config.json` directly in your active project directory (e.g., `project-1/config.json`). This keeps configuration settings portable and cleanly compartmentalized within each individual story:
```json
{
  "apiKey": "your-openai-api-key",
  "apiUrl": "https://api.openai.com/v1",
  "model": "gpt-4o"
}
```


---

## 🚀 Development Workflow

Manage the entire workspace from the root folder using standard proxy scripts:

| Command | Action | Location |
| :--- | :--- | :--- |
| **`npm run dev`** | Starts the Next.js visual editor dev server (Turbopack) | `http://localhost:3000` |
| **`npm run cli`** | Launches the interactive terminal writing agent REPL | Terminal console |
| **`npm run test`** | Executes all unit and integration test suites in workspaces | Local compilers |



## 🌍 Adding Custom Language Packs

You can easily localise the AI writing instructions (such as dialogue register constraints, pronoun pairs, formatting outputs, and narrative task descriptions) by adding your own language pack:

1. **Create a JSON config** under [`packages/novel-agent/src/language/packs/`](./packages/novel-agent/src/language/packs/) (e.g. `es.json` for Spanish or `ja.json` for Japanese).
2. **Translate the Action Prompt Templates** (`continue_writing`, `rewrite_selection`, `improve_dialogue`, etc.) inside that JSON file.
3. **Register the pack** inside [`packages/novel-agent/src/language/languagePackSchema.ts`](./packages/novel-agent/src/language/languagePackSchema.ts):
   ```typescript
   import esPackJson from "./packs/es.json";
   
   export const ES_PACK = esPackJson as LanguagePack;
   
   export function loadLanguagePack(lang: string): LanguagePack {
     if (lang === "vi") return VI_PACK;
     if (lang === "es") return ES_PACK;
     return EN_PACK;
   }
   ```
4. Update the `"language": "es"` string in your project manifest (`Novelwrite.json`) to automatically load your custom localized rules across all AI operations!

---

## 🧪 Testing and Quality Control

Run Vitest regression tests to verify that your prompts, storage adapters, and builders remain fully functional:
```bash
# Test packages/novel-agent only
npx vitest run packages/novel-agent

# Test apps/webapp only
npx vitest run apps/webapp

# Test all workspaces
npm run test
```
