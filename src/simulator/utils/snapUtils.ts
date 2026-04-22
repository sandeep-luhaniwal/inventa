import { PlacedComponent } from "../types/circuit";
import { getAllPins, getAbsolutePinPosition } from "./circuitUtils";
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
    
    // Calculate absolute position based on CURRENT drag coordinates
    // We recreate the logic of getAbsolutePinPosition but using currentX/Y
    let lx = movingComp.mirrored ? -port.x : port.x;
    let ly = movingComp.flipped ? -port.y : port.y;

    if (movingComp.rotation !== 0) {
      const rad = (movingComp.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = lx * cos - ly * sin;
      const ry = lx * sin + ly * cos;
      lx = rx;
      ly = ry;
    }

    const curPinX = currentX + lx;
    const curPinY = currentY + ly;
    
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

