# AGENTS.md — Architect Mode

This file provides architectural guidance for agents planning changes in this repository.

## Core Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (server-side Appwrite)
│   ├── (auth)/            # Auth pages (login, register, etc.)
│   ├── board/            # Board editor page
│   ├── share/[token]/    # Public share view
│   └── workspace/        # Workspace management
├── components/
│   ├── editor/           # Konva canvas + item renderers
│   ├── layout/           # Panels, navbar, toolbar
│   └── ui/               # Reusable UI primitives
├── stores/
│   ├── board-store.ts    # Persisted state (Zustand)
│   └── ui-store.ts       # Transient state (Zustand)
├── services/             # Business logic + Appwrite CRUD
├── lib/
│   ├── appwrite/         # SDK singletons
│   └── realtime/        # Realtime service
└── env.ts               # Centralized env access
```

## Two-Store Pattern (Critical Invariant)

| Store         | Responsibility                                      | Persisted         |
| ------------- | --------------------------------------------------- | ----------------- |
| `board-store` | layers, items, board metadata, isDirty              | Yes (to Appwrite) |
| `ui-store`    | selection, viewport, activeTool, gestures, overlays | No                |

Violating this pattern (e.g., putting selection in board-store) will break realtime collaboration.

## Realtime Architecture

1. Subscribe to collections without server-side filter
2. Filter client-side by boardId on each event
3. Use `isApplyingRemote()` guard before mutating stores
4. Use `isItemDirty()` to skip stale remote updates (snap-back prevention)
5. Dirty entries auto-expire after 5 seconds

## Authorization Model

- Workspace roles: owner > admin > editor > viewer
- Document permissions in Appwrite + authorization helpers in `src/lib/authorization.ts`
- Never enforce access control in UI only

## Key Constraints

- Canvas: react-konva / Konva 10 (not HTML5 Canvas)
- State: Zustand 5
- Backend: Appwrite 24 (Auth, DB, Storage, Realtime)
- Framework: Next.js 16.2 with App Router
- Package manager: pnpm
