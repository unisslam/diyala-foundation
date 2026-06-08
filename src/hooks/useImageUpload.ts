/**
 * useImageUpload.ts
 * -----------------
 * Shared hook for uploading + compressing cover images to Supabase Storage.
 * Returns: { uploading, uploadImage, deleteImage }
 */

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Canvas-based compression → WebP (reused from gallery)
async function compressImage(file: File, maxPx = 1920, quality = 0.84): Promise<File> {
  if (file.size < 400 * 1024) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio  = Math.min(1, maxPx / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.naturalWidth  * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
            type: "image/webp", lastModified: Date.now(),
          }));
        },
        "image/webp", quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

export function useImageUpload(bucket: "news" | "projects" | "gallery" | "team") {
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File): Promise<string | null> {
    try {
      setUploading(true);
      const compressed = await compressImage(file);
      const path = `covers/${Date.now()}-${compressed.name}`;
      const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(publicUrl: string): Promise<void> {
    try {
      // Extract path from URL: .../bucket/covers/filename → covers/filename
      const match = publicUrl.match(new RegExp(`/${bucket}/(.+)$`));
      if (match?.[1]) await supabase.storage.from(bucket).remove([match[1]]);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return { uploading, uploadImage, deleteImage };
}
