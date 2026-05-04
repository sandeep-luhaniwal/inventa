export type ChemistryModule = "inorganic" | "organic";

export type InorganicCategory =
  | "glassware"
  | "equipment"
  | "solids"
  | "liquids"
  | "gases";

export type OrganicCategory = "atoms" | "bonds" | "rings" | "groups";

export type ChemistryCategory = InorganicCategory | OrganicCategory;

export interface SidebarCategory {
  id: ChemistryCategory;
  name: string;
  hint: string;
}

export interface InorganicLibraryItem {
  id: string;
  module: "inorganic";
  category: InorganicCategory;
  name: string;
  symbol: string;
  formula?: string;
  state: "glassware" | "device" | "solid" | "liquid" | "gas";
  accent: string;
  description: string;
}

export type OrganicTool =
  | { kind: "atom"; id: string; label: string; color: string; description: string }
  | { kind: "bond"; id: string; label: string; order: 1 | 2 | 3 | "aromatic"; color: string; description: string }
  | { kind: "ring"; id: string; label: string; template: "benzene" | "cyclohexane"; color: string; description: string }
  | { kind: "group"; id: string; label: string; color: string; description: string };

export type OrganicLibraryItem = OrganicTool & {
  module: "organic";
  category: OrganicCategory;
};

export type ChemistryLibraryItem = InorganicLibraryItem | OrganicLibraryItem;

export interface PlacedInorganicItem extends InorganicLibraryItem {
  instanceId: string;
  x: number;
  y: number;
  rotation?: number;
  isOpen?: boolean;
  isLit?: boolean;
  isHeated?: boolean;
  reactionState?: "idle" | "heating" | "boiling" | "burst" | "gas" | "precipitate" | "reduction";
  note?: string;
  contents?: InorganicLibraryItem[];
}

export interface OrganicNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface OrganicBond {
  id: string;
  from: string;
  to: string;
  order: 1 | 2 | 3 | "aromatic";
}
