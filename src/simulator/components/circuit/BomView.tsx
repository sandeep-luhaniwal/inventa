"use client"
import { getComponentMap } from "@/simulator/constants/components";
import { PlacedComponent } from "@/simulator/types/circuit";
import { useMemo } from "react";

interface BomViewProps {
  components: PlacedComponent[];
  onExportCsv?: () => void;
}

export default function BomView({ components, onExportCsv }: BomViewProps) {
  const compMap = getComponentMap();

  const bomItems = useMemo(() => {
    const map = new Map<string, { component: string; count: number; names: string[] }>();
    components.forEach((comp) => {
      const key = comp.componentId;
      const existing = map.get(key);
      const label = compMap[key]?.name ?? comp.componentId;
      if (existing) {
        existing.count += 1;
        existing.names.push(comp.name);
      } else {
        map.set(key, { component: label, count: 1, names: [comp.name] });
      }
    });
    return Array.from(map.entries()).map(([id, item]) => ({ id, ...item }));
  }, [components, compMap]);

  return (
    <div className="flex flex-col flex-1 overflow-auto p-4 bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Bill of Materials</h2>
        <button
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          onClick={onExportCsv}
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-auto border border-slate-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Component ID</th>
              <th className="px-3 py-2 text-left font-medium">Quantity</th>
              <th className="px-3 py-2 text-left font-medium">Component</th>
              <th className="px-3 py-2 text-left font-medium">Instances</th>
            </tr>
          </thead>
          <tbody>
            {bomItems.map((item) => (
              <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-3 py-2">{item.id}</td>
                <td className="px-3 py-2">{item.count}</td>
                <td className="px-3 py-2">{item.component}</td>
                <td className="px-3 py-2">{item.names.join(", ")}</td>
              </tr>
            ))}
            {!bomItems.length && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-500">No components in circuit.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
