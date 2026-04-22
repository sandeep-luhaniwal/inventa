import { SNAP_RADIUS, WIRE_STYLES } from "../constants/circuit";
import { PlacedComponent } from "../types/circuit";

/**
 * Absolute canvas position of a pin, accounting for component rotation and mirror.
 * Konva rotates the Group around its (x, y) origin and mirrors via scaleX = -1.
 */
export function getAbsolutePinPosition(
  comp: PlacedComponent,
  portIndex: number
): { x: number; y: number } {
  const pin = comp.ports?.[portIndex];
  
  if (!pin) {
    return { x: comp.x, y: comp.y };
  }

  const w = comp.width ?? 100;
  const h = comp.height ?? 100;
  const cx = w / 2;
  const cy = h / 2;

  // 1. Get local coordinate relative to the pivot (center)
  // In Konva, offset is subtracted first.
  let dx = pin.x - cx;
  let dy = pin.y - cy;

  // 2. Apply Scale (Mirror/Flip)
  // This happens before rotation in Konva's internal transform order
  if (comp.mirrored) dx *= -1;
  if (comp.flipped) dy *= -1;

  // 3. Apply Rotation
  let rx = dx;
  let ry = dy;
  if (comp.rotation !== 0) {
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    rx = dx * cos - dy * sin;
    ry = dx * sin + dy * cos;
  }

  // 4. Translate back to component origin (comp.x, comp.y) 
  // plus the offset position (cx, cy)
  return { 
    x: comp.x + cx + rx, 
    y: comp.y + cy + ry 
  };
}

/** Backward-compat alias */
export const getAbsPin = getAbsolutePinPosition;

export interface PinInfo {
  compId: string;
  portIndex: number;
  x: number;
  y: number;
}

/** Flat list of all pins across all components, with optional exclusion */
export function getAllPins(
  components: PlacedComponent[],
  excludeCompId?: string,
  excludePortIndex?: number
): PinInfo[] {
  const pins: PinInfo[] = [];
  for (const comp of components) {
    for (let i = 0; i < comp.ports.length; i++) {
      if (comp.id === excludeCompId && i === excludePortIndex) continue;
      const pos = getAbsolutePinPosition(comp, i);
      pins.push({ compId: comp.id, portIndex: i, ...pos });
    }
  }
  return pins;
}

/** True if distance is within the snap threshold */
export function isWithinSnapRadius(distance: number): boolean {
  return distance < SNAP_RADIUS;
}

/** Nearest pin to (mx, my) from a pre-built PinInfo list */
export function findNearestPin(
  mx: number,
  my: number,
  pins: PinInfo[]
): PinInfo | null {
  let best: PinInfo | null = null;
  let bestDist = SNAP_RADIUS;
  for (const pin of pins) {
    const dist = Math.hypot(mx - pin.x, my - pin.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = pin;
    }
  }
  return best;
}

export type SnapResult = PinInfo;

/**
 * Nearest pin within SNAP_RADIUS of (mx, my), excluding the origin pin.
 */
export function snapToPin(
  mx: number,
  my: number,
  components: PlacedComponent[],
  excludeCompId?: string,
  excludePortIndex?: number
): SnapResult | null {
  return findNearestPin(mx, my, getAllPins(components, excludeCompId, excludePortIndex));
}

/** Konva dash array for a given wire style key */
export function getWireDash(wireType: string): number[] {
  return WIRE_STYLES[wireType]?.dash ?? [];
}

/**
 * VHV orthogonal routing: vertical -> horizontal -> vertical.
 * Midpoint is at the Y midpoint between p1 and p2.
 */
export function generateOrthogonalPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number[] {
  const midY = y1 + (y2 - y1) / 2;
  return [x1, y1, x1, midY, x2, midY, x2, y2];
}

/** Object-param alias used by WireLayer / Canvas */
export function generateOrthogonalPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number[] {
  return generateOrthogonalPoints(p1.x, p1.y, p2.x, p2.y);
}

/**
 * Convert relative pin definitions (0-1 fractions of image size)
 * to absolute pixel positions given a display width/height.
 */
export function relativePinsToPorts(
  relativePins: { relX: number; relY: number }[],
  width: number,
  height: number
): { x: number; y: number }[] {
  return relativePins.map((pin) => ({
    x: width * pin.relX,
    y: height * pin.relY,
  }));
}

/**
 * Calculates the bounding box of a collection of components.
 * Returns { minX, minY, maxX, maxY, width, height, centerX, centerY }
 */
export function getBoundingBox(components: PlacedComponent[]) {
  if (components.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  components.forEach((comp) => {
    // Basic component box (approximate width/height if not known, assumed ~100)
    const w = 100;
    const h = 100;
    
    minX = Math.min(minX, comp.x);
    minY = Math.min(minY, comp.y);
    maxX = Math.max(maxX, comp.x + w);
    maxY = Math.max(maxY, comp.y + h);

    // Also consider pins as they might extend beyond the body
    comp.ports.forEach((_, i) => {
      const pos = getAbsolutePinPosition(comp, i);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    });
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}