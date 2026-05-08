"use client";

import React, { useMemo } from "react";

interface ChargedSphereProps {
  id: "A" | "B";
  cx: number;
  cy: number;
  charge: number;
  chargeUnit: string;
  polarity: "positive" | "negative" | "neutral";
  ionCount: number;
  glowIntensity: number;
  vibrationAmplitude: number;
  onDrag?: (id: "A" | "B", dx: number) => void;
}

export default function ChargedSphere({
  id,
  cx,
  cy,
  charge,
  chargeUnit,
  polarity,
  ionCount,
  glowIntensity,
  vibrationAmplitude,
}: ChargedSphereProps) {
  const radius = 60;
  const isPositive = polarity === "positive";
  const isNeutral = polarity === "neutral" || charge === 0;

  const primaryColor = isNeutral
    ? "#64748b"
    : isPositive
    ? "#ef4444"
    : "#3b82f6";
  const glowColor = isNeutral
    ? "rgba(100,116,139,0.3)"
    : isPositive
    ? `rgba(239,68,68,${glowIntensity * 0.6})`
    : `rgba(59,130,246,${glowIntensity * 0.6})`;
  const innerGlow = isNeutral
    ? "rgba(100,116,139,0.1)"
    : isPositive
    ? `rgba(239,68,68,${glowIntensity * 0.15})`
    : `rgba(59,130,246,${glowIntensity * 0.15})`;

  // Generate ion positions inside the sphere (deterministic, spread out)
  const ions = useMemo(() => {
    const result: { x: number; y: number }[] = [];
    const count = Math.min(ionCount, 15);
    if (count === 0) return result;

    // Golden angle distribution for even spacing
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const r = (radius - 18) * Math.sqrt((i + 0.5) / count);
      const theta = i * goldenAngle;
      result.push({
        x: cx + r * Math.cos(theta),
        y: cy + r * Math.sin(theta),
      });
    }
    return result;
  }, [cx, cy, ionCount, radius]);

  const sign = isPositive ? "+" : "−";
  const animDuration = Math.max(0.05, 0.3 - vibrationAmplitude * 0.03);

  return (
    <g
      className="charged-sphere-group"
      style={
        vibrationAmplitude > 0.2
          ? {
              animation: `physics-sphere-vibrate ${animDuration}s ease-in-out infinite`,
              transformOrigin: `${cx}px ${cy}px`,
              // CSS custom property for vibration amplitude
              // @ts-ignore
              "--vib-amp": `${vibrationAmplitude}px`,
            }
          : undefined
      }
    >
      {/* Outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 25}
        fill="none"
        stroke={glowColor}
        strokeWidth={2}
        opacity={glowIntensity * 0.4}
        className="physics-glow-ring"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius + 15}
        fill={`radial-gradient(circle, ${glowColor}, transparent)`}
        opacity={glowIntensity * 0.25}
      />

      {/* Glow gradient */}
      <defs>
        <radialGradient id={`sphere-grad-${id}`} cx="40%" cy="35%">
          <stop
            offset="0%"
            stopColor={isNeutral ? "#94a3b8" : isPositive ? "#fca5a5" : "#93c5fd"}
            stopOpacity={0.9}
          />
          <stop offset="50%" stopColor={primaryColor} stopOpacity={0.7} />
          <stop
            offset="100%"
            stopColor={isNeutral ? "#334155" : isPositive ? "#7f1d1d" : "#1e3a5f"}
            stopOpacity={0.95}
          />
        </radialGradient>
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation={4 + glowIntensity * 6} result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main sphere */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`url(#sphere-grad-${id})`}
        stroke={primaryColor}
        strokeWidth={2}
        filter={`url(#glow-${id})`}
        style={{ cursor: "ew-resize" }}
      />

      {/* Inner highlight (glass effect) */}
      <ellipse
        cx={cx - 12}
        cy={cy - 18}
        rx={22}
        ry={14}
        fill="white"
        opacity={0.12}
      />

      {/* Ions inside sphere */}
      {ions.map((ion, i) => (
        <text
          key={i}
          x={ion.x}
          y={ion.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={14}
          fontWeight={700}
          opacity={0.7 + glowIntensity * 0.3}
          className="physics-ion"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          {sign}
        </text>
      ))}

      {/* Body label */}
      <text
        x={cx}
        y={cy + radius + 24}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize={16}
        fontWeight={700}
        fontFamily="var(--font-geist-sans), sans-serif"
      >
        {id}
      </text>

      {/* Charge value label */}
      <text
        x={cx}
        y={cy + radius + 42}
        textAnchor="middle"
        fill={primaryColor}
        fontSize={13}
        fontFamily="var(--font-geist-mono), monospace"
      >
        {polarity === "positive" ? "+" : "−"}
        {charge} {chargeUnit}
      </text>
    </g>
  );
}
