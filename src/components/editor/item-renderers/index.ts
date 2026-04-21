/**
 * Item Renderers Index
 * Registry and exports for all item type renderers
 */

export { RectangleRenderer } from "./rectangle-renderer";
export { EllipseRenderer } from "./ellipse-renderer";
export { LineRenderer } from "./line-renderer";
export { ArrowRenderer } from "./arrow-renderer";
export { TextRenderer } from "./text-renderer";
export { ImageRenderer } from "./image-renderer";
export { PinRenderer } from "./pin-renderer";
export { PlaceholderRenderer } from "./placeholder-renderer";

import { RectangleRenderer } from "./rectangle-renderer";
import { EllipseRenderer } from "./ellipse-renderer";
import { LineRenderer } from "./line-renderer";
import { ArrowRenderer } from "./arrow-renderer";
import { TextRenderer } from "./text-renderer";
import { ImageRenderer } from "./image-renderer";
import { PinRenderer } from "./pin-renderer";
import { PlaceholderRenderer } from "./placeholder-renderer";
import type { ItemRendererComponent } from "./item-renderer";

// Registry of renderers by item type
export const itemRenderers: Record<string, ItemRendererComponent> = {
  rectangle: RectangleRenderer,
  ellipse: EllipseRenderer,
  line: LineRenderer,
  arrow: ArrowRenderer,
  text: TextRenderer,
  image: ImageRenderer,
  pin: PinRenderer,
  group: PlaceholderRenderer, // TODO: Implement group renderer
  path: PlaceholderRenderer, // TODO: Implement path renderer
};

// Get renderer for an item type
export function getRendererForType(type: string): ItemRendererComponent {
  return itemRenderers[type] || PlaceholderRenderer;
}
