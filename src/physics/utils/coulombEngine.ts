import {
  COULOMB_CONSTANT,
  CHARGE_UNIT_MULTIPLIERS,
  DISTANCE_UNIT_MULTIPLIERS,
  ChargeUnit,
  DistanceUnit,
} from "../types/physics";

// ─── Core Calculations ─────────────────────────────────────────────

/**
 * Calculate Coulomb force in Newtons.
 * F = k × |q₁ × q₂| / r²
 * Returns absolute magnitude — sign/direction handled separately.
 */
export function calculateForce(
  q1: number,
  q1Unit: ChargeUnit,
  q2: number,
  q2Unit: ChargeUnit,
  r: number,
  rUnit: DistanceUnit
): number {
  const q1SI = q1 * CHARGE_UNIT_MULTIPLIERS[q1Unit];
  const q2SI = q2 * CHARGE_UNIT_MULTIPLIERS[q2Unit];
  const rSI = r * DISTANCE_UNIT_MULTIPLIERS[rUnit];

  if (rSI === 0) return Infinity;
  if (q1SI === 0 || q2SI === 0) return 0;

  return COULOMB_CONSTANT * Math.abs(q1SI * q2SI) / (rSI * rSI);
}

/**
 * Determine if the force is attraction or repulsion.
 */
export function getForceType(
  q1: number,
  q2: number
): "attraction" | "repulsion" | "none" {
  if (q1 === 0 || q2 === 0) return "none";
  const product = q1 * q2;
  if (product < 0) return "attraction";
  return "repulsion";
}

// ─── Visualization Helpers ──────────────────────────────────────────

/**
 * Map charge magnitude to a display ion count (capped for visual clarity).
 */
export function getIonCount(charge: number): number {
  const abs = Math.abs(charge);
  if (abs === 0) return 0;
  // Scale: 1 charge → 3 ions, up to max 15
  return Math.min(15, Math.max(1, Math.round(abs * 3)));
}

/**
 * Map charge magnitude to a glow intensity [0, 1].
 */
export function getGlowIntensity(charge: number): number {
  const abs = Math.abs(charge);
  if (abs === 0) return 0;
  // Logarithmic curve for natural feel
  return Math.min(1, 0.2 + Math.log10(abs + 1) * 0.4);
}

/**
 * Calculate vibration amplitude in pixels from force magnitude.
 */
export function getVibrationAmplitude(force: number): number {
  if (force === 0 || !isFinite(force)) return 0;
  // Log scale: small forces → subtle shake, large → strong
  const logForce = Math.log10(Math.abs(force) + 1);
  return Math.min(6, logForce * 1.5);
}

/**
 * Get the number of electric field lines to render based on force magnitude.
 */
export function getFieldLineCount(force: number): number {
  if (force === 0 || !isFinite(force)) return 0;
  const logF = Math.log10(Math.abs(force) + 1);
  return Math.min(8, Math.max(2, Math.round(logF * 2 + 2)));
}

/**
 * Format force value for display (scientific notation for very large/small).
 */
export function formatForce(force: number): string {
  if (!isFinite(force)) return "∞";
  if (force === 0) return "0 N";
  if (force >= 1e6) return `${(force / 1e6).toFixed(2)} × 10⁶ N`;
  if (force >= 1e3) return `${(force / 1e3).toFixed(2)} × 10³ N`;
  if (force >= 1) return `${force.toFixed(4)} N`;
  if (force >= 1e-3) return `${(force * 1e3).toFixed(4)} × 10⁻³ N`;
  if (force >= 1e-6) return `${(force * 1e6).toFixed(4)} × 10⁻⁶ N`;
  return `${force.toExponential(3)} N`;
}

/**
 * Format charge value with unit.
 */
export function formatCharge(charge: number, unit: ChargeUnit): string {
  const sign = charge >= 0 ? "+" : "";
  return `${sign}${charge} ${unit}`;
}

/**
 * Generate SVG path data for electric field lines between two points.
 * For attraction: curves from A → B
 * For repulsion: curves bending outward from midpoint
 */
export function generateFieldLinePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineIndex: number,
  totalLines: number,
  forceType: "attraction" | "repulsion" | "none"
): string {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Spread lines vertically
  const spread = ((lineIndex - (totalLines - 1) / 2) / Math.max(totalLines - 1, 1)) * 120;

  if (forceType === "attraction") {
    // Smooth curves flowing from one sphere to the other
    const cpY = midY + spread;
    return `M ${x1} ${y1} Q ${midX} ${cpY} ${x2} ${y2}`;
  } else if (forceType === "repulsion") {
    // Lines that emanate outward, bending away from the midpoint
    const bendX1 = x1 + dx * 0.25;
    const bendX2 = x1 + dx * 0.75;
    const outwardY = midY + spread * 1.8;
    return `M ${x1} ${y1} C ${bendX1} ${outwardY} ${bendX2} ${outwardY} ${x2} ${y2}`;
  }

  return `M ${x1} ${y1} L ${x2} ${y2}`;
}
