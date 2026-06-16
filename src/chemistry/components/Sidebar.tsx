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
import type {
  ChemistryCategory,
  ChemistryLibraryItem,
  ChemistryModule,
  InorganicLibraryItem,
  SidebarCategory,
} from "@/chemistry/types";

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
  showOnlyVessels?: boolean;
  activeElementFilter?: string | null;
  onToggleElements?: () => void;
  onClearElementFilter?: () => void;
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
  showOnlyVessels = false,
  activeElementFilter = null,
  onToggleElements,
  onClearElementFilter,
}: SidebarProps) {
  const inorganicItems = items.filter((item): item is InorganicLibraryItem => item.module === "inorganic");
  const reactionVessels = inorganicItems.filter((item) => item.category === "glassware");
  const assistiveDevices = inorganicItems.filter((item) => item.category === "equipment");
  const handleInorganicClick = (item: InorganicLibraryItem) => onItemClick(item);

  return (
    <aside className="flex h-full min-h-0 overflow-hidden bg-[#2c3138] text-white">
      <div className="flex w-[66px] flex-col items-center border-r border-white/8 bg-[#353b43] py-2.5 lg:w-[70px] shrink-0">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70">
          {module === "inorganic" ? <TestTubeDiagonal className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
        </div>

        <div
          className="chemistry-scrollbar flex min-h-0 hidden_scrollbar flex-1 pt-6 flex-col items-center gap-y-4 ms-2 overflow-auto w-full"
          style={{ scrollbarGutter: "stable" }}
        >
          {categories.map((category) => {
            const active = !activeElementFilter && activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className="flex w-full cursor-pointer flex-col items-center px-1.5 py-1.5"
              >
                <div
                  className={`flex h-[48px] w-[48px] items-center justify-center rounded-md transition lg:h-[48px] lg:w-[48px] ${active
                    ? "bg-[#2990ff] text-white shadow-[0_8px_24px_rgba(41,144,255,0.35)]"
                    : "bg-transparent text-white/68 hover:bg-white/6 hover:text-white"
                    }`}
                >
                  {getCategoryIcon(category.id)}
                </div>
                <span className={`mt-1 text-center text-[9px] lg:text-[12px] leading-[110%] ${active ? "text-white" : "text-white/56"}`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 w-[284px] lg:w-[280px] xl:w-[290px] shrink-0 flex-col bg-[#31363d]">
        <div className="border-b border-white/8 px-3 py-2 lg:px-4">
          <div className="flex items-center gap-2.5">

            <div className="relative flex-1">
              <input
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={module === "inorganic" ? "SearchEquipment" : "SearchStructureTool"}
                className="h-9 w-full ps-9 placeholder:text-white/45 rounded-md border border-white/6 bg-[#3a4048] px-3 text-base text-white outline-none placeholder:text-[#4c56b6] focus:border-[#2990ff] lg:h-10 lg:text-sm"
              />
              <div className="flex h-9 w-9 absolute top-0 items-center justify-center rounded-xl text-white/45 lg:h-10 lg:w-10">
                <Search className="h-5 w-5" />
              </div>
            </div>
            {module === "inorganic" && (
              <button
                onClick={onToggleElements}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition lg:h-10 lg:w-10 ${
                  activeElementFilter
                    ? "bg-[#2990ff] border-[#2990ff] text-white shadow-[0_0_12px_rgba(41,144,255,0.4)] cursor-pointer"
                    : "bg-[#3a4048] border-white/8 text-white/55 hover:text-white cursor-pointer"
                }`}
                title="Elements & Ions Filter"
              >
                <Shapes className="h-5 w-5" />
              </button>
            )}
          </div>
          {activeElementFilter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#2990ff]/10 border border-[#2990ff]/20 text-[#2990ff] rounded-md text-[11px] mt-2 w-fit">
              <span>Element: {activeElementFilter}</span>
              <button
                onClick={onClearElementFilter}
                className="hover:text-white cursor-pointer ml-1 font-bold text-sm leading-none"
                title="Clear Filter"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div
          className="chemistry-scrollbar min-h-0 flex-1 overflow-y-auto p-3 lg:p-4"
          style={{ scrollbarGutter: "stable" }}
        >
          {(activeCategory === "glassware" && !activeElementFilter) ? (
            <ReactionVesselPanel
              items={reactionVessels}
              onItemClick={handleInorganicClick}
            />
          ) : (activeCategory === "equipment" && !activeElementFilter) ? (
            <AssistiveDevicesPanel
              items={assistiveDevices}
              onItemClick={handleInorganicClick}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => {
                const active = item.module === "organic" && item.id === selectedOrganicToolId;
                const meta = item.module === "inorganic" ? (item.state === "solid" || item.state === "liquid" || item.state === "gas" ? "" : item.symbol) : getOrganicMeta(item);
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
                    title={item.description}
                    className={`text-center transition bg-[#2b313c] border border-[#3a4250] rounded-lg p-2 pt-3 hover:border-blue-500 transition cursor-pointer group`}
                  >
                    <div
                      className="mb-1 flex h-20 items-center justify-center"
                      style={{
                        borderColor: `${accent}22`,
                        // background: `radial-gradient(circle at 50% 35%, ${accent}44, transparent 62%)`,
                      }}
                    >
                      {item.module === "inorganic" ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <InorganicThumbnail item={item} />
                        </div>
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
                    <h3 className="line-clamp-2 text-xs font-medium leading-[110%] text-white text-center">{title}</h3>
                    {item.module === "organic" && meta && (
                      <p className="mt-px text-[10px] uppercase tracking-[0.16em] text-white/34 lg:text-xs">{meta}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {items.length === 0 && (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-white/12 bg-white/3 px-6 text-center">
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
