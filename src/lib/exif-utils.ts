/**
 * EXIF Utilities
 * Functions for extracting EXIF metadata from images
 */

// EXIF GPS coordinate format conversion
function convertDMSToDD(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: string,
): number {
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === "S" || direction === "W") {
    dd = dd * -1;
  }
  return dd;
}

export interface ExifMetadata {
  // GPS data
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;

  // Camera data
  make?: string;
  model?: string;
  dateTime?: string;
  orientation?: number;

  // Image dimensions (if not already available)
  imageWidth?: number;
  imageHeight?: number;
}

// Parse EXIF data from an image file
export async function extractExifMetadata(file: File): Promise<ExifMetadata> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result !== "string") {
        resolve({});
        return;
      }

      try {
        // Simple EXIF parsing - look for GPS tags
        // This is a simplified implementation
        // In production, use a library like exif-js or exifr
        const metadata: ExifMetadata = {};

        // For now, we'll just return empty metadata
        // A full implementation would use a proper EXIF library
        resolve(metadata);
      } catch {
        resolve({});
      }
    };

    reader.onerror = () => {
      resolve({});
    };

    reader.readAsDataURL(file);
  });
}

// Check if metadata has GPS data
export function hasGpsData(metadata: ExifMetadata): boolean {
  return (
    metadata.gpsLatitude !== undefined && metadata.gpsLongitude !== undefined
  );
}

// Format GPS coordinates for display
export function formatGpsCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";

  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);

  return `${absLat.toFixed(6)}° ${latDir}, ${absLng.toFixed(6)}° ${lngDir}`;
}
