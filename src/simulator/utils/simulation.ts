import { PlacedComponent, Wire } from "../types/circuit";
import { getAllPins } from "./circuitUtils";

export interface SimulatedComponentState {
  powered?: boolean;
  lit?: boolean;
  brightness?: number;
  isBurned?: boolean;
  isShortCircuit?: boolean;
  direction?: number;
  capacitorVoltage?: number;
  capacitorChargeCoulombs?: number;
  capacitorEnergyJoules?: number;
  capacitorMode?: "charging" | "discharging" | "charged" | "reverse-polarity" | "breakdown";
  capacitorEquivalentSeriesResistance?: number;
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
  positiveRoot: string;
  negativeRoot: string;
  voltage: number;
}

type Graph = Map<string, Set<string>>;

const TWO_TERMINAL_LOAD_RESISTANCES: Record<string, number> = {
  ac_bulb: 120,
  dc_motor: 25,
  gearmotor: 22,
  vibration_motor: 18,
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
const LED_FORWARD_VOLTAGE = 2.0;
const LED_MAX_SAFE_CURRENT_AMPS = 0.02;
const LED_INTERNAL_RESISTANCE_OHMS = 350;

type CapacitorRuntimeState = {
  voltage: number;
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

    const isResistor = comp.componentId === "resistor";
    if (isResistor && !includeResistors) continue;

    const isClosedPushbutton = comp.componentId === "pushbutton" && comp.isPressed === true;

    if (
      isResistor ||
      comp.componentId === "diode" ||
      comp.componentId === "slideswitch" ||
      isClosedPushbutton ||
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
        positiveRoot: makeNodeKey(comp.id, positiveIndex),
        negativeRoot: makeNodeKey(comp.id, negativeIndex),
        voltage: isPowerSupply ? (comp.powerVoltageSet ?? (comp.componentId === "ac_power_supply" ? 230.5 : 12.5)) : (comp.voltageValue ?? 9),
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
  return {
    positiveNode: makeNodeKey(comp.id, 0),
    negativeNode: makeNodeKey(comp.id, 1),
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
    }

    const equivalentSeriesResistance = Math.max(
      CAPACITOR_DEFAULT_ESR_OHMS,
      circuitResistance > 0 ? circuitResistance : CAPACITOR_DEFAULT_ESR_OHMS
    );
    const tau = Math.max(CAPACITOR_DEFAULT_ESR_OHMS * Math.max(capacitance, 1e-12), equivalentSeriesResistance * Math.max(capacitance, 1e-12));
    const alpha = 1 - Math.exp(-CAPACITOR_TIME_STEP_SECONDS / tau);
    const nextVoltage = runtime.voltage + (targetVoltage - runtime.voltage) * Math.min(1, alpha);
    const absVoltage = Math.abs(nextVoltage);
    const capacitanceUf = capacitance / 1e-6;
    const overVoltage = voltageLimit > 0 && absVoltage > voltageLimit;
    const highStressCapacitance = capacitanceUf > 10000 && absVoltage > 0;
    const failed = overVoltage || highStressCapacitance;
    const mode: SimulatedComponentState["capacitorMode"] = failed
      ? "breakdown"
      : isConnectedToSource
        ? (isReversePolarity ? "reverse-polarity" : (Math.abs(targetVoltage - nextVoltage) < 0.02 ? "charged" : "charging"))
        : (Math.abs(nextVoltage) < 0.02 ? "discharging" : "discharging");

    capacitorRuntimeStates.set(comp.id, { voltage: nextVoltage });

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
  
  const totalVoltage = batteries[0]?.voltage ?? 9;
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
    if (wirePosReach.has(battery.negativeRoot)) {
      directShort = true;
      break;
    }
  }

  const isShortCircuit = directShort || (hasPath && totalResistance === 0);
  const currentAmps = isShortCircuit ? 100 : (totalResistance > 0 ? totalVoltage / totalResistance : 0);
  const currentMA = currentAmps * 1000;
  const powerWatts = totalVoltage * currentAmps;

  const componentStates: Record<string, SimulatedComponentState> = simulateCapacitors(
    components,
    graph,
    batteries,
    totalResistance
  );

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
        if (isLed) {
          const ledResistance = totalResistance > 0 ? totalResistance : LED_INTERNAL_RESISTANCE_OHMS;
          const ledCurrentAmps = totalVoltage > LED_FORWARD_VOLTAGE
            ? (totalVoltage - LED_FORWARD_VOLTAGE) / ledResistance
            : 0;
          const currentBrightness = Math.min(1, ledCurrentAmps / LED_MAX_SAFE_CURRENT_AMPS);

          if (isShortCircuit || totalVoltage > 20 || ledCurrentAmps > LED_MAX_SAFE_CURRENT_AMPS * 5) {
            componentStates[comp.id] = { isBurned: true, brightness: 0, lit: false };
          } else if (totalVoltage < LED_FORWARD_VOLTAGE || ledCurrentAmps <= 0) {
            componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
          } else if (totalVoltage <= 3.5) {
            const dimRatio = (totalVoltage - LED_FORWARD_VOLTAGE) / (3.5 - LED_FORWARD_VOLTAGE);
            componentStates[comp.id] = {
              isBurned: false,
              brightness: Math.max(0.1, Math.min(0.4, 0.1 + dimRatio * 0.3)),
              direction: 1,
              lit: true,
            };
          } else if (totalVoltage <= 9) {
            componentStates[comp.id] = {
              isBurned: false,
              brightness: Math.max(0.41, Math.min(1, currentBrightness)),
              direction: 1,
              lit: true,
            };
          } else {
            componentStates[comp.id] = {
              isBurned: false,
              brightness: 1,
              direction: 1,
              lit: true,
            };
          }
          return;
        }

        // Failure States: Over-voltage (e.g. > 12V for small components)
        const voltageRating = comp.voltageValue || 12;
        const isOverVoltage = totalVoltage > voltageRating * 2.0;

        if (isOverVoltage) {
          componentStates[comp.id] = { isBurned: true, brightness: 0 };
        } else {
          let direction = componentDirections.get(comp.id) ?? 1;

          // BLDC Logic: Direct Battery Check & Phase swapping
          if (comp.componentId === "bldc_motor") {
            const escWires = wires.filter(w => 
              (w.from.compId === comp.id || w.to.compId === comp.id) &&
              (components.find(c => c.id === (w.from.compId === comp.id ? w.to.compId : w.from.compId))?.componentId === "esc")
            );

            if (escWires.length < 3) {
              componentStates[comp.id] = { isBurned: true, brightness: 0 };
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

          const brightness = (isLed || isBulb) ? (currentMA >= 10 ? 0.6 : 0.3) : (isMotor ? Math.min(totalVoltage / 9, 1.5) : 0);
          componentStates[comp.id] = { isBurned: componentStates[comp.id]?.isBurned || false, brightness, direction, lit: true };
        }
      } else {
        componentStates[comp.id] = { isBurned: false, brightness: 0, direction: 1, lit: false };
      }
    }
  });

  let summary = "Simulation running.";
  if (isShortCircuit) summary = "CRITICAL: Short Circuit detected!";
  else if (Object.values(componentStates).some(s => s.isBurned)) {
    const burnedBLDC = components.find(c => c.componentId === "bldc_motor" && componentStates[c.id]?.isBurned);
    if (burnedBLDC) summary = "ERROR: BLDC Motor must be connected to an ESC!";
    else summary = "Simulation Warning: Component burned out due to over-voltage!";
  }
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
