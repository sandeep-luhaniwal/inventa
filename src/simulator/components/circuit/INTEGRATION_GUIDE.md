# Wire System Integration Guide

## Quick Integration Checklist

- [x] **Types** (`src/types/circuit.ts`) - Already has all required types
- [x] **Constants** (`src/constants/circuit.ts`) - Colors and sizing defined
- [x] **Utilities** (`src/utils/circuitUtils.ts`) - Pin helpers and snap logic implemented
- [x] **Wire Routing** (`src/utils/wireRouting.ts`) - Advanced routing utilities
- [x] **Component Node** (`src/components/circuit/canvas/ComponentNode.tsx`) - Pin rendering and interaction
- [x] **Wire Layer** (`src/components/circuit/canvas/WireLayer.tsx`) - Wire rendering updated to orthogonal
- [x] **Canvas** (`src/components/circuit/Canvas.tsx`) - Main coordinator (ensure handlers are wired)

---

## Step-by-Step Integration

### 1. Verify Types are Complete

Your `src/types/circuit.ts` already has:
```typescript
export interface Pin { x: number; y: number; }
export interface PlacedComponent { id, componentId, name, x, y, rotation, mirrored, ports[] }
export interface WireEndpoint { compId, portIndex }
export interface Wire { id, from, to }
export interface ConnectingFrom { compId, portIndex }
```

**No changes needed.**

### 2. Verify Constants are Set

Your `src/constants/circuit.ts` includes:
```typescript
export const SNAP_RADIUS = 14;
export const PIN_RADIUS = 6;
export const COLORS = { ... };
```

**No changes needed.**

### 3. Verify Utilities are Implemented

Your `src/utils/circuitUtils.ts` now includes:
- `getAbsPin()` - Get absolute pin position
- `snapToPin()` - Find nearest pin for snapping
- `generateOrthogonalPath()` - Create VHV wire routing
- `generateOrthogonalPathWithControl()` - Custom control point routing

**✓ Completed in this update**

### 4. Verify ComponentNode Renders Pins

Your `src/components/circuit/canvas/ComponentNode.tsx` renders:
- ✓ Component image
- ✓ Interactive pins (circles)
- ✓ Pin hover feedback
- ✓ Active state when wire starts
- ✓ Available state when connecting
- ✓ Pin labels on hover
- ✓ Prevents dragging during connection

**✓ Updated with better feedback**

### 5. Verify WireLayer Renders Orthogonal Wires

Your `src/components/circuit/canvas/WireLayer.tsx` renders:
- ✓ Committed wires with orthogonal routing
- ✓ Temporary wire (preview) with orthogonal routing
- ✓ Snap indicator
- ✓ Wire selection highlighting
- ✓ Wire interaction handlers

**✓ Updated to use generateOrthogonalPath()**

### 6. Verify Canvas Coordinates Event Handling

Your Canvas component should have these handlers **already working**:

```typescript
const handleMouseMove = useCallback(
  (_e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = stageRef.current?.getRelativePointerPosition();
    if (!pos) return;
    
    setCursor(pos);
    
    if (connectingFrom) {
      // Find nearest pin for snapping
      const snap = snapToPin(
        pos.x, pos.y,
        placedComponents,
        connectingFrom.compId,
        connectingFrom.portIndex
      );
      setSnapTarget(snap ? { x: snap.x, y: snap.y } : null);
    } else {
      setSnapTarget(null);
    }
  },
  [connectingFrom, placedComponents]
);

const handleMouseUp = useCallback(() => {
  if (!connectingFrom) return;
  const pos = stageRef.current?.getRelativePointerPosition();
  if (!pos) return;
  
  // Try to snap to a pin
  const snap = snapToPin(
    pos.x, pos.y,
    placedComponents,
    connectingFrom.compId,
    connectingFrom.portIndex
  );
  
  // If snapped to valid pin, complete connection
  if (snap) onPinClick(snap.compId, snap.portIndex);
}, [connectingFrom, placedComponents, onPinClick]);
```

**✓ Already in place**

---

## Ensure Parent Component Handles Events

Your parent component (likely in App.tsx or a circuit manager) needs:

```typescript
const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>([]);
const [wires, setWires] = useState<Wire[]>([]);
const [connectingFrom, setConnectingFrom] = useState<ConnectingFrom | null>(null);

// Handler for pin clicks
const handlePinClick = useCallback((compId: string, portIndex: number) => {
  // If no wire is being drawn, start one
  if (!connectingFrom) {
    setConnectingFrom({ compId, portIndex });
    return;
  }

  // If same pin as origin, cancel
  if (connectingFrom.compId === compId && connectingFrom.portIndex === portIndex) {
    setConnectingFrom(null);
    return;
  }

  // If same component, can't connect
  if (connectingFrom.compId === compId) {
    setConnectingFrom(null);
    return;
  }

  // Create new wire
  const newWire: Wire = {
    id: `wire-${Date.now()}-${Math.random()}`,
    from: { compId: connectingFrom.compId, portIndex: connectingFrom.portIndex },
    to: { compId, portIndex }
  };

  // Check for duplicate
  const isDuplicate = wires.some(
    (w) =>
      (w.from.compId === newWire.from.compId &&
        w.from.portIndex === newWire.from.portIndex &&
        w.to.compId === newWire.to.compId &&
        w.to.portIndex === newWire.to.portIndex) ||
      (w.from.compId === newWire.to.compId &&
        w.from.portIndex === newWire.to.portIndex &&
        w.to.compId === newWire.from.compId &&
        w.to.portIndex === newWire.from.portIndex)
  );

  if (!isDuplicate) {
    setWires([...wires, newWire]);
  }

  setConnectingFrom(null);
}, [connectingFrom, wires]);

// Handler for component movement
const handleComponentMove = useCallback((id: string, x: number, y: number) => {
  setPlacedComponents((components) =>
    components.map((c) => (c.id === id ? { ...c, x, y } : c))
  );
  // Wires automatically update because getAbsPin recalculates!
}, []);

// Handler for wire deletion
const handleWireDelete = useCallback((wireId: string) => {
  setWires((wires) => wires.filter((w) => w.id !== wireId));
}, []);
```

---

## Verification: Test the System

### Test 1: Place Two Components
```
✓ Two components appear on canvas
✓ Each has visible pins (white circles)
```

### Test 2: Connect Pins
```
✓ Click first pin → it highlights green ✓
✓ Move mouse → dashed preview wire follows cursor
✓ Move near second pin → snap indicator appears (green circle) ✓
✓ Click second pin → wire created ✓
```

### Test 3: Orthogonal Routing
```
✓ Wire path follows VHV pattern
✓ 90-degree bends, no diagonal lines
✓ Smooth "lineJoin: round" at corners
```

### Test 4: Snap Tolerance
```
✓ Snap indicator appears within ~14px of pin ✓
✓ Can't snap back to origin pin ✓
✓ Snap only to other components ✓
```

### Test 5: Component Dragging
```
✓ Can drag components during idle state
✓ Cannot drag while drawing wire (cursor blocked) ✓
✓ Connected wires follow component movement ✓
```

### Test 6: Wire Operations
```
✓ Click wire → highlights orange ✓
✓ Double-click wire → deletes it ✓
```

---

## File Structure Summary

```
src/
├── types/
│   └── circuit.ts                 ✓ Wire, Component, Pin types
├── constants/
│   ├── circuit.ts                 ✓ Colors, SNAP_RADIUS, PIN_RADIUS
│   └── components.ts              ✓ Component definitions with pins
├── utils/
│   ├── circuitUtils.ts            ✓ getAbsPin, snapToPin, generateOrthogonalPath
│   ├── wireRouting.ts             ✓ Advanced routing algorithms
│   └── wireExamples.ts            ✓ Complete examples & documentation
├── components/circuit/
│   ├── Canvas.tsx                 ✓ Main coordinator
│   ├── WIRE_SYSTEM.md             ✓ System documentation
│   └── canvas/
│       ├── ComponentNode.tsx       ✓ Pin rendering & interaction
│       ├── WireLayer.tsx           ✓ Orthogonal wire rendering
│       └── GridLayer.tsx           (existing)
└── hooks/
    └── useCircuitStore.ts          (connect to this for state)
```

---

## Code Examples

### Adding Components Programmatically

```typescript
const addComponent = (componentId: string, x: number, y: number) => {
  const definition = getComponentMap()[componentId];
  if (!definition) return;

  const newComponent: PlacedComponent = {
    id: `comp-${Date.now()}-${Math.random()}`,
    componentId,
    name: definition.name,
    x,
    y,
    rotation: 0,
    mirrored: false,
    ports: definition.ports
  };

  setPlacedComponents([...placedComponents, newComponent]);
};
```

### Retrieving Wires for a Component

```typescript
const getComponentWires = (compId: string): Wire[] => {
  return wires.filter(
    (w) => w.from.compId === compId || w.to.compId === compId
  );
};
```

### Clearing the Circuit

```typescript
const clearCircuit = () => {
  setPlacedComponents([]);
  setWires([]);
  setConnectingFrom(null);
};
```

### Exporting Circuit as JSON

```typescript
const exportCircuit = () => {
  const circuitData = {
    components: placedComponents,
    wires,
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(circuitData, null, 2);
};
```

---

## Troubleshooting

### Issue: Wires not snapping to pins
**Solution:** 
- Check SNAP_RADIUS is 14
- Verify pin positions are absolute (use getAbsPin)
- Check snapToPin is called with correct excludeCompId

### Issue: Wire appears straight instead of orthogonal
**Solution:**
- WireLayer must use generateOrthogonalPath()
- Check that points array has 8 values (4 points)
- Verify line has lineJoin="round"

### Issue: Can't click on wires
**Solution:**
- hitStrokeWidth should be >= 12
- Make sure onClick handler is set
- Check event.cancelBubble = true to prevent propagation

### Issue: Component won't drag while wire is being drawn
**Solution:**
- This is intentional! (draggable={!isConnecting})
- To allow dragging, set draggable={true}
- May cause accidental moves during wiring

### Issue: Performance slow with many wires
**Solution:**
- Check if wires are recalculating paths on every render
- Use useMemo if needed:
  ```typescript
  const wirePaths = useMemo(
    () => generateOrthogonalPath(p1, p2),
    [p1.x, p1.y, p2.x, p2.y]
  );
  ```
- Consider virtualization for large circuits (100+ wires)

---

## Next Steps (Optional Enhancements)

### 1. Wire Routing Optimization
See `wireRouting.ts` for:
- `generateSmartOrthogonalPath()` - Routes around obstacles
- `countWireIntersections()` - Detect overlapping wires
- `getWireStats()` - Analyze circuit metrics

### 2. Undo/Redo Support
Track history:
```typescript
const [history, setHistory] = useState<HistoryEntry[]>([]);

const pushHistory = () => {
  setHistory([...history, { components: placedComponents, wires }]);
};
```

### 3. Circuit Simulation
```typescript
const simulateCircuit = () => {
  // Traverse from power source
  // Calculate voltages/currents
  // Highlight active paths
};
```

### 4. Export to SPICE
Convert circuit to netlist format for real circuit simulation.

### 5. Schematic Templates
Save/load circuit layouts as templates.

---

## Performance Notes

- **Orthogonal routing:** O(1) - simple midpoint calculation
- **Snapping:** O(n) - searches all pins, usually < 100
- **Wire rendering:** O(m) - renders each wire, Konva optimizes hit detection
- **Component dragging:** O(m) - updates all connected wires, React batches updates

For circuits with:
- **< 50 components, < 200 wires:** No optimization needed
- **50-500 components, 200-2000 wires:** Monitor with React DevTools
- **> 500 components, > 2000 wires:** Consider virtualization or WebGL

