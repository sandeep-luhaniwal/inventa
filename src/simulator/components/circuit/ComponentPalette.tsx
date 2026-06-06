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

const CLASSES_DATA = {
  "Class 11th": [
    "Units and Measurements",
    "Motion in a Straight Line",
    "Motion in a Plane",
    "Laws of Motion",
    "Work, Energy and Power",
    "System of Particles and Rotational Motion",
    "Gravitation",
    "Mechanical Properties of Solids",
    "Mechanical Properties of Fluids",
    "Thermal Properties of Matter",
    "Thermodynamics",
    "Kinetic Theory",
    "Oscillations",
    "Waves"
  ],
  "Class 12th": [
    "Electric Charges and Fields",
    "Electrostatic Potential and Capacitance",
    "Current Electricity",
    "Moving Charges and Magnetism",
    "Magnetism and Matter",
    "Electromagnetic Induction",
    "Alternating Current",
    "Electromagnetic Waves",
    "Ray Optics and Optical Instruments",
    "Wave Optics",
    "Dual Nature of Radiation and Matter",
    "Atoms",
    "Nuclei",
    "Semiconductor Electronics: Materials, Devices and Simple Circuits"
  ]
};

const ComponentPalette = ({ onDragStart, onCoulombClick, isCoulombActive }: Props) => {
  const [search, setSearch] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chargedSphereTopic, setChargedSphereTopic] = useState(CHARGED_SPHERE_TOPICS[0]);
  const [selectedClass, setSelectedClass] = useState<keyof typeof CLASSES_DATA | "">("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const { grouped, loading, error } = useStaticComponents();

  const searchText = search.toLowerCase();
  const allFilteredItems = Object.values(grouped)
    .flat()
    .filter((item) => item.name.toLowerCase().includes(searchText));

  return (
    <div className={`relative flex flex-col h-full bg-card transition-all duration-200 ${isCollapsed ? "w-0" : "w-72 border-l border-border"}`}>
      <button
        onClick={() => setIsCollapsed((p) => !p)}
        className="absolute top-1/2 -left-6 -translate-y-1/2 z-10 flex h-16 w-6 items-center justify-center rounded-l-lg border border-border border-r-0 bg-card hover:bg-secondary text-muted-foreground shadow-md transition-all cursor-pointer"
        title={isCollapsed ? "Expand palette" : "Collapse palette"}
      >
        {isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {!isCollapsed && (
        <>
          {/* Coulomb's Law Button */}
          {onCoulombClick && (
            <div className="px-3 pb-3">
              <button
                onClick={onCoulombClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${isCoulombActive
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

          <div className="px-3 pb-5 pt-3 flex flex-col gap-2">
            <select
              value={selectedClass}
              onChange={(e) => {
                const val = e.target.value as keyof typeof CLASSES_DATA | "";
                setSelectedClass(val);
                setSelectedChapter("");
              }}
              className="w-full rounded-md border-2 border-indigo-500/20 hover:border-indigo-500/50 bg-background px-2.5 py-2 text-xs font-medium text-foreground outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            >
              <option value="">Select Class</option>
              {Object.keys(CLASSES_DATA).map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            {selectedClass && (
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full rounded-md border-2 border-indigo-500/20 hover:border-indigo-500/50 bg-background px-2.5 py-2 text-xs font-medium text-foreground outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
              >
                <option value="">Select Chapter</option>
                {CLASSES_DATA[selectedClass].map((chap) => (
                  <option key={chap} value={chap}>{chap}</option>
                ))}
              </select>
            )}
          </div>

          <div className="px-3 pb-5 pt-1">
            <div className="relative group">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border-2 border-indigo-500/20 hover:border-indigo-500/50 focus:border-indigo-500 rounded-xl bg-background focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {loading && <div className="text-sm text-muted-foreground px-1 py-2">Loading components...</div>}
            {error && <div className="text-sm text-red-600 px-1 py-2">{error}</div>}
            <div className="grid grid-cols-3 gap-2">
              {allFilteredItems.map((comp) => {
                const paletteComp = comp.name === "Charged Sphere"
                  ? { ...comp, physicsTopic: chargedSphereTopic }
                  : comp;

                return (
                  <div
                    key={comp.id}
                    draggable
                    onDragStart={(e) => onDragStart(paletteComp, e)}
                    className={`flex min-w-0 flex-col items-center overflow-hidden p-2.5 rounded-xl border border-indigo-500/40 hover:border-indigo-500 hover:shadow-md hover:bg-indigo-500/5 cursor-grab active:cursor-grabbing transition-all bg-card shadow-sm ${comp.name === "Charged Sphere" ? "col-span-3" : ""}`}
                  >
                    {comp.imageSrc ? (
                        <img
                          src={comp.imageSrc}
                          alt={comp.name}
                          className="mb-2 h-12 w-12 object-contain"
                          draggable={false}
                        />
                    ) : (
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-[10px] text-muted-foreground">
                        No image
                      </div>
                    )}
                    <span className="max-w-full break-words text-center text-xs font-medium leading-tight text-foreground">{comp.name}</span>
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
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComponentPalette;
