"use client";

/**
 * LeafletMapLayer
 * Renders a Leaflet map with tile layers at the specified dimensions.
 * 
 * Architecture:
 * - All Leaflet interaction is DISABLED (no drag, no zoom, no click)
 * - Konva controls all viewport transforms via CSS on the parent container
 * - This component is purely a tile renderer
 * - Never imported directly — always loaded through the MapRenderer orchestrator
 */

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css?url";

import type { MapSettings } from "@/types/board";
import { getTileConfig } from "@/lib/geo-utils";

// ── Props ──────────────────────────────────────────────────────────────────────

export interface LeafletMapLayerProps {
  /** Map configuration from the board */
  settings: MapSettings;
  /** Container width in px */
  width: number;
  /** Container height in px */
  height: number;
  /** Whether map interaction is enabled */
  interactive?: boolean;
  /** Callback fired when the map center or zoom changes (during interactive mode) */
  onMapChange?: (lat: number, lng: number, zoom: number) => void;
}

// ── Sync settings into existing map instance ───────────────────────────────────

function MapSettingsSync({
  settings,
  interactive,
  onMapChange,
  width,
  height,
}: {
  settings: MapSettings;
  interactive: boolean;
  onMapChange?: (lat: number, lng: number, zoom: number) => void;
  width: number;
  height: number;
}) {
  const map = useMap();

  // Sync center + zoom when board settings change (only if NOT currently interactive)
  // If interactive, the user is panning/zooming, so we don't want to snap them back.
  useEffect(() => {
    if (!interactive) {
      map.setView([settings.centerLat, settings.centerLng], settings.zoom, {
        animate: false,
      });
    }
  }, [map, settings.centerLat, settings.centerLng, settings.zoom, interactive]);

  // Toggle interaction handlers
  useEffect(() => {
    if (interactive) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    }
  }, [map, interactive]);

  // Invalidate size when dimensions change
  useEffect(() => {
    map.invalidateSize();
  }, [map, width, height]);

  // Emit onMapChange when user pans/zooms during interactive mode
  useEffect(() => {
    if (!interactive || !onMapChange) return;

    const handleChange = () => {
      const center = map.getCenter();
      onMapChange(center.lat, center.lng, map.getZoom());
    };

    map.on('moveend', handleChange);
    map.on('zoomend', handleChange);

    return () => {
      map.off('moveend', handleChange);
      map.off('zoomend', handleChange);
    };
  }, [map, interactive, onMapChange]);

  return null;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function LeafletMapLayer({
  settings,
  width,
  height,
  interactive = false,
  onMapChange,
}: LeafletMapLayerProps) {
  const tileConfig = getTileConfig(settings.tileProvider);

  return (
    <div
      style={{
        width,
        height,
        opacity: settings.mapOpacity,
      }}
    >
      <MapContainer
        center={[settings.centerLat, settings.centerLng]}
        zoom={settings.zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomSnap={0.1}
        zoomDelta={0.5}
      >
        <TileLayer
          key={settings.tileProvider}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          maxZoom={tileConfig.maxZoom}
        />
        <MapSettingsSync 
          settings={settings} 
          interactive={interactive} 
          onMapChange={onMapChange} 
          width={width}
          height={height}
        />
      </MapContainer>
    </div>
  );
}
