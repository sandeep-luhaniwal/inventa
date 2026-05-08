"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Monitor,
  Pencil,
  Save,
  Settings2,
  SquarePen,
  Trash2,
  ZoomIn,
} from "lucide-react";
import Canvas from "@/chemistry/components/Canvas";
import Sidebar from "@/chemistry/components/Sidebar";
import { resolveReaction } from "@/chemistry/reactions";
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
      <div className="flex h-7 w-7 items-center justify-center lg:h-8 lg:w-8">{icon}</div>
      {label ? <span className="text-[11px] lg:text-[12px]">{label}</span> : null}
    </button>
  );
}

export default function ChemistryPage() {
  const [activeModule, setActiveModule] = useState<ChemistryModule>("inorganic");
  const [activeCategory, setActiveCategory] = useState<ChemistryCategory>(getDefaultCategoryForModule("inorganic"));
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomLevel] = useState(94);

  const [inorganicItems, setInorganicItems] = useState<PlacedInorganicItem[]>([]);
  const [selectedInorganicId, setSelectedInorganicId] = useState<string | null>(null);

  const [organicAtoms, setOrganicAtoms] = useState<OrganicNode[]>([]);
  const [organicBonds, setOrganicBonds] = useState<OrganicBond[]>([]);
  const [selectedOrganicNodeId, setSelectedOrganicNodeId] = useState<string | null>(null);
  const [pendingBondStartId, setPendingBondStartId] = useState<string | null>(null);
  const [selectedOrganicTool, setSelectedOrganicTool] = useState<OrganicTool>(DEFAULT_ORGANIC_TOOL);

  const categories = useMemo(() => getCategoriesForModule(activeModule), [activeModule]);

  const filteredLibraryItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return getLibraryForModule(activeModule).filter((item) => {
      if ("hidden" in item && item.hidden) return false;
      const matchesCategory = item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!normalizedSearch) return true;

      const searchFields =
        item.module === "inorganic"
          ? [item.name, item.symbol, item.formula, item.description]
          : [item.label, item.kind, item.description];

      return searchFields.some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  }, [activeCategory, activeModule, searchTerm]);

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
    const placedItem: PlacedInorganicItem = {
      ...item,
      instanceId: createId("lab"),
      x: 90 + offset * 34,
      y: 90 + offset * 26,
    };

    setInorganicItems((current) => [...current, placedItem]);
    setSelectedInorganicId(placedItem.instanceId);
  };

  const handleInorganicCombine = (sourceId: string, targetId: string) => {
    setInorganicItems((current) => {
      const source = current.find((i) => i.instanceId === sourceId);
      const target = current.find((i) => i.instanceId === targetId);

      if (!source || !target || target.state !== "glassware") return current;

      const sourceContents =
        source.state === "glassware" && source.contents?.length ? source.contents : [source];
      const updatedContents = [...(target.contents || []), ...sourceContents];
      
      // Resolve any reactions
      const reaction = resolveReaction(updatedContents);

      return current
        .filter((i) => i.instanceId !== sourceId) // Remove the added chemical from canvas
        .map((i) =>
          i.instanceId === targetId
            ? { ...i, contents: reaction.contents, reactionState: reaction.state ?? "idle", note: reaction.note }
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

    const placedItem: PlacedInorganicItem = {
      ...item,
      instanceId: createId("lab"),
      x,
      y,
      showStick: item.id === "matchbox" ? true : undefined,
      isStriking: item.id === "matchbox" ? false : undefined,
      isLit: item.id === "match", // Auto-light matches when spawned
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
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-white/8 bg-[#262a2f] px-3 lg:h-[64px] lg:px-5">
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

        <main className="grid min-h-0 flex-1 overflow-hidden grid-cols-1 grid-rows-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-1">
          <section className="relative min-h-0 overflow-hidden bg-[#3a3f47]">
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

            <button className="absolute right-[8px] top-1/2 z-20 hidden h-11 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#3a3f47] text-white/38 lg:flex">
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="absolute bottom-4 left-3 right-3 z-20 flex flex-wrap items-center gap-2.5 lg:bottom-8 lg:left-8 lg:right-auto lg:flex-nowrap lg:gap-4">
              <div className="rounded-2xl bg-[#23272d] px-3 py-2.5 shadow-2xl shadow-black/18 lg:px-4 lg:py-3">
                <div className="flex items-center gap-3">
                  <select
                    value={activeModule}
                    onChange={(event) => handleModuleChange(event.target.value as ChemistryModule)}
                    className="max-w-[220px] bg-transparent text-[14px] text-white outline-none lg:text-[16px]"
                  >
                    <option value="inorganic" className="text-black">
                      Inorganic chemistry
                    </option>
                    <option value="organic" className="text-black">
                      Organic chemistry
                    </option>
                  </select>
                  <ChevronUp className="h-3.5 w-3.5 text-white/70" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#23272d] px-3 py-2.5 shadow-2xl shadow-black/18 lg:px-4 lg:py-3">
                <div className="flex items-center gap-4">
                  <ZoomIn className="h-6 w-6 text-white/82" />
                  <div className="h-7 w-px bg-white/16" />
                  <span className="text-[14px] text-white lg:text-[16px]">{zoomLevel}%</span>
                  <ChevronUp className="h-3.5 w-3.5 text-white/72" />
                </div>
              </div>

              <div className="rounded-2xl bg-[#23272d] px-3 py-2.5 shadow-2xl shadow-black/18 lg:px-4 lg:py-3">
                <div className="flex items-center gap-3 text-white/88">
                  <button
                    onClick={handleDuplicateSelected}
                    disabled={!canDuplicate}
                  className="disabled:opacity-30"
                  title="Duplicate"
                >
                    <Copy className="h-6 w-6" />
                  </button>
                  <button className="opacity-80" title="Brush">
                    <SquarePen className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={!canDelete}
                    className="disabled:opacity-30"
                    title="Delete"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                  <button className="opacity-80" title="Zoom">
                    <ZoomIn className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 hidden -translate-x-1/2 text-center text-[16px] text-[#8d7458] lg:block">
              Chemical experiments are risky, real-life imitation is prohibited
            </div>
          </section>

          <section className="min-h-0 overflow-hidden border-t border-white/8 lg:border-l lg:border-t-0">
            <Sidebar
              module={activeModule}
              categories={categories}
              activeCategory={activeCategory}
              searchTerm={searchTerm}
              selectedOrganicToolId={activeModule === "organic" ? selectedOrganicTool.id : undefined}
              items={filteredLibraryItems}
              onCategoryChange={setActiveCategory}
              onSearchChange={setSearchTerm}
              onItemClick={handleLibraryItemClick}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
