"use client"
import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";
import GridLayer from "./canvas/GridLayer";
import WireSVGOverlay from "./canvas/WireLayer";
import ComponentNode from "./canvas/ComponentNode";
import { ConnectingFrom, PlacedComponent, Wire } from "@/simulator/types/circuit";
import { getWireDash, snapToPin } from "@/simulator/utils/circuitUtils";
import { getComponentMap } from "@/simulator/constants/components";

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
  onDrop: (e: React.DragEvent, stagePos: { x: number; y: number }) => void;
  onDragOver: (e: React.DragEvent) => void;
  onComponentMove: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onComponentSelect: (compId: string, multi: boolean) => void;
  onWireSelect: (wireId: string) => void;
  onWireDelete: (wireId: string) => void;
  onWireMidPointsChange: (wireId: string, pts: { x: number; y: number }[]) => void;
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
  onDrop,
  onDragOver,
  onComponentMove,
  onPinClick,
  onComponentSelect,
  onWireSelect,
  onWireDelete,
  onWireMidPointsChange,
}: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [snapTarget, setSnapTarget] = useState<{ x: number; y: number } | null>(null);
  const [stageTransform, setStageTransform] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = stageRef.current?.getRelativePointerPosition();
      if (!pos) return;
      setCursor(pos);
      if (connectingFrom) {
        const snap = snapToPin(pos.x, pos.y, placedComponents, connectingFrom.compId, connectingFrom.portIndex);
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
    const snap = snapToPin(pos.x, pos.y, placedComponents, connectingFrom.compId, connectingFrom.portIndex);
    if (snap) onPinClick(snap.compId, snap.portIndex);
  }, [connectingFrom, placedComponents, onPinClick]);

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
    const pointer = stage.getPointerPosition()!;
    const origin = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = Math.min(Math.max(
      e.evt.deltaY < 0 ? oldScale * ZOOM_SCALE : oldScale / ZOOM_SCALE,
      ZOOM_MIN
    ), ZOOM_MAX);
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - origin.x * newScale, y: pointer.y - origin.y * newScale });
    setStageTransform({ x: stage.x(), y: stage.y(), scale: newScale });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const box = stage.container().getBoundingClientRect();
      const stagePos = {
        x: (e.clientX - box.left - stage.x()) / stage.scaleX(),
        y: (e.clientY - box.top - stage.y()) / stage.scaleY(),
      };
      onDrop(e, stagePos);
    },
    [onDrop]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-canvas"
      onDrop={handleDrop}
      onDragOver={onDragOver}
      style={{ cursor: connectingFrom ? "crosshair" : "default" }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        draggable={!connectingFrom}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => onComponentSelect("", false)}
        onWheel={handleWheel}
        onDragEnd={syncTransform}
      >
        {showGrid && <GridLayer width={size.w} height={size.h} />}

        <Layer>
          {placedComponents.map((comp) => (
            <ComponentNode
              key={comp.id}
              comp={comp}
              icon={getComponentMap()[comp.componentId]?.icon}
              isSelected={selectedComponents.includes(comp.id)}
              connectingFrom={connectingFrom}
              onDragEnd={onComponentMove}
              onPinClick={onPinClick}
              onSelect={onComponentSelect}
            />
          ))}
        </Layer>
      </Stage>

      {/* SVG wire overlay — rendered outside Konva Stage as a plain DOM element */}
      <WireSVGOverlay
        wires={wires}
        components={placedComponents}
        connectingFrom={connectingFrom}
        selectedWire={selectedWire}
        isSimulating={isSimulating}
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
        Scroll to zoom · Drag to pan · Double-click wire to add bend point
      </div>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full pointer-events-none select-none">
          Click a pin to connect · Esc to cancel
        </div>
      )}
    </div>
  );
};

export default Canvas;
