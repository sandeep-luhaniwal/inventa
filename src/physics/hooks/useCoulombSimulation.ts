"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ChargedBody,
  ChargeUnit,
  DistanceUnit,
  Polarity,
} from "../types/physics";
import {
  calculateForce,
  getForceType,
  getIonCount,
  getGlowIntensity,
  getVibrationAmplitude,
  getFieldLineCount,
  formatForce,
} from "../utils/coulombEngine";

interface UseCoulombSimulationReturn {
  bodyA: ChargedBody;
  bodyB: ChargedBody;
  distance: number;
  distanceUnit: DistanceUnit;
  force: number;
  forceFormatted: string;
  forceType: "attraction" | "repulsion" | "none";
  ionCountA: number;
  ionCountB: number;
  glowA: number;
  glowB: number;
  vibrationAmplitude: number;
  fieldLineCount: number;
  setCharge: (bodyId: "A" | "B", value: number) => void;
  setChargeUnit: (bodyId: "A" | "B", unit: ChargeUnit) => void;
  setPolarity: (bodyId: "A" | "B", polarity: Polarity) => void;
  setDistance: (value: number) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setBodyPosition: (bodyId: "A" | "B", x: number, y: number) => void;
  resetSimulation: () => void;
}

const DEFAULT_BODY_A: ChargedBody = {
  id: "A",
  charge: 5,
  chargeUnit: "µC",
  polarity: "positive",
  position: { x: 250, y: 300 },
};

const DEFAULT_BODY_B: ChargedBody = {
  id: "B",
  charge: 3,
  chargeUnit: "µC",
  polarity: "negative",
  position: { x: 650, y: 300 },
};

const DEFAULT_DISTANCE = 0.5;
const DEFAULT_DISTANCE_UNIT: DistanceUnit = "m";

export function useCoulombSimulation(): UseCoulombSimulationReturn {
  const [bodyA, setBodyA] = useState<ChargedBody>(DEFAULT_BODY_A);
  const [bodyB, setBodyB] = useState<ChargedBody>(DEFAULT_BODY_B);
  const [distance, setDistanceState] = useState<number>(DEFAULT_DISTANCE);
  const [distanceUnit, setDistanceUnitState] =
    useState<DistanceUnit>(DEFAULT_DISTANCE_UNIT);

  // Derived: effective signed charges
  const effectiveQ1 = bodyA.polarity === "negative" ? -Math.abs(bodyA.charge) : Math.abs(bodyA.charge);
  const effectiveQ2 = bodyB.polarity === "negative" ? -Math.abs(bodyB.charge) : Math.abs(bodyB.charge);

  // Force calculation
  const force = useMemo(
    () =>
      calculateForce(
        Math.abs(bodyA.charge),
        bodyA.chargeUnit,
        Math.abs(bodyB.charge),
        bodyB.chargeUnit,
        distance,
        distanceUnit
      ),
    [bodyA.charge, bodyA.chargeUnit, bodyB.charge, bodyB.chargeUnit, distance, distanceUnit]
  );

  const forceType = useMemo(
    () => getForceType(effectiveQ1, effectiveQ2),
    [effectiveQ1, effectiveQ2]
  );

  const forceFormatted = useMemo(() => formatForce(force), [force]);

  // Visualization values
  const ionCountA = useMemo(() => getIonCount(bodyA.charge), [bodyA.charge]);
  const ionCountB = useMemo(() => getIonCount(bodyB.charge), [bodyB.charge]);
  const glowA = useMemo(() => getGlowIntensity(bodyA.charge), [bodyA.charge]);
  const glowB = useMemo(() => getGlowIntensity(bodyB.charge), [bodyB.charge]);
  const vibrationAmplitude = useMemo(() => getVibrationAmplitude(force), [force]);
  const fieldLineCount = useMemo(() => getFieldLineCount(force), [force]);

  // Setters
  const setCharge = useCallback((bodyId: "A" | "B", value: number) => {
    const setter = bodyId === "A" ? setBodyA : setBodyB;
    setter((prev) => ({ ...prev, charge: Math.max(0, value) }));
  }, []);

  const setChargeUnit = useCallback((bodyId: "A" | "B", unit: ChargeUnit) => {
    const setter = bodyId === "A" ? setBodyA : setBodyB;
    setter((prev) => ({ ...prev, chargeUnit: unit }));
  }, []);

  const setPolarity = useCallback((bodyId: "A" | "B", polarity: Polarity) => {
    const setter = bodyId === "A" ? setBodyA : setBodyB;
    setter((prev) => ({ ...prev, polarity }));
  }, []);

  const setDistance = useCallback((value: number) => {
    setDistanceState(Math.max(0.001, value));
  }, []);

  const setDistanceUnit = useCallback((unit: DistanceUnit) => {
    setDistanceUnitState(unit);
  }, []);

  const setBodyPosition = useCallback(
    (bodyId: "A" | "B", x: number, y: number) => {
      const setter = bodyId === "A" ? setBodyA : setBodyB;
      setter((prev) => ({ ...prev, position: { x, y } }));
    },
    []
  );

  const resetSimulation = useCallback(() => {
    setBodyA(DEFAULT_BODY_A);
    setBodyB(DEFAULT_BODY_B);
    setDistanceState(DEFAULT_DISTANCE);
    setDistanceUnitState(DEFAULT_DISTANCE_UNIT);
  }, []);

  return {
    bodyA,
    bodyB,
    distance,
    distanceUnit,
    force,
    forceFormatted,
    forceType,
    ionCountA,
    ionCountB,
    glowA,
    glowB,
    vibrationAmplitude,
    fieldLineCount,
    setCharge,
    setChargeUnit,
    setPolarity,
    setDistance,
    setDistanceUnit,
    setBodyPosition,
    resetSimulation,
  };
}
