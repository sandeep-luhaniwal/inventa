"use client";

import React from "react";
import type { InorganicLibraryItem } from "@/chemistry/types";
import {
  BurnerAsset,
  ClayNetAsset,
  MatchAsset,
  MatchboxAsset,
  DropperAsset,
  ForcepsAsset,
  GauzeAsset,
  SpatulaAsset,
  GlassConduitAsset,
  RetortStandAsset,
  RubberStopperAsset,
  RingStandAsset,
  ClampAsset,
  ScissorAsset,
  KnifeAsset,
  CrucibleTongsAsset,
  ThermometerAsset,
  SandpaperAsset,
  CopperWireAsset,
  WoodenBoxAsset,
  BalloonAsset,
  TowelAsset,
  CottonAsset,
  FilterPaperAsset,
  GlassPipeAsset,
  HeatingMantleAsset,
  StirringRodAsset,
  GasInletValveAsset,
  SafetyGlovesAsset,
  FurnaceAsset,
} from "./LabAssets";

interface AssistiveDevicesPanelProps {
  items: InorganicLibraryItem[];
  onItemClick: (item: InorganicLibraryItem) => void;
}

export default function AssistiveDevicesPanel({ items, onItemClick }: AssistiveDevicesPanelProps) {
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
          title={item.description}
          className="bg-[#2b313c] border border-[#3a4250] rounded-2xl p-4 hover:border-blue-500 transition cursor-pointer group"
        >
          <div className="flex items-center justify-center h-[90px] w-full">
            <div
              className="flex items-center justify-center [&>svg]:h-full [&>svg]:w-auto [&>svg]:max-h-full [&>svg]:object-contain"
              style={{ height: "70px" }}
            >
              {item.id === "sandpaper" ? (
                <div className="w-[105px] h-[70px] flex items-center justify-center">
                  <DeviceSVG type={item.id} />
                </div>
              ) : (
                <DeviceSVG type={item.id} />
              )}
            </div>
          </div>

          <p className="text-center leading-6 mt-2 font-medium text-white text-sm line-clamp-2">
            {item.name}
          </p>
        </div>
      ))}
    </div>
  );
}

function DeviceSVG({ type }: { type: string }) {
  switch (type) {
    case "burner":
      return <BurnerAsset lit={false} />;
    case "tripod":
    case "retort-stand":
      return <RetortStandAsset />;
    case "ring-stand":
      return <RingStandAsset />;
    case "clamp":
      return <ClampAsset />;
    case "match":
      return <MatchAsset />;
    case "matchbox":
      return <MatchboxAsset />;
    case "dropper":
      return <DropperAsset />;
    case "forceps":
      return <ForcepsAsset />;
    case "clay-net":
      return <ClayNetAsset />;
    case "gauze":
      return <div className="scale-100"><GauzeAsset /></div>;
    case "spatula":
      return <div className="scale-100"><SpatulaAsset /></div>;
    case "scissor":
      return <ScissorAsset />;
    case "knife":
      return <KnifeAsset />;
    case "tongs":
    case "crucible-tongs":
      return <CrucibleTongsAsset />;
    case "heating-mantle":
      return <HeatingMantleAsset lit={false} />;
    case "stirring-rod":
      return <StirringRodAsset />;
    case "gas-inlet-valve":
      return <GasInletValveAsset isOpen={false} />;
    case "safety-gloves":
      return <SafetyGlovesAsset />;
    case "furnace":
      return <FurnaceAsset lit={false} />;
    case "thermometer":
      return <ThermometerAsset />;
    case "glass-conduit":
      return <GlassConduitAsset />;
    case "glass-pipe":
      return <GlassPipeAsset />;
    case "rubber-stopper":
      return <RubberStopperAsset />;
    case "sandpaper":
      return <SandpaperAsset />;
    case "copper-wire":
      return <CopperWireAsset />;
    case "wooden-box":
      return <WoodenBoxAsset />;
    case "balloon":
      return <BalloonAsset />;
    case "towel":
      return <TowelAsset />;
    case "cotton":
      return <CottonAsset />;
    case "filter-paper":
      return <FilterPaperAsset />;
    default:
      return (
        <div className="flex items-center justify-center text-gray-500 italic text-xs">
          {type}
        </div>
      );
  }
}
