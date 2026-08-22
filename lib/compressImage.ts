/**
 * Downscale + re-encode an image in the browser before it is uploaded.
 *
 * Why this exists: Vercel caps a serverless function's *request body* at
 * 4.5 MB and rejects anything larger at the edge, before our route handler
 * runs. That rejection is an HTML error page, not our JSON, so the admin UI
 * could only show a bare "Upload failed" with no reason. Modern phone
 * cameras routinely produce 5–12 MB JPEGs, so uploading originals was
 * always going to hit it.
 *
 * Product shots never render wider than ~1200 CSS px, so a 2000 px long
 * edge is already generous. WebP at q0.82 typically takes a 9 MB photo down
 * to a few hundred KB — which also keeps the storefront fast and slows the
 * growth of Supabase Storage.
 *
 * Returns the original File untouched when the browser can't decode it
 * (HEIC in Chrome, say) or when re-encoding wouldn't actually help, so the
 * caller can still try the upload and let the server explain any failure.
 */

/** Longest edge, in px, that a stored product photo needs. */
export const MAX_EDGE = 2000;
/** WebP quality. 0.82 is visually lossless for jewellery photography. */
export const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  // SVG is vector and already tiny — rasterising it would be a downgrade.
  if (file.type === "image/svg+xml") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Undecodable in this browser. Hand back the original; the caller
    // reports it rather than silently uploading something broken.
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY)
    );
    // Never make things worse than they started.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}
