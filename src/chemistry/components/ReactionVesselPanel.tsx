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
  FunnelIcon,
  Funnel100Icon,
  EvaporationChamberAsset,
  GraduatedCylinderAsset,
  VacuumChamberAsset,
  ChinaDishAsset,
  MortarPestleAsset,
  CrucibleAsset,
} from "./LabAssets";

interface ReactionVesselPanelProps {
  items: InorganicLibraryItem[];
  onItemClick: (item: InorganicLibraryItem) => void;
}

export default function ReactionVesselPanel({ items, onItemClick }: ReactionVesselPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData("application/chemistry-item", item.id);
          }}
          onClick={() => onItemClick(item)}
          title={item.description}
          className="bg-[#2b313c] border border-[#3a4250] rounded-lg py-3 px-2 hover:border-blue-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-center h-[90px] w-full">
            <div
              className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-h-full [&>svg]:object-contain"
              style={{
                height:
                  item.id === "beaker-100" ||
                    item.id === "erlenmeyer-100" ||
                    item.id === "funnel-100" ? "60px" :
                    item.id === "beaker" ? "80px" :
                      "70px"
              }}
            >
              <LabSVG type={item.id} />
            </div>
          </div>

          <p className="text-center leading-[110%] mt-1 font-medium text-white text-xs line-clamp-2">
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
    case "funnel":
      return <FunnelIcon />;
    case "funnel-100":
      return <Funnel100Icon />;
    case "evaporation-chamber":
      return <EvaporationChamberAsset />;
    case "graduated-cylinder":
      return <GraduatedCylinderAsset />;
    case "vacuum-chamber":
      return <VacuumChamberAsset />;
    case "china-dish":
      return <ChinaDishAsset />;
    case "mortar-pestle":
      return <MortarPestleAsset />;
    case "crucible":
      return <CrucibleAsset />;

    default:
      // Fallback for items not explicitly handled but in the category
      return (
        <div className="flex items-center justify-center text-gray-500 italic text-xs">
          {type}
        </div>
      );
  }
}
