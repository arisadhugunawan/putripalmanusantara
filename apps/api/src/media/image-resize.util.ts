import { createCanvas, loadImage } from 'canvas';

/**
 * Upload-time maximum-dimension cap (Post-Launch Phase 3) — stops a needlessly oversized
 * original (e.g. a 6000×4000 camera photo for a 400px logo slot) from being stored and
 * repeatedly re-fetched by Next.js Image Optimization on every cold cache miss. This is
 * deliberately NOT a derivative-generation pipeline: Next.js already generates every actual
 * responsive size and modern format (WebP/AVIF) on demand at request time (confirmed live —
 * `/_next/image?url=...&w=...` requests were observed during Phase 2 verification). This
 * function only ever touches the ONE newly-uploaded file being processed right now; it never
 * reads or rewrites any existing Media row, so it cannot invalidate an old Product snapshot
 * (see `MediaService.upload()` — the immutable-URL rule from the Phase 3 architecture plan).
 *
 * Scoped to JPEG and PNG only, and re-encodes back to the SAME format it decoded — resizing
 * GIF would destroy animation (canvas only captures a single frame), and re-encoding WebP as
 * PNG/JPEG would produce a file whose bytes no longer match the extension `LocalStorageDriver`/
 * `S3StorageDriver` already picked from the original filename. Both are simply left untouched
 * (stored at their original size) rather than risked — a deliberately narrow, safe scope over
 * a "handle every format" one, per the Phase 3 plan's "keep it simple" instruction.
 *
 * Best-effort: any decode/encode failure (corrupt image, format canvas can't actually decode
 * despite the MIME type) falls back to the original, untouched buffer rather than blocking the
 * upload — same philosophy as the existing dimension-extraction step in `MediaService.upload()`.
 */
export async function capImageDimensions(
  buffer: Buffer,
  mimeType: string,
  maxWidth: number,
  maxHeight: number,
): Promise<Buffer> {
  if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') return buffer;
  if (!maxWidth || !maxHeight) return buffer;

  try {
    const img = await loadImage(buffer);
    if (img.width <= maxWidth && img.height <= maxHeight) return buffer;

    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return mimeType === 'image/jpeg'
      ? canvas.toBuffer('image/jpeg', { quality: 0.88 })
      : canvas.toBuffer('image/png');
  } catch {
    return buffer;
  }
}
