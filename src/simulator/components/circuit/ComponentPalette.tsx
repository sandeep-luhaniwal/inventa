"use client"
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { COMPONENT_REGISTRY, type ComponentDefinition } from "@/simulator/constants/components";
// import { COMPONENT_REGISTRY, type ComponentDefinition } from "@/constants/components";

export type ComponentItem = Pick<ComponentDefinition, "id" | "name" | "ports" | "icon">;

interface Props {
  onDragStart: (component: ComponentItem, e: React.DragEvent) => void;
}

const ComponentPalette = ({ onDragStart }: Props) => {
  const [search, setSearch] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filtered = COMPONENT_REGISTRY.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

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
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((comp) => (
                <div
                  key={comp.id}
                  draggable
                  onDragStart={(e) => onDragStart(comp, e)}
                  className="flex flex-col items-center p-3 rounded-xl border border-border hover:border-primary/40 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all bg-card"
                >
                  <comp.icon width={48} height={48} className="mb-2" />
                  <span className="text-xs text-foreground font-medium">{comp.name}</span>
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
