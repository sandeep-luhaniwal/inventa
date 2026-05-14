"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

interface CalculationPopupProps {
  q1: number;
  q2: number;
  distance: number;
  force: number;
  isRepulsive: boolean;
  sphereCount?: number;
  isSuperposition?: boolean;
  mediumName?: string;
  dielectric?: number;
  baseForce?: number;
  superpositionWorking?: {
    f1: number;
    f2: number;
    thetaDeg: number;
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatCharge = (value: number) => `${value > 0 ? "+" : ""}${value} uC`;

const formatForceValue = (value: number) => {
  if (!Number.isFinite(value)) return "inf";
  if (value === 0) return "0 N";
  if (Math.abs(value) < 1) return `${(value * 1000).toFixed(2)} mN`;
  return `${value.toExponential(2)} N`;
};

const CalculationPopup: React.FC<CalculationPopupProps> = ({
  q1,
  q2,
  distance,
  force,
  isRepulsive,
  sphereCount = 2,
  isSuperposition = false,
  mediumName = "Vacuum",
  dielectric = 1,
  baseForce,
  superpositionWorking,
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
      const maxX = Math.max(window.innerWidth - width - 16, 16);
      const maxY = Math.max(window.innerHeight - height - 16, 16);

      setPosition({
        x: clamp(event.clientX - dragOffset.x, 16, maxX),
        y: clamp(event.clientY - dragOffset.y, 16, maxY),
      });
    };

    const handlePointerUp = () => {
      setDragging(false);
    };

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
    setDragOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setDragging(true);
  };

  const displayForce = formatForceValue(force);
  const relationLabel = isSuperposition ? "Resultant" : isRepulsive ? "Repulsion" : "Attraction";
  const relationTone = isSuperposition ? "text-violet-300" : isRepulsive ? "text-rose-300" : "text-cyan-300";
  const relationDot = isSuperposition
    ? "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.75)]"
    : isRepulsive
      ? "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.75)]"
      : "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.75)]";

  return (
    <div
      ref={popupRef}
      className="fixed z-[120] w-[282px] overflow-hidden rounded-2xl border border-[#24356d] bg-[linear-gradient(180deg,rgba(15,25,59,0.98)_0%,rgba(10,18,44,0.98)_100%)] text-white shadow-[0_18px_40px_rgba(4,10,30,0.36)] backdrop-blur-md select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div onPointerDown={handlePointerDown} className="cursor-move px-4 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">
          <GripVertical size={13} className="text-[#7c89d8]" />
          <span className="text-[#7f8cff]">Calculation</span>
          <span className={`h-2 w-2 rounded-full ${relationDot}`} />
          <span className={`normal-case tracking-normal ${relationTone}`}>{relationLabel}</span>
        </div>
        <div className="mt-3 h-px bg-white/10" />
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-[20px] font-semibold tracking-tight">
            <span className="text-white">{isSuperposition ? "FR" : "F"}</span>
            <span className="text-slate-500 text-[18px]">=</span>
            {isSuperposition ? (
              <span className="text-[12px] text-[#a78bfa]">sqrt(F1^2 + F2^2 + 2F1F2cos theta)</span>
            ) : (
              <>
                <span className="text-[#8790ff]">k</span>
                <span className="text-slate-500 text-sm">x</span>
                <div className="flex flex-col items-center leading-none">
                  <div className="flex items-center gap-1 text-[13px]">
                    <span className="text-pink-300">q1</span>
                    <span className="text-slate-500 text-xs">x</span>
                    <span className="text-sky-300">q2</span>
                  </div>
                  <div className="mt-1 h-[2px] w-full bg-[#4b5aa5]" />
                  <span className="mt-1 text-[14px] text-emerald-300">r^2</span>
                </div>
              </>
            )}
          </div>
        </div>

        {isSuperposition && superpositionWorking && (
          <div className="mt-3 rounded-lg border border-[#3b2f70] bg-[#111936]/80 px-3 py-2 text-[10px] leading-4 text-slate-200">
            <div className="font-bold text-violet-300">Working</div>
            <div>F1 = {formatForceValue(superpositionWorking.f1)}</div>
            <div>F2 = {formatForceValue(superpositionWorking.f2)}</div>
            <div>theta = {superpositionWorking.thetaDeg.toFixed(1)} deg</div>
            <div className="mt-1 border-t border-white/10 pt-1 text-violet-200">
              FR = sqrt(F1^2 + F2^2 + 2F1F2cos theta)
            </div>
          </div>
        )}

        {!isSuperposition && (
          <div className="mt-3 rounded-lg border border-[#3b2f70] bg-[#111936]/80 px-3 py-2 text-[10px] leading-4 text-slate-200">
            <div className="font-bold text-violet-300">Medium Working</div>
            <div>Medium = {mediumName}</div>
            <div>K = {Number.isFinite(dielectric) ? dielectric : "inf"}</div>
            <div className="mt-1 border-t border-white/10 pt-1 text-violet-200">
              F = F0 / K = {formatForceValue(baseForce ?? force)} / {Number.isFinite(dielectric) ? dielectric : "inf"}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[#23326c] bg-[rgba(15,22,53,0.88)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-tight text-slate-300">
              {isSuperposition ? "Resultant" : "Force"}
            </span>
            <span className="text-[15px] font-bold text-white">{displayForce}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#23326c] bg-[rgba(15,22,53,0.78)] px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-tight text-pink-400">
              {isSuperposition ? "Target" : "Charge A"}
            </div>
            <div className="mt-1 text-[12px] font-medium text-slate-100">{formatCharge(q1)}</div>
          </div>
          <div className="rounded-lg border border-[#23326c] bg-[rgba(15,22,53,0.78)] px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-tight text-sky-400">
              {isSuperposition ? "Other Total" : "Charge B"}
            </div>
            <div className="mt-1 text-[12px] font-medium text-slate-100">{formatCharge(q2)}</div>
          </div>
        </div>

        {!isSuperposition && (
          <div className="mt-3 rounded-lg border border-[#23326c] bg-[rgba(15,22,53,0.62)] px-3 py-2">
            <div className="relative h-7">
              <div className="absolute left-2 right-2 top-1/2 h-px -translate-y-1/2 bg-slate-500" />
              <div className="absolute left-2 top-1/2 h-3 w-px -translate-y-1/2 bg-slate-400" />
              <div className="absolute right-2 top-1/2 h-3 w-px -translate-y-1/2 bg-slate-400" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                <span className="rounded-md border border-[#334155] bg-[#111936] px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                  r = {distance.toFixed(1)} cm
                </span>
              </div>
            </div>
          </div>
        )}

        {sphereCount > 2 && (
          <div className="mt-2 rounded-md border border-[#334155] bg-[#0f172a]/70 px-2 py-1.5 text-[10px] leading-4 text-slate-300">
            Superposition: calculate pairwise forces on the target sphere, then add vectors.
          </div>
        )}

        <div className="mt-2 text-center text-[10px] text-slate-500">
          {isSuperposition ? "Showing net force on selected/first sphere" : "Showing pair A-B"}
        </div>
      </div>
    </div>
  );
};

export default CalculationPopup;
