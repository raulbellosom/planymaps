# AGENTS.md — Ask Mode

This file provides documentation context for agents answering questions about this repository.

## Key Architectural Decisions

### Two-Store Pattern

The codebase uses two separate Zustand stores:

- **board-store** (`src/stores/board-store.ts`): Persisted board data — layers, items, board metadata. This data syncs with Appwrite.
- **ui-store** (`src/stores/ui-store.ts`): Transient UI state — selection, activeTool, viewport, gestures. Never persisted.

### Realtime Without Server-Side Filters

Appwrite Realtime doesn't support filtering by attributes. The app subscribes to entire collections and filters client-side by `boardId`. This is documented in `realtime-service.ts`.

### Dirty-Item Pattern

To prevent snap-back when remote echoes arrive during local edits, items are marked "dirty" while pending. Remote updates to dirty items are skipped. Entries auto-expire after 5 seconds.

## Data Model

- **Workspace**: Contains multiple boards, has members with roles (owner/admin/editor/viewer)
- **Board**: Has layers, has items within layers, supports background (none/color/image/map)
- **Layer**: Ordered container for items, has visibility/lock/opacity
- **BoardItem**: Positioned shape/text/image/etc with styleJson, contentJson, interactionJson

## File Organization

- `src/app/` — Next.js App Router routes
- `src/components/editor/` — Konva canvas components including `item-renderers/` subdirectory
- `src/services/` — Business logic and Appwrite CRUD operations
- `src/lib/appwrite/` — SDK singletons (client, databases, storage)
- `src/lib/realtime/` — Realtime subscription management
- `src/env.ts` — All environment variable access centralized here

## Anti-Patterns

1. Monolithic `BoardEditor.tsx` — components are split into editor/ subdirectory
2. Base64 images in board records — store asset references only
3. Hardcoded collection IDs — always use `src/env.ts` accessors
4. UI-only permission checks — use Appwrite permissions + `src/lib/authorization.ts`
