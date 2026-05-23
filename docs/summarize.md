# NovelWrite — Project Summary

**NovelWrite** is a local-first, privacy-focused AI novel writing app that combines a rich rich-text editor with pluggable AI assistance. All manuscripts, story bibles, and project metadata live in the browser's `localStorage`; users supply their own LLM backend (Ollama, LM Studio, OpenRouter, OpenAI, etc.).

### Architecture
- **Monorepo** (npm workspaces): `apps/webapp` (Next.js) + shared `agent` core (LLM orchestration + storage abstraction).
- **Two decoupled interfaces:** `ProjectStorage` (storage adapter, default = `LocalStorageProjectStorage`) and `LLMClient` (pluggable LLM adapter, includes `OpenAIClient`, `MockLLMClient`).
- **Language packs:** localized prompts and constraints live as JSON in `packs/` (e.g. `en.json`, `vi.json`), registered via `languagePackSchema.ts`.

### Core Features
| Area | Highlights |
|---|---|
| **Beat Cards** | Staged AI scene beats (`guide`, `action`, `reaction`, `dialogue`, `realization`, `decision`, `transition`) with length control (200/400/600 words). Review workflow: Apply / Retry / Discard. |
| **Story Bible** | Consolidated workspace: `Project.json`, `Style.md`, `Characters.json`/`Characters.md`, `Continuity.md`. AI helpers for style capture, character capture, continuity auditing. |
| **AI Assistant** | Actions: continue, rewrite, expand, tighten, polish dialogue, extract style, capture characters, summarize continuity, check continuity. Context-size counter shows token budget per request. |
| **Version Control** | LCS line-by-line diff engine on snapshot history. Supports auto/manual snapshots, side-by-side diff view, and rollback with safety backups. |
| **Exports** | Formatted chapter compilation, DOCX export, full JSON project backup + restore. |

### Quick Start
```bash
npm install    # install workspace deps
npm run dev    # start Next.js editor → localhost:3000
npm run test   # run test suite
```

### Key Files
- `apps/webapp/src/` — application source (editor, panels, modals, AI integration)
- `agent/` — LLM client abstractions, project storage adapter, prompt compiler, language packs
- `packs/*.json` — localized prompt templates and constraints
- `assets/` — documentation screenshots

### Design Philosophy
- **No data leave your machine** — manuscripts and Story Bible never hit a remote server.
- **Bring your own model** — no vendor lock-in; swap backends without changing the app.
- **Modular by design** — storage and LLM layers are fully interoperable; write a new adapter and it plugs in.
