"use client";

/**
 * Avatar Service
 * Handles avatar image processing and upload
 */

import {
  uploadAvatar,
  getAvatarViewUrl,
  deleteAvatar,
} from "@/lib/appwrite/storage";

/**
 * Crop image to a square from the center
 */
export function cropImageToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Calculate square dimensions from center
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // Use a reasonable size for avatars (256x256)
        const outputSize = 256;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Draw the cropped and resized image
        ctx.drawImage(img, x, y, size, size, 0, 0, outputSize, outputSize);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create blob from canvas"));
              return;
            }

            // Create a new file from the blob
            const croppedFile = new File([blob], file.name, {
              type: file.type || "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(croppedFile);
          },
          file.type || "image/jpeg",
          0.9,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate avatar file
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a JPG, PNG, GIF, or WebP image.",
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "Image must be smaller than 10MB." };
  }

  // Check minimum dimensions
  return { valid: true };
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  userId: string,
  file: File,
): Promise<string> {
  // Validate file
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Crop to square
  const croppedFile = await cropImageToSquare(file);

  // Upload to Appwrite
  await uploadAvatar(userId, croppedFile);

  // Return the avatar URL with a cache-bust param so re-uploads are not served from browser cache
  return `${getAvatarViewUrl(userId)}&v=${Date.now()}`;
}

/**
 * Delete user avatar
 */
export async function deleteUserAvatar(userId: string): Promise<void> {
  await deleteAvatar(userId);
}

/**
 * Check if user has an avatar
 */
export function hasAvatar(userId: string): boolean {
  // This is a client-side check - in reality you'd want to verify with the server
  // For now, we rely on the user.prefs having an avatarUrl
  return true;
}
