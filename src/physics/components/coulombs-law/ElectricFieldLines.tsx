"use client";

import React, { useMemo } from "react";
import { generateFieldLinePath } from "../../utils/coulombEngine";

interface ElectricFieldLinesProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  forceType: "attraction" | "repulsion" | "none";
  lineCount: number;
  polarityA: "positive" | "negative" | "neutral";
  polarityB: "positive" | "negative" | "neutral";
}

export default function ElectricFieldLines({
  x1,
  y1,
  x2,
  y2,
  forceType,
  lineCount,
  polarityA,
  polarityB,
}: ElectricFieldLinesProps) {
  if (forceType === "none" || lineCount === 0) return null;

  const lines = useMemo(() => {
    const paths: { d: string; color: string; delay: number }[] = [];

    for (let i = 0; i < lineCount; i++) {
      const d = generateFieldLinePath(x1, y1, x2, y2, i, lineCount, forceType);

      // Color gradient between the two charges
      const t = i / Math.max(lineCount - 1, 1);
      const colorA =
        polarityA === "positive" ? [239, 68, 68] : [59, 130, 246];
      const colorB =
        polarityB === "positive" ? [239, 68, 68] : [59, 130, 246];
      const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * t);
      const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * t);
      const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * t);

      paths.push({
        d,
        color: `rgb(${r},${g},${b})`,
        delay: i * 0.15,
      });
    }
    return paths;
  }, [x1, y1, x2, y2, lineCount, forceType, polarityA, polarityB]);

  return (
    <g className="electric-field-lines">
      {lines.map((line, i) => (
        <path
          key={i}
          d={line.d}
          fill="none"
          stroke={line.color}
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.55}
          strokeDasharray="8 6"
          className="physics-field-line"
          style={{
            animationDelay: `${line.delay}s`,
            animationDirection:
              forceType === "attraction" ? "normal" : "reverse",
          }}
        />
      ))}

      {/* Direction arrows on field lines */}
      {forceType === "attraction" && (
        <>
          <defs>
            <marker
              id="field-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth={4}
              markerHeight={4}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" opacity={0.6} />
            </marker>
          </defs>
        </>
      )}
    </g>
  );
}
