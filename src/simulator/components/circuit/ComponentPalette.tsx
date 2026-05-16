"use client"
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { PaletteComponentItem, useStaticComponents } from "@/simulator/hooks/useStaticComponents";

export type ComponentItem = PaletteComponentItem;

interface Props {
  onDragStart: (component: ComponentItem, e: React.DragEvent) => void;
  onCoulombClick?: () => void;
  isCoulombActive?: boolean;
}

const CHARGED_SPHERE_TOPICS = [
  "Methods of Charging",
  "Coulomb's Law",
  "Electric Field Intensity",
  "Electric Field Lines",
  "Electric Flux",
  "Gauss's Theorem",
  "Electric Potential",
  "Electric Potential Difference",
  "Electrical Capacitance",
  "Capacitance of a Spherical Conductor",
];

const ComponentPalette = ({ onDragStart, onCoulombClick, isCoulombActive }: Props) => {
  const [search, setSearch] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chargedSphereTopic, setChargedSphereTopic] = useState(CHARGED_SPHERE_TOPICS[0]);
  const { grouped, loading, error } = useStaticComponents();

  const searchText = search.toLowerCase();
  const filteredGroups = Object.entries(grouped).reduce<Record<string, PaletteComponentItem[]>>((acc, [category, items]) => {
    const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchText));
    if (filteredItems.length > 0) acc[category] = filteredItems;
    return acc;
  }, {});

  return (
    <div className={`flex flex-col h-full border-l border-border bg-card transition-all duration-200 ${isCollapsed ? "w-12" : "w-72"}`}>
      <div className="flex items-center justify-end p-2">
        <button
          onClick={() => setIsCollapsed((p) => !p)}
          className="p-1 rounded-md border border-border hover:bg-secondary text-muted-foreground"
          title={isCollapsed ? "Expand palette" : "Collapse palette"}
        >
          {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Coulomb's Law Button */}
          {onCoulombClick && (
            <div className="px-3 pb-3">
              <button
                onClick={onCoulombClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  isCoulombActive
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                    : "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-400 border-indigo-500/30 hover:from-indigo-500/20 hover:to-blue-500/20 hover:border-indigo-500/50"
                }`}
              >
                <Zap size={16} className={isCoulombActive ? "text-yellow-300" : "text-indigo-400"} />
                <span>Coulomb&apos;s Law</span>
                <span className="ml-auto text-[10px] font-medium opacity-60">⚡ Lab</span>
              </button>
            </div>
          )}

          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {loading && <div className="text-sm text-muted-foreground px-1 py-2">Loading components...</div>}
            {error && <div className="text-sm text-red-600 px-1 py-2">{error}</div>}
            <div className="space-y-4">
              {Object.entries(filteredGroups).map(([category, items]) => (
                <div key={category}>
                  <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {category}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((comp) => (
                      (() => {
                        const paletteComp = comp.name === "Charged Sphere"
                          ? { ...comp, physicsTopic: chargedSphereTopic }
                          : comp;

                        return (
                      <div
                        key={comp.id}
                        draggable
                        onDragStart={(e) => onDragStart(paletteComp, e)}
                        className="flex flex-col items-center p-3 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all bg-card"
                      >
                        {comp.imageSrc ? (
                          <img src={comp.imageSrc} alt={comp.name} className="mb-2 h-12 w-12 object-contain" draggable={false} />
                        ) : (
                          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-[10px] text-muted-foreground">
                            No image
                          </div>
                        )}
                        <span className="text-center text-xs text-foreground font-medium">{comp.name}</span>
                        {comp.name === "Charged Sphere" && (
                          <div
                            className="mt-3 w-full rounded-lg border border-border bg-background/60"
                            onPointerDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.preventDefault()}
                          >
                            <label className="block px-2.5 pt-2 text-[11px] font-semibold text-muted-foreground">
                              Topics
                            </label>
                            <div className="p-2.5 pt-1.5">
                              <select
                                value={chargedSphereTopic}
                                onChange={(e) => setChargedSphereTopic(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-[11px] font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              >
                                {CHARGED_SPHERE_TOPICS.map((topic) => (
                                  <option key={topic} value={topic}>
                                    {topic}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                        );
                      })()
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComponentPalette;
