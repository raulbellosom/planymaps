/**
 * useRealtimeBoard Hook
 * Subscribes to realtime updates for a specific board
 */

import { useEffect, useCallback } from "react";
import {
  subscribeToBoard,
  unsubscribeAll,
  type RealtimeEvent,
} from "@/lib/realtime";
import type { Board, Layer, BoardItem } from "@/types/board";

export interface UseRealtimeBoardOptions {
  boardId: string;
  enabled?: boolean;
  onBoardUpdate?: (board: Board) => void;
  onLayerEvent?: (event: RealtimeEvent<Layer>) => void;
  onItemEvent?: (event: RealtimeEvent<BoardItem>) => void;
}

export interface UseRealtimeBoardReturn {
  isConnected: boolean;
  disconnect: () => void;
}

/**
 * Hook to subscribe to realtime updates for a board
 */
export function useRealtimeBoard(
  options: UseRealtimeBoardOptions,
): UseRealtimeBoardReturn {
  const {
    boardId,
    enabled = true,
    onBoardUpdate,
    onLayerEvent,
    onItemEvent,
  } = options;

  const disconnect = useCallback(() => {
    unsubscribeAll();
  }, []);

  useEffect(() => {
    if (!enabled || !boardId) {
      return;
    }

    // Subscribe to realtime updates
    const unsubscribe = subscribeToBoard(boardId, {
      onBoardUpdate,
      onLayerEvent,
      onItemEvent,
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      unsubscribe();
    };
  }, [enabled, boardId, onBoardUpdate, onLayerEvent, onItemEvent]);

  return {
    isConnected: enabled && !!boardId,
    disconnect,
  };
}
