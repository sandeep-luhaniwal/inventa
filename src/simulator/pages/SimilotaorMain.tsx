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
  const [viewMode, setViewMode] = useState<"canvas" | "schematic" | "bom" | "coulomb">("canvas");
  const [draggedComponent, setDraggedComponent] = useState<ComponentItem | null>(null);
  const [blinkToggle, setBlinkToggle] = useState(true);

  useEffect(() => {
    if (!store.isSimulating) return;
    const timer = setInterval(() => setBlinkToggle((b) => !b), 500);
    return () => clearInterval(timer);
  }, [store.isSimulating]);

  const handleToggleSimulation = async () => {
    const next = !store.isSimulating;
    store.setIsSimulating(next);
    
    if (!next) {
      setBlinkToggle(true);
    }
  };

  const cancelWireRef = useRef(store.setConnectingFrom);
  const deleteRef = useRef(store.deleteSelected);
  const undoRef = useRef(store.undo);
  const redoRef = useRef(store.redo);

  const simResult = useMemo(
    () => simulateCircuit(store.components, store.wires),
    [store.components, store.wires]
  );

  const simulatedComponents = useMemo(
    () =>
      store.components.reduce<Record<string, { lit?: boolean; powered?: boolean; brightness?: number; isBurned?: boolean; isShortCircuit?: boolean; direction?: number }>>((acc, component) => {
        if (!store.isSimulating) {
          acc[component.id] = {
            lit: false,
            powered: false,
            brightness: 0,
            isBurned: false,
            isShortCircuit: false,
            direction: 1
          };
          return acc;
        }

        const state = simResult?.componentStates?.[component.id];
        acc[component.id] = {
          lit: simResult?.litComponents.includes(component.id),
          powered: simResult?.poweredComponents.includes(component.id),
          brightness: state?.brightness ?? 0,
          isBurned: state?.isBurned ?? false,
          isShortCircuit: simResult?.isShortCircuit,
          direction: state?.direction ?? 1
        };
        return acc;
      }, {}),
    [store.components, simResult, store.isSimulating]
  );

  useEffect(() => {
    cancelWireRef.current = store.setConnectingFrom;
    deleteRef.current = store.deleteSelected;
    undoRef.current = store.undo;
    redoRef.current = store.redo;
  }, [store.setConnectingFrom, store.deleteSelected, store.undo, store.redo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "Escape") {
        cancelWireRef.current(null);
      }
      if (!isEditableTarget && (e.key === "Delete" || e.key === "Backspace") && document.activeElement === document.body) {
        deleteRef.current();
      }

      // Undo/Redo shortcuts
      if (!isEditableTarget && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          redoRef.current();
        } else {
          undoRef.current();
        }
        e.preventDefault();
      }
      if (!isEditableTarget && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
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

      const isSphere = draggedComponent.id.startsWith("sphere_");
      const physicsTopic = isSphere ? draggedComponent.physicsTopic || "Methods of Charging" : undefined;
      if (
        physicsTopic === "Coulomb's Law" &&
        store.components.filter((component) =>
          component.componentId.startsWith("sphere_") &&
          component.physicsTopic === "Coulomb's Law"
        ).length >= 3
      ) {
        alert("You can add a maximum of 3 spheres for Coulomb's Law.");
        setDraggedComponent(null);
        return;
      }

      const initialCharge = isSphere ? 0 : undefined;
      const initialUnit = isSphere ? "µC" : undefined;
      const initialRadius = isSphere ? 55 : undefined;
      const initialColor = isSphere ? (draggedComponent.id === "sphere_blue" ? "#3b82f6" : "#ef4444") : undefined;

      const newComp: PlacedComponent = {
        id: `${draggedComponent.id}-${Date.now()}`,
        componentId: draggedComponent.id,
        name: draggedComponent.name,
        imageSrc: draggedComponent.imageSrc,
        litImageSrc: draggedComponent.litImageSrc,
        ledColor: draggedComponent.ledColor,
        x: stagePos.x - width / 2,
        y: stagePos.y - height / 2,
        width,
        height,
        rotation: 0,
        mirrored: false,
        flipped: false,
        ports: relativePinsToPorts(draggedComponent.relativePins, width, height),
        relativePins: draggedComponent.relativePins,
        chargeValue: initialCharge,
        chargeUnit: initialUnit,
        physicsRadius: initialRadius,
        physicsColor: initialColor,
        physicsTopic,
        physicsMetal: isSphere ? "Copper" : undefined,
        physicsMedium: isSphere ? "Vacuum" : undefined,
        physicsDielectric: isSphere ? 1 : undefined,
        physicsSphereType: isSphere ? "Conducting" : undefined,
        physicsObservationDistance: isSphere ? 1 : undefined,
        physicsFluxSurfaceType: isSphere ? "Disc" : undefined,
        physicsFluxArea: isSphere ? 1 : undefined,
        physicsFluxAngle: isSphere ? 0 : undefined,
        physicsFluxSurfaceSize: isSphere ? 100 : undefined,
        physicsChargeMethod: isSphere ? "Methods of Charging" : undefined,
        physicsEarthing: isSphere ? "Not Earthed" : undefined,
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
    ? (simResult?.summary || "Simulation running...")
    : "Click Run Simulation to test the circuit.";

  const shortSummary = simulationSummary;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSimulating={store.isSimulating}
        simulationSummary={shortSummary}
        onToggleSimulation={handleToggleSimulation}
      />
      <Toolbar
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        showGrid={store.showGrid}
        wireColor={store.wireColor}
        wireType={store.wireType}
        isSimulating={store.isSimulating}
        simulationSummary={shortSummary}
        onDelete={store.deleteSelected}
        onToggleGrid={store.toggleGrid}
        onCopy={() => { }}
        onPaste={() => { }}
        onUndo={store.undo}
        onRedo={store.redo}
        onRotate={store.rotateSelected}
        onMirror={store.mirrorSelected}
        onFlip={store.flipSelected}
        onWireTypeChange={store.setWireType}
        onWireColorChange={store.setWireColor}
        onAddNote={store.addNote}
        activeTool={store.activeTool}
        onActiveToolChange={store.setActiveTool}
        pencilColor={store.pencilColor}
        onPencilColorChange={store.setPencilColor}
      />
      <div className="flex-1 relative flex overflow-hidden">
        {viewMode === "canvas" && (
          <>
            <div className="flex-1 relative bg-[#f8fafc] overflow-hidden">
              <div className="absolute inset-0">
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
                  drawings={store.drawings}
                  activeTool={store.activeTool}
                  pencilColor={store.pencilColor}
                  onAddDrawing={store.addDrawing}
                  onDeleteDrawing={store.deleteDrawing}
                  onNoteUpdate={store.updateNote}
                  onNoteDelete={store.deleteNote}
                  simulatedComponents={simulatedComponents}
                  blinkToggle={blinkToggle}
                  poweredWireIds={[]}
                  simulationSummary={simulationSummary}
                  onDrop={handleCanvasDrop}
                  onDragOver={handleCanvasDragOver}
                  onComponentMove={store.moveComponent}
                  onComponentMoveEnd={store.commitComponentMove}
                  onComponentUpdate={store.updateComponent}
                  onPinClick={store.handlePinClick}
                  onComponentSelect={store.selectComponent}
                  onWireSelect={store.setSelectedWire}
                  onWireDelete={store.deleteWire}
                  onWireMidPointsChange={store.updateWireMidPoints}
                  onCanvasWirePointAdd={store.addConnectingMidPoint}
                  onPortsResolved={store.updateComponentPorts}
                />

                {store.isSimulating && simResult && (
                  <LiveStatsPanel simulation={simResult} />
                )}

                {store.selectedComponents.length === 1 && (
                  <PropertyPanel
                    component={store.components.find((c) => c.id === store.selectedComponents[0])!}
                    onUpdate={store.updateComponent}
                    onClose={() => store.selectComponent("", false)}
                  />
                )}
              </div>
            </div>
            <ComponentPalette
              onDragStart={handlePaletteDragStart}
            />
          </>
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
    </div>
  );
};

export default SimilotaorMain;
