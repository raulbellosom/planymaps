<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Planymaps — Agent Guide

Real-time collaborative canvas. Users create **workspaces** → **boards** (layers + items rendered in Konva). Boards support multi-user real-time editing (Appwrite Realtime) and public view-only share links.

## Must-Read Docs Before Coding

| Topic                           | File                                                                       |
| ------------------------------- | -------------------------------------------------------------------------- |
| Product overview + use cases    | [docs/01-product-overview.md](docs/01-product-overview.md)                 |
| Architecture (3 subsystems)     | [docs/02-system-architecture.md](docs/02-system-architecture.md)           |
| Tech stack rationale            | [docs/03-tech-stack.md](docs/03-tech-stack.md)                             |
| Data model (Board, Layer, Item) | [docs/04-data-model.md](docs/04-data-model.md)                             |
| Editor interaction model        | [docs/05-editor-interaction-model.md](docs/05-editor-interaction-model.md) |
| Appwrite backend layout         | [docs/07-appwrite-backend.md](docs/07-appwrite-backend.md)                 |
| Realtime strategy               | [docs/08-realtime-strategy.md](docs/08-realtime-strategy.md)               |
| **AI agent rules** ← read this  | [docs/09-ai-agent-operating-rules.md](docs/09-ai-agent-operating-rules.md) |
| Authorization system            | [docs/11-authorization-system.md](docs/11-authorization-system.md)         |
| Task backlog                    | [tasks/INDEX.md](tasks/INDEX.md)                                           |

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm lint         # ESLint (Next.js rules)
pnpm typecheck    # tsc --noEmit
```

## Stack

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 16.2 (App Router) — see Next.js warning above     |
| UI        | React 19 + Tailwind CSS 4                                 |
| Canvas    | react-konva / Konva 10                                    |
| State     | Zustand 5 (`board-store` persisted, `ui-store` transient) |
| Drag-drop | dnd-kit (layer panel only)                                |
| Backend   | Appwrite 24 (Auth, DB, Storage, Realtime, Functions)      |

## Project Structure

```
src/
	app/            # Next.js routes (board/, workspace/, share/, (auth)/)
	components/
		editor/       # Konva canvas + item renderers (item-renderers/)
		layout/       # Panels, toolbars, navbar
		board/        # Workspace/board list UI
		ui/           # Reusable primitives
	contexts/       # AuthContext, WorkspaceContext
	hooks/          # use-* hooks (use-shape-creator, use-realtime-board, …)
	lib/
		appwrite/     # SDK singletons — always use getClient(), getDatabases(), etc.
		realtime/     # realtime-service.ts (subscription + event handlers)
	services/       # Business logic / Appwrite CRUD (board-service, workspace-service, share-service, …)
	stores/         # board-store.ts (persisted), ui-store.ts (transient)
	types/          # board.ts, workspace.ts, asset.ts, platform.ts
	env.ts          # All env var accessors — never hardcode collection/bucket IDs
```

## Two-Store Pattern (Critical)

```
board-store  →  persisted state (layers, items, board metadata, isDirty)
ui-store     →  transient state (selectedItemIds, activeTool, viewport, drawing flags, overlays)
```

Never mix persisted and transient state. Selection, gesture flags, and overlay positions always go in `ui-store`.

## Realtime Collaboration

See [docs/08-realtime-strategy.md](docs/08-realtime-strategy.md) and `src/lib/realtime/realtime-service.ts`.

- Wrap every store mutation from a remote event with the `isApplyingRemote()` guard.
- Check `src/lib/dirty-items.ts` before applying remote updates to avoid overwriting in-flight local edits.
- Appwrite has **no server-side subscription filter** — subscribe to full collections, filter client-side by `boardId`.
- Feedback-loop prevention is synchronous (boolean flag); be careful with rapid concurrent events.

## Access & Sharing Model

| Scope           | Detail                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Workspace roles | `owner` / `admin` / `editor` / `viewer` — see `src/types/workspace.ts`                            |
| Public share    | Token-based, view-only, optional expiry — `src/services/share-service.ts`, route `/share/[token]` |

Never enforce permissions in UI only. Use Appwrite document permissions and `src/lib/authorization.ts`.

## Naming Conventions

| Artifact   | Pattern                             |
| ---------- | ----------------------------------- |
| Services   | `*-service.ts`                      |
| Hooks      | `use-*.ts`                          |
| Stores     | `*-store.ts`                        |
| Components | `PascalCase.tsx`                    |
| Types      | `src/types/*.ts`, grouped by domain |

## Anti-Patterns — DO NOT

- Build one monolithic `BoardEditor.tsx`
- Embed raw base64 images in persisted board records (store asset references only)
- Hardcode Appwrite collection/bucket IDs — use `src/env.ts` accessors
- Tie map logic into editor core before visual board mode is stable
- Mix persisted board state with transient editor state
- Add new dependencies without updating `docs/03-tech-stack.md`
- Enforce access control only in the UI layer

## Task Execution Rules

1. Read the task file fully before touching code.
2. Check its dependency list.
3. Implement **only** in-scope items.
4. Run `pnpm lint && pnpm typecheck` before marking done.
5. Update at least one doc when architecture changes.
6. Record unresolved issues in the task file's Result Notes section.

## Appwrite Config

All collection/bucket IDs come from environment variables accessed via `src/env.ts`.  
Schema definitions: [appwrite.config.json](appwrite.config.json). Database ID: `planymaps_db`.  
Appwrite endpoint configured at `https://aprod.racoondevs.com/v1`.
