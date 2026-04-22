# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Architecture Patterns

### Two-Store Pattern (MUST FOLLOW)

- [`board-store`](src/stores/board-store.ts) → persisted state only (layers, items, board metadata, isDirty)
- [`ui-store`](src/stores/ui-store.ts) → transient state only (selection, activeTool, viewport, gestures, overlays)
- **Never mix persisted and transient state**

### Realtime Collaboration Guards

- Wrap remote store mutations with [`isApplyingRemote()`](src/lib/realtime/realtime-service.ts:46) guard
- Check [`isItemDirty()`](src/lib/dirty-items.ts:37) before applying remote item updates (prevents snap-back)
- Dirty items auto-expire after 5 seconds as safety valve
- Appwrite has **no server-side subscription filter** — all filtering is client-side by boardId

### Authorization

- Permissions enforced at service layer via [`src/lib/authorization.ts`](src/lib/authorization.ts)
- **Never enforce access control only in UI** — use Appwrite document permissions + authorization helpers

### Anti-Patterns — DO NOT

- Build monolithic `BoardEditor.tsx`
- Embed raw base64 images in board records (store asset references only)
- Hardcode Appwrite collection/bucket IDs — use [`src/env.ts`](src/env.ts) accessors
- Tie map logic into editor core before visual board mode is stable
- Mix persisted board state with transient editor state

### Naming Conventions

| Artifact   | Pattern          |
| ---------- | ---------------- |
| Services   | `*-service.ts`   |
| Hooks      | `use-*.ts`       |
| Stores     | `*-store.ts`     |
| Components | `PascalCase.tsx` |

### Appwrite Config

- All collection/bucket IDs via [`src/env.ts`](src/env.ts) (never hardcode)
- Server-side env (`APPWRITE_API_KEY`) separate from client vars
- Endpoint: `https://aprod.racoondevs.com/v1`, Database: `planymaps_db`

### Task Execution Rules

1. Read task file fully before touching code
2. Check its dependency list
3. Run `pnpm lint && pnpm typecheck` before marking done
4. Update at least one doc when architecture changes

## Must-Read Docs

| Topic                | File                                                               |
| -------------------- | ------------------------------------------------------------------ |
| Data model           | [docs/04-data-model.md](docs/04-data-model.md)                     |
| Authorization system | [docs/11-authorization-system.md](docs/11-authorization-system.md) |
