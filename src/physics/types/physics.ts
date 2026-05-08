// ─── Physics Module Types ───────────────────────────────────────────

export interface PhysicsChapter {
  id: string;
  number: number;
  title: string;
  titleHi: string;
  description: string;
  topics: PhysicsTopic[];
}

export interface PhysicsTopic {
  id: string;
  title: string;
  titleHi: string;
  route: string;
  icon: string;
  status: "ready" | "coming-soon";
  description: string;
}

// ─── Coulomb's Law Types ────────────────────────────────────────────

export type ChargeUnit = "C" | "µC" | "nC" | "mC";
export type DistanceUnit = "m" | "cm" | "mm";
export type Polarity = "positive" | "negative" | "neutral";

export interface ChargedBody {
  id: "A" | "B";
  charge: number;
  chargeUnit: ChargeUnit;
  polarity: Polarity;
  position: { x: number; y: number };
}

export interface CoulombState {
  bodyA: ChargedBody;
  bodyB: ChargedBody;
  distance: number;
  distanceUnit: DistanceUnit;
  force: number;
  forceType: "attraction" | "repulsion" | "none";
}

export const COULOMB_CONSTANT = 8.987e9; // N·m²/C²

export const CHARGE_UNIT_MULTIPLIERS: Record<ChargeUnit, number> = {
  C: 1,
  mC: 1e-3,
  "µC": 1e-6,
  nC: 1e-9,
};

export const DISTANCE_UNIT_MULTIPLIERS: Record<DistanceUnit, number> = {
  m: 1,
  cm: 1e-2,
  mm: 1e-3,
};
