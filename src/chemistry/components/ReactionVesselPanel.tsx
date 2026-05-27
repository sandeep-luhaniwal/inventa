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
  BeakerIcon,
  Beaker100Icon,
  Beaker250Icon,
  ErlenmeyerFlaskIcon,
  ThreeNeckedFlaskIcon,
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
          <div className="flex items-center justify-center h-[90px] transform scale-65 origin-center">
            <LabSVG type={item.id} />
          </div>

          <p className="text-center leading-4 mt-2 font-normal text-gray-100 text-xs lg:leading-4">
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

    case "beaker":
      return <BeakerIcon />;
      
    case "beaker-100":
      return <Beaker100Icon />;
    case "beaker-250":
      return <Beaker250Icon />;
    case "erlenmeyer-100":
      return <ErlenmeyerFlaskIcon sizeText="100mL" />;
    case "erlenmeyer-250":
      return <ErlenmeyerFlaskIcon sizeText="250mL" />;
    case "three-neck-flask":
      return <ThreeNeckedFlaskIcon />;

    default:
      // Fallback for items not explicitly handled but in the category
      return (
        <div className="flex items-center justify-center text-gray-500 italic text-xs">
          {type}
        </div>
      );
  }
}
