"use client";

import React from "react";
import {
  Beaker,
  CircleDot,
  Cloud,
  Droplets,
  FlaskConical,
  Pill,
  Search,
  Shapes,
  Sparkles,
  TestTubeDiagonal,
  Workflow,
} from "lucide-react";
import InorganicThumbnail from "@/chemistry/components/InorganicThumbnail";
import ReactionVesselPanel from "@/chemistry/components/ReactionVesselPanel";
import AssistiveDevicesPanel from "@/chemistry/components/AssistiveDevicesPanel";
import type { ChemistryCategory, ChemistryLibraryItem, ChemistryModule, SidebarCategory } from "@/chemistry/types";

interface SidebarProps {
  module: ChemistryModule;
  categories: SidebarCategory[];
  activeCategory: ChemistryCategory;
  searchTerm: string;
  selectedOrganicToolId?: string;
  items: ChemistryLibraryItem[];
  onCategoryChange: (id: ChemistryCategory) => void;
  onSearchChange: (value: string) => void;
  onItemClick: (item: ChemistryLibraryItem) => void;
}

function getCategoryIcon(category: ChemistryCategory) {
  const iconMap: Record<ChemistryCategory, React.ReactNode> = {
    glassware: <FlaskConical className="h-7 w-7 lg:h-8 lg:w-8" />,
    equipment: <Beaker className="h-7 w-7 lg:h-8 lg:w-8" />,
    solids: <Pill className="h-7 w-7 lg:h-8 lg:w-8" />,
    liquids: <Droplets className="h-7 w-7 lg:h-8 lg:w-8" />,
    gases: <Cloud className="h-7 w-7 lg:h-8 lg:w-8" />,
    atoms: <CircleDot className="h-7 w-7 lg:h-8 lg:w-8" />,
    bonds: <Workflow className="h-7 w-7 lg:h-8 lg:w-8" />,
    rings: <Shapes className="h-7 w-7 lg:h-8 lg:w-8" />,
    groups: <Sparkles className="h-7 w-7 lg:h-8 lg:w-8" />,
  };

  return iconMap[category];
}

function getOrganicMeta(item: Extract<ChemistryLibraryItem, { module: "organic" }>) {
  if (item.kind === "bond") return `${item.label} bond`;
  if (item.kind === "ring") return "Ring template";
  if (item.kind === "group") return "Functional group";
  return "Atom tool";
}

export default function Sidebar({
  module,
  categories,
  activeCategory,
  searchTerm,
  selectedOrganicToolId,
  items,
  onCategoryChange,
  onSearchChange,
  onItemClick,
}: SidebarProps) {
  return (
    <aside className="flex h-full min-h-0 overflow-hidden bg-[#2c3138] text-white">
      <div className="flex w-[84px] flex-col items-center border-r border-white/8 bg-[#353b43] py-2.5 lg:w-[88px]">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
          {module === "inorganic" ? <TestTubeDiagonal className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
        </div>

        <div
          className="chemistry-scrollbar flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto"
          style={{ scrollbarGutter: "stable" }}
        >
          {categories.map((category) => {
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className="flex w-full flex-col items-center px-1.5 py-1.5"
              >
                <div
                  className={`flex h-[62px] w-[54px] items-center justify-center rounded-2xl transition lg:h-[68px] lg:w-[58px] ${
                    active
                      ? "bg-[#2990ff] text-white shadow-[0_8px_24px_rgba(41,144,255,0.35)]"
                      : "bg-transparent text-white/68 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {getCategoryIcon(category.id)}
                </div>
                <span className={`mt-1.5 text-center text-[9px] leading-3.5 lg:text-[10px] lg:leading-4 ${active ? "text-white" : "text-white/56"}`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-[#31363d]">
        <div className="border-b border-white/8 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3a4048] text-white/45 lg:h-11 lg:w-11">
              <Search className="h-6 w-6" />
            </div>
            <div className="relative flex-1">
              <input
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={module === "inorganic" ? "SearchEquipment" : "SearchStructureTool"}
                className="h-10 w-full rounded-xl border border-white/6 bg-[#3a4048] px-3 text-base text-white outline-none placeholder:text-[#4c56b6] focus:border-[#2990ff] lg:h-11 lg:text-[17px]"
              />
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-[#3a4048] text-white/55 lg:h-11 lg:w-11">
              <Shapes className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="chemistry-scrollbar min-h-0 flex-1 overflow-y-auto p-3 lg:p-4"
          style={{ scrollbarGutter: "stable" }}
        >
          {activeCategory === "glassware" ? (
            <ReactionVesselPanel 
              items={items.filter(i => i.module === "inorganic" && i.category === "glassware") as any} 
              onItemClick={onItemClick as any} 
            />
          ) : activeCategory === "equipment" ? (
            <AssistiveDevicesPanel 
              items={items.filter(i => i.module === "inorganic" && i.category === "equipment") as any} 
              onItemClick={onItemClick as any} 
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => {
                const active = item.module === "organic" && item.id === selectedOrganicToolId;
                const meta = item.module === "inorganic" ? item.symbol : getOrganicMeta(item);
                const title = item.module === "inorganic" ? item.name : item.label;
                const accent = item.module === "inorganic" ? item.accent : item.color;

                return (
                  <button
                    key={item.id}
                    draggable={item.module === "inorganic"}
                    onDragStart={(event) => {
                      if (item.module === "inorganic") {
                        event.dataTransfer.setData("application/chemistry-item", item.id);
                      }
                    }}
                    onClick={() => onItemClick(item)}
                    className={`group min-h-[142px] rounded-2xl border p-3 text-left transition lg:min-h-[156px] lg:p-4 ${
                      active
                        ? "border-[#2990ff] bg-[#3b424a] shadow-[0_12px_30px_rgba(41,144,255,0.18)]"
                        : "border-black/12 bg-[#353b43] hover:border-white/12 hover:bg-[#3a4048]"
                    }`}
                  >
                    <div
                      className="mb-3 flex h-20 items-center justify-center rounded-2xl border lg:mb-4 lg:h-24"
                      style={{
                        borderColor: `${accent}22`,
                        background: `radial-gradient(circle at 50% 35%, ${accent}44, transparent 62%)`,
                      }}
                    >
                      {item.module === "inorganic" ? (
                        <InorganicThumbnail item={item} />
                      ) : (
                        <div
                          className="flex h-14 min-w-14 items-center justify-center rounded-2xl border px-3 text-center text-lg font-semibold text-white shadow-lg lg:h-16 lg:min-w-16 lg:text-xl"
                          style={{
                            borderColor: `${accent}40`,
                            backgroundColor: `${accent}20`,
                          }}
                        >
                          {title}
                        </div>
                      )}
                    </div>

                    <h3 className="line-clamp-2 text-[15px] font-medium leading-7 text-white lg:text-[17px]">{title}</h3>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/34 lg:text-xs">{meta}</p>
                  </button>
                );
              })}
            </div>
          )}

          {items.length === 0 && (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/3 px-6 text-center">
              <div>
                <p className="text-lg font-medium text-white/78">No items found</p>
                <p className="mt-2 text-sm text-white/45">Try another category or search term.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
