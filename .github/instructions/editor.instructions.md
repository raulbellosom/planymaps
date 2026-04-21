---
applyTo: "src/components/editor/**,src/hooks/use-shape-creator*,src/hooks/use-realtime*,src/stores/**"
---

# Editor / Canvas Rules

## Rendering Model

- Konva renders the model — React/Zustand own it. Never mutate Konva nodes directly; always update the store and let React re-render.
- Item type → renderer dispatch lives in `src/components/editor/item-renderers/`. Add new item types there; never embed them inside `editor-canvas.tsx`.
- Selection/transform overlay lives in `multi-select-transformer.tsx`. Keep it separate from item renderers.
- Canvas event handling (mouse/touch) lives in `editor-canvas.tsx`. Delegate to hooks; don't let the canvas component grow into business logic.

## State Placement

- `board-store` = persisted (layers, items, board metadata). `ui-store` = transient (selection, active tool, viewport, drawing flags, overlay positions).
- Selection state (`selectedItemIds`) always goes in `ui-store`, never in `board-store`.
- New items created via `use-shape-creator.ts` → `store.addItem()`. The hook must not call Appwrite directly.
- Viewport pan/zoom (`x`, `y`, `scale`) lives in `ui-store`; save `viewportState` to board only on explicit save.

## Realtime Guards

- Wrap every store mutation that originates from a remote Appwrite event with the `isApplyingRemote()` flag from `src/lib/realtime/realtime-service.ts`.
- Check `src/lib/dirty-items.ts` before applying a remote update; skip the update if the item has pending local changes.
- After applying a remote mutation, clear the dirty flag only for that specific item.

## Groups

- Selecting an item whose `parentGroupId` is set must select all sibling items in that group.
- All group/ungroup logic belongs in `src/lib/grouping-service.ts`. Do not replicate it in components or hooks.

## Performance

- Scope Zustand subscriptions to the minimum slice needed. Use selector functions to avoid full-store subscriptions.
- Never store image data (base64) in the board record. Store `assetId` / URL references only.
- Keep layer re-renders isolated: changes to one layer should not trigger re-renders in other layers.

## Adding a New Item Type

1. Add the literal to `ItemType` in `src/types/board.ts`.
2. Add a renderer component in `src/components/editor/item-renderers/`.
3. Add a `case` in `use-shape-creator.ts` to build the default `BoardItem`.
4. Add default style/content in `src/types/board.ts` (`defaultStyle`, `defaultContent`).
5. Update `docs/04-data-model.md` if the new type introduces new `contentJson` fields.
