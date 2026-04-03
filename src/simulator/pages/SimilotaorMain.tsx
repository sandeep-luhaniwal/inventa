"use client"
import { useState, useCallback, useEffect, useRef } from "react";
import { PlacedComponent, useCircuitStore } from "../hooks/useCircuitStore";
import ComponentPalette, { ComponentItem } from "../components/circuit/ComponentPalette";
import Navbar from "../components/circuit/Navbar";
import Toolbar from "../components/circuit/Toolbar";
import Canvas from "../components/circuit/Canvas";
import SchematicView from "../components/circuit/SchematicView";
import BomView from "../components/circuit/BomView";


const SimilotaorMain = () => {
  const store = useCircuitStore();
  const [viewMode, setViewMode] = useState<"canvas" | "schematic" | "bom">("canvas");
  const [draggedComponent, setDraggedComponent] = useState<ComponentItem | null>(null);

  // Stable refs so the keydown handler never needs to be re-registered
  const cancelWireRef = useRef(store.setConnectingFrom);
  const deleteRef = useRef(store.deleteSelected);
  cancelWireRef.current = store.setConnectingFrom;
  deleteRef.current = store.deleteSelected;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelWireRef.current(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement === document.body) {
        deleteRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // empty deps — intentional, refs stay current

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
      const newComp: PlacedComponent = {
        id: `${draggedComponent.id}-${Date.now()}`,
        componentId: draggedComponent.id,
        name: draggedComponent.name,
        x: stagePos.x - 40,
        y: stagePos.y - 24,
        rotation: 0,
        mirrored: false,
        ports: draggedComponent.ports,
      };
      store.addComponent(newComp);
      setDraggedComponent(null);
    },
    [draggedComponent, store]
  );

//   const handleExportSchematic = useCallback(async () => {
//     try {
//       const { jsPDF } = await import("jspdf");
//       const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
//       const name = "My LED Circuit";
//       doc.setFontSize(14);
//       doc.text(name, 40, 40);
//       doc.setFontSize(10);
//       doc.text(`Date: ${new Date().toLocaleString()}`, 40, 60);
//       doc.text("Components:", 40, 90);

//       store.components.forEach((c, i) => {
//         doc.text(`- ${c.name} (${c.componentId}) @ (${Math.round(c.x)}, ${Math.round(c.y)})`, 40, 110 + i * 12);
//       });

//       doc.text("Connections:", 300, 90);
//       store.wires.forEach((w, i) => {
//         doc.text(`- ${w.from.compId}.pin${w.from.portIndex + 1} -> ${w.to.compId}.pin${w.to.portIndex + 1}`, 300, 110 + i * 12);
//       });

//       doc.save(`${name}-schematic.pdf`);
//     } catch (error) {
//       console.error("Could not export schematic PDF:", error);
//       alert("PDF export requires jsPDF. Please install via npm install jspdf");
//     }
//   }, [store.components, store.wires]);

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
    link.download = `my-led-circuit-bom.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [store.components]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar viewMode={viewMode} onViewModeChange={setViewMode} />
      <Toolbar
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        showGrid={store.showGrid}
        wireColor={store.wireColor}
        wireType={store.wireType}
        onDelete={store.deleteSelected}
        onCopy={() => {}}
        onPaste={() => {}}
        onUndo={store.undo}
        onRedo={store.redo}
        onReset={store.reset}
        onToggleGrid={() => store.setShowGrid((p) => !p)}
        onAlign={() => {}}
        onRotate={store.rotateSelected}
        onMirror={store.mirrorSelected}
        onWireColorChange={store.setWireColor}
        onWireTypeChange={store.setWireType}
      />

      {viewMode === "canvas" && (
        <div className="flex flex-1 overflow-hidden">
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
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onComponentMove={store.moveComponent}
            onPinClick={store.handlePinClick}
            onComponentSelect={store.selectComponent}
            onWireSelect={store.setSelectedWire}
            onWireDelete={store.deleteWire}
            onWireMidPointsChange={store.updateWireMidPoints}
          />
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

export default SimilotaorMain
