export interface MetalPhysicsMeta {
  label: string;
  symbol: string;
  workFunctionEv: number;
  colors: {
    main: string;
    light: string;
    dark: string;
  };
}

export const METAL_PHYSICS: Record<string, MetalPhysicsMeta> = {
  Cesium: {
    label: "Cesium",
    symbol: "Cs",
    workFunctionEv: 2.14,
    colors: { main: "#ffd700", light: "#fff9c4", dark: "#b8860b" },
  },
  Potassium: {
    label: "Potassium",
    symbol: "K",
    workFunctionEv: 2.3,
    colors: { main: "#c7b37a", light: "#efe5bb", dark: "#7a6640" },
  },
  Sodium: {
    label: "Sodium",
    symbol: "Na",
    workFunctionEv: 2.36,
    colors: { main: "#d9ddd7", light: "#f7f8f5", dark: "#7f8a83" },
  },
  Aluminium: {
    label: "Aluminium",
    symbol: "Al",
    workFunctionEv: 4.08,
    colors: { main: "#94a3b8", light: "#cbd5e1", dark: "#334155" },
  },
  Silver: {
    label: "Silver",
    symbol: "Ag",
    workFunctionEv: 4.26,
    colors: { main: "#e2e8f0", light: "#ffffff", dark: "#64748b" },
  },
  Iron: {
    label: "Iron",
    symbol: "Fe",
    workFunctionEv: 4.5,
    colors: { main: "#52525b", light: "#a1a1aa", dark: "#18181b" },
  },
  Copper: {
    label: "Copper",
    symbol: "Cu",
    workFunctionEv: 4.65,
    colors: { main: "#b87333", light: "#f9bc8e", dark: "#6b3e1e" },
  },
  Brass: {
    label: "Brass",
    symbol: "Br",
    workFunctionEv: 4.7,
    colors: { main: "#d4af37", light: "#f1c40f", dark: "#856404" },
  },
  Platinum: {
    label: "Platinum",
    symbol: "Pt",
    workFunctionEv: 5.65,
    colors: { main: "#e5e4e2", light: "#ffffff", dark: "#7f8c8d" },
  },
};

export const METAL_OPTIONS = Object.keys(METAL_PHYSICS);
