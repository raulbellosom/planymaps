"use client";

import { useState, useCallback } from "react";
import {
  HelpCircle,
  Link2,
  Layers,
  LogOut,
  Maximize2,
  Menu,
  Settings2,
  Settings,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePanels } from "@/contexts/panel-context";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { ShareModal } from "@/components/editor/share-modal";
import { KeyboardShortcutsModal } from "@/components/editor/keyboard-shortcuts-modal";
import { LogoSvg } from "@/components/ui/logo-svg";

export function TopToolbar({ readOnly = false }: { readOnly?: boolean } = {}) {
  const router = useRouter();
  const { togglePanel, panels } = usePanels();
  const board = useBoardStore((state) => state.board);
  const renameBoard = useBoardStore((state) => state.renameBoard);
  const viewport = useUIStore((state) => state.viewport);
  const setViewport = useUIStore((state) => state.setViewport);
  const resetViewport = useUIStore((state) => state.resetViewport);
  const zoomIn = useUIStore((state) => state.zoomIn);
  const zoomOut = useUIStore((state) => state.zoomOut);
  const [showShare, setShowShare] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [isEditingBoardName, setIsEditingBoardName] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState("");

  const handleBoardNameDoubleClick = useCallback(() => {
    if (board) {
      setBoardNameInput(board.name);
      setIsEditingBoardName(true);
    }
  }, [board]);

  const handleBoardNameSubmit = useCallback(async () => {
    if (board && boardNameInput.trim() && boardNameInput !== board.name) {
      await renameBoard(board.$id, boardNameInput.trim());
    }
    setIsEditingBoardName(false);
  }, [board, boardNameInput, renameBoard]);

  const handleBoardNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBoardNameSubmit();
      } else if (e.key === "Escape") {
        setIsEditingBoardName(false);
      }
    },
    [handleBoardNameSubmit],
  );

  const handleExit = useCallback(() => {
    const workspaceId = board?.workspaceId;
    if (workspaceId) {
      router.push(`/board?workspace=${workspaceId}`);
    } else {
      router.push("/workspace");
    }
  }, [router, board]);

  const handleCenterView = useCallback(() => {
    resetViewport();
  }, [resetViewport]);

  const handleZoomReset = useCallback(() => {
    setViewport({ scale: 1 });
  }, [setViewport]);

  const handleZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10) / 100;
      setViewport({ scale: Math.max(0.1, Math.min(4, value)) });
    },
    [setViewport],
  );

  return (
    <>
      <header className="h-12 glass-panel border-b border-white/10 flex items-center justify-between px-2 sm:px-4 overflow-hidden">
        {/* Left section — fixed, non-scrolling */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Exit/Back button */}
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10 text-[var(--gray-300)] hover:text-white transition-colors text-xs sm:text-sm font-medium"
            aria-label="Back to boards"
            title="Back to boards"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          {/* Tools-panel toggle — only in edit mode */}
          {!readOnly && (
            <button
              onClick={() => togglePanel("leftPanel")}
              className="p-2 sm:p-2 rounded-lg hover:bg-white/10 active:bg-white/15 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--gray-200)] hover:text-white transition-colors"
              aria-label="Toggle tools panel"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
            <LogoSvg className="w-5 h-5" alt="Planymaps" />
            <span className="hidden xs:inline">Planymaps</span>
          </span>
        </div>

        {/* Right section — horizontally scrollable on mobile */}
        <div
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* View-only badge shown to viewers */}
          {readOnly && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-white/8 text-[var(--gray-400)] border border-white/10 shrink-0">
              View only
            </span>
          )}

          {/* Board name — always visible, truncate on small screens */}
          {board && (
            isEditingBoardName && !readOnly ? (
              <input
                type="text"
                value={boardNameInput}
                onChange={(e) => setBoardNameInput(e.target.value)}
                onBlur={handleBoardNameSubmit}
                onKeyDown={handleBoardNameKeyDown}
                autoFocus
                className="bg-white/10 text-white text-sm font-medium px-2 py-1 rounded border border-white/20 outline-none focus:border-[var(--accent-500)] max-w-[120px] sm:max-w-[200px] shrink-0"
              />
            ) : (
              <span
                onDoubleClick={
                  !readOnly ? handleBoardNameDoubleClick : undefined
                }
                className={`text-white/80 text-sm font-medium px-2 truncate max-w-[100px] sm:max-w-[200px] rounded transition-colors shrink-0 ${
                  readOnly
                    ? "cursor-default"
                    : "cursor-pointer hover:text-white hover:bg-white/5"
                }`}
                title={readOnly ? undefined : "Double-click to rename"}
              >
                {board.name}
              </span>
            )
          )}

          {/* Share button — only in edit mode */}
          {board && !readOnly && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all touch-manipulation shrink-0"
              aria-label="Share board"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Zoom controls — only in edit mode */}
          {board && !readOnly && (
            <div className="flex items-center gap-0.5 relative shrink-0">
              {/* Zoom out button */}
              <button
                onClick={() => zoomOut()}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {/* Zoom percentage display/button */}
              <button
                onClick={() => setShowZoomSlider(!showZoomSlider)}
                className="px-1 sm:px-2 py-1 rounded-lg hover:bg-white/10 text-[var(--gray-300)] hover:text-white text-xs font-medium min-w-[44px] text-center transition-colors"
                aria-label="Toggle zoom slider"
                title="Adjust zoom level"
              >
                {Math.round(viewport.scale * 100)}%
              </button>
              {/* Zoom in button */}
              <button
                onClick={() => zoomIn()}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {/* Center view button */}
              <button
                onClick={handleCenterView}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                aria-label="Center view"
                title="Center view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              {/* Zoom slider popup */}
              {showZoomSlider && (
                <div className="absolute top-full mt-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 p-4 rounded-xl bg-[var(--navy-800)]/95 backdrop-blur-lg border border-white/10 shadow-xl z-50 min-w-[200px]">
                  <div className="text-xs text-[var(--gray-400)] mb-2 text-center">
                    Zoom: {Math.round(viewport.scale * 100)}%
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="400"
                    value={Math.round(viewport.scale * 100)}
                    onChange={handleZoomChange}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[var(--navy-700)] accent-[var(--accent-500)]"
                  />
                  <div className="flex justify-between text-xs text-[var(--gray-500)] mt-1">
                    <span>10%</span>
                    <span>400%</span>
                  </div>
                  <button
                    onClick={handleZoomReset}
                    className="mt-3 w-full px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                  >
                    Reset to 100%
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Help / Keyboard shortcuts button — hidden on mobile (no keyboard) */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="hidden md:flex p-2 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] items-center justify-center text-[var(--gray-400)] hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Panel toggles — all visible, always shown directly */}
          {!readOnly && (
            <>
              <button
                onClick={() => togglePanel("layerPanel")}
                className={`p-2 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors shrink-0 ${
                  panels.layerPanel
                    ? "bg-[var(--accent-500)]/20 text-[var(--accent-400)]"
                    : "text-[var(--gray-400)] hover:text-white hover:bg-white/10"
                }`}
                aria-label="Toggle layer panel"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={() => togglePanel("rightPanel")}
                className={`p-2 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors shrink-0 ${
                  panels.rightPanel
                    ? "bg-[var(--accent-500)]/20 text-[var(--accent-400)]"
                    : "text-[var(--gray-400)] hover:text-white hover:bg-white/10"
                }`}
                aria-label="Toggle inspector panel"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => togglePanel("configurationPanel")}
                className={`p-2 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors shrink-0 ${
                  panels.configurationPanel
                    ? "bg-[var(--accent-500)]/20 text-[var(--accent-400)]"
                    : "text-[var(--gray-400)] hover:text-white hover:bg-white/10"
                }`}
                aria-label="Toggle configuration panel"
              >
                <Settings className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Share modal */}
      {showShare && board && (
        <ShareModal
          boardId={board.$id}
          workspaceId={board.workspaceId}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
