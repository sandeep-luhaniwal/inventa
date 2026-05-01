"use client"
import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Line, Circle } from "react-konva";
import Konva from "konva";
import WireSVGOverlay from "./canvas/WireLayer";
import ComponentNode from "./canvas/ComponentNode";
import BreadboardNode from "./canvas/BreadboardNode";
import { ConnectingFrom, Note, PlacedComponent, Wire, Drawing } from "@/simulator/types/circuit";
import NoteNode from "./canvas/NoteNode";
import { getWireDash, snapToPin } from "@/simulator/utils/circuitUtils";
import { SimulatedComponentState } from "@/simulator/utils/simulation";
import { getLedDataUrls, STATIC_COMPONENTS, svgToDataUrl } from "@/simulator/constants/staticComponents";
import { ZoomIn, ZoomOut, Maximize, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import MicrobitSimulatorPanel from "./MicrobitSimulatorPanel";

const PENCIL_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE3IDNsNCA0TDcgMjFIM3YtNEwxNyAzeiIvPjwvc3ZnPg==") 0 24, auto`;
const ERASER_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOS4zIDEyTDE1IDYuM0wyMC43IDEyTDE1IDE3LjdMOS4zIDEyeiIgZmlsbD0iI0ZGNjlCNCIvPjxwYXRoIGQ9Ik0zIDIxSDExTDcuMTUgMTcuMTUiIGZpbGw9IiNDMEMwQzAiLz48cGF0aCBkPSJNMTEgMjFMMjEgMTEiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=") 0 24, auto`;

const ZOOM_SCALE = 1.08;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 4;

export interface CanvasProps {
  placedComponents: PlacedComponent[];
  wires: Wire[];
  connectingFrom: ConnectingFrom | null;
  selectedComponents: string[];
  selectedWire: string | null;
  isSimulating: boolean;
  showGrid: boolean;
  wireColor: string;
  wireType: string;
  notes: Note[];
  onNoteUpdate: (id: string, updates: Partial<Note>) => void;
  onNoteDelete: (id: string) => void;
  simulatedComponents?: Record<string, SimulatedComponentState>;
  blinkToggle: boolean;
  poweredWireIds?: string[];
  simulationSummary?: string;
  onDrop: (e: React.DragEvent, stagePos: { x: number; y: number }) => void;
  onDragOver: (e: React.DragEvent) => void;
  onComponentMove: (id: string, x: number, y: number) => void;
  onComponentMoveEnd: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onComponentSelect: (compId: string, multi: boolean) => void;
  onWireSelect: (wireId: string) => void;
  onWireDelete: (wireId: string) => void;
  onWireMidPointsChange: (wireId: string, pts: { x: number; y: number }[]) => void;
  onCanvasWirePointAdd: (point: { x: number; y: number }) => void;
  onPortsResolved?: (compId: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => void;
  drawings: Drawing[];
  activeTool: "select" | "pencil" | "eraser";
  pencilColor: string;
  onAddDrawing: (drawing: Drawing) => void;
  onDeleteDrawing: (id: string) => void;
}

const Canvas = ({
  placedComponents,
  wires,
  connectingFrom,
  selectedComponents,
  selectedWire,
  isSimulating,
  showGrid,
  wireColor,
  wireType,
  notes,
  onNoteUpdate,
  onNoteDelete,
  simulatedComponents,
  blinkToggle,
  poweredWireIds,
  simulationSummary,
  onDrop,
  onDragOver,
  onComponentMove,
  onComponentMoveEnd,
  onPinClick,
  onComponentSelect,
  onWireSelect,
  onWireDelete,
  onWireMidPointsChange,
  onCanvasWirePointAdd,
  onPortsResolved,
  drawings,
  activeTool,
  pencilColor,
  onAddDrawing,
  onDeleteDrawing,
}: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [snapTarget, setSnapTarget] = useState<{ x: number; y: number } | null>(null);
  const [stageTransform, setStageTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[] | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback(() => {
    const pos = stageRef.current?.getRelativePointerPosition();
    if (!pos) return;
    setCursor(pos);
    if (connectingFrom) {
      const snap = snapToPin(pos.x, pos.y, placedComponents, connectingFrom.compId, connectingFrom.portIndex);
      setSnapTarget(snap ? { x: snap.x, y: snap.y } : null);
    } else {
      setSnapTarget(null);
    }
  }, [connectingFrom, placedComponents]);

  const handleStageClick = useCallback(() => {
    if (activeTool === "pencil" || activeTool === "eraser") return;
    if (!connectingFrom) {
      onComponentSelect("", false);
      return;
    }

    const pos = stageRef.current?.getRelativePointerPosition();
    if (!pos) return;

    const nextPoint = snapTarget ?? pos;
    onCanvasWirePointAdd(nextPoint);
  }, [activeTool, connectingFrom, onCanvasWirePointAdd, onComponentSelect, snapTarget]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === "pencil") {
      setIsDrawing(true);
      const pos = stageRef.current?.getRelativePointerPosition();
      if (pos) {
        setCurrentLine([pos.x, pos.y]);
      }
    } else if (activeTool === "eraser") {
      setIsErasing(true);
      // Immediate erase on click
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        const shape = stageRef.current?.getIntersection(pos);
        if (shape && shape.attrs.id?.startsWith("drawing-")) {
          onDeleteDrawing(shape.attrs.id);
        }
      }
    }
  }, [activeTool, onDeleteDrawing]);

  const handleMouseMoveDrawing = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    handleMouseMove();
    if (activeTool === "pencil" && isDrawing) {
      const pos = stageRef.current?.getRelativePointerPosition();
      if (pos && currentLine) {
        setCurrentLine([...currentLine, pos.x, pos.y]);
      }
    } else if (activeTool === "eraser" && isErasing) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        const shape = stageRef.current?.getIntersection(pos);
        if (shape && shape.attrs.id?.startsWith("drawing-")) {
          onDeleteDrawing(shape.attrs.id);
        }
      }
    }
  }, [activeTool, isDrawing, isErasing, currentLine, handleMouseMove, onDeleteDrawing]);

  const handleMouseUp = useCallback(() => {
    if (activeTool === "pencil" && isDrawing && currentLine) {
      if (currentLine.length >= 4) {
        onAddDrawing({
          id: `drawing-${Date.now()}`,
          points: currentLine,
          color: pencilColor,
          width: 3,
        });
      }
    }
    setIsDrawing(false);
    setIsErasing(false);
    setCurrentLine(null);
  }, [activeTool, currentLine, isDrawing, onAddDrawing, pencilColor]);

  const centerCircuit = useCallback((padding = 80) => {
    if (!stageRef.current || placedComponents.length === 0) return;
    
    const stage = stageRef.current;
    
    // Get bounding box of all components
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    placedComponents.forEach(comp => {
      minX = Math.min(minX, comp.x);
      minY = Math.min(minY, comp.y);
      // Assume a default size of 100x100 for components if not specific
      maxX = Math.max(maxX, comp.x + 120);
      maxY = Math.max(maxY, comp.y + 120);
    });
    
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    // Calculate scale to fit
    const scaleX = (size.w - padding * 2) / contentW;
    const scaleY = (size.h - padding * 2) / contentH;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.5);
    
    // Calculate new position to center
    const newX = (size.w / 2) - (minX + contentW / 2) * newScale;
    const newY = (size.h / 2) - (minY + contentH / 2) * newScale;
    
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: newX, y: newY });
    setStageTransform({ x: newX, y: newY, scale: newScale });
  }, [placedComponents, size]);

  // Auto-center on load
  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (!hasAutoCentered.current && placedComponents.length > 0 && size.w > 0) {
      requestAnimationFrame(() => centerCircuit());
      hasAutoCentered.current = true;
    }
  }, [placedComponents.length, size.w, centerCircuit]);

  const syncTransform = useCallback(() => {
    const s = stageRef.current;
    if (!s) return;
    setStageTransform({ x: s.x(), y: s.y(), scale: s.scaleX() });
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const origin = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = Math.min(
      Math.max(e.evt.deltaY < 0 ? oldScale * ZOOM_SCALE : oldScale / ZOOM_SCALE, ZOOM_MIN),
      ZOOM_MAX
    );
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - origin.x * newScale, y: pointer.y - origin.y * newScale });
    setStageTransform({ x: stage.x(), y: stage.y(), scale: newScale });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.container().getBoundingClientRect();
    const stagePos = {
      x: (e.clientX - box.left - stage.x()) / stage.scaleX(),
      y: (e.clientY - box.top - stage.y()) / stage.scaleY(),
    };
    onDrop(e, stagePos);
  }, [onDrop]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-canvas"
      onDrop={handleDrop}
      onDragOver={onDragOver}
      style={{ 
        cursor: connectingFrom 
          ? "crosshair" 
          : activeTool === "pencil" 
            ? PENCIL_CURSOR 
            : activeTool === "eraser"
              ? ERASER_CURSOR
              : "default" 
      }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        draggable={!connectingFrom && activeTool !== "pencil"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveDrawing}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onDragEnd={syncTransform}
      >
        <Layer>
          {showGrid && (() => {
            const lines = [];
            const grid = 25;
            const width = 5000;
            const height = 5000;
            for (let i = 0; i < width / grid; i++) {
              lines.push(<Rect key={`v-${i}`} x={i * grid} y={0} width={1} height={height} fill="#e5e7eb" opacity={0.5} listening={false} />);
            }
            for (let i = 0; i < height / grid; i++) {
              lines.push(<Rect key={`h-${i}`} x={0} y={i * grid} width={width} height={1} fill="#e5e7eb" opacity={0.5} listening={false} />);
            }
            return lines;
          })()}
        </Layer>
        <Layer>
          {drawings.map((drawing) => (
            <Line
              key={drawing.id}
              id={drawing.id}
              points={drawing.points}
              stroke={drawing.color}
              strokeWidth={drawing.width}
              hitStrokeWidth={drawing.width + 10} // Larger hit area for easier erasing
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              onClick={() => {
                if (activeTool === "eraser") {
                  onDeleteDrawing(drawing.id);
                }
              }}
              onMouseEnter={(e) => {
                if (activeTool === "eraser") {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = activeTool === "eraser" ? ERASER_CURSOR : (activeTool === "pencil" ? PENCIL_CURSOR : "default");
              }}
            />
          ))}
          {isDrawing && currentLine && (
            <Line
              points={currentLine}
              stroke={pencilColor}
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {activeTool === "eraser" && cursor && (
            <Circle
              x={cursor.x}
              y={cursor.y}
              radius={10 / stageTransform.scale}
              stroke="#ef4444"
              strokeWidth={1 / stageTransform.scale}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Layer>
        <Layer>
          {notes.map((note) => (
            <NoteNode
              key={note.id}
              note={note}
              onUpdate={onNoteUpdate}
              onDelete={onNoteDelete}
            />
          ))}
        </Layer>
        <Layer>
          {placedComponents.map((comp) =>
            comp.componentId === "breadboard" ? (
              <BreadboardNode
                key={comp.id}
                comp={comp}
                isSelected={selectedComponents.includes(comp.id)}
                connectingFrom={connectingFrom}
                onDragMove={onComponentMove}
                onDragEnd={onComponentMoveEnd}
                onPinClick={onPinClick}
                onSelect={onComponentSelect}
                allComponents={placedComponents}
              />
            ) : (() => {
                const isSelected = selectedComponents.includes(comp.id);
                const staticDef = STATIC_COMPONENTS.find((d) => d.id === comp.componentId);
                const resolvedBaseImageSrc = staticDef
                  ? svgToDataUrl(staticDef, false, isSelected)
                  : comp.imageSrc;
                // For LEDs, resolve the live image URLs from the current ledColor
                const isLed = comp.componentId.startsWith('led_');
                const resolvedColor = isLed ? (comp.ledColor ?? comp.componentId.replace('led_', '')) : null;
                const ledUrls = isLed && resolvedColor ? getLedDataUrls(resolvedColor, isSelected) : null;
                return (
                  <ComponentNode
                    key={comp.id}
                    comp={comp}
                    imageSrc={ledUrls ? ledUrls.imageSrc : resolvedBaseImageSrc}
                    litImageSrc={ledUrls ? ledUrls.litImageSrc : comp.litImageSrc}
                    connectingFrom={connectingFrom}
                    simulationState={simulatedComponents?.[comp.id]}
                    blinkToggle={blinkToggle}
                    onDragMove={onComponentMove}
                    onDragEnd={onComponentMoveEnd}
                    onPinClick={onPinClick}
                    onSelect={onComponentSelect}
                    onSizeResolved={onPortsResolved}
                    allComponents={placedComponents}
                  />
                );
              })()
          )}
        </Layer>
      </Stage>

      <WireSVGOverlay
        wires={wires}
        components={placedComponents}
        connectingFrom={connectingFrom}
        selectedWire={selectedWire}
        isSimulating={isSimulating}
        poweredWireIds={poweredWireIds}
        wireColor={wireColor}
        wireDash={getWireDash(wireType)}
        cursor={cursor}
        snapTarget={snapTarget}
        stageX={stageTransform.x}
        stageY={stageTransform.y}
        stageScale={stageTransform.scale}
        canvasW={size.w}
        canvasH={size.h}
        onWireClick={onWireSelect}
        onWireDoubleClick={onWireDelete}
        onMidPointsChange={onWireMidPointsChange}
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded-full border border-border pointer-events-none select-none">
        Scroll to zoom | Drag to pan | Double-click wire to add bend point
      </div>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full pointer-events-none select-none">
          Click anywhere to add a bend | Click another pin to finish | Esc to cancel
        </div>
      )}

      {isSimulating && simulationSummary && (
        <div className="absolute top-4 right-4 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full pointer-events-none select-none">
          {simulationSummary}
        </div>
      )}

      {/* ZOOM CONTROLS */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-lg border border-gray-200 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Zoom In"
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            const newScale = Math.min(stage.scaleX() * 1.2, ZOOM_MAX);
            stage.scale({ x: newScale, y: newScale });
            syncTransform();
          }}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Zoom Out"
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            const newScale = Math.max(stage.scaleX() / 1.2, ZOOM_MIN);
            stage.scale({ x: newScale, y: newScale });
            syncTransform();
          }}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-px bg-gray-200 mx-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Center View"
          onClick={() => centerCircuit()}
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Reset View"
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: 0, y: 0 });
            syncTransform();
          }}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {isSimulating && placedComponents.some(c => c.componentId === 'microbit') && (
        <MicrobitSimulatorPanel />
      )}
    </div>
  );
};

export default Canvas;
