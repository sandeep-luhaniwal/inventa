/**
 * Analyzes an HTMLImageElement to find the bounding box of the non-transparent
 * (visible) pixels.
 */
export interface InkBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  nw: number;
  nh: number;
}

const boundsCache = new Map<string, InkBounds | null>();

export function getInkBounds(img: HTMLImageElement): InkBounds | null {
  const src = img.src;
  if (!src) return null;
  if (boundsCache.has(src)) return boundsCache.get(src)!;

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, nw, nh).data;

    let minX = nw, minY = nh, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        const alpha = data[(y * nw + x) * 4 + 3];
        if (alpha > 20) { // Slight threshold to ignore semi-transparent anti-aliasing
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) {
      boundsCache.set(src, null);
      return null;
    }

    const bounds: InkBounds = { minX, minY, maxX, maxY, nw, nh };
    boundsCache.set(src, bounds);
    return bounds;
  } catch (err) {
    boundsCache.set(src, null);
    return null;
  }
}

/**
 * Calculates a "Tight" display layout where:
 * 1. Padding is removed.
 * 2. Pins that were in the padding are SNAPPED to the nearest edge of the ink.
 */
export function computeSmartLayout(
  bounds: InkBounds,
  relativePins: { relX: number; relY: number }[],
  targetLongestSide = 120
) {
  const { minX, minY, maxX, maxY, nw, nh } = bounds;
  const inkW = maxX - minX;
  const inkH = maxY - minY;

  // Compute scale based on visible artwork
  const scale = targetLongestSide / Math.max(inkW, inkH);
  const displayW = Math.round(inkW * scale);
  const displayH = Math.round(inkH * scale);

  return {
    crop: { x: minX, y: minY, width: inkW, height: inkH },
    displayW,
    displayH,
    /** 
     * Maps a pin from total image context into the TIGHT artwork context.
     * Snaps the pin to the artwork edge if it was in transparent padding.
     */
    mapPin: (relX: number, relY: number) => {
      // 1. Natural pixels in full image
      let px = relX * nw;
      let py = relY * nh;

      // 2. SNAP to ink bounds (Terminal Alignment)
      px = Math.max(minX, Math.min(maxX, px));
      py = Math.max(minY, Math.min(maxY, py));

      // 3. Map to tight local display coordinates
      return {
        x: ((px - minX) / inkW) * displayW,
        y: ((py - minY) / inkH) * displayH
      };
    }
  };
}
