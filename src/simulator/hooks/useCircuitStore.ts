"use client"
import { useState, useCallback, useRef, useEffect } from "react";
import { ConnectingFrom, HistoryEntry, Note, PlacedComponent, Wire, WirePoint, Drawing } from "../types/circuit";
import { getLedDataUrls, STATIC_COMPONENTS, svgToDataUrl, getCapacitorDataUrl, getSphereDataUrls } from "../constants/staticComponents";
import { METAL_PHYSICS } from "../constants/physics";
import { relativePinsToPorts } from "../utils/circuitUtils";

export type { PlacedComponent, Wire, ConnectingFrom };

const STORAGE_KEY = "circuit_project";
const FRICTION_CHARGE_DELAY_MS = 5000;
const INDUCTION_RANGE = 300;
const INDUCTION_FINALIZE_DISTANCE = 220;
const POTENTIAL_RING_RADIUS_FACTOR = 4;
const POTENTIAL_DIFFERENCE_VISUAL_RADIUS_SCALE = 0.78;
const POTENTIAL_DIFFERENCE_OUTER_RING_FACTOR = 3.85;
type FrictionContact = {
  startedAt: number;
  charged: boolean;
};

function resolveStaticComponentImages(comp: PlacedComponent): PlacedComponent {
  const normalizedComp = comp.componentId.startsWith("sphere_") &&
    (!comp.physicsChargeMethod || comp.physicsChargeMethod === "Methods of Charging")
    ? {
      ...comp,
      chargeValue: 0,
      physicsWaveDirection: undefined,
      physicsWaveTick: undefined,
    }
    : comp;

  let result = normalizedComp;

  if (comp.componentId === "breadboard") {
    result = normalizedComp;
  } else if (comp.componentId.startsWith("led_") || comp.componentId === "led") {
    const resolvedColor =
      comp.ledColor ??
      (comp.componentId.startsWith("led_")
        ? comp.componentId.replace("led_", "")
        : "red");
    const { imageSrc, litImageSrc } = getLedDataUrls(resolvedColor, false, comp.id);
    result = {
      ...normalizedComp,
      ledColor: resolvedColor,
      imageSrc,
      litImageSrc,
    };
  } else if (comp.componentId === "capacitor") {
    result = {
      ...normalizedComp,
      imageSrc: getCapacitorDataUrl(comp.capacitanceValue ?? 1000, comp.capacitanceUnit ?? "uF", comp.voltageValue ?? 25, false, comp.id),
    };
  } else if (comp.componentId === "sphere_red") {
    result = {
      ...normalizedComp,
      imageSrc: getSphereDataUrls(comp.physicsMetal || "Copper", false, comp.id).imageSrc,
    };
  } else {
    const def = STATIC_COMPONENTS.find((item) => item.id === comp.componentId);
    if (def) {
      result = {
        ...normalizedComp,
        imageSrc: svgToDataUrl(def, false, false, comp.id),
        litImageSrc: def.litSvgBody ? svgToDataUrl(def, true, false, comp.id) : comp.litImageSrc,
      };
    }
  }

  // Always sync width, height, relativePins, and ports from the static definition if one exists
  const def = STATIC_COMPONENTS.find((item) => item.id === comp.componentId);
  if (def && comp.componentId !== "breadboard") {
    const isSphere = comp.componentId.startsWith("sphere_");
    result = {
      ...result,
      width: isSphere ? result.width : def.viewBoxW,
      height: isSphere ? result.height : def.viewBoxH,
      relativePins: def.relativePins,
      ports: relativePinsToPorts(
        def.relativePins,
        isSphere ? (result.width ?? def.viewBoxW) : def.viewBoxW,
        isSphere ? (result.height ?? def.viewBoxH) : def.viewBoxH
      ),
    };
  }

  return result;
}

const METAL_WORK_FUNCTIONS = Object.fromEntries(
  Object.entries(METAL_PHYSICS).map(([metal, meta]) => [metal, meta.workFunctionEv])
) as Record<string, number>;

function applyChargeChange(
  component: PlacedComponent,
  nextChargeValue: number,
  forcedWaveDirection?: "outward" | "inward"
): PlacedComponent {
  const currentMagnitude = Math.abs(component.chargeValue || 0);
  const nextMagnitude = Math.abs(nextChargeValue);
  const direction = forcedWaveDirection ??
    (nextMagnitude > currentMagnitude
      ? "outward"
      : nextMagnitude < currentMagnitude
        ? "inward"
        : component.physicsWaveDirection);
  const nextColor = nextChargeValue >= 0 ? "#ef4444" : "#3b82f6";

  if (
    component.chargeValue === nextChargeValue &&
    component.physicsColor === nextColor &&
    component.physicsWaveDirection === direction
  ) {
    return component;
  }

  return {
    ...component,
    chargeValue: nextChargeValue,
    physicsColor: nextColor,
    physicsWaveDirection: direction,
    physicsWaveTick: direction ? Date.now() : component.physicsWaveTick,
  };
}

function getFrictionContactKey(idA: string, idB: string) {
  return [idA, idB].sort().join(":");
}

function clearFrictionContactsFor(
  id: string,
  frictionContacts: Map<string, FrictionContact>,
  exceptKey?: string
) {
  for (const key of frictionContacts.keys()) {
    if (key !== exceptKey && key.split(":").includes(id)) {
      frictionContacts.delete(key);
    }
  }
}

function clearAllFrictionContacts(frictionContacts: Map<string, FrictionContact>) {
  frictionContacts.clear();
}

function areSpheresTouching(a: PlacedComponent, b: PlacedComponent) {
  const radiusA = (a.width || 100) / 2;
  const radiusB = (b.width || 100) / 2;
  const centerA = { x: a.x + radiusA, y: a.y + radiusA };
  const centerB = { x: b.x + radiusB, y: b.y + radiusB };
  return Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y) < radiusA + radiusB + 12;
}

function getSphereDistance(a: PlacedComponent, b: PlacedComponent) {
  const radiusA = (a.width || 100) / 2;
  const radiusB = (b.width || 100) / 2;
  const centerA = { x: a.x + radiusA, y: a.y + radiusA };
  const centerB = { x: b.x + radiusB, y: b.y + radiusB };
  return Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);
}

function getSphereCenter(component: PlacedComponent) {
  const radius = (component.width || 100) / 2;
  return {
    x: component.x + radius,
    y: component.y + radius,
  };
}

function clampPotentialDifferenceProbes(components: PlacedComponent[]) {
  const potentialDifferenceSpheres = components.filter((component) =>
    component.componentId.startsWith("sphere_") &&
    component.physicsTopic === "Electric Potential Difference"
  );
  const sourceSphere = potentialDifferenceSpheres.find((component) => Math.abs(component.chargeValue || 0) > 0);

  if (!sourceSphere) return components;

  const sourceCenter = getSphereCenter(sourceSphere);
  const sourceRadius = (sourceSphere.width || 100) / 2;
  const outerRingRadius = sourceRadius * POTENTIAL_DIFFERENCE_VISUAL_RADIUS_SCALE * POTENTIAL_DIFFERENCE_OUTER_RING_FACTOR;
  let changed = false;

  const nextComponents = components.map((component) => {
    if (
      component.id === sourceSphere.id ||
      !potentialDifferenceSpheres.some((sphere) => sphere.id === component.id)
    ) {
      return component;
    }

    const probeCenter = getSphereCenter(component);
    const dx = probeCenter.x - sourceCenter.x;
    const dy = probeCenter.y - sourceCenter.y;
    const distance = Math.hypot(dx, dy);

    const probeRadius = ((component.width || 100) / 2) * POTENTIAL_DIFFERENCE_VISUAL_RADIUS_SCALE;
    const maxProbeCenterDistance = Math.max(sourceRadius, outerRingRadius - probeRadius);

    if (distance <= maxProbeCenterDistance || distance === 0) return component;

    const scale = maxProbeCenterDistance / distance;
    const nextCenterX = sourceCenter.x + dx * scale;
    const nextCenterY = sourceCenter.y + dy * scale;
    const width = component.width || 100;
    const height = component.height || width;
    changed = true;

    return {
      ...component,
      x: nextCenterX - width / 2,
      y: nextCenterY - height / 2,
    };
  });

  return changed ? nextComponents : components;
}

function applyElectricPotentialDistances(components: PlacedComponent[]) {
  const potentialSpheres = components.filter((component) =>
    component.componentId.startsWith("sphere_") &&
    component.physicsTopic === "Electric Potential"
  );

  if (potentialSpheres.length < 2) return components;

  let changed = false;
  const nextComponents = components.map((component) => {
    if (!potentialSpheres.some((sphere) => sphere.id === component.id)) return component;

    const isSourceSphere = Math.abs(component.chargeValue || 0) > 0;
    const candidates = potentialSpheres.filter((sphere) => {
      if (sphere.id === component.id) return false;
      return isSourceSphere || Math.abs(sphere.chargeValue || 0) > 0;
    });
    if (!candidates.length) return component;

    const nearest = candidates.reduce(
      (best, candidate) => {
        const distance = getSphereDistance(component, candidate);
        return !best || distance < best.distance ? { component: candidate, distance } : best;
      },
      null as { component: PlacedComponent; distance: number } | null
    );
    if (!nearest) return component;

    const sourceSphere = isSourceSphere ? component : nearest.component;
    const testSphere = isSourceSphere ? nearest.component : component;
    const sourceRadiusPx = (sourceSphere.width || 100) / 2;
    const testRadiusPx = (testSphere.width || 100) / 2;
    const outerRingTouchDistancePx = sourceRadiusPx * POTENTIAL_RING_RADIUS_FACTOR + testRadiusPx;
    const distanceM = nearest.distance <= outerRingTouchDistancePx
      ? Number((nearest.distance / 100).toFixed(3))
      : Infinity;
    const currentDistance = component.physicsObservationDistance ?? -1;
    const distanceUnchanged = Number.isFinite(distanceM) && Number.isFinite(currentDistance)
      ? Math.abs(currentDistance - distanceM) < 0.001
      : currentDistance === distanceM;
    if (distanceUnchanged) {
      return component;
    }

    changed = true;
    return {
      ...component,
      physicsObservationDistance: distanceM,
    };
  });

  return changed ? nextComponents : components;
}

function findNearestChargedSphere(
  component: PlacedComponent,
  components: PlacedComponent[],
  range: number
) {
  let nearest: PlacedComponent | undefined;
  let minDistance = Infinity;

  for (const candidate of components) {
    if (
      candidate.id === component.id ||
      !candidate.componentId.startsWith("sphere_") ||
      !candidate.chargeValue
    ) {
      continue;
    }

    const distance = getSphereDistance(component, candidate);
    if (distance < range && distance < minDistance) {
      nearest = candidate;
      minDistance = distance;
    }
  }

  return nearest;
}

function hasFrictionMethod(a: PlacedComponent, b: PlacedComponent) {
  return a.physicsChargeMethod === "Friction" || b.physicsChargeMethod === "Friction";
}

function hasConductionMethod(a: PlacedComponent, b: PlacedComponent) {
  return a.physicsChargeMethod === "Conduction" || b.physicsChargeMethod === "Conduction";
}

function applyFrictionChargePair(
  components: PlacedComponent[],
  sphereA: PlacedComponent,
  sphereB: PlacedComponent
) {
  const wfA = METAL_WORK_FUNCTIONS[sphereA.physicsMetal || "Copper"] || 4.65;
  const wfB = METAL_WORK_FUNCTIONS[sphereB.physicsMetal || "Copper"] || 4.65;

  return components.map((component) => {
    if (component.id !== sphereA.id && component.id !== sphereB.id) return component;

    if (wfA === wfB) {
      return applyChargeChange(component, 0);
    }

    const transferAmount = 5;
    const nextChargeValue = component.id === sphereA.id
      ? (wfA < wfB ? transferAmount : -transferAmount)
      : (wfB < wfA ? transferAmount : -transferAmount);
    const waveDirection = nextChargeValue >= 0 ? "outward" : "inward";

    return applyChargeChange(component, nextChargeValue, waveDirection);
  });
}

function applyConductionChargePair(
  components: PlacedComponent[],
  sphereA: PlacedComponent,
  sphereB: PlacedComponent
) {
  const sharedCharge = ((sphereA.chargeValue || 0) + (sphereB.chargeValue || 0)) / 2;
  let changed = false;

  const nextComponents = components.map((component) => {
    if (component.id !== sphereA.id && component.id !== sphereB.id) {
      return component;
    }

    const nextComponent = applyChargeChange(
      component,
      sharedCharge,
      sharedCharge === 0 ? undefined : sharedCharge > 0 ? "outward" : "inward"
    );
    if (nextComponent !== component) {
      changed = true;
    }

    return nextComponent;
  });

  return changed ? nextComponents : components;
}

function applyConductionForWire(components: PlacedComponent[], wire: Wire) {
  const sphereA = components.find((component) => component.id === wire.from.compId);
  const sphereB = components.find((component) => component.id === wire.to.compId);

  if (
    !sphereA ||
    !sphereB ||
    sphereA.id === sphereB.id ||
    !sphereA.componentId.startsWith("sphere_") ||
    !sphereB.componentId.startsWith("sphere_") ||
    !hasConductionMethod(sphereA, sphereB)
  ) {
    return components;
  }

  return applyConductionChargePair(components, sphereA, sphereB);
}

function applyConductionForWires(components: PlacedComponent[], wires: Wire[]) {
  return wires.reduce(
    (nextComponents, wire) => applyConductionForWire(nextComponents, wire),
    components
  );
}

function applyReadyFrictionCharges(
  components: PlacedComponent[],
  frictionContacts: Map<string, FrictionContact>
) {
  const spheres = components.filter((component) => component.componentId.startsWith("sphere_"));
  const activeKeys = new Set<string>();
  let nextComponents = components;

  for (let i = 0; i < spheres.length; i += 1) {
    for (let j = i + 1; j < spheres.length; j += 1) {
      const sphereA = spheres[i];
      const sphereB = spheres[j];
      if (!hasFrictionMethod(sphereA, sphereB) || !areSpheresTouching(sphereA, sphereB)) {
        continue;
      }

      const contactKey = getFrictionContactKey(sphereA.id, sphereB.id);
      activeKeys.add(contactKey);

      if (!frictionContacts.has(contactKey)) {
        frictionContacts.set(contactKey, { startedAt: Date.now(), charged: false });
      }
      const contact = frictionContacts.get(contactKey)!;

      if (!contact.charged && Date.now() - contact.startedAt >= FRICTION_CHARGE_DELAY_MS) {
        contact.charged = true;
        nextComponents = applyFrictionChargePair(nextComponents, sphereA, sphereB);
      }
    }
  }

  for (const key of frictionContacts.keys()) {
    if (!activeKeys.has(key)) {
      frictionContacts.delete(key);
    }
  }

  return nextComponents;
}

function applySphereInteractions(
  components: PlacedComponent[],
  movedId: string,
  frictionContacts: Map<string, FrictionContact>
): PlacedComponent[] {
  const movedIdx = components.findIndex((c) => c.id === movedId);
  if (movedIdx === -1) return components;

  const movedComp = components[movedIdx];
  if (!movedComp.componentId.startsWith("sphere_")) {
    clearFrictionContactsFor(movedId, frictionContacts);
    return components;
  }

  const touchedSphere = components.find((c) => (
    c.id !== movedComp.id &&
    c.componentId.startsWith("sphere_") &&
    areSpheresTouching(movedComp, c)
  ));
  const frictionTouchedSphere = touchedSphere && hasFrictionMethod(movedComp, touchedSphere)
    ? touchedSphere
    : undefined;

  if (movedComp.physicsChargeMethod === "Friction" || frictionTouchedSphere) {
    if (!frictionTouchedSphere) {
      clearFrictionContactsFor(movedId, frictionContacts);
      return components;
    }

    const contactKey = getFrictionContactKey(movedComp.id, frictionTouchedSphere.id);
    clearFrictionContactsFor(movedComp.id, frictionContacts, contactKey);
    if (!frictionContacts.has(contactKey)) {
      frictionContacts.set(contactKey, { startedAt: Date.now(), charged: false });
    }

    return components;
  }

  clearFrictionContactsFor(movedId, frictionContacts);

  const method = movedComp.physicsChargeMethod;

  if (touchedSphere && hasConductionMethod(movedComp, touchedSphere)) {
    return applyConductionChargePair(components, movedComp, touchedSphere);
  }

  let didFinalizeInduction = false;
  const finalizedByInduction = components.map((component) => {
    if (
      !component.componentId.startsWith("sphere_") ||
      component.physicsChargeMethod !== "Induction" ||
      component.physicsEarthing === "Earthed" ||
      !component.physicsInductionSourceId ||
      !component.physicsInductionPendingCharge
    ) {
      return component;
    }

    const source = components.find((candidate) => candidate.id === component.physicsInductionSourceId);
    if (!source || getSphereDistance(component, source) <= INDUCTION_FINALIZE_DISTANCE) {
      return component;
    }

    const finalCharge = component.physicsInductionPendingCharge;
    didFinalizeInduction = true;
    return applyChargeChange(
      {
        ...component,
        physicsInductionSourceId: undefined,
        physicsInductionPendingCharge: undefined,
      },
      finalCharge,
      finalCharge >= 0 ? "outward" : "inward"
    );
  });

  if (didFinalizeInduction) {
    return finalizedByInduction;
  }

  if (method === "Earthing" && movedComp.physicsEarthing === "Earthed") {
    return components.map((c) => (c.id === movedComp.id ? applyChargeChange(c, 0) : c));
  }

  return components;
}

function applyReadyInductionCharges(components: PlacedComponent[]) {
  let nextComponents = components;

  for (const component of components) {
    if (
      component.componentId.startsWith("sphere_") &&
      component.physicsChargeMethod === "Induction" &&
      component.physicsEarthing === "Earthed"
    ) {
      const inductor = findNearestChargedSphere(component, components, INDUCTION_RANGE);
      const pendingCharge = inductor ? -(inductor.chargeValue || 0) : undefined;

      if (
        component.chargeValue !== 0 ||
        component.physicsInductionSourceId !== inductor?.id ||
        component.physicsInductionPendingCharge !== pendingCharge
      ) {
        nextComponents = nextComponents.map((candidate) =>
          candidate.id === component.id
            ? {
              ...candidate,
              chargeValue: 0,
              physicsWaveDirection: undefined,
              physicsWaveTick: undefined,
              physicsInductionSourceId: inductor?.id,
              physicsInductionPendingCharge: pendingCharge,
            }
            : candidate
        );
      }

      continue;
    }

    if (
      !component.componentId.startsWith("sphere_") ||
      component.physicsChargeMethod !== "Induction" ||
      component.physicsEarthing === "Earthed" ||
      !component.physicsInductionSourceId ||
      !component.physicsInductionPendingCharge
    ) {
      continue;
    }

    const source = components.find((candidate) => candidate.id === component.physicsInductionSourceId);
    if (!source || getSphereDistance(component, source) <= INDUCTION_FINALIZE_DISTANCE) {
      continue;
    }

    const finalCharge = component.physicsInductionPendingCharge;
    nextComponents = nextComponents.map((candidate) =>
      candidate.id === component.id
        ? applyChargeChange(
          {
            ...candidate,
            physicsInductionSourceId: undefined,
            physicsInductionPendingCharge: undefined,
          },
          finalCharge,
          finalCharge >= 0 ? "outward" : "inward"
        )
        : candidate
    );
  }

  return nextComponents;
}

function snapBulbAndHolder(components: PlacedComponent[], movedId: string): PlacedComponent[] {
  const movedIdx = components.findIndex((c) => c.id === movedId);
  if (movedIdx === -1) return components;

  const movedComp = components[movedIdx];
  if (movedComp.componentId === "ac_bulb") {
    let closestHolder: PlacedComponent | null = null;
    let minDist = 60;
    for (const c of components) {
      if (c.componentId === "bulb_holder") {
        const dist = Math.hypot(movedComp.x - c.x, movedComp.y - c.y);
        if (dist < minDist) {
          minDist = dist;
          closestHolder = c;
        }
      }
    }
    if (closestHolder) {
      return components.map((c) =>
        c.id === movedId ? { ...c, x: closestHolder.x, y: closestHolder.y } : c
      );
    }
  } else if (movedComp.componentId === "bulb_holder") {
    let closestBulb: PlacedComponent | null = null;
    let minDist = 60;
    for (const c of components) {
      if (c.componentId === "ac_bulb") {
        const dist = Math.hypot(movedComp.x - c.x, movedComp.y - c.y);
        if (dist < minDist) {
          minDist = dist;
          closestBulb = c;
        }
      }
    }
    if (closestBulb) {
      return components.map((c) =>
        c.id === movedId ? { ...c, x: closestBulb.x, y: closestBulb.y } : c
      );
    }
  }
  return components;
}

function loadFromStorage(): { components: PlacedComponent[]; wires: Wire[]; notes: Note[]; drawings: Drawing[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { components?: PlacedComponent[]; wires?: Wire[]; notes?: Note[]; drawings?: Drawing[] };
      const components = (parsed.components ?? []).map(resolveStaticComponentImages);
      const wires = parsed.wires ?? [];
      const notes = parsed.notes ?? [];
      const drawings = parsed.drawings ?? [];
      return { components, wires, notes, drawings };
    }
  } catch { }
  return { components: [], wires: [], notes: [], drawings: [] };
}

export function useCircuitStore() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [components, setComponents] = useState<PlacedComponent[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<ConnectingFrom | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [wireColor, setWireColorState] = useState("#3b82f6");
  const [wireType, setWireType] = useState("normal");
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "pencil" | "eraser">("select");
  const [pencilColor, setPencilColor] = useState("#ef4444");
  const frictionContactsRef = useRef<Map<string, FrictionContact>>(new Map());

  // Use a ref for history so saveToHistory never goes stale
  const historyRef = useRef<HistoryEntry[]>([
    {
      components: [],
      wires: [],
      notes: [],
      drawings: [],
    },
  ]);
  const historyIndexRef = useRef(0);
  // Trigger re-render when undo/redo availability changes
  const [, forceUpdate] = useState(0);

  // Hydrate from localStorage on client-side only
  useEffect(() => {
    const initial = loadFromStorage();
    setComponents(initial.components);
    setWires(initial.wires);
    setNotes(initial.notes);
    setDrawings(initial.drawings);
    historyRef.current = [{
      components: initial.components,
      wires: initial.wires,
      notes: initial.notes,
      drawings: initial.drawings,
    }];
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ components, wires, notes, drawings }));
    } catch { }
  }, [components, wires, notes, drawings, isHydrated]);

  useEffect(() => {
    const frictionContacts = frictionContactsRef.current;
    return () => clearAllFrictionContacts(frictionContacts);
  }, []);

  const saveToHistory = useCallback((comps: PlacedComponent[], ws: Wire[], ns: Note[], ds: Drawing[]) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ components: comps, wires: ws, notes: ns, drawings: ds });
    historyIndexRef.current = historyRef.current.length - 1;
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setInterval(() => {
      setComponents((prev) => {
        const afterFriction = applyReadyFrictionCharges(prev, frictionContactsRef.current);
        const afterConduction = applyConductionForWires(afterFriction, wires);
        const next = applyReadyInductionCharges(afterConduction);
        if (next !== prev) {
          saveToHistory(next, wires, notes, drawings);
        }
        return next;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [drawings, isHydrated, notes, saveToHistory, wires]);

  const addComponent = useCallback(
    (comp: PlacedComponent) => {
      setComponents((prev) => {
        const next = applyElectricPotentialDistances(clampPotentialDifferenceProbes([...prev, comp]));
        saveToHistory(next, wires, notes, drawings);
        return next;
      });
    },
    [wires, notes, drawings, saveToHistory]
  );

  const moveComponent = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) => {
      let positioned = prev.map((c) => (c.id === id ? { ...c, x, y } : c));
      positioned = snapBulbAndHolder(positioned, id);
      const constrained = clampPotentialDifferenceProbes(positioned);
      const interacted = applySphereInteractions(
        constrained,
        id,
        frictionContactsRef.current
      );
      return applyElectricPotentialDistances(interacted);
    });
  }, []);

  const commitComponentMove = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) => {
      const movedIdx = prev.findIndex(c => c.id === id);
      if (movedIdx === -1) return prev;

      const oldComp = prev[movedIdx];
      if (oldComp.x === x && oldComp.y === y) return prev;

      let nextComps = prev.map((c) => (c.id === id ? { ...c, x, y } : c));
      nextComps = snapBulbAndHolder(nextComps, id);
      nextComps = clampPotentialDifferenceProbes(nextComps);
      nextComps = applySphereInteractions(
        nextComps,
        id,
        frictionContactsRef.current
      );
      nextComps = applyElectricPotentialDistances(nextComps);

      saveToHistory(nextComps, wires, notes, drawings);
      return nextComps;
    });
  }, [notes, saveToHistory, wires, drawings]);

  const updateComponent = useCallback((id: string, updates: Partial<PlacedComponent>) => {
    setComponents((prev) => {
      let resolvedUpdates = updates;
      const comp = prev.find(c => c.id === id);
      if (updates.ledColor !== undefined && comp) {
        const { imageSrc, litImageSrc } = getLedDataUrls(updates.ledColor, false, comp.id);
        resolvedUpdates = { ...updates, imageSrc, litImageSrc };
      }

      if (comp) {
        if (comp.componentId === "capacitor" && (updates.capacitanceValue !== undefined || updates.capacitanceUnit !== undefined || updates.voltageValue !== undefined)) {
          const capVal = updates.capacitanceValue !== undefined ? updates.capacitanceValue : comp.capacitanceValue;
          const capUnit = updates.capacitanceUnit !== undefined ? updates.capacitanceUnit : comp.capacitanceUnit;
          const voltVal = updates.voltageValue !== undefined ? updates.voltageValue : comp.voltageValue;
          resolvedUpdates = {
            ...resolvedUpdates,
            imageSrc: getCapacitorDataUrl(capVal ?? 1000, capUnit ?? "uF", voltVal ?? 25, false, comp.id)
          };
        } else if (comp.componentId === "sphere_red" && updates.physicsMetal !== undefined) {
          resolvedUpdates = {
            ...resolvedUpdates,
            imageSrc: getSphereDataUrls(updates.physicsMetal, false, comp.id).imageSrc
          };
        }
      }
      if (comp && comp.componentId.startsWith('sphere_') && updates.physicsEarthing !== undefined) {
        // Induction / Earthing Logic
        if (updates.physicsEarthing === "Earthed" && comp.physicsChargeMethod === "Induction") {
          const inductor = findNearestChargedSphere(comp, prev, INDUCTION_RANGE);

          if (inductor) {
            // Earth supplies charge; it becomes permanent after ungrounding and moving the charged sphere away.
            resolvedUpdates = {
              ...resolvedUpdates,
              chargeValue: 0,
              physicsWaveDirection: undefined,
              physicsWaveTick: undefined,
              physicsInductionSourceId: inductor.id,
              physicsInductionPendingCharge: -(inductor.chargeValue || 0),
            };
          } else {
            // Earth neutralizes if no inductor
            resolvedUpdates = {
              ...resolvedUpdates,
              chargeValue: 0,
              physicsInductionSourceId: undefined,
              physicsInductionPendingCharge: undefined,
            };
          }
        } else if (updates.physicsEarthing === "Earthed") {
          resolvedUpdates = {
            ...resolvedUpdates,
            chargeValue: 0,
            physicsInductionSourceId: undefined,
            physicsInductionPendingCharge: undefined,
          };
        }
      }

      const updated = clampPotentialDifferenceProbes(prev.map((c) => (c.id === id ? { ...c, ...resolvedUpdates } : c)));
      const next = applyElectricPotentialDistances(applyConductionForWires(updated, wires));
      saveToHistory(next, wires, notes, drawings);
      return next;
    });
  }, [saveToHistory, wires, notes, drawings]);

  const handlePinClick = useCallback(
    (compId: string, portIndex: number) => {
      if (!connectingFrom) {
        setConnectingFrom({ compId, portIndex, draftMidPoints: [] });
        return false;
      }

      // Cancel on same-pin click
      if (connectingFrom.compId === compId && connectingFrom.portIndex === portIndex) {
        setConnectingFrom(null);
        return false;
      }

      const duplicate = wires.some(
        (w) =>
          (w.from.compId === connectingFrom.compId &&
            w.from.portIndex === connectingFrom.portIndex &&
            w.to.compId === compId &&
            w.to.portIndex === portIndex) ||
          (w.to.compId === connectingFrom.compId &&
            w.to.portIndex === connectingFrom.portIndex &&
            w.from.compId === compId &&
            w.from.portIndex === portIndex)
      );

      setConnectingFrom(null);
      if (duplicate) return false;

      const nextWire: Wire = {
        id: `wire-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        from: {
          compId: connectingFrom.compId,
          portIndex: connectingFrom.portIndex,
        },
        to: { compId, portIndex },
        midPoints: connectingFrom.draftMidPoints ?? [],
        color: wireColor,
      };

      setWires((prevWires) => {
        const next = [...prevWires, nextWire];
        setComponents((prevComps) => {
          const nextComps = applyConductionForWire(prevComps, nextWire);
          saveToHistory(nextComps, next, notes, drawings);
          return nextComps;
        });
        return next;
      });

      return true;
    },
    [connectingFrom, saveToHistory, wires, notes, drawings, wireColor]
  );

  const addConnectingMidPoint = useCallback((point: WirePoint) => {
    setConnectingFrom((prev) => {
      if (!prev) return prev;

      const nextPoints = [...(prev.draftMidPoints ?? [])];
      const lastPoint = nextPoints[nextPoints.length - 1];
      if (lastPoint && Math.hypot(lastPoint.x - point.x, lastPoint.y - point.y) < 6) {
        return prev;
      }

      nextPoints.push(point);
      return { ...prev, draftMidPoints: nextPoints };
    });
  }, []);

  const deleteSelected = useCallback(() => {
    setComponents((prevComps) => {
      const nextComps = prevComps.filter((c) => !selectedComponents.includes(c.id));
      setWires((prevWires) => {
        const nextWires = prevWires.filter(
          (w) =>
            !selectedComponents.includes(w.from.compId) &&
            !selectedComponents.includes(w.to.compId) &&
            w.id !== selectedWire
        );
        saveToHistory(nextComps, nextWires, notes, drawings);
        return nextWires;
      });
      return nextComps;
    });
    setSelectedComponents([]);
    setSelectedWire(null);
  }, [selectedComponents, selectedWire, saveToHistory, notes, drawings]);

  const deleteWire = useCallback(
    (wireId: string) => {
      setWires((prevWires) => {
        const next = prevWires.filter((w) => w.id !== wireId);
        setComponents((prevComps) => {
          saveToHistory(prevComps, next, notes, drawings);
          return prevComps;
        });
        return next;
      });
      setSelectedWire((prev) => (prev === wireId ? null : prev));
    },
    [saveToHistory, notes, drawings]
  );

  const rotateSelected = useCallback(() => {
    setComponents((prev) => {
      const next = prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, rotation: (c.rotation + 30) % 360 } : c
      );
      saveToHistory(next, wires, notes, drawings);
      return next;
    });
  }, [selectedComponents, saveToHistory, wires, notes, drawings]);

  const mirrorSelected = useCallback(() => {
    setComponents((prev) => {
      const next = prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, mirrored: !c.mirrored } : c
      );
      saveToHistory(next, wires, notes, drawings);
      return next;
    });
  }, [selectedComponents, saveToHistory, wires, notes, drawings]);

  const flipSelected = useCallback(() => {
    setComponents((prev) => {
      const next = prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, flipped: !c.flipped } : c
      );
      saveToHistory(next, wires, notes, drawings);
      return next;
    });
  }, [selectedComponents, saveToHistory, wires, notes, drawings]);

  const selectComponent = useCallback((compId: string, multi: boolean) => {
    setSelectedWire(null);
    setSelectedComponents((prev) => {
      if (!compId) return [];
      if (multi) return prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId];
      return prev.includes(compId) && prev.length === 1 ? [] : [compId];
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const state = historyRef.current[historyIndexRef.current];
    setComponents(state.components);
    setWires(state.wires);
    setNotes(state.notes);
    setDrawings(state.drawings);
    forceUpdate((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const state = historyRef.current[historyIndexRef.current];
    setComponents(state.components);
    setWires(state.wires);
    setNotes(state.notes);
    setDrawings(state.drawings);
    forceUpdate((n) => n + 1);
  }, []);

  const updateWireMidPoints = useCallback((wireId: string, midPoints: { x: number; y: number }[]) => {
    setWires((prev) => prev.map((w) => (w.id === wireId ? { ...w, midPoints } : w)));
  }, []);

  const setWireColor = useCallback((color: string) => {
    setWireColorState(color);
    if (selectedWire) {
      setWires((prev) => {
        const next = prev.map((w) => (w.id === selectedWire ? { ...w, color } : w));
        saveToHistory(components, next, notes, drawings);
        return next;
      });
    }
  }, [selectedWire, components, notes, drawings, saveToHistory]);

  /**
   * Called by ComponentNode once the image has loaded and ink-bounds have been
   * computed. Stores the exact mapped port positions so wire-snap (circuitUtils)
   * uses the same coordinates as the visible pin dots.
   */
  const updateComponentPorts = useCallback(
    (compId: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => {
      setComponents((prev) =>
        prev.map((c) => (c.id === compId ? { ...c, ports: resolvedPorts, width, height } : c))
      );
    },
    []
  );

  const addNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      x: 100,
      y: 100,
      text: "New Note",
      width: 120,
      height: 80,
    };
    setNotes((prev) => {
      const next = [...prev, newNote];
      saveToHistory(components, wires, next, drawings);
      return next;
    });
  }, [components, wires, drawings, saveToHistory]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      saveToHistory(components, wires, next, drawings);
      return next;
    });
  }, [components, wires, drawings, saveToHistory]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveToHistory(components, wires, next, drawings);
      return next;
    });
  }, [components, wires, drawings, saveToHistory]);

  const reset = useCallback(() => {
    clearAllFrictionContacts(frictionContactsRef.current);
    setComponents([]);
    setWires([]);
    setNotes([]);
    setDrawings([]);
    setSelectedComponents([]);
    setSelectedWire(null);
    setConnectingFrom(null);
    saveToHistory([], [], [], []);
    localStorage.removeItem(STORAGE_KEY);
  }, [saveToHistory]);

  const addDrawing = useCallback((drawing: Drawing) => {
    setDrawings((prev) => {
      const next = [...prev, drawing];
      saveToHistory(components, wires, notes, next);
      return next;
    });
  }, [components, wires, notes, saveToHistory]);

  const deleteDrawing = useCallback((id: string) => {
    setDrawings((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveToHistory(components, wires, notes, next);
      return next;
    });
  }, [components, wires, notes, saveToHistory]);

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    saveToHistory(components, wires, notes, []);
  }, [components, wires, notes, saveToHistory]);

  return {
    components,
    wires,
    notes,
    drawings,
    connectingFrom,
    setConnectingFrom,
    addConnectingMidPoint,
    selectedComponents,
    selectedWire,
    setSelectedWire,
    showGrid,
    setShowGrid,
    wireColor,
    setWireColor,
    wireType,
    setWireType,
    toggleGrid: () => setShowGrid((p) => !p),
    isSimulating,
    setIsSimulating,
    activeTool,
    setActiveTool,
    pencilColor,
    setPencilColor,
    addComponent,
    moveComponent,
    commitComponentMove,
    updateComponent,
    handlePinClick,
    deleteSelected,
    deleteWire,
    rotateSelected,
    mirrorSelected,
    flipSelected,
    selectComponent,
    undo,
    redo,
    reset,
    updateWireMidPoints,
    updateComponentPorts,
    addNote,
    updateNote,
    deleteNote,
    addDrawing,
    deleteDrawing,
    clearDrawings,
    // eslint-disable-next-line react-hooks/refs
    canUndo: historyIndexRef.current > 0,
    // eslint-disable-next-line react-hooks/refs
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  };
}
