"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChargeUnit, DistanceUnit, Polarity } from "../../types/physics";

interface CalculationPopupProps {
  force: number;
  forceFormatted: string;
  forceType: "attraction" | "repulsion" | "none";
  q1: number;
  q1Unit: ChargeUnit;
  pol1: Polarity;
  q2: number;
  q2Unit: ChargeUnit;
  pol2: Polarity;
  initialPos?: { x: number; y: number };
}

export default function CalculationPopup({
  force,
  forceFormatted,
  forceType,
  q1,
  q1Unit,
  pol1,
  q2,
  q2Unit,
  pol2,
  initialPos = { x: 40, y: 40 },
}: CalculationPopupProps) {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPos({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const typeColor =
    forceType === "attraction"
      ? "#22d3ee"
      : forceType === "repulsion"
      ? "#f87171"
      : "#94a3b8";

  const typeLabel =
    forceType === "attraction"
      ? "Attraction"
      : forceType === "repulsion"
      ? "Repulsion"
      : "None";

  return (
    <div
      className="absolute z-50 select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="w-[300px] bg-[#0b0f1a] border border-[#1e293b] rounded-[24px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[80px] pointer-events-none" />
        
        {/* Header */}
        <div 
          className="flex items-center gap-3 mb-4 cursor-move"
          onMouseDown={handleMouseDown}
        >
          {/* Drag Handle Icon (6 dots) */}
          <div className="grid grid-cols-2 gap-1 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[3px] h-[3px] rounded-full bg-indigo-400" />
            ))}
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <h3 className="text-[11px] font-bold tracking-[0.1em] text-[#38bdf8] uppercase">
              CALCULATION (गणना)
            </h3>
            <span className="w-1 h-1 rounded-full bg-[#38bdf8]" />
            <span className="text-[11px] font-bold text-[#38bdf8] capitalize">
              {typeLabel}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#1e293b] mb-6" />

        {/* Formula Section */}
        <div className="flex flex-col items-center justify-center py-2 mb-6">
          <div className="flex items-center gap-3 text-[24px] font-medium font-mono">
            <span className="text-white">F</span>
            <span className="text-[#475569]">=</span>
            <span className="text-[#818cf8]">k</span>
            <span className="text-[#475569] text-sm">×</span>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 pb-1">
                <span className="text-[#f472b6] font-bold text-lg">q₁</span>
                <span className="text-[#475569] text-[10px]">×</span>
                <span className="text-[#38bdf8] font-bold text-lg">q₂</span>
              </div>
              <div className="w-full h-[1px] bg-[#475569]" />
              <div className="pt-1">
                <span className="text-[#34d399] font-bold text-base">r²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Force Result Box */}
        <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold tracking-widest text-[#475569] uppercase">
            FORCE
          </span>
          <span className="text-xl font-bold text-white font-mono tracking-tight">
            {forceFormatted}
          </span>
        </div>

        {/* Bottom Detail Boxes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[9px] font-bold tracking-wider text-[#f472b6] uppercase">
              CHARGE A
            </span>
            <span className="text-sm font-bold text-white">
              {pol1 === "positive" ? "+" : "-"}{q1} {q1Unit}
            </span>
          </div>
          <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[9px] font-bold tracking-wider text-[#38bdf8] uppercase">
              CHARGE B
            </span>
            <span className="text-sm font-bold text-white">
              {pol2 === "positive" ? "+" : "-"}{q2} {q2Unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
