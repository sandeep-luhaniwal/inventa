"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

interface ElectricFieldCalculationPopupProps {
  chargeMicroC: number;
  radiusM: number;
  distanceM: number;
  electricField: number;
  sphereType: "Conducting" | "Non-Conducting";
  region: "inside" | "surface/outside";
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCharge = (value: number) => `${value > 0 ? "+" : ""}${value} uC`;

const formatField = (value: number) => {
  if (!Number.isFinite(value)) return "inf N/C";
  if (value === 0) return "0 N/C";
  if (Math.abs(value) >= 1e6) return `${value.toExponential(2)} N/C`;
  return `${value.toFixed(2)} N/C`;
};

const ElectricFieldCalculationPopup: React.FC<ElectricFieldCalculationPopupProps> = ({
  chargeMicroC,
  radiusM,
  distanceM,
  electricField,
  sphereType,
  region,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isConducting = sphereType === "Conducting";
  const formula = isConducting && region === "inside"
    ? "E = 0"
    : !isConducting && region === "inside"
      ? "E = k q r / R^3"
      : "E = k q / r^2";

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || !popupRef.current) return;

      const width = popupRef.current.offsetWidth;
      const height = popupRef.current.offsetHeight;
      const maxX = Math.max(window.innerWidth - width - 16, 16);
      const maxY = Math.max(window.innerHeight - height - 16, 16);

      setPosition({
        x: clamp(event.clientX - dragOffset.x, 16, maxX),
        y: clamp(event.clientY - dragOffset.y, 16, maxY),
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
      className="fixed z-[120] w-[282px] overflow-hidden rounded-2xl border border-[#164e63] bg-[linear-gradient(180deg,rgba(15,40,59,0.98)_0%,rgba(8,24,38,0.98)_100%)] text-white shadow-[0_18px_40px_rgba(4,10,30,0.36)] backdrop-blur-md select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div onPointerDown={handlePointerDown} className="cursor-move px-4 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
          <GripVertical size={13} className="text-cyan-300" />
          <span className="text-cyan-300">Electric Field</span>
          <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.75)]" />
          <span className="normal-case tracking-normal text-amber-200">{region}</span>
        </div>
        <div className="mt-3 h-px bg-white/10" />
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-center gap-2 text-[20px] font-semibold tracking-tight">
          <span>E</span>
          <span className="text-slate-500 text-[18px]">=</span>
          <span className="text-[14px] text-cyan-200">{formula}</span>
        </div>

        <div className="mt-3 rounded-lg border border-cyan-900/70 bg-[#082f49]/70 px-3 py-2 text-[10px] leading-4 text-slate-200">
          <div className="font-bold text-cyan-200">Working</div>
          <div>Type = {sphereType === "Conducting" ? "Conducting / Hollow" : "Non-Conducting / Solid"}</div>
          <div>q = {formatCharge(chargeMicroC)}</div>
          <div>R = {radiusM.toFixed(3)} m</div>
          <div>r = {distanceM.toFixed(3)} m</div>
          <div className="mt-1 border-t border-white/10 pt-1 text-cyan-100">{formula}</div>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-900 bg-[rgba(8,47,73,0.78)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-tight text-slate-300">Result</span>
            <span className="text-[15px] font-bold text-white">{formatField(electricField)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricFieldCalculationPopup;
