# START HERE

This file is the minimum required onboarding path for the AI coding agent.

## Objective

Build a responsive real-time collaborative canvas application with:

- layer management
- object visibility and locking
- grouping and ordering
- mobile touch gestures
- image uploads
- optional geolocation and map mode
- Appwrite backend
- React + Next.js + Konva frontend

## Non-negotiable stack decisions

- Frontend framework: **Next.js + React**
- Editor/render engine: **react-konva / Konva**
- Styling: **Tailwind CSS**
- Local editor state: **Zustand**
- Layer panel drag and drop: **dnd-kit**
- Backend platform: **Appwrite**
- Initial map strategy: **free-first**, start with image backgrounds; add map mode after editor foundation is stable

## Execution rules

1. Read all docs under `docs/` before implementing tasks.
2. Execute one task at a time.
3. Keep documentation updated with every meaningful architectural change.
4. Prefer incremental vertical slices over large unreviewed rewrites.
5. Every task must end with:
   - code changes
   - validation
   - tests or manual verification notes
   - updated documentation when relevant

## Initial delivery target

The first milestone is not full collaboration or maps.
The first milestone is a working editor foundation with:

- boards
- layers
- shapes
- image backgrounds
- selection
- transform handles
- visibility
- locking
- opacity
- ordering
- grouping
- responsive layout
- mobile-safe interactions

## Read next

1. `docs/01-product-overview.md`
2. `docs/02-system-architecture.md`
3. `docs/03-tech-stack.md`
4. `docs/04-data-model.md`
5. `docs/05-editor-interaction-model.md`
6. `docs/07-appwrite-backend.md`
7. `tasks/T-0001-project-bootstrap.md`
