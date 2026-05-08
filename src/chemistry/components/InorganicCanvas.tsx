"use client";

import React, { useMemo, useRef, useState } from "react";
import type { PlacedInorganicItem } from "@/chemistry/types";
import {
  BurnerAsset,
  ChemicalContainerAsset,
  ClayNetAsset,
  DropperAsset,
  ForcepsAsset,
  GasJarAsset,
  GauzeAsset,
  GlassBottleAsset,
  GlassConduitAsset,
  MatchAsset,
  MatchboxAsset,
  MeasureBottleAsset,
  RoundBottomFlaskAsset,
  RubberStopperAsset,
  RetortStandAsset,
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
  onDrop: (itemId: string, x: number, y: number, overrides?: Partial<PlacedInorganicItem>) => void;
  onUpdate: (id: string, updates: Partial<PlacedInorganicItem>) => void;
  onRemove: (id: string) => void;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
}

type DispenseMode = "solid" | "liquid" | "gas";

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
  onUpdate,
  onRemove,
}: InorganicCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [sparkPos, setSparkPos] = useState<{ x: number; y: number } | null>(null);
  const [dispensing, setDispensing] = useState<Record<string, DispenseMode>>({});
  const removalTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const actionTimers = useRef<Record<string, NodeJS.Timeout[]>>({});

  const queueItemTimer = (id: string, callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      callback();
      actionTimers.current[id] = (actionTimers.current[id] ?? []).filter((entry) => entry !== timer);
    }, delay);

    actionTimers.current[id] = [...(actionTimers.current[id] ?? []), timer];
  };

  const flashSpark = (x: number, y: number, duration = 420) => {
    setSparkPos({ x, y });
    setTimeout(() => setSparkPos(null), duration);
  };

  const igniteBurner = (burnerId: string, x: number, y: number) => {
    onUpdate(burnerId, { isOpen: true, isLit: true });
    flashSpark(x, y, 500);
  };

  const strikeMatchbox = (item: PlacedInorganicItem) => {
    if (item.isStriking) return;

    onUpdate(item.instanceId, {
      isStriking: true,
      isLit: false,
      showStick: true,
    });
    flashSpark(item.x + 138, item.y + 102, 360);

    queueItemTimer(item.instanceId, () => {
      onUpdate(item.instanceId, { isLit: true });
    }, 90);

    queueItemTimer(item.instanceId, () => {
      onUpdate(item.instanceId, {
        showStick: false,
        isLit: false,
      });
      onDrop("match", item.x + 126, item.y + 56, {
        rotation: 10,
      });
    }, 180);

    queueItemTimer(item.instanceId, () => {
      onUpdate(item.instanceId, {
        showStick: true,
        isStriking: false,
        isLit: false,
      });
    }, 1150);
  };

  // Watch for lit matches and start their burn-out timer
  React.useEffect(() => {
    items.forEach((item) => {
      if (item.id === "match" && item.isLit && !removalTimers.current[item.instanceId]) {
        removalTimers.current[item.instanceId] = setTimeout(() => {
          onRemove(item.instanceId);
          delete removalTimers.current[item.instanceId];
        }, 12000);
      }
    });

    // Cleanup: handle items being manually deleted
    const itemIds = new Set(items.map(i => i.instanceId));
    Object.keys(removalTimers.current).forEach(id => {
      if (!itemIds.has(id)) {
        clearTimeout(removalTimers.current[id]);
        delete removalTimers.current[id];
      }
    });

    Object.keys(actionTimers.current).forEach((id) => {
      if (!itemIds.has(id)) {
        actionTimers.current[id].forEach(clearTimeout);
        delete actionTimers.current[id];
      }
    });
  }, [items, onRemove]);

  React.useEffect(() => {
    const removalTimerEntries = removalTimers.current;
    const actionTimerEntries = actionTimers.current;

    return () => {
      Object.values(removalTimerEntries).forEach(clearTimeout);
      Object.values(actionTimerEntries).flat().forEach(clearTimeout);
    };
  }, []);

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    let nextX = clamp(event.clientX - rect.left - dragState.offsetX, 18, rect.width - 150);
    let nextY = clamp(event.clientY - rect.top - dragState.offsetY, 18, rect.height - 142);

    // Smart Snapping Logic
    const draggedItem = items.find((i) => i.instanceId === dragState.id);
    if (draggedItem && draggedItem.state === "glassware") {
      const burner = items.find(
        (i) => i.id === "burner" && Math.abs(i.x - nextX) < 62 && Math.abs(i.y - (nextY + 104)) < 78
      );
      if (burner) {
        nextX = burner.x - 2;
        nextY = burner.y - 110;
      }
    } else if (draggedItem && (draggedItem.id === "matchbox" || draggedItem.id === "match")) {
      const burner = items.find(
        (i) => i.id === "burner" && !i.isLit && Math.abs(i.x - nextX) < 92 && Math.abs(i.y - nextY) < 82
      );

      const canIgnite =
        draggedItem.id === "match"
          ? draggedItem.isLit
          : draggedItem.isStriking || draggedItem.isLit;

      if (burner && canIgnite) {
        igniteBurner(burner.instanceId, burner.x + 70, burner.y + 34);
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
          Math.abs(i.x - draggedItem.x) < 86 &&
          Math.abs(i.y - draggedItem.y) < 86
      );

      if (target && draggedItem.state !== "glassware") {
        const mode = draggedItem.state === "gas" ? "gas" : draggedItem.state === "solid" ? "solid" : "liquid";
        setDispensing((current) => ({ ...current, [draggedItem.instanceId]: mode }));
        onUpdate(draggedItem.instanceId, { rotation: mode === "gas" ? -18 : -42 });
        setTimeout(() => {
          onCombine(dragState.id, target.instanceId);
          setDispensing((current) => {
            const next = { ...current };
            delete next[draggedItem.instanceId];
            return next;
          });
        }, 720);
      }
    }

    setDragState(null);
  };

  const vesselHeat = useMemo(() => {
    const burners = items.filter((i) => i.id === "burner");
    const vessels = items.filter((i) => i.state === "glassware");

    return vessels.reduce<Record<string, boolean>>((acc, v) => {
      const heatedByBurner = burners.some(
        (b) => b.isLit && b.isOpen && Math.abs(b.x - v.x) < 76 && b.y > v.y && b.y - v.y < 170
      );
      acc[v.instanceId] = heatedByBurner;
      return acc;
    }, {});
  }, [items]);

  const getLiveReactionState = (item: PlacedInorganicItem) => {
    const ids = new Set((item.contents ?? []).map((content) => content.id));
    if (item.reactionState === "burst" || (ids.has("sodium") && ids.has("water"))) return "burst";
    if (item.reactionState === "precipitate" || (ids.has("iron") && ids.has("cuso4-solution"))) return "precipitate";
    if (ids.has("co2")) return "gas";
    if (vesselHeat[item.instanceId] && ids.has("cuo")) return "reduction";
    if (vesselHeat[item.instanceId] && (item.contents?.length ?? 0) > 0) return "boiling";
    if (vesselHeat[item.instanceId]) return "heating";
    return item.reactionState ?? "idle";
  };

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
        const reactionState = item.state === "glassware" ? getLiveReactionState(item) : "idle";
        const isPouring = (item.rotation || 0) !== 0;
        const dispenseMode = dispensing[item.instanceId];
        
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
              } else if (item.id === "matchbox") {
                if (item.showStick !== false && !item.isStriking) {
                  strikeMatchbox(item);
                }
              } else if (item.id === "match") {
                if (!item.isLit) {
                  onUpdate(item.instanceId, { isLit: true });
                  flashSpark(item.x + 58, item.y + 42, 280);
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
              ) : item.id === "gas-jar" ? (
                <GasJarAsset isOpen={item.isOpen} />
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
                <MatchboxAsset
                  lit={item.isLit}
                  showStick={item.showStick !== false}
                  isStriking={item.isStriking === true}
                />
              ) : item.id === "dropper" ? (
                <DropperAsset />
              ) : item.id === "forceps" ? (
                <ForcepsAsset />
              ) : item.id === "clay-net" ? (
                <ClayNetAsset />
              ) : item.id === "retort-stand" ? (
                <RetortStandAsset />
              ) : item.id === "gauze" ? (
                <GauzeAsset />
              ) : item.id === "spatula" ? (
                <SpatulaAsset />
              ) : item.id === "glass-conduit" ? (
                <GlassConduitAsset />
              ) : item.id === "rubber-stopper" ? (
                <RubberStopperAsset />
              ) : item.state === "solid" || item.state === "liquid" || item.state === "gas" ? (
                <ChemicalContainerAsset
                  state={item.state}
                  label={item.name}
                  symbol={item.symbol}
                  accent={item.accent}
                />
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
                <DispenseEffect mode={dispenseMode ?? "liquid"} color={item.accent} />
              )}

              {item.state === "glassware" && (
                <VesselContents item={item} heated={vesselHeat[item.instanceId]} reactionState={reactionState} />
              )}

              {/* Contents Label (only for vessels) */}
              {item.state === "glassware" && item.contents && item.contents.length > 0 && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex max-w-56 items-center gap-1 bg-black/45 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 shadow-lg">
                  {item.contents.map((c, i) => (
                    <span key={i} className="text-[10px] font-bold" style={{ color: c.accent }}>{c.symbol}</span>
                  ))}
                </div>
              )}
              {item.note && (
                <div className="absolute left-1/2 top-full mt-1 w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-black/55 px-2 py-1 text-center text-[10px] leading-4 text-white/80 shadow-lg">
                  {item.note}
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

function mixContentColor(contents: PlacedInorganicItem["contents"]) {
  const liquid = contents?.find((item) => item.state === "liquid");
  const gas = contents?.find((item) => item.state === "gas");
  const solid = contents?.find((item) => item.state === "solid");
  return liquid?.accent ?? gas?.accent ?? solid?.accent ?? "#67e8f9";
}

function DispenseEffect({ mode, color }: { mode: DispenseMode; color: string }) {
  if (mode === "gas") {
    return (
      <div className="pointer-events-none absolute left-[86px] top-[44px] h-20 w-28 chemistry-gas-transfer">
        <span style={{ backgroundColor: color }} />
        <span style={{ backgroundColor: color }} />
        <span style={{ backgroundColor: color }} />
      </div>
    );
  }

  if (mode === "solid") {
    return (
      <div className="pointer-events-none absolute left-[76px] top-[70px] h-24 w-20 chemistry-solid-transfer">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <span
            key={index}
            style={{
              backgroundColor: color,
              left: 8 + (index % 4) * 10,
              animationDelay: `${index * 0.06}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute left-[82px] top-[58px] h-28 w-2 origin-top chemistry-liquid-transfer"
      style={{
        background: `linear-gradient(180deg, ${color}, ${color}55, transparent)`,
        boxShadow: `0 0 12px ${color}99`,
      }}
    >
      <div className="mx-auto h-full w-px bg-white/35" />
    </div>
  );
}

function VesselContents({
  item,
  heated,
  reactionState,
}: {
  item: PlacedInorganicItem;
  heated?: boolean;
  reactionState: NonNullable<PlacedInorganicItem["reactionState"]>;
}) {
  const contents = item.contents ?? [];
  if (contents.length === 0 && !heated) return null;

  const color = mixContentColor(contents);
  const hasLiquid = contents.some((content) => content.state === "liquid");
  const solids = contents.filter((content) => content.state === "solid");
  const hasGas = contents.some((content) => content.state === "gas");
  const shape =
    item.id === "test-tube"
      ? "left-[73px] top-[94px] h-[50px] w-[30px] rounded-b-[18px]"
      : item.id === "gas-jar"
        ? "left-[62px] top-[70px] h-[72px] w-[48px] rounded-b-[18px]"
        : item.id === "separatory-funnel"
          ? "left-[57px] top-[56px] h-[42px] w-[60px] rounded-full"
          : "left-[52px] top-[102px] h-[42px] w-[72px] rounded-b-full";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {hasLiquid && (
        <div
          className={`absolute ${shape} opacity-75 mix-blend-screen`}
          style={{
            background: `linear-gradient(180deg, ${color}88, ${color}dd)`,
            boxShadow: `0 0 22px ${color}40 inset, 0 0 18px ${color}22`,
          }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-[86%] -translate-x-1/2 rounded-full bg-white/35" />
        </div>
      )}

      {solids.map((solid, index) => (
        <div
          key={`${solid.id}-${index}`}
          className="absolute h-2.5 w-2.5 rounded-full shadow-sm"
          style={{
            left: 69 + (index % 5) * 9,
            top: item.id === "test-tube" ? 128 - Math.floor(index / 5) * 7 : 132 - Math.floor(index / 5) * 8,
            background: solid.accent,
            boxShadow: `0 0 8px ${solid.accent}70`,
          }}
        />
      ))}

      {(hasGas || reactionState === "gas") && (
        <div className="absolute left-[54px] top-[36px] h-24 w-24 rounded-full bg-slate-100/14 blur-sm chemistry-gas-cloud" />
      )}

      {(heated || reactionState === "boiling" || reactionState === "heating") && (
        <div className="absolute left-[64px] top-[36px] h-20 w-16 chemistry-steam">
          <span />
          <span />
          <span />
        </div>
      )}

      {reactionState === "burst" && <BurstEffect />}
      {reactionState === "precipitate" && (
        <div className="absolute left-[64px] top-[120px] h-7 w-14 rounded-full bg-orange-500/80 blur-[1px] chemistry-settle" />
      )}
      {reactionState === "reduction" && (
        <div className="absolute left-[55px] top-[98px] h-12 w-16 rounded-full border border-orange-300/40 bg-orange-500/35 chemistry-heat-glow" />
      )}
    </div>
  );
}

function BurstEffect() {
  return (
    <div className="absolute left-[34px] top-[34px] h-32 w-32 chemistry-burst">
      <div className="absolute inset-8 rounded-full bg-amber-300/75 blur-md" />
      {[0, 35, 70, 110, 150, 205, 250, 300].map((angle) => (
        <span
          key={angle}
          className="absolute left-1/2 top-1/2 h-1.5 w-14 origin-left rounded-full bg-orange-300"
          style={{ transform: `rotate(${angle}deg)` }}
        />
      ))}
    </div>
  );
}
