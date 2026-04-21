"use client";

import dynamic from "next/dynamic";
import type { Board, Layer, BoardItem } from "@/types/board";

// Konva uses the browser Canvas API — must not be server-rendered.
// `ssr: false` is only allowed inside Client Components.
const ReadOnlyCanvas = dynamic(
  () =>
    import("@/components/editor/read-only-canvas").then(
      (m) => m.ReadOnlyCanvas,
    ),
  { ssr: false },
);

interface ShareCanvasProps {
  board: Board;
  layers: Layer[];
  items: BoardItem[];
  token: string;
}

export function ShareCanvas({ board, layers, items, token }: ShareCanvasProps) {
  return (
    <ReadOnlyCanvas board={board} layers={layers} items={items} token={token} />
  );
}
