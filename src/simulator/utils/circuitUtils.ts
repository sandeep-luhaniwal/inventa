import { SNAP_RADIUS, WIRE_STYLES } from "../constants/circuit";
import { PlacedComponent } from "../types/circuit";


/**
 * Absolute canvas position of a pin, accounting for component rotation and mirror.
 * Konva rotates the Group around its (x,y) origin and mirrors via scaleX=-1.
 */
export function getAbsolutePinPosition(
  comp: PlacedComponent,
  portIndex: number
): { x: number; y: number } {
  const pin = comp.ports[portIndex];
  let lx = comp.mirrored ? -pin.x : pin.x;
  let ly = pin.y;

  if (comp.rotation !== 0) {
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;
    lx = rx;
    ly = ry;
  }

  return { x: comp.x + lx, y: comp.y + ly };
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
 * VHV orthogonal routing: vertical → horizontal → vertical.
 * Midpoint is at the Y midpoint between p1 and p2.
 */
export function generateOrthogonalPoints(
  x1: number, y1: number,
  x2: number, y2: number
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
