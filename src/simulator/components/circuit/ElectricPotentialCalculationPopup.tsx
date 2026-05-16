"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

interface ElectricPotentialCalculationPopupProps {
  chargeMicroC: number;
  radiusM: number;
  distanceM: number;
  electricField: number;
  electricPotential: number;
  region: "inside" | "surface" | "outside";
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCharge = (value: number) => `${value > 0 ? "+" : ""}${value} uC`;

const formatValue = (value: number, unit: string) => {
  if (!Number.isFinite(value)) return `inf ${unit}`;
  if (value === 0) return `0 ${unit}`;
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.01) return `${value.toExponential(2)} ${unit}`;
  return `${value.toFixed(2)} ${unit}`;
};

const ElectricPotentialCalculationPopup: React.FC<ElectricPotentialCalculationPopupProps> = ({
  chargeMicroC,
  radiusM,
  distanceM,
  electricField,
  electricPotential,
  region,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const formula = region === "inside" ? "V = kQ / R" : "V = kQ / r";
  const fieldFormula = region === "inside" ? "E = 0" : "E = kQ / r^2";

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || !popupRef.current) return;
      const width = popupRef.current.offsetWidth;
      const height = popupRef.current.offsetHeight;
      setPosition({
        x: clamp(event.clientX - dragOffset.x, 16, Math.max(window.innerWidth - width - 16, 16)),
        y: clamp(event.clientY - dragOffset.y, 16, Math.max(window.innerHeight - height - 16, 16)),
      });
    };
    const handlePointerUp = () => setDragging(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragOffset.x, dragOffset.y, dragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!popupRef.current) return;
    const rect = popupRef.current.getBoundingClientRect();
    setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setDragging(true);
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-[120] w-[292px] overflow-hidden rounded-2xl border border-[#7c2d12] bg-[linear-gradient(180deg,rgba(67,20,7,0.98)_0%,rgba(30,15,8,0.98)_100%)] text-white shadow-[0_18px_40px_rgba(4,10,30,0.36)] backdrop-blur-md select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div onPointerDown={handlePointerDown} className="cursor-move px-4 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
          <GripVertical size={13} className="text-amber-300" />
          <span className="text-amber-300">Electric Potential</span>
          <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.75)]" />
          <span className="normal-case tracking-normal text-orange-200">{region}</span>
        </div>
        <div className="mt-3 h-px bg-white/10" />
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-center gap-2 text-[20px] font-semibold tracking-tight">
          <span>V</span>
          <span className="text-slate-500 text-[18px]">=</span>
          <span className="text-[14px] text-amber-200">{formula}</span>
        </div>

        <div className="mt-3 rounded-lg border border-orange-900/70 bg-[#431407]/70 px-3 py-2 text-[10px] leading-4 text-orange-50">
          <div className="font-bold text-amber-200">Working</div>
          <div>Q = {formatCharge(chargeMicroC)}</div>
          <div>R = {radiusM.toFixed(3)} m</div>
          <div>r = {distanceM.toFixed(3)} m</div>
          <div>{fieldFormula}</div>
          <div className="mt-1 border-t border-white/10 pt-1 text-amber-100">{formula}</div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="rounded-xl border border-orange-900 bg-[rgba(67,20,7,0.78)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-tight text-orange-100">Potential (V)</span>
              <span className="text-[15px] font-bold text-white">{formatValue(electricPotential, "V")}</span>
            </div>
          </div>
          <div className="rounded-xl border border-orange-900/70 bg-[rgba(67,20,7,0.45)] px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-tight text-orange-100">Field (E)</span>
              <span className="text-[13px] font-bold text-white">{formatValue(electricField, "N/C")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricPotentialCalculationPopup;
