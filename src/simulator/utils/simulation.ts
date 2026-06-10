import { PlacedComponent, Wire } from "../types/circuit";
import { getAllPins } from "./circuitUtils";

export interface SimulatedComponentState {
  powered?: boolean;
  lit?: boolean;
  brightness?: number;
  isBurned?: boolean;
  isShortCircuit?: boolean;
  direction?: number;
  outputVoltage?: number;
  outputCurrent?: number;
  powerMode?: "CV" | "CC" | "AC" | "TRIP" | "OFF";
  peakVoltage?: number;
  instantaneousVoltage?: number;
  frequency?: number;
  fault?: boolean;
  capacitorVoltage?: number;
  capacitorChargeCoulombs?: number;
  capacitorEnergyJoules?: number;
  capacitorMode?: "charging" | "discharging" | "charged" | "discharged" | "reverse-polarity" | "breakdown";
  capacitorEquivalentSeriesResistance?: number;
  capacitorSparkIntensity?: number;
  capacitorShorted?: boolean;
  isPrimaryBattery?: boolean;
  inParallel?: boolean;
}

export interface SimulationResult {
  runnable: boolean;
  litComponents: string[];
  poweredComponents: string[];
  poweredWires: string[];
  componentStates?: Record<string, SimulatedComponentState>;
  summary: string;
  // Ohm's Law stats
  voltage?: number;
  totalResistance?: number;
  currentMA?: number;
  powerWatts?: number;
  isShortCircuit?: boolean;
}

const UNIT_MULTIPLIERS: Record<string, number> = {
  "pΩ": 1e-12,
  "nΩ": 1e-9,
  "µΩ": 1e-6,
  "mΩ": 1e-3,
  "Ω": 1,
  "kΩ": 1e3,
  "MΩ": 1e6,
  "GΩ": 1e9,
};

interface BatteryTerminal {
  sourceId: string;
  sourceIds?: string[];
  sourceType: "battery" | "dc_power_supply" | "ac_power_supply";
  positiveRoot: string;
  negativeRoot: string;
  voltage: number;
  currentLimit?: number;
  frequency?: number;
  inParallel?: boolean;
}

type Graph = Map<string, Set<string>>;

const TWO_TERMINAL_LOAD_RESISTANCES: Record<string, number> = {
  ac_bulb: 120,
  dc_motor: 25,
  gearmotor: 22,
  vibration_motor: 18,
  semiconductor: 100,
};

const CAPACITOR_UNIT_MULTIPLIERS: Record<string, number> = {
  pF: 1e-12,
  nF: 1e-9,
  "ÂµF": 1e-6,
  "µF": 1e-6,
  uF: 1e-6,
  mF: 1e-3,
  F: 1,
};

const CAPACITOR_TIME_STEP_SECONDS = 0.05;
const CAPACITOR_DEFAULT_ESR_OHMS = 0.001;
const CAPACITOR_LED_DISCHARGE_RESISTANCE_OHMS = 3000;
const CAPACITOR_SPARK_HOLD_MS = 2500;
const LED_FORWARD_VOLTAGE = 2.0;
const LED_MAX_SAFE_CURRENT_AMPS = 0.02;
const LED_INTERNAL_RESISTANCE_OHMS = 350;
const AC_PEAK_MULTIPLIER = 1.414;

type CapacitorRuntimeState = {
  voltage: number;
  sparkUntil?: number;
  sparkIntensity?: number;
  standaloneSparked?: boolean;
};

const capacitorRuntimeStates = new Map<string, CapacitorRuntimeState>();

function makeNodeKey(compId: string, portIndex: number): string {
  return `${compId}:${portIndex}`;
}

function addEdge(graph: Graph, a: string, b: string) {
  if (a === b) return;
  if (!graph.has(a)) graph.set(a, new Set());
  if (!graph.has(b)) graph.set(b, new Set());
  graph.get(a)!.add(b);
  graph.get(b)!.add(a);
}

interface CircuitPath {
  ledVoltage: number;
  resistance: number;
  components: string[];
}

function evaluatePaths(graph: Graph, startNode: string, endNode: string, components: PlacedComponent[]): CircuitPath[] {
  const paths: CircuitPath[] = [];
  const compMap = new Map(components.map(c => [c.id, c]));

  function dfs(current: string, target: string, visitedNodes: Set<string>, currentPath: CircuitPath) {
    if (current === target) {
      paths.push({ ...currentPath, components: [...currentPath.components] });
      return;
    }
    
    if (paths.length > 50) return;

    for (const next of (graph.get(current) || [])) {
      if (!visitedNodes.has(next)) {
        const currComp = current.split(":")[0];
        const nextComp = next.split(":")[0];
        
        let nextLedVoltage = currentPath.ledVoltage;
        let nextResistance = currentPath.resistance;
        let nextComponents = currentPath.components;

        if (currComp === nextComp && current !== next) {
          const comp = compMap.get(currComp);
          if (comp) {
            if (comp.componentId.startsWith("led") || comp.componentId === "diode") {
               const pins = getLedPins(comp);
               if (current !== pins?.anodeNode || next !== pins?.cathodeNode) {
                  continue; 
               }
               if (comp.componentId.startsWith("led")) {
                 nextLedVoltage += Number(comp.voltageValue ?? LED_FORWARD_VOLTAGE);
               }
            } else if (comp.componentId === "resistor" || comp.componentId === "ac_bulb" || comp.componentId.includes("motor") || comp.componentId === "semiconductor") {
               nextResistance += getBaseResistance(comp);
            }
            
            nextComponents = [...currentPath.components, currComp];
          }
        }

        visitedNodes.add(next);
        dfs(next, target, visitedNodes, { ledVoltage: nextLedVoltage, resistance: nextResistance, components: nextComponents });
        visitedNodes.delete(next);
      }
    }
  }

  const visited = new Set<string>();
  visited.add(startNode);
  dfs(startNode, endNode, visited, { ledVoltage: 0, resistance: 0, components: [] });
  
  return paths;
}

function getWheatstoneBridgeState(
  load: PlacedComponent,
  components: PlacedComponent[],
  wireOnlyGraph: Graph,
  posReach: Set<string>,
  negReach: Set<string>
) {
  const terminals = getTwoTerminalNodes(load);
  if (!terminals) return { isBridge: false, balanced: false };

  const nodeAReach = collectReachable(wireOnlyGraph, terminals.firstNode);
  const nodeBReach = collectReachable(wireOnlyGraph, terminals.secondNode);

  if (
    [...nodeAReach].some(n => posReach.has(n) || negReach.has(n)) ||
    [...nodeBReach].some(n => posReach.has(n) || negReach.has(n))
  ) {
    return { isBridge: false, balanced: false };
  }

  const resistors = components.filter(c => c.componentId === "resistor");
  
  let P = 0, Q = 0, R = 0, S = 0;
  let pCount = 0, qCount = 0, rCount = 0, sCount = 0;

  for (const res of resistors) {
    const resTerms = getTwoTerminalNodes(res);
    if (!resTerms) continue;
    
    const r1 = resTerms.firstNode;
    const r2 = resTerms.secondNode;
    
    const is1A = nodeAReach.has(r1), is2A = nodeAReach.has(r2);
    const is1B = nodeBReach.has(r1), is2B = nodeBReach.has(r2);
    const is1Pos = posReach.has(r1), is2Pos = posReach.has(r2);
    const is1Neg = negReach.has(r1), is2Neg = negReach.has(r2);

    const val = getBaseResistance(res);
    if (val === 0) continue;

    if ((is1A && is2Pos) || (is2A && is1Pos)) { P += 1/val; pCount++; }
    else if ((is1A && is2Neg) || (is2A && is1Neg)) { Q += 1/val; qCount++; }
    else if ((is1B && is2Pos) || (is2B && is1Pos)) { R += 1/val; rCount++; }
    else if ((is1B && is2Neg) || (is2B && is1Neg)) { S += 1/val; sCount++; }
  }

  if (pCount > 0 && qCount > 0 && rCount > 0 && sCount > 0) {
    P = 1 / P; Q = 1 / Q; R = 1 / R; S = 1 / S;
    
    const ratio1 = P / Q;
    const ratio2 = R / S;
    const balanced = Math.abs(ratio1 - ratio2) < 0.01;
    
    return { isBridge: true, balanced, P, Q, R, S };
  }

  return { isBridge: false, balanced: false };
}


function collectReachable(graph: Graph, start: string): Set<string> {
  const visited = new Set<string>();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const next of graph.get(current) ?? []) {
      if (!visited.has(next)) queue.push(next);
    }
  }

  return visited;
}

function buildConductiveGraph(components: PlacedComponent[], wires: Wire[], includeResistors: boolean = true): Graph {
  const graph: Graph = new Map();

  for (const comp of components) {
    for (let i = 0; i < (comp.ports?.length ?? 0); i++) {
      graph.set(makeNodeKey(comp.id, i), new Set());
    }
  }

  for (const wire of wires) {
    addEdge(
      graph,
      makeNodeKey(wire.from.compId, wire.from.portIndex),
      makeNodeKey(wire.to.compId, wire.to.portIndex)
    );
  }

  const allPins = getAllPins(components);
  for (let i = 0; i < allPins.length; i++) {
    for (let j = i + 1; j < allPins.length; j++) {
      const p1 = allPins[i];
      const p2 = allPins[j];
      if (p1.compId === p2.compId) continue;
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist < 5) {
        addEdge(graph, makeNodeKey(p1.compId, p1.portIndex), makeNodeKey(p2.compId, p2.portIndex));
      }
    }
  }

  for (const comp of components) {
    if (comp.componentId === "breadboard" || comp.componentId === "bulb_holder") {
      const groups = new Map<string, number[]>();
      comp.relativePins?.forEach((pin, index) => {
        if (!pin.type) return;
        const entries = groups.get(pin.type) ?? [];
        entries.push(index);
        groups.set(pin.type, entries);
      });
      for (const indexes of groups.values()) {
        for (let i = 1; i < indexes.length; i++) {
          addEdge(graph, makeNodeKey(comp.id, indexes[0]), makeNodeKey(comp.id, indexes[i]));
        }
      }
      continue;
    }

    const isLoad = comp.componentId === "resistor" || comp.componentId.startsWith("led") || comp.componentId === "ac_bulb" || comp.componentId === "diode" || comp.componentId === "semiconductor";
    if (isLoad && !includeResistors) continue;

    const isPushbutton = comp.componentId === "pushbutton";

    if (isPushbutton) {
      // Tactile switches internally connect Top-Left (0) with Bottom-Left (2)
      // and Top-Right (1) with Bottom-Right (3)
      if ((comp.ports?.length ?? 0) >= 4) {
        addEdge(graph, makeNodeKey(comp.id, 0), makeNodeKey(comp.id, 2));
        addEdge(graph, makeNodeKey(comp.id, 1), makeNodeKey(comp.id, 3));
      }
      
      if (comp.isPressed) {
        // Connect the left side to the right side when pressed
        addEdge(graph, makeNodeKey(comp.id, 0), makeNodeKey(comp.id, 1));
      }
    } else if (
      isLoad ||
      comp.componentId === "slideswitch"
    ) {
      for (let i = 1; i < (comp.ports?.length ?? 0); i++) {
        addEdge(graph, makeNodeKey(comp.id, 0), makeNodeKey(comp.id, i));
      }
    }
  }

  return graph;
}

function getBatteryTerminals(components: PlacedComponent[]): BatteryTerminal[] {
  const terminals: BatteryTerminal[] = [];
  for (const comp of components) {
    const isBattery = comp.componentId.startsWith("battery");
    const isPowerSupply =
      (comp.componentId === "dc_power_supply" || comp.componentId === "ac_power_supply") &&
      comp.powerEnabled !== false;
    if (!isBattery && !isPowerSupply) continue;

    let positiveIndex = -1;
    let negativeIndex = -1;
    comp.relativePins?.forEach((pin, index) => {
      if (pin.type === "positive") positiveIndex = index;
      if (pin.type === "negative") negativeIndex = index;
    });
    if (positiveIndex >= 0 && negativeIndex >= 0) {
      terminals.push({
        sourceId: comp.id,
        sourceType: isPowerSupply ? comp.componentId as "dc_power_supply" | "ac_power_supply" : "battery",
        positiveRoot: makeNodeKey(comp.id, positiveIndex),
        negativeRoot: makeNodeKey(comp.id, negativeIndex),
        voltage: isPowerSupply
          ? Math.max(0, Math.min(comp.componentId === "dc_power_supply" ? 100 : 260, comp.powerVoltageSet ?? (comp.componentId === "ac_power_supply" ? 230.5 : 12.5)))
          : (comp.voltageValue ?? 9),
        currentLimit: isPowerSupply ? Math.max(0.001, comp.powerCurrentLimit ?? (comp.componentId === "ac_power_supply" ? 1.15 : 0.25)) : undefined,
        frequency: comp.componentId === "ac_power_supply" ? Math.max(1, comp.powerFrequency ?? 50) : undefined,
      });
    }
  }
  return terminals;
}

function resolveSourceOutput(source: BatteryTerminal, loadResistance: number, shortCircuit: boolean) {
  if (source.sourceType === "battery") {
    return {
      ...source,
      outputVoltage: source.voltage,
      outputCurrent: shortCircuit ? 100 : (loadResistance > 0 ? source.voltage / loadResistance : 0),
      peakVoltage: undefined,
      instantaneousVoltage: undefined,
      mode: "CV" as const,
      fault: shortCircuit,
    };
  }

  const currentLimit = source.currentLimit ?? 0.25;
  if (source.sourceType === "ac_power_supply") {
    const frequency = source.frequency ?? 50;
    const peakVoltage = source.voltage * AC_PEAK_MULTIPLIER;
    const timeSeconds = Date.now() / 1000;
    const instantaneousVoltage = peakVoltage * Math.sin(2 * Math.PI * frequency * timeSeconds);

    if (shortCircuit || loadResistance <= 0) {
      return {
        ...source,
        voltage: 0,
        outputVoltage: 0,
        outputCurrent: currentLimit,
        peakVoltage,
        instantaneousVoltage: 0,
        frequency,
        mode: "TRIP" as const,
        fault: true,
      };
    }

    const rmsCurrent = source.voltage / loadResistance;
    if (rmsCurrent > currentLimit) {
      const limitedVoltage = currentLimit * loadResistance;
      const limitedPeakVoltage = limitedVoltage * AC_PEAK_MULTIPLIER;
      const limitedInstVoltage = limitedPeakVoltage * Math.sin(2 * Math.PI * frequency * timeSeconds);
      return {
        ...source,
        voltage: limitedVoltage,
        outputVoltage: limitedVoltage,
        outputCurrent: currentLimit,
        peakVoltage: limitedPeakVoltage,
        instantaneousVoltage: limitedInstVoltage,
        frequency,
        mode: "CC" as const,
        fault: true,
      };
    }

    return {
      ...source,
      outputVoltage: source.voltage,
      outputCurrent: rmsCurrent,
      peakVoltage,
      instantaneousVoltage,
      frequency,
      mode: "AC" as const,
      fault: false,
    };
  }

  if (shortCircuit || loadResistance <= 0) {
    return {
      ...source,
      voltage: 0,
      outputVoltage: 0,
      outputCurrent: currentLimit,
      peakVoltage: undefined,
      instantaneousVoltage: undefined,
      mode: "CC" as const,
      fault: true,
    };
  }

  const idealCurrent = source.voltage / loadResistance;
  if (idealCurrent <= currentLimit) {
    return {
      ...source,
      outputVoltage: source.voltage,
      outputCurrent: idealCurrent,
      peakVoltage: undefined,
      instantaneousVoltage: undefined,
      mode: "CV" as const,
      fault: false,
    };
  }

  const limitedVoltage = currentLimit * loadResistance;
  return {
    ...source,
    voltage: limitedVoltage,
    outputVoltage: limitedVoltage,
    outputCurrent: currentLimit,
    peakVoltage: undefined,
    instantaneousVoltage: undefined,
    mode: "CC" as const,
    fault: true,
  };
}

function getLedPins(comp: PlacedComponent) {
  let anodeIndex = -1;
  let cathodeIndex = -1;
  comp.relativePins?.forEach((pin, index) => {
    if (pin.type === "anode") anodeIndex = index;
    if (pin.type === "cathode") cathodeIndex = index;
  });
  if (anodeIndex < 0 || cathodeIndex < 0) return null;
  return {
    anodeNode: makeNodeKey(comp.id, anodeIndex),
    cathodeNode: makeNodeKey(comp.id, cathodeIndex),
  };
}

function getTwoTerminalNodes(comp: PlacedComponent) {
  if ((comp.ports?.length ?? 0) < 2) return null;
  return {
    firstNode: makeNodeKey(comp.id, 0),
    secondNode: makeNodeKey(comp.id, 1),
  };
}

function buildPoweredWireIds(
  wires: Wire[],
  positiveReachable: Set<string>,
  negativeReachable: Set<string>
) {
  const powered = new Set<string>();
  for (const wire of wires) {
    const fromNode = makeNodeKey(wire.from.compId, wire.from.portIndex);
    const toNode = makeNodeKey(wire.to.compId, wire.to.portIndex);
    if (
      positiveReachable.has(fromNode) ||
      positiveReachable.has(toNode) ||
      negativeReachable.has(fromNode) ||
      negativeReachable.has(toNode)
    ) {
      powered.add(wire.id);
    }
  }
  return powered;
}

function getBaseResistance(comp: PlacedComponent): number {
  if (comp.componentId === "ac_bulb") {
    const v = comp.voltageValue || 220;
    const p = comp.wattageValue || 9;
    return (v * v) / (p || 1); // R = V^2 / P
  }
  if (comp.componentId in TWO_TERMINAL_LOAD_RESISTANCES) {
    return TWO_TERMINAL_LOAD_RESISTANCES[comp.componentId];
  }
  const val = comp.resistanceValue ?? 0;
  const unit = comp.resistanceUnit ?? "Ω";
  return val * (UNIT_MULTIPLIERS[unit] ?? 1);
}

function getCapacitanceFarads(comp: PlacedComponent): number {
  const value = comp.capacitanceValue ?? 0;
  const unit = comp.capacitanceUnit ?? "ÂµF";
  return Math.max(0, value * (CAPACITOR_UNIT_MULTIPLIERS[unit] ?? 1e-6));
}

function getCapacitorVoltageLimit(comp: PlacedComponent): number {
  return Math.max(0, comp.voltageValue ?? 25);
}

function getCapacitorTerminals(comp: PlacedComponent) {
  if ((comp.ports?.length ?? 0) < 2) return null;
  let posIndex = -1;
  let negIndex = -1;
  comp.relativePins?.forEach((pin, index) => {
    if (pin.type === "positive") posIndex = index;
    if (pin.type === "negative") negIndex = index;
  });
  // Fallback if types are not defined
  if (posIndex === -1) posIndex = 1;
  if (negIndex === -1) negIndex = 0;
  
  return {
    positiveNode: makeNodeKey(comp.id, posIndex),
    negativeNode: makeNodeKey(comp.id, negIndex),
  };
}

function simulateCapacitors(
  components: PlacedComponent[],
  graph: Graph,
  batteries: BatteryTerminal[],
  circuitResistance: number
): Record<string, SimulatedComponentState> {
  const states: Record<string, SimulatedComponentState> = {};
  const activeIds = new Set(components.map((comp) => comp.id));
  for (const id of capacitorRuntimeStates.keys()) {
    if (!activeIds.has(id)) capacitorRuntimeStates.delete(id);
  }

  for (const comp of components) {
    if (comp.componentId !== "capacitor") continue;

    const capacitance = getCapacitanceFarads(comp);
    const voltageLimit = getCapacitorVoltageLimit(comp);
    const terminals = getCapacitorTerminals(comp);
    const runtime = capacitorRuntimeStates.get(comp.id) ?? { voltage: 0 };
    let targetVoltage = 0;
    let isConnectedToSource = false;
    let isReversePolarity = false;
    let isTerminalShorted = false;
    let sourceVoltageForSpark = 0;

    if (terminals) {
      for (const battery of batteries) {
        const posReach = collectReachable(graph, battery.positiveRoot);
        const negReach = collectReachable(graph, battery.negativeRoot);
        const forward =
          posReach.has(terminals.positiveNode) && negReach.has(terminals.negativeNode);
        const reverse =
          posReach.has(terminals.negativeNode) && negReach.has(terminals.positiveNode);

        if (forward || reverse) {
          isConnectedToSource = true;
          targetVoltage = forward ? battery.voltage : -battery.voltage;
          isReversePolarity = reverse;
          break;
        }
      }

      const terminalPaths = evaluatePaths(graph, terminals.positiveNode, terminals.negativeNode, components);
      isTerminalShorted = terminalPaths.some((path) => path.resistance <= 0 && path.ledVoltage <= 0);
    }

    let dischargeResistance = CAPACITOR_DEFAULT_ESR_OHMS;
    if (isTerminalShorted) {
      sourceVoltageForSpark = Math.abs(targetVoltage);
      dischargeResistance = CAPACITOR_DEFAULT_ESR_OHMS;
      isConnectedToSource = false;
      isReversePolarity = false;
      targetVoltage = 0;
    } else if (!isConnectedToSource && terminals) {
      const paths = evaluatePaths(graph, terminals.positiveNode, terminals.negativeNode, components);
      if (paths.length > 0) {
        let minRes = Infinity;
        for (const p of paths) {
          let r = p.resistance;
          // Slow the visual LED discharge so a charged capacitor keeps the LED on briefly.
          if (p.ledVoltage > 0) r += CAPACITOR_LED_DISCHARGE_RESISTANCE_OHMS;
          if (r < minRes) minRes = r;
        }
        if (minRes !== Infinity) dischargeResistance = minRes;
      } else {
        // Not connected to a closed circuit, hold charge
        dischargeResistance = Infinity;
      }
    }

    const equivalentSeriesResistance = isConnectedToSource
      ? Math.max(CAPACITOR_DEFAULT_ESR_OHMS, circuitResistance > 0 ? circuitResistance : CAPACITOR_DEFAULT_ESR_OHMS)
      : dischargeResistance;

    const tau = equivalentSeriesResistance === Infinity
      ? Infinity
      : Math.max(CAPACITOR_DEFAULT_ESR_OHMS * Math.max(capacitance, 1e-12), equivalentSeriesResistance * Math.max(capacitance, 1e-12));

    if (!isConnectedToSource || isTerminalShorted) {
      targetVoltage = 0;
    }

    const now = Date.now();
    let standaloneSparked = runtime.standaloneSparked ?? false;
    if (!isTerminalShorted) {
      standaloneSparked = false;
    }
    if (
      isTerminalShorted &&
      batteries.length === 0 &&
      !standaloneSparked &&
      Math.abs(runtime.voltage) <= 0.02 &&
      voltageLimit > 0
    ) {
      sourceVoltageForSpark = voltageLimit;
      standaloneSparked = true;
    }
    const sparkVoltage = Math.max(Math.abs(runtime.voltage), sourceVoltageForSpark);
    const sparkEnergy = 0.5 * capacitance * sparkVoltage * sparkVoltage;
    let sparkUntil = runtime.sparkUntil;
    let sparkIntensity = runtime.sparkIntensity ?? 0;
    if (isTerminalShorted && sparkVoltage > 0.5) {
      sparkIntensity = Math.min(1, 0.18 + Math.min(0.45, sparkVoltage / 60) + Math.min(0.45, sparkEnergy / 0.35));
      sparkUntil = now + CAPACITOR_SPARK_HOLD_MS;
    }

    const alpha = tau === Infinity ? 0 : 1 - Math.exp(-CAPACITOR_TIME_STEP_SECONDS / tau);
    const nextVoltage = runtime.voltage + (targetVoltage - runtime.voltage) * Math.min(1, alpha);
    const absVoltage = Math.abs(nextVoltage);
    const capacitanceUf = capacitance / 1e-6;
    const overVoltage = voltageLimit > 0 && absVoltage > voltageLimit;
    const highStressCapacitance = capacitanceUf > 10000 && absVoltage > 0;
    const failed = overVoltage || highStressCapacitance;
    const mode: SimulatedComponentState["capacitorMode"] = failed
      ? "breakdown"
      : isTerminalShorted
        ? "discharging"
      : isConnectedToSource
        ? (isReversePolarity ? "reverse-polarity" : (Math.abs(targetVoltage - nextVoltage) < 0.02 ? "charged" : "charging"))
        : (Math.abs(nextVoltage) <= 0.02 ? "discharged" : "discharging");

    const activeSparkIntensity = sparkUntil && sparkUntil > now ? sparkIntensity : 0;
    capacitorRuntimeStates.set(comp.id, {
      voltage: nextVoltage,
      sparkUntil,
      sparkIntensity: activeSparkIntensity,
      standaloneSparked,
    });

    states[comp.id] = {
      brightness: 0,
      lit: false,
      powered: isConnectedToSource,
      isBurned: failed,
      capacitorVoltage: nextVoltage,
      capacitorChargeCoulombs: capacitance * nextVoltage,
      capacitorEnergyJoules: 0.5 * capacitance * nextVoltage * nextVoltage,
      capacitorMode: mode,
      capacitorEquivalentSeriesResistance: equivalentSeriesResistance,
      capacitorSparkIntensity: activeSparkIntensity,
      capacitorShorted: isTerminalShorted,
    };
  }

  return states;
}

export function simulateCircuit(
  components: PlacedComponent[],
  wires: Wire[]
): SimulationResult {
  if (components.length === 0) {
    return {
      runnable: false,
      litComponents: [],
      poweredComponents: [],
      poweredWires: [],
      summary: "Add components to start a simulation.",
    };
  }

  const graph = buildConductiveGraph(components, wires, true);
  const wireOnlyGraph = buildConductiveGraph(components, wires, false);
  let batteries = getBatteryTerminals(components);

  if (batteries.length > 0) {
    let changed = true;
    const maxIterations = 10;
    let iter = 0;
    while (changed && iter++ < maxIterations) {
      changed = false;
      for (let i = 0; i < batteries.length; i++) {
        for (let j = 0; j < batteries.length; j++) {
          if (i === j) continue;
          const b1 = batteries[i];
          const b2 = batteries[j];
          
          if (b1.sourceId === b2.sourceId) continue;
          
          const b1NegReach = collectReachable(wireOnlyGraph, b1.negativeRoot);
          const b1PosReach = collectReachable(wireOnlyGraph, b1.positiveRoot);
          
          if (b1NegReach.has(b2.positiveRoot)) { // Series connection
            const combined: BatteryTerminal = {
              sourceId: b1.sourceId + "+" + b2.sourceId,
              sourceIds: [...(b1.sourceIds || [b1.sourceId]), ...(b2.sourceIds || [b2.sourceId])],
              sourceType: b1.sourceType === "battery" && b2.sourceType === "battery" ? "battery" : "dc_power_supply",
              positiveRoot: b1.positiveRoot,
              negativeRoot: b2.negativeRoot,
              voltage: b1.voltage + b2.voltage,
              currentLimit: b1.currentLimit ? (b2.currentLimit ? Math.min(b1.currentLimit, b2.currentLimit) : b1.currentLimit) : b2.currentLimit,
              frequency: b1.frequency ?? b2.frequency
            };
            
            batteries = batteries.filter(b => b !== b1 && b !== b2);
            batteries.push(combined);
            changed = true;
            break;
          } else if (b1NegReach.has(b2.negativeRoot) && b1PosReach.has(b2.positiveRoot)) { // Parallel connection
            const combined: BatteryTerminal = {
              sourceId: b1.sourceId + "||" + b2.sourceId,
              sourceIds: [...(b1.sourceIds || [b1.sourceId]), ...(b2.sourceIds || [b2.sourceId])],
              sourceType: b1.sourceType === "battery" && b2.sourceType === "battery" ? "battery" : "dc_power_supply",
              positiveRoot: b1.positiveRoot,
              negativeRoot: b1.negativeRoot,
              voltage: Math.max(b1.voltage, b2.voltage), // Voltage remains the same (max of both)
              currentLimit: (b1.currentLimit ?? 10) + (b2.currentLimit ?? 10), // Current capacity increases
              frequency: b1.frequency ?? b2.frequency,
              inParallel: true
            };
            
            batteries = batteries.filter(b => b !== b1 && b !== b2);
            batteries.push(combined);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }
  }

  if (batteries.length === 0) {
    const capacitorOnlyStates = simulateCapacitors(components, graph, [], Infinity);
    const hasCapacitorSpark = Object.values(capacitorOnlyStates).some(
      (state) => (state.capacitorSparkIntensity ?? 0) > 0 || state.capacitorShorted
    );
    if (hasCapacitorSpark) {
      return {
        runnable: true,
        litComponents: [],
        poweredComponents: [],
        poweredWires: [],
        componentStates: capacitorOnlyStates,
        summary: "Capacitor terminals shorted: spark discharge.",
        voltage: 0,
        totalResistance: 0,
        currentMA: 0,
        powerWatts: 0,
        isShortCircuit: true,
      };
    }

    return {
      runnable: false,
      litComponents: [],
      poweredComponents: [],
      poweredWires: [],
      summary: "Add a battery to power the circuit.",
    };
  }

  const litComponents = new Set<string>();
  const poweredComponents = new Set<string>();
  const poweredWires = new Set<string>();
  
  let totalResistance = 0;
  let hasPath = false;
  const componentDirections = new Map<string, number>();
  
  // Basic power distribution (visual green wires)
  for (const battery of batteries) {
    const posReach = collectReachable(graph, battery.positiveRoot);
    const negReach = collectReachable(graph, battery.negativeRoot);
    for (const node of posReach) poweredComponents.add(node.split(":")[0]);
    for (const node of negReach) poweredComponents.add(node.split(":")[0]);
    for (const wireId of buildPoweredWireIds(wires, posReach, negReach)) poweredWires.add(wireId);
  }

  // Bridge detection for Ohm's Law
  for (const battery of batteries) {
    for (const comp of components) {
      if (comp.componentId === "resistor") {
        const p0 = makeNodeKey(comp.id, 0);
        const p1 = makeNodeKey(comp.id, 1);

        // Temporarily remove this resistor's internal bridge
        const edges0 = graph.get(p0);
        const edges1 = graph.get(p1);
        edges0?.delete(p1);
        edges1?.delete(p0);

        const posReach = collectReachable(graph, battery.positiveRoot);
        const negReach = collectReachable(graph, battery.negativeRoot);

        if ((posReach.has(p0) && negReach.has(p1)) || (posReach.has(p1) && negReach.has(p0))) {
          totalResistance += getBaseResistance(comp);
          hasPath = true;
        }

        edges0?.add(p1);
        edges1?.add(p0);
      }
    }

    // Path-based LED logic
    const allPaths = evaluatePaths(graph, battery.positiveRoot, battery.negativeRoot, components);
    for (const p of allPaths) {
       hasPath = true;
       for (const compId of p.components) {
          litComponents.add(compId);
       }
       if (p.resistance === 0 && battery.voltage <= p.ledVoltage + 0.1) {
          totalResistance += (p.ledVoltage / LED_MAX_SAFE_CURRENT_AMPS);
       }
    }
    for (const comp of components) {
      if (comp.componentId in TWO_TERMINAL_LOAD_RESISTANCES) {
        const terminals = getTwoTerminalNodes(comp);
        if (!terminals) continue;

        const posReach = collectReachable(graph, battery.positiveRoot);
        const negReach = collectReachable(graph, battery.negativeRoot);

        if (posReach.has(terminals.firstNode) && negReach.has(terminals.secondNode)) {
          litComponents.add(comp.id);
          totalResistance += getBaseResistance(comp);
          hasPath = true;
          // Terminal 1 is Pos, Terminal 2 is Neg -> Direction -1 (Reverse)
          componentDirections.set(comp.id, -1);
        } else if (posReach.has(terminals.secondNode) && negReach.has(terminals.firstNode)) {
          litComponents.add(comp.id);
          totalResistance += getBaseResistance(comp);
          hasPath = true;
          // Terminal 2 is Pos, Terminal 1 is Neg -> Direction 1 (Forward / Clockwise)
          componentDirections.set(comp.id, 1);
        }
      }
    }
  }

  // Direct Wire Short Circuit Detection (excludes resistors)
  let directShort = false;
  for (const battery of batteries) {
    const wirePosReach = collectReachable(wireOnlyGraph, battery.positiveRoot);
    const wireNegReach = collectReachable(wireOnlyGraph, battery.negativeRoot);
    
    if (wirePosReach.has(battery.negativeRoot)) {
      directShort = true;
      break;
    }

    for (const comp of components) {
       const terminals = getTwoTerminalNodes(comp);
       if (terminals) {
          if (wirePosReach.has(terminals.firstNode) || wireNegReach.has(terminals.secondNode)) {
             componentDirections.set(comp.id, -1);
          } else if (wirePosReach.has(terminals.secondNode) || wireNegReach.has(terminals.firstNode)) {
             componentDirections.set(comp.id, 1);
          }
       }
    }
  }

  let isShortCircuit = directShort || (hasPath && totalResistance === 0);

  const baseTotalVoltage = batteries[0]?.voltage ?? 9;
  const allGlobalPaths = batteries[0] ? evaluatePaths(graph, batteries[0].positiveRoot, batteries[0].negativeRoot, components) : [];
  let pathBasedCurrent = 0;
  let validPathFound = false;

  for (const p of allGlobalPaths) {
     validPathFound = true;
     if (p.resistance > 0) {
        pathBasedCurrent += Math.max(0, (baseTotalVoltage - p.ledVoltage) / p.resistance);
     } else if (baseTotalVoltage <= p.ledVoltage + 0.1) {
        pathBasedCurrent += LED_MAX_SAFE_CURRENT_AMPS;
     } else {
        isShortCircuit = true;
     }
  }

  if (validPathFound && pathBasedCurrent > 0 && baseTotalVoltage > 0) {
      totalResistance = baseTotalVoltage / pathBasedCurrent;
  }

  const effectiveResistance = hasPath ? totalResistance : Infinity;
  const resolvedSources = batteries.map((source) => resolveSourceOutput(source, effectiveResistance, isShortCircuit));
  const primarySource = resolvedSources[0];
  const totalVoltage = primarySource?.outputVoltage ?? batteries[0]?.voltage ?? 9;
  const currentAmps = primarySource?.outputCurrent ?? (isShortCircuit ? 100 : (effectiveResistance > 0 && effectiveResistance !== Infinity ? totalVoltage / effectiveResistance : 0));
  const currentMA = currentAmps * 1000;
  const powerWatts = totalVoltage * currentAmps;

  // Wheatstone Bridge specific override
  let bridgeStatus: { isBridge: boolean, balanced: boolean, vLoad: number } | null = null;
  const overrideVoltages = new Map<string, number>();

  if (batteries.length > 0) {
    const pBat = batteries[0];
    const pPosReach = collectReachable(wireOnlyGraph, pBat.positiveRoot);
    const pNegReach = collectReachable(wireOnlyGraph, pBat.negativeRoot);

    for (const comp of components) {
      if (comp.componentId === "ac_bulb") {
        const bridge = getWheatstoneBridgeState(comp, components, wireOnlyGraph, pPosReach, pNegReach);
        if (bridge.isBridge) {
          let vLoad = 0;
          if (bridge.balanced) {
            litComponents.delete(comp.id);
          } else {
            const vTotal = totalVoltage;
            const vA = vTotal * (bridge.Q!) / ((bridge.P!) + (bridge.Q!));
            const vB = vTotal * (bridge.S!) / ((bridge.R!) + (bridge.S!));
            const vTh = Math.abs(vA - vB);
            const rTh = ((bridge.P!) * (bridge.Q!)) / ((bridge.P!) + (bridge.Q!)) + ((bridge.R!) * (bridge.S!)) / ((bridge.R!) + (bridge.S!));
            const rLoad = getBaseResistance(comp);
            vLoad = vTh * rLoad / (rTh + rLoad);
            
            litComponents.add(comp.id);
            overrideVoltages.set(comp.id, vLoad);
          }
          bridgeStatus = { isBridge: true, balanced: bridge.balanced, vLoad };
        }
      }
    }
  }

  const componentStates: Record<string, SimulatedComponentState> = simulateCapacitors(
    components,
    graph,
    resolvedSources,
    totalResistance
  );

  for (const source of resolvedSources) {
    if (source.sourceType === "battery") {
      const ids = source.sourceIds || [source.sourceId];
      for (let i = 0; i < ids.length; i++) {
        componentStates[ids[i]] = {
          powered: source.outputVoltage > 0,
          isPrimaryBattery: i === 0,
          outputVoltage: source.outputVoltage,
          inParallel: !!source.inParallel,
        } as SimulatedComponentState;
      }
      continue;
    }
    
    const ids = source.sourceIds || [source.sourceId];
  for (const id of ids) {
      componentStates[id] = {
        powered: source.outputVoltage > 0,
        lit: false,
        brightness: 0,
        isBurned: false,
        isShortCircuit: isShortCircuit,
        outputVoltage: source.outputVoltage,
        outputCurrent: source.outputCurrent,
        powerMode: source.mode,
        peakVoltage: source.peakVoltage,
        instantaneousVoltage: source.instantaneousVoltage,
        frequency: source.frequency,
        fault: source.fault,
      };
    }
  }

  const capacitorLoadVoltages = new Map<string, number>();

  for (const capacitor of components) {
    if (capacitor.componentId !== "capacitor") continue;
    const capState = componentStates[capacitor.id];
    if (!capState || capState.isBurned || Math.abs(capState.capacitorVoltage ?? 0) < 1.6) continue;

    const terminals = getCapacitorTerminals(capacitor);
    if (!terminals) continue;

    const capPositiveReach = collectReachable(graph, terminals.positiveNode);
    const capNegativeReach = collectReachable(graph, terminals.negativeNode);
    const capNetwork = new Set([...capPositiveReach, ...capNegativeReach]);

    for (const load of components) {
      const isLedLoad = load.componentId.startsWith("led") || load.componentId === "ac_bulb";
      const isMotorLoad = load.componentId.toLowerCase().includes("motor");
      if (!isLedLoad && !isMotorLoad) continue;

      const isConnectedToChargedCapacitor = (load.ports ?? []).some((_, index) =>
        capNetwork.has(makeNodeKey(load.id, index))
      );
      if (isConnectedToChargedCapacitor) {
        litComponents.add(load.id);
        poweredComponents.add(load.id);
        const capVoltage = Math.abs(capState.capacitorVoltage ?? 0);
        capacitorLoadVoltages.set(
          load.id,
          Math.max(capacitorLoadVoltages.get(load.id) ?? 0, capVoltage)
        );
      }
    }
  }

  // Calculate output states based on current
  components.forEach(comp => {
    const isLed = comp.componentId.startsWith("led");
    const isBulb = comp.componentId === "ac_bulb";
    const isMotor = comp.componentId.toLowerCase().includes("motor");
    const isMicrobit = comp.componentId === "microbit";
    const isEsc = comp.componentId === "esc";

    if (isLed || isBulb || isMotor || isMicrobit || isEsc) {
      if (litComponents.has(comp.id)) {
        const isAcComponent = comp.componentId.startsWith("ac_");
        const hasAcSource = resolvedSources.some(s => s.sourceType === "ac_power_supply");
        if (isAcComponent && !hasAcSource) {
           litComponents.delete(comp.id);
           componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
           return;
        }

        if (isLed) {
          const pathsWithLed = batteries[0] ? evaluatePaths(graph, batteries[0].positiveRoot, batteries[0].negativeRoot, components).filter(p => p.components.includes(comp.id)) : [];
          
          let ledMaxCurrent = 0;
          let ledBurned = false;
          let hasValidPath = false;

          for (const p of pathsWithLed) {
             hasValidPath = true;
             let pathCurrent = 0;
             if (p.resistance === 0) {
               if (totalVoltage > p.ledVoltage + 0.1) {
                 ledBurned = true;
                 pathCurrent = 100;
               } else if (Math.abs(totalVoltage - p.ledVoltage) <= 0.1) {
                 pathCurrent = LED_MAX_SAFE_CURRENT_AMPS;
               } else {
                 pathCurrent = 0;
               }
             } else {
               if (totalVoltage > p.ledVoltage) {
                 pathCurrent = (totalVoltage - p.ledVoltage) / p.resistance;
               }
               if (pathCurrent > LED_MAX_SAFE_CURRENT_AMPS * 5) {
                 ledBurned = true;
               }
             }
             ledMaxCurrent = Math.max(ledMaxCurrent, pathCurrent);
          }

          // Evaluate paths from charged capacitors to power the LED
          for (const capacitor of components) {
            if (capacitor.componentId !== "capacitor") continue;
            const capState = componentStates[capacitor.id];
            if (!capState || capState.isBurned || Math.abs(capState.capacitorVoltage ?? 0) < 1.0) continue;
            const terminals = getCapacitorTerminals(capacitor);
            if (!terminals) continue;
            
            const capPaths = evaluatePaths(graph, terminals.positiveNode, terminals.negativeNode, components).filter(p => p.components.includes(comp.id));
            const capVoltage = Math.abs(capState.capacitorVoltage ?? 0);
            
            for (const p of capPaths) {
               hasValidPath = true;
               let pathCurrent = 0;
               let effectiveResistance = p.resistance;
               if (p.ledVoltage > 0) effectiveResistance += CAPACITOR_LED_DISCHARGE_RESISTANCE_OHMS;
               if (effectiveResistance === 0) effectiveResistance = 1;
               
               if (capVoltage > p.ledVoltage) {
                 pathCurrent = (capVoltage - p.ledVoltage) / effectiveResistance;
                 // Scale up current for brightness calculation to match the 3000 Ohm artificial decay
                 pathCurrent = pathCurrent * (CAPACITOR_LED_DISCHARGE_RESISTANCE_OHMS / LED_INTERNAL_RESISTANCE_OHMS);
               }
               
               ledMaxCurrent = Math.max(ledMaxCurrent, pathCurrent);
            }
          }

          const capacitorSupplyVoltage = capacitorLoadVoltages.get(comp.id) ?? 0;
          if (capacitorSupplyVoltage > LED_FORWARD_VOLTAGE) {
            hasValidPath = true;
            const capacitorCurrent =
              (capacitorSupplyVoltage - LED_FORWARD_VOLTAGE) /
              CAPACITOR_LED_DISCHARGE_RESISTANCE_OHMS;
            const displayCurrent =
              capacitorCurrent * (CAPACITOR_LED_DISCHARGE_RESISTANCE_OHMS / LED_INTERNAL_RESISTANCE_OHMS);
            ledMaxCurrent = Math.max(ledMaxCurrent, displayCurrent);
          }

          if (!hasValidPath) {
             litComponents.delete(comp.id);
             componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
             return;
          }

          const currentBrightness = Math.min(1, ledMaxCurrent / LED_MAX_SAFE_CURRENT_AMPS);

          if (ledBurned || isShortCircuit || totalVoltage > 20) {
            litComponents.delete(comp.id);
            componentStates[comp.id] = { isBurned: true, brightness: 0, lit: false };
          } else if (ledMaxCurrent <= 0) {
            litComponents.delete(comp.id);
            componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
          } else {
            componentStates[comp.id] = {
              isBurned: false,
              brightness: Math.max(0.1, currentBrightness),
              direction: 1,
              lit: true,
            };
          }
          return;
        }

        // Failure States: Over-voltage (e.g. > 12V for small components)
        const voltageRating = comp.voltageValue || 12;
        const appliedVoltage = overrideVoltages.has(comp.id) ? overrideVoltages.get(comp.id)! : totalVoltage;
        const isOverVoltage = isBulb ? (appliedVoltage > voltageRating + 0.1) : (appliedVoltage > voltageRating * 2.0);

        if (isOverVoltage) {
          componentStates[comp.id] = { isBurned: true, brightness: 0, lit: false };
        } else if (appliedVoltage <= 0.1) {
          litComponents.delete(comp.id);
          componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
        } else {
          let direction = componentDirections.get(comp.id) ?? 1;

          // BLDC Logic: Direct Battery Check & Phase swapping
          if (comp.componentId === "bldc_motor") {
            const escWires = wires.filter(w => 
              (w.from.compId === comp.id || w.to.compId === comp.id) &&
              (components.find(c => c.id === (w.from.compId === comp.id ? w.to.compId : w.from.compId))?.componentId === "esc")
            );

            if (escWires.length < 3) {
              componentStates[comp.id] = { isBurned: true, brightness: 0, lit: false };
              // We'll update summary later
            } else {
              // Direction reversal logic: Swap Phase A and B
              const swapped = escWires.some(w => {
                const motorPin = comp.relativePins?.[w.from.compId === comp.id ? w.from.portIndex : w.to.portIndex];
                const escComp = components.find(c => c.id === (w.from.compId === comp.id ? w.to.compId : w.from.compId))!;
                const escPin = escComp.relativePins?.[w.from.compId === comp.id ? w.to.portIndex : w.from.portIndex];
                return (motorPin?.name === "Phase A" && escPin?.name === "Motor Phase B") || (motorPin?.name === "Phase B" && escPin?.name === "Motor Phase A");
              });
              direction = swapped ? -1 : 1;
            }
          }

          // AC Motor: Fixed direction
          if (comp.componentId === "ac_motor") direction = 1;

          let brightness = 0;
          if (isBulb) {
             const ratio = appliedVoltage / voltageRating;
             brightness = ratio >= 0.95 ? 1.0 : Math.pow(ratio, 3);
          } else if (isMotor) {
             brightness = Math.min(appliedVoltage / 9, 1.5);
          }

          componentStates[comp.id] = { isBurned: componentStates[comp.id]?.isBurned || false, brightness, direction, lit: true };
        }
      } else {
        litComponents.delete(comp.id);
        componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
      }
    }
  });

  const currentLimitedSource = resolvedSources.find((source) => source.mode === "CC");
  const trippedAcSource = resolvedSources.find((source) => source.sourceType === "ac_power_supply" && source.mode === "TRIP");
  let summary = "Simulation running.";
  
  if (bridgeStatus) {
    if (bridgeStatus.balanced) summary = "Bridge santulit hai. Bulb nahi jalega.";
    else summary = "Bridge asantulit hai. Bulb jalega.";
  }
  else if (isShortCircuit) summary = "CRITICAL: Short Circuit detected!";
  else if (Object.values(componentStates).some(s => s.isBurned)) {
    const burnedBLDC = components.find(c => c.componentId === "bldc_motor" && componentStates[c.id]?.isBurned);
    if (burnedBLDC) summary = "ERROR: BLDC Motor must be connected to an ESC!";
    else summary = "Simulation Warning: Component burned out due to over-voltage!";
  }
  else if (trippedAcSource) summary = "AC supply tripped: RMS current crossed the safety limit.";
  else if (currentLimitedSource) summary = "Power supply is in CC mode: overload current is limited and output voltage dropped.";
  else if (litComponents.size > 0) summary = `Simulation running: ${currentMA.toFixed(1)}mA current.`;

  return {
    runnable: true,
    litComponents: [...litComponents],
    poweredComponents: [...poweredComponents],
    poweredWires: [...poweredWires],
    componentStates,
    summary,
    voltage: totalVoltage,
    totalResistance,
    currentMA,
    powerWatts,
    isShortCircuit
  };
}
