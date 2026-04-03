"use client"
import { COLORS } from "@/simulator/constants/circuit";
import { ConnectingFrom, PlacedComponent, Wire } from "@/simulator/types/circuit";
import { getAbsolutePinPosition } from "@/simulator/utils/circuitUtils";
import { useRef, useState, useEffect, useCallback } from "react";


interface WireSVGOverlayProps {
  wires: Wire[];
  components: PlacedComponent[];
  connectingFrom: ConnectingFrom | null;
  selectedWire: string | null;
  isSimulating: boolean;
  wireColor: string;
  wireDash: number[];
  cursor: { x: number; y: number };
  snapTarget: { x: number; y: number } | null;
  stageX: number;
  stageY: number;
  stageScale: number;
  canvasW: number;
  canvasH: number;
  onWireClick: (wireId: string) => void;
  onWireDoubleClick: (wireId: string) => void;
  onMidPointsChange: (wireId: string, pts: { x: number; y: number }[]) => void;
}

function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function Spark({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <g>
      <circle cx={x} cy={y} r="4" fill="none" stroke="#facc15" strokeWidth="2">
        <animate attributeName="r" from="4" to="18" dur="0.5s" fill="freeze" />
        <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze" />
      </circle>
      <circle cx={x} cy={y} r="6" fill="#ffffff" opacity="0.9">
        <animate attributeName="r" from="6" to="0" dur="0.4s" fill="freeze" />
        <animate attributeName="opacity" from="1" to="0" dur="0.4s" fill="freeze" />
      </circle>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={angle}
            x1={x} y1={y}
            x2={x + Math.cos(rad) * 16}
            y2={y + Math.sin(rad) * 16}
            stroke="#facc15" strokeWidth="1.5" strokeLinecap="round">
            <animate attributeName="opacity" from="0.9" to="0" dur="0.5s" fill="freeze" />
          </line>
        );
      })}
      <circle cx={x} cy={y} r="2" fill={COLORS.wireActive}>
        <animate attributeName="r" from="2" to="5" dur="0.3s" fill="freeze" />
        <animate attributeName="opacity" from="1" to="0" begin="0.3s" dur="0.4s" fill="freeze" />
      </circle>
    </g>
  );
}

export default function WireSVGOverlay({
  wires, components, connectingFrom, selectedWire,
  isSimulating, wireColor, wireDash,
  cursor, snapTarget,
  stageX, stageY, stageScale,
  canvasW, canvasH,
  onWireClick, onWireDoubleClick, onMidPointsChange,
}: WireSVGOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ wireId: string; ptIndex: number } | null>(null);
  const [sparks, setSparks] = useState<{ id: string; x: number; y: number }[]>([]);
  const prevWireIds = useRef<Set<string>>(new Set());

  // Spark on new wire connection
  useEffect(() => {
    const currentIds = new Set(wires.map((w) => w.id));
    wires.forEach((w) => {
      if (!prevWireIds.current.has(w.id)) {
        const toComp = components.find((c) => c.id === w.to.compId);
        if (toComp) {
          const pos = getAbsolutePinPosition(toComp, w.to.portIndex);
          setSparks((prev) => [...prev, {
            id: `${w.id}-${Date.now()}`,
            x: pos.x * stageScale + stageX,
            y: pos.y * stageScale + stageY,
          }]);
        }
      }
    });
    prevWireIds.current = currentIds;
  }, [wires, components, stageX, stageY, stageScale]);

  const domToCanvas = useCallback((cx: number, cy: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (cx - rect.left - stageX) / stageScale,
      y: (cy - rect.top - stageY) / stageScale,
    };
  }, [stageX, stageY, stageScale]);

  const onMidMouseDown = useCallback((e: React.MouseEvent, wireId: string, ptIndex: number) => {
    e.stopPropagation();
    draggingRef.current = { wireId, ptIndex };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const { wireId, ptIndex } = draggingRef.current;
      const wire = wires.find((w) => w.id === wireId);
      if (!wire) return;
      const pos = domToCanvas(e.clientX, e.clientY);
      const pts = [...(wire.midPoints ?? [])];
      pts[ptIndex] = pos;
      onMidPointsChange(wireId, pts);
    };
    const onUp = () => { draggingRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [wires, domToCanvas, onMidPointsChange]);

  const onWirePathDblClick = useCallback((e: React.MouseEvent, wire: Wire) => {
    e.stopPropagation();
    const fromComp = components.find((c) => c.id === wire.from.compId);
    const toComp = components.find((c) => c.id === wire.to.compId);
    if (!fromComp || !toComp) return;
    const p1 = getAbsolutePinPosition(fromComp, wire.from.portIndex);
    const p2 = getAbsolutePinPosition(toComp, wire.to.portIndex);
    const pos = domToCanvas(e.clientX, e.clientY);
    const allPts = [p1, ...(wire.midPoints ?? []), p2];
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < allPts.length - 1; i++) {
      const d = Math.hypot(pos.x - (allPts[i].x + allPts[i + 1].x) / 2, pos.y - (allPts[i].y + allPts[i + 1].y) / 2);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const newMids = [...(wire.midPoints ?? [])];
    newMids.splice(bestIdx, 0, pos);
    onMidPointsChange(wire.id, newMids);
  }, [components, domToCanvas, onMidPointsChange]);

  const committedStroke = isSimulating ? COLORS.wireSimulate : wireColor;
  const dashAttr = wireDash.length ? wireDash.join(",") : undefined;
  const transform = `translate(${stageX},${stageY}) scale(${stageScale})`;

  return (
    <svg
      ref={svgRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", zIndex: 10 }}
      width={canvasW}
      height={canvasH}
    >
      <defs>
        <filter id="wire-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={transform}>
        {wires.map((wire) => {
          const fromComp = components.find((c) => c.id === wire.from.compId);
          const toComp = components.find((c) => c.id === wire.to.compId);
          if (!fromComp || !toComp) return null;
          const p1 = getAbsolutePinPosition(fromComp, wire.from.portIndex);
          const p2 = getAbsolutePinPosition(toComp, wire.to.portIndex);
          const pts = [p1, ...(wire.midPoints ?? []), p2];
          const d = buildPath(pts);
          const isSel = wire.id === selectedWire;
          const stroke = isSel ? COLORS.wireSelected : committedStroke;

          return (
            <g key={wire.id} style={{ pointerEvents: "all" }}>
              {/* Hit area */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={16}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onWireClick(wire.id); }}
                onDoubleClick={(e) => onWirePathDblClick(e, wire)}
              />
              {/* Glow when selected */}
              {isSel && (
                <path d={d} fill="none" stroke={stroke} strokeWidth={6}
                  strokeLinecap="round" strokeLinejoin="round"
                  opacity={0.35} filter="url(#wire-glow)" />
              )}
              {/* Wire */}
              <path d={d} fill="none" stroke={stroke}
                strokeWidth={isSel ? 3 : 2.5}
                strokeDasharray={dashAttr}
                strokeLinecap="round" strokeLinejoin="round"
              />
              {/* Endpoint dots */}
              <circle cx={p1.x} cy={p1.y} r={3} fill={stroke} />
              <circle cx={p2.x} cy={p2.y} r={3} fill={stroke} />

              {/* Draggable midpoint handles */}
              {(wire.midPoints ?? []).map((mp, idx) => (
                <g key={idx} style={{ pointerEvents: "all", cursor: "grab" }}
                  onMouseDown={(e) => onMidMouseDown(e, wire.id, idx)}>
                  <circle cx={mp.x} cy={mp.y} r={8} fill="transparent" />
                  <rect x={mp.x - 5} y={mp.y - 5} width={10} height={10}
                    rx={2} fill={stroke} stroke="#fff" strokeWidth={1.5} opacity={0.9} />
                </g>
              ))}

              {/* Segment midpoint hints */}
              {pts.slice(0, -1).map((pt, idx) => {
                const nx = (pt.x + pts[idx + 1].x) / 2;
                const ny = (pt.y + pts[idx + 1].y) / 2;
                return (
                  <circle key={`hint-${idx}`} cx={nx} cy={ny} r={4}
                    fill="#fff" stroke={stroke} strokeWidth={1.5}
                    opacity={0.4} style={{ pointerEvents: "none" }} />
                );
              })}
            </g>
          );
        })}

        {/* Live preview wire */}
        {connectingFrom && (() => {
          const fromComp = components.find((c) => c.id === connectingFrom.compId);
          if (!fromComp) return null;
          const p1 = getAbsolutePinPosition(fromComp, connectingFrom.portIndex);
          const end = snapTarget ?? cursor;
          return (
            <g>
              <path d={buildPath([p1, end])} fill="none" stroke={COLORS.wireActive}
                strokeWidth={2} strokeDasharray="6,4" strokeLinecap="round" opacity={0.8} />
              <circle cx={end.x} cy={end.y} r={4} fill={COLORS.wireActive} opacity={0.9}>
                <animate attributeName="r" values="3;5;3" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })()}

        {/* Snap ring */}
        {snapTarget && (
          <circle cx={snapTarget.x} cy={snapTarget.y} r={10}
            fill="none" stroke={COLORS.snapIndicator} strokeWidth={2}
            strokeDasharray="4,2" opacity={0.9}>
            <animate attributeName="r" values="8;12;8" dur="0.6s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Sparks in screen space */}
      {sparks.map((s) => (
        <Spark key={s.id} x={s.x} y={s.y}
          onDone={() => setSparks((prev) => prev.filter((p) => p.id !== s.id))} />
      ))}
    </svg>
  );
}
