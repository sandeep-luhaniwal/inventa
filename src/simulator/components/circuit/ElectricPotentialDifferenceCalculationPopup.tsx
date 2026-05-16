"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

interface ElectricPotentialDifferenceCalculationPopupProps {
  chargeMicroC: number;
  distanceA: number;
  distanceB: number;
  potentialA: number;
  potentialB: number;
  deltaV: number;
  mediumName: string;
  dielectric: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatValue = (value: number, unit: string) => {
  if (!Number.isFinite(value)) return `inf ${unit}`;
  if (value === 0) return `0 ${unit}`;
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.01) return `${value.toExponential(2)} ${unit}`;
  return `${value.toFixed(2)} ${unit}`;
};

const ElectricPotentialDifferenceCalculationPopup: React.FC<ElectricPotentialDifferenceCalculationPopupProps> = ({
  chargeMicroC,
  distanceA,
  distanceB,
  potentialA,
  potentialB,
  deltaV,
  mediumName,
  dielectric,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
      className="fixed z-[120] w-[304px] overflow-hidden rounded-2xl border border-[#1e3a8a] bg-[linear-gradient(180deg,rgba(15,32,72,0.98)_0%,rgba(8,20,38,0.98)_100%)] text-white shadow-[0_18px_40px_rgba(4,10,30,0.36)] backdrop-blur-md select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div onPointerDown={handlePointerDown} className="cursor-move px-4 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
          <GripVertical size={13} className="text-cyan-300" />
          <span className="text-cyan-300">Potential Difference</span>
          <span className="h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.75)]" />
          <span className="normal-case tracking-normal text-rose-200">A to B</span>
        </div>
        <div className="mt-3 h-px bg-white/10" />
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-center gap-2 text-[18px] font-semibold tracking-tight">
          <span>ΔV</span>
          <span className="text-slate-500">=</span>
          <span className="text-[13px] text-cyan-200">VB - VA = WAB / q</span>
        </div>

        <div className="mt-3 rounded-lg border border-blue-900/70 bg-[#0f2a4a]/70 px-3 py-2 text-[10px] leading-4 text-slate-200">
          <div className="font-bold text-cyan-200">Working</div>
          <div>Q = {chargeMicroC > 0 ? "+" : ""}{chargeMicroC} uC</div>
          <div>Medium = {mediumName}, K = {Number.isFinite(dielectric) ? dielectric : "∞"}</div>
          <div>rA = {distanceA.toFixed(3)} m, VA = kQ / (K rA)</div>
          <div>rB = {distanceB.toFixed(3)} m, VB = kQ / (K rB)</div>
          <div className="mt-1 border-t border-white/10 pt-1 text-cyan-100">ΔV = VB - VA</div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-blue-900 bg-[rgba(15,42,74,0.78)] px-2 py-2">
              <div className="text-[10px] font-bold uppercase text-rose-200">Point A</div>
              <div className="text-[12px] font-bold">{formatValue(potentialA, "V")}</div>
            </div>
            <div className="rounded-lg border border-blue-900 bg-[rgba(15,42,74,0.78)] px-2 py-2">
              <div className="text-[10px] font-bold uppercase text-cyan-200">Point B</div>
              <div className="text-[12px] font-bold">{formatValue(potentialB, "V")}</div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-900 bg-[rgba(15,42,74,0.9)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-tight text-slate-300">ΔV</span>
              <span className="text-[15px] font-bold text-white">{formatValue(deltaV, "V")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricPotentialDifferenceCalculationPopup;
