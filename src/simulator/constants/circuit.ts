export const SNAP_RADIUS = 14;
export const PIN_RADIUS = 6;
export const COMPONENT_W = 80;
export const COMPONENT_H = 48;
export const GRID_STEP = 30;

export const COLORS = {
  wireActive: "#22c55e",
  wireIdle: "#6366f1",
  wireSelected: "#f59e0b",
  wireSimulate: "#ef4444",
  componentBorder: "#1e40af",
  pinActiveStroke: "#16a34a",
  pinHover: "#fbbf24",
  pinDefault: "#ffffff",
  selectionRing: "#1d4ed8",
  snapIndicator: "#22c55e",
  grid: "#e2e8f0",
  label: "#64748b",
} as const;

export interface WireStyle {
  label: string;
  dash: number[];
}

export const WIRE_STYLES: Record<string, WireStyle> = {
  normal:    { label: "Normal",    dash: [] },
  hookup:    { label: "Hookup",    dash: [8, 6] },
  alligator: { label: "Alligator", dash: [3, 3] },
  automatic: { label: "Automatic", dash: [12, 5] },
};

export interface WireColorOption {
  label: string;
  value: string;
}

export const WIRE_COLOR_OPTIONS: WireColorOption[] = [
  { label: "Black",     value: "#000000" },
  { label: "Red",       value: "#ef4444" },
  { label: "Orange",    value: "#f97316" },
  { label: "Yellow",    value: "#eab308" },
  { label: "Green",     value: "#22c55e" },
  { label: "Turquoise", value: "#14b8a6" },
  { label: "Blue",      value: "#3b82f6" },
  { label: "Purple",    value: "#a855f7" },
  { label: "Pink",      value: "#ec4899" },
  { label: "Brown",     value: "#92400e" },
  { label: "Grey",      value: "#6b7280" },
  { label: "White",     value: "#f1f5f9" },
];

export const LED_COLOR_OPTIONS = [
  { label: "Red", value: "red", hex: "#ef4444" },
  { label: "Orange", value: "orange", hex: "#f97316" },
  { label: "Blue", value: "blue", hex: "#3b82f6" },
  { label: "White", value: "white", hex: "#f8fafc" },
];
