"use client";

import React from "react";
import { ChargeUnit, DistanceUnit } from "../../types/physics";

interface FormulaDisplayProps {
  q1: number;
  q1Unit: ChargeUnit;
  q2: number;
  q2Unit: ChargeUnit;
  r: number;
  rUnit: DistanceUnit;
  force: string;
  forceType: "attraction" | "repulsion" | "none";
}

export default function FormulaDisplay({
  q1,
  q1Unit,
  q2,
  q2Unit,
  r,
  rUnit,
  force,
  forceType,
}: FormulaDisplayProps) {
  const typeColor =
    forceType === "attraction"
      ? "#22d3ee"
      : forceType === "repulsion"
      ? "#f87171"
      : "#94a3b8";
  const typeLabel =
    forceType === "attraction"
      ? "Attraction (आकर्षण)"
      : forceType === "repulsion"
      ? "Repulsion (प्रतिकर्षण)"
      : "—";

  return (
    <div className="formula-display">
      {/* Main formula */}
      <div className="formula-main">
        <span className="formula-var" style={{ color: "#f1f5f9" }}>
          F
        </span>
        <span className="formula-eq">=</span>
        <span className="formula-var" style={{ color: "#818cf8" }}>
          k
        </span>
        <span className="formula-op">×</span>
        <div className="formula-fraction">
          <span className="formula-num">
            <span className="formula-var" style={{ color: "#f472b6" }}>
              q₁
            </span>
            <span className="formula-op">×</span>
            <span className="formula-var" style={{ color: "#38bdf8" }}>
              q₂
            </span>
          </span>
          <span className="formula-line"></span>
          <span className="formula-den">
            <span className="formula-var" style={{ color: "#34d399" }}>
              r²
            </span>
          </span>
        </div>
      </div>

      {/* Substituted values */}
      <div className="formula-substituted">
        <span className="formula-sub-label">Substituting:</span>
        <div className="formula-sub-row">
          <span className="formula-sub-var" style={{ color: "#818cf8" }}>
            k = 8.987 × 10⁹ N·m²/C²
          </span>
        </div>
        <div className="formula-sub-row">
          <span className="formula-sub-var" style={{ color: "#f472b6" }}>
            q₁ = {q1} {q1Unit}
          </span>
        </div>
        <div className="formula-sub-row">
          <span className="formula-sub-var" style={{ color: "#38bdf8" }}>
            q₂ = {q2} {q2Unit}
          </span>
        </div>
        <div className="formula-sub-row">
          <span className="formula-sub-var" style={{ color: "#34d399" }}>
            r = {r} {rUnit}
          </span>
        </div>
      </div>

      {/* Result */}
      <div className="formula-result">
        <span className="formula-result-label">Force:</span>
        <span className="formula-result-value">{force}</span>
      </div>

      {/* Force type */}
      <div className="formula-force-type" style={{ color: typeColor }}>
        <div
          className="formula-type-dot"
          style={{ backgroundColor: typeColor }}
        ></div>
        {typeLabel}
      </div>
    </div>
  );
}
