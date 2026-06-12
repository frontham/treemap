/**
 * Client-side image processing for tree photos.
 *
 * Photos are stored as downscaled JPEG **data URLs** directly in Postgres
 * (`tree_photos.storage_key` / `thumbnail_key`) — the same pragmatic approach
 * the reference-image overlays use. This keeps the feature working with zero
 * object-storage infrastructure; the schema separates the bytes into their own
 * columns so a later migration to R2/Blob is a non-breaking backfill.
 *
 * We produce two renditions per upload:
 *   - full:  max 1600px, quality 0.8 — shown in the lightbox
 *   - thumb: max 400px,  quality 0.7 — shown in the strip and shipped with trees.get
 */

const FULL_MAX_DIM = 1600;
const FULL_QUALITY = 0.8;
const THUMB_MAX_DIM = 400;
const THUMB_QUALITY = 0.7;

export type ProcessedImage = {
  /** Full-size JPEG data URL (downscaled). */
  full: string;
  /** Thumbnail JPEG data URL. */
  thumb: string;
  /** Width of the full rendition, in pixels. */
  width: number;
  /** Height of the full rendition, in pixels. */
  height: number;
  /** Approximate decoded byte size of the full JPEG. */
  bytes: number;
};

/** Decoded byte length of a base64 data URL payload (no network round-trip). */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  // Each 4 base64 chars encode 3 bytes; subtract padding.
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/** Draw `img` scaled to fit `maxDim` and return a JPEG data URL (no dimensions). */
export function downscaleToJpeg(img: HTMLImageElement, maxDim: number, quality: number): string {
  return render(img, maxDim, quality).url;
}

/** Draw `img` scaled to fit `maxDim` and return a JPEG data URL + its dimensions. */
function render(
  img: HTMLImageElement,
  maxDim: number,
  quality: number,
): { url: string; width: number; height: number } {
  const f = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * f));
  const height = Math.max(1, Math.round(img.naturalHeight * f));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);
  return { url: canvas.toDataURL('image/jpeg', quality), width, height };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read an image File, downscale to full + thumbnail JPEG data URLs, and report
 * the full rendition's dimensions and approximate byte size. Always re-encodes
 * to JPEG, so HEIC/PNG/etc. that the browser can decode end up normalised.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const sourceUrl = await readAsDataUrl(file);
  const img = await loadImage(sourceUrl);
  const full = render(img, FULL_MAX_DIM, FULL_QUALITY);
  const thumb = render(img, THUMB_MAX_DIM, THUMB_QUALITY);
  return {
    full: full.url,
    thumb: thumb.url,
    width: full.width,
    height: full.height,
    bytes: dataUrlBytes(full.url),
  };
}
