"use client";

import React from "react";

interface DistanceScaleProps {
  x1: number;
  y1: number;
  x2: number;
  distance: number;
  distanceUnit: string;
}

export default function DistanceScale({
  x1,
  y1,
  x2,
  distance,
  distanceUnit,
}: DistanceScaleProps) {
  const scaleY = y1 + 85;
  const midX = (x1 + x2) / 2;
  const width = Math.abs(x2 - x1);
  const leftX = Math.min(x1, x2);
  const rightX = Math.max(x1, x2);

  // Generate tick marks
  const tickCount = Math.max(2, Math.min(10, Math.floor(width / 40)));
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const t = i / tickCount;
    const tx = leftX + width * t;
    const isMajor = i === 0 || i === tickCount || i === Math.floor(tickCount / 2);
    ticks.push({ x: tx, major: isMajor });
  }

  return (
    <g className="distance-scale">
      {/* Main ruler line */}
      <line
        x1={leftX}
        y1={scaleY}
        x2={rightX}
        y2={scaleY}
        stroke="#475569"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* End caps */}
      <line
        x1={leftX}
        y1={scaleY - 8}
        x2={leftX}
        y2={scaleY + 8}
        stroke="#64748b"
        strokeWidth={2}
      />
      <line
        x1={rightX}
        y1={scaleY - 8}
        x2={rightX}
        y2={scaleY + 8}
        stroke="#64748b"
        strokeWidth={2}
      />

      {/* Tick marks */}
      {ticks.map((tick, i) => (
        <line
          key={i}
          x1={tick.x}
          y1={scaleY - (tick.major ? 6 : 3)}
          x2={tick.x}
          y2={scaleY + (tick.major ? 6 : 3)}
          stroke={tick.major ? "#64748b" : "#334155"}
          strokeWidth={tick.major ? 1.5 : 1}
        />
      ))}

      {/* Distance label */}
      <rect
        x={midX - 48}
        y={scaleY + 12}
        width={96}
        height={26}
        rx={6}
        fill="#0f172a"
        stroke="#334155"
        strokeWidth={1}
      />
      <text
        x={midX}
        y={scaleY + 29}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={13}
        fontFamily="var(--font-geist-mono), monospace"
      >
        r = {distance} {distanceUnit}
      </text>

      {/* Double arrow */}
      <defs>
        <marker
          id="scale-arrow-right"
          viewBox="0 0 8 8"
          refX="8"
          refY="4"
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#475569" />
        </marker>
        <marker
          id="scale-arrow-left"
          viewBox="0 0 8 8"
          refX="0"
          refY="4"
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M 8 0 L 0 4 L 8 8 Z" fill="#475569" />
        </marker>
      </defs>
      <line
        x1={leftX + 4}
        y1={scaleY}
        x2={rightX - 4}
        y2={scaleY}
        stroke="#475569"
        strokeWidth={1}
        markerStart="url(#scale-arrow-left)"
        markerEnd="url(#scale-arrow-right)"
        opacity={0.6}
      />
    </g>
  );
}
