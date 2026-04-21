/**
 * Layer Color Palette
 * Assigns a deterministic, visually distinct color to each layer
 * based on a hash of the layer's $id so colors remain stable across sessions.
 */

export const LAYER_PALETTE = [
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
] as const;

export function getLayerColor(layerId: string): string {
  let hash = 0;
  for (let i = 0; i < layerId.length; i++) {
    hash = (hash * 31 + layerId.charCodeAt(i)) | 0;
  }
  return LAYER_PALETTE[Math.abs(hash) % LAYER_PALETTE.length];
}
