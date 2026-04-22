/**
 * Board Types
 * Defines the data model for boards, layers, and items
 */

// Background type options
export type BackgroundType = "none" | "color" | "image" | "map";

// Board mode options
export type BoardMode = "visual" | "geo";

// Map tile provider options
export type TileProvider = "osm" | "satellite" | "terrain";

// Map settings stored as JSON on the board
export interface MapSettings {
  centerLat: number;
  centerLng: number;
  zoom: number;
  tileProvider: TileProvider;
  mapOpacity: number; // 0-1
}

// Item type options
export type ItemType =
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "path"
  | "text"
  | "image"
  | "pin"
  | "group";

// Base transform properties
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

// Style properties stored as JSON
export interface StyleProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string; // "normal" | "bold" | "italic" | "bold italic"
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}

// Content stored as JSON based on item type
export interface ContentProps {
  // For text items
  text?: string;

  // For image items
  src?: string;
  assetId?: string;

  // For pin items
  label?: string;
  note?: string;
  images?: string[]; // up to 3 asset file IDs
  gpsLat?: number;
  gpsLng?: number;

  // For shapes
  points?: number[];
  closed?: boolean;

  // For arrow items
  arrowStyle?: "none" | "left" | "right" | "double";
}

// Interaction state
export interface InteractionProps {
  selectable?: boolean;
  draggable?: boolean;
}

// GeoJSON support for future geo-aware items
export interface GeoProps {
  type?: "Point" | "LineString" | "Polygon";
  coordinates?: number[] | number[][] | number[][][];
}

// Main Board interface
export interface Board {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  workspaceId: string;
  name: string;
  description?: string;
  mode: BoardMode;
  width: number;
  height: number;
  backgroundType: BackgroundType;
  backgroundColor?: string;
  backgroundAssetId?: string;
  thumbnailFileId?: string;
  viewportState?: string; // JSON string with pan/zoom state
  mapSettingsJson?: string; // JSON string of MapSettings
  isArchived: boolean;
  createdBy: string;
}

// Layer interface
export interface Layer {
  $id: string;
  boardId: string;
  name: string;
  order: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  createdAt: string;
  updatedAt: string;
}

// BoardItem interface
export interface BoardItem {
  $id: string;
  boardId: string;
  layerId: string;
  parentGroupId?: string; // For nested items in groups
  type: ItemType;
  name: string;
  orderIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  styleJson: string; // JSON string of StyleProps
  contentJson: string; // JSON string of ContentProps
  interactionJson: string; // JSON string of InteractionProps
  geoJson?: string; // JSON string of GeoProps
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Helper to parse JSON fields
export function parseStyleProps(item: BoardItem): StyleProps {
  try {
    return JSON.parse(item.styleJson || "{}");
  } catch {
    return {};
  }
}

export function parseContentProps(item: BoardItem): ContentProps {
  try {
    return JSON.parse(item.contentJson || "{}");
  } catch {
    return {};
  }
}

export function parseInteractionProps(item: BoardItem): InteractionProps {
  try {
    return JSON.parse(item.interactionJson || "{}");
  } catch {
    return {};
  }
}

export function parseGeoProps(item: BoardItem): GeoProps | null {
  if (!item.geoJson) return null;
  try {
    return JSON.parse(item.geoJson);
  } catch {
    return null;
  }
}

export const defaultMapSettings: MapSettings = {
  centerLat: 20.6534,
  centerLng: -105.2253,
  zoom: 13,
  tileProvider: "osm",
  mapOpacity: 1,
};

export function parseMapSettings(board: Board): MapSettings {
  if (!board.mapSettingsJson) return defaultMapSettings;
  try {
    return { ...defaultMapSettings, ...JSON.parse(board.mapSettingsJson) };
  } catch {
    return defaultMapSettings;
  }
}

// Default values for new items
export const defaultTransform: Transform = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

export const defaultStyle: StyleProps = {
  fill: "#ffffff",
  stroke: "#000000",
  strokeWidth: 1,
  opacity: 1,
};

export const defaultContent: ContentProps = {};

export const defaultInteraction: InteractionProps = {
  selectable: true,
  draggable: true,
};

// Board creation helper
export interface CreateBoardInput {
  workspaceId: string;
  name: string;
  description?: string;
  mode?: BoardMode;
  width?: number;
  height?: number;
  backgroundType?: BackgroundType;
  backgroundColor?: string;
  backgroundAssetId?: string;
  mapSettingsJson?: string;
  createdBy: string;
}

// Layer creation helper
export interface CreateLayerInput {
  boardId: string;
  name: string;
  orderIndex: number;
}

// Item creation helper
export interface CreateItemInput {
  boardId: string;
  layerId: string;
  type: ItemType;
  name: string;
  orderIndex: number;
  transform?: Partial<Transform>;
  style?: Partial<StyleProps>;
  content?: Partial<ContentProps>;
}
