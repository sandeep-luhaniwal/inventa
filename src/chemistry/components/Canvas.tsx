"use client";

import React from "react";
import InorganicCanvas from "@/chemistry/components/InorganicCanvas";
import OrganicCanvas from "@/chemistry/components/OrganicCanvas";
import type { ChemistryModule, OrganicBond, OrganicNode, OrganicTool, PlacedInorganicItem } from "@/chemistry/types";

interface CanvasProps {
  module: ChemistryModule;
  inorganic: {
    items: PlacedInorganicItem[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onMove: (id: string, x: number, y: number) => void;
    onCombine: (sourceId: string, targetId: string) => void;
    onDrop: (itemId: string, x: number, y: number, overrides?: Partial<PlacedInorganicItem>) => void;
    onUpdate: (id: string, updates: Partial<PlacedInorganicItem>) => void;
    onRemove: (id: string) => void;
  };
  organic: {
    atoms: OrganicNode[];
    bonds: OrganicBond[];
    selectedNodeId: string | null;
    pendingBondStartId: string | null;
    selectedTool: OrganicTool;
    onCanvasAction: (x: number, y: number) => void;
    onNodeAction: (id: string) => void;
    onMoveNode: (id: string, x: number, y: number) => void;
  };
}

export default function Canvas({ module, inorganic, organic }: CanvasProps) {
  if (module === "inorganic") {
    return (
      <InorganicCanvas
        items={inorganic.items}
        selectedId={inorganic.selectedId}
        onSelect={inorganic.onSelect}
        onMove={inorganic.onMove}
        onCombine={inorganic.onCombine}
        onDrop={inorganic.onDrop}
        onUpdate={inorganic.onUpdate}
        onRemove={inorganic.onRemove}
      />
    );
  }

  return (
    <OrganicCanvas
      atoms={organic.atoms}
      bonds={organic.bonds}
      selectedNodeId={organic.selectedNodeId}
      pendingBondStartId={organic.pendingBondStartId}
      selectedTool={organic.selectedTool}
      onCanvasAction={organic.onCanvasAction}
      onNodeAction={organic.onNodeAction}
      onMoveNode={organic.onMoveNode}
    />
  );
}
