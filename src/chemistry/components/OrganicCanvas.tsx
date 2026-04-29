"use client";

import React, { useRef, useState } from "react";
import type { OrganicBond, OrganicNode, OrganicTool } from "@/chemistry/types";

interface OrganicCanvasProps {
  atoms: OrganicNode[];
  bonds: OrganicBond[];
  selectedNodeId: string | null;
  pendingBondStartId: string | null;
  selectedTool: OrganicTool;
  onCanvasAction: (x: number, y: number) => void;
  onNodeAction: (id: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
  moved: boolean;
}

function getNodeColor(label: string) {
  const colors: Record<string, string> = {
    C: "#0f172a",
    H: "#e2e8f0",
    O: "#ef4444",
    N: "#2563eb",
    Cl: "#16a34a",
    Br: "#ea580c",
    OH: "#ef4444",
    COOH: "#f97316",
    NH2: "#2563eb",
    CH3: "#0f172a",
  };

  return colors[label] ?? "#475569";
}

function getNodeTextColor(label: string) {
  return label === "H" ? "#0f172a" : "#ffffff";
}

function getBondLines(from: OrganicNode, to: OrganicNode, order: OrganicBond["order"]) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const offsetX = (-dy / length) * 7;
  const offsetY = (dx / length) * 7;

  if (order === 1) {
    return [[from.x, from.y, to.x, to.y]];
  }

  if (order === 2) {
    return [
      [from.x + offsetX, from.y + offsetY, to.x + offsetX, to.y + offsetY],
      [from.x - offsetX, from.y - offsetY, to.x - offsetX, to.y - offsetY],
    ];
  }

  if (order === 3) {
    return [
      [from.x, from.y, to.x, to.y],
      [from.x + offsetX * 1.4, from.y + offsetY * 1.4, to.x + offsetX * 1.4, to.y + offsetY * 1.4],
      [from.x - offsetX * 1.4, from.y - offsetY * 1.4, to.x - offsetX * 1.4, to.y - offsetY * 1.4],
    ];
  }

  return [
    [from.x + offsetX * 0.8, from.y + offsetY * 0.8, to.x + offsetX * 0.8, to.y + offsetY * 0.8],
    [from.x - offsetX * 0.8, from.y - offsetY * 0.8, to.x - offsetX * 0.8, to.y - offsetY * 0.8],
  ];
}

function getBondStyle(order: OrganicBond["order"]) {
  if (order === "aromatic") {
    return { stroke: "#8b5cf6", dashArray: "8 8" };
  }

  return { stroke: "#1e293b", dashArray: undefined };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function OrganicCanvas({
  atoms,
  bonds,
  selectedNodeId,
  pendingBondStartId,
  selectedTool,
  onCanvasAction,
  onNodeAction,
  onMoveNode,
}: OrganicCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const nodeMap = new Map(atoms.map((atom) => [atom.id, atom]));

  const handleSurfaceClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !surfaceRef.current || dragState?.moved) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    onCanvasAction(event.clientX - rect.left, event.clientY - rect.top);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState || !surfaceRef.current) return;

    const rect = surfaceRef.current.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left - dragState.offsetX, 28, rect.width - 28);
    const y = clamp(event.clientY - rect.top - dragState.offsetY, 28, rect.height - 28);

    onMoveNode(dragState.id, x, y);
    setDragState((current) => (current ? { ...current, moved: true } : current));
  };

  const handleMouseUp = () => {
    if (dragState && !dragState.moved) {
      onNodeAction(dragState.id);
    }
    setDragState(null);
  };

  return (
    <div
      ref={surfaceRef}
      className="relative h-full min-h-0 overflow-hidden bg-[#3a3f47]"
      onClick={handleSurfaceClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:28px_28px]" />

      {atoms.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-[680px] rounded-[28px] border border-dashed border-white/10 bg-black/8 px-6 py-8 text-center backdrop-blur lg:max-w-xl lg:rounded-[32px] lg:px-8 lg:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Organic workspace</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white/92 lg:text-3xl">Draw molecular structures</h3>
            <p className="mt-4 text-sm leading-7 text-white/55 lg:text-base">
              Choose an atom, bond, ring or group from the left panel. Click the canvas to place fragments and click
              two atoms in bond mode to connect them.
            </p>
          </div>
        </div>
      )}

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {bonds.map((bond) => {
          const from = nodeMap.get(bond.from);
          const to = nodeMap.get(bond.to);
          if (!from || !to) return null;

          const bondStyle = getBondStyle(bond.order);
          return (
            <g key={bond.id}>
              {getBondLines(from, to, bond.order).map((line, index) => (
                <line
                  key={`${bond.id}-${index}`}
                  x1={line[0]}
                  y1={line[1]}
                  x2={line[2]}
                  y2={line[3]}
                  stroke={bondStyle.stroke}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={bondStyle.dashArray}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {atoms.map((atom) => {
        const active = atom.id === selectedNodeId;
        const pending = atom.id === pendingBondStartId;
        const color = getNodeColor(atom.label);

        return (
          <button
            key={atom.id}
            type="button"
            onMouseDown={(event) => {
              event.stopPropagation();
              const rect = surfaceRef.current?.getBoundingClientRect();
              if (!rect) return;

              setDragState({
                id: atom.id,
                offsetX: event.clientX - rect.left - atom.x,
                offsetY: event.clientY - rect.top - atom.y,
                moved: false,
              });
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-4 py-3 text-sm font-semibold shadow-lg transition ${
              active ? "scale-105 shadow-[0_8px_32px_rgba(34,211,238,0.28)]" : ""
            } ${pending ? "ring-4 ring-fuchsia-200" : ""}`}
            style={{
              left: atom.x,
              top: atom.y,
              minWidth: atom.label.length > 2 ? 70 : 54,
              color: getNodeTextColor(atom.label),
              backgroundColor: color,
              borderColor: active ? "#22d3ee" : "#ffffff",
            }}
          >
            {atom.label}
          </button>
        );
      })}

      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/8 bg-[#23272d]/92 px-3 py-2.5 shadow-2xl shadow-black/18 backdrop-blur lg:left-6 lg:top-6 lg:px-4 lg:py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">Current tool</p>
        <p className="mt-2 text-base font-semibold text-white lg:text-lg">{selectedTool.label}</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-white/58 lg:text-sm lg:leading-6">{selectedTool.description}</p>
      </div>
    </div>
  );
}
