"use client";

import React from "react";
import type { InorganicLibraryItem } from "@/chemistry/types";
import {
  GasJarAsset,
  GlassBottleAsset,
  MeasureBottleAsset,
  RoundBottomFlaskAsset,
  SeparatoryFunnelAsset,
  TestTubeAsset,
} from "./LabAssets";

interface ReactionVesselPanelProps {
  items: InorganicLibraryItem[];
  onItemClick: (item: InorganicLibraryItem) => void;
}

export default function ReactionVesselPanel({ items, onItemClick }: ReactionVesselPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("application/chemistry-item", item.id);
          }}
          onClick={() => onItemClick(item)}
          className="bg-[#2b313c] border border-[#3a4250] rounded-2xl p-4 hover:border-blue-500 transition cursor-pointer group"
        >
          <div className="h-[140px] flex items-center justify-center lg:h-[170px]">
            <LabSVG type={item.id} />
          </div>

          <p className="text-center text-[13px] leading-4 mt-2 font-medium text-gray-100 lg:text-[15px] lg:leading-5">
            {item.name}
          </p>
        </div>
      ))}
    </div>
  );
}

function LabSVG({ type }: { type: string }) {
  // Using the new assets for consistency but keeping the structure the user wanted
  switch (type) {
    case "round-bottom-flask":
      return <RoundBottomFlaskAsset />;

    case "separatory-funnel":
      return <SeparatoryFunnelAsset />;

    case "gas-jar":
      return <GasJarAsset />;

    case "glass-bottle":
      return <GlassBottleAsset />;

    case "measure-bottle":
      return <MeasureBottleAsset />;

    case "test-tube-small":
      return <TestTubeAsset size="small" />;

    case "test-tube":
      return <TestTubeAsset size="large" />;

    case "test-tube-mini":
      return <TestTubeAsset size="mini" />;

    default:
      // Fallback for items not explicitly handled but in the category
      return (
        <div className="flex items-center justify-center text-gray-500 italic text-xs">
          {type}
        </div>
      );
  }
}
