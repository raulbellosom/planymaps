"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { PanelProvider } from "@/contexts/panel-context";
import { TopToolbar } from "@/components/layout/top-toolbar";
import { Navbar } from "@/components/layout/navbar";
import { LeftToolsPanel } from "@/components/layout/left-tools-panel";
import { RightInspectorPanel } from "@/components/layout/right-inspector-panel";
import { LayerPanel } from "@/components/layout/layer-panel";
import { BoardConfigurationPanel } from "@/components/layout/board-configuration-panel";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useBoardSync } from "@/hooks/use-board-sync";
import { useRealtimeBoard } from "@/hooks/use-realtime-board";
import { showSuccess, showError } from "@/lib/toast";
import type { Board } from "@/types/board";
import { getMemberRole } from "@/services/workspace-service";
import { canEditBoard } from "@/lib/authorization";
import type { WorkspaceRole } from "@/types/workspace";
import {
  getBoard,
  listBoardLayers,
  listBoardItems,
  listWorkspaceBoards,
  deleteBoard,
} from "@/services/board-service";
import { getCurrentUser } from "@/lib/appwrite/auth";
import {
  getFilePreview,
  getBoardThumbnailsBucketId,
} from "@/lib/appwrite/storage";
import {
  AlertTriangle,
  Loader2,
  Folder,
  Trash2,
  ArrowLeft,
  Settings2,
  Calendar,
  RefreshCw,
  Ruler,
  Map,
  Layers,
  Palette,
} from "lucide-react";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { CreateBoardWizard } from "@/components/board/create-board-wizard";
import { PinEditModal } from "@/components/editor/pin-edit-modal";
import { BoardSettingsModal } from "@/components/editor/board-settings-modal";

// Konva uses the browser Canvas API — must not be server-rendered
const EditorCanvas = dynamic(
  () => import("@/components/editor/editor-canvas").then((m) => m.EditorCanvas),
  { ssr: false },
);

// Read-only surface reused for authenticated viewers (no share-proxy needed)
const ViewerCanvas = dynamic(
  () =>
    import("@/components/editor/read-only-canvas").then(
      (m) => m.ReadOnlyCanvas,
    ),
  { ssr: false },
);

function BoardContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspace");
  const boardId = searchParams.get("board");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workspaceBoards, setWorkspaceBoards] = useState<Board[] | null>(null);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null);
  const [showDeleteBoardModal, setShowDeleteBoardModal] =
    useState<Board | null>(null);
  const [showEditBoardModal, setShowEditBoardModal] = useState<Board | null>(
    null,
  );
  const [editBoardName, setEditBoardName] = useState("");
  const [editBoardDescription, setEditBoardDescription] = useState("");
  const [showBoardSettingsModal, setShowBoardSettingsModal] =
    useState<Board | null>(null);

  const board = useBoardStore((state) => state.board);
  const boards = useBoardStore((state) => state.boards);
  const layers = useBoardStore((state) => state.layers);
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const loadBoard = useBoardStore((state) => state.loadBoard);
  const setBoards = useBoardStore((state) => state.setBoards);
  const addBoard = useBoardStore((state) => state.addBoard);
  const removeBoard = useBoardStore((state) => state.removeBoard);
  const renameBoard = useBoardStore((state) => state.renameBoard);
  const createLayer = useBoardStore((state) => state.createLayer);
  const updateLayer = useBoardStore((state) => state.updateLayer);
  const removeLayer = useBoardStore((state) => state.removeLayer);

  const selectedLayerId = useUIStore((state) => state.selectedLayerId);
  const selectLayer = useUIStore((state) => state.selectLayer);
  const pinEditModal = useUIStore((state) => state.pinEditModal);
  const setPinEditModal = useUIStore((state) => state.setPinEditModal);

  // Derive edit permission from resolved workspace role (fail-closed: null → false)
  const canEdit = canEditBoard(userRole);

  // Persistence: sync store changes → Appwrite only for users who can edit
  useBoardSync(board && canEdit ? boardId : null);

  // Realtime: receive remote changes (viewers also see live updates)
  useRealtimeBoard({ boardId: boardId ?? "", enabled: !!boardId });

  // Load board or workspace boards on mount; also resolve workspace role.
  useEffect(() => {
    const loadData = async () => {
      // If boardId is provided, load specific board
      if (boardId) {
        try {
          setIsLoading(true);
          setLoadError(null);
          setWorkspaceBoards(null);

          const [boardData, layersData, itemsData, user] = await Promise.all([
            getBoard(boardId),
            listBoardLayers(boardId),
            listBoardItems(boardId),
            getCurrentUser().catch(() => null),
          ]);

          loadBoard(boardData, layersData, itemsData);

          if (layersData.length > 0) {
            selectLayer(layersData[0].$id);
          }

          // Resolve workspace role for permission enforcement
          if (user) {
            setCurrentUserId(user.$id);
            const wsId = workspaceId || boardData.workspaceId;
            if (wsId) {
              try {
                const role = await getMemberRole(wsId, user.$id);
                setUserRole(role ?? "viewer");
              } catch {
                setUserRole("viewer"); // fail-closed
              }
            } else {
              setUserRole("viewer");
            }
          } else {
            setUserRole("viewer");
          }
        } catch (err) {
          console.error("Failed to load board:", err);
          setLoadError(
            err instanceof Error ? err.message : "Failed to load board",
          );
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // If only workspaceId is provided, list workspace boards
      if (workspaceId) {
        try {
          setIsLoading(true);
          setLoadError(null);

          const [workspaceBoardsList, user] = await Promise.all([
            listWorkspaceBoards(workspaceId),
            getCurrentUser().catch(() => null),
          ]);
          setWorkspaceBoards(workspaceBoardsList);
          setBoards(workspaceBoardsList);

          // Resolve role so we can gate list-view actions
          if (user) {
            setCurrentUserId(user.$id);
            try {
              const role = await getMemberRole(workspaceId, user.$id);
              setUserRole(role ?? "viewer");
            } catch {
              setUserRole("viewer");
            }
          } else {
            setUserRole("viewer");
          }
        } catch (err) {
          console.error("Failed to load workspace boards:", err);
          setLoadError(
            err instanceof Error ? err.message : "Failed to load boards",
          );
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // No params provided
      setLoadError("No board or workspace ID provided");
      setIsLoading(false);
    };

    loadData();
  }, [boardId, workspaceId, loadBoard, selectLayer, setBoards]);

  // Handle create layer
  const handleCreateLayer = useCallback(() => {
    if (!board) return;
    const newLayer = createLayer(board.$id);
    selectLayer(newLayer.$id);
  }, [board, createLayer, selectLayer]);

  // Handle delete layer
  const handleDeleteLayer = useCallback(() => {
    if (!selectedLayerId) return;

    // Check minimum 1 layer protection
    if (layers.length <= 1) {
      showError("Cannot delete", "At least one layer must remain");
      return;
    }

    const layerToDelete = layers.find((l) => l.$id === selectedLayerId);
    if (!layerToDelete) return;

    // Remove layer
    removeLayer(selectedLayerId);

    // Select another layer
    const remainingLayers = layers.filter((l) => l.$id !== selectedLayerId);
    if (remainingLayers.length > 0) {
      selectLayer(remainingLayers[0].$id);
    }
  }, [selectedLayerId, layers, removeLayer, selectLayer]);

  // Handle toggle layer visibility
  const handleToggleLayerVisibility = useCallback(() => {
    if (!selectedLayerId) return;
    const layer = layers.find((l) => l.$id === selectedLayerId);
    if (layer) {
      updateLayer(selectedLayerId, { visible: !layer.visible });
    }
  }, [selectedLayerId, layers, updateLayer]);

  // Handle toggle layer lock
  const handleToggleLayerLock = useCallback(() => {
    if (!selectedLayerId) return;
    const layer = layers.find((l) => l.$id === selectedLayerId);
    if (layer) {
      updateLayer(selectedLayerId, { locked: !layer.locked });
    }
  }, [selectedLayerId, layers, updateLayer]);

  // Handle create board (called by wizard)
  const handleCreateBoard = useCallback(
    async (board: Board) => {
      addBoard(board);
      setWorkspaceBoards((prev) => (prev ? [...prev, board] : [board]));
      setShowCreateBoardModal(false);
    },
    [addBoard],
  );

  // Handle delete board
  const handleDeleteBoard = useCallback(
    async (boardId: string) => {
      try {
        await deleteBoard(boardId);
        removeBoard(boardId);
        setWorkspaceBoards((prev) =>
          prev ? prev.filter((b) => b.$id !== boardId) : null,
        );
      } catch (err) {
        console.error("Failed to delete board:", err);
        showError(
          "Error",
          err instanceof Error ? err.message : "Failed to delete board",
        );
      }
    },
    [removeBoard],
  );

  // Handle edit board - open modal
  const handleEditBoard = useCallback((board: Board) => {
    setEditBoardName(board.name || "");
    setEditBoardDescription(board.description || "");
    setShowEditBoardModal(board);
  }, []);

  // Handle save edit board
  const handleSaveEditBoard = useCallback(async () => {
    if (!showEditBoardModal) return;
    try {
      await renameBoard(showEditBoardModal.$id, editBoardName.trim());
      // Update local workspace boards list
      setWorkspaceBoards((prev) =>
        prev
          ? prev.map((b) =>
              b.$id === showEditBoardModal.$id
                ? {
                    ...b,
                    name: editBoardName.trim(),
                    description: editBoardDescription.trim(),
                  }
                : b,
            )
          : null,
      );
      setShowEditBoardModal(null);
      showSuccess("Board updated", "Board has been updated successfully.");
    } catch (err) {
      console.error("Failed to update board:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to update board",
      );
    }
  }, [showEditBoardModal, editBoardName, editBoardDescription, renameBoard]);

  // Register keyboard shortcuts — disabled for viewers (no editing)
  useKeyboardShortcuts({
    onCreateLayer: handleCreateLayer,
    onDeleteLayer: handleDeleteLayer,
    onToggleLayerVisibility: handleToggleLayerVisibility,
    onToggleLayerLock: handleToggleLayerLock,
    enabled: canEdit,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--navy-900)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[var(--accent-500)] animate-spin" />
          <span className="text-[var(--gray-400)] text-sm">
            {boardId ? "Loading board..." : "Loading workspace boards..."}
          </span>
        </div>
      </div>
    );
  }

  // Workspace boards list view (when only workspaceId is provided, no boardId)
  if (workspaceBoards !== null) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-auto bg-[var(--navy-900)] pt-20 md:pt-24 px-6 md:px-8 pb-8">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => (window.location.href = "/workspace")}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                  title="Exit to workspaces"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-white">
                  Workspace Boards
                </h2>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowCreateBoardModal(true)}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors"
                >
                  Create Board
                </button>
              )}
            </div>
            {workspaceBoards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--gray-400)]">
                  No boards in this workspace yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {workspaceBoards.map((b) => (
                  <a
                    key={b.$id}
                    href={`/board?workspace=${workspaceId}&board=${b.$id}`}
                    className="group block glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[var(--accent-500)]/15 hover:-translate-y-1 hover:glass-border"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-32 bg-gradient-to-br from-[var(--navy-700)] to-[var(--navy-800)] flex items-center justify-center border-b border-white/5 overflow-hidden">
                      {b.thumbnailFileId ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getFilePreview(
                            getBoardThumbnailsBucketId(),
                            b.thumbnailFileId,
                            400,
                            128,
                            80,
                          )}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-500)]/20 flex items-center justify-center">
                          <Folder className="w-6 h-6 text-[var(--accent-400)]" />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="p-5">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            b.mode === "geo"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-[var(--accent-500)]/15 text-[var(--accent-400)]"
                          }`}
                        >
                          {b.mode === "geo" ? (
                            <Map className="w-2.5 h-2.5" />
                          ) : (
                            <Layers className="w-2.5 h-2.5" />
                          )}
                          {b.mode}
                        </span>
                        {b.backgroundType !== "none" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-white/8 text-[var(--gray-400)]">
                            bg: {b.backgroundType}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-[var(--gray-50)] mb-1 group-hover:text-[var(--accent-400)] transition-colors">
                        {b.name}
                      </h3>
                      {b.description ? (
                        <p className="text-sm text-[var(--gray-500)] line-clamp-2 mb-2">
                          {b.description}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--gray-600)] mb-2 italic">
                          No description
                        </p>
                      )}
                      <div className="flex flex-col gap-1 mb-3">
                        <p className="text-xs text-[var(--gray-500)] flex items-center gap-1">
                          <Ruler className="w-3 h-3 shrink-0" />
                          {b.width} × {b.height} px
                        </p>
                        <p className="text-xs text-[var(--gray-500)] flex items-center gap-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          Created{" "}
                          {b.$createdAt
                            ? new Date(b.$createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                        <p className="text-xs text-[var(--gray-500)] flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 shrink-0" />
                          Updated{" "}
                          {b.$updatedAt
                            ? new Date(b.$updatedAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-xs text-[var(--gray-500)]">
                          Click to open
                        </span>
                        {canEdit && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditBoard(b);
                              }}
                              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="Edit board"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setShowBoardSettingsModal(b);
                              }}
                              className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-colors"
                              title="Background settings"
                            >
                              <Palette className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setShowDeleteBoardModal(b);
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete board"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Create Board Modal — Wizard */}
          <BlueprintModal
            isOpen={showCreateBoardModal}
            onClose={() => setShowCreateBoardModal(false)}
            title="Create New Board"
            size="lg"
          >
            {currentUserId && workspaceId && (
              <CreateBoardWizard
                workspaceId={workspaceId}
                userId={currentUserId}
                onComplete={(board) => handleCreateBoard(board)}
                onCancel={() => setShowCreateBoardModal(false)}
              />
            )}
          </BlueprintModal>

          {/* Delete Board Confirmation Modal */}
          <BlueprintModal
            isOpen={showDeleteBoardModal !== null}
            onClose={() => setShowDeleteBoardModal(null)}
            title="Delete Board"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-[var(--gray-300)]">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  &quot;{showDeleteBoardModal?.name}&quot;
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteBoardModal(null)}
                  className="px-4 py-2 rounded-lg text-[var(--gray-300)] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteBoardModal) {
                      handleDeleteBoard(showDeleteBoardModal.$id);
                      setShowDeleteBoardModal(null);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </BlueprintModal>

          {/* Board Background Settings Modal */}
          {showBoardSettingsModal && workspaceId && currentUserId && (
            <BoardSettingsModal
              key={showBoardSettingsModal.$id}
              isOpen={showBoardSettingsModal !== null}
              onClose={() => setShowBoardSettingsModal(null)}
              board={showBoardSettingsModal}
              workspaceId={workspaceId}
              userId={currentUserId}
              onSaved={(updated) => {
                setWorkspaceBoards((prev) =>
                  prev
                    ? prev.map((b) => (b.$id === updated.$id ? updated : b))
                    : null,
                );
                setShowBoardSettingsModal(null);
              }}
            />
          )}

          {/* Edit Board Modal */}
          <BlueprintModal
            isOpen={showEditBoardModal !== null}
            onClose={() => setShowEditBoardModal(null)}
            title="Edit Board"
            size="md"
          >
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (editBoardName.trim()) handleSaveEditBoard();
              }}
            >
              <div>
                <label className="block text-sm text-[var(--gray-400)] mb-1.5">
                  Board Name
                </label>
                <input
                  type="text"
                  value={editBoardName}
                  onChange={(e) => setEditBoardName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors"
                  placeholder="Board name"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--gray-400)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={editBoardDescription}
                  onChange={(e) => setEditBoardDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors resize-none"
                  rows={3}
                  placeholder="Add a description..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowEditBoardModal(null)}
                  className="px-4 py-2 rounded-lg text-[var(--gray-300)] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editBoardName.trim()}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-medium transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </BlueprintModal>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !board) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--navy-900)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-500)]/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[var(--accent-500)]" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">
              {loadError ? "Failed to load board" : "No board loaded"}
            </h3>
            <p className="text-[var(--gray-400)] text-sm">
              {loadError || "Board data is not available"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Viewer mode (role = viewer or null): read-only canvas, no editing UI ──
  if (!canEdit) {
    const allItems = Object.values(itemsByLayer).flat();
    return (
      <>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopToolbar readOnly />
          <div className="flex-1 relative overflow-hidden">
            <ViewerCanvas board={board} layers={layers} items={allItems} />
          </div>
        </div>

        {/* Read-only pin info modal — viewers can double-click pins to see details */}
        {pinEditModal && boardId && currentUserId && (
          <PinEditModal
            isOpen={true}
            onClose={() => setPinEditModal(null)}
            itemId={pinEditModal.itemId}
            workspaceId={board.workspaceId ?? workspaceId ?? ""}
            boardId={boardId}
            userId={currentUserId}
            readOnly
          />
        )}
      </>
    );
  }

  // ── Editor mode (role = editor / admin / owner) ──────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopToolbar />
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left tools panel */}
        <LeftToolsPanel />

        {/* Center: Editor canvas */}
        <EditorCanvas />

        {/* Right inspector panel */}
        <RightInspectorPanel />

        {/* Board configuration panel */}
        <BoardConfigurationPanel />

        {/* Layer panel - positioned at bottom-left */}
        <LayerPanel />
      </div>

      {/* Pin Edit Modal — driven by ui-store.pinEditModal */}
      {pinEditModal && workspaceId && boardId && currentUserId && (
        <PinEditModal
          isOpen={true}
          onClose={() => setPinEditModal(null)}
          itemId={pinEditModal.itemId}
          workspaceId={workspaceId}
          boardId={boardId}
          userId={currentUserId}
        />
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <PanelProvider>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Main content area */}
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-[var(--navy-900)]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[var(--accent-500)] animate-spin" />
                <span className="text-[var(--gray-400)] text-sm">
                  Loading...
                </span>
              </div>
            </div>
          }
        >
          <BoardContent />
        </Suspense>
      </div>
    </PanelProvider>
  );
}
