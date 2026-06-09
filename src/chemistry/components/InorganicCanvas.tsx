"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { MoreHorizontal, Beaker } from "lucide-react";
import type { PlacedInorganicItem, InorganicLibraryItem } from "@/chemistry/types";
import { resolveReaction } from "../reactions";
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
  GlassPipeAsset,
  MatchAsset,
  MatchboxAsset,
  MeasureBottleAsset,
  RoundBottomFlaskAsset,
  RubberStopperAsset,
  RetortStandAsset,
  RingStandAsset,
  ClampAsset,
  ScissorAsset,
  KnifeAsset,
  CrucibleTongsAsset,
  ThermometerAsset,
  SeparatoryFunnelAsset,
  SpatulaAsset,
  SparkEffect,
  StandAsset,
  TestTubeAsset,
  BeakerIcon,
  Beaker100Icon,
  Beaker250Icon,
  ErlenmeyerFlaskIcon,
  ThreeNeckedFlaskIcon,
  FunnelIcon,
  Funnel100Icon,
  SandpaperAsset,
  CopperWireAsset,
  WoodenBoxAsset,
  BalloonAsset,
  TowelAsset,
  CottonAsset,
  FilterPaperAsset,
  playCapSound,
  GlassDefs,
  GlassStopperStandaloneAsset,
  CorkStopperStandaloneAsset,
  GlassPlateStandaloneAsset,
  BurnerCapStandaloneAsset,
  HeatingMantleAsset,
  EvaporationChamberAsset,
  GraduatedCylinderAsset,
  StirringRodAsset,
  VacuumChamberAsset,
  GasInletValveAsset,
  ChinaDishAsset,
  MortarPestleAsset,
  SafetyGlovesAsset,
  CrucibleAsset,
  FurnaceAsset,
} from "./LabAssets";

interface InorganicCanvasProps {
  items: PlacedInorganicItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onCombine: (sourceId: string, targetId: string, volume?: number) => void;
  onDrop: (itemId: string, x: number, y: number, overrides?: Partial<PlacedInorganicItem>) => void;
  onUpdate: (id: string, updates: Partial<PlacedInorganicItem>) => void;
  onRemove: (id: string) => void;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
  isInitialCapDrag?: boolean;
  dragStartX?: number;
  dragStartY?: number;
  draggedNeck?: "left" | "middle" | "right";
}

type DispenseMode = "solid" | "liquid" | "gas";

const isBottleCork = (id: string) => {
  return id === "sodium-carbonate" ||
    id === "barium-hydroxide" ||
    id === "calcium-hydroxide" ||
    id === "potassium-hydroxide" ||
    id === "sodium-bicarbonate" ||
    id === "sodium-hydroxide-solid" ||
    id === "potassium-carbonate" ||
    id === "sodium-hydroxide-solution" ||
    id === "clear-lime-water" ||
    id === "barium-hydroxide-solution" ||
    id === "potassium-hydroxide-solution" ||
    id === "sodium-carbonate-solution" ||
    id === "sodium-bicarbonate-solution" ||
    id === "ammonia-water" ||
    id === "potassium-carbonate-solution";
};

const isBottleDropper = (id: string) => {
  return false;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const getItemUnscaledDims = (id: string, state: string) => {
  if (state !== "glassware") {
    if (id === "glass-stopper") return { w: 42, h: 48 };
    if (id === "cork-stopper") return { w: 42, h: 22 };
    if (id === "burner-cap") return { w: 60, h: 60 };
    if (id === "burner") return { w: 176, h: 176 };
    if (id === "tripod") return { w: 128, h: 256 };
    if (id === "retort-stand") return { w: 144, h: 224 };
    if (id === "matchbox") return { w: 208, h: 176 };
    if (id === "match") return { w: 160, h: 160 };
    if (id === "dropper") return { w: 80, h: 224 };
    if (id === "forceps") return { w: 160, h: 160 };
    if (id === "clay-net") return { w: 160, h: 112 };
    if (id === "copper-wire") return { w: 74, h: 628 };
    if (id === "wooden-box") return { w: 303, h: 234 };
    if (id === "balloon") return { w: 104, h: 142 };
    if (id === "towel") return { w: 103, h: 104 };
    if (id === "cotton") return { w: 120, h: 86 };
    if (id === "filter-paper") return { w: 120, h: 144 };
    if (id === "heating-mantle") return { w: 180, h: 140 };
    if (id === "stirring-rod") return { w: 30, h: 240 };
    if (id === "gas-inlet-valve") return { w: 60, h: 60 };
    if (id === "safety-gloves") return { w: 100, h: 80 };
    if (id === "tongs") return { w: 160, h: 80 };
    if (id === "furnace") return { w: 220, h: 220 };
    if (state === "solid" || state === "liquid" || state === "gas") {
      return { w: 130, h: 160 };
    }
    return { w: 128, h: 128 };
  }
  if (id === "evaporation-chamber") return { w: 200, h: 250 };
  if (id === "graduated-cylinder") return { w: 100, h: 280 };
  if (id === "vacuum-chamber") return { w: 200, h: 220 };
  if (id === "china-dish") return { w: 160, h: 80 };
  if (id === "mortar-pestle") return { w: 140, h: 100 };
  if (id === "crucible") return { w: 100, h: 100 };
  if (id.includes("beaker")) return { w: 222, h: 240 };
  if (id.includes("funnel")) return { w: 194, h: 240 };
  if (id.includes("erlenmeyer") || id === "three-neck-flask") return { w: 120, h: 120 };
  if (id === "round-bottom-flask") return { w: 200, h: 280 };
  if (id === "separatory-funnel") return { w: 220, h: 660 };
  if (id === "gas-jar") return { w: 220, h: 300 };
  if (id === "measure-bottle" || id === "glass-bottle") return { w: 120, h: 160 };
  if (id.includes("test-tube")) return { w: 100, h: 200 };
  return { w: 100, h: 100 };
};

const getItemCanvasScale = (id: string, state: string) => {
  if (id === "heating-mantle") return 1.0;
  if (id === "evaporation-chamber") return 1.0;
  if (id === "copper-wire") return 0.25;
  if (id === "wooden-box") return 0.5;
  if (id === "balloon") return 1.0;
  if (id === "towel") return 1.0;
  if (id === "cotton") return 1.0;
  if (id === "filter-paper") return 1.0;
  if (state !== "glassware") return 1.0;
  if (id === "beaker" || id === "funnel") return 1.0;
  if (id === "beaker-100" || id === "funnel-100") return 0.75;
  if (id === "erlenmeyer-100") return 1.5;
  if (id === "beaker-250") return 0.88;
  if (id === "erlenmeyer-250" || id === "three-neck-flask") return 1.76;
  if (id === "round-bottom-flask") return 1.056;
  if (id === "separatory-funnel" || id === "gas-jar") return 0.96;
  if (id === "graduated-cylinder") return 0.9;
  if (id === "vacuum-chamber") return 1.0;
  if (id === "china-dish") return 1.0;
  if (id === "mortar-pestle") return 1.0;
  if (id === "crucible") return 1.0;
  if (id === "furnace") return 1.0;
  if (id === "tongs") return 0.75;
  if (id === "measure-bottle" || id === "glass-bottle") return 1.76;
  return 2.112; // test-tube etc.
};

function getRoundedPolylinePath(points: { x: number, y: number }[], radius = 25) {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);

    const r = Math.min(radius, dPrev / 2.1, dNext / 2.1);

    const startX = curr.x + (prev.x - curr.x) * (r / dPrev);
    const startY = curr.y + (prev.y - curr.y) * (r / dPrev);

    const endX = curr.x + (next.x - curr.x) * (r / dNext);
    const endY = curr.y + (next.y - curr.y) * (r / dNext);

    d += ` L ${startX} ${startY}`;
    d += ` Q ${curr.x} ${curr.y} ${endX} ${endY}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

const getVesselMouths = (v: PlacedInorganicItem) => {
  if (v.id === "three-neck-flask") {
    return [
      { x: v.x + 41, y: v.y + 32, open: !!v.isOpenLeft },
      { x: v.x + 106, y: v.y + 17, open: !!v.isOpenMiddle },
      { x: v.x + 170, y: v.y + 32, open: !!v.isOpenRight },
    ];
  }
  if (v.id === "evaporation-chamber") {
    return [
      { x: v.x + 15, y: v.y + 107, open: !!v.isOpenLeft },
      { x: v.x + 100, y: v.y + 10, open: !!v.isOpenMiddle },
      { x: v.x + 185, y: v.y + 107, open: !!v.isOpenRight },
    ];
  }
  const dims = getItemUnscaledDims(v.id, v.state);
  const scale = getItemCanvasScale(v.id, v.state);
  const mouthX = v.x + dims.w / 2;
  const mouthY = v.state === "gas" ? v.y + 25 : (v.y + dims.h - dims.h * scale + 15);
  
  const isOpen = v.id.includes("beaker") || v.id.includes("funnel") || v.id === "china-dish" || v.id === "mortar-pestle" || v.id === "crucible"
    ? true
    : (v.isOpen !== false && !v.hasRubberStopper);

  return [{ x: mouthX, y: mouthY, open: isOpen }];
};

const isPipeConnectedToMouth = (mouth: { x: number; y: number }, pipes: PlacedInorganicItem[]) => {
  return pipes.some((pipe) => {
    const points = pipe.metadata?.points || [
      { x: 20, y: 100 },
      { x: 20, y: 20 },
      { x: 100, y: 20 },
    ];
    if (points.length < 2) return false;
    const startP = { x: pipe.x + points[0].x, y: pipe.y + points[0].y };
    const endP = { x: pipe.x + points[points.length - 1].x, y: pipe.y + points[points.length - 1].y };
    return Math.hypot(startP.x - mouth.x, startP.y - mouth.y) < 50 || Math.hypot(endP.x - mouth.x, endP.y - mouth.y) < 50;
  });
};

const isVesselPipeConnected = (v: PlacedInorganicItem, pipes: PlacedInorganicItem[]) => {
  const mouths = getVesselMouths(v);
  return mouths.some(mouth => mouth.open && isPipeConnectedToMouth(mouth, pipes));
};

const isVesselNeckConnectedToPipe = (v: PlacedInorganicItem, neckName: "left" | "middle" | "right", pipes: PlacedInorganicItem[]) => {
  let mouth: { x: number; y: number } | null = null;
  if (v.id === "three-neck-flask") {
    if (neckName === "left") mouth = { x: v.x + 41, y: v.y + 32 };
    else if (neckName === "middle") mouth = { x: v.x + 106, y: v.y + 17 };
    else if (neckName === "right") mouth = { x: v.x + 170, y: v.y + 32 };
  } else if (v.id === "evaporation-chamber") {
    if (neckName === "left") mouth = { x: v.x + 15, y: v.y + 107 };
    else if (neckName === "middle") mouth = { x: v.x + 100, y: v.y + 10 };
    else if (neckName === "right") mouth = { x: v.x + 185, y: v.y + 107 };
  }
  if (!mouth) return false;
  return isPipeConnectedToMouth(mouth, pipes);
};

const hasOpenMouthToAir = (v: PlacedInorganicItem, pipes: PlacedInorganicItem[]) => {
  if (v.id === "three-neck-flask" || v.id === "evaporation-chamber") {
    const necks: ("left" | "middle" | "right")[] = ["left", "middle", "right"];
    return necks.some(neck => {
      const isOpen = neck === "left" ? v.isOpenLeft : neck === "middle" ? v.isOpenMiddle : v.isOpenRight;
      return isOpen && !isVesselNeckConnectedToPipe(v, neck, pipes);
    });
  }
  
  const isOpen = v.id.includes("beaker") || v.id.includes("funnel") || v.id === "china-dish" || v.id === "mortar-pestle" || v.id === "crucible"
    ? true
    : (v.isOpen !== false && !v.hasRubberStopper);
  
  return isOpen && !isVesselPipeConnected(v, pipes);
};

const isVesselOpenForPouring = (v: PlacedInorganicItem) => {
  if (v.id === "three-neck-flask" || v.id === "evaporation-chamber") {
    return !!v.isOpenMiddle;
  }
  return v.id.includes("beaker") || v.id.includes("funnel") || v.id === "china-dish" || v.id === "mortar-pestle" || v.id === "crucible"
    ? true
    : (v.isOpen !== false && !v.hasRubberStopper);
};


export function DynamicGlassPipe({
  points,
  isSelected,
  gasFlow,
  isExitConnected,
  onNodeMouseDown,
  onNodeDoubleClick,
  onPathDoubleClick
}: {
  points: { x: number, y: number }[];
  isSelected: boolean;
  gasFlow?: { color: string; reverse: boolean };
  isExitConnected?: boolean;
  onNodeMouseDown: (e: React.MouseEvent, index: number, x: number, y: number) => void;
  onNodeDoubleClick: (index: number) => void;
  onPathDoubleClick?: (e: React.MouseEvent) => void;
}) {
  const pathD = getRoundedPolylinePath(points, 0);
  const flowPathD = gasFlow?.reverse ? getRoundedPolylinePath([...points].reverse(), 0) : pathD;
  const highlightPoints = points.map(p => ({ x: p.x - 1, y: p.y - 1 }));
  const highlightD = getRoundedPolylinePath(highlightPoints, 0);
  const exitPoint = gasFlow?.reverse ? points[0] : points[points.length - 1];
  const exitNeighbor = gasFlow?.reverse ? points[1] : points[points.length - 2];
  const exitDx = exitPoint.x - (exitNeighbor?.x ?? exitPoint.x);
  const exitDy = exitPoint.y - (exitNeighbor?.y ?? exitPoint.y);
  const exitLength = Math.hypot(exitDx, exitDy) || 1;
  const exitUnit = { x: exitDx / exitLength, y: exitDy / exitLength };
  const exitPerp = { x: -exitUnit.y, y: exitUnit.x };

  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.2)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        <path
          d={pathD}
          fill="none"
          stroke="#ffffff"
          strokeWidth="24"
          strokeLinecap="round"
          strokeOpacity="0.0"
          className="pointer-events-auto cursor-pointer"
          onDoubleClick={onPathDoubleClick}
        />
        <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.3" className="pointer-events-none" />
        <path d={pathD} fill="none" stroke="url(#glassBody)" strokeWidth="11" strokeLinecap="round" className="pointer-events-none" />
        <path d={pathD} fill="none" stroke="url(#internalReflection)" strokeWidth="11" strokeLinecap="round" className="pointer-events-none" />
        <path d={highlightD} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.45" className="pointer-events-none" />
      </g>

      {isSelected && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="16"
          fill="transparent"
          stroke="transparent"
          className="pointer-events-auto cursor-grab"
          onMouseDown={(e) => onNodeMouseDown(e, i, p.x, p.y)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onNodeDoubleClick(i);
          }}
        />
      ))}
      
      {/* Gas flow animation through the pipe */}
      {gasFlow && (
        <g style={{ mixBlendMode: "screen" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={`flow-${i}`} r={3 + (i % 3)} fill={gasFlow.color} opacity="0" filter="blur(2px)">
              <animateMotion
                path={flowPathD}
                dur="1.5s"
                repeatCount="indefinite"
                begin={`${i * 0.25}s`}
              />
              <animate attributeName="opacity" values="0;0.75;0" dur="1.5s" repeatCount="indefinite" begin={`${i * 0.25}s`} />
            </circle>
          ))}
          {!isExitConnected && (
            <g>
              <line
                x1={exitPoint.x}
                y1={exitPoint.y}
                x2={exitPoint.x + exitUnit.x * 38}
                y2={exitPoint.y + exitUnit.y * 38}
                stroke={gasFlow.color}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.22"
                filter="blur(5px)"
              >
                <animate attributeName="opacity" values="0.1;0.32;0.1" dur="1.1s" repeatCount="indefinite" />
              </line>
              {Array.from({ length: 9 }).map((_, i) => {
                const spread = (i - 4) * 3.4;
                const startX = exitPoint.x + exitPerp.x * spread;
                const startY = exitPoint.y + exitPerp.y * spread;
                const travel = 20 + (i % 4) * 8;
                const endX = startX + exitUnit.x * travel + exitPerp.x * spread * 0.7;
                const endY = startY + exitUnit.y * travel + exitPerp.y * spread * 0.7;
                const size = 3.5 + (i % 3) * 1.8;
                const delay = i * 0.13;
                return (
                  <circle
                    key={`exit-plume-${i}`}
                    cx={startX}
                    cy={startY}
                    r={size}
                    fill={gasFlow.color}
                    opacity="0"
                    filter="blur(3px)"
                  >
                    <animate attributeName="cx" values={`${startX};${endX}`} dur="1.25s" repeatCount="indefinite" begin={`${delay}s`} />
                    <animate attributeName="cy" values={`${startY};${endY}`} dur="1.25s" repeatCount="indefinite" begin={`${delay}s`} />
                    <animate attributeName="r" values={`${size * 0.45};${size};${size * 1.8}`} dur="1.25s" repeatCount="indefinite" begin={`${delay}s`} />
                    <animate attributeName="opacity" values="0;0.65;0" dur="1.25s" repeatCount="indefinite" begin={`${delay}s`} />
                  </circle>
                );
              })}
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

export function getVesselCapacity(id: string): number {
  if (id === "beaker-100") return 100;
  if (id === "beaker-250") return 250;
  if (id === "beaker") return 1000;
  if (id === "erlenmeyer-100") return 100;
  if (id === "erlenmeyer-250") return 250;
  if (id === "three-neck-flask") return 250;
  if (id === "round-bottom-flask") return 250;
  if (id === "gas-jar") return 250;
  if (id === "separatory-funnel") return 250;
  if (id === "evaporation-chamber") return 500;
  if (id === "graduated-cylinder") return 100;
  if (id === "vacuum-chamber") return 500;
  if (id === "china-dish") return 150;
  if (id === "mortar-pestle") return 200;
  if (id === "crucible") return 100;
  if (id === "test-tube") return 50;
  if (id === "test-tube-small") return 30;
  if (id === "test-tube-mini") return 15;
  if (id.includes("funnel")) return 100;
  return 250;
}

export function getTotalVolume(contents: InorganicLibraryItem[]): number {
  return contents.reduce((sum, item) => {
    if (item.volume !== undefined) return sum + item.volume;
    if (item.state === "liquid") return sum + 30;
    if (item.state === "solid") return sum + 10;
    if (item.state === "gas") return sum + 10;
    return sum;
  }, 0);
}

function getLiquidCanvasY(item: PlacedInorganicItem): number {
  const contents = item.contents ?? [];
  const dims = getItemUnscaledDims(item.id, item.state);
  const scale = getItemCanvasScale(item.id, item.state);
  const capacity = getVesselCapacity(item.id);
  const totalVolume = getTotalVolume(contents);
  const fillPercent = Math.min((totalVolume / capacity) * 100, 100);

  type VesselGeo = { x: number; y: number; w: number; h: number; rx?: number; shape?: "round" | "cone" | "beaker" };
  const geo: VesselGeo = (() => {
    if (item.id.includes("beaker")) return { x: 14, y: 50, w: 466, h: 484, shape: "beaker" };
    if (item.id.includes("erlenmeyer")) return { x: 40, y: 100, w: 140, h: 90, rx: 10, shape: "cone" };
    if (item.id === "three-neck-flask") return { x: 45, y: 65, w: 130, h: 130, rx: 65, shape: "round" };
    if (item.id === "round-bottom-flask") return { x: 24, y: 120, w: 152, h: 152, rx: 76, shape: "round" };
    if (item.id === "gas-jar") return { x: 50, y: 72, w: 120, h: 196, rx: 18 };
    if (item.id === "separatory-funnel") return { x: 47, y: 94, w: 126, h: 210, rx: 63, shape: "round" };
    if (item.id === "test-tube") return { x: 36, y: 10, w: 28, h: 170, rx: 14 };
    if (item.id === "test-tube-small") return { x: 40, y: 15, w: 20, h: 140, rx: 10 };
    if (item.id === "test-tube-mini") return { x: 44, y: 40, w: 12, h: 100, rx: 6 };
    if (item.id.includes("funnel")) return { x: 95, y: 58, w: 230, h: 422, rx: 0 };
    if (item.id === "evaporation-chamber") return { x: 40, y: 40, w: 120, h: 160, rx: 20 };
    if (item.id === "graduated-cylinder") return { x: 35, y: 20, w: 30, h: 240, rx: 0 };
    if (item.id === "china-dish") return { x: 20, y: 25, w: 120, h: 57, rx: 12 };
    if (item.id === "mortar-pestle") return { x: 25, y: 30, w: 90, h: 55, rx: 12 };
    if (item.id === "vacuum-chamber") return { x: 40, y: 120, w: 120, h: 70, rx: 20 };
    if (item.id === "crucible") return { x: 25, y: 15, w: 50, h: 70, rx: 10 };
    return { x: 24, y: 120, w: 152, h: 152, rx: 76, shape: "round" };
  })();

  const svgViewBox = (() => {
    if (item.id === "beaker" || item.id === "beaker-100" || item.id === "beaker-250") return "0 0 494 534";
    if (item.id.includes("erlenmeyer") || item.id === "three-neck-flask") return "0 0 220 220";
    if (item.id === "round-bottom-flask") return "0 0 200 280";
    if (item.id === "gas-jar") return "0 0 220 300";
    if (item.id === "separatory-funnel") return "0 0 220 660";
    if (item.id.includes("test-tube")) return "0 0 100 200";
    if (item.id.includes("funnel")) return "0 0 420 520";
    if (item.id === "evaporation-chamber") return "0 0 200 250";
    if (item.id === "graduated-cylinder") return "0 0 100 280";
    if (item.id === "china-dish") return "0 0 160 100";
    if (item.id === "mortar-pestle") return "0 0 140 100";
    if (item.id === "vacuum-chamber") return "0 0 200 220";
    if (item.id === "crucible") return "0 0 100 100";
    return "0 0 200 280";
  })();

  const vbH = parseInt(svgViewBox.split(" ")[3]);
  const liquidH = (geo.h * fillPercent) / 100;
  const liquidY = geo.y + geo.h - liquidH;

  const unscaledY = (liquidY / vbH) * dims.h;
  const scaledOffsetFromBottom = (dims.h - unscaledY) * scale;
  return (item.y + dims.h) - scaledOffsetFromBottom;
}

export function isVesselHeatedByBurner(v: PlacedInorganicItem, b: PlacedInorganicItem) {
  if (!b.isLit || !b.isOpen) return false;

  const bDims = getItemUnscaledDims(b.id, b.state);
  const bScale = getItemCanvasScale(b.id, b.state);
  const bWidth = bDims.w * bScale;
  const bCenterX = b.x + bWidth / 2;

  const vDims = getItemUnscaledDims(v.id, v.state);
  const vScale = getItemCanvasScale(v.id, v.state);
  const vWidth = vDims.w * vScale;
  const vHeight = vDims.h * vScale;
  const vCenterX = v.x + vWidth / 2;

  const dy = b.y - (v.y + vHeight);
  // Center-to-center horizontal distance within 95px, vessel top is not below burner top, and burner is below vessel within 220px
  return Math.abs(bCenterX - vCenterX) < 95 && v.y <= b.y + 20 && dy < 220;
}

export function isVesselHeatedByMantle(v: PlacedInorganicItem, m: PlacedInorganicItem) {
  if (!m.isLit) return false;

  const mDims = getItemUnscaledDims(m.id, m.state);
  const mScale = getItemCanvasScale(m.id, m.state);
  const mWidth = mDims.w * mScale;
  const mCenterX = m.x + mWidth / 2;

  const vDims = getItemUnscaledDims(v.id, v.state);
  const vScale = getItemCanvasScale(v.id, v.state);
  const vWidth = vDims.w * vScale;
  const vHeight = vDims.h * vScale;
  const vCenterX = v.x + vWidth / 2;

  const dx = Math.abs(mCenterX - vCenterX);
  const dy = (v.y + vHeight) - m.y; // bottom of vessel relative to top of mantle

  // Sit inside mantle
  return dx < 60 && dy > 40 && dy < 160;
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
  const hasGloves = items.some(i => i.id === "safety-gloves");
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [sparkPos, setSparkPos] = useState<{ x: number; y: number } | null>(null);
  const [dispensing, setDispensing] = useState<Record<string, DispenseMode>>({});
  const removalTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const actionTimers = useRef<Record<string, NodeJS.Timeout[]>>({});
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didPanRef = useRef(false);
  const [rotateState, setRotateState] = useState<{ id: string; centerX: number; centerY: number; lastAngleDeg: number; currentRotation: number } | null>(null);
  const [popupItemId, setPopupItemId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [hoveringCapId, setHoveringCapId] = useState<string | null>(null);
  const [hoveringNeck, setHoveringNeck] = useState<"left" | "middle" | "right" | null>(null);
  const [prePour, setPrePour] = useState<{
    itemId: string;
    targetId: string;
    startX: number;
    startY: number;
    targetStartX?: number;
    targetStartY?: number;
    progress: number;
    pouredVolume: number;
    initialVolume: number;
    isSnapping?: boolean;
    isManual?: boolean;
  } | null>(null);
  const [sliderDrag, setSliderDrag] = useState<{
    startY: number;
    startProgress: number;
  } | null>(null);
  const [activeNodeDrag, setActiveNodeDrag] = useState<{ id: string; nodeIndex: number; offsetX: number; offsetY: number } | null>(null);
  const [gasTransfers, setGasTransfers] = useState<Record<string, {
    pipeId: string;
    sourceId: string;
    targetId: string;
    pouredVolume: number;
    initialVolume: number;
  }>>({});

  React.useEffect(() => {
    if (selectedId === null || selectedId !== popupItemId) {
      setPopupItemId(null);
    }
    if (selectedId === null || selectedId !== menuOpenId) {
      setMenuOpenId(null);
    }
  }, [selectedId]);

  const itemsRef = useRef(items);
  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const lastHeatedTimesRef = useRef<Record<string, number>>({});
  const pipeFlowLocksRef = useRef<Record<string, "start-to-end" | "end-to-start">>({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Find all pipes
      const pipes = itemsRef.current.filter(i => i.id === "glass-pipe");
      const currentItems = itemsRef.current;
      const activePipeIds = new Set<string>();

      // Compute local vessel heat
      const burners = currentItems.filter((i) => i.id === "burner");
      const mantles = currentItems.filter((i) => i.id === "heating-mantle");
      const localVesselHeat: Record<string, boolean> = {};
      currentItems.forEach((v) => {
        if (v.state === "glassware") {
          const heatedByBurner = burners.some((b) => isVesselHeatedByBurner(v, b));
          const heatedByMantle = mantles.some((m) => isVesselHeatedByMantle(v, m));
          const isHeated = heatedByBurner || heatedByMantle;
          if (isHeated) {
            lastHeatedTimesRef.current[v.instanceId] = Date.now();
          }
          const isWarm = isHeated || (Date.now() - (lastHeatedTimesRef.current[v.instanceId] || 0) < 10000);
          localVesselHeat[v.instanceId] = isWarm;
        }
      });

      const getLocalReactionState = (v: PlacedInorganicItem) => {
        const ids = new Set((v.contents ?? []).map((content) => content.id));
        if (v.reactionState === "burst" || (ids.has("sodium") && ids.has("water"))) return "burst";
        if (v.reactionState === "precipitate" || (ids.has("iron") && ids.has("cuso4-solution"))) return "precipitate";
        if (ids.has("co2")) return "gas";
        if (localVesselHeat[v.instanceId] && ids.has("cuo")) return "reduction";
        if (localVesselHeat[v.instanceId] && (v.contents?.length ?? 0) > 0) return "boiling";
        if (localVesselHeat[v.instanceId]) return "heating";
        return v.reactionState ?? "idle";
      };

      const isPipeConnected = (v: PlacedInorganicItem) => {
        return isVesselPipeConnected(v, pipes);
      };

      pipes.forEach((pipe) => {
        const points = pipe.metadata?.points || [
          { x: 20, y: 100 },
          { x: 20, y: 20 },
          { x: 100, y: 20 },
        ];
        if (points.length < 2) return;

        const startP = { x: pipe.x + points[0].x, y: pipe.y + points[0].y };
        const endP = { x: pipe.x + points[points.length - 1].x, y: pipe.y + points[points.length - 1].y };

        // 1. Identify source and target items connected to the pipe ends
        let startMouth: { x: number; y: number; open: boolean } | null = null;
        const startItem = currentItems.find((i) => {
          const mouths = getVesselMouths(i);
          return mouths.some((mouth) => {
            if (mouth.open && Math.hypot(startP.x - mouth.x, startP.y - mouth.y) < 50) {
              startMouth = mouth;
              return true;
            }
            return false;
          });
        });

        let endMouth: { x: number; y: number; open: boolean } | null = null;
        const endItem = currentItems.find((i) => {
          const mouths = getVesselMouths(i);
          return mouths.some((mouth) => {
            if (mouth.open && Math.hypot(endP.x - mouth.x, endP.y - mouth.y) < 50) {
              endMouth = mouth;
              return true;
            }
            return false;
          });
        });

        if (!startItem || !endItem) return;

        // Determine which is the source and target
        let gasSource: PlacedInorganicItem | null = null;
        let targetVessel: PlacedInorganicItem | null = null;

        if (startItem.state === "gas") {
          gasSource = startItem;
          targetVessel = endItem;
        } else if (endItem.state === "gas") {
          gasSource = endItem;
          targetVessel = startItem;
        } else {
          // Both are glassware - determine source based on gas production/heat
          const isProducingGas = (i: PlacedInorganicItem) => {
            const iReactionState = getLocalReactionState(i);
            const hasGasContent = i.contents && i.contents.some(c => c.state === "gas");
            const hasLiquidContent = i.contents && i.contents.some(c => c.state === "liquid");
            const isBoiling = iReactionState === "boiling" && hasLiquidContent;
            return iReactionState === "gas" || hasGasContent || isBoiling;
          };

          const startProd = isProducingGas(startItem);
          const endProd = isProducingGas(endItem);

          if (startProd && !endProd) {
            gasSource = startItem;
            targetVessel = endItem;
          } else if (endProd && !startProd) {
            gasSource = endItem;
            targetVessel = startItem;
          } else if (startProd && endProd) {
            // Both producing, check heat
            const startHeated = localVesselHeat[startItem.instanceId];
            const endHeated = localVesselHeat[endItem.instanceId];
            if (startHeated && !endHeated) {
              gasSource = startItem;
              targetVessel = endItem;
            } else {
              gasSource = endItem;
              targetVessel = startItem;
            }
          }
        }

        if (!gasSource || !targetVessel || targetVessel.state !== "glassware") return;
        if (gasSource.state === "gas" && !gasSource.isOpen) return;

        const currentDirection: "start-to-end" | "end-to-start" =
          gasSource.instanceId === startItem.instanceId ? "start-to-end" : "end-to-start";
        const lockedDirection = pipeFlowLocksRef.current[pipe.instanceId];
        if (lockedDirection && lockedDirection !== currentDirection) return;

        // Check if distillation is active
        const gasSourceState = gasSource.state === "glassware" ? getLocalReactionState(gasSource) : "idle";
        let isDistillation = false;
        let distillationContent: InorganicLibraryItem | null = null;
        if (gasSource.state === "glassware" && gasSourceState === "boiling" && gasSource.contents) {
          // Find water first
          let liquidInSource = gasSource.contents.find(c => c.id === "water" && c.state === "liquid");
          if (!liquidInSource) {
            // Fallback to any other liquid
            liquidInSource = gasSource.contents.find(c => c.state === "liquid");
          }
          if (liquidInSource && (liquidInSource.volume ?? 0) > 0.01) {
            isDistillation = true;
            distillationContent = liquidInSource;
          }
        }

        const targetCapacity = getVesselCapacity(targetVessel.id);
        const targetTotalVolume = getTotalVolume(targetVessel.contents || []);

        if (isDistillation && distillationContent) {
          const transferVol = 0.5; // 0.5 mL per tick (250ms)
          const actualTransferVol = Math.min(transferVol, distillationContent.volume ?? 0);
          const roomInTarget = targetCapacity - targetTotalVolume;
          const finalTransferVol = Math.min(actualTransferVol, roomInTarget);

          if (finalTransferVol > 0) {
            pipeFlowLocksRef.current[pipe.instanceId] = currentDirection;
            activePipeIds.add(pipe.instanceId);

            // 1. Deduct from source
            const updatedSourceContents = gasSource.contents!.map(c => {
              if (c.id === distillationContent!.id && c.state === "liquid") {
                return {
                  ...c,
                  volume: Math.max(0, (c.volume ?? 0) - finalTransferVol),
                };
              }
              return c;
            }).filter(c => (c.volume ?? 0) > 0.01 || c.state !== "liquid");

            onUpdate(gasSource.instanceId, { contents: updatedSourceContents });

            // 2. Add to target (condenses to water)
            const updatedTargetContents = [...(targetVessel.contents || [])];
            const existingLiquidIdx = updatedTargetContents.findIndex(c => c.id === distillationContent!.id && c.state === "liquid");

            if (existingLiquidIdx !== -1) {
              const existing = updatedTargetContents[existingLiquidIdx];
              updatedTargetContents[existingLiquidIdx] = {
                ...existing,
                volume: (existing.volume ?? 0) + finalTransferVol,
              };
            } else {
              updatedTargetContents.push({
                ...distillationContent!,
                volume: finalTransferVol,
                state: "liquid",
              });
            }

            const reaction = resolveReaction(updatedTargetContents, targetVessel.id, hasGloves, vesselHeat[targetVessel.instanceId]);
            onUpdate(targetVessel.instanceId, {
              contents: reaction.contents,
              reactionState: reaction.state ?? "idle",
              note: reaction.note,
            });

            // Update gasTransfers state (shows distillation overlay)
            setGasTransfers(prev => {
              const existing = prev[pipe.instanceId];
              if (existing && existing.targetId === targetVessel.instanceId) {
                return {
                  ...prev,
                  [pipe.instanceId]: {
                    ...existing,
                    pouredVolume: existing.pouredVolume + finalTransferVol,
                  }
                };
              } else {
                return {
                  ...prev,
                  [pipe.instanceId]: {
                    pipeId: pipe.instanceId,
                    sourceId: gasSource.instanceId,
                    targetId: targetVessel.instanceId,
                    pouredVolume: finalTransferVol,
                    initialVolume: targetTotalVolume,
                  }
                };
              }
            });
          }
        } else {
          // 3. Perform regular gas transfer
          let gasContent: InorganicLibraryItem | null = null;
          if (gasSource.state === "gas") {
            gasContent = {
              id: gasSource.id,
              name: gasSource.name,
              symbol: gasSource.symbol,
              state: "gas",
              accent: gasSource.accent || "#67e8f9",
              volume: 2,
              module: (gasSource as any).module || "",
              category: (gasSource as any).category || "gas",
              description: (gasSource as any).description || "",
            };
          } else if (gasSource.contents) {
            const gasInSource = gasSource.contents.find(c => c.state === "gas");
            if (gasInSource && (gasInSource.volume ?? 0) > 0.1) {
              gasContent = {
                ...gasInSource,
                volume: Math.min(2, gasInSource.volume ?? 2),
              };
            }
          }

          if (!gasContent) return;

          if (targetTotalVolume < targetCapacity) {
            const addedVol = Math.min(gasContent.volume ?? 2, targetCapacity - targetTotalVolume);
            if (addedVol > 0) {
              pipeFlowLocksRef.current[pipe.instanceId] = currentDirection;
              activePipeIds.add(pipe.instanceId);

              const updatedContents = [...(targetVessel.contents || [])];
              const existingGasIdx = updatedContents.findIndex(c => c.id === gasContent!.id);

              if (existingGasIdx !== -1) {
                const existing = updatedContents[existingGasIdx];
                updatedContents[existingGasIdx] = {
                  ...existing,
                  volume: (existing.volume ?? 0) + addedVol,
                };
              } else {
                updatedContents.push({
                  ...gasContent,
                  volume: addedVol,
                });
              }

              // Deduct from source if glassware
              if (gasSource.state === "glassware" && gasSource.contents) {
                const updatedSourceContents = gasSource.contents.map(c => {
                  if (c.state === "gas") {
                    return {
                      ...c,
                      volume: Math.max(0, (c.volume ?? 0) - addedVol),
                    };
                  }
                  return c;
                }).filter(c => (c.volume ?? 0) > 0.01 || c.state !== "gas");

                onUpdate(gasSource.instanceId, { contents: updatedSourceContents });
              }

              const reaction = resolveReaction(updatedContents, targetVessel.id, hasGloves, vesselHeat[targetVessel.instanceId]);
              onUpdate(targetVessel.instanceId, {
                contents: reaction.contents,
                reactionState: reaction.state ?? "idle",
                note: reaction.note,
              });

              // Update gasTransfers state
              setGasTransfers(prev => {
                const existing = prev[pipe.instanceId];
                if (existing && existing.targetId === targetVessel.instanceId) {
                  return {
                    ...prev,
                    [pipe.instanceId]: {
                      ...existing,
                      pouredVolume: existing.pouredVolume + addedVol,
                    }
                  };
                } else {
                  return {
                    ...prev,
                    [pipe.instanceId]: {
                      pipeId: pipe.instanceId,
                      sourceId: gasSource.instanceId,
                      targetId: targetVessel.instanceId,
                      pouredVolume: addedVol,
                      initialVolume: targetTotalVolume,
                    }
                  };
                }
              });
            }
          }
        }
      });

      // Evaporate water directly to air if heated, open, and NOT connected to a pipe
      currentItems.forEach((v) => {
        if (v.state === "glassware" && localVesselHeat[v.instanceId] && v.contents) {
          if (hasOpenMouthToAir(v, pipes)) {
            // Find water first, then fallback to any liquid
            let liquidContent = v.contents.find(c => c.id === "water" && c.state === "liquid");
            if (!liquidContent) {
              liquidContent = v.contents.find(c => c.state === "liquid");
            }

            if (liquidContent && (liquidContent.volume ?? 0) > 0.01) {
              const evapVol = 0.3; // 0.3 mL per tick
              const updatedContents = v.contents.map(c => {
                if (c.id === liquidContent!.id && c.state === "liquid") {
                  return {
                    ...c,
                    volume: Math.max(0, (c.volume ?? 0) - evapVol),
                  };
                }
                return c;
              }).filter(c => (c.volume ?? 0) > 0.01 || c.state !== "liquid");

              onUpdate(v.instanceId, { contents: updatedContents });
            }
          }
        }
      });

      // Escaping gases from open vessels directly to air if NOT connected to a pipe
      currentItems.forEach((v) => {
        if (v.state === "glassware" && v.contents) {
          if (hasOpenMouthToAir(v, pipes)) {
            const hasGas = v.contents.some(c => c.state === "gas");
            if (hasGas) {
              const gasEscapeRate = 1.0; // 1.0 mL per tick
              const updatedContents = v.contents.map(c => {
                if (c.state === "gas") {
                  return {
                    ...c,
                    volume: Math.max(0, (c.volume ?? 0) - gasEscapeRate),
                  };
                }
                return c;
              }).filter(c => (c.volume ?? 0) > 0.01 || c.state !== "gas");

              onUpdate(v.instanceId, { contents: updatedContents });
            }
          }
        }
      });

      // Sublimate camphor if heated OR if nitrogen is present (nitrogen carries camphor vapor)
      currentItems.forEach((v) => {
        if (v.state === "glassware" && v.contents) {
          const camphorSolid = v.contents.find(c => c.id === "camphor" && c.state === "solid");
          if (!camphorSolid || (camphorSolid.mass ?? 0) <= 0.01) return;

          const hasNitrogen = v.contents.some(c => c.id === "nitrogen" || c.id === "nitrogen-gasbag");
          const isHot = localVesselHeat[v.instanceId];

          // Only sublimate if heated or nitrogen present
          if (!isHot && !hasNitrogen) return;

          // Nitrogen dissolves camphor faster (0.8g/tick) vs just heat (0.4g/tick)
          const sublimateAmt = hasNitrogen ? 0.8 : 0.4;
          const actualAmt = Math.min(sublimateAmt, camphorSolid.mass ?? 10);

          // Deduct from solid camphor
          let updatedContents = v.contents.map(c => {
            if (c.id === "camphor" && c.state === "solid") {
              return {
                ...c,
                mass: Math.max(0, (c.mass ?? 0) - actualAmt),
                volume: Math.max(0, (c.volume ?? 0) - actualAmt)
              };
            }
            return c;
          }).filter(c => (c.mass ?? 0) > 0.01 || c.state !== "solid");

          // If nitrogen is present or sealed: keep the vapor inside
          const shouldKeepVapor = hasNitrogen || !hasOpenMouthToAir(v, pipes);
          if (shouldKeepVapor) {
            // Find or add camphor-vapor
            const existingVaporIdx = updatedContents.findIndex(c => c.id === "camphor-vapor" && c.state === "gas");
            if (existingVaporIdx !== -1) {
              const existing = updatedContents[existingVaporIdx];
              updatedContents[existingVaporIdx] = {
                ...existing,
                volume: (existing.volume ?? 0) + actualAmt
              };
            } else {
              updatedContents.push({
                id: "camphor-vapor",
                module: "inorganic" as const,
                category: "gases" as const,
                name: "Camphor Vapor",
                symbol: "C10H16O (g)",
                state: "gas" as const,
                accent: "#cbd5e1",
                description: "Colorless aromatic sublimated camphor vapor.",
                volume: actualAmt
              });
            }
          }

          const reaction = resolveReaction(updatedContents, v.id, hasGloves, vesselHeat[v.instanceId]);
          onUpdate(v.instanceId, {
            contents: reaction.contents,
            reactionState: reaction.state ?? "idle",
            note: reaction.note
          });
        }
      });

      // Cleanup inactive gas transfers
      setGasTransfers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(pipeId => {
          if (!activePipeIds.has(pipeId)) {
            delete next[pipeId];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [items]);

  React.useEffect(() => {
    if (prePour) {
      const hasSource = items.some(i => i.instanceId === prePour.itemId);
      const hasTarget = prePour.targetId === "table" || items.some(i => i.instanceId === prePour.targetId);
      if (!hasSource || !hasTarget) {
        setPrePour(null);
        setDispensing(prev => {
          const next = { ...prev };
          delete next[prePour.itemId];
          return next;
        });
      }
    }
  }, [items, prePour]);

  const prePourRef = useRef(prePour);
  React.useEffect(() => {
    prePourRef.current = prePour;
  }, [prePour]);

  React.useEffect(() => {
    if (!prePour) {
      setDispensing({});
    }
  }, [prePour]);

  React.useEffect(() => {
    if (!prePour || prePour.progress <= 0.1) {
      return;
    }

    const interval = setInterval(() => {
      const currentPrePour = prePourRef.current;
      if (!currentPrePour || currentPrePour.progress <= 0.1) return;

      const currentItems = itemsRef.current;
      const sourceItem = currentItems.find(i => i.instanceId === currentPrePour.itemId);
      if (!sourceItem) return;

      if (sourceItem.state === "glassware") {
        const hasVolOrMass = (c: any) => {
          const vol = c.volume !== undefined ? c.volume : (c.state === "solid" ? 0 : (c.state === "gas" ? 10 : 30));
          const mass = c.mass !== undefined ? c.mass : (c.state === "solid" ? 10 : 0);
          return vol > 0.01 || mass > 0.01;
        };

        if (!sourceItem.contents || sourceItem.contents.length === 0 || sourceItem.contents.findIndex(hasVolOrMass) === -1) {
          setPrePour(null);
          setDispensing(prev => {
            const next = { ...prev };
            delete next[currentPrePour.itemId];
            return next;
          });
          return;
        }

        const pourableIndex = sourceItem.contents.findIndex(hasVolOrMass);

        const sourceContent = sourceItem.contents[pourableIndex];
        const isSolid = sourceContent.state === "solid";

        let tiltSpeedMultiplier = 1;
        if (currentPrePour.progress > 0.85) {
          tiltSpeedMultiplier = 4;
        } else if (currentPrePour.progress > 0.6) {
          tiltSpeedMultiplier = 2;
        }

        const tickAmount = (isSolid ? 2 : 5) * tiltSpeedMultiplier;
        const currentVol = sourceContent.volume ?? (isSolid ? 10 : 30);
        const actualTick = Math.min(tickAmount * currentPrePour.progress, currentVol);
        if (actualTick <= 0) return;

        const updatedSourceContents = sourceItem.contents.map((c, idx) => {
          if (idx === pourableIndex) {
            const nv = currentVol - actualTick;
            const nm = c.mass !== undefined ? Math.max(0, (c.mass ?? 10) - actualTick) : undefined;
            return {
              ...c,
              volume: nv,
              mass: nm
            };
          }
          return c;
        }).filter(hasVolOrMass);

        onUpdate(sourceItem.instanceId, { contents: updatedSourceContents });

        setPrePour(prev => {
          if (!prev || prev.itemId !== currentPrePour.itemId) return prev;
          return {
            ...prev,
            pouredVolume: prev.pouredVolume + actualTick
          };
        });

        // Increment target contents (if targetId !== "table")
        if (currentPrePour.targetId !== "table") {
          const targetItem = currentItems.find(i => i.instanceId === currentPrePour.targetId);
          if (targetItem && targetItem.state === "glassware" && isVesselOpenForPouring(targetItem)) {
            // Vacuum chamber valve constraints
            if (targetItem.id === "vacuum-chamber") {
              const isSourceGas = sourceContent.state === "gas";
              if (isSourceGas) {
                const gasInletValve = currentItems.find(i => i.id === "gas-inlet-valve" && i.note === targetItem.instanceId);
                if (!gasInletValve) {
                  onUpdate(targetItem.instanceId, { note: "No gas inlet valve attached! Please attach the Gas Inlet Valve to the vacuum chamber to introduce gas." });
                  return;
                }
                if (!gasInletValve.isOpen) {
                  onUpdate(targetItem.instanceId, { note: "The Gas Inlet Valve is closed! Click the valve to open it and introduce gas." });
                  return;
                }
              }
            }

            const targetCapacity = getVesselCapacity(targetItem.id);
            const targetTotalVolume = getTotalVolume(targetItem.contents || []);

            if (targetTotalVolume < targetCapacity) {
              const addedTick = Math.min(actualTick, targetCapacity - targetTotalVolume);
              if (addedTick > 0) {
                const updatedTargetContents = [...(targetItem.contents || [])];
                const targetIdx = updatedTargetContents.findIndex(c => c.id === sourceContent.id);
                if (targetIdx !== -1) {
                  const existing = updatedTargetContents[targetIdx];
                  const existingVol = existing.volume ?? (existing.state === "solid" ? 10 : 30);
                  const existingMass = existing.mass;
                  updatedTargetContents[targetIdx] = {
                    ...existing,
                    volume: existingVol + addedTick,
                    mass: existingMass !== undefined ? existingMass + addedTick : undefined
                  };
                } else {
                  updatedTargetContents.push({
                    ...sourceContent,
                    volume: addedTick,
                    mass: sourceContent.mass !== undefined ? addedTick : undefined
                  });
                }

                // Resolve reaction in target
                const reaction = resolveReaction(updatedTargetContents, targetItem.id, hasGloves, vesselHeat[targetItem.instanceId]);
                onUpdate(targetItem.instanceId, {
                  contents: reaction.contents,
                  reactionState: reaction.state ?? "idle",
                  note: reaction.note
                });
              }
            }
          }
        }
      } else {
        // Original logic for chemical bottle
        const targetItem = currentItems.find(i => i.instanceId === currentPrePour.targetId);
        if (!targetItem || targetItem.state !== "glassware") return;

        const targetCapacity = getVesselCapacity(targetItem.id);
        const currentVolume = getTotalVolume(targetItem.contents || []);

        if (currentVolume >= targetCapacity) {
          return; // full
        }

        const isSolid = sourceItem.state === "solid";
        let tiltSpeedMultiplier = 1;
        if (currentPrePour.progress > 0.85) {
          tiltSpeedMultiplier = 4;
        } else if (currentPrePour.progress > 0.6) {
          tiltSpeedMultiplier = 2;
        }

        const tickAmount = (isSolid ? 2 : 5) * currentPrePour.progress * tiltSpeedMultiplier;

        onCombine(currentPrePour.itemId, currentPrePour.targetId, tickAmount);

        setPrePour(prev => {
          if (!prev || prev.itemId !== currentPrePour.itemId) return prev;
          return {
            ...prev,
            pouredVolume: prev.pouredVolume + tickAmount
          };
        });
      }
    }, 150);

    return () => clearInterval(interval);
  }, [prePour?.itemId, prePour?.targetId, (prePour?.progress ?? 0) > 0.1]);

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
    // Removed flashSpark to hide the \"cross sign\"

    queueItemTimer(item.instanceId, () => {
      onUpdate(item.instanceId, { isLit: true });
    }, 90);

    queueItemTimer(item.instanceId, () => {
      onUpdate(item.instanceId, {
        showStick: false,
        isLit: false,
      });
      onDrop("match", item.x + 126, item.y + 56, {
        rotation: 338, // 68 + 22 (internal) = 90 degrees exactly straight
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

  const handleBackgroundMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;

    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect || !surfaceRef.current) return;

    setIsPanning(true);
    didPanRef.current = false;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: panOffset.x,
      panY: panOffset.y,
    };
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeNodeDrag) {
      const draggedItem = items.find((i) => i.instanceId === activeNodeDrag.id);
      if (draggedItem && surfaceRef.current) {
        const rect = surfaceRef.current.getBoundingClientRect();
        const zoom = rect.width / surfaceRef.current.offsetWidth;
        const nextX = (event.clientX - rect.left) / zoom - panOffset.x;
        const nextY = (event.clientY - rect.top) / zoom - panOffset.y;

        const localX = nextX - draggedItem.x - activeNodeDrag.offsetX;
        const localY = nextY - draggedItem.y - activeNodeDrag.offsetY;

        const points = draggedItem.metadata?.points || [
          { x: 20, y: 100 },
          { x: 20, y: 20 },
          { x: 100, y: 20 },
        ];
        const newPoints = [...points];
        newPoints[activeNodeDrag.nodeIndex] = { x: localX, y: localY };

        onUpdate(draggedItem.instanceId, {
          metadata: {
            ...draggedItem.metadata,
            points: newPoints,
          },
        });
      }
      return;
    }

    if (!dragState && !isPanning && !rotateState && !sliderDrag) return;
    if (!surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const zoom = rect.width / surfaceRef.current.offsetWidth;

    if (sliderDrag && prePour) {
      const dy = (event.clientY - sliderDrag.startY) / zoom;
      const sliderHeight = 120; // pixels
      // Dragging UP makes dy negative, so subtract to increase progress
      const newProgress = clamp(sliderDrag.startProgress - dy / sliderHeight, 0, 1);

      setPrePour({ ...prePour, progress: newProgress });

      const draggedItem = items.find((i) => i.instanceId === prePour.itemId);
      if (draggedItem && (draggedItem.state === "solid" || draggedItem.state === "liquid" || draggedItem.state === "gas" || draggedItem.state === "glassware")) {
        const mode = draggedItem.state === "glassware"
          ? (draggedItem.contents?.some(c => c.state === 'liquid') ? 'liquid' : (draggedItem.contents?.some(c => c.state === 'solid') ? 'solid' : 'liquid'))
          : draggedItem.state;
        // Calculate dynamic rotation: 0 to max tilt based on progress
        const maxRotation = mode === "gas" ? -18 : -110;
        const rot = newProgress * maxRotation;

        onUpdate(prePour.itemId, {
          rotation: rot,
          x: prePour.startX,
          y: prePour.startY
        });

        // Start pouring effect early when tilted enough
        if (newProgress > 0.1 && !dispensing[prePour.itemId]) {
          setDispensing(prev => ({ ...prev, [prePour.itemId]: mode }));
        } else if (newProgress <= 0.1 && dispensing[prePour.itemId]) {
          setDispensing(prev => {
            const next = { ...prev };
            delete next[prePour.itemId];
            return next;
          });
        }


      }

      return;
    }

    if (rotateState) {
      const angleRad = Math.atan2(
        event.clientY - rotateState.centerY,
        event.clientX - rotateState.centerX
      );
      const angleDeg = angleRad * (180 / Math.PI) + 90;
      // Delta between last frame and this frame, normalized to (-180, 180]
      let delta = angleDeg - rotateState.lastAngleDeg;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      let newRotation = rotateState.currentRotation + delta;
      if (event.shiftKey) newRotation = Math.round(newRotation / 15) * 15;
      rotateState.lastAngleDeg = angleDeg;
      rotateState.currentRotation = newRotation;
      onUpdate(rotateState.id, { rotation: newRotation });

      const rotatingItem = items.find(i => i.instanceId === rotateState.id);
      if (rotatingItem && rotatingItem.state === "glassware") {
        let normalizedRot = newRotation % 360;
        if (normalizedRot > 180) normalizedRot -= 360;
        if (normalizedRot < -180) normalizedRot += 360;

        if (rotatingItem.id === "gas-jar" && Math.abs(normalizedRot) >= 70) {
          if (!rotatingItem.isOpen || (rotatingItem.contents && rotatingItem.contents.length > 0)) {
            onUpdate(rotatingItem.instanceId, { isOpen: true, contents: [] });
          }
        }

        let isClosed = false;
        if (rotatingItem.id === "three-neck-flask") {
          const leftOpen = rotatingItem.isOpenLeft !== false;
          const middleOpen = rotatingItem.isOpenMiddle !== false;
          const rightOpen = rotatingItem.isOpenRight !== false;

          if (rotatingItem.hasRubberStopper) {
            isClosed = true;
          } else if (Math.abs(normalizedRot) > 130) {
            isClosed = !leftOpen && !middleOpen && !rightOpen;
          } else if (normalizedRot < -50) {
            isClosed = !leftOpen && !middleOpen;
          } else if (normalizedRot > 50) {
            isClosed = !rightOpen && !middleOpen;
          } else {
            isClosed = !leftOpen && !middleOpen && !rightOpen;
          }
        } else {
          isClosed = rotatingItem.isOpen === false || rotatingItem.hasRubberStopper || items.some(i => (i.id === "glass-stopper" || i.id === "cork-stopper" || i.id === "rubber-stopper" || i.id === "burner-cap") && i.note?.includes(rotatingItem.instanceId));
        }

        if (!isClosed) {
          if (Math.abs(normalizedRot) >= 70 && Math.abs(normalizedRot) <= 180) {
            const hasLiquid = rotatingItem.contents?.some(c => c.state === 'liquid');
            const hasSolid = rotatingItem.contents?.some(c => c.state === 'solid');
            const mode = hasLiquid ? 'liquid' : (hasSolid ? 'solid' : 'gas');
            if (dispensing[rotateState.id] !== mode) {
              setDispensing(prev => ({ ...prev, [rotateState.id]: mode }));
            }

            // Find target glassware below rotating vessel
            const target = items.find(
              (i) =>
                i.instanceId !== rotatingItem.instanceId &&
                i.state === "glassware" &&
                i.y > rotatingItem.y &&
                Math.abs(i.x - rotatingItem.x) < 150 &&
                isVesselOpenForPouring(i)
            );

            const progressVal = clamp((Math.abs(normalizedRot) - 60) / 40, 0.2, 1.0);

            setPrePour(prev => {
              const currentTargetId = target ? target.instanceId : "table";
              if (prev && prev.itemId === rotatingItem.instanceId) {
                if (prev.targetId !== currentTargetId) {
                  return {
                    ...prev,
                    targetId: currentTargetId,
                    targetStartX: target ? target.x : undefined,
                    targetStartY: target ? target.y : undefined,
                    progress: progressVal,
                    initialVolume: target ? getTotalVolume(target.contents || []) : getTotalVolume(rotatingItem.contents || []),
                    isManual: true,
                  };
                }
                return {
                  ...prev,
                  progress: progressVal,
                  isManual: true,
                };
              } else {
                return {
                  itemId: rotatingItem.instanceId,
                  targetId: currentTargetId,
                  startX: rotatingItem.x,
                  startY: rotatingItem.y,
                  targetStartX: target ? target.x : undefined,
                  targetStartY: target ? target.y : undefined,
                  progress: progressVal,
                  pouredVolume: 0,
                  initialVolume: target ? getTotalVolume(target.contents || []) : getTotalVolume(rotatingItem.contents || []),
                  isManual: true,
                };
              }
            });
          } else {
            if (dispensing[rotateState.id]) {
              setDispensing(prev => {
                const next = { ...prev };
                delete next[rotateState.id];
                return next;
              });
            }
            setPrePour(prev => {
              if (prev && prev.itemId === rotateState.id) {
                return null;
              }
              return prev;
            });
          }
        }
      }

      return;
    }

    if (isPanning) {
      const dx = event.clientX - panStartRef.current.x;
      const dy = event.clientY - panStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didPanRef.current = true;
      }
      const deltaX = dx / zoom;
      const deltaY = dy / zoom;
      setPanOffset({
        x: panStartRef.current.panX + deltaX,
        y: panStartRef.current.panY + deltaY,
      });
      return;
    }

    if (!dragState) return;

    let draggedItem = items.find((i) => i.instanceId === dragState.id);

    if (dragState.isInitialCapDrag && draggedItem) {
      const dx = event.clientX - (dragState.dragStartX ?? 0);
      const dy = event.clientY - (dragState.dragStartY ?? 0);
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        // Mutate synchronously to prevent race conditions from high-frequency mousemove events
        dragState.isInitialCapDrag = false;

        const isCork = draggedItem.id === "sodium-carbonate" || draggedItem.id === "barium-hydroxide" || draggedItem.id === "calcium-hydroxide" || draggedItem.id === "potassium-hydroxide" || draggedItem.id === "sodium-bicarbonate" || draggedItem.id === "sodium-hydroxide-solid" || draggedItem.id === "potassium-carbonate" || draggedItem.id === "sodium-hydroxide-solution" || draggedItem.id === "clear-lime-water" || draggedItem.id === "barium-hydroxide-solution" || draggedItem.id === "potassium-hydroxide-solution" || draggedItem.id === "sodium-carbonate-solution" || draggedItem.id === "sodium-bicarbonate-solution" || draggedItem.id === "ammonia-water" || draggedItem.id === "potassium-carbonate-solution";
        const isAmber = draggedItem.symbol === "KMnO4" || draggedItem.symbol === "AgNO3" || draggedItem.symbol === "HNO3" || draggedItem.symbol === "I2" || draggedItem.symbol === "H2O2" || draggedItem.symbol === "Cl2" || draggedItem.symbol === "Br2" || draggedItem.symbol === "Fuchsin" || draggedItem.symbol === "Methyl orange";
        const isDropper = false;

        const isBurner = draggedItem.id === "burner";

        if (isBurner) {
          const stopperInstanceId = `lab-${Math.random().toString(36).slice(2, 10)}`;
          const snapX = draggedItem.x + 56;
          const snapY = draggedItem.y;

          onUpdate(draggedItem.instanceId, { isOpen: true });
          playCapSound(true);

          onDrop("burner-cap", snapX, snapY, {
            instanceId: stopperInstanceId,
            note: `from-${draggedItem.instanceId}`,
            rotation: 0
          });

          onSelect(stopperInstanceId);
          setDragState({
            id: stopperInstanceId,
            offsetX: 30,
            offsetY: 30,
          });
          return;
        } else if (!isDropper) {
          const stopperInstanceId = `lab-${Math.random().toString(36).slice(2, 10)}`;
          const isChamber = draggedItem.id === "evaporation-chamber";
          const stopperType = (isCork && !isChamber) ? "cork-stopper" : "glass-stopper";
          const isTNF = draggedItem.id === "three-neck-flask";
          const targetNeck = dragState.draggedNeck;

          let snapX = isChamber ? draggedItem.x + 79 : draggedItem.x + 44;
          let snapY = isChamber ? draggedItem.y - 13 : (isCork ? draggedItem.y + 10 : draggedItem.y);
          let snapRot = 0;

          if ((isTNF || isChamber) && targetNeck) {
            if (targetNeck === "left") {
              snapX = isTNF ? (draggedItem.x + 20) : (draggedItem.x - 20);
              snapY = isTNF ? (draggedItem.y + 8) : (draggedItem.y + 83);
              snapRot = isTNF ? -30 : -90;
            } else if (targetNeck === "middle") {
              snapX = isTNF ? (draggedItem.x + 85) : (draggedItem.x + 79);
              snapY = isTNF ? (draggedItem.y - 7) : (draggedItem.y - 13);
              snapRot = 0;
            } else if (targetNeck === "right") {
              snapX = isTNF ? (draggedItem.x + 149) : (draggedItem.x + 178);
              snapY = isTNF ? (draggedItem.y + 8) : (draggedItem.y + 83);
              snapRot = isTNF ? 30 : 90;
            }
          }

          const updates: Partial<PlacedInorganicItem> = {};
          if ((isTNF || isChamber) && targetNeck) {
            if (targetNeck === "left") updates.isOpenLeft = true;
            else if (targetNeck === "middle") updates.isOpenMiddle = true;
            else if (targetNeck === "right") updates.isOpenRight = true;
            updates.isOpen = true;
          } else {
            updates.isOpen = true;
          }

          onUpdate(draggedItem.instanceId, updates);
          playCapSound(true);

          onDrop(stopperType, snapX, snapY, {
            instanceId: stopperInstanceId,
            note: `from-${draggedItem.instanceId}-${targetNeck || "middle"}${isAmber && !isChamber ? "-amber" : ""}`,
            rotation: snapRot
          });

          onSelect(stopperInstanceId);
          setDragState({
            id: stopperInstanceId,
            offsetX: 21,
            offsetY: isChamber ? 24 : (isTNF ? 24 : (isCork ? 11 : 24)),
          });
          return;
        } else {
          onUpdate(draggedItem.instanceId, { isOpen: true });
          playCapSound(true);
          onSelect(draggedItem.instanceId);
          setDragState({
            id: draggedItem.instanceId,
            offsetX: dragState.offsetX,
            offsetY: dragState.offsetY,
          });
          return;
        }
      } else {
        return;
      }
    }
    const layoutWidth = surfaceRef.current.offsetWidth;
    const layoutHeight = surfaceRef.current.offsetHeight;

    let minX = 18 - panOffset.x;
    let maxX = layoutWidth - 150 - panOffset.x;
    let minY = 18 - panOffset.y;
    let maxY = layoutHeight - 142 - panOffset.y;

    if (draggedItem) {
      const dims = getItemUnscaledDims(draggedItem.id, draggedItem.state);
      const scale = getItemCanvasScale(draggedItem.id, draggedItem.state);

      minX = 18 - (1 - scale) * (dims.w / 2) - panOffset.x;
      maxX = layoutWidth - 150 + (1 - scale) * (dims.w / 2) - panOffset.x;
      minY = 18 - (1 - scale) * dims.h - panOffset.y;
      maxY = layoutHeight - 142 + (1 - scale) * dims.h - panOffset.y;
    }

    const mouseX = (event.clientX - rect.left) / zoom;
    const mouseY = (event.clientY - rect.top) / zoom;

    let nextX = clamp(mouseX - dragState.offsetX, minX, maxX);
    let nextY = clamp(mouseY - dragState.offsetY, minY, maxY);

    if (draggedItem && (draggedItem.id === "glass-stopper" || draggedItem.id === "cork-stopper" || draggedItem.id === "burner-cap")) {
      const match = draggedItem.note?.match(/^from-(lab-[a-z0-9]+)/);
      const parentInstanceId = match ? match[1] : null;
      const parentBottle = items.find((i) => i.instanceId === parentInstanceId);
      if (draggedItem && (draggedItem.id === "glass-stopper" || draggedItem.id === "cork-stopper" || draggedItem.id === "burner-cap")) {
        const isCork = draggedItem.id === "cork-stopper";
        const isBurnerCap = draggedItem.id === "burner-cap";
        const compatibleBottles = items.filter(
          (i) =>
            isBurnerCap ?
              i.id === "burner" && i.isOpen
              :
              ((i.state === "solid" || i.state === "liquid" || i.state === "gas" || i.id === "three-neck-flask") &&
              (i.id.includes("bottle") || i.id.includes("jar") || i.id === "three-neck-flask" || i.state === "solid" || i.state === "liquid" || i.state === "gas") &&
              !isBottleDropper(i.id) &&
              isBottleCork(i.id) === isCork) ||
              (i.id === "evaporation-chamber" && i.isOpen && !isCork)
        );

        let nearestBottle: PlacedInorganicItem | null = null;
        let minDistance = Infinity;
        let matchedNeck: { name: string; snapX: number; snapY: number; rotation: number; open?: boolean } | null = null;

        compatibleBottles.forEach((bottle) => {
          if (bottle.id === "three-neck-flask") {
            const necks = [
              { name: "left", snapX: bottle.x + 20, snapY: bottle.y + 8, rotation: -30, open: bottle.isOpenLeft },
              { name: "middle", snapX: bottle.x + 85, snapY: bottle.y - 7, rotation: 0, open: bottle.isOpenMiddle },
              { name: "right", snapX: bottle.x + 149, snapY: bottle.y + 8, rotation: 30, open: bottle.isOpenRight },
            ];
            necks.forEach((neck) => {
              if (neck.open) {
                const neckCenterX = neck.snapX + 21;
                const neckCenterY = neck.snapY + 24;

                const currentCenterX = nextX + 21;
                const currentCenterY = nextY + 24;

                const dx = currentCenterX - neckCenterX;
                const dy = currentCenterY - neckCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestBottle = bottle;
                  matchedNeck = neck;
                }
              }
            });
          } else if (bottle.id === "evaporation-chamber") {
            const necks = [
              { name: "left", snapX: bottle.x - 20, snapY: bottle.y + 83, rotation: -90, open: bottle.isOpenLeft },
              { name: "middle", snapX: bottle.x + 79, snapY: bottle.y - 13, rotation: 0, open: bottle.isOpenMiddle },
              { name: "right", snapX: bottle.x + 178, snapY: bottle.y + 83, rotation: 90, open: bottle.isOpenRight },
            ];
            necks.forEach((neck) => {
              if (neck.open) {
                const neckCenterX = neck.snapX + 21;
                const neckCenterY = neck.snapY + 24;

                const currentCenterX = nextX + 21;
                const currentCenterY = nextY + 24;

                const dx = currentCenterX - neckCenterX;
                const dy = currentCenterY - neckCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestBottle = bottle;
                  matchedNeck = neck;
                }
              }
            });
          } else {
            const snapX = isBurnerCap ? bottle.x + 56 : bottle.x + 44;
            const snapY = isBurnerCap ? bottle.y : (isCork ? bottle.y + 10 : bottle.y);
            const neckX = isBurnerCap ? snapX + 15 : snapX + 21;
            const neckY = isBurnerCap ? snapY + 15 : snapY + (isCork ? 11 : 24);

            const currentCenterX = nextX + (isBurnerCap ? 15 : 21);
            const currentCenterY = nextY + (isBurnerCap ? 15 : (isCork ? 11 : 24));

            const dx = currentCenterX - neckX;
            const dy = currentCenterY - neckY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
              minDistance = dist;
              nearestBottle = bottle;
              matchedNeck = null;
            }
          }
        });

        const distance = nearestBottle ? minDistance : 100;
        let rotation = 180;
        if (distance < 30) {
          rotation = matchedNeck ? (matchedNeck as any).rotation : 0;
        } else if (distance < 60) {
          const t = (distance - 30) / (60 - 30);
          const targetRot = matchedNeck ? (matchedNeck as any).rotation : 0;
          rotation = Math.round(targetRot + t * (180 - targetRot));
        }
        const prevRotation = draggedItem.rotation ?? 0;
        if (Math.abs(prevRotation - rotation) > 1) {
          onUpdate(draggedItem.instanceId, { rotation });
        }
      }
    }

    if (draggedItem && draggedItem.state === "glassware") {
      const vDims = getItemUnscaledDims(draggedItem.id, draggedItem.state);
      const vScale = getItemCanvasScale(draggedItem.id, draggedItem.state);
      const vWidth = vDims.w * vScale;
      const vHeight = vDims.h * vScale;

      const burner = items.find(
        (i) => i.id === "burner" &&
               Math.abs((i.x + 88) - (nextX + vWidth / 2)) < 80 &&
               Math.abs(i.y - (nextY + vHeight)) < 60
      );
      if (burner) {
        nextX = burner.x + 88 - vWidth / 2;
        nextY = burner.y - vHeight + 10;
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

    if (prePour) {
      if (dragState.id === prePour.itemId) {
        if (Math.abs(nextX - prePour.startX) > 15 || Math.abs(nextY - prePour.startY) > 15) {
          // Break connection - reset rotation but keep bottle open (cap does not appear)
          onUpdate(prePour.itemId, { rotation: 0 });
          setPrePour(null);
          setDispensing(prev => {
            const next = { ...prev };
            delete next[prePour.itemId];
            return next;
          });
        }
      } else if (dragState.id === prePour.targetId) {
        const targetStartX = prePour.targetStartX ?? 0;
        const targetStartY = prePour.targetStartY ?? 0;
        if (Math.abs(nextX - targetStartX) > 15 || Math.abs(nextY - targetStartY) > 15) {
          // Break connection - reset rotation but keep bottle open (cap does not appear)
          onUpdate(prePour.itemId, { rotation: 0 });
          setPrePour(null);
          setDispensing(prev => {
            const next = { ...prev };
            delete next[prePour.itemId];
            return next;
          });
        }
      }
    }

    onMove(dragState.id, nextX, nextY);
  };

  const handlePointerUp = () => {
    if (activeNodeDrag) {
      setActiveNodeDrag(null);
      return;
    }

    if (sliderDrag && prePour) {
      // Snap back the bottle
      onUpdate(prePour.itemId, { rotation: 0, x: prePour.startX, y: prePour.startY });
      setPrePour(p => p ? { ...p, progress: 0 } : null);

      // Keep the stream falling for a very short delay (300ms) for visual smoothness
      setTimeout(() => {
        setDispensing((current) => {
          const next = { ...current };
          delete next[prePour.itemId];
          return next;
        });
      }, 300);

      setSliderDrag(null);
      didPanRef.current = true;
      return;
    }

    if (rotateState) {
      // Do not reset rotation, prePour, or dispensing, so the vessel stays in its rotated position and continues pouring if tilted!
      setRotateState(null);
      return;
    }
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    if (!dragState) return;

    const draggedItem = items.find((i) => i.instanceId === dragState.id);
    if (draggedItem && (draggedItem.id === "glass-stopper" || draggedItem.id === "cork-stopper" || draggedItem.id === "burner-cap")) {
      const isCork = draggedItem.id === "cork-stopper";
      const isBurnerCap = draggedItem.id === "burner-cap";
      let matchedNeckName: "left" | "middle" | "right" | null = null;
      const targetBottle = items.find(
        (i) => {
          if (isBurnerCap) {
            return i.id === "burner" && i.isOpen && Math.abs((i.x + 85) - draggedItem.x) < 40 && Math.abs((i.y + 4) - draggedItem.y) < 40;
          }
          if (i.id === "three-neck-flask" || i.id === "evaporation-chamber") {
            const isTNF = i.id === "three-neck-flask";
            const bottleEl = document.querySelector(`[data-instance-id="${i.instanceId}"]`);
            const svgEl = bottleEl?.querySelector("svg");
            const capEl = document.querySelector(`[data-instance-id="${draggedItem.instanceId}"]`);
            if (svgEl && capEl) {
              const svgRect = svgEl.getBoundingClientRect();
              const capRect = capEl.getBoundingClientRect();
              const capCenterX = capRect.left + capRect.width / 2;
              const capCenterY = capRect.top + capRect.height / 2;

              const scaleX = (isTNF ? 220 : 200) / svgRect.width;
              const scaleY = (isTNF ? 220 : 250) / svgRect.height;
              const localX = (capCenterX - svgRect.left) * scaleX;
              const localY = (capCenterY - svgRect.top) * scaleY;

              let neck: "left" | "middle" | "right" | null = null;
              if (isTNF) {
                if (localY >= -10 && localY <= 50) {
                  if (localX >= 30 && localX <= 85) neck = "left";
                  else if (localX >= 85 && localX <= 135) neck = "middle";
                  else if (localX >= 135 && localX <= 190) neck = "right";
                }
              } else {
                // evaporation-chamber
                if (localY >= 5 && localY <= 45 && localX >= 75 && localX <= 125) {
                  neck = "middle";
                } else if (localY >= 90 && localY <= 125 && localX >= -15 && localX <= 45) {
                  neck = "left";
                } else if (localY >= 90 && localY <= 125 && localX >= 155 && localX <= 215) {
                  neck = "right";
                }
              }

              if (neck) {
                const isNeckOpen = neck === "left" ? i.isOpenLeft
                  : neck === "middle" ? i.isOpenMiddle
                    : neck === "right" ? i.isOpenRight
                      : false;
                if (isNeckOpen) {
                  matchedNeckName = neck;
                  return true;
                }
              }
              return false;
            } else {
              const necks = isTNF ? [
                { name: "left" as const, snapX: i.x + 20, snapY: i.y + 8, open: i.isOpenLeft },
                { name: "middle" as const, snapX: i.x + 85, snapY: i.y - 7, open: i.isOpenMiddle },
                { name: "right" as const, snapX: i.x + 149, snapY: i.y + 8, open: i.isOpenRight },
              ] : [
                { name: "left" as const, snapX: i.x - 20, snapY: i.y + 83, open: i.isOpenLeft },
                { name: "middle" as const, snapX: i.x + 79, snapY: i.y - 13, open: i.isOpenMiddle },
                { name: "right" as const, snapX: i.x + 178, snapY: i.y + 83, open: i.isOpenRight },
              ];
              const foundNeck = necks.find(n => n.open && Math.abs(n.snapX - draggedItem.x) < 40 && Math.abs(n.snapY - draggedItem.y) < 40);
              if (foundNeck) {
                matchedNeckName = foundNeck.name;
                return true;
              }
              return false;
            }
          }
          return (
            ((i.state === "solid" || i.state === "liquid" || i.state === "gas") &&
            (i.id.includes("bottle") || i.id.includes("jar") || i.state === "solid" || i.state === "liquid" || i.state === "gas") &&
            i.isOpen &&
            !isBottleDropper(i.id) &&
            isBottleCork(i.id) === isCork &&
            Math.abs((i.x + 44) - draggedItem.x) < 40 &&
            Math.abs((isCork ? i.y + 10 : i.y) - draggedItem.y) < 40)
          );
        }
      );

      if (targetBottle) {
        if (targetBottle.id === "burner" && targetBottle.isLit) {
          onUpdate(targetBottle.instanceId, { isLit: false });
        }
        playCapSound(false);

        const isTNF = targetBottle.id === "three-neck-flask";
        const isChamber = targetBottle.id === "evaporation-chamber";
        let targetX = targetBottle.x + 44;
        let targetY = isCork ? targetBottle.y + 10 : targetBottle.y;
        let targetRotation = 0;

        if (isTNF && matchedNeckName) {
          if (matchedNeckName === "left") {
            targetX = targetBottle.x + 20;
            targetY = targetBottle.y + 8;
            targetRotation = -30;
          } else if (matchedNeckName === "middle") {
            targetX = targetBottle.x + 85;
            targetY = targetBottle.y - 7;
            targetRotation = 0;
          } else if (matchedNeckName === "right") {
            targetX = targetBottle.x + 149;
            targetY = targetBottle.y + 8;
            targetRotation = 30;
          }
        } else if (isChamber && matchedNeckName) {
          if (matchedNeckName === "left") {
            targetX = targetBottle.x - 20;
            targetY = targetBottle.y + 83;
            targetRotation = -90;
          } else if (matchedNeckName === "middle") {
            targetX = targetBottle.x + 79;
            targetY = targetBottle.y - 13;
            targetRotation = 0;
          } else if (matchedNeckName === "right") {
            targetX = targetBottle.x + 178;
            targetY = targetBottle.y + 83;
            targetRotation = 90;
          }
        } else if (isBurnerCap) {
          targetX = targetBottle.x + 56;
          targetY = targetBottle.y;
        }

        if ((isTNF || isChamber) && matchedNeckName) {
          const updates: Partial<PlacedInorganicItem> = {};
          if (matchedNeckName === "left") updates.isOpenLeft = false;
          else if (matchedNeckName === "middle") updates.isOpenMiddle = false;
          else if (matchedNeckName === "right") updates.isOpenRight = false;

          const openLeft = matchedNeckName === "left" ? false : (targetBottle.isOpenLeft ?? false);
          const openMiddle = matchedNeckName === "middle" ? false : (targetBottle.isOpenMiddle ?? false);
          const openRight = matchedNeckName === "right" ? false : (targetBottle.isOpenRight ?? false);
          updates.isOpen = openLeft || openMiddle || openRight;

          onUpdate(targetBottle.instanceId, updates);
        } else {
          onUpdate(targetBottle.instanceId, { isOpen: false });
        }
        onRemove(draggedItem.instanceId);
        setDragState(null);
        return;
      }
    }

    if (draggedItem && draggedItem.state === "glassware") {
      const target = items.find(
        (i) =>
          i.instanceId !== dragState.id &&
          i.state === "glassware" &&
          Math.abs(i.x + 50 - draggedItem.x) < 250 &&
          Math.abs(i.y + 50 - draggedItem.y) < 250 &&
          isVesselOpenForPouring(i)
      );

      if (target) {
        const dims = getItemUnscaledDims(target.id, target.state);
        const scale = getItemCanvasScale(target.id, target.state);
        const targetW = dims.w * scale;
        const targetH = dims.h * scale;

        const isNarrowNeck =
          target.id.includes("flask") ||
          target.id.includes("erlenmeyer") ||
          target.id.includes("test-tube") ||
          target.id.includes("cylinder");

        const targetCenterX = target.x + dims.w / 2;
        const vesselVisualTop = target.y + dims.h - targetH;

        const sourceDims = getItemUnscaledDims(draggedItem.id, draggedItem.state);

        let newX = 0;
        const newY = vesselVisualTop - 20;

        if (isNarrowNeck) {
          // Snap source center to the right of targetCenter so its left-mouth aligns perfectly with target neck center when tilted
          newX = targetCenterX + 15 - sourceDims.w / 2;
        } else {
          // Snap source mouth to beaker's visual right rim
          const vesselVisualRight = target.x + dims.w / 2 + targetW / 2;
          newX = vesselVisualRight - 20 - sourceDims.w / 2;
        }

        onUpdate(draggedItem.instanceId, { x: newX, y: newY, rotation: 0 });
        setPrePour({
          itemId: draggedItem.instanceId,
          targetId: target.instanceId,
          startX: newX,
          startY: newY,
          targetStartX: target.x,
          targetStartY: target.y,
          progress: 0,
          pouredVolume: 0,
          initialVolume: getTotalVolume(target.contents || []),
          isSnapping: true
        });

        setTimeout(() => {
          setPrePour(p => p?.itemId === draggedItem.instanceId ? { ...p, isSnapping: false } : p);
        }, 500);

        setDragState(null);
        return;
      }
    } else if (draggedItem) {
      const target = items.find(
        (i) =>
          i.instanceId !== dragState.id &&
          i.state === "glassware" &&
          Math.abs(i.x + 50 - draggedItem.x) < 250 &&
          Math.abs(i.y + 50 - draggedItem.y) < 250 &&
          isVesselOpenForPouring(i)
      );

      if (target && (draggedItem.state === "solid" || draggedItem.state === "liquid" || draggedItem.state === "gas") && draggedItem.isOpen) {
        const dims = getItemUnscaledDims(target.id, target.state);
        const scale = getItemCanvasScale(target.id, target.state);
        const targetW = dims.w * scale;
        const targetH = dims.h * scale;

        const isNarrowNeck =
          target.id.includes("flask") ||
          target.id.includes("erlenmeyer") ||
          target.id.includes("test-tube") ||
          target.id.includes("cylinder");

        const targetCenterX = target.x + dims.w / 2;
        const vesselVisualTop = target.y + dims.h - targetH;

        const bottleDims = getItemUnscaledDims(draggedItem.id, draggedItem.state);

        let newX = 0;
        const newY = vesselVisualTop - 20;

        if (isNarrowNeck) {
          // Snap bottle center to the right of targetCenter so its left-mouth aligns perfectly with target neck center when tilted
          newX = targetCenterX + 15 - bottleDims.w / 2;
        } else {
          // Snap bottle mouth to beaker's visual right rim
          const vesselVisualRight = target.x + dims.w / 2 + targetW / 2;
          newX = vesselVisualRight - 20 - bottleDims.w / 2;
        }

        onUpdate(draggedItem.instanceId, { x: newX, y: newY, rotation: 0 });
        setPrePour({
          itemId: draggedItem.instanceId,
          targetId: target.instanceId,
          startX: newX,
          startY: newY,
          targetStartX: target.x,
          targetStartY: target.y,
          progress: 0,
          pouredVolume: 0,
          initialVolume: getTotalVolume(target.contents || []),
          isSnapping: true
        });

        setTimeout(() => {
          setPrePour(p => p?.itemId === draggedItem.instanceId ? { ...p, isSnapping: false } : p);
        }, 500);

        setDragState(null);
        return;
      }
    }

    if (draggedItem && draggedItem.id === "gas-inlet-valve") {
      const targetChamber = items.find(
        (i) =>
          i.instanceId !== draggedItem.instanceId &&
          i.id === "vacuum-chamber" &&
          Math.abs(i.x + 100 - draggedItem.x) < 160 &&
          Math.abs(i.y + 110 - draggedItem.y) < 180
      );
      if (targetChamber) {
        const newX = targetChamber.x + 130;
        const newY = targetChamber.y + 160;

        onUpdate(draggedItem.instanceId, {
          x: newX,
          y: newY,
          rotation: 0,
          note: targetChamber.instanceId
        });
        setDragState(null);
        return;
      }
    }

    if (draggedItem && draggedItem.id === "crucible") {
      const targetFurnace = items.find(
        (i) =>
          i.instanceId !== draggedItem.instanceId &&
          i.id === "furnace" &&
          Math.abs((i.x + 110) - (draggedItem.x + 50)) < 120 &&
          Math.abs((i.y + 110) - (draggedItem.y + 50)) < 120
      );
      if (targetFurnace) {
        const newX = targetFurnace.x + 60;
        const newY = targetFurnace.y + 40;
        onUpdate(draggedItem.instanceId, {
          x: newX,
          y: newY,
          rotation: 0
        });
        setDragState(null);
        return;
      }
    }

    if (draggedItem && draggedItem.id === "tongs") {
      const targetCrucible = items.find(
        (i) =>
          i.instanceId !== draggedItem.instanceId &&
          i.id === "crucible" &&
          Math.abs((i.x + 50) - (draggedItem.x + 80)) < 120 &&
          Math.abs((i.y + 50) - (draggedItem.y + 40)) < 120
      );
      if (targetCrucible) {
        const newX = targetCrucible.x - 30;
        const newY = targetCrucible.y - 10;
        onUpdate(draggedItem.instanceId, {
          x: newX,
          y: newY,
          rotation: 0,
          note: targetCrucible.instanceId
        });
        setDragState(null);
        return;
      }
    }

    if (draggedItem && draggedItem.id === "stirring-rod") {
      const targetVessel = items.find(
        (i) =>
          i.instanceId !== draggedItem.instanceId &&
          i.state === "glassware" &&
          Math.abs(i.x + 50 - draggedItem.x) < 150 &&
          Math.abs(i.y + 50 - draggedItem.y) < 180
      );
      if (targetVessel) {
        const vDims = getItemUnscaledDims(targetVessel.id, targetVessel.state);
        const vScale = getItemCanvasScale(targetVessel.id, targetVessel.state);
        const vWidth = vDims.w * vScale;
        const vHeight = vDims.h * vScale;

        let newX = targetVessel.x + vWidth / 2 - 15;
        let newY = targetVessel.y - 40;
        let rotation = 15;

        if (targetVessel.id.includes("beaker")) {
          newX = targetVessel.x + vWidth / 2 - 25;
          newY = targetVessel.y - 20;
        } else if (targetVessel.id === "graduated-cylinder") {
          newX = targetVessel.x + vWidth / 2 - 18;
          newY = targetVessel.y - 50;
          rotation = 8;
        } else if (targetVessel.id.includes("test-tube")) {
          newX = targetVessel.x + vWidth / 2 - 15;
          newY = targetVessel.y - 80;
          rotation = 5;
        }

        onUpdate(draggedItem.instanceId, { x: newX, y: newY, rotation });
        setDragState(null);
        return;
      }
    }

    // ---- Forceps Interaction ----
    if (draggedItem && draggedItem.id === "forceps") {
      const isAlreadyHolding = !!draggedItem.isOpen;

      if (isAlreadyHolding) {
        // Forceps are holding camphor — try to drop it into a nearby open vessel
        const targetVessel = items.find(
          (i) =>
            i.instanceId !== draggedItem.instanceId &&
            i.state === "glassware" &&
            isVesselOpenForPouring(i) &&
            Math.abs(i.x + 50 - draggedItem.x) < 200 &&
            Math.abs(i.y + 50 - draggedItem.y) < 220
        );

        if (targetVessel) {
          // Add camphor to the vessel contents
          const existingCamphor = (targetVessel.contents ?? []).find(
            (c) => c.id === "camphor" && c.state === "solid"
          );
          let newContents;
          if (existingCamphor) {
            newContents = (targetVessel.contents ?? []).map((c) =>
              c.id === "camphor" && c.state === "solid"
                ? { ...c, mass: (c.mass ?? 0) + 5, volume: (c.volume ?? 0) + 5 }
                : c
            );
          } else {
            newContents = [
              ...(targetVessel.contents ?? []),
              {
                id: "camphor",
                module: "inorganic" as const,
                category: "solids" as const,
                name: "Camphor",
                symbol: "C10H16O",
                formula: "C10H16O",
                state: "solid" as const,
                accent: "#f8fafc",
                description: "White crystalline substance with a strong aromatic odor, undergoes sublimation when heated.",
                mass: 5,
                volume: 5,
              },
            ];
          }

          // Resolve reaction after adding camphor (resolveReaction already imported at top)
          const reaction = resolveReaction(newContents, targetVessel.id, hasGloves, vesselHeat[targetVessel.instanceId]);

          onUpdate(targetVessel.instanceId, {
            contents: reaction.contents,
            reactionState: reaction.state ?? "idle",
            note: reaction.note,
          });

          // Release the forceps (empty them) and snap back above vessel
          onUpdate(draggedItem.instanceId, {
            isOpen: false,
            note: undefined,
            x: targetVessel.x + 30,
            y: targetVessel.y - 80,
            rotation: 0,
          });
          setDragState(null);
          return;
        }
      } else {
        // Forceps are empty — try to pick up camphor from a nearby solid camphor item
        const camphorSource = items.find(
          (i) =>
            i.instanceId !== draggedItem.instanceId &&
            i.id === "camphor" &&
            i.state === "solid" &&
            Math.abs(i.x + 40 - draggedItem.x) < 150 &&
            Math.abs(i.y + 40 - draggedItem.y) < 180
        );

        if (camphorSource) {
          onUpdate(draggedItem.instanceId, {
            isOpen: true,
            note: `holding-camphor-from-${camphorSource.instanceId}`,
            x: camphorSource.x - 10,
            y: camphorSource.y - 60,
            rotation: 0,
          });
          setDragState(null);
          return;
        }
      }
    }

    setDragState(null);
  };

  const vesselHeat = useMemo(() => {
    const burners = items.filter((i) => i.id === "burner");
    const mantles = items.filter((i) => i.id === "heating-mantle");
    const furnaces = items.filter((i) => i.id === "furnace");
    const vessels = items.filter((i) => i.state === "glassware");

    return vessels.reduce<Record<string, boolean>>((acc, v) => {
      const isHeatedByBurner = burners.some((b) => isVesselHeatedByBurner(v, b));
      const isHeatedByMantle = mantles.some((m) => isVesselHeatedByMantle(v, m));
      const isHeatedByFurnace = furnaces.some((f) => {
        if (!f.isLit) return false;
        const vDims = getItemUnscaledDims(v.id, v.state);
        const vScale = getItemCanvasScale(v.id, v.state);
        const vWidth = vDims.w * vScale;
        const vHeight = vDims.h * vScale;
        const vCenterX = v.x + vWidth / 2;
        const vCenterY = v.y + vHeight / 2;
        const fCenterX = f.x + 110;
        const fCenterY = f.y + 110;
        return Math.abs(vCenterX - fCenterX) < 70 && Math.abs(vCenterY - fCenterY) < 70;
      });
      acc[v.instanceId] = isHeatedByBurner || isHeatedByMantle || isHeatedByFurnace;
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
    const zoom = rect.width / surfaceRef.current.offsetWidth;
    const x = clamp((event.clientX - rect.left) / zoom - 66, 18, surfaceRef.current.offsetWidth - 150);
    const y = clamp((event.clientY - rect.top) / zoom - 71, 18, surfaceRef.current.offsetHeight - 142);

    onDrop(itemId, x, y);
  };

  return (
    <div
      ref={surfaceRef}
      className={`relative h-full min-h-0 overflow-hidden bg-[#3a3f47] ${isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      onMouseDown={handleBackgroundMouseDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => {
        if (didPanRef.current) {
          didPanRef.current = false;
          return;
        }
        onSelect(null);
        setPopupItemId(null);
        setMenuOpenId(null);
        setPrePour(null);
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:42px_42px]"
        style={{
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
      />

      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
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
          const dispenseMode = dispensing[item.instanceId];
          const isPouring = !!dispenseMode;
          const isDragging = dragState?.id === item.instanceId;
          const isRotating = rotateState?.id === item.instanceId;
          const isSliderDragging = !!sliderDrag && prePour?.itemId === item.instanceId;

          const dims = getItemUnscaledDims(item.id, item.state);
          const scale = getItemCanvasScale(item.id, item.state);
          const r = Math.max(dims.w, dims.h) / 2 + 16;
          const centerX = dims.w / 2;
          const centerY = dims.h / 2;
          const btnSize = 36;
          const rotateX = centerX + r * 0.707 - btnSize / 2;
          const rotateY = centerY - r * 0.707 - btnSize / 2;
          const dotsX = centerX - r * 0.707 - btnSize / 2;
          const dotsY = centerY - r * 0.707 - btnSize / 2;

          const isStopper = item.id === "glass-stopper" || item.id === "cork-stopper";
          const isGlasswareBottle = item.id.includes("bottle") || item.id.includes("jar") || item.id === "three-neck-flask" || item.id === "evaporation-chamber" || item.state === "solid" || item.state === "liquid";
          const isDropper = false;

          let gasFlow: { color: string; reverse: boolean } | undefined;
          let isExitConnected = false;
          if (item.id === "glass-pipe") {
            const activeTransfer = gasTransfers[item.instanceId];
            const points = item.metadata?.points || [
              { x: 20, y: 100 },
              { x: 20, y: 20 },
              { x: 100, y: 20 },
            ];
            if (points.length >= 2) {
              const startP = { x: item.x + points[0].x, y: item.y + points[0].y };
              const endP = { x: item.x + points[points.length - 1].x, y: item.y + points[points.length - 1].y };

              let startMouth: any = null;
              const startItem = items.find((i) => {
                const mouths = getVesselMouths(i);
                return mouths.some((mouth) => {
                  if (mouth.open && Math.hypot(startP.x - mouth.x, startP.y - mouth.y) < 50) {
                    startMouth = mouth;
                    return true;
                  }
                  return false;
                });
              });

              let endMouth: any = null;
              const endItem = items.find((i) => {
                const mouths = getVesselMouths(i);
                return mouths.some((mouth) => {
                  if (mouth.open && Math.hypot(endP.x - mouth.x, endP.y - mouth.y) < 50) {
                    endMouth = mouth;
                    return true;
                  }
                  return false;
                });
              });

              let sourceItem: PlacedInorganicItem | null = activeTransfer
                ? items.find((i) => i.instanceId === activeTransfer.sourceId) ?? null
                : null;
              let targetItem: PlacedInorganicItem | null = activeTransfer
                ? items.find((i) => i.instanceId === activeTransfer.targetId) ?? null
                : null;
              let reverse = false;

              const isProducingGas = (i: PlacedInorganicItem) => {
                if (i.state === "gas") return true;
                const iReactionState = getLiveReactionState(i);
                const hasGasContent = i.contents && i.contents.some(c => c.state === "gas");
                const hasLiquidContent = i.contents && i.contents.some(c => c.state === "liquid");
                const isBoiling = iReactionState === "boiling" && hasLiquidContent;
                return iReactionState === "gas" || hasGasContent || isBoiling;
              };

              if (activeTransfer && sourceItem) {
                reverse = endItem?.instanceId === activeTransfer.sourceId;
              } else if (startItem && endItem) {
                if (startItem.state === "gas") {
                  sourceItem = startItem;
                  targetItem = endItem;
                  reverse = false;
                } else if (endItem.state === "gas") {
                  sourceItem = endItem;
                  targetItem = startItem;
                  reverse = true;
                } else {
                  const startProd = isProducingGas(startItem);
                  const endProd = isProducingGas(endItem);

                  if (startProd && !endProd) {
                    sourceItem = startItem;
                    targetItem = endItem;
                    reverse = false;
                  } else if (endProd && !startProd) {
                    sourceItem = endItem;
                    targetItem = startItem;
                    reverse = true;
                  } else if (startProd && endProd) {
                    const startHeated = vesselHeat[startItem.instanceId];
                    const endHeated = vesselHeat[endItem.instanceId];
                    if (startHeated && !endHeated) {
                      sourceItem = startItem;
                      targetItem = endItem;
                      reverse = false;
                    } else {
                      sourceItem = endItem;
                      targetItem = startItem;
                      reverse = true;
                    }
                  }
                }
              } else if (startItem) {
                if (isProducingGas(startItem)) {
                  sourceItem = startItem;
                  reverse = false;
                }
              } else if (endItem) {
                if (isProducingGas(endItem)) {
                  sourceItem = endItem;
                  reverse = true;
                }
              }

              if (sourceItem) {
                const iReactionState = sourceItem.state === "glassware" ? getLiveReactionState(sourceItem) : "idle";
                let color = sourceItem.accent || "#ffffff";
                if (sourceItem.state === "glassware") {
                  color = iReactionState === "boiling" ? "#e0f2fe" : color;
                }
                // If it's a gas cylinder, it must be OPEN to flow
                if (sourceItem.state !== "gas" || sourceItem.isOpen) {
                  gasFlow = { color, reverse };
                  isExitConnected = !!targetItem || !!activeTransfer?.targetId;
                }
              }
            }
          }

          let pipeConnected = false;
          if ((item.state === "gas") && item.isOpen) {
            const neckX = item.x + 65;
            const neckY = item.y + 25;
            pipeConnected = items.some((pipe) => {
              if (pipe.id !== "glass-pipe") return false;
              const pts = pipe.metadata?.points || [
                { x: 20, y: 100 },
                { x: 20, y: 20 },
                { x: 100, y: 20 },
              ];
              if (pts.length < 2) return false;
              const startP = { x: pipe.x + pts[0].x, y: pipe.y + pts[0].y };
              const endP = { x: pipe.x + pts[pts.length - 1].x, y: pipe.y + pts[pts.length - 1].y };
              return Math.hypot(startP.x - neckX, startP.y - neckY) < 50 || Math.hypot(endP.x - neckX, endP.y - neckY) < 50;
            });
          }

          const isHoveringCap =
            (isGlasswareBottle && item.id !== "three-neck-flask" && item.id !== "evaporation-chamber" && hoveringCapId === item.instanceId && !item.isOpen && !dragState) ||
            ((item.id === "three-neck-flask" || item.id === "evaporation-chamber") && hoveringCapId === item.instanceId && hoveringNeck && !dragState) ||
            (item.state === "gas" && hoveringCapId === item.instanceId && !dragState);
          const cursorClass = (item.state === "gas" && hoveringCapId === item.instanceId && !dragState)
            ? "cursor-pointer"
            : (isHoveringCap ? "cursor-alias" : (active ? "cursor-grabbing" : "cursor-grab"));

          return (
            <div
              key={item.instanceId}
              data-instance-id={item.instanceId}
              onMouseMove={(event) => {
                if (item.state === "gas") {
                  const svgEl = event.currentTarget.querySelector("svg");
                  if (svgEl) {
                    const rect = svgEl.getBoundingClientRect();
                    const scaleX = 130 / rect.width;
                    const scaleY = 160 / rect.height;
                    const localX = (event.clientX - rect.left) * scaleX;
                    const localY = (event.clientY - rect.top) * scaleY;
                    const isOverValve = localY >= 8 && localY <= 58 && localX >= 45 && localX <= 85;
                    
                    if (isOverValve) {
                      if (hoveringCapId !== item.instanceId) {
                        setHoveringCapId(item.instanceId);
                      }
                    } else {
                      if (hoveringCapId === item.instanceId) {
                        setHoveringCapId(null);
                      }
                    }
                  }
                  return;
                }

                const isFlaskClosed = item.id === "three-neck-flask" || item.id === "evaporation-chamber"
                  ? (!item.isOpenLeft || !item.isOpenMiddle || !item.isOpenRight)
                  : !item.isOpen;
                if ((isGlasswareBottle || item.id === "burner") && isFlaskClosed) {
                  const svgEl = event.currentTarget.querySelector("svg");
                  if (svgEl) {
                    const rect = svgEl.getBoundingClientRect();
                    const isBurner = item.id === "burner";
                    let isOverCap = false;
                    if (isBurner) {
                      const scaleX = 220 / rect.width;
                      const scaleY = 190 / rect.height;
                      const localX = (event.clientX - rect.left) * scaleX;
                      const localY = (event.clientY - rect.top) * scaleY;
                      isOverCap = localY >= 0 && localY <= 80 && localX >= 60 && localX <= 160;
                    } else if (item.id === "three-neck-flask" || item.id === "evaporation-chamber") {
                      const isTNF = item.id === "three-neck-flask";
                      const scaleX = (isTNF ? 220 : 200) / rect.width;
                      const scaleY = (isTNF ? 220 : 250) / rect.height;
                      const localX = (event.clientX - rect.left) * scaleX;
                      const localY = (event.clientY - rect.top) * scaleY;

                      let neck: "left" | "middle" | "right" | null = null;
                      if (isTNF) {
                        if (localY >= 0 && localY <= 40) {
                          if (localX >= 35 && localX <= 80) neck = "left";
                          else if (localX >= 90 && localX <= 130) neck = "middle";
                          else if (localX >= 140 && localX <= 185) neck = "right";
                        }
                      } else {
                        // evaporation-chamber
                        if (localY >= 10 && localY <= 40 && localX >= 80 && localX <= 120) {
                          neck = "middle";
                        } else if (localY >= 90 && localY <= 125 && localX >= -15 && localX <= 45) {
                          neck = "left";
                        } else if (localY >= 90 && localY <= 125 && localX >= 155 && localX <= 215) {
                          neck = "right";
                        }
                      }

                      const isNeckClosed = neck === "left" ? !item.isOpenLeft
                        : neck === "middle" ? !item.isOpenMiddle
                          : neck === "right" ? !item.isOpenRight
                            : false;

                      if (isNeckClosed) {
                        isOverCap = true;
                        if (hoveringNeck !== neck) {
                          setHoveringNeck(neck);
                        }
                      } else {
                        if (hoveringNeck) {
                          setHoveringNeck(null);
                        }
                      }
                    } else {
                      const scaleX = 130 / rect.width;
                      const scaleY = 160 / rect.height;
                      const localX = (event.clientX - rect.left) * scaleX;
                      const localY = (event.clientY - rect.top) * scaleY;
                      isOverCap = localY >= 0 && localY <= 48 && localX >= 40 && localX <= 90;
                    }

                    if (isOverCap) {
                      if (hoveringCapId !== item.instanceId) {
                        setHoveringCapId(item.instanceId);
                      }
                    } else {
                      if (hoveringCapId === item.instanceId) {
                        setHoveringCapId(null);
                      }
                    }
                  }
                }
              }}
              onMouseLeave={() => {
                if (hoveringCapId === item.instanceId) {
                  setHoveringCapId(null);
                }
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
                let clickedNeck: "left" | "middle" | "right" | null = null;
                onSelect(item.instanceId);
                if (selectedId !== item.instanceId) {
                  setPopupItemId(null);
                  setMenuOpenId(null);
                }

                const rect = surfaceRef.current?.getBoundingClientRect();
                if (!rect || !surfaceRef.current) return;

                const zoom = rect.width / surfaceRef.current.offsetWidth;

                const isFlaskClosed = item.id === "three-neck-flask" || item.id === "evaporation-chamber"
                  ? (!item.isOpenLeft || !item.isOpenMiddle || !item.isOpenRight)
                  : !item.isOpen;
                if ((isGlasswareBottle || item.id === "burner") && isFlaskClosed) {
                  const svgEl = event.currentTarget.querySelector("svg");
                  if (svgEl) {
                    const svgRect = svgEl.getBoundingClientRect();
                    const isBurner = item.id === "burner";
                    let isOverCap = false;
                    if (isBurner) {
                      const scaleX = 220 / svgRect.width;
                      const scaleY = 190 / svgRect.height;
                      const localX = (event.clientX - svgRect.left) * scaleX;
                      const localY = (event.clientY - svgRect.top) * scaleY;
                      isOverCap = localY >= 0 && localY <= 80 && localX >= 60 && localX <= 160;
                    } else if (item.id === "three-neck-flask" || item.id === "evaporation-chamber") {
                      const isTNF = item.id === "three-neck-flask";
                      const scaleX = (isTNF ? 220 : 200) / svgRect.width;
                      const scaleY = (isTNF ? 220 : 250) / svgRect.height;
                      const localX = (event.clientX - svgRect.left) * scaleX;
                      const localY = (event.clientY - svgRect.top) * scaleY;

                      let neck: "left" | "middle" | "right" | null = null;
                      if (isTNF) {
                        if (localY >= 0 && localY <= 40) {
                          if (localX >= 35 && localX <= 80) neck = "left";
                          else if (localX >= 90 && localX <= 130) neck = "middle";
                          else if (localX >= 140 && localX <= 185) neck = "right";
                        }
                      } else {
                        // evaporation-chamber
                        if (localY >= 10 && localY <= 40 && localX >= 80 && localX <= 120) {
                          neck = "middle";
                        } else if (localY >= 90 && localY <= 125 && localX >= -15 && localX <= 45) {
                          neck = "left";
                        } else if (localY >= 90 && localY <= 125 && localX >= 155 && localX <= 215) {
                          neck = "right";
                        }
                      }

                      const isNeckClosed = neck === "left" ? !item.isOpenLeft
                        : neck === "middle" ? !item.isOpenMiddle
                          : neck === "right" ? !item.isOpenRight
                            : false;

                      if (isNeckClosed) {
                        isOverCap = true;
                        clickedNeck = neck;
                      }
                    } else {
                      const scaleX = 130 / svgRect.width;
                      const scaleY = 160 / svgRect.height;
                      const localX = (event.clientX - svgRect.left) * scaleX;
                      const localY = (event.clientY - svgRect.top) * scaleY;
                      isOverCap = localY >= 0 && localY <= 48 && localX >= 40 && localX <= 90;
                    }

                    if (isOverCap) {
                      setDragState({
                        id: item.instanceId,
                        offsetX: (event.clientX - rect.left) / zoom - item.x,
                        offsetY: (event.clientY - rect.top) / zoom - item.y,
                        isInitialCapDrag: true,
                        dragStartX: event.clientX,
                        dragStartY: event.clientY,
                        draggedNeck: clickedNeck ?? undefined,
                      });
                      return;
                    }
                  }
                }

                setDragState({
                  id: item.instanceId,
                  offsetX: (event.clientX - rect.left) / zoom - item.x,
                  offsetY: (event.clientY - rect.top) / zoom - item.y,
                });

                if (item.id === "gas-inlet-valve") {
                  onUpdate(item.instanceId, { note: undefined });
                }
                if (item.id === "tongs") {
                  onUpdate(item.instanceId, { note: undefined });
                }
                if (item.id === "crucible") {
                  const isHeated = vesselHeat[item.instanceId];
                  const hasTongs = items.some(t => t.id === "tongs" && t.note === item.instanceId);
                  if (isHeated && !hasTongs) {
                    onUpdate(item.instanceId, { note: "Safety Warning: The crucible is hot! Please attach Crucible Tongs to handle it safely." });
                  }
                }
              }}
              className={`absolute ${cursorClass} transition-transform ${(active && item.id !== "evaporation-chamber") ? "z-50 scale-105" : (active ? "z-50" : "z-10")}`}
              onDoubleClick={(event) => {
                event.stopPropagation();
                if (item.state === "glassware") {
                  setMenuOpenId(item.instanceId);
                }
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(item.instanceId);

                // Interactive States
                if (item.id === "burner") {
                  const burnerOpen = item.isOpen === true;
                  if (burnerOpen) {
                    if (!item.isLit) {
                      onUpdate(item.instanceId, { isLit: true });
                    } else {
                      onUpdate(item.instanceId, { isLit: false });
                    }
                  }
                } else if (item.id === "heating-mantle") {
                  onUpdate(item.instanceId, { isLit: !item.isLit });
                } else if (item.id === "furnace") {
                  onUpdate(item.instanceId, { isLit: !item.isLit });
                } else if (item.id === "gas-inlet-valve") {
                  onUpdate(item.instanceId, { isOpen: !item.isOpen });
                } else if (item.id === "matchbox") {
                  if (item.showStick !== false && !item.isStriking) {
                    strikeMatchbox(item);
                  }
                } else if (item.id === "match") {
                  if (!item.isLit) {
                    onUpdate(item.instanceId, { isLit: true });
                    flashSpark(item.x + 58, item.y + 42, 280);
                  }
                } else if (item.id === "dropper") {
                  if (item.isStriking) return;
                  const currentlyFilled = item.isOpen;

                  if (!currentlyFilled) {
                    const isNearContainer = items.some(i => {
                      if (i.instanceId === item.instanceId) return false;
                      const ignoreIds = ["burner", "matchbox", "match", "forceps", "dropper", "clay-net", "tripod", "wire-gauze", "rubber-stopper", "cork-stopper", "glass-stopper", "burner-cap", "stirring-rod", "gas-inlet-valve", "safety-gloves", "tongs", "furnace"];
                      if (ignoreIds.includes(i.id)) return false;

                      const dx = Math.abs(i.x - item.x);
                      const dy = Math.abs(i.y - item.y);
                      return dx < 120 && dy < 180;
                    });
                    if (!isNearContainer) return;
                  }

                  onUpdate(item.instanceId, { isStriking: true });
                  setTimeout(() => {
                    onUpdate(item.instanceId, { isStriking: false, isOpen: !currentlyFilled });
                  }, 400);
                } else if (
                  item.id.includes("bottle") ||
                  item.id.includes("jar") ||
                  item.id === "evaporation-chamber" ||
                  item.id === "rubber-stopper" ||
                  item.state === "solid" ||
                  item.state === "liquid" ||
                  item.state === "gas"
                ) {
                  if (item.id === "three-neck-flask" || item.id === "evaporation-chamber") {
                    const isTNF = item.id === "three-neck-flask";
                    const svgEl = event.currentTarget.querySelector("svg");
                    if (svgEl) {
                      const svgRect = svgEl.getBoundingClientRect();
                      const scaleX = (isTNF ? 220 : 200) / svgRect.width;
                      const scaleY = (isTNF ? 220 : 250) / svgRect.height;
                      const localX = (event.clientX - svgRect.left) * scaleX;
                      const localY = (event.clientY - svgRect.top) * scaleY;

                      let clickedNeck: "left" | "middle" | "right" | null = null;
                      if (isTNF) {
                        if (localY >= 0 && localY <= 40) {
                          if (localX >= 35 && localX <= 80) clickedNeck = "left";
                          else if (localX >= 90 && localX <= 130) clickedNeck = "middle";
                          else if (localX >= 140 && localX <= 185) clickedNeck = "right";
                        }
                      } else {
                        // evaporation-chamber
                        if (localY >= 10 && localY <= 40 && localX >= 80 && localX <= 120) {
                          clickedNeck = "middle";
                        } else if (localY >= 90 && localY <= 125 && localX >= -15 && localX <= 45) {
                          clickedNeck = "left";
                        } else if (localY >= 90 && localY <= 125 && localX >= 155 && localX <= 215) {
                          clickedNeck = "right";
                        }
                      }

                      if (clickedNeck) {
                        const isOpenNeck = clickedNeck === "left" ? item.isOpenLeft
                          : clickedNeck === "middle" ? item.isOpenMiddle
                            : clickedNeck === "right" ? item.isOpenRight
                              : false;

                        if (isOpenNeck) {
                          // Find matching stopper on canvas
                          const matchingStopper = items.find(i => i.note === `from-${item.instanceId}-${clickedNeck}`);
                          if (matchingStopper) {
                            let targetX = item.x + 85;
                            let targetY = item.y - 7;
                            let targetRotation = 0;

                            if (isTNF) {
                              if (clickedNeck === "left") {
                                targetX = item.x + 20;
                                targetY = item.y + 8;
                                targetRotation = -30;
                              } else if (clickedNeck === "middle") {
                                targetX = item.x + 85;
                                targetY = item.y - 7;
                                targetRotation = 0;
                              } else if (clickedNeck === "right") {
                                targetX = item.x + 149;
                                targetY = item.y + 8;
                                targetRotation = 30;
                              }
                            } else {
                              // evaporation-chamber
                              if (clickedNeck === "left") {
                                targetX = item.x - 20;
                                targetY = item.y + 83;
                                targetRotation = -90;
                              } else if (clickedNeck === "middle") {
                                targetX = item.x + 79;
                                targetY = item.y - 13;
                                targetRotation = 0;
                              } else if (clickedNeck === "right") {
                                targetX = item.x + 178;
                                targetY = item.y + 83;
                                targetRotation = 90;
                              }
                            }

                            onUpdate(matchingStopper.instanceId, { isStriking: true, x: targetX, y: targetY, rotation: targetRotation });
                            playCapSound(false);
                            setTimeout(() => {
                              const updates: Partial<PlacedInorganicItem> = {};
                              if (clickedNeck === "left") updates.isOpenLeft = false;
                              else if (clickedNeck === "middle") updates.isOpenMiddle = false;
                              else if (clickedNeck === "right") updates.isOpenRight = false;

                              const openLeft = clickedNeck === "left" ? false : (item.isOpenLeft ?? false);
                              const openMiddle = clickedNeck === "middle" ? false : (item.isOpenMiddle ?? false);
                              const openRight = clickedNeck === "right" ? false : (item.isOpenRight ?? false);
                              updates.isOpen = openLeft || openMiddle || openRight;

                              onUpdate(item.instanceId, updates);
                              onRemove(matchingStopper.instanceId);
                              if (item.instanceId === prePour?.itemId) setPrePour(null);
                            }, 450);
                          } else {
                            // If stopper not found, just close it
                            const updates: Partial<PlacedInorganicItem> = {};
                            if (clickedNeck === "left") updates.isOpenLeft = false;
                            else if (clickedNeck === "middle") updates.isOpenMiddle = false;
                            else if (clickedNeck === "right") updates.isOpenRight = false;

                            const openLeft = clickedNeck === "left" ? false : (item.isOpenLeft ?? false);
                            const openMiddle = clickedNeck === "middle" ? false : (item.isOpenMiddle ?? false);
                            const openRight = clickedNeck === "right" ? false : (item.isOpenRight ?? false);
                            updates.isOpen = openLeft || openMiddle || openRight;

                            onUpdate(item.instanceId, updates);
                            playCapSound(false);
                          }
                        }
                      }
                    }
                    return;
                  }

                  if (item.state === "gas") {
                    const svgEl = event.currentTarget.querySelector("svg");
                    if (svgEl) {
                      const svgRect = svgEl.getBoundingClientRect();
                      const scaleX = 130 / svgRect.width;
                      const scaleY = 160 / svgRect.height;
                      const localX = (event.clientX - svgRect.left) * scaleX;
                      const localY = (event.clientY - svgRect.top) * scaleY;
                      const clickedOnValveOrPanel = localY >= 8 && localY <= 58 && localX >= 45 && localX <= 85;
                      
                      if (!clickedOnValveOrPanel) {
                        return; // Ignore click on the rest of the cylinder body!
                      }
                    }
                    const nextOpen = !item.isOpen;
                    onUpdate(item.instanceId, { isOpen: nextOpen });
                    playCapSound(nextOpen);
                    if (!nextOpen && prePour?.itemId === item.instanceId) {
                      setPrePour(null);
                    }
                    return;
                  }
                  if (isGlasswareBottle && !isDropper) {
                    return; // Disable clicking entirely for bottles with standalone stoppers!
                  }
                  const nextOpen = !item.isOpen;
                  if (nextOpen) {
                    return; // Disable opening on click!
                  }

                  if (isDropper || !isGlasswareBottle) {
                    onUpdate(item.instanceId, { isOpen: nextOpen });
                    playCapSound(nextOpen);
                  } else {
                    const isCork = isBottleCork(item.id);
                    if (nextOpen) {
                      onUpdate(item.instanceId, { isOpen: true });
                      playCapSound(true);
                      const isAmber = item.symbol === "KMnO4" || item.symbol === "AgNO3" || item.symbol === "HNO3" || item.symbol === "I2" || item.symbol === "H2O2" || item.symbol === "Cl2" || item.symbol === "Br2" || item.symbol === "Fuchsin" || item.symbol === "Methyl orange";
                      const stopperType = isCork ? "cork-stopper" : "glass-stopper";
                      onDrop(stopperType, item.x + 44, isCork ? item.y + 10 : item.y, {
                        note: `from-${item.instanceId}${isAmber ? "-amber" : ""}`,
                        rotation: 0
                      });
                    } else {
                      const matchingStopper = items.find(i => i.note?.startsWith(`from-${item.instanceId}`));
                      if (matchingStopper) {
                        const targetX = item.x + 44;
                        const targetY = isCork ? item.y + 10 : item.y;
                        onUpdate(matchingStopper.instanceId, { isStriking: true, x: targetX, y: targetY, rotation: 0 });
                        playCapSound(false);
                        setTimeout(() => {
                          onUpdate(item.instanceId, { isOpen: false });
                          onRemove(matchingStopper.instanceId);
                          if (item.instanceId === prePour?.itemId) setPrePour(null);
                        }, 450);
                      } else {
                        onUpdate(item.instanceId, { isOpen: false });
                        playCapSound(false);
                        if (item.instanceId === prePour?.itemId) setPrePour(null);
                      }
                    }
                  }
                }
              }}
              style={{
                left: item.x,
                top: item.y,
                transform: `rotate(${item.rotation || 0}deg)`,
                transformOrigin: (item.instanceId === prePour?.itemId && !prePour.isManual && !isRotating) ? "50% 10%" : "center center",
                cursor: isHoveringCap ? "alias" : undefined,
                ...((item.instanceId === prePour?.itemId && prePour.isSnapping) || item.isStriking ? {
                  transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                } : (!isDragging && !isRotating && !isSliderDragging ? {
                  transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
                } : {}))
              }}
            >
              {/* High Fidelity Asset Rendering */}
              <div
                className="relative select-none pointer-events-auto origin-bottom [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                style={{
                  width: `${dims.w}px`,
                  height: `${dims.h}px`,
                  transform: `scale(${scale})`
                }}
              >
                {item.id === "beaker" ? (
                  <BeakerIcon />
                ) : item.id === "beaker-100" ? (
                  <Beaker100Icon />
                ) : item.id === "beaker-250" ? (
                  <Beaker250Icon />
                ) : item.id === "erlenmeyer-100" ? (
                  <ErlenmeyerFlaskIcon sizeText="100mL" />
                ) : item.id === "erlenmeyer-250" ? (
                  <ErlenmeyerFlaskIcon sizeText="250mL" />
                ) : item.id === "three-neck-flask" ? (
                  <ThreeNeckedFlaskIcon
                    isOpenLeft={item.isOpenLeft}
                    isOpenMiddle={item.isOpenMiddle}
                    isOpenRight={item.isOpenRight}
                  />
                ) : item.id === "funnel" ? (
                  <FunnelIcon />
                ) : item.id === "funnel-100" ? (
                  <Funnel100Icon />
                ) : item.id === "round-bottom-flask" ? (
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
                ) : item.id === "heating-mantle" ? (
                  <HeatingMantleAsset lit={item.isLit} />
                ) : item.id === "evaporation-chamber" ? (
                  <EvaporationChamberAsset
                    isOpenLeft={item.isOpenLeft}
                    isOpenMiddle={item.isOpenMiddle}
                    isOpenRight={item.isOpenRight}
                  />
                ) : item.id === "vacuum-chamber" ? (
                  <VacuumChamberAsset />
                ) : item.id === "gas-inlet-valve" ? (
                  <GasInletValveAsset isOpen={item.isOpen} />
                ) : item.id === "china-dish" ? (
                  <ChinaDishAsset />
                ) : item.id === "mortar-pestle" ? (
                  <MortarPestleAsset />
                ) : item.id === "crucible" ? (
                  <CrucibleAsset />
                ) : item.id === "furnace" ? (
                  <FurnaceAsset lit={item.isLit} />
                ) : item.id === "tongs" ? (
                  <CrucibleTongsAsset />
                ) : item.id === "safety-gloves" ? (
                  <SafetyGlovesAsset />
                ) : item.id === "graduated-cylinder" ? (
                  <GraduatedCylinderAsset />
                ) : item.id === "stirring-rod" ? (
                  <StirringRodAsset />
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
                  <DropperAsset isFilled={item.isOpen} isSqueezed={item.isStriking} />
                ) : item.id === "forceps" ? (
                  <ForcepsAsset isHolding={!!item.isOpen} />
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
                ) : item.id === "glass-pipe" ? (
                  <>
                    <DynamicGlassPipe
                      points={item.metadata?.points || [
                        { x: 20, y: 100 },
                        { x: 20, y: 20 },
                        { x: 100, y: 20 },
                      ]}
                      isSelected={selectedId === item.instanceId}
                      gasFlow={gasFlow}
                      isExitConnected={isExitConnected}
                      onNodeMouseDown={(e, index, nodeX, nodeY) => {
                        e.stopPropagation();
                        onSelect(item.instanceId);
                        if (surfaceRef.current) {
                          const canvasRect = surfaceRef.current.getBoundingClientRect();
                          const zoom = canvasRect.width / surfaceRef.current.offsetWidth;
                          const pointerX = (e.clientX - canvasRect.left) / zoom - panOffset.x;
                          const pointerY = (e.clientY - canvasRect.top) / zoom - panOffset.y;
                          const itemAbsX = item.x + nodeX;
                          const itemAbsY = item.y + nodeY;
                          setActiveNodeDrag({
                            id: item.instanceId,
                            nodeIndex: index,
                            offsetX: pointerX - itemAbsX,
                            offsetY: pointerY - itemAbsY,
                          });
                        }
                      }}
                      onNodeDoubleClick={(index) => {
                        const points = item.metadata?.points || [
                          { x: 20, y: 100 },
                          { x: 20, y: 20 },
                          { x: 100, y: 20 },
                        ];
                        if (points.length <= 2) return;
                        const newPoints = [...points];
                        newPoints.splice(index, 1);
                        onUpdate(item.instanceId, { metadata: { ...item.metadata, points: newPoints } });
                      }}
                      onPathDoubleClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.instanceId);
                        if (surfaceRef.current) {
                          const canvasRect = surfaceRef.current.getBoundingClientRect();
                          const zoom = canvasRect.width / surfaceRef.current.offsetWidth;
                          const pointerX = (e.clientX - canvasRect.left) / zoom - panOffset.x;
                          const pointerY = (e.clientY - canvasRect.top) / zoom - panOffset.y;

                          const localX = pointerX - item.x;
                          const localY = pointerY - item.y;

                          const points = item.metadata?.points || [
                            { x: 20, y: 100 },
                            { x: 20, y: 20 },
                            { x: 100, y: 20 },
                          ];

                          // Find the closest segment to insert the new point
                          let bestIndex = 1;
                          let minDistance = Infinity;

                          for (let i = 0; i < points.length - 1; i++) {
                            const p1 = points[i];
                            const p2 = points[i + 1];
                            // Distance to line segment
                            const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
                            let t = 0;
                            if (l2 !== 0) {
                              t = Math.max(0, Math.min(1, ((localX - p1.x) * (p2.x - p1.x) + (localY - p1.y) * (p2.y - p1.y)) / l2));
                            }
                            const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
                            const dist = Math.sqrt(Math.pow(localX - proj.x, 2) + Math.pow(localY - proj.y, 2));

                            if (dist < minDistance) {
                              minDistance = dist;
                              bestIndex = i + 1;
                            }
                          }

                          const newPoints = [...points];
                          newPoints.splice(bestIndex, 0, { x: localX, y: localY });
                          onUpdate(item.instanceId, { metadata: { ...item.metadata, points: newPoints } });
                        }
                      }}
                    />
                  </>
                ) : item.id === "scissor" ? (
                  <ScissorAsset />
                ) : item.id === "knife" ? (
                  <KnifeAsset />
                ) : item.id === "crucible-tongs" ? (
                  <CrucibleTongsAsset />
                ) : item.id === "thermometer" ? (
                  <ThermometerAsset />
                ) : item.id === "ring-stand" ? (
                  <RingStandAsset />
                ) : item.id === "clamp" ? (
                  <ClampAsset />
                ) : item.id === "rubber-stopper" ? (
                  <RubberStopperAsset />
                ) : item.id === "glass-stopper" ? (
                  <GlassStopperStandaloneAsset
                    isAmber={item.note?.includes("-amber")}
                    isClosing={item.isStriking}
                    isDragging={dragState?.id === item.instanceId}
                  />
                ) : item.id === "cork-stopper" ? (
                  <CorkStopperStandaloneAsset
                    isClosing={item.isStriking}
                    isDragging={dragState?.id === item.instanceId}
                  />
                ) : item.id === "burner-cap" ? (
                  <BurnerCapStandaloneAsset
                    isClosing={item.isStriking}
                    isDragging={dragState?.id === item.instanceId}
                  />
                ) : item.id === "sandpaper" ? (
                  <SandpaperAsset />
                ) : item.id === "wooden-box" ? (
                  <WoodenBoxAsset />
                ) : item.id === "balloon" ? (
                  <BalloonAsset />
                ) : item.id === "towel" ? (
                  <TowelAsset />
                ) : item.id === "cotton" ? (
                  <CottonAsset />
                ) : item.id === "filter-paper" ? (
                  <FilterPaperAsset />
                ) : item.id === "copper-wire" ? (
                  <CopperWireAsset />
                ) : item.state === "solid" || item.state === "liquid" || item.state === "gas" ? (
                  <ChemicalContainerAsset
                    id={item.id}
                    state={item.state}
                    label={item.name}
                    symbol={item.symbol}
                    accent={item.accent}
                    isOpen={item.isOpen}
                    pipeConnected={pipeConnected}
                  />
                ) : (
                  /* Fallback for other items */
                  <div
                    className={`w-32 rounded-[28px] border px-4 py-4 transition ${active
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



                {item.state === "glassware" && (
                  <VesselContents
                    item={item}
                    heated={vesselHeat[item.instanceId]}
                    reactionState={reactionState}
                    isActivelyPouring={prePour?.targetId === item.instanceId && prePour.progress > 0.1}
                    isRotating={rotateState?.id === item.instanceId}
                    prePourId={prePour?.itemId}
                    prePourIsManual={prePour?.isManual}
                    pipes={items.filter(i => i.id === "glass-pipe")}
                    gasFill={(() => {
                      const transfer = Object.values(gasTransfers).find((entry) => entry.targetId === item.instanceId);
                      if (!transfer) return undefined;
                      const pipe = items.find((entry) => entry.instanceId === transfer.pipeId);
                      const source = items.find((entry) => entry.instanceId === transfer.sourceId);
                      if (!pipe) return undefined;
                      const points = pipe.metadata?.points || [
                        { x: 20, y: 100 },
                        { x: 20, y: 20 },
                        { x: 100, y: 20 },
                      ];
                      const endpoints = [
                        { x: pipe.x + points[0].x, y: pipe.y + points[0].y },
                        { x: pipe.x + points[points.length - 1].x, y: pipe.y + points[points.length - 1].y },
                      ];
                      const mouths = getVesselMouths(item);
                      const targetEndpoint = endpoints.reduce((closest, endpoint) => {
                        const endpointDistance = Math.min(...mouths.map((mouth) => Math.hypot(endpoint.x - mouth.x, endpoint.y - mouth.y)));
                        const closestDistance = Math.min(...mouths.map((mouth) => Math.hypot(closest.x - mouth.x, closest.y - mouth.y)));
                        return endpointDistance < closestDistance ? endpoint : closest;
                      }, endpoints[0]);
                      const dims = getItemUnscaledDims(item.id, item.state);
                      const centerX = item.x + dims.w / 2;
                      const centerY = item.y + dims.h / 2;
                      const dx = targetEndpoint.x - centerX;
                      const dy = targetEndpoint.y - centerY;
                      const side = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "top" : "bottom");
                      return {
                        side,
                        color: source?.accent || "#dbeafe",
                        progress: Math.min(1, transfer.pouredVolume / Math.max(30, getVesselCapacity(item.id) * 0.2)),
                      };
                    })()}
                  />
                )}

                {/* Rubber Stopper */}
                {item.state === "glassware" && item.hasRubberStopper && (
                  <VesselRubberStopper id={item.id} />
                )}

                {/* Label Sticker on the vessel */}
                {item.state === "glassware" && (item.label1 || item.label2) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-20">
                    <div className="bg-white/95 border border-black/20 rounded px-2 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.25)] max-w-[85px] overflow-hidden text-center scale-[0.75] transform translate-y-3">
                      {item.label1 && (
                        <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wider truncate leading-tight">
                          {item.label1}
                        </div>
                      )}
                      {item.label2 && (
                        <div className="text-[7px] font-bold text-slate-500 uppercase tracking-wide truncate leading-none mt-0.5">
                          {item.label2}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selection & Rotation Overlays */}
                {menuOpenId === item.instanceId && item.state === "glassware" && (
                  <div className="absolute inset-0 pointer-events-none select-none z-40">
                    {/* Dotted Circle */}
                    <div
                      className="absolute border border-dashed border-white/40 rounded-full animate-pulse"
                      style={{
                        left: `${centerX - r}px`,
                        top: `${centerY - r}px`,
                        width: `${r * 2}px`,
                        height: `${r * 2}px`,
                      }}
                    />

                    {/* Tooltip Angle display at top of the circle */}
                    <div
                      className="absolute bg-zinc-950/95 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-lg pointer-events-auto flex items-center justify-center whitespace-nowrap"
                      style={{
                        left: `${centerX}px`,
                        top: `${centerY - r - 12}px`,
                        transform: `translate(-50%, -50%) rotate(${-(item.rotation || 0)}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      {((item.rotation ?? 0) % 360 + 360) % 360 | 0}°
                    </div>

                    {/* Blue Rotate Handle */}
                    <div
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        const surf = surfaceRef.current;
                        if (!surf) return;
                        const sr = surf.getBoundingClientRect();
                        const z = sr.width / surf.offsetWidth;
                        const cx = sr.left + (item.x + dims.w / 2 + panOffset.x) * z;
                        const cy = sr.top + (item.y + dims.h / 2 + panOffset.y) * z;
                        // Compute the angle offset so vessel doesn't jump on mousedown
                        const initialAngleRad = Math.atan2(event.clientY - cy, event.clientX - cx);
                        const initialAngleDeg = initialAngleRad * (180 / Math.PI) + 90;
                        setRotateState({
                          id: item.instanceId,
                          centerX: cx,
                          centerY: cy,
                          lastAngleDeg: initialAngleDeg,
                          currentRotation: item.rotation ?? 0,
                        });
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      className="absolute bg-[#0ea5e9] hover:bg-sky-400 hover:scale-110 active:scale-95 transition cursor-pointer pointer-events-auto rounded-full w-9 h-9 flex items-center justify-center shadow-lg shadow-sky-500/30 border border-white/20 text-white"
                      style={{
                        left: `${rotateX}px`,
                        top: `${rotateY}px`,
                        transform: `scale(${1 / scale}) rotate(${-(item.rotation || 0)}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                    </div>

                    {/* 3-dots inspector button */}
                    <div
                      onClick={(event) => {
                        event.stopPropagation();
                        setPopupItemId(popupItemId === item.instanceId ? null : item.instanceId);
                      }}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      className="absolute bg-zinc-900/95 border border-white/10 hover:bg-zinc-800 hover:scale-110 active:scale-95 transition cursor-pointer pointer-events-auto rounded-full w-9 h-9 flex items-center justify-center shadow-lg text-white"
                      style={{
                        left: `${dotsX}px`,
                        top: `${dotsY}px`,
                        transform: `scale(${1 / scale}) rotate(${-(item.rotation || 0)}deg)`,
                        transformOrigin: "center center",
                      }}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </div>
                  </div>
                )}

                {/* Contents Label (only for vessels) */}
                {item.state === "glassware" && item.contents && item.contents.length > 0 && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none">
                    {(() => {
                      const rawSymbols = item.contents.map(c => c.symbol);
                      const splitSymbols = rawSymbols.flatMap(sym =>
                        sym.split("+").map(part => part.trim())
                      ).filter(Boolean);
                      const uniqueSymbols = Array.from(new Set(splitSymbols));
                      const combinedText = uniqueSymbols.join(" + ");

                      return (
                        <div
                          className="bg-slate-950/90 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.4)] text-[8px] font-black text-white px-3 py-1 whitespace-nowrap tracking-wide"
                          style={{ minWidth: "36px", height: "36px" }}
                        >
                          {combinedText}
                        </div>
                      );
                    })()}
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

        {/* Volume Increment/Sum Display Overlay */}
        {prePour && prePour.progress > 0.1 && (() => {
          const targetItem = items.find(i => i.instanceId === prePour.targetId);
          const sourceItem = items.find(i => i.instanceId === prePour.itemId);
          if (!sourceItem) return null;

          let visualLeft = 0;
          let lineY = 0;

          if (targetItem) {
            const dims = getItemUnscaledDims(targetItem.id, targetItem.state);
            const scale = getItemCanvasScale(targetItem.id, targetItem.state);
            const targetW = dims.w * scale;
            visualLeft = targetItem.x + dims.w / 2 - targetW / 2;
            lineY = getLiquidCanvasY(targetItem);
          } else {
            // Position relative to source
            const dims = getItemUnscaledDims(sourceItem.id, sourceItem.state);
            const scale = getItemCanvasScale(sourceItem.id, sourceItem.state);
            const sourceW = dims.w * scale;
            visualLeft = sourceItem.x + dims.w / 2 - sourceW / 2;
            lineY = sourceItem.y + dims.h / 2;
          }

          const firstContent = sourceItem.contents?.[0];
          const unit = firstContent?.state === "solid" || sourceItem.state === "solid" ? "g" : "mL";
          const showRemaining = !targetItem; // Pouring to table shows remaining volume

          return (
            <div
              className="absolute pointer-events-none select-none"
              style={{
                left: visualLeft - 170,
                top: lineY - 24,
                width: 170,
                height: 48,
                zIndex: 50,
              }}
            >
              {/* Dashed line connecting box to vessel */}
              <div className="absolute right-0 top-6 w-[50px] border-t-2 border-dashed border-sky-400/80" />

              {/* Glassmorphic display box */}
              <div className="absolute left-0 top-0 bg-slate-950/85 backdrop-blur border border-sky-500/30 rounded-xl p-2.5 shadow-lg shadow-black/40 flex flex-col justify-center min-w-[110px]">
                <div className="text-[10px] font-semibold text-emerald-400 tracking-wider flex justify-between gap-3">
                  <span>INCREMENT</span>
                  <span>{showRemaining ? "-" : "+"}{prePour.pouredVolume.toFixed(1)} {unit}</span>
                </div>
                {showRemaining ? (
                  <div className="text-[11px] font-bold text-sky-100 tracking-wider flex justify-between gap-3 mt-0.5">
                    <span>REMAINING</span>
                    <span>{Math.max(0, prePour.initialVolume - prePour.pouredVolume).toFixed(1)} {unit}</span>
                  </div>
                ) : (
                  <div className="text-[11px] font-bold text-sky-100 tracking-wider flex justify-between gap-3 mt-0.5">
                    <span>SUM</span>
                    <span>{(prePour.initialVolume + prePour.pouredVolume).toFixed(1)} {unit}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Gas Transfer Increment/Sum Display Overlays */}
        {Object.values(gasTransfers).map((transfer) => {
          const targetItem = items.find(i => i.instanceId === transfer.targetId);
          if (!targetItem) return null;

          const dims = getItemUnscaledDims(targetItem.id, targetItem.state);
          const scale = getItemCanvasScale(targetItem.id, targetItem.state);
          const targetW = dims.w * scale;
          const visualLeft = targetItem.x + dims.w / 2 - targetW / 2;
          const lineY = getLiquidCanvasY(targetItem);

          return (
            <div
              key={`gas-overlay-${transfer.pipeId}`}
              className="absolute pointer-events-none select-none"
              style={{
                left: visualLeft - 170,
                top: lineY - 24,
                width: 170,
                height: 48,
                zIndex: 50,
              }}
            >
              {/* Dashed line connecting box to vessel */}
              <div className="absolute right-0 top-6 w-[50px] border-t-2 border-dashed border-sky-400/80" />

              {/* Glassmorphic display box */}
              <div className="absolute left-0 top-0 bg-slate-950/85 backdrop-blur border border-sky-500/30 rounded-xl p-2.5 shadow-lg shadow-black/40 flex flex-col justify-center min-w-[110px]">
                <div className="text-[10px] font-semibold text-emerald-400 tracking-wider flex justify-between gap-3">
                  <span>INCREMENT</span>
                  <span>+{transfer.pouredVolume.toFixed(1)} mL</span>
                </div>
                <div className="text-[11px] font-bold text-sky-100 tracking-wider flex justify-between gap-3 mt-0.5">
                  <span>SUM</span>
                  <span>{(transfer.initialVolume + transfer.pouredVolume).toFixed(1)} mL</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* PrePour Slider UI */}
        {prePour && !prePour.isManual && !rotateState && menuOpenId !== prePour.itemId && (() => {
          const sourceItem = items.find(i => i.instanceId === prePour.itemId);
          if (!sourceItem) return null;

          const sourceDims = getItemUnscaledDims(sourceItem.id, sourceItem.state);
          const sourceScale = getItemCanvasScale(sourceItem.id, sourceItem.state);
          const sourceW = sourceDims.w * sourceScale;
          const leftOffset = sourceW + 15;

          return (
            <div className="absolute z-[60]" style={{ left: prePour.startX + leftOffset, top: prePour.startY }}>
              {/* Dotted line */}
              <div className="absolute left-[19px] top-5 h-[120px] border-l-2 border-dashed border-white/40" />

              {/* Handle */}
              <div
                className={`absolute w-10 h-10 -ml-[1px] rounded-full flex items-center justify-center cursor-ns-resize shadow-lg transition-colors pointer-events-auto ${prePour.progress > 0 ? "bg-[#0ea5e9] text-white shadow-blue-500/30" : "bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                style={{ top: 120 - prePour.progress * 120 }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSliderDrag({ startY: e.clientY, startProgress: prePour.progress });
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Beaker className="w-5 h-5 ml-0.5 mt-0.5" style={{ transform: "rotate(-15deg)" }} />
              </div>
            </div>
          );
        })()}

        {/* Pouring Stream Effect - liquid/solid falling from bottle to vessel */}
        {prePour && prePour.progress > 0.1 && (() => {
          const sourceItem = items.find(i => i.instanceId === prePour.itemId);
          if (!sourceItem) return null;

          const targetItem = items.find(i => i.instanceId === prePour.targetId);

          if (sourceItem.state === "glassware" && getTotalVolume(sourceItem.contents || []) <= 0) {
            return null;
          }

          const sourceDims = getItemUnscaledDims(sourceItem.id, sourceItem.state);
          const sourceScale = getItemCanvasScale(sourceItem.id, sourceItem.state);

          const centerX = sourceItem.x + sourceDims.w / 2;
          const centerY = sourceItem.y + sourceDims.h / 2;

          let streamStartX = sourceItem.x + sourceDims.w / 2 + 10;
          let streamStartY = sourceItem.y + 20;

          if (sourceItem.state === "glassware") {
            const rot = sourceItem.rotation ?? 0;
            const rad = (rot - 90) * Math.PI / 180;
            streamStartX = centerX + Math.cos(rad) * (sourceDims.h / 2) * sourceScale;
            streamStartY = centerY + Math.sin(rad) * (sourceDims.h / 2) * sourceScale;
          } else {
            if (targetItem) {
              const isNarrowNeck =
                targetItem.id.includes("flask") ||
                targetItem.id.includes("erlenmeyer") ||
                targetItem.id.includes("test-tube");
              if (isNarrowNeck) {
                const targetDims = getItemUnscaledDims(targetItem.id, targetItem.state);
                streamStartX = targetItem.x + targetDims.w / 2;
                streamStartY = sourceItem.y + sourceDims.h - 10;
              }
            }
          }

          let targetCenterX = streamStartX;
          let targetTopY = streamStartY + 250;

          if (targetItem) {
            const targetDims = getItemUnscaledDims(targetItem.id, targetItem.state);
            const targetScale = getItemCanvasScale(targetItem.id, targetItem.state);
            targetCenterX = targetItem.x + targetDims.w / 2;
            targetTopY = targetItem.y + targetDims.h - targetDims.h * targetScale + 10;
          }

          const firstContent = sourceItem.contents?.[0];
          const streamColor = sourceItem.accent || (firstContent ? firstContent.accent : undefined) || "#67e8f9";
          const streamH = Math.max(20, targetTopY - streamStartY);
          const isSolid = sourceItem.state === "solid" || (firstContent?.state === "solid");

          const rot = sourceItem.rotation ?? 0;
          let normalizedRot = rot % 360;
          if (normalizedRot > 180) normalizedRot -= 360;
          if (normalizedRot < -180) normalizedRot += 360;

          const angleRad = (normalizedRot * Math.PI) / 180;
          
          // Physics-based parabolic curve variables
          const tiltFactor = Math.sin(angleRad); // negative if tilted left, positive if right
          const displacement = tiltFactor * streamH * 0.35;

          // Landing point
          let landingX = streamStartX + displacement;
          if (targetItem) {
            landingX = targetCenterX;
          }

          // Control point for the parabolic curve (shoots outwards first)
          const controlX = streamStartX + tiltFactor * streamH * 0.2;
          const controlY = streamStartY - Math.max(15, Math.abs(tiltFactor * streamH) * 0.08);

          const streamPathD = `M ${streamStartX} ${streamStartY} Q ${controlX} ${controlY} ${landingX} ${targetTopY}`;

          return (
            <svg
              className="absolute inset-0 pointer-events-none overflow-visible"
              style={{ zIndex: 55 }}
            >
              {isSolid ? (
                /* Solid particles falling along the curve */
                <>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <circle
                      key={`solid-drop-${i}`}
                      r={2 + (i % 2)}
                      fill={streamColor}
                      opacity="0"
                    >
                      <animateMotion
                        path={streamPathD}
                        dur={`${0.4 + (i % 3) * 0.1}s`}
                        repeatCount="indefinite"
                        begin={`${i * 0.1}s`}
                      />
                      <animate attributeName="opacity" values="0;0.9;0.7;0" dur={`${0.4 + (i % 3) * 0.1}s`} repeatCount="indefinite" begin={`${i * 0.1}s`} />
                    </circle>
                  ))}
                </>
              ) : (
                /* Liquid stream */
                <>
                  {/* Droplets falling along the curve */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <circle
                      key={`liq-drop-${i}`}
                      r={2.5 + (i % 2) + prePour.progress * 1.5}
                      fill={streamColor}
                      opacity="0"
                    >
                      <animateMotion
                        path={streamPathD}
                        dur={`${0.5 + (i % 3) * 0.1}s`}
                        repeatCount="indefinite"
                        begin={`${i * 0.12}s`}
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.9;0.8;0"
                        dur={`${0.5 + (i % 3) * 0.1}s`}
                        repeatCount="indefinite"
                        begin={`${i * 0.12}s`}
                      />
                    </circle>
                  ))}
                  {/* Moving highlights for glossiness */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <circle
                      key={`liq-hl-${i}`}
                      r={1.2 + prePour.progress * 1}
                      fill="#ffffff"
                      opacity="0"
                    >
                      <animateMotion
                        path={streamPathD}
                        dur="0.6s"
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.7;0"
                        dur="0.6s"
                        repeatCount="indefinite"
                        begin={`${i * 0.2}s`}
                      />
                    </circle>
                  ))}
                  {/* Splash at impact point */}
                  <circle cx={landingX} cy={targetTopY} r="4" fill={streamColor} opacity="0">
                    <animate attributeName="r" values="2;12" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
            </svg>
          );
        })()}

        {/* Render Popup next to the active item */}
        {items.map((item) => {
          if (popupItemId !== item.instanceId) return null;
          const dims = getItemUnscaledDims(item.id, item.state);
          const scale = getItemCanvasScale(item.id, item.state);
          const w = dims.w * scale;

          return (
            <VesselPopup
              key={`popup-${item.instanceId}`}
              item={item}
              left={item.x + w + 16}
              top={item.y}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onClose={() => setPopupItemId(null)}
              hasGloves={hasGloves}
              isHeated={vesselHeat[item.instanceId]}
            />
          );
        })}
      </div>
    </div>
  );
}

function mixContentColor(contents: PlacedInorganicItem["contents"]) {
  const liquid = contents?.find((item) => item.state === "liquid");
  const gas = contents?.find((item) => item.state === "gas");
  const solid = contents?.find((item) => item.state === "solid");
  return liquid?.accent ?? gas?.accent ?? solid?.accent ?? "#67e8f9";
}


function VesselContents({
  item,
  heated,
  reactionState,
  isActivelyPouring = false,
  isRotating = false,
  prePourId = null,
  prePourIsManual = false,
  pipes = [],
  gasFill,
}: {
  item: PlacedInorganicItem;
  heated?: boolean;
  reactionState: NonNullable<PlacedInorganicItem["reactionState"]>;
  isActivelyPouring?: boolean;
  isRotating?: boolean;
  prePourId?: string | null;
  prePourIsManual?: boolean;
  pipes?: PlacedInorganicItem[];
  gasFill?: {
    side: "left" | "right" | "top" | "bottom";
    color: string;
    progress: number;
  };
}) {
  const contents = item.contents ?? [];
  const color = mixContentColor(contents);
  const hasLiquid = contents.some((content) => content.state === "liquid");
  const solids = contents.filter((content) => content.state === "solid");
  const solidColor = solids[solids.length - 1]?.accent ?? "#d97706";
  const hasGas = contents.some((content) => content.state === "gas");

  const capacity = getVesselCapacity(item.id);
  const totalVolume = getTotalVolume(contents);
  const fillPercent = Math.min((totalVolume / capacity) * 100, 100);
  const isOverflow = fillPercent >= 100;

  const [sloshOffset, setSloshOffset] = useState(0);
  const prevVolumeRef = useRef(totalVolume);
  const [boilingIntensity, setBoilingIntensity] = useState(0);
  const lastHeatedTimeRef = useRef<number>(0);

  const isVesselOpen = item.id === "three-neck-flask" || item.id === "evaporation-chamber"
    ? (item.isOpenLeft !== false || item.isOpenMiddle !== false || item.isOpenRight !== false)
    : (item.id.includes("beaker") || item.id.includes("funnel") || item.id === "china-dish" || item.id === "mortar-pestle" || item.id === "crucible"
        ? true
        : (item.isOpen !== false && !item.hasRubberStopper));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isCurrentlyHeated = heated || reactionState === "boiling" || reactionState === "heating";
    
    if (isCurrentlyHeated) {
      lastHeatedTimeRef.current = Date.now();
    }

    interval = setInterval(() => {
      const activeHeated = heated || reactionState === "boiling" || reactionState === "heating";
      if (activeHeated) {
        lastHeatedTimeRef.current = Date.now();
        setBoilingIntensity((prev) => Math.min(prev + 0.011, 1));
      } else {
        const timeSinceHeated = Date.now() - lastHeatedTimeRef.current;
        if (timeSinceHeated < 10000) {
          // Hold full boiling intensity for 10 seconds of residual heat
        } else {
          // Cool down starts
          setBoilingIntensity((prev) => Math.max(prev - 0.02, 0));
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [heated, reactionState]);

  useEffect(() => {
    if (hasLiquid && totalVolume > prevVolumeRef.current) {
      let startTime = Date.now();
      const duration = 1500;
      let animationFrameId: number;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= duration) {
          setSloshOffset(0);
        } else {
          const t = elapsed / duration;
          const amplitude = 12 * Math.exp(-3.5 * t);
          const offset = amplitude * Math.sin(t * Math.PI * 8);
          setSloshOffset(offset);
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrameId);
    }
    prevVolumeRef.current = totalVolume;
  }, [totalVolume, hasLiquid]);

  if (contents.length === 0 && !heated) return null;

  // Per-vessel geometry matching actual SVG viewBox coordinates
  type VesselGeo = { x: number; y: number; w: number; h: number; rx?: number; shape?: "round" | "cone" | "beaker" };
  const geo: VesselGeo = (() => {
    // Beaker viewBox="0 0 494 534" — body path fills most of it
    if (item.id.includes("beaker")) return { x: 14, y: 50, w: 466, h: 484, shape: "beaker" };
    // Erlenmeyer viewBox="0 0 220 220"
    if (item.id.includes("erlenmeyer")) return { x: 40, y: 100, w: 140, h: 90, rx: 10, shape: "cone" };
    // Three-neck flask viewBox="0 0 220 220"
    if (item.id === "three-neck-flask") return { x: 45, y: 100, w: 130, h: 80, rx: 40, shape: "round" };
    // Round-bottom flask viewBox="0 0 200 280" — bulb cx=100 cy=196 r=76
    if (item.id === "round-bottom-flask") return { x: 24, y: 120, w: 152, h: 152, rx: 76, shape: "round" };
    // Gas jar viewBox="0 0 220 300"
    if (item.id === "gas-jar") return { x: 50, y: 72, w: 120, h: 196, rx: 18 };
    // Separatory funnel viewBox="0 0 220 660"
    if (item.id === "separatory-funnel") return { x: 47, y: 94, w: 126, h: 210, rx: 63, shape: "round" };
    // Test tubes viewBox="0 0 100 200"
    if (item.id === "test-tube") return { x: 36, y: 10, w: 28, h: 170, rx: 14 };
    if (item.id === "test-tube-small") return { x: 40, y: 15, w: 20, h: 140, rx: 10 };
    if (item.id === "test-tube-mini") return { x: 44, y: 40, w: 12, h: 100, rx: 6 };
    // Funnel viewBox="0 0 420 520"
    if (item.id.includes("funnel")) return { x: 95, y: 58, w: 230, h: 422, rx: 0 };
    if (item.id === "evaporation-chamber") return { x: 40, y: 40, w: 120, h: 160, rx: 20 };
    if (item.id === "graduated-cylinder") return { x: 35, y: 20, w: 30, h: 240, rx: 0 };
    if (item.id === "crucible") return { x: 25, y: 15, w: 50, h: 70, rx: 10 };
    return { x: 24, y: 120, w: 152, h: 152, rx: 76, shape: "round" };
  })();

  const svgViewBox = (() => {
    if (item.id === "beaker" || item.id === "beaker-100" || item.id === "beaker-250") return "0 0 494 534";
    if (item.id.includes("erlenmeyer") || item.id === "three-neck-flask") return "0 0 220 220";
    if (item.id === "round-bottom-flask") return "0 0 200 280";
    if (item.id === "gas-jar") return "0 0 220 300";
    if (item.id === "separatory-funnel") return "0 0 220 660";
    if (item.id.includes("test-tube")) return "0 0 100 200";
    if (item.id.includes("funnel")) return "0 0 420 520";
    if (item.id === "evaporation-chamber") return "0 0 200 250";
    if (item.id === "graduated-cylinder") return "0 0 100 280";
    if (item.id === "crucible") return "0 0 100 100";
    return "0 0 200 280";
  })();

  const [vbW, vbH] = svgViewBox.split(" ").slice(2).map(Number);
  const isSnappingTop = item.instanceId === prePourId && !isRotating && !prePourIsManual;
  const originX = vbW / 2;
  const originY = vbH * (isSnappingTop ? 0.1 : 0.5);

  const liquidH = (geo.h * fillPercent) / 100;
  const liquidY = geo.y + geo.h - liquidH;

  const isHeated = reactionState === "boiling" || reactionState === "heating" || heated;
  const isVisuallyBoiling = isHeated || boilingIntensity > 0;
  const showBubbles = (hasGas && !contents.every(c => c.symbol === "H2O") && !contents.every(c => c.id === "air" || c.id === "air-filled-gasbag")) || isVisuallyBoiling;
  const currentBubbleOpacity = isVisuallyBoiling ? 0.82 * boilingIntensity : 0.82;
  const currentBodyOpacity = isVisuallyBoiling ? 0.22 * boilingIntensity : 0.22;
  const currentGlintOpacity = isVisuallyBoiling ? 0.85 * boilingIntensity : 0.85;

  const hasMist = contents.some(c => c.id === "mist");
  const hasChloroformVapor = contents.some(c => c.id === "chloroform-vapor");
  const hasCamphorVapor = contents.some(c => c.id === "camphor-vapor");
  const hasSolidCamphor = contents.some(c => c.id === "camphor" && c.state === "solid");
  const hasNitrogenGas = contents.some(c => c.id === "nitrogen" || c.id === "nitrogen-gasbag");
  const isCamphorSublimationing = hasSolidCamphor && (isHeated || hasNitrogenGas);
  const showBubbleParticles = showBubbles && hasLiquid && !hasMist && !hasChloroformVapor && !hasCamphorVapor;

  const gasCloudY = hasMist ? geo.y - 10 : geo.y;
  const gasCloudH = hasMist ? geo.h + 20 : Math.max(0, liquidY - geo.y);
  const gasColor = hasMist ? "#f1f5f9" : hasCamphorVapor ? "#e8f4fd" : color;
  // Camphor vapor: soft pearly-white cloud; chloroform-vapor: invisible; others: normal
  const gasOpacity = hasMist
    ? 0.22
    : hasCamphorVapor
      ? 0.18
      : (hasChloroformVapor ? 0 : (isVisuallyBoiling ? 0.05 * boilingIntensity : (hasGas && !hasLiquid ? 0.25 : 0.05)));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {(hasLiquid || solids.length > 0 || showBubbles) && (
        <svg
          viewBox={svgViewBox}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <clipPath id={`vessel-clip-${item.instanceId}`}>
              {item.id.includes("beaker") ? (
                <path d="M14 50 V479 C22 498 53 514 104 523 C129 528 161 531 200 533 C217 533 274 533 290 533 C354 530 395 524 429 513 C436 511 450 505 455 502 C467 495 475 487 480 479 V50 Z" />
              ) : item.id === "round-bottom-flask" ? (
                <path d="M 84 18 V 122 A 76 76 0 1 0 116 122 V 18 Z" />
              ) : item.id === "three-neck-flask" ? (
                <path d="M 95 20 V 80 A 65 65 0 1 0 125 80 V 20 Z" />
              ) : item.id === "separatory-funnel" ? (
                <path d="M110 94 C74 94 47 122 47 159 C47 200 69 230 92 257 C101 268 106 281 110 301 C114 281 119 268 128 257 C151 230 173 200 173 159 C173 122 146 94 110 94 Z M101 298 C102 313 104 327 105 342 H115 C116 327 118 313 119 298 Z M106 364 H114 V624 H106 Z" />
              ) : item.id.includes("funnel") ? (
                <path d="M 95 58 H 325 L 240 240 V 445 C 240 460 232 472 210 480 C 188 472 180 460 180 445 V 240 L 95 58 Z" />
              ) : item.id === "graduated-cylinder" ? (
                <rect x="35" y="20" width="30" height="240" />
              ) : item.id === "vacuum-chamber" ? (
                <path d="M 40 190 V 120 A 70 70 0 0 1 180 120 V 190 Z" />
              ) : item.id === "china-dish" ? (
                <path d="M 20 25 C 20 82, 140 82, 140 25 Z" />
              ) : item.id === "mortar-pestle" ? (
                <path d="M 25 30 C 25 85, 115 85, 115 30 Z" />
              ) : item.id === "crucible" ? (
                <path d="M 25 15 L 35 85 Q 50 90 65 85 L 75 15 Z" />
              ) : item.id === "gas-jar" ? (
                <path d="M84 72 C60 72 48 90 48 120 V250 C48 262 58 272 72 272 H148 C162 272 172 262 172 250 V120 C172 90 160 72 136 72 H84 Z" />
              ) : item.id.includes("test-tube") ? (
                <path d={`M${geo.x} ${geo.y} V${geo.y + geo.h - geo.rx!} A${geo.rx} ${geo.rx} 0 0 0 ${geo.x + geo.w} ${geo.y + geo.h - geo.rx!} V${geo.y} Z`} />
              ) : geo.shape === "cone" ? (
                <polygon points={`${geo.x + geo.w * 0.2},${geo.y} ${geo.x + geo.w * 0.8},${geo.y} ${geo.x + geo.w},${geo.y + geo.h} ${geo.x},${geo.y + geo.h}`} />
              ) : (
                <rect x={geo.x} y={geo.y} width={geo.w} height={geo.h} rx={geo.rx ?? 0} />
              )}
            </clipPath>
            {/* Dynamic high-fidelity powder pattern with real solid grain/texture for each solid */}
            {solids.map((solid) => (
              <pattern
                key={`powder-pattern-${item.instanceId}-${solid.id}`}
                id={`powder-pattern-${item.instanceId}-${solid.id}`}
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                {/* Background solid color with high opacity */}
                <rect width="14" height="14" fill={solid.accent || "#d97706"} fillOpacity="0.94" />
                {/* Granular speckles to show solid/powder texture as circles */}
                <circle cx="2" cy="3" r="0.85" fill="#000000" fillOpacity="0.28" />
                <circle cx="7" cy="9" r="0.75" fill="#000000" fillOpacity="0.32" />
                <circle cx="11" cy="4" r="0.95" fill="#000000" fillOpacity="0.24" />

                <circle cx="5" cy="6" r="0.75" fill="#ffffff" fillOpacity="0.2" />
                <circle cx="9" cy="12" r="0.85" fill="#ffffff" fillOpacity="0.16" />
                <circle cx="13" cy="8" r="0.65" fill="#ffffff" fillOpacity="0.24" />
              </pattern>
            ))}
            <linearGradient id="pdMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="amalgamMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="alloyMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="40%" stopColor="#fb923c" />
              <stop offset="80%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <filter id="adsorbedGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Liquid fill — rises from bottom */}
          {hasLiquid && fillPercent > 0.01 && (() => {
            const tiltRad = ((item.rotation || 0) * Math.PI) / 180;
            const rxValue = (geo.w * 0.42) / Math.max(0.1, Math.abs(Math.cos(tiltRad)));

            return (
              <g clipPath={`url(#vessel-clip-${item.instanceId})`}>
                <g transform={`rotate(${-(item.rotation || 0)}, ${originX}, ${originY}) translate(0, ${sloshOffset})`}>
                  <rect
                    x={geo.x - geo.w}
                    y={liquidY}
                    width={geo.w * 3}
                    height={liquidH + geo.h * 2}
                    fill={color}
                    fillOpacity="0.72"
                    style={{ transition: "y 0.6s cubic-bezier(0.4,0,0.2,1), height 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                  {/* Meniscus highlight */}
                  <ellipse
                    cx={geo.x + geo.w / 2}
                    cy={liquidY}
                    rx={rxValue}
                    ry={3}
                    fill="#ffffff"
                    fillOpacity="0.35"
                    style={{ transition: "cy 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                </g>
              </g>
            );
          })()}

          {/* Solids fill */}
          {solids.length > 0 && (
            <g clipPath={`url(#vessel-clip-${item.instanceId})`}>
              {(() => {
                let runningVolume = 0;
                const accumulatedSolids = solids.map((solid) => {
                  const sVol = solid.volume ?? 10;
                  runningVolume += sVol;
                  return {
                    solid,
                    accumVolume: runningVolume
                  };
                });

                // Render in reverse order (top layer first, bottom layer last)
                return accumulatedSolids.slice().reverse().map(({ solid, accumVolume }) => {
                  const solidFillPercent = Math.min((accumVolume / capacity) * 100, 100);
                  const solidH = (geo.h * solidFillPercent) / 100;
                  const solidY = geo.y + geo.h - solidH;
                  const sColor = solid.accent || "#d97706";

                  if (solid.id === "gold-copper-alloy") {
                    const alloyH = geo.h * 0.4;
                    const alloyY = geo.y + geo.h - alloyH;
                    const path = `M ${geo.x + 5} ${geo.y + geo.h} L ${geo.x + 10} ${alloyY} L ${geo.x + geo.w - 10} ${alloyY} L ${geo.x + geo.w - 5} ${geo.y + geo.h} Z`;
                    return (
                      <g key={`solid-layer-${solid.id}`} transform={`rotate(${-(item.rotation || 0)}, ${originX}, ${originY})`}>
                        <path
                          d={path}
                          fill="url(#alloyMetal)"
                          stroke="#7c2d12"
                          strokeWidth="1.2"
                          style={{ transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                        />
                        <path
                          d={`M ${geo.x + 10} ${alloyY + 2} L ${geo.x + 13} ${geo.y + geo.h - 2} L ${geo.x + geo.w - 13} ${geo.y + geo.h - 2} L ${geo.x + geo.w - 10} ${alloyY + 2} Z`}
                          fill="#ffffff"
                          fillOpacity="0.12"
                        />
                      </g>
                    );
                  }

                  if (solid.id === "sodium-amalgam") {
                    const pasteH = geo.h * 0.45;
                    const pasteY = geo.y + geo.h - pasteH;
                    const path = `M ${geo.x} ${geo.y + geo.h} C ${geo.x + geo.w * 0.1} ${pasteY - 5}, ${geo.x + geo.w * 0.3} ${pasteY - 12}, ${geo.x + geo.w * 0.5} ${pasteY - 8} C ${geo.x + geo.w * 0.7} ${pasteY - 15}, ${geo.x + geo.w * 0.9} ${pasteY - 4}, ${geo.x + geo.w} ${geo.y + geo.h} Z`;
                    return (
                      <g key={`solid-layer-${solid.id}`} transform={`rotate(${-(item.rotation || 0)}, ${originX}, ${originY})`}>
                        <path
                          d={path}
                          fill="url(#amalgamMetal)"
                          stroke="#94a3b8"
                          strokeWidth="1"
                          style={{ transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                        />
                        <path
                          d={`M ${geo.x + geo.w * 0.25} ${pasteY - 2} Q ${geo.x + geo.w * 0.5} ${pasteY - 6} ${geo.x + geo.w * 0.75} ${pasteY - 2}`}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeOpacity="0.4"
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  }

                  if (solid.id === "palladium-plate" || solid.id === "palladium-adsorbed") {
                    const isAdsorbed = solid.id === "palladium-adsorbed";
                    const plateW = geo.w * 0.7;
                    const plateH = geo.h * 0.55;
                    const plateX = geo.x + geo.w * 0.15;
                    const plateY = geo.y + geo.h - plateH - 10;

                    return (
                      <g key={`solid-layer-${solid.id}`} transform={`rotate(${10 - (item.rotation || 0)}, ${originX}, ${originY})`}>
                        <rect
                          x={plateX}
                          y={plateY}
                          width={plateW}
                          height={plateH}
                          rx={3}
                          fill="url(#pdMetal)"
                          stroke={isAdsorbed ? "#38bdf8" : "#cbd5e1"}
                          strokeWidth={isAdsorbed ? 2.5 : 1}
                          filter={isAdsorbed ? "url(#adsorbedGlow)" : undefined}
                          style={{ transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                        />
                        <rect x={plateX + 2} y={plateY + 2} width={4} height={plateH - 4} fill="#ffffff" fillOpacity="0.2" />
                        {isAdsorbed && (
                          <g opacity="0.8">
                            <circle cx={plateX + plateW * 0.25} cy={plateY + plateH * 0.3} r="1.5" fill="#38bdf8" />
                            <circle cx={plateX + plateW * 0.45} cy={plateY + plateH * 0.7} r="2" fill="#38bdf8" />
                            <circle cx={plateX + plateW * 0.75} cy={plateY + plateH * 0.25} r="1.5" fill="#38bdf8" />
                            <circle cx={plateX + plateW * 0.8} cy={plateY + plateH * 0.6} r="2.5" fill="#e0f2fe" />
                            <circle cx={plateX + plateW * 0.55} cy={plateY + plateH * 0.4} r="1.5" fill="#38bdf8" />
                            <circle cx={plateX + plateW * 0.35} cy={plateY + plateH * 0.8} r="1.5" fill="#e0f2fe" />
                            <circle cx={plateX + plateW * 0.65} cy={plateY + plateH * 0.75} r="2" fill="#38bdf8" />
                          </g>
                        )}
                      </g>
                    );
                  }

                  if (solid.id === "camphor") {
                    const camphorMass = solid.mass ?? 10;
                    const scale = Math.max(0.18, Math.min(1.0, camphorMass / 10)); // shrink as mass decreases!
                    return (
                      <g
                        key={`solid-layer-${solid.id}`}
                        transform={`rotate(${-(item.rotation || 0)}, ${originX}, ${originY}) translate(${geo.x + geo.w / 2}, ${geo.y + geo.h - 5}) scale(${scale})`}
                        style={{ transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)" }}
                      >
                        {/* Pearlescent camphor crystal cluster */}
                        <defs>
                          <radialGradient id={`camphorShine-${item.instanceId}`} cx="35%" cy="30%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                            <stop offset="45%" stopColor="#e8f4fd" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#b8cfe8" stopOpacity="0.7" />
                          </radialGradient>
                          <radialGradient id={`camphorShine2-${item.instanceId}`} cx="60%" cy="25%" r="55%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                            <stop offset="60%" stopColor="#ddeef8" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#a0b8d0" stopOpacity="0.6" />
                          </radialGradient>
                          <filter id={`camphorGlow-${item.instanceId}`} x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>
                        <g opacity="0.97" filter={isCamphorSublimationing ? `url(#camphorGlow-${item.instanceId})` : undefined}>
                          {/* Main large crystal - rhombus shape, fades slightly as it sublimates */}
                          <polygon
                            points="-28,2 -8,-18 22,-8 6,14"
                            fill={`url(#camphorShine-${item.instanceId})`}
                            stroke="#cde0f0"
                            strokeWidth="1.2"
                            opacity={0.5 + scale * 0.5}
                          />
                          {/* Top facet highlight */}
                          <polygon points="-28,2 -8,-18 6,14" fill="#ffffff" fillOpacity="0.45" />
                          {/* Right facet shadow */}
                          <polygon points="-8,-18 22,-8 6,14" fill="#90b0cc" fillOpacity="0.25" />
                          {/* Glint spot on crystal 1 */}
                          <ellipse cx="-12" cy="-10" rx="5" ry="3" fill="#ffffff" fillOpacity="0.7" transform="rotate(-20,-12,-10)" />

                          {/* Second crystal block */}
                          <polygon
                            points="-2,-6 22,-24 38,-8 12,10"
                            fill={`url(#camphorShine2-${item.instanceId})`}
                            stroke="#cde0f0"
                            strokeWidth="1.2"
                            opacity={0.4 + scale * 0.6}
                          />
                          <polygon points="-2,-6 22,-24 12,10" fill="#ffffff" fillOpacity="0.4" />
                          <polygon points="22,-24 38,-8 12,10" fill="#7090b0" fillOpacity="0.2" />
                          {/* Glint on crystal 2 */}
                          <ellipse cx="16" cy="-16" rx="4" ry="2.5" fill="#ffffff" fillOpacity="0.65" transform="rotate(-15,16,-16)" />

                          {/* Third smaller crystal on top */}
                          <polygon
                            points="-18,6 2,-12 16,-2 -2,16"
                            fill={`url(#camphorShine-${item.instanceId})`}
                            stroke="#cde0f0"
                            strokeWidth="1"
                            opacity={0.4 + scale * 0.6}
                          />
                          <polygon points="-18,6 2,-12 -2,16" fill="#ffffff" fillOpacity="0.5" />
                          {/* Sharp top glint */}
                          <ellipse cx="-8" cy="-4" rx="3.5" ry="2" fill="#ffffff" fillOpacity="0.8" transform="rotate(-25,-8,-4)" />

                          {/* Tiny accent crystal at base */}
                          <polygon points="10,8 24,-4 30,4 16,14" fill="#e8f4fd" fillOpacity="0.85" stroke="#cde0f0" strokeWidth="0.8" opacity={scale} />
                          <polygon points="10,8 24,-4 16,14" fill="#ffffff" fillOpacity="0.4" />
                        </g>

                        {/* Sublimation micro-particle wisps rising off crystals */}
                        {isCamphorSublimationing && Array.from({ length: 12 }).map((_, pi) => {
                          const pxOff = [-24, -14, -6, 2, 10, 18, 26, -18, -2, 8, 20, -10][pi];
                          const pDur = [1.4, 1.9, 1.6, 2.2, 1.3, 1.8, 2.0, 1.5, 2.3, 1.7, 1.2, 2.1][pi];
                          const pDelay = [0, 0.3, 0.7, 0.15, 0.9, 0.45, 0.6, 0.2, 0.8, 0.05, 1.1, 0.5][pi];
                          // Nitrogen makes particles go higher and faster
                          const heightMult = hasNitrogenGas ? 2.5 : 1.0;
                          const topY = -30 * heightMult;
                          const midY = -15 * heightMult;
                          return (
                            <circle key={`sublim-${pi}`} cx={pxOff} cy="-5" r={2.2 + (pi % 4) * 0.7}
                              fill={hasNitrogenGas ? "#c8e8f8" : "#e0eef8"} fillOpacity="0">
                              <animate attributeName="cy" values={`-5;${midY};${topY}`} dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                              <animate attributeName="fillOpacity" values={`0;${hasNitrogenGas ? 0.9 : 0.7};0`} dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                              <animate attributeName="r" values={`${2.2+(pi%4)*0.7};${3.5+(pi%4)*1.0};0.5`} dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                              <animate attributeName="cx" values={`${pxOff};${pxOff + (pi%2===0?4:-4)};${pxOff + (pi%2===0?8:-8)}`} dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                            </circle>
                          );
                        })}

                        {/* Nitrogen dissolution stream — large fast-rising plumes */}
                        {hasNitrogenGas && Array.from({ length: 8 }).map((_, pi) => {
                          const pxOff = [-20, -8, 4, 16, -14, 0, 12, -4][pi];
                          const pDur = [0.9, 1.2, 0.8, 1.1, 1.0, 0.7, 1.3, 0.95][pi];
                          const pDelay = [0, 0.25, 0.5, 0.1, 0.7, 0.4, 0.15, 0.6][pi];
                          return (
                            <ellipse key={`n2-plume-${pi}`} cx={pxOff} cy="-8" rx={3} ry={5}
                              fill="#ddf0fc" fillOpacity="0">
                              <animate attributeName="cy" values="-8;-30;-60;-90" dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                              <animate attributeName="fillOpacity" values="0;0.85;0.5;0" dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                              <animate attributeName="ry" values="5;9;14;18" dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                              <animate attributeName="rx" values="3;5;8;10" dur={`${pDur}s`} repeatCount="indefinite" begin={`${pDelay}s`} />
                            </ellipse>
                          );
                        })}
                      </g>
                    );
                  }

                  // Powder path with a beautiful curved central mound/heap
                  const powderPath = `M ${geo.x - 200} ${geo.y + geo.h + 200} L ${geo.x - 200} ${solidY} Q ${geo.x + geo.w / 2} ${solidY - 18} ${geo.x + geo.w + 200} ${solidY} L ${geo.x + geo.w + 200} ${geo.y + geo.h + 200} Z`;

                  return (
                    <g key={`solid-layer-${solid.id}`} transform={`rotate(${-(item.rotation || 0)}, ${originX}, ${originY})`}>
                      <path
                        d={powderPath}
                        fill={`url(#powder-pattern-${item.instanceId}-${solid.id})`}
                        style={{ transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}
                      />
                      {/* Powder surface texture dots scattered along the curved mound */}
                      {Array.from({ length: 35 }).map((_, i) => {
                        const hash = (n: number) => {
                          let h = Math.sin(n * 12.9898) * 43758.5453;
                          return h - Math.floor(h);
                        };
                        const t = hash(i); // Normalized position: 0 to 1
                        const dotX = t * geo.w;

                        // Calculate Y coordinate on the quadratic curve
                        const y0 = solidY;
                        const y1 = solidY - 18;
                        const y2 = solidY;
                        const curveY = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;

                        const dotY = curveY + (hash(i + 50) - 0.5) * 8;
                        const r = 1.0 + hash(i + 100) * 1.8;
                        return (
                          <circle
                            key={`solid-surface-dot-${solid.id}-${i}`}
                            cx={geo.x + dotX}
                            cy={dotY}
                            r={r}
                            fill={sColor}
                            opacity="0.95"
                          />
                        );
                      })}
                    </g>
                  );
                });
              })()}
            </g>
          )}

          {/* Overflow drip — shows when full */}
          {hasLiquid && isOverflow && (
            <g>
              {/* Left drip */}
              {isActivelyPouring && (
                <ellipse cx={geo.x - 4} cy={geo.y + 8} rx={4} ry={6} fill={color} fillOpacity="0.7">
                  <animate attributeName="cy" values={`${geo.y};${geo.y + geo.h + 30}`} dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="fillOpacity" values="0.7;0" dur="1.2s" repeatCount="indefinite" />
                </ellipse>
              )}
              {/* Right drip */}
              {isActivelyPouring && (
                <ellipse cx={geo.x + geo.w + 4} cy={geo.y + 14} rx={3} ry={5} fill={color} fillOpacity="0.6">
                  <animate attributeName="cy" values={`${geo.y + 10};${geo.y + geo.h + 30}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="fillOpacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
                </ellipse>
              )}
              {/* Overflow pool below vessel */}
              <ellipse
                cx={geo.x + geo.w / 2}
                cy={geo.y + geo.h + 36}
                rx={geo.w * 0.55}
                ry={5}
                fill={color}
                fillOpacity="0.35"
              />
            </g>
          )}

          {/* Solids spill when overflowing */}
          {solids.length > 0 && isOverflow && (
            <g>
              {/* Left solid spill particles */}
              {isActivelyPouring && Array.from({ length: 4 }).map((_, i) => (
                <circle key={`left-solid-spill-${i}`} cx={geo.x - 3} cy={geo.y + 6} r={1.5 + i * 0.5} fill={solidColor} opacity="0.8">
                  <animate attributeName="cy" values={`${geo.y};${geo.y + geo.h + 20}`} dur={`${0.8 + i * 0.2}s`} repeatCount="indefinite" begin={`${i * 0.15}s`} />
                  <animate attributeName="opacity" values="0.8;0" dur={`${0.8 + i * 0.2}s`} repeatCount="indefinite" begin={`${i * 0.15}s`} />
                </circle>
              ))}
              {/* Right solid spill particles */}
              {isActivelyPouring && Array.from({ length: 4 }).map((_, i) => (
                <circle key={`right-solid-spill-${i}`} cx={geo.x + geo.w + 3} cy={geo.y + 6} r={1.5 + i * 0.5} fill={solidColor} opacity="0.8">
                  <animate attributeName="cy" values={`${geo.y};${geo.y + geo.h + 20}`} dur={`${0.9 + i * 0.15}s`} repeatCount="indefinite" begin={`${i * 0.1}s`} />
                  <animate attributeName="opacity" values="0.8;0" dur={`${0.9 + i * 0.15}s`} repeatCount="indefinite" begin={`${i * 0.1}s`} />
                </circle>
              ))}
              {/* Overflow pool/heap below vessel */}
              <ellipse
                cx={geo.x + geo.w / 2}
                cy={geo.y + geo.h + 36}
                rx={geo.w * 0.55}
                ry={5}
                fill={solidColor}
                fillOpacity="0.4"
              />
            </g>
          )}

          {/* Gas cloud inside the vessel boundaries */}
          {showBubbles && (
            <g clipPath={`url(#vessel-clip-${item.instanceId})`}>
              {/* Ambient backdrop gas scaling dynamically from bottom up */}
              <rect
                x={geo.x - 10}
                y={gasCloudY}
                width={geo.w + 20}
                height={gasCloudH}
                fill={gasColor}
                opacity={gasOpacity}
                className="chemistry-gas-cloud animate-pulse"
                style={{
                  filter: `blur(${hasMist ? 16 : Math.min(28, Math.max(8, liquidH * 0.15))}px)`,
                  transformOrigin: `${geo.x + geo.w / 2}px ${gasCloudY + gasCloudH / 2}px`,
                }}
              />
              {gasFill && (() => {
                const side = gasFill.side;
                const horizontal = side === "left" || side === "right";
                const sign = side === "left" || side === "top" ? 1 : -1;
                const inletX = side === "left" ? geo.x + 5 : side === "right" ? geo.x + geo.w - 5 : geo.x + geo.w * 0.5;
                const inletY = side === "top" ? geo.y + 5 : side === "bottom" ? geo.y + geo.h - 5 : geo.y + geo.h * 0.47;
                const jetLength = horizontal ? geo.w * 0.68 : geo.h * 0.68;
                const travelX = horizontal ? sign * jetLength : 0;
                const travelY = horizontal ? 0 : sign * jetLength;
                const crossX = horizontal ? 0 : 1;
                const crossY = horizontal ? 1 : 0;
                const fillOpacity = 0.2 + gasFill.progress * 0.22;

                return (
                  <g>
                    <ellipse
                      cx={inletX + travelX * 0.36}
                      cy={inletY + travelY * 0.36}
                      rx={horizontal ? geo.w * 0.32 : geo.w * 0.42}
                      ry={horizontal ? geo.h * 0.34 : geo.h * 0.26}
                      fill={gasFill.color}
                      opacity={fillOpacity}
                      filter="blur(16px)"
                    >
                      <animate attributeName="opacity" values={`${fillOpacity * 0.5};${fillOpacity};${fillOpacity * 0.55}`} dur="1.8s" repeatCount="indefinite" />
                    </ellipse>
                    <path
                      d={`M ${inletX} ${inletY} C ${inletX + travelX * 0.22} ${inletY + travelY * 0.22}, ${inletX + travelX * 0.44} ${inletY + travelY * 0.44}, ${inletX + travelX * 0.76} ${inletY + travelY * 0.76}`}
                      fill="none"
                      stroke={gasFill.color}
                      strokeWidth="18"
                      strokeLinecap="round"
                      opacity="0.2"
                      filter="blur(8px)"
                    >
                      <animate attributeName="stroke-width" values="10;22;14" dur="1.15s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.08;0.28;0.1" dur="1.15s" repeatCount="indefinite" />
                    </path>
                    {Array.from({ length: 14 }).map((_, i) => {
                      const band = (i % 5) - 2;
                      const startX = inletX + crossX * band * 5;
                      const startY = inletY + crossY * band * 5;
                      const endX = inletX + travelX * (0.45 + (i % 4) * 0.12) + crossX * band * 12;
                      const endY = inletY + travelY * (0.45 + (i % 4) * 0.12) + crossY * band * 12;
                      const size = 3.5 + (i % 4) * 1.8;
                      const delay = i * 0.09;
                      return (
                        <circle
                          key={`gas-fill-${i}`}
                          cx={startX}
                          cy={startY}
                          r={size}
                          fill={gasFill.color}
                          opacity="0"
                          filter="blur(3px)"
                        >
                          <animate attributeName="cx" values={`${startX};${endX}`} dur="1.1s" repeatCount="indefinite" begin={`${delay}s`} />
                          <animate attributeName="cy" values={`${startY};${endY}`} dur="1.1s" repeatCount="indefinite" begin={`${delay}s`} />
                          <animate attributeName="r" values={`${size * 0.5};${size * 1.4};${size * 2.1}`} dur="1.1s" repeatCount="indefinite" begin={`${delay}s`} />
                          <animate attributeName="opacity" values="0;0.58;0" dur="1.1s" repeatCount="indefinite" begin={`${delay}s`} />
                        </circle>
                      );
                    })}
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ellipse
                        key={`gas-fill-ring-${i}`}
                        cx={inletX}
                        cy={inletY}
                        rx={horizontal ? 5 : 13}
                        ry={horizontal ? 13 : 5}
                        fill="none"
                        stroke={gasFill.color}
                        strokeWidth="2"
                        opacity="0"
                      >
                        <animate attributeName="rx" values={`${horizontal ? 5 : 13};${horizontal ? 28 : 44}`} dur="1.3s" repeatCount="indefinite" begin={`${i * 0.32}s`} />
                        <animate attributeName="ry" values={`${horizontal ? 13 : 5};${horizontal ? 44 : 28}`} dur="1.3s" repeatCount="indefinite" begin={`${i * 0.32}s`} />
                        <animate attributeName="opacity" values="0;0.45;0" dur="1.3s" repeatCount="indefinite" begin={`${i * 0.32}s`} />
                      </ellipse>
                    ))}
                  </g>
                );
              })()}
              {/* Camphor vapor swirling wisps inside vessel */}
              {hasCamphorVapor && (() => {
                const camphorWisps = Array.from({ length: 8 }).map((_, wi) => {
                  const hash = (n: number) => { let h = Math.sin(n * 12.9898) * 43758.5453; return h - Math.floor(h); };
                  return {
                    cx: geo.x + geo.w * (0.15 + hash(wi * 3) * 0.7),
                    r: 6 + hash(wi * 7) * 10,
                    dur: 2.5 + hash(wi * 11) * 2.0,
                    delay: hash(wi * 5) * 3.0,
                    startY: geo.y + geo.h * (0.3 + hash(wi * 9) * 0.6),
                    endY: geo.y + hash(wi * 13) * geo.h * 0.2,
                  };
                });
                return camphorWisps.map((w, wi) => (
                  <circle key={`camphor-wisp-${wi}`}
                    cx={w.cx} cy={w.startY} r={w.r}
                    fill="#e8f4fd" fillOpacity="0"
                  >
                    <animate attributeName="cy"
                      values={`${w.startY};${w.startY - (w.startY - w.endY) * 0.5};${w.endY}`}
                      dur={`${w.dur}s`} repeatCount="indefinite" begin={`${w.delay}s`}
                    />
                    <animate attributeName="fillOpacity"
                      values="0;0.22;0.15;0"
                      dur={`${w.dur}s`} repeatCount="indefinite" begin={`${w.delay}s`}
                    />
                    <animate attributeName="r"
                      values={`${w.r * 0.6};${w.r};${w.r * 1.4};${w.r * 1.8}`}
                      dur={`${w.dur}s`} repeatCount="indefinite" begin={`${w.delay}s`}
                    />
                  </circle>
                ));
              })()}

              {/* Rising real gas bubbles scaling with filled height */}
              {showBubbleParticles && (() => {
                const bubbleSpecs = Array.from({ length: 40 }).map((_, idx) => {
                  const hash = (n: number) => {
                    let h = Math.sin(n * 12.9898) * 43758.5453;
                    return h - Math.floor(h);
                  };
                  return {
                    xOffset: 0.15 + hash(idx) * 0.7, // Scatter across 15% to 85% width
                    r: 3.5 + hash(idx + 10) * 7.5,   // Radius between 3.5px and 11px
                    dur: 1.4 + hash(idx + 20) * 1.6, // Duration between 1.4s and 3.0s
                    delay: hash(idx + 30) * 8.0,     // Stagger start times up to 8s
                    wobble1: -16 + hash(idx + 40) * 32, // wobble at 25% height (-16px to +16px)
                    wobble2: -28 + hash(idx + 50) * 56, // wobble at 50% height (-28px to +28px)
                    wobble3: -20 + hash(idx + 60) * 40, // wobble at 75% height (-20px to +20px)
                    wobble4: -32 + hash(idx + 70) * 64, // final offset at 100% height (-32px to +32px)
                  };
                });

                const maxBubbles = bubbleSpecs.length;
                const bubbleCount = isVisuallyBoiling
                  ? Math.max(1, Math.ceil(maxBubbles * boilingIntensity))
                  : maxBubbles;
                const activeSpecs = bubbleSpecs.slice(0, bubbleCount);

                return activeSpecs.map((spec, idx) => {
                  const cx = geo.x + geo.w * spec.xOffset;
                  const scaleMultiplier = isVisuallyBoiling ? (0.4 + 0.7 * boilingIntensity) : 1;

                  return (
                    <g key={`gas-bubble-${idx}`} transform={`translate(${cx}, ${geo.y + geo.h})`}>
                      <g
                        className="chemistry-bubble-item"
                        style={{
                          '--liquid-h': `${liquidH}px`,
                          '--wobble-1': `${spec.wobble1}px`,
                          '--wobble-2': `${spec.wobble2}px`,
                          '--wobble-3': `${spec.wobble3}px`,
                          '--wobble-4': `${spec.wobble4}px`,
                          '--bubble-dur': `${spec.dur}s`,
                          '--bubble-delay': `${spec.delay}s`,
                          '--bubble-scale-start': 0.4 * scaleMultiplier,
                          '--bubble-scale-mid': 0.8 * scaleMultiplier,
                          '--bubble-scale-end': 1.15 * scaleMultiplier,
                        } as React.CSSProperties}
                      >
                        {/* Bubble main body */}
                        <circle
                          cx="0"
                          cy="0"
                          r={spec.r}
                          fill={color}
                          fillOpacity={currentBodyOpacity}
                          stroke="#ffffff"
                          strokeOpacity="0.65"
                          strokeWidth="1.2"
                        />
                        {/* Highlight glint (creates 3D reflection) */}
                        <circle
                          cx={-spec.r * 0.3}
                          cy={-spec.r * 0.3}
                          r={spec.r * 0.22}
                          fill="#ffffff"
                          fillOpacity={currentGlintOpacity}
                        />
                      </g>
                    </g>
                  );
                });
              })()}

              {/* Ambient slow-moving gas particles for vessels filled with pure gas (no liquid) */}
              {hasGas && !hasLiquid && !hasMist && !hasChloroformVapor && !hasCamphorVapor && (() => {
                const ambientSpecs = Array.from({ length: 15 }).map((_, idx) => {
                  const hash = (n: number) => { let h = Math.sin(n * 12.9898) * 43758.5453; return h - Math.floor(h); };
                  return {
                    cx: geo.x + geo.w * (0.1 + hash(idx * 2) * 0.8),
                    cy: geo.y + geo.h * (0.1 + hash(idx * 3) * 0.8),
                    r: 8 + hash(idx * 5) * 12,
                    dur: 4 + hash(idx * 7) * 3,
                    delay: hash(idx * 11) * 5,
                    moveX: (hash(idx * 13) - 0.5) * 20,
                    moveY: (hash(idx * 17) - 0.5) * 20,
                  };
                });
                return ambientSpecs.map((spec, idx) => (
                  <circle
                    key={`ambient-gas-${idx}`}
                    cx={spec.cx}
                    cy={spec.cy}
                    r={spec.r}
                    fill={color}
                    fillOpacity="0.25"
                    filter="blur(4px)"
                  >
                    <animate attributeName="cx" values={`${spec.cx};${spec.cx + spec.moveX};${spec.cx}`} dur={`${spec.dur}s`} repeatCount="indefinite" begin={`${spec.delay}s`} />
                    <animate attributeName="cy" values={`${spec.cy};${spec.cy + spec.moveY};${spec.cy}`} dur={`${spec.dur}s`} repeatCount="indefinite" begin={`${spec.delay}s`} />
                    <animate attributeName="fillOpacity" values="0.15;0.35;0.15" dur={`${spec.dur}s`} repeatCount="indefinite" begin={`${spec.delay}s`} />
                  </circle>
                ));
              })()}
            </g>
          )}

        </svg>
      )}

      {/* Escaping gas smoke particles rising from open mouths */}
      {showBubbles && (() => {
        const escapingMouths: { x: number; y: number }[] = [];
        if (item.id === "three-neck-flask") {
          if (item.isOpenLeft && !isVesselNeckConnectedToPipe(item, "left", pipes)) escapingMouths.push({ x: 41, y: 32 });
          if (item.isOpenMiddle && !isVesselNeckConnectedToPipe(item, "middle", pipes)) escapingMouths.push({ x: 106, y: 17 });
          if (item.isOpenRight && !isVesselNeckConnectedToPipe(item, "right", pipes)) escapingMouths.push({ x: 170, y: 32 });
        } else if (item.id === "evaporation-chamber") {
          if (item.isOpenLeft && !isVesselNeckConnectedToPipe(item, "left", pipes)) escapingMouths.push({ x: 15, y: 107 });
          if (item.isOpenMiddle && !isVesselNeckConnectedToPipe(item, "middle", pipes)) escapingMouths.push({ x: 100, y: 10 });
          if (item.isOpenRight && !isVesselNeckConnectedToPipe(item, "right", pipes)) escapingMouths.push({ x: 185, y: 107 });
        } else {
          const isOpen = item.id.includes("beaker") || item.id.includes("funnel") || item.id === "china-dish" || item.id === "mortar-pestle" || item.id === "crucible"
            ? true
            : (item.isOpen !== false && !item.hasRubberStopper);
          if (isOpen && !isVesselPipeConnected(item, pipes)) {
            escapingMouths.push({ x: vbW / 2, y: geo.y + 15 });
          }
        }

        if (escapingMouths.length === 0) return null;

        return (
          <div className="absolute inset-0 pointer-events-none z-30">
            {escapingMouths.map((mouth, mIdx) => {
              const leftPercent = (mouth.x / vbW) * 100;
              const topPercent = (mouth.y / vbH) * 100;

              return (
                <div
                  key={`escaping-mouth-smoke-${mIdx}`}
                  className="absolute pointer-events-none chemistry-escaping-smoke"
                  style={{
                    left: `calc(${leftPercent}% - 30px)`,
                    top: `calc(${topPercent}% - 150px)`,
                    width: '60px',
                    height: '150px',
                  }}
                >
                  {Array.from({ length: 4 }).map((_, i) => {
                    const delay = i * 0.5;
                    const size = 16 + (i % 3) * 6; // sizes between 16px and 28px
                    const leftOffset = 15 + (i % 3) * 8; // horizontal offsets to stagger them
                    return (
                      <span
                        key={`smoke-${mIdx}-${i}`}
                        style={{
                          left: `${leftOffset}px`,
                          width: `${size}px`,
                          height: `${size}px`,
                          animationDelay: `${delay}s`,
                          background: `radial-gradient(circle, ${gasColor} 0%, transparent 75%)`,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })()}

      {(heated || reactionState === "boiling" || reactionState === "heating") && (() => {
        const steamMouths: { x: number; y: number }[] = [];
        if (item.id === "three-neck-flask") {
          if (item.isOpenLeft && !isVesselNeckConnectedToPipe(item, "left", pipes)) steamMouths.push({ x: 41, y: 32 });
          if (item.isOpenMiddle && !isVesselNeckConnectedToPipe(item, "middle", pipes)) steamMouths.push({ x: 106, y: 17 });
          if (item.isOpenRight && !isVesselNeckConnectedToPipe(item, "right", pipes)) steamMouths.push({ x: 170, y: 32 });
        } else if (item.id === "evaporation-chamber") {
          if (item.isOpenLeft && !isVesselNeckConnectedToPipe(item, "left", pipes)) steamMouths.push({ x: 15, y: 107 });
          if (item.isOpenMiddle && !isVesselNeckConnectedToPipe(item, "middle", pipes)) steamMouths.push({ x: 100, y: 10 });
          if (item.isOpenRight && !isVesselNeckConnectedToPipe(item, "right", pipes)) steamMouths.push({ x: 185, y: 107 });
        } else {
          const isOpen = item.id.includes("beaker") || item.id.includes("funnel") || item.id === "china-dish" || item.id === "mortar-pestle" || item.id === "crucible"
            ? true
            : (item.isOpen !== false && !item.hasRubberStopper);
          if (isOpen && !isVesselPipeConnected(item, pipes)) {
            steamMouths.push({ x: vbW / 2, y: geo.y + 15 });
          }
        }

        if (steamMouths.length === 0) return null;

        return (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: boilingIntensity }}>
            {steamMouths.map((mouth, mIdx) => {
              const leftPercent = (mouth.x / vbW) * 100;
              const topPercent = (mouth.y / vbH) * 100;

              return (
                <div
                  key={`steam-mouth-${mIdx}`}
                  className="absolute pointer-events-none chemistry-steam"
                  style={{
                    left: `calc(${leftPercent}% - 30px)`,
                    top: `calc(${topPercent}% - 120px)`,
                    width: '60px',
                    height: '120px',
                  }}
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={`steam-${mIdx}-${i}`}
                      style={{
                        left: `${15 + i * 25}%`,
                        animationDelay: `${i * 0.35}s`,
                        width: '12px',
                        height: '60px',
                        filter: 'blur(6px)',
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}

      {reactionState === "reduction" && (
        <div className="absolute left-[55px] top-[98px] h-12 w-16 rounded-full border border-orange-300/40 bg-orange-500/35 chemistry-heat-glow" />
      )}
    </div>
  );
}

function VesselRubberStopper({ id }: { id: string }) {
  let stopperStyle: React.CSSProperties = {};

  if (id === "round-bottom-flask") {
    stopperStyle = { left: "42%", top: "0%", width: "16%", height: "16%" };
  } else if (id === "glass-bottle" || id === "measure-bottle") {
    stopperStyle = { left: "39%", top: "5%", width: "22%", height: "15%" };
  } else if (id === "gas-jar") {
    stopperStyle = { left: "38%", top: "5%", width: "24%", height: "15%" };
  } else if (id === "separatory-funnel") {
    stopperStyle = { left: "44%", top: "3%", width: "12%", height: "10%" };
  } else if (id.includes("erlenmeyer")) {
    stopperStyle = { left: "41%", top: "5%", width: "18%", height: "15%" };
  } else if (id === "three-neck-flask") {
    stopperStyle = { left: "43%", top: "5%", width: "14%", height: "15%" };
  } else if (id === "test-tube") {
    stopperStyle = { left: "36%", top: "2%", width: "28%", height: "15%" };
  } else if (id === "test-tube-small") {
    stopperStyle = { left: "40%", top: "4%", width: "20%", height: "15%" };
  } else if (id === "test-tube-mini") {
    stopperStyle = { left: "44%", top: "16%", width: "12%", height: "12%" };
  } else if (id === "evaporation-chamber") {
    stopperStyle = { left: "42.5%", top: "4%", width: "15%", height: "12%" };
  } else {
    return null;
  }

  return (
    <div className="absolute z-30 pointer-events-none" style={stopperStyle}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M25 20 L75 20 L65 80 L35 80 Z" fill="#475569" stroke="#1e293b" strokeWidth="4" />
      </svg>
    </div>
  );
}

interface VesselPopupProps {
  item: PlacedInorganicItem;
  left: number;
  top: number;
  onUpdate: (id: string, updates: Partial<PlacedInorganicItem>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  hasGloves?: boolean;
  isHeated?: boolean;
}

function VesselPopup({ item, left, top, onUpdate, onRemove, onClose, hasGloves, isHeated }: VesselPopupProps) {
  const [activeParam, setActiveParam] = useState<string>("Temperature");

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const liquidContent = item.state === "glassware"
    ? item.contents?.find(c => c.state === "liquid" || c.state === "gas")
    : null;
  const volumeValue = item.state === "glassware"
    ? (liquidContent ? (liquidContent.volume ?? 0) : 0)
    : (item.volume ?? (item.id.includes("100") ? 100 : item.id.includes("250") ? 250 : 1000));

  const solidContent = item.state === "glassware"
    ? item.contents?.find(c => c.state === "solid")
    : null;
  const massValue = item.state === "glassware"
    ? (solidContent ? (solidContent.mass ?? solidContent.volume ?? 0) : 0)
    : (item.mass ?? 10);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (item.state === "glassware") {
      let newContents = [...(item.contents || [])];
      if (liquidContent) {
        newContents = newContents.map(c =>
          c.id === liquidContent.id ? { ...c, volume: val } : c
        ).filter(c => (c.volume ?? 0) > 0.01 || c.state !== "gas");
      } else if (val > 0) {
        newContents.push({
          id: "water",
          module: "inorganic",
          category: "liquids",
          name: "Water",
          symbol: "H2O",
          state: "liquid",
          accent: "#38bdf8",
          volume: val,
          description: "Pure water."
        });
      }
      const reaction = resolveReaction(newContents, item.id, hasGloves, isHeated);
      onUpdate(item.instanceId, {
        contents: reaction.contents,
        reactionState: reaction.state ?? "idle",
        note: reaction.note
      });
    } else {
      onUpdate(item.instanceId, { volume: val });
    }
  };

  const handleMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (item.state === "glassware") {
      let newContents = [...(item.contents || [])];
      if (solidContent) {
        newContents = newContents.map(c =>
          c.id === solidContent.id ? { ...c, mass: val, volume: val } : c
        ).filter(c => (c.volume ?? 0) > 0.01 || (c.mass ?? 0) > 0.01);
      } else if (val > 0) {
        newContents.push({
          id: "iron",
          module: "inorganic",
          category: "solids",
          name: "Iron Powder",
          symbol: "Fe",
          state: "solid",
          accent: "#94a3b8",
          mass: val,
          volume: val,
          description: "Pure iron powder."
        });
      }
      const reaction = resolveReaction(newContents, item.id, hasGloves, isHeated);
      onUpdate(item.instanceId, {
        contents: reaction.contents,
        reactionState: reaction.state ?? "idle",
        note: reaction.note
      });
    } else {
      onUpdate(item.instanceId, { mass: val });
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-[100] w-[320px] bg-[#181c24] border border-[#2e3746] rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] text-white pointer-events-auto select-none"
      style={{ left, top }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-base">{item.name}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition text-xs font-semibold px-1 py-0.5"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {["Temperature", "Volume", "AoS", "Equation", "Concentration", "Mass"].map((param) => {
          const isActive = activeParam === param;
          return (
            <button
              key={param}
              type="button"
              onClick={() => setActiveParam(param)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${isActive
                ? "bg-blue-500/20 border-blue-500 text-white"
                : "bg-[#2b313c]/60 border-[#3a4250] text-slate-300 hover:bg-[#2b313c]"
                }`}
            >
              {param}
            </button>
          );
        })}
      </div>

      <div className="mt-4 bg-[#1e2330] rounded-xl p-3 border border-[#2e3746]">
        {activeParam === "Temperature" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Temperature (°C)</label>
            <input
              type="number"
              value={item.temperature ?? 25}
              onChange={(e) => onUpdate(item.instanceId, { temperature: Number(e.target.value) })}
              className="bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
        )}
        {activeParam === "Volume" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              {liquidContent ? `Volume of ${liquidContent.name} (mL)` : "Volume (mL)"}
            </label>
            <input
              type="number"
              value={volumeValue}
              onChange={handleVolumeChange}
              className="bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
        )}
        {activeParam === "AoS" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">State of Matter / Contents</label>
            <div className="flex flex-wrap gap-1 bg-[#181c24] border border-[#2e3746] rounded-lg p-2 min-h-8">
              {item.contents && item.contents.length > 0 ? (
                item.contents.map((c, idx) => (
                  <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono" style={{ color: c.accent }}>
                    {c.name} ({c.symbol})
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Empty vessel</span>
              )}
            </div>
          </div>
        )}
        {activeParam === "Equation" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Reaction Equation & Details</label>
            <div className="bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-2.5 text-xs text-slate-200 select-all leading-relaxed whitespace-pre-wrap">
              {item.note || "No reaction active"}
            </div>
          </div>
        )}
        {activeParam === "Concentration" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Concentration (M)</label>
            <input
              type="number"
              step="0.01"
              value={item.concentration ?? 0.1}
              onChange={(e) => onUpdate(item.instanceId, { concentration: Number(e.target.value) })}
              className="bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
        )}
        {activeParam === "Mass" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              {solidContent ? `Mass of ${solidContent.name} (g)` : "Mass (g)"}
            </label>
            <input
              type="number"
              value={massValue}
              onChange={handleMassChange}
              className="bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
        )}
      </div>

      <div className={`mt-4 bg-[#1e2330] rounded-xl p-3 border ${item.note ? "border-emerald-500/30" : "border-[#2e3746]"
        }`}>
        <label className={`text-[10px] uppercase tracking-wider font-bold ${item.note ? "text-emerald-400" : "text-slate-400"
          }`}>
          Reaction Result
        </label>
        <div className="text-xs text-slate-200 mt-1.5 leading-relaxed select-all whitespace-pre-wrap">
          {item.note || "No reaction active"}
        </div>
      </div>

      {!item.id.includes("beaker") && !item.id.includes("funnel") && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4 mt-4">
          <span className="text-sm font-medium text-white/90 select-none">Rubber stopper</span>
          <button
            type="button"
            onClick={() => onUpdate(item.instanceId, { hasRubberStopper: !item.hasRubberStopper })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.hasRubberStopper ? "bg-blue-600" : "bg-zinc-700"
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.hasRubberStopper ? "translate-x-5" : "translate-x-0"
                }`}
            />
          </button>
        </div>
      )}

      <div className="space-y-3 mt-4 border-t border-white/8 pt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 w-14 select-none">Label 1</span>
          <input
            type="text"
            placeholder="e.g. Acid"
            value={item.label1 ?? ""}
            onChange={(e) => onUpdate(item.instanceId, { label1: e.target.value })}
            className="flex-1 bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 w-14 select-none">Label 2</span>
          <input
            type="text"
            placeholder="e.g. Dilute"
            value={item.label2 ?? ""}
            onChange={(e) => onUpdate(item.instanceId, { label2: e.target.value })}
            className="flex-1 bg-[#181c24] border border-[#2e3746] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="border-t border-white/8 pt-4 mt-4">
        <button
          type="button"
          onClick={() => {
            onRemove(item.instanceId);
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/35 hover:bg-red-500/20 active:scale-95 text-red-400 text-sm font-semibold transition cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
