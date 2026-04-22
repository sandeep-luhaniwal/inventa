"use client"
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { PaletteComponentItem, useStaticComponents } from "@/simulator/hooks/useStaticComponents";

export type ComponentItem = PaletteComponentItem;

interface Props {
  onDragStart: (component: ComponentItem, e: React.DragEvent) => void;
}

const ComponentPalette = ({ onDragStart }: Props) => {
  const [search, setSearch] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { grouped, loading, error } = useStaticComponents();

  const searchText = search.toLowerCase();
  const filteredGroups = Object.entries(grouped).reduce<Record<string, PaletteComponentItem[]>>((acc, [category, items]) => {
    const filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchText));
    if (filteredItems.length > 0) acc[category] = filteredItems;
    return acc;
  }, {});

  return (
    <div className={`flex flex-col h-full border-l border-border bg-card transition-all duration-200 ${isCollapsed ? "w-12" : "w-72"}`}>
      <div className="flex items-center justify-start p-2">
        <button
          onClick={() => setIsCollapsed((p) => !p)}
          className="p-1 rounded-md border border-border hover:bg-secondary text-muted-foreground"
          title={isCollapsed ? "Expand palette" : "Collapse palette"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {!isCollapsed && (
        <>
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
                      <div
                        key={comp.id}
                        draggable
                        onDragStart={(e) => onDragStart(comp, e)}
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
                      </div>
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
