"use client";

import React from "react";

interface ForceIndicatorProps {
  cx: number;
  cy: number;
  direction: "left" | "right";
  magnitude: number; // 0-1 normalized
  forceType: "attraction" | "repulsion" | "none";
  sphereRadius: number;
}

export default function ForceIndicator({
  cx,
  cy,
  direction,
  magnitude,
  forceType,
  sphereRadius,
}: ForceIndicatorProps) {
  if (forceType === "none" || magnitude === 0) return null;

  // Arrow length based on magnitude
  const arrowLen = 30 + magnitude * 60;
  const isLeft = direction === "left";

  // Determine where arrow starts: just outside the sphere edge
  const startX = isLeft ? cx - sphereRadius - 6 : cx + sphereRadius + 6;
  const endX = isLeft ? startX - arrowLen : startX + arrowLen;

  const arrowColor =
    forceType === "attraction" ? "#22d3ee" : "#f87171";

  // Arrowhead points
  const headLen = 10;
  const headWidth = 6;
  const tipX = endX;
  const tipY = cy;
  const base1X = isLeft ? tipX + headLen : tipX - headLen;
  const base2X = base1X;
  const base1Y = cy - headWidth;
  const base2Y = cy + headWidth;

  return (
    <g className="force-indicator" opacity={0.85}>
      {/* Arrow shaft */}
      <line
        x1={startX}
        y1={cy}
        x2={isLeft ? endX + headLen : endX - headLen}
        y2={cy}
        stroke={arrowColor}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <polygon
        points={`${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`}
        fill={arrowColor}
      />

      {/* Force label */}
      <text
        x={endX + (isLeft ? -8 : 8)}
        y={cy - 12}
        textAnchor={isLeft ? "end" : "start"}
        fill={arrowColor}
        fontSize={11}
        fontWeight={600}
        fontFamily="var(--font-geist-mono), monospace"
      >
        F
      </text>
    </g>
  );
}
