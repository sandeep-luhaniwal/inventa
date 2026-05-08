"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import ChargedSphere from "./ChargedSphere";
import ElectricFieldLines from "./ElectricFieldLines";
import DistanceScale from "./DistanceScale";
import ForceIndicator from "./ForceIndicator";
import { ChargedBody } from "../../types/physics";

interface CoulombCanvasProps {
  bodyA: ChargedBody;
  bodyB: ChargedBody;
  distance: number;
  distanceUnit: string;
  force: number;
  forceType: "attraction" | "repulsion" | "none";
  ionCountA: number;
  ionCountB: number;
  glowA: number;
  glowB: number;
  vibrationAmplitude: number;
  fieldLineCount: number;
  onBodyDrag: (bodyId: "A" | "B", x: number, y: number) => void;
  onDistanceChange: (value: number) => void;
}

export default function CoulombCanvas({
  bodyA,
  bodyB,
  distance,
  distanceUnit,
  force,
  forceType,
  ionCountA,
  ionCountB,
  glowA,
  glowB,
  vibrationAmplitude,
  fieldLineCount,
  onBodyDrag,
  onDistanceChange,
}: CoulombCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 600 });
  const [dragging, setDragging] = useState<"A" | "B" | null>(null);

  // Responsive sizing
  useEffect(() => {
    const updateDims = () => {
      if (svgRef.current?.parentElement) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDims({ width: rect.width, height: rect.height });
      }
    };
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, []);

  // Sphere positions centered vertically, spaced horizontally
  const centerY = dims.height * 0.45;
  const padding = 120;
  const usableWidth = dims.width - padding * 2;

  // Map distance to pixel spacing (linear mapping)
  const maxDistance = distanceUnit === "m" ? 5 : distanceUnit === "cm" ? 500 : 5000;
  const pixelSpacing = Math.max(140, (distance / maxDistance) * usableWidth);

  const posA = { x: dims.width / 2 - pixelSpacing / 2, y: centerY };
  const posB = { x: dims.width / 2 + pixelSpacing / 2, y: centerY };

  // Drag handlers
  const handleMouseDown = useCallback((bodyId: "A" | "B") => {
    setDragging(bodyId);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !svgRef.current) return;
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // Calculate new distance based on drag
      const otherX = dragging === "A" ? posB.x : posA.x;
      const newPixelDist = Math.abs(mouseX - otherX);
      const newDist = Math.max(0.01, (newPixelDist / usableWidth) * maxDistance);
      onDistanceChange(parseFloat(newDist.toFixed(3)));
    },
    [dragging, posA.x, posB.x, usableWidth, maxDistance, onDistanceChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Normalize force for arrow display (0-1)
  const normalizedForce = Math.min(1, isFinite(force) ? Math.log10(force + 1) / 6 : 0);

  // Force direction for arrows
  const aArrowDir = forceType === "attraction" ? "right" : "left";
  const bArrowDir = forceType === "attraction" ? "left" : "right";

  return (
    <div className="coulomb-canvas-wrapper">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        className="coulomb-canvas-svg"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background grid */}
        <defs>
          <pattern
            id="physics-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
          </pattern>
          <radialGradient id="bg-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="100%" height="100%" fill="url(#bg-vignette)" />
        <rect width="100%" height="100%" fill="url(#physics-grid)" opacity={0.4} />

        {/* Center axis line (subtle) */}
        <line
          x1={padding}
          y1={centerY}
          x2={dims.width - padding}
          y2={centerY}
          stroke="#1e293b"
          strokeWidth={1}
          strokeDasharray="4 8"
          opacity={0.5}
        />

        {/* Electric Field Lines */}
        <ElectricFieldLines
          x1={posA.x}
          y1={posA.y}
          x2={posB.x}
          y2={posB.y}
          forceType={forceType}
          lineCount={fieldLineCount}
          polarityA={bodyA.polarity}
          polarityB={bodyB.polarity}
        />

        {/* Force arrows */}
        <ForceIndicator
          cx={posA.x}
          cy={posA.y}
          direction={aArrowDir as "left" | "right"}
          magnitude={normalizedForce}
          forceType={forceType}
          sphereRadius={60}
        />
        <ForceIndicator
          cx={posB.x}
          cy={posB.y}
          direction={bArrowDir as "left" | "right"}
          magnitude={normalizedForce}
          forceType={forceType}
          sphereRadius={60}
        />

        {/* Charged Spheres */}
        <g
          onMouseDown={() => handleMouseDown("A")}
          style={{ cursor: "ew-resize" }}
        >
          <ChargedSphere
            id="A"
            cx={posA.x}
            cy={posA.y}
            charge={bodyA.charge}
            chargeUnit={bodyA.chargeUnit}
            polarity={bodyA.polarity}
            ionCount={ionCountA}
            glowIntensity={glowA}
            vibrationAmplitude={vibrationAmplitude}
          />
        </g>
        <g
          onMouseDown={() => handleMouseDown("B")}
          style={{ cursor: "ew-resize" }}
        >
          <ChargedSphere
            id="B"
            cx={posB.x}
            cy={posB.y}
            charge={bodyB.charge}
            chargeUnit={bodyB.chargeUnit}
            polarity={bodyB.polarity}
            ionCount={ionCountB}
            glowIntensity={glowB}
            vibrationAmplitude={vibrationAmplitude}
          />
        </g>

        {/* Distance Scale */}
        <DistanceScale
          x1={posA.x}
          y1={posA.y}
          x2={posB.x}
          distance={distance}
          distanceUnit={distanceUnit}
        />

        {/* Title overlay */}
        <text
          x={dims.width / 2}
          y={36}
          textAnchor="middle"
          fill="#475569"
          fontSize={14}
          fontFamily="var(--font-geist-sans), sans-serif"
          fontWeight={500}
        >
          Drag the spheres to change distance • Use the panel to set charge values
        </text>
      </svg>

      {/* Drag hint overlay */}
      {dragging && (
        <div className="coulomb-drag-hint">
          Dragging Charge {dragging}...
        </div>
      )}
    </div>
  );
}
