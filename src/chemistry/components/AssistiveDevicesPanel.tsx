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
          className="bg-[#2b313c] border border-[#3a4250] rounded-2xl p-4 hover:border-blue-500 transition cursor-pointer group"
        >
          <div className="h-[140px] flex items-center justify-center lg:h-[160px]">
            <DeviceSVG type={item.id} />
          </div>

          <p className="text-center text-[13px] mt-2 font-medium text-gray-100 lg:text-[15px] lg:leading-5">
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
      return <GauzeAsset />;
    case "spatula":
      return <SpatulaAsset />;
    case "glass-conduit":
      return <GlassConduitAsset />;
    case "rubber-stopper":
      return <RubberStopperAsset />;
    default:
      return (
        <div className="flex items-center justify-center text-gray-500 italic text-xs">
          {type}
        </div>
      );
  }
}
