# Wire Connection System - Complete Guide

## Overview

This is a complete wire connection system for your circuit design tool, implemented with React, TypeScript, and react-konva. The system allows users to:

- Click on pins to start wire connections
- Follow cursor with temporary preview wire
- Snap to available pins (with visual feedback)
- Complete connections with orthogonal (90-degree) routing
- Drag components while wires update automatically
- Delete wires with double-click or programmatically

## Architecture

### 1. **Component Structure**

#### Types (`src/types/circuit.ts`)
```typescript
interface Pin {
  x: number;  // Relative position within component
  y: number;
}

interface PlacedComponent {
  id: string;
  componentId: string;  // Reference to component definition
  name: string;
  x: number;  // Canvas position
  y: number;
  rotation: number;
  mirrored: boolean;
  ports: Pin[];  // Array of pins
}

interface Wire {
  id: string;
  from: { compId: string; portIndex: number };
  to: { compId: string; portIndex: number };
}
```

#### Component Definition (`src/constants/components.ts`)
```typescript
export const COMPONENT_REGISTRY: ComponentDefinition[] = [
  {
    id: "resistor",
    name: "Resistor",
    ports: [
      { x: 0, y: 24 },    // Left pin
      { x: 80, y: 24 }    // Right pin
    ],
    asset: resistorImg,
  },
  // ... more components
];
```

### 2. **Rendering Components**

#### ComponentNode (`src/components/circuit/canvas/ComponentNode.tsx`)

- Renders Konva Group with embedded component image
- Renders interactive pin circles at relative positions
- Shows visual feedback:
  - Hover: Light yellow highlight
  - Active (wire starting): Green glow
  - Available for connection: Green highlight when another wire is being drawn
  - Label tooltip on hover
- Prevents dragging while wire is being drawn
- Handles click to start wire connection

**Key Features:**
```typescript
<Circle
  // Pin size increases on hover
  radius={PIN_RADIUS + (isHovered ? 2 : 0)}
  
  // Color changes based on state
  fill={
    isActive ? COLORS.wireActive : 
    isAvailableForConnection ? COLORS.snapIndicator : 
    isHovered ? COLORS.pinHover : 
    COLORS.pinDefault
  }
  
  // Enhanced visual feedback during connection
  shadowBlur={isActive || isAvailable ? 8 : 0}
/>
```

### 3. **Wire Connection Flow**

#### User Interaction Sequence:

1. **Click on Pin** → Component emits `onPinClick(compId, portIndex)`
2. **Store Starting Pin** → Canvas stores in `connectingFrom` state
3. **Move Mouse** → Real-time temporary wire preview rendered
4. **Auto-snap Detection** → When near another pin, snap indicator appears
5. **Click Target Pin** → Complete connection (if valid target)
6. **Auto-cancel** → Click on empty space or press Escape to cancel

#### Canvas Event Handlers:

```typescript
const handleMouseMove = (e) => {
  const pos = stageRef.current?.getRelativePointerPosition();
  
  if (connectingFrom) {
    // Find nearest pin for snapping
    const snap = snapToPin(
      pos.x, pos.y, 
      placedComponents, 
      connectingFrom.compId,  // Exclude origin component
      connectingFrom.portIndex // Exclude origin pin
    );
    setSnapTarget(snap ? { x: snap.x, y: snap.y } : null);
  }
};

const handleMouseUp = (e) => {
  if (!connectingFrom) return;
  
  const snap = snapToPin(pos.x, pos.y, placedComponents, ...);
  if (snap) {
    // Complete the wire connection
    onPinClick(snap.compId, snap.portIndex);
  }
};
```

### 4. **Orthogonal Wire Routing**

#### Algorithm: VHV Pattern (Vertical → Horizontal → Vertical)

```typescript
export function generateOrthogonalPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number[] {
  const midY = p1.y + (p2.y - p1.y) / 2;
  
  return [
    p1.x, p1.y,      // Start point
    p1.x, midY,      // Vertical leg (go to middle Y)
    p2.x, midY,      // Horizontal leg (go to target X)
    p2.x, p2.y,      // Vertical leg (go to target Y)
  ];
}
```

**Example:**
```
p1 = (100, 50)
p2 = (300, 150)
midY = 100

Wire path:
(100, 50)  ──┐
             │ Vertical
        (100, 100) ──────────┐
                   Horizontal │
                        (300, 100) ──┐
                                     │ Vertical
                                 (300, 150)
```

### 5. **Pin Snapping Logic**

#### Snap Detection
```typescript
export function snapToPin(
  mx: number,  // Mouse X
  my: number,  // Mouse Y
  components: PlacedComponent[],
  excludeCompId?: string,      // Don't snap to origin
  excludePortIndex?: number
): SnapResult | null {
  let best = null;
  let bestDist = SNAP_RADIUS;  // 14px default
  
  for (const comp of components) {
    for (let i = 0; i < comp.ports.length; i++) {
      // Skip origin pin
      if (comp.id === excludeCompId && i === excludePortIndex) continue;
      
      const pos = getAbsPin(comp, i);  // Get absolute position
      const dist = Math.hypot(mx - pos.x, my - pos.y);
      
      if (dist < bestDist) {
        bestDist = dist;
        best = { compId: comp.id, portIndex: i, x: pos.x, y: pos.y };
      }
    }
  }
  
  return best;
}
```

**Visual Feedback:**
- Snap indicator circle appears around target pin
- Larger radius (PIN_RADIUS + 5) with dashed border
- Color: Green (#22c55e)

### 6. **Wire Rendering**

#### WireLayer (`src/components/circuit/canvas/WireLayer.tsx`)

**Committed Wires:**
```typescript
{wires.map((wire) => {
  const p1 = getAbsPin(fromComp, wire.from.portIndex);
  const p2 = getAbsPin(toComp, wire.to.portIndex);
  const points = generateOrthogonalPath(p1, p2);
  
  return (
    <Line
      points={points}
      stroke={isSelected ? COLORS.wireSelected : COLORS.wireActive}
      strokeWidth={isSelected ? 3 : 2.5}
      lineJoin="round"  // Smooth corners at bends
      hitStrokeWidth={12}  // Large click area
    />
  );
})}
```

**Temporary Wire (During Connection):**
```typescript
{connectingFrom && (
  <Line
    points={generateOrthogonalPath(p1, tempEnd)}
    stroke={COLORS.wireActive}
    strokeWidth={2}
    dash={[6, 4]}  // Dashed for preview
    opacity={0.75}
    listening={false}  // Can't click on temp wire
  />
)}
```

**Snap Indicator:**
```typescript
{snapTarget && (
  <Circle
    x={snapTarget.x}
    y={snapTarget.y}
    radius={PIN_RADIUS + 5}
    stroke={COLORS.snapIndicator}
    dash={[4, 2]}
  />
)}
```

## Utility Functions

### Get Absolute Pin Position
```typescript
export function getAbsPin(
  comp: PlacedComponent,
  portIndex: number
): { x: number; y: number } {
  const pin = comp.ports[portIndex];
  return {
    x: comp.x + pin.x,
    y: comp.y + pin.y
  };
}
```

### Generate Orthogonal Path
```typescript
export function generateOrthogonalPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number[] {
  const midY = p1.y + (p2.y - p1.y) / 2;
  return [p1.x, p1.y, p1.x, midY, p2.x, midY, p2.x, p2.y];
}
```

### Find Nearest Pin (Snap)
```typescript
export function snapToPin(
  mx: number,
  my: number,
  components: PlacedComponent[],
  excludeCompId?: string,
  excludePortIndex?: number
): SnapResult | null {
  // Returns the nearest pin within SNAP_RADIUS (14px)
  // Automatically excludes the origin pin
}
```

## State Management in Canvas

```typescript
interface CanvasProps {
  placedComponents: PlacedComponent[];      // All placed components
  wires: Wire[];                             // All wires
  connectingFrom: ConnectingFrom | null;    // Current wire being drawn
  selectedComponents: string[];              // Selected component IDs
  selectedWire: string | null;              // Selected wire ID
  cursor: { x: number; y: number };         // Current mouse position
  snapTarget: { x: number; y: number } | null; // Snap target (if valid)
}
```

## Wire Connection Lifecycle

### 1. Starting a Wire
```typescript
onPinClick = (compId: string, portIndex: number) => {
  // If no wire is being drawn, start one
  if (!connectingFrom) {
    setConnectingFrom({ compId, portIndex });
  }
  // If wire is being drawn, try to complete it
  else {
    // Validate connection
    // Create wire object
    // Add to wires[]
    // Clear connectingFrom
  }
};
```

### 2. Temporary Preview
During mouse move:
```typescript
const snap = snapToPin(cursorX, cursorY, components, ...);
setSnapTarget(snap);  // Shows snap indicator

// WireLayer renders temp wire:
generateOrthogonalPath(startPin, snapTarget || cursor)
```

### 3. Completing Connection
On second pin click:
```typescript
const newWire: Wire = {
  id: generateId(),
  from: { compId: startComp, portIndex: startPin },
  to: { compId: targetComp, portIndex: targetPin }
};

wires.push(newWire);
setConnectingFrom(null);
```

## Component Dragging

When a component moves, wires automatically update because:

1. **WireLayer tracks positions in realtime:**
   ```typescript
   const p1 = getAbsPin(fromComp, wire.from.portIndex);
   const p2 = getAbsPin(toComp, wire.to.portIndex);
   // These are calculated fresh on every render
   ```

2. **Wire path is regenerated:**
   ```typescript
   const points = generateOrthogonalPath(p1, p2);
   // Always uses current component positions
   ```

3. **No state updates needed** - React re-renders with new positions

## Visual States Reference

### Pins
| State | Color | Size | Effect |
|-------|-------|------|--------|
| Default | White | 6px | - |
| Hover | Yellow | 8px | Tooltip appears |
| Active (wiring) | Green | 6px | Glow effect |
| Available for connection | Green | 6px | Enhanced glow |

### Wires
| State | Color | Style | Width |
|-------|-------|-------|-------|
| Default | Green (#22c55e) | Solid | 2.5px |
| Selected | Orange (#f59e0b) | Solid | 3px |
| Simulating | Red (#ef4444) | Solid | 2.5px |
| Preview | Green | Dashed | 2px |

### Snap Indicator
- Circle around target pin
- Green border with dashed pattern
- Radius: 11px (PIN_RADIUS + 5)

## Configuration Constants

Edit `src/constants/circuit.ts`:

```typescript
export const SNAP_RADIUS = 14;        // Pixels for snap detection
export const PIN_RADIUS = 6;          // Pin circle radius
export const COMPONENT_W = 80;        // Component width
export const COMPONENT_H = 48;        // Component height
export const GRID_STEP = 30;          // Grid spacing

export const COLORS = {
  wireActive: "#22c55e",              // Active wire green
  wireIdle: "#6366f1",                // Idle wire blue
  wireSelected: "#f59e0b",            // Selected wire orange
  wireSimulate: "#ef4444",            // Simulation red
  pinActiveStroke: "#16a34a",         // Dark green stroke
  pinHover: "#fbbf24",                // Yellow hover
  pinDefault: "#ffffff",              // White default
  snapIndicator: "#22c55e",           // Green snap
  // ... more colors
};
```

## Usage Example

```typescript
// Component definition (in constants/components.ts)
{
  id: "resistor",
  name: "Resistor",
  ports: [
    { x: 0, y: 24 },    // Left pin
    { x: 80, y: 24 }    // Right pin
  ],
  asset: resistorImg,
}

// Create instances
const components: PlacedComponent[] = [
  {
    id: "comp-1",
    componentId: "resistor",
    name: "R1",
    x: 100, y: 100,
    rotation: 0,
    mirrored: false,
    ports: [{ x: 0, y: 24 }, { x: 80, y: 24 }]
  },
  {
    id: "comp-2",
    componentId: "capacitor",
    name: "C1",
    x: 300, y: 100,
    rotation: 0,
    mirrored: false,
    ports: [{ x: 0, y: 24 }, { x: 80, y: 24 }]
  }
];

// Connect a wire
const wire: Wire = {
  id: "wire-1",
  from: { compId: "comp-1", portIndex: 1 },  // R1 right pin
  to: { compId: "comp-2", portIndex: 0 }     // C1 left pin
};
```

## Advanced: Custom Orthogonal Routing

For more control, use the control point version:

```typescript
export function generateOrthogonalPathWithControl(
  p1: { x: number; y: number },
  controlY: number,  // Custom middle Y-coordinate
  p2: { x: number; y: number }
): number[] {
  return [
    p1.x, p1.y,
    p1.x, controlY,   // Go to custom height
    p2.x, controlY,   // Go horizontal at that height
    p2.x, p2.y,
  ];
}
```

This allows avoiding component overlaps or following specific routes.

## Troubleshooting

### Wire doesn't snap to pin
- Check SNAP_RADIUS (should be 14px)
- Verify pin is not the origin (excludeCompId/excludePortIndex)
- Ensure pins overlap in the registry

### Wire looks straight instead of orthogonal
- Check WireLayer uses generateOrthogonalPath()
- Verify points array has 8 values (4 points × 2 coordinates)

### Component won't drag during connection
- This is intentional - draggable={!isConnecting}
- It prevents accidental move while wiring

### Colors look wrong
- Check COLORS constant in circuit.ts
- Ensure Tailwind is configured (colors use hex values)
