"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

interface ElectricFluxCalculationPopupProps {
  chargeMicroC: number;
  electricField: number;
  area: number;
  angle: number;
  flux: number;
  surfaceType: "Triangular" | "Disc" | "Cylindrical" | "Spherical";
  closedSurface: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatValue = (value: number, unit: string) => {
  if (!Number.isFinite(value)) return `inf ${unit}`;
  if (value === 0) return `0 ${unit}`;
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.01) return `${value.toExponential(2)} ${unit}`;
  return `${value.toFixed(2)} ${unit}`;
};

const ElectricFluxCalculationPopup: React.FC<ElectricFluxCalculationPopupProps> = ({
  chargeMicroC,
  electricField,
  area,
  angle,
  flux,
  surfaceType,
  closedSurface,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const formula = closedSurface ? "Φ = q / ε0" : "Φ = E * A * cos(θ)";

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
      className="fixed z-[120] w-[292px] overflow-hidden rounded-2xl border border-[#155e75] bg-[linear-gradient(180deg,rgba(12,45,60,0.98)_0%,rgba(8,24,38,0.98)_100%)] text-white shadow-[0_18px_40px_rgba(4,10,30,0.36)] backdrop-blur-md select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div onPointerDown={handlePointerDown} className="cursor-move px-4 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
          <GripVertical size={13} className="text-cyan-300" />
          <span className="text-cyan-300">Electric Flux</span>
          <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.75)]" />
          <span className="normal-case tracking-normal text-amber-200">{surfaceType}</span>
        </div>
        <div className="mt-3 h-px bg-white/10" />
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-center gap-2 text-[18px] font-semibold tracking-tight">
          <span className="text-2xl leading-none">Φ</span>
          <span className="text-slate-500">=</span>
          <span className="text-[13px] text-cyan-200">{closedSurface ? "q / ε0" : "E * A * cos(θ)"}</span>
        </div>

        <div className="mt-3 rounded-lg border border-cyan-900/70 bg-[#082f49]/70 px-3 py-2 text-[10px] leading-4 text-slate-200">
          <div className="font-bold text-cyan-200">Working</div>
          <div>q = {chargeMicroC > 0 ? "+" : ""}{chargeMicroC} uC</div>
          <div>E = {formatValue(electricField, "N/C")}</div>
          <div>A = {area.toFixed(2)} m2</div>
          <div>θ = {angle.toFixed(0)} deg</div>
          <div className="mt-1 border-t border-white/10 pt-1 text-cyan-100">{formula}</div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-900 bg-[rgba(8,47,73,0.78)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-tight text-slate-300">Flux (Φ)</span>
            <span className="text-[15px] font-bold text-white">{formatValue(flux, "N m2/C")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricFluxCalculationPopup;
