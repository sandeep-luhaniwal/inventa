"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Monitor,
  Pencil,
  Save,
  Settings2,
  SquarePen,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Canvas from "@/chemistry/components/Canvas";
import Sidebar from "@/chemistry/components/Sidebar";
import { resolveReaction, REACTION_RULES } from "@/chemistry/reactions";
import {
  getCategoriesForModule,
  getDefaultCategoryForModule,
  getLibraryForModule,
  ORGANIC_LIBRARY,
} from "@/chemistry/data";
import type {
  ChemistryCategory,
  ChemistryLibraryItem,
  ChemistryModule,
  InorganicLibraryItem,
  OrganicBond,
  OrganicNode,
  OrganicTool,
  PlacedInorganicItem,
} from "@/chemistry/types";

function matchesElementFilter(item: ChemistryLibraryItem, filter: string | null): boolean {
  if (!filter) return true;
  if (item.module !== "inorganic") return false;

  const formula = item.formula || "";
  const name = item.name || "";
  const symbol = item.symbol || "";
  const description = item.description || "";

  // Normalize subscript to standard numbers for simple matching
  const normalizedFormula = formula.replace(/₄/g, "4").replace(/₃/g, "3").replace(/₂/g, "2");

  if (filter === "SO₄²⁻") return normalizedFormula.includes("SO4") || name.toLowerCase().includes("sulfate") || description.toLowerCase().includes("sulfate");
  if (filter === "NO₃⁻") return normalizedFormula.includes("NO3") || name.toLowerCase().includes("nitrate") || description.toLowerCase().includes("nitrate");
  if (filter === "OH⁻") return normalizedFormula.includes("OH") || name.toLowerCase().includes("hydroxide") || description.toLowerCase().includes("hydroxide");
  if (filter === "PO₄³⁻") return normalizedFormula.includes("PO4") || name.toLowerCase().includes("phosphate") || description.toLowerCase().includes("phosphate");
  if (filter === "CO₃²⁻") return normalizedFormula.includes("CO3") || name.toLowerCase().includes("carbonate") || description.toLowerCase().includes("carbonate");
  if (filter === "HCO₃⁻") return normalizedFormula.includes("HCO3") || name.toLowerCase().includes("bicarbonate") || name.toLowerCase().includes("hydrogen carbonate");
  if (filter === "NH₄⁺") return normalizedFormula.includes("NH4") || name.toLowerCase().includes("ammonium") || description.toLowerCase().includes("ammonium");

  // Standard metals / non-metals
  // E.g., C should not match Cl or Ca
  const cleanFilter = filter.replace(/[0-9²³⁺⁻\-\s]/g, ""); // strip charge/numbers
  const regex = new RegExp(`\\b${cleanFilter}\\b|${cleanFilter}(?![a-z])`);

  if (regex.test(formula)) return true;
  if (name.toLowerCase().includes(cleanFilter.toLowerCase())) return true;
  if (symbol.includes(cleanFilter)) return true;

  return false;
}

const DEFAULT_ORGANIC_TOOL = ORGANIC_LIBRARY.find(
  (item) => item.kind === "atom" && item.label === "C"
) as OrganicTool;

const FRAGMENT_COUNTS: Record<string, Record<string, number>> = {
  C: { C: 1 },
  H: { H: 1 },
  O: { O: 1 },
  N: { N: 1 },
  Cl: { Cl: 1 },
  Br: { Br: 1 },
  OH: { O: 1, H: 1 },
  COOH: { C: 1, O: 2, H: 1 },
  NH2: { N: 1, H: 2 },
  CH3: { C: 1, H: 3 },
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatMolecularFormula(nodes: OrganicNode[]) {
  const counts = nodes.reduce<Record<string, number>>((accumulator, node) => {
    const fragment = FRAGMENT_COUNTS[node.label] ?? { [node.label]: 1 };
    Object.entries(fragment).forEach(([element, amount]) => {
      accumulator[element] = (accumulator[element] ?? 0) + amount;
    });
    return accumulator;
  }, {});

  if (Object.keys(counts).length === 0) return "No formula yet";

  const orderedElements = Object.keys(counts).sort((left, right) => {
    if (left === "C") return -1;
    if (right === "C") return 1;
    if (left === "H" && right !== "C") return -1;
    if (right === "H" && left !== "C") return 1;
    return left.localeCompare(right);
  });

  return orderedElements
    .map((element) => `${element}${counts[element] > 1 ? counts[element] : ""}`)
    .join("");
}

function upsertBond(currentBonds: OrganicBond[], from: string, to: string, order: OrganicBond["order"]) {
  const existing = currentBonds.find(
    (bond) => (bond.from === from && bond.to === to) || (bond.from === to && bond.to === from)
  );

  if (existing) {
    return currentBonds.map((bond) => (bond.id === existing.id ? { ...bond, order } : bond));
  }

  return [...currentBonds, { id: createId("bond"), from, to, order }];
}

function createRingTemplate(template: "benzene" | "cyclohexane", x: number, y: number) {
  const radius = 68;
  const nodeIds = Array.from({ length: 6 }, () => createId("atom"));
  const atoms: OrganicNode[] = nodeIds.map((id, index) => {
    const angle = (-Math.PI / 2) + (index * Math.PI) / 3;
    return {
      id,
      label: "C",
      x: x + Math.cos(angle) * radius,
      y: y + Math.sin(angle) * radius,
    };
  });

  const aromatic = template === "benzene";
  const bonds: OrganicBond[] = nodeIds.map((id, index) => ({
    id: createId("bond"),
    from: id,
    to: nodeIds[(index + 1) % nodeIds.length],
    order: aromatic ? (index % 2 === 0 ? "aromatic" : 1) : 1,
  }));

  return { atoms, bonds };
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-[42px] flex-col items-center gap-0.5 text-white/72 transition hover:text-white lg:min-w-[48px]"
    >
      <div className="flex h-5 w-5 items-center justify-center lg:h-6 lg:w-6">{icon}</div>
      {label ? <span className="text-[11px] lg:text-[12px]">{label}</span> : null}
    </button>
  );
}

export default function ChemistryPage() {
  const [activeModule, setActiveModule] = useState<ChemistryModule>("inorganic");
  const [activeCategory, setActiveCategory] = useState<ChemistryCategory>(getDefaultCategoryForModule("inorganic"));
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showOnlyVessels, setShowOnlyVessels] = useState(false);
  const [isElementsOpen, setIsElementsOpen] = useState(false);
  const [activeElementFilter, setActiveElementFilter] = useState<string | null>(null);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 10, 50));

  const [inorganicItems, setInorganicItems] = useState<PlacedInorganicItem[]>([]);
  const [selectedInorganicId, setSelectedInorganicId] = useState<string | null>(null);

  const [organicAtoms, setOrganicAtoms] = useState<OrganicNode[]>([]);
  const [organicBonds, setOrganicBonds] = useState<OrganicBond[]>([]);
  const [selectedOrganicNodeId, setSelectedOrganicNodeId] = useState<string | null>(null);
  const [pendingBondStartId, setPendingBondStartId] = useState<string | null>(null);
  const [selectedOrganicTool, setSelectedOrganicTool] = useState<OrganicTool>(DEFAULT_ORGANIC_TOOL);

  const categories = useMemo(() => {
    return getCategoriesForModule(activeModule);
  }, [activeModule]);

  const filteredLibraryItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return getLibraryForModule(activeModule).filter((item) => {
      if ("hidden" in item && item.hidden) return false;
      // If there is no element filter, restrict by active category
      if (!activeElementFilter) {
        const matchesCategory = item.category === activeCategory;
        if (!matchesCategory) return false;
      }

      // Filter by element or ion
      if (!matchesElementFilter(item, activeElementFilter)) return false;

      if (!normalizedSearch) return true;

      const searchFields =
        item.module === "inorganic"
          ? [item.name, item.symbol, item.formula, item.description]
          : [item.label, item.kind, item.description];

      return searchFields.some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [activeCategory, activeModule, searchTerm, activeElementFilter]);

  const selectedInorganicItem = useMemo(
    () => inorganicItems.find((item) => item.instanceId === selectedInorganicId) ?? null,
    [inorganicItems, selectedInorganicId]
  );

  const selectedOrganicNode = useMemo(
    () => organicAtoms.find((atom) => atom.id === selectedOrganicNodeId) ?? null,
    [organicAtoms, selectedOrganicNodeId]
  );

  const organicFormula = useMemo(() => formatMolecularFormula(organicAtoms), [organicAtoms]);

  const handleModuleChange = (module: ChemistryModule) => {
    setActiveModule(module);
    setActiveCategory(getDefaultCategoryForModule(module));
    setSearchTerm("");
    if (module === "organic") {
      setSelectedInorganicId(null);
    } else {
      setSelectedOrganicNodeId(null);
      setPendingBondStartId(null);
    }
  };

  const handleAddInorganicItem = (item: InorganicLibraryItem) => {
    const offset = inorganicItems.length % 6;
    const isBottle =
      item.id.includes("bottle") ||
      item.id.includes("jar") ||
      item.id === "three-neck-flask" ||
      item.id === "evaporation-chamber" ||
      item.state === "solid" ||
      item.state === "liquid" ||
      item.state === "gas";
    const placedItem: PlacedInorganicItem = {
      ...item,
      instanceId: createId("lab"),
      x: 90 + offset * 34,
      y: 90 + offset * 26,
      isOpen: isBottle ? false : undefined,
      ...(item.id === "three-neck-flask" || item.id === "evaporation-chamber" ? {
        isOpenLeft: false,
        isOpenMiddle: false,
        isOpenRight: false,
      } : {}),
    };

    setInorganicItems((current) => [...current, placedItem]);
    setSelectedInorganicId(placedItem.instanceId);
  };

  const handleInorganicCombine = (sourceId: string, targetId: string, volume?: number) => {
    setInorganicItems((current) => {
      const source = current.find((i) => i.instanceId === sourceId);
      const target = current.find((i) => i.instanceId === targetId);

      if (!source || !target || target.state !== "glassware") return current;

      let sourceContents: InorganicLibraryItem[] = [];

      if (source.state === "glassware") {
        sourceContents = source.contents?.length ? source.contents : [];
      } else {
        const defaultVolume = source.state === "solid" ? 10 : (source.state === "gas" ? 50 : 30);
        const resolvedVolume = volume ?? defaultVolume;

        sourceContents = [{
          ...source,
          volume: resolvedVolume,
          mass: source.state === "solid" ? resolvedVolume : undefined
        }];
      }

      let updatedContents = [...(target.contents || [])];
      sourceContents.forEach((sourceItem) => {
        const existingIndex = updatedContents.findIndex(item => item.id === sourceItem.id);
        if (existingIndex !== -1) {
          const existing = updatedContents[existingIndex];

          const existingVol = existing.volume ?? (existing.state === "solid" ? 10 : (existing.state === "gas" ? 50 : 30));
          const sourceVol = sourceItem.volume ?? (sourceItem.state === "solid" ? 10 : (sourceItem.state === "gas" ? 50 : 30));

          const existingMass = existing.mass ?? (existing.state === "solid" ? 10 : undefined);
          const sourceMass = sourceItem.mass ?? (sourceItem.state === "solid" ? 10 : undefined);

          updatedContents[existingIndex] = {
            ...existing,
            volume: existingVol + sourceVol,
            mass: existingMass !== undefined || sourceMass !== undefined
              ? (existingMass ?? 0) + (sourceMass ?? 0)
              : undefined
          };
        } else {
          updatedContents.push(sourceItem);
        }
      });

      const hasGloves = current.some(i => i.id === "safety-gloves");
      const reaction = resolveReaction(updatedContents, target.id, hasGloves, false, target.isOpen === false, target.pressure);

      const targetTemp = target.temperature ?? 25;
      const sourceTemp = source.temperature ?? 25;
      const targetVol = (target.contents || []).reduce((sum, c) => sum + (c.volume ?? 0), 0);
      const sourceVol = sourceContents.reduce((sum, c) => sum + (c.volume ?? 0), 0);

      let newTemp = targetTemp;
      let coolingUpdates: Record<string, any> = {};

      if (targetVol + sourceVol > 0) {
        newTemp = (targetVol * targetTemp + sourceVol * sourceTemp) / (targetVol + sourceVol);
      }

      if (newTemp < targetTemp && targetTemp > 25 && targetVol > 0 && sourceVol > 0) {
        coolingUpdates = {
          temperature: targetTemp,
          metadata: {
            ...target.metadata,
            coolingStartedAt: Date.now(),
            coolingStartTemp: targetTemp,
            coolingTargetTemp: newTemp,
            coolingDuration: 60000
          }
        };
      } else {
        coolingUpdates = {
          temperature: Math.round(newTemp)
        };
      }

      // Only remove source if it's glassware (pouring vessel), keep solid/liquid/gas bottles
      const shouldRemoveSource = source.state === "glassware";

      return current
        .filter((i) => shouldRemoveSource ? i.instanceId !== sourceId : true)
        .map((i) =>
          i.instanceId === targetId
            ? {
              ...i,
              contents: reaction.contents,
              reactionState: reaction.state ?? "idle",
              note: reaction.note,
              ...coolingUpdates
            }
            : i
        );
    });
  };

  const handleInorganicDrop = (
    itemId: string,
    x: number,
    y: number,
    overrides: Partial<PlacedInorganicItem> = {}
  ) => {
    const library = getLibraryForModule("inorganic") as InorganicLibraryItem[];
    const item = library.find((i) => i.id === itemId);
    if (!item) return;

    const isBottle =
      item.id.includes("bottle") ||
      item.id.includes("jar") ||
      item.id === "three-neck-flask" ||
      item.id === "evaporation-chamber" ||
      item.state === "solid" ||
      item.state === "liquid" ||
      item.state === "gas";

    const placedItem: PlacedInorganicItem = {
      ...item,
      instanceId: createId("lab"),
      x,
      y,
      showStick: item.id === "matchbox" ? true : undefined,
      isStriking: item.id === "matchbox" ? false : undefined,
      isLit: item.id === "match", // Auto-light matches when spawned
      isOpen: isBottle ? false : undefined,
      ...(item.id === "three-neck-flask" || item.id === "evaporation-chamber" ? {
        isOpenLeft: false,
        isOpenMiddle: false,
        isOpenRight: false,
      } : {}),
      ...overrides,
    };

    setInorganicItems((current) => [...current, placedItem]);
    setSelectedInorganicId(placedItem.instanceId);
  };

  const handleInorganicUpdate = (id: string, updates: Partial<PlacedInorganicItem>) => {
    setInorganicItems((current) =>
      current.map((item) => (item.instanceId === id ? { ...item, ...updates } : item))
    );
  };

  React.useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    inorganicItems.forEach((item) => {
      if (item.state !== "glassware") return;
      if (!item.contents || item.contents.length < 2) return;

      // Do not run background reaction checker if there is only one unique chemical type in the vessel
      const uniqueIds = new Set(item.contents.map((c) => c.id));
      if (uniqueIds.size < 2) return;

      const contentsKey = item.contents
        .map((c) => `${c.id}:${c.volume ?? c.mass ?? 0}`)
        .sort()
        .join(",");

      if (item.metadata?.aiReactionKey === contentsKey || item.note === "AI is analyzing reaction...") {
        return;
      }

      // Check if there is a static reaction rule that matches
      const hasStaticReaction = REACTION_RULES.some((rule) =>
        rule.reactants.every((rId) => item.contents?.some((c) => c.id === rId))
      );
      if (hasStaticReaction) {
        return;
      }

      // Debounce the API call by 600ms to avoid flooding on ticks
      const timer = setTimeout(() => {
        // Mark as analyzing
        handleInorganicUpdate(item.instanceId, {
          note: "AI is analyzing reaction...",
          metadata: {
            ...item.metadata,
            aiReactionKey: contentsKey,
          },
        });

        fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reactants: item.contents }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("API call failed");
            return res.json();
          })
          .then((data) => {
            const productsKey = data.products
              .map((p: any) => `${p.id}:${p.volume ?? p.mass ?? 0}`)
              .sort()
              .join(",");

            handleInorganicUpdate(item.instanceId, {
              contents: data.products,
              reactionState: data.state,
              note: data.note,
              metadata: {
                ...item.metadata,
                aiReactionKey: productsKey,
              },
            });
          })
          .catch((err) => {
            console.error("AI Reaction Error:", err);
            handleInorganicUpdate(item.instanceId, {
              note: `AI Reaction Error: ${err.message || err}`,
            });
          });
      }, 600);

      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [inorganicItems]);

  const handleInorganicRemove = (id: string) => {
    setInorganicItems((current) => current.filter((item) => item.instanceId !== id));
    if (selectedInorganicId === id) setSelectedInorganicId(null);
  };

  const handleOrganicCanvasAction = (x: number, y: number) => {
    setSelectedOrganicNodeId(null);

    if (selectedOrganicTool.kind === "bond") {
      setPendingBondStartId(null);
      return;
    }

    if (selectedOrganicTool.kind === "ring") {
      const ring = createRingTemplate(selectedOrganicTool.template, x, y);
      setOrganicAtoms((current) => [...current, ...ring.atoms]);
      setOrganicBonds((current) => [...current, ...ring.bonds]);
      setSelectedOrganicNodeId(ring.atoms[0]?.id ?? null);
      setPendingBondStartId(null);
      return;
    }

    const node: OrganicNode = {
      id: createId("atom"),
      label: selectedOrganicTool.label,
      x,
      y,
    };

    setOrganicAtoms((current) => [...current, node]);
    setSelectedOrganicNodeId(node.id);
    setPendingBondStartId(null);
  };

  const handleOrganicNodeAction = (nodeId: string) => {
    setSelectedOrganicNodeId(nodeId);

    if (selectedOrganicTool.kind === "bond") {
      if (!pendingBondStartId) {
        setPendingBondStartId(nodeId);
        return;
      }

      if (pendingBondStartId === nodeId) {
        setPendingBondStartId(null);
        return;
      }

      setOrganicBonds((current) => upsertBond(current, pendingBondStartId, nodeId, selectedOrganicTool.order));
      setPendingBondStartId(null);
      return;
    }

    if (selectedOrganicTool.kind === "atom" || selectedOrganicTool.kind === "group") {
      setOrganicAtoms((current) =>
        current.map((node) => (node.id === nodeId ? { ...node, label: selectedOrganicTool.label } : node))
      );
      setPendingBondStartId(null);
      return;
    }

    setPendingBondStartId(null);
  };

  const handleLibraryItemClick = (item: ChemistryLibraryItem) => {
    if (item.module === "inorganic") {
      handleAddInorganicItem(item);
      return;
    }

    setSelectedOrganicTool(item);
    if (item.kind !== "bond") {
      setPendingBondStartId(null);
    }
  };

  const handleClearWorkspace = () => {
    if (activeModule === "inorganic") {
      setInorganicItems([]);
      setSelectedInorganicId(null);
      return;
    }

    setOrganicAtoms([]);
    setOrganicBonds([]);
    setSelectedOrganicNodeId(null);
    setPendingBondStartId(null);
  };

  const handleDuplicateSelected = () => {
    if (activeModule === "inorganic" && selectedInorganicItem) {
      const duplicate: PlacedInorganicItem = {
        ...selectedInorganicItem,
        instanceId: createId("lab"),
        x: selectedInorganicItem.x + 28,
        y: selectedInorganicItem.y + 28,
      };
      setInorganicItems((current) => [...current, duplicate]);
      setSelectedInorganicId(duplicate.instanceId);
      return;
    }

    if (activeModule === "organic" && selectedOrganicNode) {
      const duplicate: OrganicNode = {
        ...selectedOrganicNode,
        id: createId("atom"),
        x: selectedOrganicNode.x + 34,
        y: selectedOrganicNode.y + 34,
      };
      setOrganicAtoms((current) => [...current, duplicate]);
      setSelectedOrganicNodeId(duplicate.id);
      setPendingBondStartId(null);
    }
  };

  const handleDeleteSelected = () => {
    if (activeModule === "inorganic" && selectedInorganicId) {
      setInorganicItems((current) => current.filter((item) => item.instanceId !== selectedInorganicId));
      setSelectedInorganicId(null);
      return;
    }

    if (activeModule === "organic" && selectedOrganicNodeId) {
      setOrganicAtoms((current) => current.filter((atom) => atom.id !== selectedOrganicNodeId));
      setOrganicBonds((current) =>
        current.filter((bond) => bond.from !== selectedOrganicNodeId && bond.to !== selectedOrganicNodeId)
      );
      setPendingBondStartId((current) => (current === selectedOrganicNodeId ? null : current));
      setSelectedOrganicNodeId(null);
    }
  };

  const handleSaveExperiment = () => {
    const payload = {
      module: activeModule,
      savedAt: new Date().toISOString(),
      inorganic: {
        items: inorganicItems,
      },
      organic: {
        formula: organicFormula,
        atoms: organicAtoms,
        bonds: organicBonds,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chemistry-editor-${activeModule}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canDuplicate =
    activeModule === "inorganic" ? Boolean(selectedInorganicItem) : Boolean(selectedOrganicNode);
  const canDelete = activeModule === "inorganic" ? Boolean(selectedInorganicId) : Boolean(selectedOrganicNodeId);

  return (
    <div className="flex h-screen overflow-hidden bg-[#2f343c] text-white supports-[height:100dvh]:h-[100dvh]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[50px] shrink-0 items-center justify-between border-b border-white/8 bg-[#262a2f] px-3 lg:h-[54px] lg:px-5">
          <div className="flex items-center gap-1.5 lg:gap-3">
            <ActionButton icon={<ArrowLeft className="h-7 w-7" />} onClick={() => window.history.back()} />
            <ActionButton icon={<Save className="h-6 w-6" />} label="Save" onClick={handleSaveExperiment} />
            <ActionButton icon={<Trash2 className="h-6 w-6" />} label="Clear" onClick={handleClearWorkspace} />
            <ActionButton icon={<Settings2 className="h-6 w-6" />} label="Setting" />
          </div>

          <div className="hidden items-center gap-2 text-[16px] text-white/82 md:flex lg:text-[18px]">
            <span className="text-[15px] lg:text-[17px]">Unnamed</span>
            <Pencil className="h-4 w-4 lg:h-5 lg:w-5" />
          </div>

          <div className="flex items-center gap-2 text-white/75">
            <Monitor className="h-5 w-5 lg:h-6 lg:w-6" />
            <span className="hidden text-[14px] sm:inline lg:text-[16px]">Teaching demo</span>
          </div>
        </header>

        <main className="flex flex-col min-h-0 flex-1 overflow-hidden lg:flex-row">
          <section className="relative min-h-0 flex-1 overflow-hidden bg-[#3a3f47]">
            <div style={{ zoom: zoomLevel / 100, width: '100%', height: '100%' } as any}>
              <Canvas
                module={activeModule}
                inorganic={{
                  items: inorganicItems,
                  selectedId: selectedInorganicId,
                  onSelect: setSelectedInorganicId,
                  onMove: (id, x, y) => {
                    setInorganicItems((current) =>
                      current.map((item) => (item.instanceId === id ? { ...item, x, y } : item))
                    );
                  },
                  onCombine: handleInorganicCombine,
                  onDrop: handleInorganicDrop,
                  onUpdate: handleInorganicUpdate,
                  onRemove: handleInorganicRemove,
                }}
                organic={{
                  atoms: organicAtoms,
                  bonds: organicBonds,
                  selectedNodeId: selectedOrganicNodeId,
                  pendingBondStartId,
                  selectedTool: selectedOrganicTool,
                  onCanvasAction: handleOrganicCanvasAction,
                  onNodeAction: handleOrganicNodeAction,
                  onMoveNode: (id, x, y) => {
                    setOrganicAtoms((current) =>
                      current.map((atom) => (atom.id === id ? { ...atom, x, y } : atom))
                    );
                  },
                }}
              />
            </div>

            <button
              onClick={() => {
                const nextVal = !showOnlyVessels;
                setShowOnlyVessels(nextVal);
                if (nextVal) {
                  setActiveCategory("glassware");
                }
              }}
              className="absolute right-[8px] top-1/2 z-20 hidden h-11 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#3a3f47] text-white/38 lg:flex hover:text-white transition duration-150 cursor-pointer"
            >
              {showOnlyVessels ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
            </button>

            <div className="absolute bottom-4 left-3 right-3 z-20 flex flex-wrap items-center gap-2.5 lg:bottom-8 lg:left-8 lg:right-auto lg:flex-nowrap lg:gap-4">
              <div className="rounded-lg bg-[#23272d] px-2 py-1.5 shadow-2xl shadow-black/18 lg:px-3 lg:py-2">
                <div className="flex items-center gap-3">
                  <select
                    value={activeModule}
                    onChange={(event) => handleModuleChange(event.target.value as ChemistryModule)}
                    className="max-w-[220px] bg-transparent cursor-pointer text-sm text-white outline-none lg:text-base"
                  >
                    <option value="inorganic" className="text-black cursor-pointer">
                      Inorganic chemistry
                    </option>
                    <option value="organic" className="text-black cursor-pointer">
                      Organic chemistry
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg bg-[#23272d] px-2 py-1.5 shadow-2xl shadow-black/18 lg:px-3 lg:py-2">
                <div className="flex items-center gap-4">
                  <button onClick={handleZoomOut} className="opacity-80 cursor-pointer hover:opacity-100" title="Zoom Out">
                    <ZoomOut className="h-6 w-6 text-white/82" />
                  </button>
                  <div className="h-7 w-px bg-white/16" />
                  <span className="text-sm text-white lg:text-base min-w-[2rem] text-center">{zoomLevel}%</span>
                  <div className="h-7 w-px bg-white/16" />
                  <button onClick={handleZoomIn} className="opacity-80 cursor-pointer hover:opacity-100" title="Zoom In">
                    <ZoomIn className="h-6 w-6 text-white/82" />
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-[#23272d] px-2 py-1.5 shadow-2xl shadow-black/18 lg:px-3 lg:py-2">
                <div className="flex items-center gap-3 text-white/88">
                  <button
                    onClick={handleDuplicateSelected}
                    disabled={!canDuplicate}
                    className="disabled:opacity-30 cursor-pointer"
                    title="Duplicate"
                  >
                    <Copy className="h-6 w-6" />
                  </button>
                  <button className="opacity-80 cursor-pointer" title="Brush">
                    <SquarePen className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={!canDelete}
                    className="disabled:opacity-30 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 hidden -translate-x-1/2 text-center text-[16px] text-[#8d7458] lg:block">
              Chemical experiments are risky, real-life imitation is prohibited
            </div>

            {isElementsOpen && activeModule === "inorganic" && (
              <div className="absolute right-[16px] top-[16px] z-[40] w-[340px] rounded-xl border border-white/10 bg-[#1c2024]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between border-b border-white/6 pb-2">
                  <h3 className="text-xs font-semibold text-white/90">Elements & Ions Filter</h3>
                  <button
                    onClick={() => setIsElementsOpen(false)}
                    className="rounded-md p-1 text-white/50 hover:bg-white/5 hover:text-white cursor-pointer transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 chemistry-scrollbar">
                  <div>
                    <h4 className="mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Metal</h4>
                    <div className="flex flex-wrap gap-1">
                      {["Li", "Na", "Mg", "Al", "K", "Ca", "Cr", "Mn", "Fe", "Cu", "Zn", "Ag", "Pt"].map((el) => {
                        const active = activeElementFilter === el;
                        return (
                          <button
                            key={el}
                            onClick={() => {
                              setActiveElementFilter(active ? null : el);
                            }}
                            className={`h-6 min-w-[32px] px-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center justify-center ${
                              active
                                ? "bg-[#2990ff] text-white shadow-[0_0_8px_rgba(41,144,255,0.35)] border border-[#2990ff]"
                                : "bg-white/5 border border-white/8 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {el}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Non-Metal</h4>
                    <div className="flex flex-wrap gap-1">
                      {["H", "He", "B", "C", "N", "O", "F", "Ne", "Si", "P", "S", "Cl", "Ar", "Br"].map((el) => {
                        const active = activeElementFilter === el;
                        return (
                          <button
                            key={el}
                            onClick={() => {
                              setActiveElementFilter(active ? null : el);
                            }}
                            className={`h-6 min-w-[32px] px-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center justify-center ${
                              active
                                ? "bg-[#2990ff] text-white shadow-[0_0_8px_rgba(41,144,255,0.35)] border border-[#2990ff]"
                                : "bg-white/5 border border-white/8 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {el}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">Charged Ionic Group</h4>
                    <div className="flex flex-wrap gap-1">
                      {["SO₄²⁻", "NO₃⁻", "OH⁻", "PO₄³⁻", "CO₃²⁻", "HCO₃⁻", "NH₄⁺"].map((el) => {
                        const active = activeElementFilter === el;
                        return (
                          <button
                            key={el}
                            onClick={() => {
                              setActiveElementFilter(active ? null : el);
                            }}
                            className={`h-6 px-1.5 rounded text-[11px] font-medium transition cursor-pointer flex items-center justify-center ${
                              active
                                ? "bg-[#2990ff] text-white shadow-[0_0_8px_rgba(41,144,255,0.35)] border border-[#2990ff]"
                                : "bg-white/5 border border-white/8 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {el}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {activeElementFilter && (
                  <div className="mt-3 border-t border-white/6 pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveElementFilter(null)}
                      className="text-[10px] text-[#2990ff] hover:underline cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className={`min-h-0 overflow-hidden border-t border-white/8 lg:border-l lg:border-t-0 shrink-0 transition-all duration-300 ${showOnlyVessels
              ? "h-[280px] lg:h-full lg:w-[66px] xl:w-[70px]"
              : "h-[280px] lg:h-full lg:w-[350px] xl:w-[360px]"
            }`}>
            <Sidebar
              module={activeModule}
              categories={categories}
              activeCategory={activeCategory}
              searchTerm={searchTerm}
              selectedOrganicToolId={activeModule === "organic" ? selectedOrganicTool.id : undefined}
              items={filteredLibraryItems}
              onCategoryChange={(cat) => {
                setActiveCategory(cat);
                setShowOnlyVessels(false);
                setActiveElementFilter(null);
              }}
              onSearchChange={setSearchTerm}
              onItemClick={handleLibraryItemClick}
              showOnlyVessels={showOnlyVessels}
              activeElementFilter={activeElementFilter}
              onToggleElements={() => setIsElementsOpen(!isElementsOpen)}
              onClearElementFilter={() => setActiveElementFilter(null)}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
