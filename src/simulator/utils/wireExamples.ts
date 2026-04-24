/**
 * Wire Connection System - Minimal Working Example
 * 
 * This example demonstrates:
 * - Creating 2+ components with pins
 * - Connecting wires between them
 * - Orthogonal routing
 * - Pin snapping
 * - Component dragging with wire updates
 * 
 * SETUP:
 * This shows the data structures and flow. The actual UI is in Canvas.tsx.
 */

import { getComponentMap } from "../constants/components";
import { ConnectingFrom, PlacedComponent, Wire } from "../types/circuit";
import { generateOrthogonalPath, getAbsPin, snapToPin } from "./circuitUtils";

// import type { PlacedComponent, Wire, ConnectingFrom, WireEndpoint } from "@/types/circuit";
// import { getComponentMap } from "@/constants/components";
// import { getAbsPin, snapToPin } from "@/utils/circuitUtils";
// import { generateOrthogonalPath } from "@/utils/circuitUtils";

// ============================================================================
// EXAMPLE 1: Basic Setup - Creating Components
// ============================================================================

export function createExampleCircuit() {
  const map = getComponentMap();

  // Create two components: Resistor and Capacitor
  const components: PlacedComponent[] = [
    {
      id: "comp-r1",
      componentId: "resistor",
      name: "R1",
      x: 100,
      y: 150,
      rotation: 0,
      mirrored: false,
      flipped: false,
      ports: map.resistor.ports,
    },
    {
      id: "comp-c1",
      componentId: "capacitor",
      name: "C1",
      x: 300,
      y: 150,
      rotation: 0,
      mirrored: false,
      flipped: false,
      ports: map.capacitor.ports,
    },
    {
      id: "comp-led1",
      componentId: "led",
      name: "LED1",
      x: 300,
      y: 300,
      rotation: 0,
      mirrored: false,
      flipped: false,
      ports: map.led.ports,
    },
  ];

  return components;
}

// ============================================================================
// EXAMPLE 2: Understanding Pin Positions
// ============================================================================

export function explainPinPositions() {
  const resistor: PlacedComponent = {
    id: "comp-r1",
    componentId: "resistor",
    name: "R1",
    x: 100,              // Canvas X position
    y: 150,              // Canvas Y position
    rotation: 0,
    mirrored: false,
    flipped: false,
    ports: [
      { x: 0, y: 24 },   // Relative position within component
      { x: 80, y: 24 }
    ]
  };

  // Get absolute positions on canvas
  const leftPin = getAbsPin(resistor, 0);  // Returns { x: 100, y: 174 }
  const rightPin = getAbsPin(resistor, 1); // Returns { x: 180, y: 174 }

  console.log("Resistor left pin (absolute):", leftPin);
  // { x: 100, y: 174 }

  console.log("Resistor right pin (absolute):", rightPin);
  // { x: 180, y: 174 }

  // When component moves:
  resistor.x = 200;  // Move to right
  const newLeftPin = getAbsPin(resistor, 0);  // Returns { x: 200, y: 174 }
  console.log("After move:", newLeftPin);
  // { x: 200, y: 174 }
  // All connected wires automatically update because getAbsPin recalculates!
}

// ============================================================================
// EXAMPLE 3: Wire Connection Flow
// ============================================================================

export class CircuitWireManager {
  components: PlacedComponent[] = [];
  wires: Wire[] = [];
  connectingFrom: ConnectingFrom | null = null;
  wireIdCounter = 0;

  /**
   * User clicks on a pin
   */
  onPinClick(compId: string, portIndex: number) {
    // If no wire being drawn, start one
    if (!this.connectingFrom) {
      this.beginWire(compId, portIndex);
      console.log(`Started wire from ${compId}.pin${portIndex}`);
    }
    // If wire being drawn, try to complete it
    else {
      this.completeWire(compId, portIndex);
    }
  }

  /**
   * Start drawing a wire
   */
  private beginWire(compId: string, portIndex: number) {
    this.connectingFrom = { compId, portIndex };
  }

  /**
   * Complete a wire connection
   */
  private completeWire(targetCompId: string, targetPortIndex: number) {
    if (!this.connectingFrom) return;

    const fromComp = this.components.find((c) => c.id === this.connectingFrom!.compId);
    const toComp = this.components.find((c) => c.id === targetCompId);

    if (!fromComp || !toComp) return;

    // Validate connection
    if (!this.isValidConnection(
      this.connectingFrom.compId,
      this.connectingFrom.portIndex,
      targetCompId,
      targetPortIndex
    )) {
      console.log("Invalid connection");
      this.connectingFrom = null;
      return;
    }

    // Create wire
    const wire: Wire = {
      id: `wire-${this.wireIdCounter++}`,
      from: {
        compId: this.connectingFrom.compId,
        portIndex: this.connectingFrom.portIndex
      },
      to: {
        compId: targetCompId,
        portIndex: targetPortIndex
      }
    };

    // Add to wires
    this.wires.push(wire);
    console.log(`Created wire: ${wire.id}`);
    console.log(`  From: ${wire.from.compId}.pin${wire.from.portIndex}`);
    console.log(`  To: ${wire.to.compId}.pin${wire.to.portIndex}`);

    // Clear connecting state
    this.connectingFrom = null;
  }

  /**
   * Validate that a wire connection is valid
   */
  private isValidConnection(
    fromCompId: string,
    fromPortIndex: number,
    toCompId: string,
    toPortIndex: number
  ): boolean {
    // Can't connect to self
    if (fromCompId === toCompId) {
      console.log("Cannot connect to same component");
      return false;
    }

    // Can't connect to same pin
    if (fromPortIndex === toPortIndex) {
      console.log("Cannot connect from same pin");
      return false;
    }

    // Check for duplicate wires
    for (const wire of this.wires) {
      const same = 
        wire.from.compId === fromCompId &&
        wire.from.portIndex === fromPortIndex &&
        wire.to.compId === toCompId &&
        wire.to.portIndex === toPortIndex;

      const reverse =
        wire.from.compId === toCompId &&
        wire.from.portIndex === toPortIndex &&
        wire.to.compId === fromCompId &&
        wire.to.portIndex === fromPortIndex;

      if (same || reverse) {
        console.log("Duplicate wire");
        return false;
      }
    }

    return true;
  }

  /**
   * Delete a wire
   */
  deleteWire(wireId: string) {
    this.wires = this.wires.filter((w) => w.id !== wireId);
    console.log(`Deleted wire: ${wireId}`);
  }

  /**
   * Move a component
   */
  moveComponent(compId: string, x: number, y: number) {
    const comp = this.components.find((c) => c.id === compId);
    if (comp) {
      comp.x = x;
      comp.y = y;
      // Wires automatically update because getAbsPin recalculates positions
    }
  }
}

// ============================================================================
// EXAMPLE 4: Snapping Logic
// ============================================================================

export function explainSnapping() {
  const components = createExampleCircuit();

  /**
   * When user moves mouse during wire drawing,
   * we detect if they're near any pin
   */
  function handleMouseMove(mouseX: number, mouseY: number) {
    // Mouse is at (320, 160) - near capacitor left pin

    // Snap if within SNAP_RADIUS (14px)
    const snap = snapToPin(
      mouseX,
      mouseY,
      components,
      "comp-r1",      // Don't snap back to resistor (origin component)
      1               // Don't snap back to right pin (origin pin)
    );

    if (snap) {
      console.log("Snap detected!");
      console.log(`  Component: ${snap.compId}`);
      console.log(`  Pin: ${snap.portIndex}`);
      console.log(`  Position: (${snap.x}, ${snap.y})`);
      // Render snap indicator circle
      return snap;
    } else {
      console.log("No snap - using cursor position");
      return null;
    }
  }

  // Example calls:
  handleMouseMove(320, 160);  // Near capacitor left pin → snap
  handleMouseMove(350, 200);  // Far from any pin → no snap
}

// ============================================================================
// EXAMPLE 5: Wire Rendering with Orthogonal Routing
// ============================================================================

export function explainWireRendering() {
  const components = createExampleCircuit();

  const wire: Wire = {
    id: "wire-1",
    from: { compId: "comp-r1", portIndex: 1 },   // R1 right pin
    to: { compId: "comp-c1", portIndex: 0 }      // C1 left pin
  };

  // Get component instances
  const fromComp = components.find((c) => c.id === wire.from.compId)!;
  const toComp = components.find((c) => c.id === wire.to.compId)!;

  // Get pin positions
  const p1 = getAbsPin(fromComp, wire.from.portIndex); // (180, 174)
  const p2 = getAbsPin(toComp, wire.to.portIndex);     // (300, 174)

  // Generate orthogonal path
  const points = generateOrthogonalPath(p1, p2);
  console.log("Wire path points:", points);
  // [180, 174, 180, 174, 300, 174, 300, 174]
  //  (start) (vert)  (horiz)  (vert end)

  /**
   * In react-konva, this renders as:
   * <Line
   *   points={points}
   *   stroke="#22c55e"
   *   strokeWidth={2.5}
   *   lineJoin="round"
   * />
   */

  // If you move R1 to (250, 150):
  fromComp.x = 250;
  const p1_new = getAbsPin(fromComp, wire.from.portIndex); // (330, 174)
  const points_new = generateOrthogonalPath(p1_new, p2);
  console.log("After R1 move:", points_new);
  // Line component automatically re-renders with new path!
}

// ============================================================================
// EXAMPLE 6: Orthogonal Path Algorithm
// ============================================================================

export function explainOrthogonalRouting() {
  /**
   * VHV (Vertical-Horizontal-Vertical) Routing
   * 
   * Start point:  (100, 50)   [pin on left component]
   * End point:    (300, 150)  [pin on right component]
   * 
   * Path:
   *  (100, 50) ──v──┐  Start, go down
   *               Y=100 (midpoint)
   *                ├──h─→ (300, 100) Go right
   *                       └──v──┐ Go down
   *                           (300, 150) End
   */

  const p1 = { x: 100, y: 50 };
  const p2 = { x: 300, y: 150 };
  const midY = p1.y + (p2.y - p1.y) / 2;  // 100

  const orthogonalPath = [
    p1.x, p1.y,        // [100, 50]   Start
    p1.x, midY,        // [100, 100]  Vertical leg
    p2.x, midY,        // [300, 100]  Horizontal leg
    p2.x, p2.y         // [300, 150]  Vertical leg to end
  ];

  console.log("Orthogonal path:", orthogonalPath);
  // [100, 50, 100, 100, 300, 100, 300, 150]
}

// ============================================================================
// EXAMPLE 7: Complete Circuit Setup
// ============================================================================

export function setupCompleteExample() {
  const manager = new CircuitWireManager();
  manager.components = createExampleCircuit();

  // User creates wires
  console.log("\n=== Creating Wires ===");
  
  manager.onPinClick("comp-r1", 1);  // Click R1 right pin
  console.log("Connecting from:", manager.connectingFrom);
  // { compId: "comp-r1", portIndex: 1 }

  // User moves mouse over C1 left pin (snaps)
  const snap = snapToPin(300, 174, manager.components, "comp-r1", 1);
  console.log("Snap target:", snap);
  // { compId: "comp-c1", portIndex: 0, x: 300, y: 174 }

  manager.onPinClick("comp-c1", 0);  // Click C1 left pin
  // Wire created!

  console.log("\nWires:", manager.wires);
  // [{ id: "wire-0", from: {...}, to: {...} }]

  // Add more wires
  manager.onPinClick("comp-c1", 1);  // Click C1 right pin
  manager.onPinClick("comp-led1", 0); // Click LED left pin (cathode)
  // Another wire created!

  console.log("\nAll wires:", manager.wires);

  // Move R1
  console.log("\n=== Moving Component ===");
  manager.moveComponent("comp-r1", 200, 150);
  console.log("R1 moved to (200, 150)");
  console.log("Wires automatically updated!");

  // Delete a wire
  console.log("\n=== Deleting Wire ===");
  if (manager.wires.length > 0) {
    manager.deleteWire(manager.wires[0].id);
  }

  return manager;
}

// ============================================================================
// EXAMPLE 8: Render Path for Different Layouts
// ============================================================================

export function explainLayoutScenarios() {
  /**
   * Scenario 1: Components arranged left-to-right
   */
  const scenario1 = {
    comp1: { x: 100, y: 100, ports: [{x: 0, y: 24}, {x: 80, y: 24}] },
    comp2: { x: 300, y: 100, ports: [{x: 0, y: 24}, {x: 80, y: 24}] }
  };

  // Path is nearly horizontal
  const path1 = [100, 124, 100, 124, 300, 124, 300, 124];
  console.log("Horizontal layout - path:", path1);

  /**
   * Scenario 2: Components stacked vertically
   */
  const scenario2 = {
    comp1: { x: 100, y: 100, ports: [{x: 40, y: 0}, {x: 40, y: 48}] },
    comp2: { x: 100, y: 250, ports: [{x: 40, y: 0}, {x: 40, y: 48}] }
  };

  // Path is nearly vertical
  const path2 = [140, 48, 140, 149, 140, 149, 140, 250];
  console.log("Vertical layout - path:", path2);

  /**
   * Scenario 3: Components diagonal
   */
  const scenario3 = {
    comp1: { x: 100, y: 100, ports: [{x: 80, y: 24}] },
    comp2: { x: 300, y: 250, ports: [{x: 0, y: 24}] }
  };

  // Path uses VHV routing
  const path3 = [180, 124, 180, 187, 300, 187, 300, 274];
  console.log("Diagonal layout - path:", path3);
}

// ============================================================================
// MAIN EXAMPLE
// ============================================================================

export function runCompleteExample() {
  console.log("=== Wire Connection System - Complete Example ===\n");

  // Set up the circuit
  const manager = setupCompleteExample();

  console.log("\n=== Final Circuit State ===");
  console.log("Components:", manager.components.map((c) => `${c.name}@(${c.x},${c.y})`));
  console.log("Wires:", manager.wires.length);

  // Verify orthogonal routing
  console.log("\n=== Wire Paths ===");
  for (const wire of manager.wires) {
    const fromComp = manager.components.find((c) => c.id === wire.from.compId)!;
    const toComp = manager.components.find((c) => c.id === wire.to.compId)!;
    const p1 = getAbsPin(fromComp, wire.from.portIndex);
    const p2 = getAbsPin(toComp, wire.to.portIndex);
    const points = generateOrthogonalPath(p1, p2);

    console.log(`Wire ${wire.id}:`);
    console.log(`  From: ${wire.from.compId}.pin${wire.from.portIndex} at (${p1.x}, ${p1.y})`);
    console.log(`  To: ${wire.to.compId}.pin${wire.to.portIndex} at (${p2.x}, ${p2.y})`);
    console.log(`  Path points: [${points.join(", ")}]`);
  }
}

// Call this to see it in action
// runCompleteExample();
