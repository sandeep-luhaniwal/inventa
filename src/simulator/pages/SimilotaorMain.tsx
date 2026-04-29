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
import AiAnalysisPanel from "../components/circuit/AiAnalysisPanel";
import { analyzeCircuit } from "../actions/analyzeCircuit";
import { STATIC_COMPONENTS } from "../constants/staticComponents";

const SimilotaorMain = () => {
  const store = useCircuitStore();
  const [viewMode, setViewMode] = useState<"canvas" | "schematic" | "bom">("canvas");
  const [draggedComponent, setDraggedComponent] = useState<ComponentItem | null>(null);
  const [blinkToggle, setBlinkToggle] = useState(true);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ 
    status: "Correct" | "Wrong"; 
    reason: string;
    visualStates?: Record<string, { 
      lit: boolean; 
      powered: boolean; 
      direction?: number; 
      brightness?: number; 
      isBurned?: boolean; 
    }>;
  } | null>(null);
  const [aiError, setAiError] = useState<string | undefined>();

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
      setAiResult(null);
      setAiError(undefined);
    } else {
      // Start AI Analysis
      setIsAnalyzing(true);
      setAiResult(null);
      setAiError(undefined);
      
      try {
        const result = await analyzeCircuit(store.components, store.wires, STATIC_COMPONENTS);
        setAiResult(result);
      } catch (err: any) {
        setAiError(err.message || "Failed to connect to AI service.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const cancelWireRef = useRef(store.setConnectingFrom);
  const deleteRef = useRef(store.deleteSelected);
  const undoRef = useRef(store.undo);
  const redoRef = useRef(store.redo);

  const simulatedComponents = useMemo(
    () =>
      store.components.reduce<Record<string, { lit?: boolean; powered?: boolean; brightness?: number; isBurned?: boolean; isShortCircuit?: boolean; direction?: number }>>((acc, component) => {
        const aiState = aiResult?.visualStates?.[component.id];

        acc[component.id] = {
          lit: store.isSimulating && !!aiState?.lit,
          powered: store.isSimulating && !!aiState?.powered,
          brightness: store.isSimulating ? aiState?.brightness || 0 : 0,
          isBurned: store.isSimulating ? !!aiState?.isBurned : false,
          isShortCircuit: store.isSimulating && aiResult?.status === "Wrong" && (aiResult.reason.toLowerCase().includes("short") || aiResult.reason.toLowerCase().includes("critical")),
          direction: store.isSimulating ? aiState?.direction || 1 : 1
        };
        return acc;
      }, {}),
    [store.components, store.isSimulating, aiResult]
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
    ? (isAnalyzing ? "AI is analyzing..." : (aiResult?.status || "Simulation running."))
    : "Click Run Simulation to test the circuit.";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isSimulating={store.isSimulating}
        simulationSummary={store.isSimulating ? simulationSummary : "Simulation stopped."}
        onToggleSimulation={handleToggleSimulation}
      />
      <Toolbar
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        showGrid={store.showGrid}
        wireColor={store.wireColor}
        wireType={store.wireType}
        isSimulating={store.isSimulating}
        simulationSummary={simulationSummary}
        onDelete={store.deleteSelected}
        onToggleGrid={store.toggleGrid}
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
              poweredWireIds={[]} // Static wire powering removed for now
              simulationSummary={simulationSummary}
              onDrop={handleCanvasDrop}
              onDragOver={handleCanvasDragOver}
              onComponentMove={store.moveComponent}
              onComponentMoveEnd={store.commitComponentMove}
              onPinClick={store.handlePinClick}
              onComponentSelect={store.selectComponent}
              onWireSelect={store.setSelectedWire}
              onWireDelete={store.deleteWire}
              onWireMidPointsChange={store.updateWireMidPoints}
              onCanvasWirePointAdd={store.addConnectingMidPoint}
              onPortsResolved={store.updateComponentPorts}
            />

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
