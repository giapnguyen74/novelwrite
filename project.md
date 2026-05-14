# NovelWrite — project overview

This document summarizes the current codebase under `src/` and how the app fits together.

## Purpose

**NovelWrite** is a browser-based novel-writing MVP: a three-column workspace (outline, rich editor, assistant panel) with chapter management, **local persistence**, optional **JSON backup import/export**, and a **stub** assistant rewrite API.

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, Tailwind CSS 4 (`@import "tailwindcss"`), `@tailwindcss/typography` |
| Fonts | Geist Sans / Geist Mono via `next/font/google` in `src/app/layout.tsx` |
| Editor | [Tiptap](https://tiptap.dev/) 3 with StarterKit, Underline, and [`tiptap-markdown`](https://github.com/aguingand/tiptap-markdown) for Markdown round-trip |
| Icons | `lucide-react` |
| Utilities | `clsx`, `tailwind-merge` (`cn` in `src/lib/utils.ts`, used by novel UI components) |
| Tests | [Vitest](https://vitest.dev/) (`npm run test`) |

Path alias: `@/*` → `./src/*` (see `tsconfig.json`). Test files `**/*.test.ts` are excluded from the Next TypeScript project in `tsconfig.json`.

## Source layout

```
src/
├── app/
│   ├── api/assistant/rewrite/route.ts   # POST stub rewrite (JSON body: { text })
│   ├── globals.css
│   ├── layout.tsx                       # Metadata, fonts, body
│   └── page.tsx                         # Composes hooks + novel components
├── components/novel/
│   ├── novel-cross-tab-banner.tsx
│   ├── novel-editor-header.tsx
│   ├── novel-editor-workspace.tsx
│   ├── novel-format-toolbar.tsx
│   ├── novel-left-sidebar.tsx
│   └── novel-right-panel.tsx
├── hooks/
│   ├── useNovelEditor.ts                # Tiptap instance + chapter sync
│   └── useNovelPersistence.ts           # localStorage load/save, storage events
├── lib/
│   ├── novel-storage.ts                 # Parse/validate/migrate/serialize
│   ├── novel-storage.test.ts
│   └── utils.ts                         # cn()
└── types/
    └── novel.ts                         # Chapter, NovelStorageDocument, version
```

CI: `.github/workflows/ci.yml` runs `npm ci`, `lint`, `test`, and `build`.

## Application entry

- **`src/app/layout.tsx`** — NovelWrite metadata, Geist fonts, global styles.
- **`src/app/page.tsx`** — Client page wiring persistence, editor hook, rewrite state, and layout components.

## Data model and persistence

- **Chapter** — `{ id, title, content }` (`src/types/novel.ts`).
- **Stored document** — `{ version: 1, updatedAt, chapters, activeChapterId? }`. Legacy **array-only** JSON is accepted and migrated on read (`src/lib/novel-storage.ts`).
- **Key** — `novelwrite-chapters` in `localStorage`.
- **Save** — Debounced **500ms** after `chapters` or `activeChapterId` changes once hydrated (`useNovelPersistence`).
- **Cross-tab** — `storage` event reloads validated data and shows a dismissible banner.
- **Import / export** — Sidebar **Import** (`.json`, replaces after confirm) and **Export** (downloads current document JSON).

## Editor behavior

- Configured in `useNovelEditor` with `immediatelyRender: false`.
- Markdown read via a typed helper around `editor.storage` (Tiptap’s `Storage` type does not list the markdown plugin by default).
- Chapter switch: effect depends on `activeChapterId` (not full chapter content) to avoid resetting while typing.

## Assistant

- **UI** — Right panel: selection preview, **Rewrite selection** → `POST /api/assistant/rewrite` with `{ text }`. Response is a deterministic stub until a model is wired.
- **Floating bar** — Write / Describe / Brainstorm remain disabled with “Coming soon” tooltips.

## Styling (`globals.css`)

- Light-first shell: `@theme` tokens and `:root` surfaces; no `prefers-color-scheme` flip (the writing UI is explicitly light).

## Scripts

- `npm run dev` — dev server  
- `npm run build` / `npm run start` — production  
- `npm run lint` — ESLint  
- `npm run test` — Vitest once  

---

For framework-specific or breaking API details, this repo points agents at `node_modules/next/dist/docs/` per `AGENTS.md`.
