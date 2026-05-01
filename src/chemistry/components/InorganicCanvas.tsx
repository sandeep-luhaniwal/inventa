"use client";

import React, { useMemo, useRef, useState } from "react";
import type { PlacedInorganicItem } from "@/chemistry/types";
import {
  BurnerAsset,
  DropperAsset,
  ForcepsAsset,
  GauzeAsset,
  GlassBottleAsset,
  GlassConduitAsset,
  MatchAsset,
  MatchboxAsset,
  MeasureBottleAsset,
  RoundBottomFlaskAsset,
  RubberStopperAsset,
  SeparatoryFunnelAsset,
  SpatulaAsset,
  SparkEffect,
  StandAsset,
  TestTubeAsset,
} from "./LabAssets";

interface InorganicCanvasProps {
  items: PlacedInorganicItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCombine: (sourceId: string, targetId: string) => void;
  onDrop: (itemId: string, x: number, y: number) => void;
  onUpdate: (id: string, updates: Partial<PlacedInorganicItem>) => void;
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
  const [sparkPos, setSparkPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    let nextX = clamp(event.clientX - rect.left - dragState.offsetX, 18, rect.width - 150);
    let nextY = clamp(event.clientY - rect.top - dragState.offsetY, 18, rect.height - 142);

    // Smart Snapping Logic
    const draggedItem = items.find((i) => i.instanceId === dragState.id);
    if (draggedItem && draggedItem.state === "glassware") {
      // Snap to Tripods
      const tripod = items.find(
        (i) => i.id === "tripod" && Math.abs(i.x - nextX) < 40 && Math.abs(i.y - (nextY + 80)) < 40
      );
      if (tripod) {
        nextX = tripod.x - 12;
        nextY = tripod.y - 70;
      }

      // Snap to Ring Stands
      const stand = items.find(
        (i) => i.id === "tripod" && Math.abs(i.x - nextX) < 40 && Math.abs(i.y - (nextY + 100)) < 40
      );
      // ... more snapping points could be added
    } else if (draggedItem && draggedItem.id === "match") {
      // 1. Strike against Matchbox - More forgiving radius
      const matchbox = items.find(
        (i) => i.id === "matchbox" && Math.abs(i.x - nextX) < 110 && Math.abs(i.y - nextY) < 85
      );
      if (matchbox && !draggedItem.isLit) {
        onUpdate(draggedItem.instanceId, { isLit: true });
        setSparkPos({ x: nextX + 80, y: nextY + 50 });
        setTimeout(() => setSparkPos(null), 400);
        setTimeout(() => onUpdate(draggedItem.instanceId, { isLit: false }), 20000);
      }

      // 2. Ignite Burner if already lit
      if (draggedItem.isLit) {
        const burner = items.find(
          (i) => i.id === "burner" && !i.isLit && Math.abs(i.x - nextX) < 60 && Math.abs(i.y - nextY) < 60
        );
        if (burner) onUpdate(burner.instanceId, { isLit: true });
      }
    }

    onMove(dragState.id, nextX, nextY);
  };

  const handlePointerUp = () => {
    if (!dragState) return;
    
    // Check for overlap with other items (pouring/combining)
    const draggedItem = items.find((i) => i.instanceId === dragState.id);
    if (draggedItem && draggedItem.state === "glassware") {
      const target = items.find(
        (i) =>
          i.instanceId !== dragState.id &&
          i.state === "glassware" &&
          Math.abs(i.x - draggedItem.x) < 50 &&
          Math.abs(i.y - (draggedItem.y + 60)) < 40
      );

      if (target) {
        // Trigger Pouring Action
        onUpdate(draggedItem.instanceId, { rotation: 45 });
        setTimeout(() => {
          onCombine(draggedItem.instanceId, target.instanceId);
          onUpdate(draggedItem.instanceId, { rotation: 0 });
        }, 800);
      }
    } else if (draggedItem) {
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
        const isPouring = (item.rotation || 0) !== 0;
        
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
            onClick={(event) => {
              event.stopPropagation();
              onSelect(item.instanceId);
              
              // Interactive States
              if (item.id === "burner") {
                const burnerOpen = item.isOpen === true;
                if (!burnerOpen) {
                  onUpdate(item.instanceId, { isOpen: true });
                } else if (!item.isLit) {
                  onUpdate(item.instanceId, { isLit: true });
                } else {
                  onUpdate(item.instanceId, { isLit: false, isOpen: false });
                }
              } else if (item.id === "match") {
                onUpdate(item.instanceId, { isLit: !item.isLit });
                if (!item.isLit) {
                  setTimeout(() => onUpdate(item.instanceId, { isLit: false }), 15000);
                }
              } else if (item.id.includes("bottle") || item.id.includes("jar") || item.id === "rubber-stopper") {
                onUpdate(item.instanceId, { isOpen: !item.isOpen });
              }
            }}
            style={{ left: item.x, top: item.y, transform: `rotate(${item.rotation || 0}deg)` }}
          >
            {/* High Fidelity Asset Rendering */}
            <div className="relative select-none pointer-events-auto">
              {item.id === "round-bottom-flask" ? (
                <RoundBottomFlaskAsset />
              ) : item.id === "separatory-funnel" ? (
                <SeparatoryFunnelAsset />
              ) : item.id === "measure-bottle" ? (
                <MeasureBottleAsset isOpen={item.isOpen} />
              ) : item.id === "glass-bottle" ? (
                <GlassBottleAsset isOpen={item.isOpen} />
              ) : item.id === "test-tube" ? (
                <TestTubeAsset size="large" />
              ) : item.id === "test-tube-small" ? (
                <TestTubeAsset size="small" />
              ) : item.id === "test-tube-mini" ? (
                <TestTubeAsset size="mini" />
              ) : item.id === "burner" ? (
                <BurnerAsset lit={item.isLit} isOpen={item.isOpen} />
              ) : item.id === "tripod" ? (
                <StandAsset />
              ) : item.id === "match" ? (
                <MatchAsset lit={item.isLit} />
              ) : item.id === "matchbox" ? (
                <MatchboxAsset />
              ) : item.id === "dropper" ? (
                <DropperAsset />
              ) : item.id === "forceps" ? (
                <ForcepsAsset />
              ) : item.id === "gauze" ? (
                <GauzeAsset />
              ) : item.id === "spatula" ? (
                <SpatulaAsset />
              ) : item.id === "glass-conduit" ? (
                <GlassConduitAsset />
              ) : item.id === "rubber-stopper" ? (
                <RubberStopperAsset />
              ) : (
                /* Fallback for other items */
                <div
                  className={`w-32 rounded-[28px] border px-4 py-4 transition ${
                    active
                      ? "border-white/20 bg-[#323840] text-white"
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

              {/* Pouring Stream Effect */}
              {isPouring && (
                <div className="absolute top-[80px] left-[60px] w-1 h-20 bg-blue-400/40 blur-[1px] animate-pulse origin-top">
                  <div className="absolute inset-0 bg-white/20 w-px mx-auto" />
                </div>
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

      {/* Spark Burst Effect */}
      {sparkPos && (
        <div 
          className="absolute z-[100] pointer-events-none"
          style={{ left: sparkPos.x, top: sparkPos.y }}
        >
          <SparkEffect />
        </div>
      )}
    </div>
  );
}
