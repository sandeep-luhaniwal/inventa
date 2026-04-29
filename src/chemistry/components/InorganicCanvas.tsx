"use client";

import React, { useMemo, useRef, useState } from "react";
import type { PlacedInorganicItem } from "@/chemistry/types";
import { BeakerAsset, BurnerAsset, StandAsset } from "./LabAssets";

interface InorganicCanvasProps {
  items: PlacedInorganicItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCombine: (sourceId: string, targetId: string) => void;
  onDrop: (itemId: string, x: number, y: number) => void;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function InorganicCanvas({
  items,
  selectedId,
  onSelect,
  onMove,
  onCombine,
  onDrop,
}: InorganicCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const nextX = clamp(event.clientX - rect.left - dragState.offsetX, 18, rect.width - 150);
    const nextY = clamp(event.clientY - rect.top - dragState.offsetY, 18, rect.height - 142);

    onMove(dragState.id, nextX, nextY);
  };

  const handlePointerUp = () => {
    if (!dragState) return;

    // Check for overlap with other items (glassware)
    const draggedItem = items.find((i) => i.instanceId === dragState.id);
    if (draggedItem) {
      const target = items.find(
        (i) =>
          i.instanceId !== dragState.id &&
          i.state === "glassware" &&
          Math.abs(i.x - draggedItem.x) < 60 &&
          Math.abs(i.y - draggedItem.y) < 60
      );

      if (target && draggedItem.state !== "glassware") {
        onCombine(dragState.id, target.instanceId);
      }
    }

    setDragState(null);
  };

  const isBoiling = useMemo(() => {
    // A vessel boils if it's near a stand and a burner is lit below
    const stands = items.filter((i) => i.id === "tripod");
    const burners = items.filter((i) => i.id === "burner");
    const vessels = items.filter((i) => i.state === "glassware");

    return vessels.reduce<Record<string, boolean>>((acc, v) => {
      const onStand = stands.some((s) => Math.abs(s.x - v.x) < 40 && Math.abs(s.y - v.y) < 50);
      const heatedByBurner = burners.some((b) => Math.abs(b.x - v.x) < 60 && b.y > v.y && b.y - v.y < 150);
      acc[v.instanceId] = onStand && heatedByBurner;
      return acc;
    }, {});
  }, [items]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("application/chemistry-item");
    if (!itemId || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left - 66, 18, rect.width - 150);
    const y = clamp(event.clientY - rect.top - 71, 18, rect.height - 142);

    onDrop(itemId, x, y);
  };

  return (
    <div
      ref={surfaceRef}
      className="relative h-full min-h-0 overflow-hidden bg-[#3a3f47]"
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onSelect(null);
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:42px_42px]" />

      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-[680px] rounded-[28px] border border-dashed border-white/10 bg-black/8 px-6 py-8 text-center backdrop-blur lg:max-w-xl lg:rounded-[32px] lg:px-8 lg:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Workspace ready</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white/92 lg:text-3xl">Start an inorganic experiment</h3>
            <p className="mt-4 text-sm leading-7 text-white/55 lg:text-base">
              Add glassware, devices and reagents from the left library. You can drag every item around the bench and
              use the inspector to duplicate or remove the selected piece.
            </p>
          </div>
        </div>
      )}

      {items.map((item) => {
        const active = selectedId === item.instanceId;
        const boiling = isBoiling[item.instanceId];
        
        return (
          <div
            key={item.instanceId}
            onMouseDown={(event) => {
              event.stopPropagation();
              onSelect(item.instanceId);

              const rect = surfaceRef.current?.getBoundingClientRect();
              if (!rect) return;

              setDragState({
                id: item.instanceId,
                offsetX: event.clientX - rect.left - item.x,
                offsetY: event.clientY - rect.top - item.y,
              });
            }}
            className={`absolute cursor-grab active:cursor-grabbing transition-transform ${
              active ? "z-50 scale-105" : "z-10"
            }`}
            style={{ left: item.x, top: item.y }}
          >
            {/* High Fidelity Asset Rendering */}
            <div className="relative pointer-events-none select-none">
              {item.id === "beaker-250" || item.id === "erlenmeyer-250" ? (
                <BeakerAsset 
                  boiling={boiling} 
                  color={item.accent} 
                  level={item.contents && item.contents.length > 0 ? 40 + item.contents.length * 10 : 0} 
                />
              ) : item.id === "burner" ? (
                <BurnerAsset lit={true} />
              ) : item.id === "tripod" ? (
                <StandAsset />
              ) : (
                /* Fallback for other items */
                <div
                  className={`w-32 rounded-[28px] border px-4 py-4 shadow-xl transition ${
                    active
                      ? "border-[#2990ff] bg-[#262c32] text-white shadow-[0_12px_36px_rgba(41,144,255,0.22)]"
                      : "border-white/6 bg-[#323840] text-white shadow-black/20"
                  }`}
                >
                  <div
                    className="inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                      color: active ? "#e0f2fe" : item.accent,
                      borderColor: active ? "rgba(255,255,255,0.22)" : `${item.accent}33`,
                      backgroundColor: active ? "rgba(255,255,255,0.08)" : `${item.accent}14`,
                    }}
                  >
                    {item.symbol}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold leading-5 text-white">{item.name}</h3>
                </div>
              )}

              {/* Selection Indicator */}
              {active && (
                <div className="absolute -inset-2 rounded-3xl border-2 border-[#2990ff]/50 animate-pulse pointer-events-none" />
              )}

              {/* Contents Label (only for vessels) */}
              {item.state === "glassware" && item.contents && item.contents.length > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
                  {item.contents.map((c, i) => (
                    <span key={i} className="text-[10px] font-bold" style={{ color: c.accent }}>{c.symbol}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
