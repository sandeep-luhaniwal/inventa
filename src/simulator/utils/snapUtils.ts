import { PlacedComponent } from "../types/circuit";
import { getAllPins } from "./circuitUtils";
import { SNAP_RADIUS } from "../constants/circuit";

/**
 * Calculates the (dx, dy) offset needed to snap any pin of the moving component
 * to the nearest pin of any other component on the canvas.
 */
export function getComponentSnapOffset(
  movingComp: PlacedComponent,
  currentX: number,
  currentY: number,
  allComponents: PlacedComponent[]
): { dx: number; dy: number } | null {
  const otherComponents = allComponents.filter((c) => c.id !== movingComp.id);
  const targetPins = getAllPins(otherComponents);
  
  if (targetPins.length === 0) return null;

  let bestSnap: { dx: number; dy: number; distSq: number } | null = null;
  const snapDistSq = SNAP_RADIUS * SNAP_RADIUS;

  // Check every pin of the moving component
  for (let i = 0; i < movingComp.ports.length; i++) {
    const port = movingComp.ports[i];
    const width = movingComp.width ?? 100;
    const height = movingComp.height ?? 100;
    const centerX = width / 2;
    const centerY = height / 2;

    let dx = port.x - centerX;
    let dy = port.y - centerY;

    if (movingComp.mirrored) dx *= -1;
    if (movingComp.flipped) dy *= -1;

    if (movingComp.rotation !== 0) {
      const rad = (movingComp.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const nextDx = dx * cos - dy * sin;
      const nextDy = dx * sin + dy * cos;
      dx = nextDx;
      dy = nextDy;
    }

    const curPinX = currentX + centerX + dx;
    const curPinY = currentY + centerY + dy;
    
    for (const target of targetPins) {
      const dx = target.x - curPinX;
      const dy = target.y - curPinY;
      const distSq = dx * dx + dy * dy;

      if (distSq < snapDistSq) {
        if (!bestSnap || distSq < bestSnap.distSq) {
          bestSnap = { dx, dy, distSq };
        }
      }
    }
  }

  return bestSnap ? { dx: bestSnap.dx, dy: bestSnap.dy } : null;
}
