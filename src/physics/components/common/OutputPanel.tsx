"use client";

import React from "react";
import { ChargeUnit, DistanceUnit, Polarity } from "../../types/physics";
import FormulaDisplay from "./FormulaDisplay";

interface OutputPanelProps {
  bodyA: { charge: number; chargeUnit: ChargeUnit; polarity: Polarity };
  bodyB: { charge: number; chargeUnit: ChargeUnit; polarity: Polarity };
  distance: number;
  distanceUnit: DistanceUnit;
  force: string;
  forceType: "attraction" | "repulsion" | "none";
  onChargeChange: (bodyId: "A" | "B", value: number) => void;
  onChargeUnitChange: (bodyId: "A" | "B", unit: ChargeUnit) => void;
  onPolarityChange: (bodyId: "A" | "B", polarity: Polarity) => void;
  onDistanceChange: (value: number) => void;
  onDistanceUnitChange: (unit: DistanceUnit) => void;
  onReset: () => void;
}

const chargeUnits: ChargeUnit[] = ["C", "mC", "µC", "nC"];
const distanceUnits: DistanceUnit[] = ["m", "cm", "mm"];

function ChargeInput({
  label,
  bodyId,
  charge,
  chargeUnit,
  polarity,
  onChargeChange,
  onChargeUnitChange,
  onPolarityChange,
}: {
  label: string;
  bodyId: "A" | "B";
  charge: number;
  chargeUnit: ChargeUnit;
  polarity: Polarity;
  onChargeChange: (bodyId: "A" | "B", value: number) => void;
  onChargeUnitChange: (bodyId: "A" | "B", unit: ChargeUnit) => void;
  onPolarityChange: (bodyId: "A" | "B", polarity: Polarity) => void;
}) {
  const isPositive = polarity === "positive";
  const accentColor = isPositive ? "#ef4444" : "#3b82f6";

  return (
    <div className="output-charge-group">
      <div className="output-charge-header">
        <div
          className="output-charge-badge"
          style={{ backgroundColor: accentColor + "22", borderColor: accentColor }}
        >
          <span style={{ color: accentColor, fontWeight: 700, fontSize: 14 }}>
            {label}
          </span>
        </div>
        <div className="output-polarity-toggle">
          <button
            className={`polarity-btn ${isPositive ? "active" : ""}`}
            style={{
              backgroundColor: isPositive ? "#ef444422" : "transparent",
              color: isPositive ? "#ef4444" : "#64748b",
              borderColor: isPositive ? "#ef4444" : "#334155",
            }}
            onClick={() => onPolarityChange(bodyId, "positive")}
          >
            +
          </button>
          <button
            className={`polarity-btn ${!isPositive ? "active" : ""}`}
            style={{
              backgroundColor: !isPositive ? "#3b82f622" : "transparent",
              color: !isPositive ? "#3b82f6" : "#64748b",
              borderColor: !isPositive ? "#3b82f6" : "#334155",
            }}
            onClick={() => onPolarityChange(bodyId, "negative")}
          >
            −
          </button>
        </div>
      </div>
      <div className="output-charge-input-row">
        <input
          type="number"
          className="output-input"
          value={charge}
          min={0}
          step={0.1}
          onChange={(e) => onChargeChange(bodyId, parseFloat(e.target.value) || 0)}
        />
        <select
          className="output-select"
          value={chargeUnit}
          onChange={(e) =>
            onChargeUnitChange(bodyId, e.target.value as ChargeUnit)
          }
        >
          {chargeUnits.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function OutputPanel({
  bodyA,
  bodyB,
  distance,
  distanceUnit,
  force,
  forceType,
  onChargeChange,
  onChargeUnitChange,
  onPolarityChange,
  onDistanceChange,
  onDistanceUnitChange,
  onReset,
}: OutputPanelProps) {
  return (
    <div className="output-panel">
      {/* Title */}
      <div className="output-title-section">
        <h2 className="output-title">⚡ Coulomb&apos;s Law</h2>
        <p className="output-subtitle">कूलम्ब का नियम</p>
      </div>

      {/* Charge Inputs */}
      <div className="output-section">
        <h3 className="output-section-title">Charges (आवेश)</h3>
        <ChargeInput
          label="Charge A (q₁)"
          bodyId="A"
          charge={bodyA.charge}
          chargeUnit={bodyA.chargeUnit}
          polarity={bodyA.polarity}
          onChargeChange={onChargeChange}
          onChargeUnitChange={onChargeUnitChange}
          onPolarityChange={onPolarityChange}
        />
        <ChargeInput
          label="Charge B (q₂)"
          bodyId="B"
          charge={bodyB.charge}
          chargeUnit={bodyB.chargeUnit}
          polarity={bodyB.polarity}
          onChargeChange={onChargeChange}
          onChargeUnitChange={onChargeUnitChange}
          onPolarityChange={onPolarityChange}
        />
      </div>

      {/* Distance */}
      <div className="output-section">
        <h3 className="output-section-title">Distance (दूरी)</h3>
        <div className="output-charge-input-row">
          <input
            type="number"
            className="output-input"
            value={distance}
            min={0.001}
            step={0.01}
            onChange={(e) =>
              onDistanceChange(parseFloat(e.target.value) || 0.001)
            }
          />
          <select
            className="output-select"
            value={distanceUnit}
            onChange={(e) =>
              onDistanceUnitChange(e.target.value as DistanceUnit)
            }
          >
            {distanceUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        {/* Distance slider */}
        <input
          type="range"
          className="output-slider"
          min={0.01}
          max={distanceUnit === "m" ? 5 : distanceUnit === "cm" ? 500 : 5000}
          step={distanceUnit === "m" ? 0.01 : 1}
          value={distance}
          onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
        />
      </div>

      {/* Formula & Result */}
      <div className="output-section">
        <h3 className="output-section-title">Calculation (गणना)</h3>
        <FormulaDisplay
          q1={bodyA.charge}
          q1Unit={bodyA.chargeUnit}
          q2={bodyB.charge}
          q2Unit={bodyB.chargeUnit}
          r={distance}
          rUnit={distanceUnit}
          force={force}
          forceType={forceType}
        />
      </div>

      {/* Reset */}
      <button className="output-reset-btn" onClick={onReset}>
        Reset Simulation
      </button>
    </div>
  );
}
