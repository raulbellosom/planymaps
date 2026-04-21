# Layer Management System - Implementation Plan

## Overview

This document outlines the implementation plan for a comprehensive layer management system integrated into the Planymaps workspace interface. The system will enable users to create, organize, and manipulate layers to manage visual elements on the canvas.

## Architecture Overview

```mermaid
graph TD
    subgraph "UI Layer"
        TT[TopToolbar - Create Layer Button]
        LP[LayerPanel]
        RC[Right-Click Context Menu]
    end

    subgraph "State Management"
        BS[BoardStore - Zustand]
        US[UIStore - Zustand]
        HS[HistoryStore - Undo/Redo]
    end

    subgraph "Services"
        PS[Persistence Hook]
        BSVC[Board Service - Appwrite]
    end

    subgraph "Rendering"
        EC[EditorCanvas]
        LR[LayerRenderer]
    end

    TT -->|createLayer| BS
    LP -->|toggle/rename/reorder/delete| BS
    LP -->|select| US
    RC -->|layer ops| BS
    BS -->|persist| PS
    PS -->|debounced saves| BSVC
    HS -->|undo/redo| BS
    BS -->|layers/items| LR
    LR -->|render| EC
```

## Implementation Tasks

### 1. Undo/Redo History Store

**File:** `src/stores/history-store.ts` (new)

- Create a Zustand store for managing history
- Implement command pattern for layer operations
- Store up to 50 actions in memory
- Actions to track:
  - `createLayer`
  - `deleteLayer`
  - `renameLayer`
  - `toggleLayerVisibility`
  - `toggleLayerLock`
  - `changeLayerOpacity`
  - `reorderLayers`
  - `moveItemToLayer`

**Interface:**

```typescript
interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryEntry {
  type: string;
  timestamp: number;
  previousState: Partial<BoardState>;
  newState: Partial<BoardState>;
  description: string;
}
```

### 2. Enhance Board Store

**File:** `src/stores/board-store.ts`

Add new layer management actions:

- `createLayer()` - Auto-generate name with incrementing number (Layer 1, Layer 2, etc.)
- `deleteLayer(layerId)` - With minimum 1 layer protection
- `duplicateLayer(layerId)` - Clone layer with all items

### 3. Create Layer Button in Toolbar

**File:** `src/components/layout/top-toolbar.tsx`

- Add "Create Layer" button next to existing share button
- Position: Between share button and layer panel toggle
- Style: Accent gradient matching existing share button
- Action: Immediately creates a new layer with auto-generated name

### 4. Enhance Layer Panel

**File:** `src/components/layout/layer-panel.tsx`

**4.1 Background Styling (85% opacity)**

```css
/* New class for layer panel */
.layer-panel-bg {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

**4.2 Layer Item Component Enhancements**

| Feature           | Implementation                      |
| ----------------- | ----------------------------------- |
| Visibility Toggle | Eye icon - toggles `layer.visible`  |
| Lock Toggle       | Lock icon - toggles `layer.locked`  |
| Opacity Control   | Slider (0-100%) + percentage input  |
| Reorder Controls  | Up/Down arrows for manual reorder   |
| Drag Handle       | Visual indicator for drag-and-drop  |
| Active Indicator  | Highlight border for selected layer |
| Layer Name        | Editable on double-click            |

**4.3 Context Menu (Right-Click)**

- Bring to Front
- Send to Back
- Bring Forward
- Send Backward
- Duplicate Layer
- Delete Layer (with confirmation)
- Rename Layer

### 5. Layer Operations

**5.1 Create Layer**

- Default name: "Layer N" (where N is auto-incrementing)
- Default visibility: `true`
- Default locked: `false`
- Default opacity: `1` (100%)
- Default orderIndex: last position

**5.2 Delete Layer**

- Guard: Minimum 1 layer must exist
- Confirmation dialog required
- Items on deleted layer are also deleted
- Select next available layer after deletion

**5.3 Reorder Layers**

- Up/Down buttons in layer panel
- Drag-and-drop support
- Uses existing `ordering-commands.ts` functions
- Updates `orderIndex` for all affected layers

**5.4 Change Layer Opacity**

- Slider: 0-100%
- Direct input field
- Updates `layer.opacity` property
- Real-time canvas update via Konva layer opacity

### 6. Keyboard Shortcuts

| Shortcut       | Action                                    |
| -------------- | ----------------------------------------- |
| `Ctrl+Shift+N` | Create new layer                          |
| `Ctrl+L`       | Toggle selected layer lock                |
| `Ctrl+Shift+L` | Toggle selected layer visibility          |
| `Ctrl+[`       | Send layer backward                       |
| `Ctrl+]`       | Bring layer forward                       |
| `Ctrl+Shift+[` | Send layer to back                        |
| `Ctrl+Shift+]` | Bring layer to front                      |
| `Delete`       | Delete selected layer (with confirmation) |

### 7. State Synchronization

**Canvas Rendering:**

- `LayerRenderer` already respects `layer.visible` and `layer.opacity`
- When `layer.locked` is true, `listening={false}` prevents interaction
- Real-time updates via Zustand selector subscriptions

**Panel ↔ Canvas Sync:**

- Both `LayerPanel` and `EditorCanvas` subscribe to `useBoardStore`
- Changes propagate immediately to both
- No explicit sync needed - Zustand handles reactivity

### 8. Persistence Integration

**File:** `src/hooks/use-persistence.ts`

Layer operations that trigger persistence:

- `createLayer` → calls `boardService.createLayer()`
- `updateLayer` → calls `boardService.updateLayer()` (debounced)
- `deleteLayer` → calls `boardService.deleteLayer()`
- `reorderLayers` → calls `boardService.reorderLayers()`

### 9. Component Files to Modify

| File                                       | Changes                              |
| ------------------------------------------ | ------------------------------------ |
| `src/stores/board-store.ts`                | Add layer CRUD actions               |
| `src/stores/ui-store.ts`                   | Add layer context menu state         |
| `src/components/layout/top-toolbar.tsx`    | Add Create Layer button              |
| `src/components/layout/layer-panel.tsx`    | Full redesign with all features      |
| `src/components/editor/layer-renderer.tsx` | Add opacity/lock handling            |
| `src/components/editor/context-menu.tsx`   | Add layer operations                 |
| `src/hooks/use-persistence.ts`             | Add layer persistence                |
| `src/app/globals.css`                      | Add layer-panel-bg class             |
| `src/lib/ordering-commands.ts`             | Already has layer ordering functions |

### 10. New Files to Create

| File                                  | Purpose                    |
| ------------------------------------- | -------------------------- |
| `src/stores/history-store.ts`         | Undo/redo implementation   |
| `src/hooks/use-keyboard-shortcuts.ts` | Keyboard shortcut handling |

## Mermaid: Layer Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant Toolbar
    participant BoardStore
    participant AppwriteService
    participant Canvas

    User->>Toolbar: Click "Create Layer"
    Toolbar->>BoardStore: createLayer(autoName)
    BoardStore->>BoardStore: Generate "Layer N" name
    BoardStore->>BoardStore: Set default properties
    BoardStore->>BoardStore: Add to layers array
    BoardStore->>BoardStore: setDirty(true)
    BoardStore->>AppwriteService: createLayer()
    AppwriteService-->>BoardStore: layer created
    BoardStore-->>Canvas: state update
    Canvas-->>User: New layer visible
```

## Mermaid: Layer Deletion Flow

```mermaid
sequenceDiagram
    participant User
    participant LayerPanel
    participant ConfirmDialog
    participant BoardStore
    participant AppwriteService

    User->>LayerPanel: Right-click → Delete
    LayerPanel->>ConfirmDialog: Show confirmation
    Note over LayerPanel: Check layers.length > 1
    alt layers.length > 1
        User->>ConfirmDialog: Confirm delete
        ConfirmDialog->>BoardStore: deleteLayer(layerId)
        BoardStore->>BoardStore: Remove layer
        BoardStore->>BoardStore: Remove layer items
        BoardStore->>BoardStore: Select next layer
        BoardStore->>AppwriteService: deleteLayer()
        BoardStore->>AppwriteService: deleteLayerItems()
    else layers.length === 1
        ConfirmDialog-->>User: Show error message
        Note over ConfirmDialog: "Cannot delete last layer"
    end
```

## Implementation Priority

1. **Phase 1 - Core Layer Operations**
   - Create layer button in toolbar
   - Basic layer panel with visibility/lock toggles
   - Layer creation/deletion with minimum-1 protection

2. **Phase 2 - Enhanced UI**
   - Opacity slider
   - Reorder controls (up/down buttons)
   - Layer naming (editable)
   - 85% opacity background styling

3. **Phase 3 - Advanced Features**
   - Drag-and-drop reordering
   - Context menu
   - Keyboard shortcuts
   - Undo/redo support

## Testing Checklist

- [ ] Create layer button creates new layer immediately
- [ ] Auto-generated names increment correctly (Layer 1, Layer 2, etc.)
- [ ] Visibility toggle hides/shows layer on canvas
- [ ] Lock toggle prevents selection/editing on canvas
- [ ] Opacity slider updates canvas in real-time
- [ ] Cannot delete last remaining layer
- [ ] Confirmation dialog appears for delete
- [ ] Up/down reorder buttons work correctly
- [ ] Keyboard shortcuts trigger correct actions
- [ ] Undo reverses layer operations
- [ ] Redo restores layer operations
- [ ] Layer panel maintains 85% opacity
- [ ] Active layer shows visual selection indicator
