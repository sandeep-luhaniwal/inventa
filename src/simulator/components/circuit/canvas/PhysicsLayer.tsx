"use client"
import React from 'react';
import { Group, Line, Text, Arrow, Rect, Circle } from 'react-konva';
import { PlacedComponent } from '@/simulator/types/circuit';

interface PhysicsLayerProps {
  components: PlacedComponent[];
}

type ForcePair = {
  s1: PlacedComponent;
  s2: PlacedComponent;
  force: number;
  isRepulsive: boolean;
  dx: number;
  dy: number;
  distPx: number;
  midX: number;
  midY: number;
};

type ResultantForce = {
  sphere: PlacedComponent;
  fx: number;
  fy: number;
  force: number;
};

const K = 8.9875517923e9; // Coulomb's constant
const CHARGE_UNIT_MULTIPLIER: Record<string, number> = {
  C: 1,
  mC: 1e-3,
  uC: 1e-6,
  nC: 1e-9,
};

function toCoulombs(value = 0, unit = "uC") {
  const normalizedUnit = unit.replace("Âµ", "u").replace("µ", "u");
  return value * (CHARGE_UNIT_MULTIPLIER[normalizedUnit] ?? 1e-6);
}

function getPairDielectric(a: PlacedComponent, b: PlacedComponent) {
  const value = a.physicsDielectric ?? b.physicsDielectric ?? 1;
  return value > 0 ? value : 1;
}

function getPairMedium(a: PlacedComponent, b: PlacedComponent) {
  return a.physicsMedium || b.physicsMedium || "Vacuum";
}

function formatForce(force: number) {
  if (!Number.isFinite(force)) return "∞";
  if (force >= 1) return `${force.toFixed(3)} N`;
  if (force >= 1e-3) return `${(force * 1000).toFixed(3)} mN`;
  if (force >= 1e-6) return `${(force * 1e6).toFixed(3)} µN`;
  return `${force.toExponential(2)} N`;
}

const PhysicsLayer: React.FC<PhysicsLayerProps> = ({ components }) => {
  const spheres = components.filter((component) =>
    component.componentId.startsWith('sphere_') &&
    component.physicsTopic === "Coulomb's Law"
  );

  if (spheres.length < 2) return null;

  const forcePairs: ForcePair[] = [];
  const resultants: ResultantForce[] = [];

  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      const s1 = spheres[i];
      const s2 = spheres[j];

      const q1 = toCoulombs(s1.chargeValue || 0, s1.chargeUnit);
      const q2 = toCoulombs(s2.chargeValue || 0, s2.chargeUnit);
      if (q1 === 0 || q2 === 0) continue;

      const dx = (s2.x + (s2.width || 100) / 2) - (s1.x + (s1.width || 100) / 2);
      const dy = (s2.y + (s2.height || 100) / 2) - (s1.y + (s1.height || 100) / 2);
      const distPx = Math.sqrt(dx * dx + dy * dy);
      
      // Assume 100px = 1 meter for simulation purposes
      const distM = distPx / 100;
      
      if (distM < 0.01) continue;

      const dielectric = getPairDielectric(s1, s2);
      const baseForce = (K * Math.abs(q1 * q2)) / (distM * distM);
      const force = Number.isFinite(dielectric) ? baseForce / dielectric : 0;
      const isRepulsive = (q1 * q2) > 0;

      forcePairs.push({
        s1,
        s2,
        force,
        isRepulsive,
        dx,
        dy,
        distPx,
        midX: s1.x + (s1.width || 100) / 2 + dx / 2,
        midY: s1.y + (s1.height || 100) / 2 + dy / 2
      });
    }
  }

  if (spheres.length > 2) {
    for (const target of spheres) {
      const targetCharge = toCoulombs(target.chargeValue || 0, target.chargeUnit);
      if (targetCharge === 0) continue;

      const targetX = target.x + (target.width || 100) / 2;
      const targetY = target.y + (target.height || 100) / 2;
      let fx = 0;
      let fy = 0;

      for (const source of spheres) {
        if (source.id === target.id) continue;

        const sourceCharge = toCoulombs(source.chargeValue || 0, source.chargeUnit);
        if (sourceCharge === 0) continue;

        const sourceX = source.x + (source.width || 100) / 2;
        const sourceY = source.y + (source.height || 100) / 2;
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distPx = Math.hypot(dx, dy);
        const distM = distPx / 100;
        if (distPx === 0 || distM < 0.01) continue;

        const dielectric = getPairDielectric(target, source);
        const baseForce = (K * Math.abs(targetCharge * sourceCharge)) / (distM * distM);
        const force = Number.isFinite(dielectric) ? baseForce / dielectric : 0;
        const direction = targetCharge * sourceCharge > 0 ? 1 : -1;
        fx += (dx / distPx) * force * direction;
        fy += (dy / distPx) * force * direction;
      }

      const force = Math.hypot(fx, fy);
      if (force > 0) {
        resultants.push({ sphere: target, fx, fy, force });
      }
    }
  }

  return (
    <Group>
      {forcePairs.map((pair, idx) => {
        const { s1, s2, force, isRepulsive, dx, dy, distPx, midX, midY } = pair;
        const angle = Math.atan2(dy, dx);
        
        // Arrow length depends on force (clamped)
        const arrowLen = Math.min(Math.max(force * 2, 20), 100);
        
        // Sphere centers
        const c1x = s1.x + (s1.width || 100) / 2;
        const c1y = s1.y + (s1.height || 100) / 2;
        const c2x = s2.x + (s2.width || 100) / 2;
        const c2y = s2.y + (s2.height || 100) / 2;
        // Force direction
        const dir = isRepulsive ? 1 : -1;

        return (
          <Group key={idx}>
            {/* Distance Line */}
            <Group>
              <MediumBand
                c1x={c1x}
                c1y={c1y}
                c2x={c2x}
                c2y={c2y}
                r1={(s1.width || 100) / 2}
                r2={(s2.width || 100) / 2}
                medium={getPairMedium(s1, s2)}
                dielectric={getPairDielectric(s1, s2)}
              />
              <Line
                points={[c1x, c1y, c2x, c2y]}
                stroke="#94a3b8"
                strokeWidth={1}
                dash={[5, 5]}
                opacity={0.5}
              />
              <Text
                x={(c1x + c2x) / 2}
                y={(c1y + c2y) / 2 + 10}
                text={`${(distPx / 10).toFixed(1)} cm`}
                fontSize={12}
                fill="#64748b"
                align="center"
              />
            </Group>
            
            {/* Force Arrow 1 (on S1) */}
            {force > 0 && (
              <Arrow
                points={[
                  c1x,
                  c1y,
                  c1x - Math.cos(angle) * arrowLen * dir,
                  c1y - Math.sin(angle) * arrowLen * dir
                ]}
                stroke={isRepulsive ? "#ef4444" : "#3b82f6"}
                fill={isRepulsive ? "#ef4444" : "#3b82f6"}
                strokeWidth={2}
                pointerLength={10}
                pointerWidth={10}
              />
            )}

            {/* Force Arrow 2 (on S2) */}
            {force > 0 && (
              <Arrow
                points={[
                  c2x,
                  c2y,
                  c2x + Math.cos(angle) * arrowLen * dir,
                  c2y + Math.sin(angle) * arrowLen * dir
                ]}
                stroke={isRepulsive ? "#ef4444" : "#3b82f6"}
                fill={isRepulsive ? "#ef4444" : "#3b82f6"}
                strokeWidth={2}
                pointerLength={10}
                pointerWidth={10}
              />
            )}

            {/* Force Label */}
            <Group x={midX} y={midY}>
               <Text
                text={formatForce(force)}
                fontSize={14}
                fontStyle="bold"
                fill="#1e293b"
                align="center"
                verticalAlign="middle"
                offsetX={40}
                offsetY={20}
              />
            </Group>

          </Group>
        );
      })}
      {resultants.map((resultant) => {
        const centerX = resultant.sphere.x + (resultant.sphere.width || 100) / 2;
        const centerY = resultant.sphere.y + (resultant.sphere.height || 100) / 2;
        const angle = Math.atan2(resultant.fy, resultant.fx);
        const arrowLen = Math.min(Math.max(Math.log10(resultant.force + 1) * 12, 28), 110);
        const endX = centerX + Math.cos(angle) * arrowLen;
        const endY = centerY + Math.sin(angle) * arrowLen;

        return (
          <Group key={`resultant-${resultant.sphere.id}`}>
            <Arrow
              points={[centerX, centerY, endX, endY]}
              stroke="#7c3aed"
              fill="#7c3aed"
              strokeWidth={3}
              pointerLength={12}
              pointerWidth={12}
            />
            <Text
              x={endX + 6}
              y={endY - 10}
              text={`FR ${formatForce(resultant.force)}`}
              fontSize={12}
              fontStyle="bold"
              fill="#6d28d9"
            />
          </Group>
        );
      })}
    </Group>
  );
};

const MediumBand = ({
  c1x,
  c1y,
  c2x,
  c2y,
  r1,
  r2,
  medium,
  dielectric,
}: {
  c1x: number;
  c1y: number;
  c2x: number;
  c2y: number;
  r1: number;
  r2: number;
  medium: string;
  dielectric: number;
}) => {
  const dx = c2x - c1x;
  const dy = c2y - c1y;
  const distance = Math.hypot(dx, dy);
  const length = Math.max(distance - r1 - r2 - 16, 22);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const midX = (c1x + c2x) / 2;
  const midY = (c1y + c2y) / 2;

  const style: Record<string, { fill: string; stroke: string; opacity: number; height: number; label: string }> = {
    Vacuum: { fill: "#ffffff", stroke: "#cbd5e1", opacity: 0.08, height: 30, label: "Vacuum" },
    Air: { fill: "#dbeafe", stroke: "#93c5fd", opacity: 0.18, height: 44, label: "Air gap" },
    Glass: { fill: "#cffafe", stroke: "#06b6d4", opacity: 0.46, height: 58, label: "Glass slab" },
    Paper: { fill: "#fff7ed", stroke: "#cbd5e1", opacity: 0.82, height: 54, label: "Paper sheet" },
    Mica: { fill: "#fde68a", stroke: "#f59e0b", opacity: 0.48, height: 52, label: "Mica layer" },
    Water: { fill: "#93c5fd", stroke: "#2563eb", opacity: 0.38, height: 60, label: "Water" },
    Metal: { fill: "#64748b", stroke: "#334155", opacity: 0.7, height: 62, label: "Metal shield" },
  };
  const band = style[medium] || style.Air;
  const dielectricLabel = Number.isFinite(dielectric) ? `K=${dielectric}` : "K=∞";

  return (
    <Group x={midX} y={midY} rotation={angle} listening={false}>
      <Rect
        x={-length / 2}
        y={-band.height / 2}
        width={length}
        height={band.height}
        cornerRadius={8}
        fill={band.fill}
        stroke={band.stroke}
        strokeWidth={1.2}
        opacity={band.opacity}
      />
      {medium === "Air" && [-14, 0, 14].map((y, index) => (
        <Line
          key={`air-${y}`}
          points={[-length / 2 + 8, y, -length / 6, y - 5, length / 6, y + 5, length / 2 - 8, y]}
          stroke="#60a5fa"
          strokeWidth={1}
          opacity={0.28 - index * 0.03}
          dash={[10, 8]}
          tension={0.45}
        />
      ))}
      {medium === "Water" && [-14, 0, 14].map((y) => (
        <Line
          key={`water-${y}`}
          points={[-length / 2 + 10, y, -length / 4, y + 6, 0, y - 4, length / 4, y + 5, length / 2 - 10, y]}
          stroke="#1d4ed8"
          strokeWidth={1}
          opacity={0.38}
          tension={0.45}
        />
      ))}
      {medium === "Water" && [-length / 4, 0, length / 4].map((x, index) => (
        <Circle
          key={`water-bubble-${index}`}
          x={x}
          y={index % 2 === 0 ? -8 : 10}
          radius={3}
          fill="#bfdbfe"
          stroke="#2563eb"
          strokeWidth={0.6}
          opacity={0.45}
        />
      ))}
      {medium === "Paper" && [-16, -5, 6, 17].map((y) => (
        <Line
          key={`paper-${y}`}
          points={[-length / 2 + 10, y, length / 2 - 10, y]}
          stroke="#94a3b8"
          strokeWidth={0.8}
          opacity={0.45}
        />
      ))}
      {medium === "Paper" && (
        <Line
          points={[-length / 2 + 16, -24, -length / 2 + 30, -8, -length / 2 + 16, 8]}
          stroke="#e2e8f0"
          strokeWidth={1}
          opacity={0.8}
        />
      )}
      {medium === "Glass" && (
        <>
          <Line points={[-length / 2 + 12, -18, length / 2 - 12, -18]} stroke="#ecfeff" strokeWidth={3} opacity={0.5} />
          <Line points={[-length / 2 + 12, 16, length / 2 - 12, 16]} stroke="#0891b2" strokeWidth={1} opacity={0.35} />
          <Line points={[-length / 3, 22, -length / 5, -22]} stroke="#ffffff" strokeWidth={2} opacity={0.5} />
          <Line points={[length / 5, 22, length / 3, -22]} stroke="#ffffff" strokeWidth={2} opacity={0.35} />
        </>
      )}
      {medium === "Mica" && [-18, -6, 6, 18].map((y) => (
        <Line
          key={`mica-${y}`}
          points={[-length / 2 + 8, y, length / 2 - 8, y - 8]}
          stroke="#92400e"
          strokeWidth={1}
          opacity={0.25}
        />
      ))}
      {medium === "Metal" && [-18, 0, 18].map((y) => (
        <Line
          key={`metal-${y}`}
          points={[-length / 2 + 8, y, length / 2 - 8, y]}
          stroke="#334155"
          strokeWidth={1.6}
          opacity={0.38}
        />
      ))}
      {medium === "Metal" && [-length / 4, 0, length / 4].map((x) => (
        <Line
          key={`metal-rib-${x}`}
          points={[x, -24, x, 24]}
          stroke="#e2e8f0"
          strokeWidth={1.2}
          opacity={0.35}
        />
      ))}
      <Text
        x={-58}
        y={-11}
        width={116}
        align="center"
        text={`${band.label}  ${dielectricLabel}`}
        fontSize={12}
        fontStyle="bold"
        fill={medium === "Metal" ? "#ffffff" : "#0f172a"}
        opacity={0.78}
      />
    </Group>
  );
};

export default PhysicsLayer;
