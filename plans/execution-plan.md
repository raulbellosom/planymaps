# Planymaps - Execution Plan

## Project Overview

A real-time collaborative canvas for teams combining Canva/Figma-like editing, mobile-first touch gestures, layered composition, image annotations, and geolocated pins. Built on React + Next.js + Konva frontend with Appwrite backend.

## Tech Stack

| Layer    | Technologies                                             |
| -------- | -------------------------------------------------------- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS                 |
| Editor   | react-konva / Konva, Zustand, dnd-kit                    |
| Backend  | Appwrite (Auth, Databases, Storage, Realtime, Functions) |
| Maps     | MapLibre or Leaflet (future), EXIF for geolocation       |

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    EDITOR SUBSYSTEM                         │
│  React + Konva + Zustand + dnd-kit                         │
│  - Rendering layers and objects                             │
│  - Selection and transformations                            │
│  - Touch interactions, grouping, ordering                    │
├─────────────────────────────────────────────────────────────┤
│                   BACKEND SUBSYSTEM                         │
│  Appwrite                                                   │
│  - Auth, Workspaces, Boards, Layers, Items, Assets         │
│  - Realtime subscriptions                                   │
├─────────────────────────────────────────────────────────────┤
│               OPTIONAL MAP/GEOLOCATION                     │
│  Future phase - MapLibre/Leaflet integration               │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Foundation (T-0001 to T-0006)

| Task   | Name                      | Key Deliverables                                |
| ------ | ------------------------- | ----------------------------------------------- |
| T-0001 | Project Bootstrap         | Next.js + TypeScript + Tailwind + Linting setup |
| T-0002 | App Shell Layout          | Responsive layout regions, navigation structure |
| T-0003 | Appwrite Backend Scaffold | Appwrite SDK integration, service layer modules |
| T-0004 | Workspace Model           | Workspace + membership model, role-based access |
| T-0005 | Board Domain Model        | Boards, Layers, Items schemas and types         |
| T-0006 | Asset Upload Pipeline     | Image uploads, metadata persistence             |

## Phase 2: Editor Core (T-0007 to T-0010)

| Task   | Name                       | Key Deliverables                                        |
| ------ | -------------------------- | ------------------------------------------------------- |
| T-0007 | Editor State Architecture  | Zustand stores, persisted vs transient state separation |
| T-0008 | Konva Stage Foundation     | Stage rendering, layer visibility/opacity               |
| T-0009 | Shape Primitives           | Rectangle, ellipse, line, arrow, text, image renderers  |
| T-0010 | Selection Transform System | Single/multi-select, drag, resize, rotate handles       |

## Phase 3: Layers and Object Management (T-0011 to T-0014)

| Task   | Name                       | Key Deliverables                                     |
| ------ | -------------------------- | ---------------------------------------------------- |
| T-0011 | Layer Panel Foundation     | Layer list UI, selection sync                        |
| T-0012 | Ordering Commands          | Drag-drop reorder, z-index commands                  |
| T-0013 | Visibility/Locking/Opacity | Layer and item visibility, locking, opacity controls |
| T-0014 | Grouping/Ungrouping        | Multi-select grouping, group transforms              |

## Phase 4: Editing UX and Media (T-0015 to T-0018)

| Task   | Name                      | Key Deliverables                         |
| ------ | ------------------------- | ---------------------------------------- |
| T-0015 | Custom Context Menu       | Right-click and long-press menus         |
| T-0016 | Mobile Gesture System     | Pinch zoom, pan, touch-safe interactions |
| T-0017 | Background Image Workflow | Image backgrounds, replacement flow      |
| T-0018 | Asset EXIF Geolocation    | EXIF extraction, GPS metadata storage    |

## Phase 5: Annotation and Collaboration (T-0019 to T-0021)

| Task   | Name                     | Key Deliverables                           |
| ------ | ------------------------ | ------------------------------------------ |
| T-0019 | Manual Pins/Notes        | Pin item type, manual placement            |
| T-0020 | Realtime Board Updates   | Appwrite Realtime subscriptions            |
| T-0021 | Persistence Optimization | Load/save efficiency, payload optimization |

## Phase 6: Product Hardening (T-0022 to T-0023)

| Task   | Name                 | Key Deliverables                      |
| ------ | -------------------- | ------------------------------------- |
| T-0022 | Responsive Hardening | Mobile/tablet polish, usability fixes |
| T-0023 | Map Mode Foundation  | Optional map-aware board mode         |

## Phase 7: Release Candidate (T-0024)

| Task   | Name                | Key Deliverables                          |
| ------ | ------------------- | ----------------------------------------- |
| T-0024 | QA and Release Prep | Final validation, documentation alignment |

---

## MCP Appwrite Configuration Status

**Configuration File:** `c:/Users/raulb/AppData/Roaming/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`

| Setting     | Value                             | Status |
| ----------- | --------------------------------- | ------ |
| Server Name | `appwrite-api-planymaps`          | ✓      |
| Command     | `uvx mcp-server-appwrite`         | ✓      |
| Project ID  | `planymaps`                       | ✓      |
| Endpoint    | `https://aprod.racoondevs.com/v1` | ✓      |
| API Key     | Configured                        | ✓      |

**Assessment:** Configuration is structurally correct for RooCode integration.

---

## Recommended Execution Workflow

1. **Start with T-0001** - Bootstrap the Next.js project
2. **Proceed sequentially** through each phase
3. **Validate after each task** with `pnpm lint`, `pnpm typecheck`, `pnpm build`
4. **Update documentation** when architecture changes occur
5. **Do not begin map mode** until Phase 6 (T-0023)

---

## Key Architectural Decisions

| Decision                | Rationale                                        |
| ----------------------- | ------------------------------------------------ |
| Konva over Fabric.js    | Better React integration, layer management       |
| Zustand for state       | Clear separation of persisted vs transient state |
| Normalized data model   | Avoid monolithic payloads, better performance    |
| Image backgrounds first | Unlock layout annotation before maps             |
| Appwrite for backend    | Provides auth, storage, databases, realtime      |

---

## Validation Commands (per task)

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

---

## Next Action

Switch to **Code mode** to begin executing **T-0001 - Project Bootstrap**.

---

_Plan generated from: README.md, START-HERE.md, docs/01-10, tasks/T-0001-T-0024_
