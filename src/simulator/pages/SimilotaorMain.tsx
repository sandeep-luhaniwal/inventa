"use client"
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { PlacedComponent, useCircuitStore } from "../hooks/useCircuitStore";
import ComponentPalette, { ComponentItem } from "../components/circuit/ComponentPalette";
import Navbar from "../components/circuit/Navbar";
import Toolbar from "../components/circuit/Toolbar";
import Canvas from "../components/circuit/Canvas";
import SchematicView from "../components/circuit/SchematicView";
import BomView from "../components/circuit/BomView";
import PropertyPanel from "../components/circuit/PropertyPanel";
import { relativePinsToPorts } from "../utils/circuitUtils";
import { simulateCircuit } from "../utils/simulation";
import LiveStatsPanel from "../components/circuit/LiveStatsPanel";

const SimilotaorMain = () => {
  const store = useCircuitStore();
  const [viewMode, setViewMode] = useState<"canvas" | "schematic" | "bom">("canvas");
  const [draggedComponent, setDraggedComponent] = useState<ComponentItem | null>(null);
  const [blinkToggle, setBlinkToggle] = useState(true);

  useEffect(() => {
    if (!store.isSimulating) return;
    const timer = setInterval(() => setBlinkToggle((b) => !b), 500);
    return () => clearInterval(timer);
  }, [store.isSimulating]);

  const handleToggleSimulation = () => {
    store.setIsSimulating((prev) => {
      const next = !prev;
      if (!next) {
        setBlinkToggle(true);
      }
      return next;
    });
  };

  const cancelWireRef = useRef(store.setConnectingFrom);
  const deleteRef = useRef(store.deleteSelected);
  const undoRef = useRef(store.undo);
  const redoRef = useRef(store.redo);

  const simulation = useMemo(
    () => simulateCircuit(store.components, store.wires),
    [store.components, store.wires]
  );

  const simulatedComponents = useMemo(
    () =>
      store.components.reduce<Record<string, { lit?: boolean; powered?: boolean; brightness?: number; isBurned?: boolean; isShortCircuit?: boolean }>>((acc, component) => {
        const simState = simulation.componentStates?.[component.id];
        acc[component.id] = {
          lit: store.isSimulating && simulation.litComponents.includes(component.id),
          powered: store.isSimulating && simulation.poweredComponents.includes(component.id),
          brightness: store.isSimulating ? simState?.brightness : 0,
          isBurned: store.isSimulating ? simState?.isBurned : false,
          isShortCircuit: store.isSimulating && simulation.isShortCircuit
        };
        return acc;
      }, {}),
    [simulation, store.components, store.isSimulating]
  );

  useEffect(() => {
    cancelWireRef.current = store.setConnectingFrom;
    deleteRef.current = store.deleteSelected;
    undoRef.current = store.undo;
    redoRef.current = store.redo;
  }, [store.setConnectingFrom, store.deleteSelected, store.undo, store.redo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelWireRef.current(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement === document.body) {
        deleteRef.current();
      }

      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          redoRef.current();
        } else {
          undoRef.current();
        }
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        redoRef.current();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // Static dependency array to avoid "changed size" issues

  const handlePaletteDragStart = useCallback((component: ComponentItem, e: React.DragEvent) => {
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent, stagePos: { x: number; y: number }) => {
      e.preventDefault();
      if (!draggedComponent) return;

      const { viewBoxW: width, viewBoxH: height } = draggedComponent;

      const newComp: PlacedComponent = {
        id: `${draggedComponent.id}-${Date.now()}`,
        componentId: draggedComponent.id,
        name: draggedComponent.name,
        imageSrc: draggedComponent.imageSrc,
        litImageSrc: draggedComponent.litImageSrc,
        ledColor: draggedComponent.ledColor,
        x: stagePos.x - width / 2,
        y: stagePos.y - height / 2,
        rotation: 0,
        mirrored: false,
        flipped: false,
        ports: relativePinsToPorts(draggedComponent.relativePins, width, height),
        relativePins: draggedComponent.relativePins,
      };
      store.addComponent(newComp);
      setDraggedComponent(null);
    },
    [draggedComponent, store]
  );

  const handleExportBom = useCallback(() => {
    if (!store.components.length) {
      alert("No components available to export.");
      return;
    }

    const rows = ["Name,Quantity,Component"];
    const aggregated = new Map<string, { name: string; qty: number }>();
    store.components.forEach((c) => {
      const bucket = aggregated.get(c.componentId);
      if (bucket) {
        bucket.qty += 1;
      } else {
        aggregated.set(c.componentId, { name: c.name, qty: 1 });
      }
    });

    aggregated.forEach((value, key) => {
      rows.push(`${key},${value.qty},${value.name}`);
    });

    const blob = new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-led-circuit-bom.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [store.components]);

  const simulationSummary = store.isSimulating
    ? simulation.summary
    : "Click Run Simulation to test the circuit.";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSimulating={store.isSimulating}
        simulationSummary={store.isSimulating ? simulation.summary : "Simulation stopped."}
        onToggleSimulation={handleToggleSimulation}
      />
      <Toolbar
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        wireColor={store.wireColor}
        wireType={store.wireType}
        isSimulating={store.isSimulating}
        simulationSummary={simulationSummary}
        onDelete={store.deleteSelected}
        onToggleGrid={store.toggleGrid}
        selectedComponent={store.components.find((c) => store.selectedComponents.includes(c.id))}
        onUpdateComponent={store.updateComponent}
        onCopy={() => {}}
        onPaste={() => {}}
        onUndo={store.undo}
        onRedo={store.redo}
        onRotate={store.rotateSelected}
        onMirror={store.mirrorSelected}
        onFlip={store.flipSelected}
        onWireColorChange={store.setWireColor}
        onWireTypeChange={store.setWireType}
        onAddNote={store.addNote}
      />

      {viewMode === "canvas" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas with floating PropertyPanel overlay */}
          <div className="relative flex-1 overflow-hidden">
            <Canvas
              placedComponents={store.components}
              wires={store.wires}
              connectingFrom={store.connectingFrom}
              selectedComponents={store.selectedComponents}
              selectedWire={store.selectedWire}
              isSimulating={store.isSimulating}
              showGrid={store.showGrid}
              wireColor={store.wireColor}
              wireType={store.wireType}
              notes={store.notes}
              onNoteUpdate={store.updateNote}
              onNoteDelete={store.deleteNote}
              simulatedComponents={simulatedComponents}
              blinkToggle={blinkToggle}
              poweredWireIds={store.isSimulating ? simulation.poweredWires : []}
              simulationSummary={simulation.summary}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
              onComponentMove={store.moveComponent}
              onPinClick={store.handlePinClick}
              onComponentSelect={store.selectComponent}
              onWireSelect={store.setSelectedWire}
              onWireDelete={store.deleteWire}
              onWireMidPointsChange={store.updateWireMidPoints}
              onCanvasWirePointAdd={store.addConnectingMidPoint}
              onPortsResolved={store.updateComponentPorts}
            />

            {/* Live stats panel overlay */}
            {store.isSimulating && (
              <LiveStatsPanel simulation={simulation} />
            )}

            {/* Property Panel — floats over the canvas when a component is selected */}
            {store.selectedComponents.length === 1 && (
              <PropertyPanel
                component={store.components.find((c) => c.id === store.selectedComponents[0])!}
                onUpdate={store.updateComponent}
                onClose={() => store.selectComponent("", false)}
              />
            )}
          </div>

          <ComponentPalette onDragStart={handlePaletteDragStart} />
        </div>
      )}

      {viewMode === "schematic" && (
        <SchematicView
          components={store.components}
          wires={store.wires}
          projectName="My LED Circuit"
        />
      )}

      {viewMode === "bom" && (
        <BomView components={store.components} onExportCsv={handleExportBom} />
      )}
    </div>
  );
};

export default SimilotaorMain;
