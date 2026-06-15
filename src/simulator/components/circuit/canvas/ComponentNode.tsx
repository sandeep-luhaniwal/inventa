"use client"
import Konva from "konva";
import { PIN_RADIUS, LED_COLOR_OPTIONS } from "@/simulator/constants/circuit";
import { useImage } from "@/simulator/hooks/useImage";
import { ConnectingFrom, PlacedComponent } from "@/simulator/types/circuit";
import { computeSmartLayout, getInkBounds } from "@/simulator/utils/imageUtils";
import { SimulatedComponentState } from "@/simulator/utils/simulation";
import { getComponentSnapOffset } from "@/simulator/utils/snapUtils";
import { METAL_PHYSICS } from "@/simulator/constants/physics";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Circle, Image as KonvaImage, Text, Rect as KonvaRect, Path, Arrow, Line } from "react-konva";
import { getMicrobitDataUrls, STATIC_COMPONENTS } from "@/simulator/constants/staticComponents";

const HIT_RADIUS = PIN_RADIUS + 8;
const DISPLAY_TARGET = 110;
const ANIMATED_OUTPUT_COMPONENTS = new Set(["ac_bulb", "bulb_holder", "dc_motor", "gearmotor", "vibration_motor", "microbit", "bldc_motor", "ac_motor", "stepper_motor", "semiconductor"]);
const SPHERE_CHARGE_WAVE_COLOR = "#ef4444";
const SPHERE_MIN_SIZE = 15;
const SPHERE_MAX_SIZE = 220;
const ELECTRIC_FIELD_K = 9e9;
const POTENTIAL_RING_RADIUS_FACTOR = 4;
const CHARGE_UNIT_MULTIPLIER: Record<string, number> = {
  C: 1,
  mC: 1e-3,
  uC: 1e-6,
  nC: 1e-9,
};

function normalizeChargeUnit(unit = "uC") {
  return unit.replace("Ã‚Âµ", "u").replace("Âµ", "u");
}

function toCoulombs(value = 0, unit = "uC") {
  return value * (CHARGE_UNIT_MULTIPLIER[normalizeChargeUnit(unit)] ?? 1e-6);
}

function formatElectricField(value: number) {
  if (!Number.isFinite(value)) return "E = infinity N/C";
  if (value === 0) return "E = 0 N/C";
  if (Math.abs(value) >= 1e6) return `E = ${value.toExponential(2)} N/C`;
  return `E = ${value.toFixed(2)} N/C`;
}

function formatElectricPotential(value: number) {
  if (!Number.isFinite(value)) return "V = infinity V";
  if (value === 0) return "V = 0 V";
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.01) return `V = ${value.toExponential(2)} V`;
  return `V = ${value.toFixed(2)} V`;
}

function resolveFullImageLayout(
  img: HTMLImageElement,
  relativePins: { relX: number; relY: number }[]
): { w: number; h: number; crop?: { x: number; y: number; width: number; height: number }; pins: { x: number; y: number }[] } {
  const nw = img.naturalWidth || 100;
  const nh = img.naturalHeight || 100;
  const scale = DISPLAY_TARGET / Math.max(nw, nh);
  const w = Math.round(nw * scale);
  const h = Math.round(nh * scale);
  const pins = relativePins.map((p) => ({ x: p.relX * w, y: p.relY * h }));

  return { w, h, pins };
}

interface ComponentNodeProps {
  comp: PlacedComponent;
  imageSrc?: string;
  litImageSrc?: string;
  connectingFrom: ConnectingFrom | null;
  isSimulating?: boolean;
  simulationState?: SimulatedComponentState;
  blinkToggle?: boolean;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onUpdate?: (id: string, updates: Partial<PlacedComponent>) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onSelect: (compId: string, multi: boolean) => void;
  onSizeResolved?: (id: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => void;
  allComponents: PlacedComponent[];
}

function hasFrictionMethod(a: PlacedComponent, b: PlacedComponent) {
  return a.physicsChargeMethod === "Friction" || b.physicsChargeMethod === "Friction";
}

function findInductionSource(comp: PlacedComponent, allComponents: PlacedComponent[]) {
  if (
    !comp.componentId.startsWith("sphere_") ||
    comp.physicsChargeMethod !== "Induction" ||
    comp.physicsEarthing === "Earthed" ||
    Math.abs(comp.chargeValue ?? 0) > 0
  ) {
    return null;
  }

  const radiusA = (comp.width || 100) / 2;
  const centerA = { x: comp.x + radiusA, y: comp.y + radiusA };
  const inductionRange = radiusA + 180;

  return allComponents.reduce<{
    component: PlacedComponent;
    dx: number;
    dy: number;
    distance: number;
  } | null>((nearest, candidate) => {
    if (candidate.id === comp.id || !candidate.componentId.startsWith("sphere_")) return nearest;
    if (Math.abs(candidate.chargeValue ?? 0) === 0) return nearest;

    const radiusB = (candidate.width || 100) / 2;
    const centerB = { x: candidate.x + radiusB, y: candidate.y + radiusB };
    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;
    const distance = Math.hypot(dx, dy);
    if (distance > inductionRange) return nearest;
    if (nearest && nearest.distance <= distance) return nearest;

    return { component: candidate, dx, dy, distance };
  }, null);
}

const BatteryDischargeOverlay = ({ isSimulating, w, h }: { isSimulating: boolean; w: number; h: number }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isSimulating) {
      const frame = requestAnimationFrame(() => setElapsed(0));
      return () => cancelAnimationFrame(frame);
    }
    const frame = requestAnimationFrame(() => setElapsed(0));
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [isSimulating]);

  if (!isSimulating) return null;

  const visibleSlots = Math.max(0, 6 - Math.floor(elapsed / 10));

  const slotWidth = w * 0.18;
  const slotHeight = (h * 0.4) / 6;
  const startX = w * 0.65;
  const startY = h * 0.35;

  return (
    <Group x={0} y={0} listening={false}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <KonvaRect
          key={i}
          x={startX}
          y={startY + (5 - i) * (slotHeight * 1.1)}
          width={slotWidth}
          height={slotHeight * 0.9}
          fill={i < visibleSlots ? "#22c55e" : "#ef4444"}
          opacity={0.85}
          cornerRadius={2}
        />
      ))}
    </Group>
  );
};

export function traceRay(
  rayGlobalStartX: number,
  rayGlobalStartY: number,
  rayGlobalAngle: number,
  sourceCompId: string,
  allComponents: PlacedComponent[],
  maxBounces = 8,
  prismBendDegrees = 12
): { path: { x: number; y: number }[], virtualPaths: { x: number; y: number }[][] } {
  const points = [{ x: rayGlobalStartX, y: rayGlobalStartY }];
  const virtualPaths: { x: number; y: number }[][] = [];
  let currentX = rayGlobalStartX;
  let currentY = rayGlobalStartY;
  let currentAngle = rayGlobalAngle;
  let currentSourceId = sourceCompId;

  for (let bounce = 0; bounce < maxBounces; bounce++) {
    let hit: { tHit: number, comp: PlacedComponent, hitLocalX: number, hitLocalY: number, isMirror: boolean, focalLength: number, dX_local: number, dY_local: number, scaleX: number, scaleY: number, rad: number, opticKind?: "prism" | "slab", prismExitLocalX?: number, prismExitLocalY?: number, nx?: number, ny?: number } | null = null;
    let minDist = 4000;

    const P0x = currentX;
    const P0y = currentY;
    const Dx = Math.cos(currentAngle);
    const Dy = Math.sin(currentAngle);

    for (const c of allComponents) {
      if (c.id === currentSourceId) continue;
      const def = STATIC_COMPONENTS.find(sc => sc.id === c.componentId);
      const cw = c.width || (def?.viewBoxW || 100);
      const ch = c.height || (def?.viewBoxH || 100);
      const cx = c.x;
      const cy = c.y;

      const centerX = cx + cw / 2;
      const centerY = cy + ch / 2;

      const rad = -(c.rotation || 0) * Math.PI / 180;
      const scaleX = c.mirrored ? -1 : 1;
      const scaleY = c.flipped ? -1 : 1;

      const pX_translated = P0x - centerX;
      const pY_translated = P0y - centerY;

      const pX_rot = pX_translated * Math.cos(rad) - pY_translated * Math.sin(rad);
      const pY_rot = pX_translated * Math.sin(rad) + pY_translated * Math.cos(rad);

      const dX_rot = Dx * Math.cos(rad) - Dy * Math.sin(rad);
      const dY_rot = Dx * Math.sin(rad) + Dy * Math.cos(rad);

      const pX_local = pX_rot * scaleX;
      const pY_local = pY_rot * scaleY;
      const dX_local = dX_rot * scaleX;
      const dY_local = dY_rot * scaleY;

      if (c.componentId === 'triangular_glass_prism') {
        const prismTriangle = [
          { x: 0, y: -ch / 2 + (8 / 130) * ch },
          { x: -cw / 2 + (14 / 160) * cw, y: -ch / 2 + (114 / 130) * ch },
          { x: cw / 2 - (14 / 160) * cw, y: -ch / 2 + (114 / 130) * ch },
        ];
        const prismHits: { t: number; x: number; y: number }[] = [];

        for (let i = 0; i < prismTriangle.length; i++) {
          const a = prismTriangle[i];
          const b = prismTriangle[(i + 1) % prismTriangle.length];
          const edgeX = b.x - a.x;
          const edgeY = b.y - a.y;
          const denom = dX_local * edgeY - dY_local * edgeX;
          if (Math.abs(denom) < 1e-6) continue;

          const relX = a.x - pX_local;
          const relY = a.y - pY_local;
          const t = (relX * edgeY - relY * edgeX) / denom;
          const u = (relX * dY_local - relY * dX_local) / denom;

          if (t > 0.1 && u >= -1e-4 && u <= 1 + 1e-4) {
            prismHits.push({
              t,
              x: pX_local + t * dX_local,
              y: pY_local + t * dY_local,
            });
          }
        }

        prismHits.sort((a, b) => a.t - b.t);
        const entry = prismHits[0];
        
        if (entry && entry.t < minDist) {
          minDist = entry.t;
          
          const inwardBendRadians = (prismBendDegrees * Math.PI / 180) * 0.5 * (dX_local >= 0 ? 1 : -1);
          const thetaInside = Math.atan2(dY_local, dX_local) + inwardBendRadians;
          const dX_inside = Math.cos(thetaInside);
          const dY_inside = Math.sin(thetaInside);
          
          let exit: { x: number, y: number } | undefined;
          
          for (let i = 0; i < prismTriangle.length; i++) {
            const a = prismTriangle[i];
            const b = prismTriangle[(i + 1) % prismTriangle.length];
            const edgeX = b.x - a.x;
            const edgeY = b.y - a.y;
            const denom = dX_inside * edgeY - dY_inside * edgeX;
            if (Math.abs(denom) < 1e-6) continue;
            
            const relX = a.x - entry.x;
            const relY = a.y - entry.y;
            const tInside = (relX * edgeY - relY * edgeX) / denom;
            const uInside = (relX * dY_inside - relY * dX_inside) / denom;
            
            if (tInside > 0.1 && uInside >= -1e-4 && uInside <= 1 + 1e-4) {
               exit = { x: entry.x + tInside * dX_inside, y: entry.y + tInside * dY_inside };
               break;
            }
          }
          
          hit = {
            tHit: entry.t,
            comp: c,
            hitLocalX: entry.x,
            hitLocalY: entry.y,
            isMirror: false,
            focalLength: Infinity,
            dX_local,
            dY_local,
            scaleX,
            scaleY,
            rad,
            opticKind: "prism",
            prismExitLocalX: exit?.x,
            prismExitLocalY: exit?.y,
          };
        }
        continue;
      } else if (c.componentId === 'rectangular_glass_slab') {
        let hitBoxMinX = (10 / 160) * cw - cw / 2;
        let hitBoxMaxX = (110 / 160) * cw - cw / 2;
        let hitBoxMinY = (30 / 120) * ch - ch / 2;
        let hitBoxMaxY = (110 / 120) * ch - ch / 2;
        
        let tMinX = -Infinity, tMaxX = Infinity;
        if (Math.abs(dX_local) > 1e-6) {
           tMinX = Math.min((hitBoxMinX - pX_local) / dX_local, (hitBoxMaxX - pX_local) / dX_local);
           tMaxX = Math.max((hitBoxMinX - pX_local) / dX_local, (hitBoxMaxX - pX_local) / dX_local);
        } else if (pX_local < hitBoxMinX || pX_local > hitBoxMaxX) { continue; }
        
        let tMinY = -Infinity, tMaxY = Infinity;
        if (Math.abs(dY_local) > 1e-6) {
           tMinY = Math.min((hitBoxMinY - pY_local) / dY_local, (hitBoxMaxY - pY_local) / dY_local);
           tMaxY = Math.max((hitBoxMinY - pY_local) / dY_local, (hitBoxMaxY - pY_local) / dY_local);
        } else if (pY_local < hitBoxMinY || pY_local > hitBoxMaxY) { continue; }
        
        const tMin = Math.max(tMinX, tMinY);
        const tMax = Math.min(tMaxX, tMaxY);
        
        if (tMax >= tMin && tMax >= 0) {
           const tHit = tMin > 0 ? tMin : tMax;
           if (tHit > 0 && tHit < minDist) {
              minDist = tHit;
              const hitLocalX = pX_local + tHit * dX_local;
              const hitLocalY = pY_local + tHit * dY_local;
              
              let nx = 0, ny = 0;
              if (Math.abs(hitLocalX - hitBoxMinX) < 1e-4) nx = -1;
              else if (Math.abs(hitLocalX - hitBoxMaxX) < 1e-4) nx = 1;
              else if (Math.abs(hitLocalY - hitBoxMinY) < 1e-4) ny = -1;
              else if (Math.abs(hitLocalY - hitBoxMaxY) < 1e-4) ny = 1;

              hit = {
                 tHit, comp: c, hitLocalX, hitLocalY, isMirror: false, focalLength: Infinity, dX_local, dY_local, scaleX, scaleY, rad, opticKind: "slab", nx, ny
              };
           }
        }
        continue;
      }

      let hitBoxMinX = -cw / 2;
      let hitBoxMaxX = cw / 2;
      let hitBoxMinY = -ch / 2;
      let hitBoxMaxY = ch / 2;
      
      let isOptics = false;
      let isMirror = false;
      
      let radiusCm = c.opticsRadiusValue ?? 15;
      if (c.opticsRadiusUnit === 'm') radiusCm *= 100;
      const baseFocalLengthPx = radiusCm * 10;
      
      let focalLength = baseFocalLengthPx;

      if (c.componentId === 'plane_mirror') {
         hitBoxMinX = -6; hitBoxMaxX = 6;
         hitBoxMinY = -ch / 2 + 10; hitBoxMaxY = ch / 2 - 10;
         isOptics = true;
         isMirror = true;
         focalLength = Infinity;
      } else if (c.componentId === 'convex_lens') {
         hitBoxMinX = -12; hitBoxMaxX = 12;
         hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
         isOptics = true;
         isMirror = false;
         focalLength = baseFocalLengthPx;
      } else if (c.componentId === 'concave_lens') {
         hitBoxMinX = -12; hitBoxMaxX = 12;
         hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
         isOptics = true;
         isMirror = false;
         focalLength = -baseFocalLengthPx;
      } else if (c.componentId === 'concave_mirror') {
         hitBoxMinX = 5; hitBoxMaxX = 30;
         hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
         isOptics = true;
         isMirror = true;
         focalLength = baseFocalLengthPx;
      } else if (c.componentId === 'convex_mirror') {
         hitBoxMinX = -20; hitBoxMaxX = 10;
         hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
         isOptics = true;
         isMirror = true;
         focalLength = -baseFocalLengthPx;
      } else if (c.componentId === 'laser_stand') {
         const standLengthCm = c.opticsStandLength || 14;
         const standLengthPx = standLengthCm * 10;
         const totalW = 54 + standLengthPx;

         hitBoxMinX = (30 / totalW) * cw - cw / 2;
         hitBoxMaxX = ((30 + standLengthPx) / totalW) * cw - cw / 2;
         hitBoxMinY = (27 / 80) * ch - ch / 2;
         hitBoxMaxY = (53 / 80) * ch - ch / 2;
      } else if (c.componentId.startsWith('led')) {
         hitBoxMinX = -cw / 3; hitBoxMaxX = cw / 3;
         hitBoxMinY = -ch / 3; hitBoxMaxY = ch / 3;
      }

      let tMinX = -Infinity, tMaxX = Infinity;
      if (Math.abs(dX_local) > 1e-6) {
         const t1 = (hitBoxMinX - pX_local) / dX_local;
         const t2 = (hitBoxMaxX - pX_local) / dX_local;
         tMinX = Math.min(t1, t2);
         tMaxX = Math.max(t1, t2);
      } else if (pX_local < hitBoxMinX || pX_local > hitBoxMaxX) {
         continue;
      }

      let tMinY = -Infinity, tMaxY = Infinity;
      if (Math.abs(dY_local) > 1e-6) {
         const t1 = (hitBoxMinY - pY_local) / dY_local;
         const t2 = (hitBoxMaxY - pY_local) / dY_local;
         tMinY = Math.min(t1, t2);
         tMaxY = Math.max(t1, t2);
      } else if (pY_local < hitBoxMinY || pY_local > hitBoxMaxY) {
         continue;
      }

      const tMin = Math.max(tMinX, tMinY);
      const tMax = Math.min(tMaxX, tMaxY);

      if (tMax >= tMin && tMax >= 0) {
         const tHit = tMin > 0 ? tMin : tMax;
         if (tHit > 0 && tHit < minDist) {
            minDist = tHit;
            const hitLocalY = pY_local + tHit * dY_local;
            const hitLocalX = pX_local + tHit * dX_local;
            if (isOptics) {
              hit = { tHit, comp: c, hitLocalX, hitLocalY, isMirror, focalLength, dX_local, dY_local, scaleX, scaleY, rad };
            } else {
              hit = { tHit, comp: c, hitLocalX, hitLocalY, isMirror: false, focalLength: Infinity, dX_local: 0, dY_local: 0, scaleX: 1, scaleY: 1, rad: 0 };
            }
         }
      }
    }

    if (hit) {
       const hitGlobalX = currentX + Dx * hit.tHit;
       const hitGlobalY = currentY + Dy * hit.tHit;
       points.push({ x: hitGlobalX, y: hitGlobalY });

       if (hit.opticKind === "prism") {
          let prismOutputPoint = { x: hitGlobalX, y: hitGlobalY };
          if (hit.prismExitLocalX !== undefined && hit.prismExitLocalY !== undefined) {
             const unrotX = hit.prismExitLocalX / hit.scaleX;
             const unrotY = hit.prismExitLocalY / hit.scaleY;
             const pX_translated = unrotX * Math.cos(-hit.rad) - unrotY * Math.sin(-hit.rad);
             const pY_translated = unrotX * Math.sin(-hit.rad) + unrotY * Math.cos(-hit.rad);
             const def = STATIC_COMPONENTS.find(sc => sc.id === hit.comp.componentId);
             const cw = hit.comp.width || (def?.viewBoxW || 100);
             const ch = hit.comp.height || (def?.viewBoxH || 100);
             const centerX = hit.comp.x + cw / 2;
             const centerY = hit.comp.y + ch / 2;
             prismOutputPoint = { x: centerX + pX_translated, y: centerY + pY_translated };
          }
          points.push(prismOutputPoint);

          const bendRadians = (prismBendDegrees * Math.PI / 180) * (hit.dX_local >= 0 ? 1 : -1);
          const theta2_local = Math.atan2(hit.dY_local, hit.dX_local) + bendRadians;
          const dX_new_rot = Math.cos(theta2_local) * hit.scaleX;
          const dY_new_rot = Math.sin(theta2_local) * hit.scaleY;
          const Dx_new = dX_new_rot * Math.cos(-hit.rad) - dY_new_rot * Math.sin(-hit.rad);
          const Dy_new = dX_new_rot * Math.sin(-hit.rad) + dY_new_rot * Math.cos(-hit.rad);

          currentAngle = Math.atan2(Dy_new, Dx_new);
          currentX = prismOutputPoint.x + Dx_new * 0.1;
          currentY = prismOutputPoint.y + Dy_new * 0.1;
          currentSourceId = hit.comp.id;
       } else if (hit.opticKind === "slab") {
          const globalAngleDeg = Math.round(Math.abs(currentAngle * 180 / Math.PI)) % 360;
          const is42Deg = Math.abs(globalAngleDeg - 42) <= 1 || Math.abs(globalAngleDeg - (180 - 42)) <= 1 || Math.abs(globalAngleDeg - (360 - 42)) <= 1 || Math.abs(globalAngleDeg - (180 + 42)) <= 1;
          
          let curLx = hit.hitLocalX;
          let curLy = hit.hitLocalY;
          let rawNx = hit.nx || 0;
          let rawNy = hit.ny || 0;
          
          const tilt = 38 * Math.PI / 180;
          const cosTilt = Math.cos(tilt);
          const sinTilt = Math.sin(tilt);
          let nx = rawNx, ny = rawNy;
          if (rawNx === -1) { nx = -cosTilt; ny = -sinTilt; }
          else if (rawNx === 1) { nx = cosTilt; ny = sinTilt; }
          else if (rawNy === -1) { nx = sinTilt; ny = -cosTilt; }
          else if (rawNy === 1) { nx = -sinTilt; ny = cosTilt; }

          const I_x = hit.dX_local;
          const I_y = hit.dY_local;
          
          let cosI_in = -(nx * I_x + ny * I_y);
          let eta_in = 1.0 / 1.5; // air to glass
          let sinT2_in = eta_in * eta_in * (1.0 - cosI_in * cosI_in);
          
          let dX_in = I_x, dY_in = I_y;
          if (sinT2_in <= 1.0) {
              const cosT_in = Math.sqrt(1.0 - sinT2_in);
              dX_in = eta_in * I_x + (eta_in * cosI_in - cosT_in) * nx;
              dY_in = eta_in * I_y + (eta_in * cosI_in - cosT_in) * ny;
          }
          
          const lenIn = Math.hypot(dX_in, dY_in);
          dX_in /= lenIn;
          dY_in /= lenIn;

          const def = STATIC_COMPONENTS.find(sc => sc.id === hit!.comp.componentId);
          const cw = hit.comp.width || (def?.viewBoxW || 100);
          const ch = hit.comp.height || (def?.viewBoxH || 100);
          const centerX = hit.comp.x + cw / 2;
          const centerY = hit.comp.y + ch / 2;
          
          const minX = (10 / 160) * cw - cw / 2;
          const maxX = (110 / 160) * cw - cw / 2;
          const minY = (30 / 120) * ch - ch / 2;
          const maxY = (110 / 120) * ch - ch / 2;

          if (is42Deg) {
             // Force a specific slope to create a nice W-shape zigzag (approx 4 bounces)
             const signX = dX_in >= 0 ? 1 : -1;
             const signY = dY_in >= 0 ? 1 : -1;
             // slope = 3.2 gives exactly 4 bounces for 100 width and 80 height
             dX_in = 0.298 * signX; 
             dY_in = 0.954 * signY;

             for (let b = 0; b < 25; b++) {
                 let tX = Infinity;
                 if (dX_in > 1e-6) tX = (maxX - curLx) / dX_in;
                 else if (dX_in < -1e-6) tX = (minX - curLx) / dX_in;
                 
                 let tY = Infinity;
                 if (dY_in > 1e-6) tY = (maxY - curLy) / dY_in;
                 else if (dY_in < -1e-6) tY = (minY - curLy) / dY_in;

                 if (tX < 1e-4) tX = Infinity;
                 if (tY < 1e-4) tY = Infinity;
                 
                 let tHitIn = Math.min(tX, tY);
                 if (tHitIn === Infinity) break;
                 
                 let hitNormX = 0, hitNormY = 0;
                 if (tX < tY) hitNormX = dX_in > 0 ? -1 : 1;
                 else hitNormY = dY_in > 0 ? -1 : 1;
                 
                 curLx += dX_in * tHitIn;
                 curLy += dY_in * tHitIn;
                 
                 const pX_translated = curLx / hit.scaleX;
                 const pY_translated = curLy / hit.scaleY;
                 const rotGlobalX = pX_translated * Math.cos(-hit.rad) - pY_translated * Math.sin(-hit.rad);
                 const rotGlobalY = pX_translated * Math.sin(-hit.rad) + pY_translated * Math.cos(-hit.rad);
                 
                 points.push({ x: centerX + rotGlobalX, y: centerY + rotGlobalY });
                 
                 // Total Internal Reflection on top/bottom faces
                 if (hitNormY !== 0) {
                     dY_in = -dY_in;
                 }
                 
                 // Stop ray if it hits the left/right faces (don't bounce back or exit)
                 if (hitNormX !== 0) {
                     break;
                 }
             }
             break;
          } else {
             for (let b = 0; b < 25; b++) {
                 let tX = Infinity;
                 if (dX_in > 1e-6) tX = (maxX - curLx) / dX_in;
                 else if (dX_in < -1e-6) tX = (minX - curLx) / dX_in;
                 
                 let tY = Infinity;
                 if (dY_in > 1e-6) tY = (maxY - curLy) / dY_in;
                 else if (dY_in < -1e-6) tY = (minY - curLy) / dY_in;

                 if (tX < 1e-4) tX = Infinity;
                 if (tY < 1e-4) tY = Infinity;
                 
                 let tHitIn = Math.min(tX, tY);
                 if (tHitIn === Infinity) break;
                 
                 curLx += dX_in * tHitIn;
                 curLy += dY_in * tHitIn;
                 
                 const pX_translated = curLx / hit.scaleX;
                 const pY_translated = curLy / hit.scaleY;
                 const rotGlobalX = pX_translated * Math.cos(-hit.rad) - pY_translated * Math.sin(-hit.rad);
                 const rotGlobalY = pX_translated * Math.sin(-hit.rad) + pY_translated * Math.cos(-hit.rad);
                 
                 points.push({ x: centerX + rotGlobalX, y: centerY + rotGlobalY });

                 // Determine hit normal pointing OUT of the glass
                 let raw_N_out_x = 0, raw_N_out_y = 0;
                 if (tX < tY) {
                     raw_N_out_x = dX_in > 0 ? 1 : -1;
                 } else {
                     raw_N_out_y = dY_in > 0 ? 1 : -1;
                 }
                 
                 const tilt = 38 * Math.PI / 180;
                 const cosTilt = Math.cos(tilt);
                 const sinTilt = Math.sin(tilt);
                 let N_out_x = raw_N_out_x, N_out_y = raw_N_out_y;
                 if (raw_N_out_x === -1) { N_out_x = -cosTilt; N_out_y = -sinTilt; }
                 else if (raw_N_out_x === 1) { N_out_x = cosTilt; N_out_y = sinTilt; }
                 else if (raw_N_out_y === -1) { N_out_x = sinTilt; N_out_y = -cosTilt; }
                 else if (raw_N_out_y === 1) { N_out_x = -sinTilt; N_out_y = cosTilt; }

                 // For refraction, the normal should point INTO the medium of incidence (the glass)
                 const N_glass_x = -N_out_x;
                 const N_glass_y = -N_out_y;

                 let cosI_out = -(N_glass_x * dX_in + N_glass_y * dY_in);
                 let eta_out = 1.5 / 1.0;
                 let sinT2_out = eta_out * eta_out * (1.0 - cosI_out * cosI_out);

                 if (sinT2_out > 1.0) {
                     // Total Internal Reflection
                     dX_in = dX_in + 2 * cosI_out * N_glass_x;
                     dY_in = dY_in + 2 * cosI_out * N_glass_y;
                 } else {
                     // Exit the slab
                     const cosT_out = Math.sqrt(1.0 - sinT2_out);
                     let dX_out_local = eta_out * dX_in + (eta_out * cosI_out - cosT_out) * N_glass_x;
                     let dY_out_local = eta_out * dY_in + (eta_out * cosI_out - cosT_out) * N_glass_y;
                     
                     const Dx_new = dX_out_local * hit.scaleX * Math.cos(-hit.rad) - dY_out_local * hit.scaleY * Math.sin(-hit.rad);
                     const Dy_new = dX_out_local * hit.scaleX * Math.sin(-hit.rad) + dY_out_local * hit.scaleY * Math.cos(-hit.rad);
                     
                     currentAngle = Math.atan2(Dy_new, Dx_new);
                     currentX = centerX + rotGlobalX + Dx_new * 0.1;
                     currentY = centerY + rotGlobalY + Dy_new * 0.1;
                     currentSourceId = hit.comp.id;
                     break;
                 }
             }
          }
       } else if (hit.isMirror || hit.focalLength !== Infinity || hit.comp.componentId === 'plane_mirror') {
          // Refract or reflect
          const theta1_local = Math.atan2(hit.dY_local, hit.dX_local);
          const signX = hit.dX_local >= 0 ? 1 : -1;
          
          let theta2_local = theta1_local;

          if (isFinite(hit.focalLength)) {
             const F_x = hit.isMirror ? -hit.focalLength * signX : hit.focalLength * signX;
             const bend = Math.atan(hit.hitLocalY / (F_x - hit.hitLocalX));
             if (hit.isMirror) {
               theta2_local = Math.PI - theta1_local - bend;
             } else {
               theta2_local = theta1_local - bend;
             }
          } else if (hit.isMirror) {
             theta2_local = Math.PI - theta1_local;
          }

          const dX_new_local = Math.cos(theta2_local);
          const dY_new_local = Math.sin(theta2_local);

          const dX_new_rot = dX_new_local * hit.scaleX;
          const dY_new_rot = dY_new_local * hit.scaleY;

          const Dx_new = dX_new_rot * Math.cos(-hit.rad) - dY_new_rot * Math.sin(-hit.rad);
          const Dy_new = dX_new_rot * Math.sin(-hit.rad) + dY_new_rot * Math.cos(-hit.rad);

          if (hit.focalLength !== Infinity && Math.abs(dY_new_local) > 1e-4) {
             const t_virtual = -hit.hitLocalY / dY_new_local;
             if (t_virtual < -1) {
                virtualPaths.push([
                   { x: hitGlobalX, y: hitGlobalY },
                   { x: hitGlobalX + t_virtual * Dx_new, y: hitGlobalY + t_virtual * Dy_new }
                ]);
             }
          }

          currentAngle = Math.atan2(Dy_new, Dx_new);
          currentX = hitGlobalX + Dx_new * 0.1; // offset slightly to avoid self-intersection
          currentY = hitGlobalY + Dy_new * 0.1;
          currentSourceId = hit.comp.id;
       } else {
          break; // Stop at non-optics
       }
    } else {
       points.push({ x: currentX + Dx * 4000, y: currentY + Dy * 4000 });
       break;
    }
  }
  return { path: points, virtualPaths };
}

function getRayCastDistance(
  rayGlobalStartX: number,
  rayGlobalStartY: number,
  rayGlobalAngle: number,
  comp: PlacedComponent,
  allComponents: PlacedComponent[]
): number {
  let minDist = 4000;
  const P0x = rayGlobalStartX;
  const P0y = rayGlobalStartY;
  const Dx = Math.cos(rayGlobalAngle);
  const Dy = Math.sin(rayGlobalAngle);

  for (const c of allComponents) {
    if (c.id === comp.id) continue;
    const cw = c.width || 100;
    const ch = c.height || 100;
    const cx = c.x;
    const cy = c.y;

    const centerX = cx + cw / 2;
    const centerY = cy + ch / 2;

    const rad = -(c.rotation || 0) * Math.PI / 180;
    const scaleX = c.mirrored ? -1 : 1;
    const scaleY = c.flipped ? -1 : 1;

    const pX_translated = P0x - centerX;
    const pY_translated = P0y - centerY;

    const pX_rot = pX_translated * Math.cos(rad) - pY_translated * Math.sin(rad);
    const pY_rot = pX_translated * Math.sin(rad) + pY_translated * Math.cos(rad);

    const dX_rot = Dx * Math.cos(rad) - Dy * Math.sin(rad);
    const dY_rot = Dx * Math.sin(rad) + Dy * Math.cos(rad);

    const pX_local = pX_rot * scaleX;
    const pY_local = pY_rot * scaleY;
    const dX_local = dX_rot * scaleX;
    const dY_local = dY_rot * scaleY;

    let hitBoxMinX = -cw / 2;
    let hitBoxMaxX = cw / 2;
    let hitBoxMinY = -ch / 2;
    let hitBoxMaxY = ch / 2;

    if (c.componentId === 'laser_stand') {
       const standLengthCm = c.opticsStandLength || 14;
       const standLengthPx = standLengthCm * 10;
       const totalW = 54 + standLengthPx;

       hitBoxMinX = (30 / totalW) * cw - cw / 2;
       hitBoxMaxX = ((30 + standLengthPx) / totalW) * cw - cw / 2;
       hitBoxMinY = (27 / 80) * ch - ch / 2;
       hitBoxMaxY = (53 / 80) * ch - ch / 2;
    } else if (c.componentId === 'plane_mirror') {
       hitBoxMinX = -6; hitBoxMaxX = 6;
       hitBoxMinY = -ch / 2 + 10; hitBoxMaxY = ch / 2 - 10;
    } else if (c.componentId === 'convex_lens' || c.componentId === 'concave_lens') {
       hitBoxMinX = -12; hitBoxMaxX = 12;
       hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
    } else if (c.componentId === 'concave_mirror') {
       hitBoxMinX = 5; hitBoxMaxX = 30;
       hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
    } else if (c.componentId === 'convex_mirror') {
       hitBoxMinX = -20; hitBoxMaxX = 10;
       hitBoxMinY = -ch / 2 + 15; hitBoxMaxY = ch / 2 - 15;
    } else if (c.componentId.startsWith('led')) {
       hitBoxMinX = -cw / 3; hitBoxMaxX = cw / 3;
       hitBoxMinY = -ch / 3; hitBoxMaxY = ch / 3;
    }

    let tMinX = -Infinity, tMaxX = Infinity;
    if (Math.abs(dX_local) > 1e-6) {
       const t1 = (hitBoxMinX - pX_local) / dX_local;
       const t2 = (hitBoxMaxX - pX_local) / dX_local;
       tMinX = Math.min(t1, t2);
       tMaxX = Math.max(t1, t2);
    } else if (pX_local < hitBoxMinX || pX_local > hitBoxMaxX) {
       continue;
    }

    let tMinY = -Infinity, tMaxY = Infinity;
    if (Math.abs(dY_local) > 1e-6) {
       const t1 = (hitBoxMinY - pY_local) / dY_local;
       const t2 = (hitBoxMaxY - pY_local) / dY_local;
       tMinY = Math.min(t1, t2);
       tMaxY = Math.max(t1, t2);
    } else if (pY_local < hitBoxMinY || pY_local > hitBoxMaxY) {
       continue;
    }

    const tMin = Math.max(tMinX, tMinY);
    const tMax = Math.min(tMaxX, tMaxY);

    if (tMax >= tMin && tMax >= 0) {
       const tHit = tMin > 0 ? tMin : tMax;
       if (tHit > 0 && tHit < minDist) {
          minDist = tHit;
       }
    }
  }
  return minDist;
}

const ComponentNode = ({
  comp,
  imageSrc,
  litImageSrc,
  connectingFrom,
  isSimulating,
  simulationState,
  blinkToggle,
  onDragMove,
  onDragEnd,
  onUpdate,
  onPinClick,
  onSelect,
  onSizeResolved,
  allComponents,
}: ComponentNodeProps) => {
  const isLitBase = (comp.componentId.startsWith("led") || ANIMATED_OUTPUT_COMPONENTS.has(comp.componentId)) && !!simulationState?.lit;
  const isBlinking = comp.isBlinking;
  const isLit = isLitBase && (!isBlinking || !!blinkToggle);

  let activeImageSrc = imageSrc;
  let activeLitSrc = litImageSrc;

  if (comp.componentId === "microbit") {
    const urls = getMicrobitDataUrls(comp.ledColor || "black");
    activeImageSrc = urls.imageSrc;
    activeLitSrc = urls.litImageSrc;
  }

  const resolvedLitSrc = activeLitSrc ?? comp.litImageSrc;
  let activeSrc = (isLit && resolvedLitSrc) ? resolvedLitSrc : (activeImageSrc ?? "");

  if (comp.componentId === 'laser_stand') {
    const standLengthCm = comp.opticsStandLength || 14;
    const standLengthPx = standLengthCm * 10;
    const totalW = 20 + 10 + standLengthPx + 24;
    const totalH = 80;
    
    let ticks = '';
    for (let i = 0; i <= standLengthCm; i++) {
      const x = 30 + i * 10;
      const isMajor = i % 5 === 0;
      const tickH = isMajor ? 10 : 5;
      ticks += `<line x1="${x}" y1="27" x2="${x}" y2="${27 + tickH}" stroke="white" stroke-width="1.5" />`;
      if (isMajor) {
         ticks += `<text x="${x}" y="45" fill="white" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">${i}</text>`;
      }
    }

    const modifiedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}">
        <defs>
          <linearGradient id="stand_body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e63946" />
            <stop offset="20%" stop-color="#ff4d4d" />
            <stop offset="50%" stop-color="#cc0000" />
            <stop offset="80%" stop-color="#990000" />
            <stop offset="100%" stop-color="#660000" />
          </linearGradient>
          <linearGradient id="stand_cap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#444" />
            <stop offset="50%" stop-color="#111" />
            <stop offset="100%" stop-color="#000" />
          </linearGradient>
          <linearGradient id="stand_head" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#333" />
            <stop offset="50%" stop-color="#111" />
            <stop offset="100%" stop-color="#000" />
          </linearGradient>
        </defs>
        <rect x="20" y="25" width="10" height="30" rx="3" fill="url(#stand_cap)" />
        <rect x="30" y="27" width="${standLengthPx}" height="26" fill="url(#stand_body)" />
        ${ticks}
        <g transform="translate(${standLengthPx - 140}, 0)">
          <path d="M 160 15 L 160 65 A 12 6 0 0 0 184 65 L 184 15 A 12 6 0 0 1 160 15 Z" fill="url(#stand_head)" />
          <ellipse cx="172" cy="15" rx="12" ry="6" fill="#333" />
          <ellipse cx="172" cy="65" rx="12" ry="6" fill="#111" />
          <ellipse cx="172" cy="65" rx="6" ry="3" fill="#000" />
        </g>
      </svg>
    `;
    activeSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(modifiedSvg)}`;
  }

  if (comp.componentId === "laser" && comp.powerEnabled) {
    activeSrc = resolvedLitSrc || activeSrc;
  }

  // Hide the static gear in the SVG when we're going to overlay a live one
  if (isLit && comp.componentId === "dc_motor" && activeSrc.startsWith("data:image/svg+xml")) {
    const decoded = decodeURIComponent(activeSrc.replace("data:image/svg+xml;charset=utf-8,", ""));
    const modified = decoded.replace('id="gear_group"', 'id="gear_group" style="display:none;opacity:0"');
    activeSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(modified)}`;
  }

  const img = useImage(activeSrc);

  const isSphere = comp.componentId.startsWith("sphere_");

  const layout = useMemo(() => {
    if (!img) return null;

    const def = STATIC_COMPONENTS.find((item) => item.id === comp.componentId);
    const relativePins = def ? def.relativePins : (comp.relativePins ?? []);
    const isSvgSource =
      activeSrc.startsWith("data:image/svg+xml") ||
      activeSrc.toLowerCase().endsWith(".svg");

    if (isSvgSource) {
      return resolveFullImageLayout(img, relativePins);
    }

    const bounds = getInkBounds(img);
    if (bounds) {
      const smart = computeSmartLayout(bounds, relativePins, DISPLAY_TARGET);
      const resolvedPorts = relativePins.map((p) => smart.mapPin(p.relX, p.relY));

      return {
        w: smart.displayW,
        h: smart.displayH,
        crop: smart.crop,
        pins: resolvedPorts,
      };
    }

    return resolveFullImageLayout(img, relativePins);
  }, [img, comp.componentId, comp.relativePins, activeSrc]);

  const naturalW = layout?.w ?? 100;
  const naturalH = layout?.h ?? 100;
  const sphereSize = isSphere ? Math.max(SPHERE_MIN_SIZE, Math.min(SPHERE_MAX_SIZE, comp.width || naturalW)) : naturalW;
  const w = isSphere ? sphereSize : naturalW;
  const h = isSphere ? sphereSize : naturalH;
  const scaleX = naturalW ? w / naturalW : 1;
  const scaleY = naturalH ? h / naturalH : 1;
  const crop = layout?.crop;
  const visualPins = useMemo(() => {
    const pins = layout?.pins ?? comp.ports ?? [];
    return isSphere
      ? pins.map((pin) => ({ x: pin.x * scaleX, y: pin.y * scaleY }))
      : pins;
  }, [comp.ports, isSphere, layout?.pins, scaleX, scaleY]);

  useEffect(() => {
    if (layout) {
      const sameSize = comp.width === w && comp.height === h;
      const samePorts = (comp.ports ?? []).length === visualPins.length &&
        visualPins.every((pin, index) => {
          const current = comp.ports?.[index];
          return current && Math.abs(current.x - pin.x) < 0.01 && Math.abs(current.y - pin.y) < 0.01;
        });
      if (sameSize && samePorts) return;
      onSizeResolved?.(comp.id, visualPins, w, h);
    }
  }, [comp.height, comp.id, comp.ports, comp.width, h, layout, onSizeResolved, visualPins, w]);

  const isConnecting = connectingFrom !== null;
  const isThisComponentConnecting = isConnecting && connectingFrom?.compId === comp.id;
  const isSnapped = useMemo(() => {
    if (comp.componentId === "ac_bulb") {
      return allComponents.some(
        (c) => c.componentId === "bulb_holder" && Math.abs(c.x - comp.x) < 0.1 && Math.abs(c.y - comp.y) < 0.1
      );
    }
    if (comp.componentId === "bulb_holder") {
      return allComponents.some(
        (c) => c.componentId === "ac_bulb" && Math.abs(c.x - comp.x) < 0.1 && Math.abs(c.y - comp.y) < 0.1
      );
    }
    return false;
  }, [comp.componentId, comp.x, comp.y, allComponents]);
  const sphereMetal = METAL_PHYSICS[comp.physicsMetal || "Copper"] || METAL_PHYSICS.Copper;
  const sphereTextColor = getContrastTextColor(sphereMetal.colors.main);
  const isFrictionSphere = isSphere && comp.physicsChargeMethod === "Friction";
  const isEarthedSphere = isSphere && comp.physicsEarthing === "Earthed";
  const isElectricFieldIntensitySphere = isSphere && comp.physicsTopic === "Electric Field Intensity";
  const isElectricFieldLinesSphere = isSphere && comp.physicsTopic === "Electric Field Lines";
  const isElectricFluxSphere = isSphere && comp.physicsTopic === "Electric Flux";
  const isElectricPotentialSphere = isSphere && comp.physicsTopic === "Electric Potential";
  const isElectricPotentialDifferenceSphere = isSphere && comp.physicsTopic === "Electric Potential Difference";
  const inductionSource = findInductionSource(comp, allComponents);
  const visibleChargeValue = (!isEarthedSphere && !inductionSource && comp.physicsInductionPendingCharge)
    ? comp.physicsInductionPendingCharge
    : (comp.chargeValue ?? 0);
  const sphereChargeMagnitude = Math.abs(visibleChargeValue);
  const isRubbing = isFrictionSphere && allComponents.some(c => {
    if (c.id === comp.id || !c.componentId.startsWith('sphere_')) return false;
    if (!hasFrictionMethod(comp, c)) return false;
    const rA = (comp.width || 100) / 2, rB = (c.width || 100) / 2;
    return Math.hypot((comp.x + rA) - (c.x + rB), (comp.y + rA) - (c.y + rB)) < rA + rB + 12;
  });
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const shakeRef = useRef<Konva.Animation | null>(null);
  useEffect(() => {
    if (!isRubbing) {
      shakeRef.current?.stop();
      shakeRef.current = null;
      requestAnimationFrame(() => setShakeOffset({ x: 0, y: 0 }));
      return;
    }
    const layer = groupRef.current?.getLayer();
    if (!layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = frame.time;
      setShakeOffset({
        x: Math.sin(t * 0.08) * 3,
        y: Math.cos(t * 0.11) * 2,
      });
    }, layer);
    shakeRef.current = anim;
    anim.start();
    return () => {
      anim.stop();
      shakeRef.current = null;
      requestAnimationFrame(() => setShakeOffset({ x: 0, y: 0 }));
    };
  }, [isRubbing]);
  const chargeWaveDirection = isSphere && sphereChargeMagnitude > 0
    ? (visibleChargeValue >= 0 ? "outward" : "inward")
    : null;
  const chargeWaveTick = isSphere ? (isFrictionSphere ? 1 : comp.physicsWaveTick ?? 0) : 0;

    const groupRef = useRef<Konva.Group>(null);
  const isBurned = simulationState?.isBurned;
    const brightness = simulationState?.brightness ?? 0;
    const isShortCircuit = simulationState?.isShortCircuit;
    const capacitorSparkIntensity = simulationState?.capacitorSparkIntensity ?? 0;
    const capacitorSparkPoint = useMemo(() => {
      if (comp.componentId !== "capacitor" || capacitorSparkIntensity <= 0 || visualPins.length < 2) return null;
      let positiveIndex = comp.relativePins?.findIndex((pin) => pin.type === "positive") ?? -1;
      let negativeIndex = comp.relativePins?.findIndex((pin) => pin.type === "negative") ?? -1;
      if (positiveIndex < 0) positiveIndex = 1;
      if (negativeIndex < 0) negativeIndex = 0;
      const positivePin = visualPins[positiveIndex] ?? visualPins[1] ?? visualPins[0];
      const negativePin = visualPins[negativeIndex] ?? visualPins[0] ?? visualPins[1];
      if (!positivePin || !negativePin) return null;
      return {
        x: (positivePin.x + negativePin.x) / 2,
        y: (positivePin.y + negativePin.y) / 2,
      };
    }, [capacitorSparkIntensity, comp.componentId, comp.relativePins, visualPins]);

    // Laser animation removed as it is now a solid line

    return (
      <Group
        ref={groupRef}
        x={comp.x + shakeOffset.x}
        y={comp.y + shakeOffset.y}
        draggable={!isConnecting && !isSimulating}
        onDragMove={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          const snap = getComponentSnapOffset(comp, x, y, allComponents);
          const finalX = snap ? x + snap.dx : x;
          const finalY = snap ? y + snap.dy : y;
          
          if (snap) {
            e.target.x(finalX);
            e.target.y(finalY);
          }
          
          onDragMove?.(comp.id, finalX, finalY);
        }}
        onDragEnd={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          const snap = getComponentSnapOffset(comp, x, y, allComponents);
          const finalX = snap ? x + snap.dx : x;
          const finalY = snap ? y + snap.dy : y;
          onDragEnd(comp.id, finalX, finalY);
        }}
        onClick={(e) => {
          if (!isConnecting) {
            e.cancelBubble = true;
            if (comp.componentId === "pushbutton") {
              onUpdate?.(comp.id, { isPressed: !comp.isPressed });
            }
            onSelect(comp.id, e.evt.ctrlKey || e.evt.metaKey);
          }
        }}
        onTap={(e) => {
          if (!isConnecting) {
            e.cancelBubble = true;
            if (comp.componentId === "pushbutton") {
              onUpdate?.(comp.id, { isPressed: !comp.isPressed });
            }
            onSelect(comp.id, false);
          }
        }}
      >
        {/* Inner transformation group for rotation and flipping around center */}
        <Group
          x={w / 2}
          y={h / 2}
          offsetX={w / 2}
          offsetY={h / 2}
          rotation={comp.rotation}
          scaleX={comp.mirrored ? -1 : 1}
          scaleY={comp.flipped ? -1 : 1}
        >
          {isElectricFieldIntensitySphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <ElectricFieldIntensityVisual
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.38}
              chargeValue={visibleChargeValue}
              chargeUnit={comp.chargeUnit}
              sphereRadiusM={(w / 2) / 100}
              observationDistance={comp.physicsObservationDistance ?? Math.max(1, (w / 2) / 100)}
              sphereType={comp.physicsSphereType || "Conducting"}
            />
          )}

          {isElectricFluxSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <ElectricFluxVisual
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.38}
              chargeValue={visibleChargeValue}
              surfaceType={comp.physicsFluxSurfaceType || "Disc"}
              surfaceSize={comp.physicsFluxSurfaceSize ?? 100}
              angle={comp.physicsFluxAngle ?? 0}
              onAngleChange={(nextAngle) => onUpdate?.(comp.id, { physicsFluxAngle: nextAngle })}
            />
          )}

          {isElectricFieldLinesSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <ElectricFieldLinesVisual
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.39}
              chargeValue={visibleChargeValue}
              allSpheres={allComponents
                .filter((item) => item.id !== comp.id && item.componentId.startsWith("sphere_") && item.physicsTopic === "Electric Field Lines" && Math.abs(item.chargeValue ?? 0) > 0)
                .map((item) => ({
                  x: item.x + (item.width || 100) / 2 - comp.x,
                  y: item.y + (item.height || 100) / 2 - comp.y,
                  radius: ((item.width || 100) / 2) * 0.78,
                  chargeValue: item.chargeValue ?? 0,
                }))}
            />
          )}

          {isElectricPotentialSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <ElectricPotentialVisual
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.39}
              chargeValue={visibleChargeValue}
              chargeUnit={comp.chargeUnit}
              sphereRadiusM={(w / 2) / 100}
              observationDistance={comp.physicsObservationDistance ?? Math.max(1, (w / 2) / 100)}
            />
          )}

          {isElectricPotentialDifferenceSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <ElectricPotentialDifferenceVisual
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.39}
              chargeValue={visibleChargeValue}
              chargeUnit={comp.chargeUnit}
              dielectric={comp.physicsDielectric ?? 1}
              allSpheres={allComponents
                .filter((item) => item.id !== comp.id && item.componentId.startsWith("sphere_") && item.physicsTopic === "Electric Potential Difference")
                .map((item) => ({
                  x: item.x + (item.width || 100) / 2 - comp.x,
                  y: item.y + (item.height || 100) / 2 - comp.y,
                  radius: ((item.width || 100) / 2) * 0.78,
                }))}
            />
          )}

          {isSphere && !isElectricFieldIntensitySphere && !isElectricFieldLinesSphere && !isElectricFluxSphere && !isElectricPotentialSphere && !isElectricPotentialDifferenceSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <SphereChargeWave
              key={`sphere-wave-${comp.id}-${chargeWaveTick}-${chargeWaveDirection ?? "idle"}`}
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.38}
              color={SPHERE_CHARGE_WAVE_COLOR}
              chargeMagnitude={sphereChargeMagnitude}
              direction={chargeWaveDirection}
              waveTick={chargeWaveTick}
            />
          )}

          {img && (
            <KonvaImage 
              image={img} 
              width={w} 
              height={h} 
              {...(crop ? { crop } : {})}
              opacity={comp.componentId === "ac_bulb" && isSnapped ? 0 : (isBurned ? 0.4 : 1)}
            />
          )}

          {['concave_lens', 'convex_lens', 'plane_mirror', 'concave_mirror', 'convex_mirror'].includes(comp.componentId) && comp.opticsStatus === "Active" && (() => {
            let radiusCm = comp.opticsRadiusValue ?? 15;
            if (comp.opticsRadiusUnit === 'm') radiusCm *= 100;
            const fPx = radiusCm * 10;
            const showFocalPoints = comp.componentId !== 'plane_mirror';

            const isCurvedMirror = comp.componentId === 'concave_mirror' || comp.componentId === 'convex_mirror';
            const label2F = isCurvedMirror ? "C" : "2F";
            const offset2F = isCurvedMirror ? 7 : 10;

            return (
              <>
                <Line
                  points={[-2000, h / 2, 2000 + w, h / 2]}
                  stroke="black"
                  strokeWidth={1.5}
                  opacity={0.5}
                  listening={false}
                />
                <Circle
                  x={w / 2}
                  y={h / 2}
                  radius={4}
                  fill="black"
                  listening={false}
                />
                {showFocalPoints && (
                  <>
                    {/* 2F1 */}
                    <Circle x={w / 2 - 2 * fPx} y={h / 2} radius={8} fill="red" listening={false} />
                    <Text text={label2F} x={w / 2 - 2 * fPx - offset2F} y={h / 2 + 12} fontSize={20} fill="red" fontStyle="bold" listening={false} />
                    
                    {/* F1 */}
                    <Circle x={w / 2 - fPx} y={h / 2} radius={8} fill="red" listening={false} />
                    <Text text="F" x={w / 2 - fPx - 6} y={h / 2 + 12} fontSize={20} fill="red" fontStyle="bold" listening={false} />
                    
                    {/* F2 */}
                    <Circle x={w / 2 + fPx} y={h / 2} radius={8} fill="red" listening={false} />
                    <Text text="F" x={w / 2 + fPx - 6} y={h / 2 + 12} fontSize={20} fill="red" fontStyle="bold" listening={false} />
                    
                    {/* 2F2 */}
                    <Circle x={w / 2 + 2 * fPx} y={h / 2} radius={8} fill="red" listening={false} />
                    <Text text={label2F} x={w / 2 + 2 * fPx - offset2F} y={h / 2 + 12} fontSize={20} fill="red" fontStyle="bold" listening={false} />
                  </>
                )}
              </>
            );
          })()}
          {comp.componentId === "bulb_holder" && isSnapped && (
            <BulbSeatedInHolderOverlay width={w} height={h} isLit={isLit} />
          )}
          {(comp.componentId === "dc_power_supply" || comp.componentId === "ac_power_supply") && (
            <DCPowerSupplyOverlays
              comp={comp}
              width={w}
              height={h}
              simulationState={simulationState}
              onUpdate={onUpdate ?? (() => {})}
            />
          )}
          {isSphere && (
            <SphereMetalBadge
              x={w / 2}
              y={h / 2}
              symbol={sphereMetal.symbol}
              workFunctionEv={sphereMetal.workFunctionEv}
              chargeValue={visibleChargeValue}
              chargeUnit={comp.chargeUnit}
              showChargeValue={
                comp.physicsChargeMethod === "Conduction" ||
                comp.physicsTopic === "Coulomb's Law" ||
                comp.physicsTopic === "Electric Field Intensity" ||
                comp.physicsTopic === "Electric Field Lines" ||
                comp.physicsTopic === "Electric Flux" ||
                comp.physicsTopic === "Electric Potential" ||
                comp.physicsTopic === "Electric Potential Difference"
              }
              sphereSize={w}
              textColor={sphereTextColor}
            />
          )}
          {isSphere && !isElectricFieldIntensitySphere && !isElectricFieldLinesSphere && !isElectricFluxSphere && !isElectricPotentialSphere && !isElectricPotentialDifferenceSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <SphereChargeSigns
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.51}
              sign={visibleChargeValue >= 0 ? "+" : "-"}
              color={SPHERE_CHARGE_WAVE_COLOR}
            />
          )}
          {!isEarthedSphere && inductionSource && (
            <SphereInductionSigns
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.51}
              sourceDx={inductionSource.dx}
              sourceDy={inductionSource.dy}
              sourceCharge={inductionSource.component.chargeValue ?? 0}
              color={SPHERE_CHARGE_WAVE_COLOR}
            />
          )}
          {comp.componentId === 'laser' && comp.powerEnabled && (() => {
             const rad = (comp.rotation || 0) * Math.PI / 180;
             const scaleXDir = comp.mirrored ? -1 : 1;
             const scaleYDir = comp.flipped ? -1 : 1;

             const localX = (178 / 240) * w - w / 2;
             const localYRed = (32 / 80) * h - h / 2;
             const localYGreen = (48 / 80) * h - h / 2;
             const localYWhite = (40 / 80) * h - h / 2;

             const globalRedX = comp.x + w/2 + (localX * scaleXDir * Math.cos(rad) - localYRed * scaleYDir * Math.sin(rad));
             const globalRedY = comp.y + h/2 + (localX * scaleXDir * Math.sin(rad) + localYRed * scaleYDir * Math.cos(rad));

             const globalGreenX = comp.x + w/2 + (localX * scaleXDir * Math.cos(rad) - localYGreen * scaleYDir * Math.sin(rad));
             const globalGreenY = comp.y + h/2 + (localX * scaleXDir * Math.sin(rad) + localYGreen * scaleYDir * Math.cos(rad));

             const globalWhiteX = comp.x + w/2 + (localX * scaleXDir * Math.cos(rad) - localYWhite * scaleYDir * Math.sin(rad));
             const globalWhiteY = comp.y + h/2 + (localX * scaleXDir * Math.sin(rad) + localYWhite * scaleYDir * Math.cos(rad));

             const rayAngle = Math.atan2(scaleXDir * Math.sin(rad), scaleXDir * Math.cos(rad));
             
             const greenAngleRad = (comp.opticsGreenLaserAngle || 0) * Math.PI / 180;
             const dX_scaled = Math.cos(greenAngleRad) * scaleXDir;
             const dY_scaled = Math.sin(greenAngleRad) * scaleYDir;
             const globalGreenDx = dX_scaled * Math.cos(rad) - dY_scaled * Math.sin(rad);
             const globalGreenDy = dX_scaled * Math.sin(rad) + dY_scaled * Math.cos(rad);
             const greenRayAngle = Math.atan2(globalGreenDy, globalGreenDx);

             const redResult = traceRay(globalRedX, globalRedY, rayAngle, comp.id, allComponents, 8, 12);
             const greenResult = traceRay(globalGreenX, globalGreenY, greenRayAngle, comp.id, allComponents, 8, 18);
             const whiteGuideResult = traceRay(globalWhiteX, globalWhiteY, rayAngle, comp.id, allComponents, 8, 12);
             const spectrumResults = [
               { key: "red", color: "#ff1f1f", bend: 10 },
               { key: "orange", color: "#ff7a00", bend: 12 },
               { key: "yellow", color: "#ffe600", bend: 14 },
               { key: "green", color: "#28ff28", bend: 16 },
               { key: "blue", color: "#1996ff", bend: 18 },
               { key: "indigo", color: "#3145ff", bend: 20 },
               { key: "violet", color: "#8b2cff", bend: 22 },
             ].map((ray) => ({
               ...ray,
               result: traceRay(globalWhiteX, globalWhiteY, rayAngle, comp.id, allComponents, 8, ray.bend),
             }));

             const redPointsGlobal = redResult.path;
             const greenPointsGlobal = greenResult.path;
             const whiteGuidePointsGlobal = whiteGuideResult.path.length >= 3
               ? whiteGuideResult.path.slice(0, 3)
               : whiteGuideResult.path;

             const startXOffset = (178 / 240) * w;
             const yRedOffset = (32 / 80) * h;
             const yGreenOffset = (48 / 80) * h;
             const yWhiteOffset = (40 / 80) * h;

             const toLocalPoint = (globalX: number, globalY: number) => {
               const outerX = globalX - comp.x;
               const outerY = globalY - comp.y;
               const cx = w / 2;
               const cy = h / 2;
               const dx = outerX - cx;
               const dy = outerY - cy;
               const unrotX = dx * Math.cos(-rad) - dy * Math.sin(-rad);
               const unrotY = dx * Math.sin(-rad) + dy * Math.cos(-rad);
               return [unrotX * scaleXDir + cx, unrotY * scaleYDir + cy];
             };

             const redLinePoints = redPointsGlobal.flatMap(p => toLocalPoint(p.x, p.y));
             const greenLinePoints = greenPointsGlobal.flatMap(p => toLocalPoint(p.x, p.y));
             const whiteLinePoints = whiteGuidePointsGlobal.flatMap(p => toLocalPoint(p.x, p.y));
             const spectrumLines = spectrumResults
               .map((ray) => ({
                 ...ray,
                 points: ray.result.path.length >= 4
                   ? ray.result.path.slice(2).flatMap(p => toLocalPoint(p.x, p.y))
                   : [],
               }))
               .filter((ray) => ray.points.length >= 4);

             const redVirtualLines = redResult.virtualPaths.map(vp => vp.flatMap(p => toLocalPoint(p.x, p.y)));
             const greenVirtualLines = greenResult.virtualPaths.map(vp => vp.flatMap(p => toLocalPoint(p.x, p.y)));

             // Replace the start point with the precise local start point for clean visual connection
             if (redLinePoints.length >= 2) {
               redLinePoints[0] = startXOffset;
               redLinePoints[1] = yRedOffset;
             }
             if (greenLinePoints.length >= 2) {
               greenLinePoints[0] = startXOffset;
               greenLinePoints[1] = yGreenOffset;
             }
             if (whiteLinePoints.length >= 2) {
               whiteLinePoints[0] = startXOffset;
               whiteLinePoints[1] = yWhiteOffset;
             }

             const laserMode = comp.opticsLaserMode || (comp.powerEnabled ? "Both" : "Off");
             const showRed = laserMode === "Both" || laserMode === "Red";
             const showGreen = laserMode === "Both" || laserMode === "Green";
             const showWhite = laserMode === "White";

             return (
              <>
                {/* White Light Prism Spectrum */}
                {showWhite && (
                  <>
                    <Line
                      points={whiteLinePoints}
                      stroke="#ffffff"
                      strokeWidth={3}
                      lineJoin="round"
                      lineCap="round"
                      shadowColor="#ffffff"
                      shadowBlur={12}
                      opacity={0.95}
                      listening={false}
                    />
                    <Line
                      points={whiteLinePoints}
                      stroke="#dbeafe"
                      strokeWidth={1}
                      lineJoin="round"
                      lineCap="round"
                      opacity={0.9}
                      listening={false}
                    />
                    {spectrumLines.map((ray) => (
                      <Line
                        key={`white-spectrum-${ray.key}`}
                        points={ray.points}
                        stroke={ray.color}
                        strokeWidth={2.4}
                        lineJoin="round"
                        lineCap="round"
                        shadowColor={ray.color}
                        shadowBlur={10}
                        opacity={0.95}
                        listening={false}
                      />
                    ))}
                  </>
                )}

                {/* Top Red Beam */}
                {showRed && (
                  <>
                    <Line
                      points={redLinePoints}
                      stroke="#ff4444"
                      strokeWidth={2.5}
                      lineJoin="round"
                      lineCap="round"
                      shadowColor="#ff4444"
                      shadowBlur={10}
                      opacity={0.9}
                      listening={false}
                    />
                    <Line
                      points={redLinePoints}
                      stroke="#ffffff"
                      strokeWidth={1}
                      lineJoin="round"
                      lineCap="round"
                      opacity={0.8}
                      listening={false}
                    />
                    {redVirtualLines.map((pts, i) => (
                      <Line
                        key={`red-vp-${i}`}
                        points={pts}
                        stroke="#ff4444"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                      />
                    ))}
                  </>
                )}

                {/* Bottom Green Beam */}
                {showGreen && (
                  <>
                    <Line
                      points={greenLinePoints}
                      stroke="#44ff44"
                      strokeWidth={2.5}
                      lineJoin="round"
                      lineCap="round"
                      shadowColor="#44ff44"
                      shadowBlur={10}
                      opacity={0.9}
                      listening={false}
                    />
                    <Line
                      points={greenLinePoints}
                      stroke="#ffffff"
                      strokeWidth={1}
                      lineJoin="round"
                      lineCap="round"
                      opacity={0.8}
                      listening={false}
                    />
                    {greenVirtualLines.map((pts, i) => (
                      <Line
                        key={`green-vp-${i}`}
                        points={pts}
                        stroke="#44ff44"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                      />
                    ))}
                  </>
                )}
              </>
             );
          })()}


          {/* Visual Effects (Glow/Animations) driven by AI/Simulation state */}
          {(isLit || isBurned) && (() => {
            if (isBurned) {
              return <SmokeAnimation x={w / 2} y={h * 0.3} />;
            }

            // If it's a standard DC motor (CW/CCW rotation with gear)
            if (comp.componentId === 'dc_motor') {
               return <RotatingGear x={w / 2} y={h / 2} direction={simulationState?.direction ?? 1} speed={brightness} />;
            }

            if (comp.componentId === 'semiconductor') {
               return <SemiconductorElectronFlow w={w} h={h} direction={simulationState?.direction ?? 1} type={comp.semiconductorDoping} />;
            }

            if (comp.componentId === 'bulb_holder') {
              return null;
            }

            // Default glow for LEDs and bulbs
            const ledOpt = LED_COLOR_OPTIONS.find(o => o.value === comp.ledColor) || LED_COLOR_OPTIONS[0];
            const colorHex = comp.componentId === 'ac_bulb' ? '#FBC02D' : ledOpt.hex;
            const glowY = comp.componentId === 'ac_bulb' ? h * (45 / 140) : h * 0.38;
            const glowRadius = comp.componentId === 'ac_bulb' ? Math.max(w, h) * (45 / 140) : Math.max(w, h) * 0.38;

            return (
              <>
                <Circle
                  x={w / 2}
                  y={glowY}
                  radius={glowRadius}
                  fill={`${colorHex}30`}
                  shadowColor={colorHex}
                  shadowBlur={32 * brightness}
                  opacity={brightness}
                  listening={false}
                />
                <Circle
                  x={w / 2}
                  y={glowY}
                  radius={glowRadius * 0.6}
                  fill={`${colorHex}55`}
                  opacity={brightness}
                  listening={false}
                />
              </>
            );
          })()}

          {/* Short Circuit Spark */}
          {/* Friction Rubbing Glow */}
          {(() => {
            if (isFrictionSphere) {
              const radiusA = (comp.width || 100) / 2;
              const centerA = { x: comp.x + radiusA, y: comp.y + radiusA };

              const otherTouching = allComponents.find(c => {
                if (c.id === comp.id || !c.componentId.startsWith('sphere_') || c.physicsChargeMethod !== 'Friction') return false;
                const radiusB = (c.width || 100) / 2;
                const centerB = { x: c.x + radiusB, y: c.y + radiusB };
                return Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y) < (radiusA + radiusB);
              });

              if (otherTouching) {
                const radiusB = (otherTouching.width || 100) / 2;
                const centerB = { x: otherTouching.x + radiusB, y: otherTouching.y + radiusB };
                const dx = centerB.x - centerA.x;
                const dy = centerB.y - centerA.y;
                const angle = Math.atan2(dy, dx);

                return (
                  <Circle
                    x={(w / 2) + Math.cos(angle) * (radiusA - 5)}
                    y={(h / 2) + Math.sin(angle) * (radiusA - 5)}
                    radius={20}
                    fillRadialGradientStartRadius={0}
                    fillRadialGradientEndRadius={20}
                    fillRadialGradientColorStops={[0, 'rgba(255, 255, 150, 0.9)', 0.5, 'rgba(255, 220, 100, 0.4)', 1, 'transparent']}
                    shadowColor="#fbbf24"
                    shadowBlur={15}
                    opacity={0.8}
                    listening={false}
                  />
                );
              }
            }
            return null;
          })()}

          {isShortCircuit && <SparkEffect x={w / 2} y={h / 2} />}
          {capacitorSparkPoint && (
            <CapacitorSparkEffect
              x={capacitorSparkPoint.x}
              y={capacitorSparkPoint.y}
              intensity={capacitorSparkIntensity}
            />
          )}

          {(comp.componentId === "battery9v" || comp.componentId === "batteryaa" || comp.componentId === "battery3v") && simulationState?.isPrimaryBattery !== false && !!simulationState?.inParallel && (
            <BatteryDischargeOverlay isSimulating={!!isSimulating} w={w} h={h} />
          )}

          {comp.componentId === "battery9v" && (
            <Text
              x={w / 2}
              y={h * 0.73}
              text="9V"
              fontFamily="sans-serif"
              fontSize={28 * Math.min(scaleX, scaleY)}
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              fill="#FFFFFF"
              opacity={0.9}
              width={w}
              height={50 * Math.min(scaleX, scaleY)}
              offsetX={w / 2}
              offsetY={25 * Math.min(scaleX, scaleY)}
              scaleX={comp.mirrored ? -1 : 1}
              scaleY={comp.flipped ? -1 : 1}
            />
          )}

          {visualPins.map((pin, i) => {
            if (isSnapped) {
              if (comp.componentId === "ac_bulb") {
                return null;
              }
              if (comp.componentId === "bulb_holder" && (i === 2 || i === 3)) {
                return null;
              }
            }
            const def = STATIC_COMPONENTS.find((item) => item.id === comp.componentId);
            const pinDef = (def ? def.relativePins?.[i] : null) || comp.relativePins?.[i];
            return (
              <PinDot
                key={i}
                x={pin.x}
                y={pin.y}
                index={i}
                name={pinDef?.name}
                isActive={connectingFrom?.compId === comp.id && connectingFrom?.portIndex === i}
                isAvailable={isConnecting && !isThisComponentConnecting}
                compact={isSphere}
                onClick={() => onPinClick(comp.id, i)}
              />
            );
          })}
        </Group>
      </Group>
  );
};

interface DCPowerSupplyOverlaysProps {
  comp: PlacedComponent;
  width: number;
  height: number;
  simulationState?: SimulatedComponentState;
  onUpdate: (id: string, updates: Partial<PlacedComponent>) => void;
}

const DCPowerSupplyOverlays = ({
  comp,
  width,
  height,
  simulationState,
  onUpdate,
}: DCPowerSupplyOverlaysProps) => {
  const scaleX = width / 180;
  const scaleY = height / 170;
  const isAC = comp.componentId === "ac_power_supply";
  const runtimeState = simulationState as (SimulatedComponentState & {
    outputVoltage?: number;
    outputCurrent?: number;
    fault?: boolean;
  }) | undefined;
  const isOn = comp.powerEnabled !== false;
  const hasFault = !!runtimeState?.isShortCircuit || !!runtimeState?.fault;
  const voltageMax = isAC ? 260 : 100;
  const voltageStep = isAC ? 1 : 0.1;
  const currentStep = 0.01;
  const voltageSet = comp.powerVoltageSet ?? (isAC ? 230.5 : 12.5);
  const currentLimit = comp.powerCurrentLimit ?? (isAC ? 1.15 : 0.25);
  
  // For AC Power Supply, show the set voltage so the user can see their knob adjustments even if tripped.
  // For DC, show the actual output voltage (which drops in CC mode).
  const displayVoltage = isOn ? (isAC ? voltageSet : (runtimeState?.outputVoltage ?? voltageSet)) : 0;
  
  // For current, show the current limit for AC so the knob feels responsive.
  // The actual drawn current is visible in the Circuit Stats panel.
  const displayCurrent = isOn ? (isAC ? currentLimit : (runtimeState?.outputCurrent ?? 0)) : 0;
  
  const voltageAngle = (Math.min(Math.max(voltageSet, 0), voltageMax) / voltageMax) * 270 - 135;
  const currentAngle = (Math.min(Math.max(currentLimit, 0), 5) / 5) * 270 - 135;

  const updateVoltage = (delta: number) => {
    onUpdate(comp.id, {
      powerVoltageSet: Math.max(0, Math.min(voltageMax, Number((voltageSet + delta).toFixed(1)))),
    });
  };

  const updateCurrent = (delta: number) => {
    onUpdate(comp.id, {
      powerCurrentLimit: Math.max(0.01, Math.min(5, Number((currentLimit + delta).toFixed(2)))),
    });
  };

  const togglePower = () => onUpdate(comp.id, { powerEnabled: !isOn });

  const renderKnob = (x: number, y: number, label: string, angle: number) => (
    <Group x={x} y={y} listening={false}>
      <Circle radius={24} fill="rgba(15,23,42,0.22)" />
      <Group rotation={angle}>
        <Circle
          radius={21}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={21}
          fillRadialGradientColorStops={[0, "#f8fafc", 0.34, "#94a3b8", 0.68, "#334155", 1, "#020617"]}
          stroke="#1f2937"
          strokeWidth={1.3}
        />
        <Circle
          radius={15}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={15}
          fillRadialGradientColorStops={[0, "#ffffff", 0.36, "#9ca3af", 0.82, "#334155", 1, "#111827"]}
          stroke="#8aa0b6"
          strokeWidth={0.8}
        />
        <Line points={[0, -18, 0, -10]} stroke="#ffffff" strokeWidth={2.4} lineCap="round" />
      </Group>
      <Text
        x={-11}
        y={-9}
        width={22}
        text={label}
        fontFamily="Georgia, serif"
        fontSize={17}
        fontStyle="bold"
        align="center"
        fill="#ffffff"
      />
    </Group>
  );

  const renderFineButton = (
    x: number,
    y: number,
    label: string,
    onPress: () => void,
    tone: "voltage" | "current" | "dc"
  ) => {
    const fillStops =
      tone === "voltage"
        ? [0, "#f5d0fe", 0.48, "#a855f7", 1, "#6b21a8"]
        : tone === "current"
          ? [0, "#fed7aa", 0.5, "#f59e0b", 1, "#b45309"]
          : [0, "#ffffff", 0.38, "#cbd5e1", 1, "#64748b"];
    const strokeColor = tone === "voltage" ? "#581c87" : tone === "current" ? "#7c2d12" : "#475569";
    const textColor = tone === "dc" ? "#0f172a" : "#ffffff";

    return (
      <Group
        x={x}
        y={y}
        onMouseDown={(event) => {
          event.cancelBubble = true;
        }}
        onTouchStart={(event) => {
          event.cancelBubble = true;
        }}
        onMouseEnter={(event) => {
          const stage = event.target.getStage();
          if (stage) stage.container().style.cursor = "pointer";
        }}
        onMouseLeave={(event) => {
          const stage = event.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
        onClick={(event) => {
          event.cancelBubble = true;
          onPress();
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          onPress();
        }}
      >
        <KonvaRect x={-4} y={-4} width={20} height={18} fill="#000000" opacity={0.01} />
        <KonvaRect
          width={13}
          height={11}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: 11 }}
          fillLinearGradientColorStops={fillStops}
          stroke={strokeColor}
          strokeWidth={0.8}
          cornerRadius={2}
          shadowColor="#000000"
          shadowBlur={1.5}
          shadowOpacity={0.25}
          shadowOffset={{ x: 0.5, y: 0.7 }}
        />
        <Text
          y={label === "+" ? 0 : -1}
          width={13}
          text={label}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize={9}
          fontStyle="bold"
          align="center"
          fill={textColor}
        />
      </Group>
    );
  };

  return (
    <Group scaleX={scaleX} scaleY={scaleY}>
      {isOn && (
        <Group x={22} y={30} listening={false}>
          <Text
            width={96}
            text={isAC ? "888.8Vrms" : "88.8V"}
            fontFamily="Share Tech Mono, monospace"
            fontSize={isAC ? 15 : 17}
            align="right"
            fill={isAC ? "#3b0764" : "#083344"}
            opacity={0.26}
          />
          <Text
            y={21}
            width={96}
            text={isAC ? "8.88Arms" : "8.88A"}
            fontFamily="Share Tech Mono, monospace"
            fontSize={isAC ? 15 : 17}
            align="right"
            fill="#451a03"
            opacity={0.25}
          />
          <Text
            width={96}
            text={isAC ? `${displayVoltage.toFixed(1)}Vrms` : `${displayVoltage.toFixed(1)}V`}
            fontFamily="Share Tech Mono, monospace"
            fontSize={isAC ? 15 : 17}
            align="right"
            fill={isAC ? "#d946ef" : "#00f3fc"}
            shadowColor={isAC ? "#d946ef" : "#06b6d4"}
            shadowBlur={4}
          />
          <Text
            y={21}
            width={96}
            text={isAC ? `${displayCurrent.toFixed(2)}Arms` : `${displayCurrent.toFixed(2)}A`}
            fontFamily="Share Tech Mono, monospace"
            fontSize={isAC ? 15 : 17}
            align="right"
            fill={isAC ? "#facc15" : "#f59e0b"}
            shadowColor="#d97706"
            shadowBlur={4}
          />
        </Group>
      )}

      {(hasFault || isOn) && (
        <Group x={146} y={45} listening={false}>
          <Circle
            radius={8.2}
            fill={hasFault ? "#ef2917" : "#f97316"}
            opacity={hasFault ? 0.98 : 0.55}
            shadowColor={hasFault ? "#ef4444" : "#fb923c"}
            shadowBlur={hasFault ? 10 : 4}
          />
          <Circle x={-3.4} y={-4.3} radius={2.5} fill="#fff7ed" opacity={0.9} />
        </Group>
      )}

      {renderKnob(52, 108, "V", voltageAngle)}
      {renderKnob(122, 108, "A", currentAngle)}
      {renderFineButton(78, 93, "+", () => updateVoltage(voltageStep), isAC ? "voltage" : "dc")}
      {renderFineButton(78, 114, "-", () => updateVoltage(-voltageStep), isAC ? "voltage" : "dc")}
      {renderFineButton(148, 93, "+", () => updateCurrent(currentStep), isAC ? "current" : "dc")}
      {renderFineButton(148, 114, "-", () => updateCurrent(-currentStep), isAC ? "current" : "dc")}

      <Group
        x={29}
        y={137}
        onMouseDown={(event) => {
          event.cancelBubble = true;
        }}
        onTouchStart={(event) => {
          event.cancelBubble = true;
        }}
        onMouseEnter={(event) => {
          const stage = event.target.getStage();
          if (stage) stage.container().style.cursor = "pointer";
        }}
        onMouseLeave={(event) => {
          const stage = event.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
        onClick={(event) => {
          event.cancelBubble = true;
          togglePower();
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          togglePower();
        }}
      >
        <KonvaRect x={-2} y={-2} width={24} height={30} fill="#000000" opacity={0.01} />
        <KonvaRect
          x={2}
          y={isOn ? 10 : 2}
          width={16}
          height={12}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: 12 }}
          fillLinearGradientColorStops={
            isOn
              ? [0, "#fef2f2", 0.35, "#ef4444", 1, "#991b1b"]
              : [0, "#f8fafc", 0.45, "#cbd5e1", 1, "#64748b"]
          }
          stroke={isOn ? "#7f1d1d" : "#475569"}
          strokeWidth={0.7}
          cornerRadius={1.5}
          shadowColor={isOn ? "#ef4444" : "#000000"}
          shadowBlur={isOn ? 3 : 1}
          shadowOpacity={0.45}
        />
      </Group>
    </Group>
  );
};

const BulbSeatedInHolderOverlay = ({
  width,
  height,
  isLit,
}: {
  width: number;
  height: number;
  isLit: boolean;
}) => {
  const sx = width / 100;
  const sy = height / 140;

  return (
    <Group y={-3 * sy} scaleX={sx} scaleY={sy} listening={false}>
      {isLit && (
        <>
          <Circle
            x={50}
            y={42}
            radius={34}
            fill="rgba(251, 191, 36, 0.22)"
            shadowColor="#fbbf24"
            shadowBlur={18}
            opacity={0.82}
          />
          <Circle x={50} y={47} radius={20} fill="rgba(255, 237, 146, 0.28)" opacity={0.7} />
        </>
      )}
      <Path
        data="M 35 70 C 32 62, 27 54, 27 42 C 27 25, 37 15, 50 15 C 63 15, 73 25, 73 42 C 73 54, 68 62, 65 70 C 61 74, 39 74, 35 70 Z"
        fill={isLit ? "rgba(255, 214, 86, 0.5)" : "rgba(241, 245, 249, 0.34)"}
        stroke={isLit ? "#f59e0b" : "#8f98a3"}
        strokeWidth={1.15}
        shadowColor={isLit ? "#f59e0b" : "#cbd5e1"}
        shadowBlur={isLit ? 8 : 2}
        opacity={0.92}
      />
      <Path
        data="M 31 42 C 33 27, 44 19, 58 21 C 47 24, 37 32, 34 47"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.2}
        opacity={isLit ? 0.58 : 0.42}
        lineCap="round"
      />
      <Path
        data="M 42 68 L 44 48 M 58 68 L 56 48 M 44 48 Q 46 44, 48 48 Q 50 44, 52 48 Q 54 44, 56 48"
        fill="none"
        stroke={isLit ? "#fff7ad" : "#4b5563"}
        strokeWidth={isLit ? 1.6 : 1.1}
        shadowColor="#fbbf24"
        shadowBlur={isLit ? 8 : 0}
        lineCap="round"
      />
      <Path
        data="M 40 70 C 43 73, 57 73, 60 70 L 60 81 C 57 84, 43 84, 40 81 Z"
        fill="rgba(82, 90, 98, 0.94)"
        stroke="#2f353a"
        strokeWidth={0.5}
      />
      {[72, 75.5, 79].map((y) => (
        <Path
          key={y}
          data={`M 37 ${y} C 42 ${y + 3}, 58 ${y + 3}, 63 ${y}`}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={1.4}
          opacity={0.85}
          lineCap="round"
        />
      ))}
      <Path
        data="M 32 80 C 37 83, 63 83, 68 80"
        fill="none"
        stroke={isLit ? "#fde68a" : "#f3f4f6"}
        strokeWidth={1.3}
        opacity={isLit ? 0.85 : 0.72}
        lineCap="round"
      />
      <Path
        data="M 31 80 C 35 85, 65 85, 69 80"
        fill="none"
        stroke="#111827"
        strokeWidth={2}
        opacity={0.65}
        lineCap="round"
      />
    </Group>
  );
};

const SphereMetalBadge = ({
  x,
  y,
  symbol,
  workFunctionEv,
  chargeValue,
  chargeUnit,
  showChargeValue,
  sphereSize,
  textColor,
}: {
  x: number;
  y: number;
  symbol: string;
  workFunctionEv: number;
  chargeValue: number;
  chargeUnit?: string;
  showChargeValue: boolean;
  sphereSize: number;
  textColor: string;
}) => {
  const displayValue = showChargeValue
    ? formatChargeValue(chargeValue, chargeUnit)
    : `${workFunctionEv.toFixed(2)} eV`;
  const scale = Math.max(0.18, Math.min(1.35, sphereSize / 100));
  const symbolFontSize = Math.max(4, Math.round(16 * scale));
  const valueFontSize = Math.max(4, Math.round((showChargeValue ? 10 : 8) * scale));
  const symbolWidth = Math.max(14, Math.round(44 * scale));
  const valueWidth = Math.max(18, Math.round(62 * scale));
  const symbolY = -10 * scale;
  const valueY = 7 * scale;

  return (
    <Group x={x} y={y} listening={false}>
      <Text
        y={symbolY}
        width={symbolWidth}
        x={-symbolWidth / 2}
        align="center"
        text={symbol}
        fontSize={symbolFontSize}
        fontStyle="bold"
        fill={textColor}
        shadowColor="rgba(15,23,42,0.55)"
        shadowBlur={4}
      />
      <Text
        y={valueY}
        width={valueWidth}
        x={-valueWidth / 2}
        align="center"
        text={displayValue}
        fontSize={valueFontSize}
        fontStyle="bold"
        fill={textColor}
        shadowColor="rgba(15,23,42,0.55)"
        shadowBlur={4}
      />
    </Group>
  );
};

const formatChargeValue = (value: number, unit = "uC") => {
  const normalizedUnit = unit.replace("Âµ", "u").replace("µ", "u");
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  const sign = value > 0 ? "+" : "";
  return `${sign}${rounded} ${normalizedUnit}`;
};

const SphereChargeSigns = ({
  x,
  y,
  radius,
  sign,
  color,
}: {
  x: number;
  y: number;
  radius: number;
  sign: "+" | "-";
  color: string;
}) => {
  const angles = [-96, -64, -32, 0, 32, 64, 96, 128, 160, 192, 224, 256];

  return (
    <Group x={x} y={y} listening={false}>
      {angles.map((angle) => {
        const theta = (angle * Math.PI) / 180;
        return (
          <Text
            key={`${sign}-${angle}`}
            x={Math.cos(theta) * radius - 6}
            y={Math.sin(theta) * radius - 7}
            text={sign}
            fontSize={17}
            fontStyle="bold"
            fill={color}
            opacity={0.92}
          />
        );
      })}
    </Group>
  );
};

const SphereInductionSigns = ({
  x,
  y,
  radius,
  sourceDx,
  sourceDy,
  sourceCharge,
  color,
}: {
  x: number;
  y: number;
  radius: number;
  sourceDx: number;
  sourceDy: number;
  sourceCharge: number;
  color: string;
}) => {
  const sourceAngle = Math.atan2(sourceDy, sourceDx);
  const nearSign = sourceCharge > 0 ? "-" : "+";
  const farSign = sourceCharge > 0 ? "+" : "-";
  const offsets = [-62, -44, -26, -8, 10, 28, 46, 64];

  const renderSide = (baseAngle: number, sign: string) =>
    offsets.map((offset) => {
      const theta = baseAngle + (offset * Math.PI) / 180;
      return (
        <Text
          key={`${sign}-${baseAngle}-${offset}`}
          x={Math.cos(theta) * radius - 7}
          y={Math.sin(theta) * radius - 8}
          text={sign}
          fontSize={17}
          fontStyle="bold"
          fill={color}
          opacity={0.92}
          listening={false}
        />
      );
    });

  return (
    <Group x={x} y={y} listening={false}>
      {renderSide(sourceAngle, nearSign)}
      {renderSide(sourceAngle + Math.PI, farSign)}
    </Group>
  );
};

const getContrastTextColor = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((ch) => ch + ch).join("")
    : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.68 ? "#0f172a" : "#ffffff";
};

const ElectricFieldLinesVisual = ({
  x,
  y,
  radius,
  chargeValue,
  allSpheres,
}: {
  x: number;
  y: number;
  radius: number;
  chargeValue: number;
  allSpheres: { x: number; y: number; radius: number; chargeValue: number }[];
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [tick, setTick] = useState(0);
  const isPositive = chargeValue >= 0;
  const magnitude = Math.min(Math.abs(chargeValue), 40);
  const lineCount = Math.max(8, Math.min(24, 8 + Math.round(magnitude * 0.6)));
  const lineColor = isPositive ? "#ef4444" : "#38bdf8";
  const glowColor = isPositive ? "#f87171" : "#60a5fa";
  const travel = radius + 72 + magnitude * 1.6;
  const pulseRadius = radius + 14 + tick * Math.max(24, radius * 0.7);
  const oppositeTargets = allSpheres.filter((sphere) => chargeValue * sphere.chargeValue < 0);
  const nearestOpposite = oppositeTargets
    .map((sphere) => ({
      ...sphere,
      distance: Math.hypot(sphere.x - x, sphere.y - y),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  const sameTargets = allSpheres.filter((sphere) => chargeValue * sphere.chargeValue > 0);
  const nearestSame = sameTargets
    .map((sphere) => ({
      ...sphere,
      distance: Math.hypot(sphere.x - x, sphere.y - y),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
  const connectLineCount = nearestOpposite ? Math.min(9, Math.max(7, Math.round(lineCount * 0.38))) : 0;
  const targetAngle = nearestOpposite ? Math.atan2(nearestOpposite.y - y, nearestOpposite.x - x) : 0;
  const sameTargetAngle = nearestSame ? Math.atan2(nearestSame.y - y, nearestSame.x - x) : 0;
  const repelLineCount = nearestSame ? Math.min(18, Math.max(12, Math.round(lineCount * 0.74))) : 0;
  const ownMagnitude = Math.abs(chargeValue);
  const oppositeMagnitude = nearestOpposite ? Math.abs(nearestOpposite.chargeValue) : 0;
  const showLocalFieldLines = !nearestOpposite || ownMagnitude > oppositeMagnitude + 0.001;
  const angleDistance = (a: number, b: number) => {
    const diff = Math.abs(a - b) % (Math.PI * 2);
    return diff > Math.PI ? Math.PI * 2 - diff : diff;
  };

  useEffect(() => {
    if (!groupRef.current) return;
    const layer = groupRef.current.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      setTick((frame.time % 1200) / 1200);
    }, layer);

    anim.start();
    return () => { anim.stop(); };
  }, []);

  return (
    <Group ref={groupRef} x={x} y={y} listening={false}>
      {showLocalFieldLines && (
        <>
          <Circle
            radius={radius + 13}
            stroke={lineColor}
            strokeWidth={1.4}
            dash={[9, 8]}
            opacity={0.28}
          />
          <Circle
            radius={pulseRadius}
            stroke={lineColor}
            strokeWidth={1.1}
            dash={[6, 10]}
            opacity={0.22 * (1 - tick)}
            shadowColor={glowColor}
            shadowBlur={8}
          />
        </>
      )}
      {showLocalFieldLines && Array.from({ length: lineCount }).map((_, index) => {
        const angle = (index / lineCount) * Math.PI * 2;
        if (nearestOpposite && angleDistance(angle, targetAngle) < 1.22) return null;
        if (nearestSame && angleDistance(angle, sameTargetAngle) < 1.14) return null;
        const startRadius = radius + 4;
        const endRadius = travel;
        const phase = (tick + index / lineCount) % 1;
        const flowPhase = isPositive ? phase : 1 - phase;
        const pulseStart = radius + 8 + flowPhase * Math.max(18, travel - radius - 20);
        const pulseEnd = pulseStart + Math.max(14, radius * 0.32);
        const baseStart = isPositive ? startRadius : endRadius;
        const baseEnd = isPositive ? endRadius : startRadius;
        const moveStart = isPositive ? pulseStart : pulseEnd;
        const moveEnd = isPositive ? pulseEnd : pulseStart;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return (
          <Group key={`field-line-${index}`}>
            <Arrow
              points={[cos * baseStart, sin * baseStart, cos * baseEnd, sin * baseEnd]}
              stroke={lineColor}
              fill={lineColor}
              strokeWidth={index % 2 === 0 ? 1.8 : 1.2}
              pointerLength={7}
              pointerWidth={7}
              opacity={0.42}
              shadowColor={glowColor}
              shadowBlur={index % 2 === 0 ? 6 : 2}
            />
            <Arrow
              points={[cos * moveStart, sin * moveStart, cos * moveEnd, sin * moveEnd]}
              stroke={lineColor}
              fill={lineColor}
              strokeWidth={2}
              pointerLength={6}
              pointerWidth={6}
              opacity={0.45 + 0.45 * (isPositive ? 1 - phase : phase)}
              shadowColor={glowColor}
              shadowBlur={8}
            />
          </Group>
        );
      })}
      {nearestSame && Array.from({ length: repelLineCount }).map((_, index) => {
        const side = index < repelLineCount / 2 ? -1 : 1;
        const localIndex = index % Math.ceil(repelLineCount / 2);
        const surfaceSpread = side * (0.13 + localIndex * 0.075);
        const outerSpread = side * (0.66 + localIndex * 0.12);
        const surfaceAngle = sameTargetAngle + surfaceSpread;
        const outerAngle = sameTargetAngle + outerSpread;
        const surfaceNormalX = Math.cos(surfaceAngle);
        const surfaceNormalY = Math.sin(surfaceAngle);
        const outerNormalX = Math.cos(outerAngle);
        const outerNormalY = Math.sin(outerAngle);
        const surfaceX = Math.cos(surfaceAngle) * (radius + 5);
        const surfaceY = Math.sin(surfaceAngle) * (radius + 5);
        const reach = Math.min(travel * 1.2, Math.max(radius * 2.3, nearestSame.distance * 0.58));
        const outerX = outerNormalX * reach;
        const outerY = outerNormalY * reach;
        const startHandle = Math.max(50, radius * 1.02);
        const endHandle = Math.max(38, radius * 0.7);
        const curveControl1X = surfaceX + surfaceNormalX * startHandle;
        const curveControl1Y = surfaceY + surfaceNormalY * startHandle;
        const curveControl2X = outerX - outerNormalX * endHandle;
        const curveControl2Y = outerY - outerNormalY * endHandle;
        const pathData = isPositive
          ? `M ${surfaceX} ${surfaceY} C ${curveControl1X} ${curveControl1Y} ${curveControl2X} ${curveControl2Y} ${outerX} ${outerY}`
          : `M ${outerX} ${outerY} C ${curveControl2X} ${curveControl2Y} ${curveControl1X} ${curveControl1Y} ${surfaceX} ${surfaceY}`;
        const arrowHeadX = isPositive ? outerX : surfaceX;
        const arrowHeadY = isPositive ? outerY : surfaceY;
        const arrowControlX = isPositive ? curveControl2X : curveControl1X;
        const arrowControlY = isPositive ? curveControl2Y : curveControl1Y;
        const arrowTailX = arrowHeadX + (arrowControlX - arrowHeadX) * 0.16;
        const arrowTailY = arrowHeadY + (arrowControlY - arrowHeadY) * 0.16;
        const sameLineColor = isPositive ? "#ef4444" : "#38bdf8";
        const sameGlowColor = isPositive ? "#f87171" : "#60a5fa";

        return (
          <Group key={`field-repel-${index}`}>
            <Path
              data={pathData}
              stroke={sameLineColor}
              strokeWidth={1.55}
              opacity={0.82}
              shadowColor={sameGlowColor}
              shadowBlur={2}
            />
            <Arrow
              points={[arrowTailX, arrowTailY, arrowHeadX, arrowHeadY]}
              stroke={sameLineColor}
              fill={sameLineColor}
              strokeWidth={2}
              pointerLength={7}
              pointerWidth={7}
              opacity={0.9}
            />
          </Group>
        );
      })}
      {nearestOpposite && chargeValue > 0 && Array.from({ length: connectLineCount }).map((_, index) => {
        const normalized = connectLineCount === 1 ? 0 : (index / (connectLineCount - 1)) * 2 - 1;
        const spread = normalized * 0.72;
        const startAngle = targetAngle + spread * 0.72;
        const endAngle = targetAngle + Math.PI - spread * 0.72;
        const startX = Math.cos(startAngle) * (radius + 5);
        const startY = Math.sin(startAngle) * (radius + 5);
        const endX = nearestOpposite.x - x + Math.cos(endAngle) * (nearestOpposite.radius + 5);
        const endY = nearestOpposite.y - y + Math.sin(endAngle) * (nearestOpposite.radius + 5);
        const distance = Math.hypot(nearestOpposite.x - x, nearestOpposite.y - y);
        const normalHandle = Math.max(44, distance * 0.36);
        const arcHeight = spread * Math.max(18, distance * 0.13);
        const perpendicularX = -Math.sin(targetAngle);
        const perpendicularY = Math.cos(targetAngle);
        const control1X = startX + Math.cos(startAngle) * normalHandle + perpendicularX * arcHeight;
        const control1Y = startY + Math.sin(startAngle) * normalHandle + perpendicularY * arcHeight;
        const control2X = endX + Math.cos(endAngle) * normalHandle + perpendicularX * arcHeight;
        const control2Y = endY + Math.sin(endAngle) * normalHandle + perpendicularY * arcHeight;
        const pathData = `M ${startX} ${startY} C ${control1X} ${control1Y} ${control2X} ${control2Y} ${endX} ${endY}`;
        const arrowT = 0.54;
        const invT = 1 - arrowT;
        const arrowHeadX =
          invT ** 3 * startX +
          3 * invT ** 2 * arrowT * control1X +
          3 * invT * arrowT ** 2 * control2X +
          arrowT ** 3 * endX;
        const arrowHeadY =
          invT ** 3 * startY +
          3 * invT ** 2 * arrowT * control1Y +
          3 * invT * arrowT ** 2 * control2Y +
          arrowT ** 3 * endY;
        const tangentX =
          3 * invT ** 2 * (control1X - startX) +
          6 * invT * arrowT * (control2X - control1X) +
          3 * arrowT ** 2 * (endX - control2X);
        const tangentY =
          3 * invT ** 2 * (control1Y - startY) +
          6 * invT * arrowT * (control2Y - control1Y) +
          3 * arrowT ** 2 * (endY - control2Y);
        const tangentLength = Math.hypot(tangentX, tangentY) || 1;
        const arrowLength = Math.max(15, radius * 0.24);
        const arrowTailX = arrowHeadX - (tangentX / tangentLength) * arrowLength;
        const arrowTailY = arrowHeadY - (tangentY / tangentLength) * arrowLength;
        const movingT = (tick + index * 0.065) % 1;
        const movingInvT = 1 - movingT;
        const movingHeadX =
          movingInvT ** 3 * startX +
          3 * movingInvT ** 2 * movingT * control1X +
          3 * movingInvT * movingT ** 2 * control2X +
          movingT ** 3 * endX;
        const movingHeadY =
          movingInvT ** 3 * startY +
          3 * movingInvT ** 2 * movingT * control1Y +
          3 * movingInvT * movingT ** 2 * control2Y +
          movingT ** 3 * endY;
        const movingTangentX =
          3 * movingInvT ** 2 * (control1X - startX) +
          6 * movingInvT * movingT * (control2X - control1X) +
          3 * movingT ** 2 * (endX - control2X);
        const movingTangentY =
          3 * movingInvT ** 2 * (control1Y - startY) +
          6 * movingInvT * movingT * (control2Y - control1Y) +
          3 * movingT ** 2 * (endY - control2Y);
        const movingTangentLength = Math.hypot(movingTangentX, movingTangentY) || 1;
        const movingArrowLength = Math.max(12, radius * 0.2);
        const movingTailX = movingHeadX - (movingTangentX / movingTangentLength) * movingArrowLength;
        const movingTailY = movingHeadY - (movingTangentY / movingTangentLength) * movingArrowLength;

        return (
          <Group key={`field-connect-${index}`}>
            <Path
              data={pathData}
              stroke="#111827"
              strokeWidth={1.8}
              opacity={0.86}
              shadowColor="#94a3b8"
              shadowBlur={0.6}
            />
            <Arrow
              points={[arrowTailX, arrowTailY, arrowHeadX, arrowHeadY]}
              stroke="#111827"
              fill="#111827"
              strokeWidth={2}
              pointerLength={7}
              pointerWidth={7}
              opacity={0.9}
            />
            <Arrow
              points={[movingTailX, movingTailY, movingHeadX, movingHeadY]}
              stroke="#111827"
              fill="#111827"
              strokeWidth={2}
              pointerLength={6}
              pointerWidth={6}
              opacity={0.35 + 0.45 * (1 - movingT)}
            />
          </Group>
        );
      })}
    </Group>
  );
};

const ElectricFieldIntensityVisual = ({
  x,
  y,
  radius,
  chargeValue,
  chargeUnit,
  sphereRadiusM,
  observationDistance,
  sphereType,
}: {
  x: number;
  y: number;
  radius: number;
  chargeValue: number;
  chargeUnit?: string;
  sphereRadiusM: number;
  observationDistance: number;
  sphereType: "Conducting" | "Non-Conducting";
}) => {
  const distanceRatio = sphereRadiusM > 0 ? observationDistance / sphereRadiusM : 1;
  const fieldGap = Math.max(20, radius * 1.25);
  const outsideRingRadius = radius * Math.max(2.25, Math.min(distanceRatio + 1.25, 4.25));
  const fieldRingRadius = observationDistance >= sphereRadiusM ? outsideRingRadius : radius + fieldGap;
  const fieldLineStart = radius + Math.max(4, radius * 0.16);
  const fieldLineEnd = fieldRingRadius + Math.max(8, radius * 0.45);
  const hasCharge = Math.abs(chargeValue) > 0;
  const isPositive = chargeValue >= 0;
  const q = Math.abs(toCoulombs(chargeValue, chargeUnit));
  const electricField =
    sphereType === "Conducting" && observationDistance < sphereRadiusM
      ? 0
      : sphereType === "Non-Conducting" && observationDistance < sphereRadiusM
        ? (ELECTRIC_FIELD_K * q * observationDistance) / Math.pow(sphereRadiusM || 1, 3)
        : (ELECTRIC_FIELD_K * q) / Math.pow(observationDistance || 1, 2);
  const hasField = hasCharge && electricField > 0;
  const lineAngles = radius < 12
    ? [-90, -30, 30, 90, 150, 210]
    : radius < 20
      ? [-90, -45, 0, 45, 90, 135, 180, 225, 270]
      : [-90, -66, -42, -18, 6, 30, 54, 78, 102, 126, 150, 174, 198, 222, 246, 270];
  const ringColor = "#22d3ee";
  const lineColor = "#f59e0b";

  return (
    <Group x={x} y={y} listening={false}>
      <Circle
        radius={fieldRingRadius}
        stroke={ringColor}
        strokeWidth={3}
        opacity={0.55}
        shadowColor={ringColor}
        shadowBlur={14}
      />
      <Circle
        radius={fieldRingRadius - 7}
        stroke={ringColor}
        strokeWidth={1}
        opacity={0.2}
      />
      {hasField && lineAngles.map((angle, index) => {
        const theta = (angle * Math.PI) / 180;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const startRadius = isPositive ? fieldLineStart : fieldLineEnd;
        const endRadius = isPositive ? fieldLineEnd : fieldLineStart;
        const innerOpacity = index % 2 === 0 ? 0.88 : 0.62;

        return (
          <Arrow
            key={`electric-field-${angle}`}
            points={[
              cos * startRadius,
              sin * startRadius,
              cos * endRadius,
              sin * endRadius,
            ]}
            stroke={lineColor}
            fill={lineColor}
            strokeWidth={radius < 20 ? 1.2 : index % 2 === 0 ? 2.2 : 1.5}
            pointerLength={radius < 20 ? 5 : 8}
            pointerWidth={radius < 20 ? 5 : 8}
            opacity={innerOpacity}
            shadowColor="#fbbf24"
            shadowBlur={index % 2 === 0 ? 8 : 3}
          />
        );
      })}
      <Text
        x={-70}
        y={fieldRingRadius + 10}
        width={140}
        align="center"
        text={formatElectricField(electricField)}
        fontSize={11}
        fontStyle="bold"
        fill="#0f766e"
        opacity={0.88}
      />
    </Group>
  );
};

const ElectricFluxVisual = ({
  x,
  y,
  radius,
  chargeValue,
  surfaceType,
  surfaceSize,
  angle,
  onAngleChange,
}: {
  x: number;
  y: number;
  radius: number;
  chargeValue: number;
  surfaceType: "Triangular" | "Disc" | "Cylindrical" | "Spherical";
  surfaceSize: number;
  angle: number;
  onAngleChange?: (angle: number) => void;
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [tick, setTick] = useState(0);
  const [isRotatingSurface, setIsRotatingSurface] = useState(false);
  const isPositive = chargeValue >= 0;
  const lineColor = "#f59e0b";
  const surfaceColor = "#22d3ee";
  const surfaceScale = Math.max(0.4, Math.min(1.8, surfaceSize / 100));
  const surfaceHeight = Math.max(18, radius * 1.35 * surfaceScale);
  const surfaceWidth = Math.max(12, radius * 0.55 * surfaceScale);
  const surfaceVisualAngle = angle;
  const surfaceAngleRad = (surfaceVisualAngle * Math.PI) / 180;
  const surfaceCenterX = radius + Math.max(52, radius * 1.4);
  const surfaceCenterY = 0;
  const labelOffsetY = surfaceHeight / 2 + 12;
  const fieldAngles = radius < 20
    ? [-90, -45, 0, 45, 90, 135, 180, 225, 270]
    : [-90, -67.5, -45, -22.5, 0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  const signAngles = radius < 20
    ? [-90, -30, 30, 90, 150, 210, 270]
    : [-105, -75, -45, -15, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];
  const waveTravel = Math.max(18, radius * 0.82);
  const baseStart = radius + Math.max(6, radius * 0.18);
  const shaftLength = Math.max(18, radius * 0.55);
  const ringStroke = radius < 20 ? 1.2 : 1.8;
  const rotationHandleRadius = Math.max(4, radius * 0.12);
  const rotationHandleX = surfaceWidth / 2 + Math.max(8, radius * 0.16);
  const passingWaveOffsets = [-0.36, -0.12, 0.12, 0.36].map((offset) => offset * surfaceHeight);
  const passingWaveLength = Math.max(26, surfaceWidth * 1.55);
  const passingWaveTravel = Math.max(42, surfaceWidth * 2.6);
  const passingWaveStartX = surfaceCenterX - passingWaveTravel / 2;
  const updateAngleFromPointer = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    const root = groupRef.current;
    const stage = root?.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer || !root) return;

    const localPointer = root.getAbsoluteTransform().copy().invert().point(pointer);
    const nextAngle = (Math.atan2(localPointer.y - surfaceCenterY, localPointer.x - surfaceCenterX) * 180) / Math.PI;
    const normalizedAngle = Math.round((nextAngle + 360) % 360);
    onAngleChange?.(normalizedAngle);
  };
  const startSurfaceRotation = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true;
    setIsRotatingSurface(true);
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = "grabbing";
    updateAngleFromPointer(e);
  };
  const stopSurfaceRotation = () => {
    setIsRotatingSurface(false);
    const stage = groupRef.current?.getStage();
    if (stage) stage.container().style.cursor = "grab";
  };

  useEffect(() => {
    if (!groupRef.current) return;
    const layer = groupRef.current.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      setTick((frame.time % 1200) / 1200);
    }, layer);

    anim.start();
    return () => { anim.stop(); };
  }, []);

  useEffect(() => {
    if (!isRotatingSurface) return;
    window.addEventListener("mouseup", stopSurfaceRotation);
    window.addEventListener("touchend", stopSurfaceRotation);
    return () => {
      window.removeEventListener("mouseup", stopSurfaceRotation);
      window.removeEventListener("touchend", stopSurfaceRotation);
    };
  }, [isRotatingSurface]);

  const renderSurface = () => {
    if (surfaceType === "Spherical") {
      return (
        <Circle
          x={0}
          y={0}
          radius={radius * 2.25}
          scaleX={surfaceScale}
          scaleY={surfaceScale}
          stroke={surfaceColor}
          strokeWidth={2}
          dash={[10, 6]}
          opacity={0.55}
        />
      );
    }

    if (surfaceType === "Triangular") {
      return (
        <Group
          x={surfaceCenterX}
          y={surfaceCenterY}
          rotation={surfaceVisualAngle}
          onMouseDown={startSurfaceRotation}
          onTouchStart={startSurfaceRotation}
          onClick={(e) => { e.cancelBubble = true; }}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "grab";
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = "default";
          }}
        >
          <Path
            data={`M ${-surfaceWidth / 2} ${-surfaceHeight / 2} L ${surfaceWidth / 2} 0 L ${-surfaceWidth / 2} ${surfaceHeight / 2} Z`}
            fill="rgba(34,211,238,0.22)"
            stroke={surfaceColor}
            strokeWidth={2}
          />
          <Circle
            x={rotationHandleX}
            y={0}
            radius={rotationHandleRadius}
            fill={surfaceColor}
            stroke="#0f766e"
            strokeWidth={1}
          />
        </Group>
      );
    }

    return (
      <Group
        x={surfaceCenterX}
        y={surfaceCenterY}
        rotation={surfaceVisualAngle}
        onMouseDown={startSurfaceRotation}
        onTouchStart={startSurfaceRotation}
        onClick={(e) => { e.cancelBubble = true; }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "grab";
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = "default";
        }}
      >
        <KonvaRect
          x={-surfaceWidth / 2}
          y={-surfaceHeight / 2}
          width={surfaceWidth}
          height={surfaceHeight}
          cornerRadius={surfaceType === "Disc" ? surfaceWidth / 2 : 6}
          fill="rgba(34,211,238,0.22)"
          stroke={surfaceColor}
          strokeWidth={2}
        />
        {surfaceType === "Cylindrical" && (
          <>
            <Circle y={-surfaceHeight / 2} radius={surfaceWidth / 2} stroke={surfaceColor} strokeWidth={1} opacity={0.7} />
            <Circle y={surfaceHeight / 2} radius={surfaceWidth / 2} stroke={surfaceColor} strokeWidth={1} opacity={0.7} />
          </>
        )}
        <Circle
          x={rotationHandleX}
          y={0}
          radius={rotationHandleRadius}
          fill={surfaceColor}
          stroke="#0f766e"
          strokeWidth={1}
        />
      </Group>
    );
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      onMouseMove={(e) => {
        if (isRotatingSurface) updateAngleFromPointer(e);
      }}
      onTouchMove={(e) => {
        if (isRotatingSurface) updateAngleFromPointer(e);
      }}
      onMouseUp={stopSurfaceRotation}
      onTouchEnd={stopSurfaceRotation}
    >
      {[0, 0.48].map((offset, index) => {
        const phase = (tick + offset) % 1;
        return (
          <Circle
            key={`flux-wave-ring-${index}`}
            radius={baseStart + phase * waveTravel}
            stroke={lineColor}
            strokeWidth={ringStroke}
            dash={[8, 8]}
            opacity={0.42 * (1 - phase)}
            shadowColor="#fbbf24"
            shadowBlur={5}
          />
        );
      })}
      {fieldAngles.map((fieldAngle, index) => {
        const theta = (fieldAngle * Math.PI) / 180;
        const phase = (tick + index * 0.08) % 1;
        const outwardStart = baseStart + phase * waveTravel;
        const outwardEnd = outwardStart + shaftLength;
        const inwardStart = baseStart + (1 - phase) * waveTravel + shaftLength;
        const inwardEnd = inwardStart - shaftLength;
        const start = isPositive ? outwardStart : inwardStart;
        const end = isPositive ? outwardEnd : inwardEnd;

        return (
          <Arrow
            key={`flux-field-${fieldAngle}`}
            points={[
              Math.cos(theta) * start,
              Math.sin(theta) * start,
              Math.cos(theta) * end,
              Math.sin(theta) * end,
            ]}
            stroke={lineColor}
            fill={lineColor}
            strokeWidth={radius < 20 ? 1.2 : 2}
            pointerLength={radius < 20 ? 5 : 8}
            pointerWidth={radius < 20 ? 5 : 8}
            opacity={0.35 + (1 - phase) * 0.5}
            shadowColor="#fbbf24"
            shadowBlur={8}
          />
        );
      })}
      {signAngles.map((angle) => {
        const theta = (angle * Math.PI) / 180;
        const signRadius = radius + Math.max(14, radius * 0.34);
        return (
          <Text
            key={`flux-sign-${angle}`}
            x={Math.cos(theta) * signRadius - 6}
            y={Math.sin(theta) * signRadius - 8}
            text={isPositive ? "+" : "-"}
            fontSize={Math.max(12, radius * 0.32)}
            fontStyle="bold"
            fill="#ef4444"
            opacity={0.9}
          />
        );
      })}
      {surfaceType !== "Spherical" && passingWaveOffsets.map((offsetY, index) => {
        const phase = (tick + index * 0.18) % 1;
        const headX = isPositive
          ? passingWaveStartX + phase * passingWaveTravel
          : passingWaveStartX + (1 - phase) * passingWaveTravel;
        const tailX = isPositive ? headX - passingWaveLength : headX + passingWaveLength;

        return (
          <Arrow
            key={`flux-through-surface-${index}`}
            points={[tailX, surfaceCenterY + offsetY, headX, surfaceCenterY + offsetY]}
            stroke={lineColor}
            fill={lineColor}
            strokeWidth={radius < 20 ? 1.2 : 2}
            pointerLength={radius < 20 ? 5 : 8}
            pointerWidth={radius < 20 ? 5 : 8}
            opacity={0.18 + 0.58 * Math.sin(Math.PI * phase)}
            shadowColor="#fbbf24"
            shadowBlur={6}
          />
        );
      })}
      {renderSurface()}
      {surfaceType !== "Spherical" && (
        <>
          <Arrow
            points={[
              surfaceCenterX,
              surfaceCenterY,
              surfaceCenterX + Math.cos(surfaceAngleRad) * 46,
              surfaceCenterY + Math.sin(surfaceAngleRad) * 46,
            ]}
            stroke="#0f766e"
            fill="#0f766e"
            strokeWidth={2}
            pointerLength={7}
            pointerWidth={7}
          />
          <Text
            x={surfaceCenterX - 45}
            y={surfaceCenterY + labelOffsetY}
            width={90}
            align="center"
            text="Flux surface"
            fontSize={10}
            fill="#0f766e"
            fontStyle="bold"
          />
        </>
      )}
    </Group>
  );
};

const ElectricPotentialVisual = ({
  x,
  y,
  radius,
  chargeValue,
  chargeUnit,
  sphereRadiusM,
  observationDistance,
}: {
  x: number;
  y: number;
  radius: number;
  chargeValue: number;
  chargeUnit?: string;
  sphereRadiusM: number;
  observationDistance: number;
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [tick, setTick] = useState(0);
  const q = toCoulombs(chargeValue, chargeUnit);
  const isPositive = chargeValue >= 0;
  const ringColor = isPositive ? "#f97316" : "#38bdf8";
  const glowColor = isPositive ? "#fbbf24" : "#7dd3fc";
  const outerRingRadius = radius * POTENTIAL_RING_RADIUS_FACTOR;
  const outerRingRadiusM = sphereRadiusM * POTENTIAL_RING_RADIUS_FACTOR;
  const effectiveDistance = !Number.isFinite(observationDistance)
    ? Infinity
    : observationDistance < sphereRadiusM
      ? sphereRadiusM
      : observationDistance;
  const potential = Number.isFinite(effectiveDistance) ? (ELECTRIC_FIELD_K * q) / (effectiveDistance || 1) : 0;
  const rings = [
    radius + Math.max(14, radius * 0.38),
    radius + (outerRingRadius - radius) * 0.38,
    radius + (outerRingRadius - radius) * 0.63,
    outerRingRadius,
  ].filter((value, index, arr) => index === 0 || value - arr[index - 1] > 8);

  useEffect(() => {
    if (!groupRef.current) return;
    const layer = groupRef.current.getLayer();
    if (!layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      setTick((frame.time % 1400) / 1400);
    }, layer);
    anim.start();
    return () => { anim.stop(); };
  }, []);

  return (
    <Group ref={groupRef} x={x} y={y} listening={false}>
      {rings.map((ringRadius, index) => {
        const fade = Math.max(0.16, 0.78 - index * 0.16);
        const phase = (tick + index * 0.17) % 1;
        const isOuterRing = index === rings.length - 1;
        return (
          <Circle
            key={`potential-ring-${index}`}
            radius={ringRadius}
            stroke={ringColor}
            strokeWidth={index === 0 ? 2.4 : 1.5}
            dash={index === 0 ? undefined : [12, 8]}
            opacity={isOuterRing ? 0.62 : fade * (0.72 + 0.28 * (1 - phase))}
            shadowColor={glowColor}
            shadowBlur={isOuterRing ? 3 : index === 0 ? 14 : 7}
          />
        );
      })}
      <Circle
        radius={outerRingRadius}
        stroke="#0f766e"
        strokeWidth={1.2}
        dash={[4, 7]}
        opacity={0.55}
      />
      <Text
        x={-78}
        y={outerRingRadius + 10}
        width={156}
        align="center"
        text={formatElectricPotential(potential)}
        fontSize={11}
        fontStyle="bold"
        fill={isPositive ? "#9a3412" : "#0369a1"}
        opacity={0.92}
      />
      <Text
        x={-90}
        y={outerRingRadius + 28}
        width={180}
        align="center"
        text={`Outer r = ${outerRingRadiusM.toFixed(2)} m`}
        fontSize={10}
        fontStyle="bold"
        fill="#0f766e"
        opacity={0.72}
      />
    </Group>
  );
};

const ElectricPotentialDifferenceVisual = ({
  x,
  y,
  radius,
  chargeValue,
  chargeUnit,
  dielectric,
  allSpheres,
}: {
  x: number;
  y: number;
  radius: number;
  chargeValue: number;
  chargeUnit?: string;
  dielectric: number;
  allSpheres: { x: number; y: number; radius: number }[];
}) => {
  const q = toCoulombs(chargeValue, chargeUnit);
  const kFactor = Number.isFinite(dielectric) && dielectric > 0 ? dielectric : Infinity;
  const sourceColor = chargeValue >= 0 ? "#ef4444" : "#38bdf8";
  const probes = allSpheres
    .map((sphere) => ({
      ...sphere,
      dx: sphere.x - x,
      dy: sphere.y - y,
      distancePx: Math.hypot(sphere.x - x, sphere.y - y),
    }))
    .sort((a, b) => a.distancePx - b.distancePx)
    .slice(0, 2);
  const potentialAt = (distancePx: number) => {
    const distanceM = Math.max(0.001, distancePx / 100);
    return Number.isFinite(kFactor) ? (ELECTRIC_FIELD_K * q) / (kFactor * distanceM) : 0;
  };
  const potentialA = probes[0] ? potentialAt(probes[0].distancePx) : 0;
  const potentialB = probes[1] ? potentialAt(probes[1].distancePx) : 0;
  const deltaV = potentialB - potentialA;
  const rings = [1.55, 2.25, 3.05, 3.85].map((factor) => radius * factor);

  return (
    <Group x={x} y={y} listening={false}>
      {rings.map((ringRadius, index) => (
        <Circle
          key={`potential-difference-ring-${index}`}
          radius={ringRadius}
          stroke={index < 2 ? "#ef4444" : "#2563eb"}
          strokeWidth={index === 0 ? 2.2 : 1.5}
          dash={index === 0 ? undefined : [10, 8]}
          opacity={0.5 - index * 0.06}
          shadowColor={index < 2 ? "#f87171" : "#60a5fa"}
          shadowBlur={index === 0 ? 9 : 3}
        />
      ))}
      {probes.map((probe, index) => {
        const isA = index === 0;
        const label = isA ? "A" : "B";
        const lineColor = isA ? "#111827" : "#ef4444";
        const potential = isA ? potentialA : potentialB;
        const distance = Math.max(0.001, probe.distancePx / 100);
        const unitX = probe.distancePx > 0 ? probe.dx / probe.distancePx : 1;
        const unitY = probe.distancePx > 0 ? probe.dy / probe.distancePx : 0;
        const startX = unitX * (radius + 4);
        const startY = unitY * (radius + 4);
        const endX = probe.dx - unitX * (probe.radius + 4);
        const endY = probe.dy - unitY * (probe.radius + 4);
        const labelX = probe.dx + 10;
        const labelY = probe.dy + (isA ? -34 : 12);

        return (
          <Group key={`voltmeter-probe-${label}`}>
            <Line
              points={[startX, startY, endX, endY]}
              stroke={lineColor}
              strokeWidth={2}
              dash={isA ? [8, 6] : undefined}
              opacity={0.85}
            />
            <Circle
              x={probe.dx}
              y={probe.dy}
              radius={Math.max(5, Math.min(9, probe.radius * 0.18))}
              fill={lineColor}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <Text
              x={labelX}
              y={labelY}
              width={124}
              text={`${label}: ${formatElectricPotential(potential).replace("V = ", "")}\nr = ${distance.toFixed(2)} m`}
              fontSize={10}
              fontStyle="bold"
              fill={lineColor}
              opacity={0.92}
            />
          </Group>
        );
      })}
      {probes.length >= 2 ? (
        <Text
          x={-95}
          y={radius * 3.95 + 12}
          width={190}
          align="center"
          text={`ΔV = ${formatElectricPotential(deltaV).replace("V = ", "")}`}
          fontSize={12}
          fontStyle="bold"
          fill={sourceColor}
          opacity={0.94}
        />
      ) : (
        <Text
          x={-90}
          y={radius * 2.6}
          width={180}
          align="center"
          text="Add two probe spheres A and B"
          fontSize={10}
          fontStyle="bold"
          fill="#1e3a8a"
          opacity={0.75}
        />
      )}
    </Group>
  );
};

const SphereChargeWave = ({
  x,
  y,
  radius,
  color,
  chargeMagnitude,
  direction,
  waveTick,
}: {
  x: number;
  y: number;
  radius: number;
  color: string;
  chargeMagnitude: number;
  direction: "outward" | "inward" | null;
  waveTick: number;
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [tick, setTick] = useState(0);
  const loopDuration = Math.max(360, 1400 - Math.min(chargeMagnitude, 100) * 9);

  useEffect(() => {
    if (!direction || !waveTick || !groupRef.current) return;

    const layer = groupRef.current.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const nextTick = (frame.time % loopDuration) / loopDuration;
      setTick(nextTick);
    }, layer);

    anim.start();
    return () => { anim.stop(); };
  }, [direction, loopDuration, waveTick]);

  if (!direction || !waveTick) return null;

  const arrowAngles = [-90, -54, -18, 18, 54, 90, 126, 162, 198, 234];
  const dashedRadius = radius + 12;
  const animatedTravel = 34 + Math.min(chargeMagnitude, 80) * 0.18;
  const shaftLength = 22 + Math.min(chargeMagnitude, 80) * 0.12;

  return (
    <Group ref={groupRef} x={x} y={y} listening={false}>
      <Circle
        radius={dashedRadius}
        stroke={color}
        strokeWidth={1.6}
        dash={[8, 7]}
        opacity={0.35}
      />
      {arrowAngles.map((angle, index) => {
        const phase = (tick + index * 0.085) % 1;
        const waveOffset = phase * animatedTravel;
        const theta = (angle * Math.PI) / 180;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const startBase = dashedRadius + 4;
        const endBase = startBase + shaftLength;

        const outwardStart = startBase + waveOffset;
        const outwardEnd = endBase + waveOffset;
        const inwardStart = startBase + (1 - phase) * animatedTravel;
        const inwardEnd = endBase + (1 - phase) * animatedTravel;
        const startRadius = direction === "outward" ? outwardStart : inwardStart;
        const endRadius = direction === "outward" ? outwardEnd : inwardEnd;
        const opacity = 0.25 + (1 - phase) * 0.55;

        return (
          <Arrow
            key={`${waveTick}-${direction}-${angle}`}
            points={[
              cos * startRadius,
              sin * startRadius,
              cos * endRadius,
              sin * endRadius,
            ]}
            stroke={color}
            fill={color}
            strokeWidth={2.2}
            pointerLength={7}
            pointerWidth={7}
            pointerAtBeginning={direction === "inward"}
            pointerAtEnding={direction === "outward"}
            opacity={opacity}
          />
        );
      })}
    </Group>
  );
};

const SmokeAnimation = ({ x, y }: { x: number; y: number }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; s: number; o: number }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.map(p => ({ ...p, y: p.y - 1.5, o: p.o - 0.02, s: p.s + 0.1 })).filter(p => p.o > 0),
        { id: Math.random(), x: (Math.random() - 0.5) * 15, y: 0, s: 2, o: 0.8 }
      ]);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <Group x={x} y={y}>
      {particles.map(p => (
        <Circle
          key={p.id}
          x={p.x}
          y={p.y}
          radius={p.s}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={p.s}
          fillRadialGradientColorStops={[0, '#555', 1, 'rgba(0,0,0,0)']}
          opacity={p.o}
        />
      ))}
    </Group>
  );
};

const CapacitorSparkEffect = ({ x, y, intensity }: { x: number; y: number; intensity: number }) => {
  const [phase, setPhase] = useState(0);
  const safeIntensity = Math.max(0, Math.min(1, intensity));
  const arcWidth = 18 + safeIntensity * 20;
  const arcHeight = 8 + safeIntensity * 10;

  useEffect(() => {
    const interval = setInterval(() => setPhase((value) => (value + 1) % 4), 85);
    return () => clearInterval(interval);
  }, []);

  if (safeIntensity <= 0) return null;

  const jitter = (phase - 1.5) * 1.4;
  const mainPoints = [
    -arcWidth / 2,
    0,
    -arcWidth * 0.28,
    -arcHeight * 0.45 + jitter,
    -arcWidth * 0.08,
    arcHeight * 0.4 - jitter,
    arcWidth * 0.14,
    -arcHeight * 0.28,
    arcWidth * 0.34,
    arcHeight * 0.25 + jitter,
    arcWidth / 2,
    0,
  ];
  const particleAngles = [-155, -118, -58, -24, 28, 62, 116, 152];

  return (
    <Group x={x} y={y} listening={false}>
      <Circle
        radius={arcWidth * 0.62}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={arcWidth * 0.62}
        fillRadialGradientColorStops={[0, "rgba(255,255,255,0.85)", 0.28, "rgba(96,165,250,0.45)", 1, "rgba(96,165,250,0)"]}
        opacity={0.45 + safeIntensity * 0.4}
      />
      <Line
        points={mainPoints}
        stroke="#ffffff"
        strokeWidth={2.2 + safeIntensity * 1.7}
        lineCap="round"
        lineJoin="round"
        shadowColor="#60a5fa"
        shadowBlur={12 + safeIntensity * 16}
      />
      <Line
        points={mainPoints}
        stroke="#2563eb"
        strokeWidth={1.1 + safeIntensity}
        lineCap="round"
        lineJoin="round"
        opacity={0.85}
      />
      {particleAngles.map((angle, index) => {
        const theta = (angle * Math.PI) / 180;
        const distance = 11 + safeIntensity * 28 + ((phase + index) % 3) * 3;
        const particleOpacity = Math.max(0, safeIntensity - index * 0.035);
        return (
          <Line
            key={angle}
            points={[
              Math.cos(theta) * (arcWidth * 0.35),
              Math.sin(theta) * 3,
              Math.cos(theta) * distance,
              Math.sin(theta) * distance,
            ]}
            stroke={index % 2 === 0 ? "#f97316" : "#facc15"}
            strokeWidth={0.8 + safeIntensity * 1.1}
            opacity={particleOpacity}
            lineCap="round"
            shadowColor="#fb923c"
            shadowBlur={4 + safeIntensity * 8}
          />
        );
      })}
    </Group>
  );
};

const SparkEffect = ({ x, y }: { x: number; y: number }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 100);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <Group x={x} y={y}>
      {[0, 72, 144, 216, 288].map(angle => (
        <Circle
          key={angle}
          x={Math.cos(angle) * 15}
          y={Math.sin(angle) * 15}
          radius={2}
          fill="#ffff00"
          shadowColor="#ffaa00"
          shadowBlur={5}
        />
      ))}
    </Group>
  );
};

const SemiconductorElectronFlow = ({ w, h, direction, type }: { w: number; h: number; direction: number; type?: string }) => {
  const [offset, setOffset] = useState(0);
  const layerRef = useRef<Konva.Group>(null);
  
  useEffect(() => {
    const anim = new Konva.Animation((frame) => {
      if (frame) {
        setOffset((prev) => prev + frame.timeDiff * 0.04 * direction); 
      }
    }, layerRef.current?.getLayer());
    anim.start();
    return () => { anim.stop(); };
  }, [direction]);

  if (type !== 'Phosphorus') return null;

  const scaleX = w / 450;
  const scaleY = h / 320;
  const loopOffset = ((offset % 65) + 65) % 65;
  const yVals = [42.5, 107.5, 172.5, 237.5];

  return (
    <Group ref={layerRef} listening={false}>
      {yVals.map((yBase, i) => (
         <Group key={`row-${i}`} y={(yBase - 14) * scaleY}>
            {[-32.5, 32.5, 97.5, 162.5, 227.5, 292.5, 357.5, 422.5, 487.5].map((xBase, j) => {
               const x = xBase + loopOffset;
               let opacity = 1;
               if (x < 65) opacity = Math.max(0, x / 65);
               if (x > 385) opacity = Math.max(0, (450 - x) / 65);
               return (
                  <Group key={`e-${j}`} x={x * scaleX} y={0} opacity={opacity}>
                     <Circle 
                       x={0} 
                       y={0} 
                       radius={2 * Math.max(0.5, Math.min(scaleX, scaleY))} 
                       fill="#4ADE80" 
                     />
                     <Text 
                       x={5 * scaleX} 
                       y={-6 * scaleY} 
                       text="e⁻"
                       fontSize={12 * Math.min(scaleX, scaleY)}
                       fill="white"
                       fontFamily="Arial"
                       fontStyle="bold"
                     />
                  </Group>
               );
            })}
         </Group>
      ))}
    </Group>
  );
};

const RotatingGear = ({ x, y, direction, speed = 1 }: { x: number; y: number; direction: number; speed?: number }) => {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    let currentRotation = groupRef.current?.rotation() || 0;
    const anim = new Konva.Animation((frame) => {
      if (groupRef.current && frame) {
        // Accumulate rotation using timeDiff for smooth transitions
        currentRotation += frame.timeDiff * 0.3 * speed * direction;
        groupRef.current.rotation(currentRotation % 360);
      }
    }, groupRef.current?.getLayer());
    
    anim.start();
    return () => { anim.stop(); };
  }, [direction, speed]);

  return (
    <Group x={x} y={y} ref={groupRef} shadowColor="#000" shadowBlur={4} shadowOpacity={0.2} shadowOffset={{ x: 1, y: 1 }}>
      {/* 12 Sharp, Shorter Teeth */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Group key={i} rotation={i * 30}>
          <Path 
            data="M 0 -15 L 3 -10 L -3 -10 Z"
            fill="#f1c40f"
            stroke="#d4ac0d"
            strokeWidth={0.5}
          />
        </Group>
      ))}
      <Circle 
        radius={11} 
        fillRadialGradientStartPoint={{ x: -2, y: -2 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={11}
        fillRadialGradientColorStops={[0, '#f1c40f', 1, '#d4ac0d']}
        stroke="#b7950b"
        strokeWidth={0.5}
      />
      {/* Asymmetric Direction Indicators */}
      <Circle x={0} y={-6} radius={2.5} fill="#d35400" opacity={0.8} />
      <Circle x={5} y={3} radius={1.5} fill="#d35400" opacity={0.6} />
      <Circle x={-5} y={3} radius={1.5} fill="#d35400" opacity={0.6} />

      <Circle radius={6} fill="#b7950b" opacity={0.6} />
      <Circle radius={3} fill="#7d6608" />
    </Group>
  );
};

const PinDot = ({
  x,
  y,
  index,
  name,
  isActive,
  isAvailable,
  compact = false,
  onClick,
}: {
  x: number;
  y: number;
  index: number;
  name?: string;
  isActive: boolean;
  isAvailable: boolean;
  compact?: boolean;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const showVisual = hovered || isActive || isAvailable;
  const displayName = name ?? `Pin ${index + 1}`;
  const hitRadius = compact ? 5 : HIT_RADIUS;
  const pinSize = compact ? 6 : 10;
  const shouldShowTooltip = hovered && !compact;

  return (
    <Group x={x} y={y}>
      {/* Hit Area */}
      <Circle
        radius={hitRadius}
        fill="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.cancelBubble = true;
          onClick();
        }}
      />

      {/* Red Square Pin (from reference) */}
      <Group visible={showVisual} listening={false}>
        <KonvaRect
          x={-pinSize / 2}
          y={-pinSize / 2}
          width={pinSize}
          height={pinSize}
          fill="#ff0000"
          stroke="#000000"
          strokeWidth={compact ? 1 : 2}
        />
        
        {/* Tooltip (from reference) */}
        {shouldShowTooltip && (
          <Group y={-25} x={-40}>
            {/* Tooltip Background */}
            <KonvaRect
              width={80}
              height={18}
              fill="#34495E"
              cornerRadius={4}
              shadowBlur={4}
              shadowOpacity={0.3}
            />
            {/* Tooltip Arrow */}
            <Path 
              data="M 35 18 L 40 23 L 45 18 Z" 
              fill="#34495E" 
            />
            <Text
              text={displayName}
              width={80}
              height={18}
              fontSize={10}
              fontStyle="bold"
              fill="#FFFFFF"
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )}
      </Group>
    </Group>
  );
};

export default ComponentNode;
