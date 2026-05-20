# ✍️ NovelWrite

Welcome to **NovelWrite**, a premium, highly immersive novel-writing ecosystem featuring a visual three-column Next.js web application editor and a robust terminal-based writing CLI. Both applications consume the exact same platform-independent AI agent core, delivering a fully localized, context-aware prose assistant.

---

## 🗺️ Monorepo Architecture

`NovelWrite` is structured as a type-safe npm workspaces monorepo:

```mermaid
graph TD
    A[apps/novelwrite-cli] -->|Imports| C[@novelwrite/novel-agent]
    B[apps/webapp Next.js] -->|Imports| C
    
    C -->|ProjectStorage Interface| D[Storage Abstraction]
    C -->|LLMClient Interface| E[LLM Abstraction]
    
    A -->|Implements DirectoryProjectStorage| D
    B -->|Implements LocalStorageProjectStorage| D
```

### 1. 🧠 [`packages/novel-agent`](./packages/novel-agent) (AI Engine Core)
The core library that handles AI prompt construction, dynamic context parsing, and structured prose generation:
*   **Decoupled Storage (`ProjectStorage`)**: Dual filesystem adapter interface to read/write files either in Node (CLI console) or local storage (React browser).
*   **Dynamic Language Packs**: Keeps dynamic instructions, narrative models, and speech guides localized inside JSON files under [`packages/novel-agent/src/language/packs/`](./packages/novel-agent/src/language/packs/).

### 2. 💻 [`apps/novelwrite-cli`](./apps/novelwrite-cli) (Interactive Writing CLI REPL)
An interactive console shell enabling authors to query styles, rewrite selected paragraphs, and prompt the AI writer directly from their terminal.

### 3. 🎨 [`apps/webapp`](./apps/webapp) (Next.js Rich-Text Workspace Dashboard)
A responsive visual editor incorporating customizable Tiptap nodes, real-time word-counting, and a comprehensive Story Bible.

---

## ✨ Flagship Visual Features

### 1. 🚀 First-Time Project Onboarding & Settings
When launched with no prior project data, `NovelWrite` triggers an elegant setup dialog immediately on startup. Authors can initialize their work by defining the **Story Title, Author Name, Genre, Point of View (POV), Narrative Tense, Language, Target Word Count,** and **Premise**.

*   **Synchronization:** Modifying details inside the Settings Modal instantly regenerates and updates `Project.json` in the Story Bible Workspace, maintaining a cohesive writing environment.

#### **Onboarding & Configuration Flow:**
![Onboarding Flow](./assets/onboarding_flow.webp)

---

### 2. 🪄 Staged AI Scene Beat Prose Writer
Our signature feature isolates the writing process into structured beat cards. By inserting a scene beat marker in the text editor via the command menu, writers specify narrative instructions, length constraints (200, 400, or 600 words), and beat categories (e.g. *Action*, *Reaction*, or *Dialogue*).

*   **Staged AI Preview:** Prose is generated and staged inside the beat card block first, allowing users to review before making permanent modifications to the document.
*   **Context Scrubber (`stripBeatAnchors`):** Automatically filters out nested tags of surrounding beat markers before feeding the text to the LLM, keeping the context clean.
*   **Transactional Actions:**
    *   **Apply:** Seamlessly inserts the generated prose beneath the beat node in the manuscript and marks the card as completed (`done`).
    *   **Retry:** Clears the previous output and requests a fresh draft from the LLM.
    *   **Discard:** Reverts the card back to its edit/pending state to allow adjustment of description parameters.

#### **Reviewing & Staged Draft Controls:**
![Staged AI Generation](./assets/staged_beat_generation.webp)

---

### 3. 📖 Unified Story Bible Workspace
The visual editor encapsulates three comprehensive context layers:
*   **Project Settings (`Project.json`)**: Tracks key-value attributes (Genre, Tense, POV, Language) to dynamically feed tone/speech filters to the LLM prompts.
*   **Voice Style Guides (`Style.md`)**: User-customizable style guides. Includes a built-in AI Style Capture helper that extracts guidelines from pasted text.
*   **Character Profiles (`Characters.json`)**: Tracks character motivations, features, and dialogues with dynamic card layouts and AI-captured profile parsing.

#### **Story Bible Settings View:**
![Story Bible Workspace](./assets/story_bible_workspace.png)

---

## ⚡ Getting Started

### 1. Installation
Install all monorepo workspace dependencies and establish symlinks:
```bash
npm install
```

### 2. Run Locally

Manage both development layers directly from the root workspace folder:

| Command | Action | URL / Console |
| :--- | :--- | :--- |
| **`npm run dev`** | Starts the Next.js visual editor dashboard (Turbopack) | `http://localhost:3000` |
| **`npm run cli`** | Launches the terminal-based interactive REPL | CLI Console |
| **`npm run test`** | Executes all unit and integration regression suites | Local Compilers |

---

## 🌍 Creating Custom Language Packs

AI task templates, speech constraints, and dialogue metrics can be localized to fit custom languages:

1. Add a localized JSON pack inside [`packages/novel-agent/src/language/packs/`](./packages/novel-agent/src/language/packs/) (e.g., `es.json` for Spanish).
2. Translate all task guides (`continue_writing`, `rewrite_selection`, `improve_dialogue`).
3. Register your language pack in [`packages/novel-agent/src/language/languagePackSchema.ts`](./packages/novel-agent/src/language/languagePackSchema.ts):
   ```typescript
   import esPackJson from "./packs/es.json";
   export const ES_PACK = esPackJson as LanguagePack;
   
   export function loadLanguagePack(lang: string): LanguagePack {
     if (lang === "es") return ES_PACK;
     return EN_PACK;
   }
   ```
4. Set `"language": "es"` in the settings or `Project.json` to immediately propagate localized rules across all editor AI behaviors!

---

## 🧪 Testing and Regression Suite

Ensure all adapters, parsers, and prompt compilers are fully operational by running Vitest suites:
```bash

# Test apps/webapp only
npx vitest run apps/webapp

# Test all workspaces
npm run test
```
