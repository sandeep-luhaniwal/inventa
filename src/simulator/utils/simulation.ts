import { PlacedComponent, Wire } from "../types/circuit";
import { getAllPins } from "./circuitUtils";

export interface SimulatedComponentState {
  powered?: boolean;
  lit?: boolean;
  brightness?: number;
  isBurned?: boolean;
  isShortCircuit?: boolean;
}

export interface SimulationResult {
  runnable: boolean;
  litComponents: string[];
  poweredComponents: string[];
  poweredWires: string[];
  componentStates?: Record<string, { brightness: number; isBurned: boolean }>;
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
  positiveRoot: string;
  negativeRoot: string;
}

type Graph = Map<string, Set<string>>;

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
    if (comp.componentId === "breadboard") {
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

    const isResistor = comp.componentId === "resistor";
    if (isResistor && !includeResistors) continue;

    if (
      isResistor ||
      comp.componentId === "diode" ||
      comp.componentId === "slideswitch" ||
      comp.componentId === "pushbutton" ||
      comp.componentId === "ac_bulb" ||
      comp.componentId.startsWith("led")
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
    if (!comp.componentId.startsWith("battery")) continue;
    let positiveIndex = -1;
    let negativeIndex = -1;
    comp.relativePins?.forEach((pin, index) => {
      if (pin.type === "positive") positiveIndex = index;
      if (pin.type === "negative") negativeIndex = index;
    });
    if (positiveIndex >= 0 && negativeIndex >= 0) {
      terminals.push({
        positiveRoot: makeNodeKey(comp.id, positiveIndex),
        negativeRoot: makeNodeKey(comp.id, negativeIndex),
      });
    }
  }
  return terminals;
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
  const val = comp.resistanceValue ?? 0;
  const unit = comp.resistanceUnit ?? "Ω";
  return val * (UNIT_MULTIPLIERS[unit] ?? 1);
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
  const batteries = getBatteryTerminals(components);

  if (batteries.length === 0) {
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
  
  let totalVoltage = 9; // User specified 9V fixed
  let totalResistance = 0;
  let hasPath = false;
  
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

    // Polarity check for LEDs
    for (const comp of components) {
      if (comp.componentId.startsWith("led")) {
        const ledPins = getLedPins(comp);
        if (ledPins) {
          const edgesA = graph.get(ledPins.anodeNode);
          const edgesC = graph.get(ledPins.cathodeNode);
          edgesA?.delete(ledPins.cathodeNode);
          edgesC?.delete(ledPins.anodeNode);

          const posReach = collectReachable(graph, battery.positiveRoot);
          const negReach = collectReachable(graph, battery.negativeRoot);

          // Polarity check: Anode must reach Positive, Cathode must reach Negative
          if (posReach.has(ledPins.anodeNode) && negReach.has(ledPins.cathodeNode)) {
            // Bypass check: If there's already a conductive path between anode and cathode 
            // (without using the LED's internal bridge), the current will skip the LED.
            if (!posReach.has(ledPins.cathodeNode)) {
              litComponents.add(comp.id);
              hasPath = true;
            }
          }

          edgesA?.add(ledPins.cathodeNode);
          edgesC?.add(ledPins.anodeNode);
        }
      }

      if (comp.componentId === "ac_bulb") {
        const p0 = makeNodeKey(comp.id, 0);
        const p1 = makeNodeKey(comp.id, 1);

        const edges0 = graph.get(p0);
        const edges1 = graph.get(p1);
        edges0?.delete(p1);
        edges1?.delete(p0);

        const posReach = collectReachable(graph, battery.positiveRoot);
        const negReach = collectReachable(graph, battery.negativeRoot);

        // Non-polarized logic: Glows if T1 is Pos and T2 is Neg, OR T1 is Neg and T2 is Pos
        if ((posReach.has(p0) && negReach.has(p1)) || (posReach.has(p1) && negReach.has(p0))) {
          litComponents.add(comp.id);
          hasPath = true;
        }

        edges0?.add(p1);
        edges1?.add(p0);
      }
    }
  }

  // Direct Wire Short Circuit Detection (excludes resistors)
  let directShort = false;
  for (const battery of batteries) {
    const wirePosReach = collectReachable(wireOnlyGraph, battery.positiveRoot);
    if (wirePosReach.has(battery.negativeRoot)) {
      directShort = true;
      break;
    }
  }

  const isShortCircuit = directShort || (hasPath && totalResistance === 0);
  const currentAmps = isShortCircuit ? 100 : (totalResistance > 0 ? totalVoltage / totalResistance : 0);
  const currentMA = currentAmps * 1000;
  const powerWatts = totalVoltage * currentAmps;

  const componentStates: Record<string, { brightness: number; isBurned: boolean }> = {};

  // Calculate LED states based on current
  components.forEach(comp => {
    if (comp.componentId.startsWith("led") || comp.componentId === "ac_bulb") {
      if (litComponents.has(comp.id)) {
        if (currentMA > 100 || isShortCircuit) { // Bulbs are more robust than LEDs
          componentStates[comp.id] = { isBurned: true, brightness: 0 };
        } else if (currentMA >= 20) {
          componentStates[comp.id] = { isBurned: false, brightness: 1 };
        } else if (currentMA >= 10) {
          componentStates[comp.id] = { isBurned: false, brightness: 0.6 };
        } else {
          componentStates[comp.id] = { isBurned: false, brightness: 0.3 };
        }
      } else {
        componentStates[comp.id] = { isBurned: false, brightness: 0 };
      }
    }
  });

  let summary = "Simulation running.";
  if (isShortCircuit) summary = "CRITICAL: Short Circuit detected!";
  else if (litComponents.size > 0) summary = `Simulation running: ${currentMA.toFixed(1)}mA current.`;

  return {
    runnable: true,
    litComponents: [...litComponents],
    poweredComponents: [...poweredComponents],
    poweredWires: [...poweredWires],
    componentStates, // New field
    summary,
    voltage: totalVoltage,
    totalResistance,
    currentMA,
    powerWatts,
    isShortCircuit
  };
}
