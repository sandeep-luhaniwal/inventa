"use client"
import { PlacedComponent, Wire } from "@/simulator/types/circuit";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { getBoundingBox } from "@/simulator/utils/circuitUtils";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
    components: PlacedComponent[];
    wires: Wire[];
    projectName: string;
}

const W = 1000;
const H = 550;
const GRID = 40;

const snap = (v: number) => Math.round(v / GRID) * GRID;

function getPin(comp: PlacedComponent, i: number, x: number, y: number) {
    if (comp.ports.length === 2) {
        return i === 0 ? { x: x - 30, y } : { x: x + 30, y };
    }
    return { x, y };
}

const Battery = ({ x, y }: { x: number; y: number }) => (
    <>
        {/* Horizontal connection lines */}
        <line x1={x - 30} y1={y} x2={x - 12} y2={y} stroke="#059669" strokeWidth={2} />
        <line x1={x + 12} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
        
        {/* Battery plates (alternating long and short) */}
        <line x1={x - 12} y1={y - 15} x2={x - 12} y2={y + 15} stroke="#059669" strokeWidth={2.5} />
        <line x1={x - 6} y1={y - 8} x2={x - 6} y2={y + 8} stroke="#059669" strokeWidth={2.5} />
        <line x1={x} y1={y - 15} x2={x} y2={y + 15} stroke="#059669" strokeWidth={2.5} />
        <line x1={x + 6} y1={y - 8} x2={x + 6} y2={y + 8} stroke="#059669" strokeWidth={2.5} />
        <line x1={x + 12} y1={y - 15} x2={x + 12} y2={y + 15} stroke="#059669" strokeWidth={2.5} />
        
        {/* Polarity markers */}
        <text x={x - 25} y={y - 10} fontSize={12} fill="#059669" fontWeight="bold">+</text>
        <text x={x + 18} y={y - 10} fontSize={12} fill="#059669" fontWeight="bold">-</text>
    </>
);

const Resistor = ({ x, y }: { x: number; y: number }) => (
    <>
        <line x1={x - 30} y1={y} x2={x - 20} y2={y} stroke="#059669" strokeWidth={2} />
        <polyline
            points={`${x - 20},${y} ${x - 10},${y - 6} ${x},${y + 6} ${x + 10},${y - 6} ${x + 20},${y}`}
            fill="none"
            stroke="#059669"
            strokeWidth={2}
        />
        <line x1={x + 20} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
    </>
);

const LED = ({ x, y }: { x: number; y: number }) => (
    <>
        <line x1={x - 30} y1={y} x2={x - 10} y2={y} stroke="#059669" strokeWidth={2} />
        <polygon points={`${x - 10},${y - 8} ${x - 10},${y + 8} ${x + 5},${y}`} fill="none" stroke="#059669" strokeWidth={2} />
        <line x1={x + 5} y1={y - 8} x2={x + 5} y2={y + 8} stroke="#059669" strokeWidth={2} />
        <line x1={x + 2} y1={y - 12} x2={x + 8} y2={y - 16} stroke="#059669" strokeWidth={1.5} />
        <line x1={x + 7} y1={y - 8} x2={x + 13} y2={y - 12} stroke="#059669" strokeWidth={1.5} />
        <line x1={x + 5} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
    </>
);

const Diode = ({ x, y }: { x: number; y: number }) => (
    <>
        <line x1={x - 30} y1={y} x2={x - 10} y2={y} stroke="#059669" strokeWidth={2} />
        <polygon points={`${x - 10},${y - 10} ${x - 10},${y + 10} ${x + 8},${y}`} fill="none" stroke="#059669" strokeWidth={2} />
        <line x1={x + 8} y1={y - 10} x2={x + 8} y2={y + 10} stroke="#059669" strokeWidth={2} />
        <line x1={x + 8} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
    </>
);

const PushButton = ({ x, y }: { x: number; y: number }) => (
    <>
        <line x1={x - 30} y1={y} x2={x - 15} y2={y} stroke="#059669" strokeWidth={2} />
        <line x1={x + 15} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
        <circle cx={x - 15} cy={y} r={3} fill="none" stroke="#059669" strokeWidth={2} />
        <circle cx={x + 15} cy={y} r={3} fill="none" stroke="#059669" strokeWidth={2} />
        <line x1={x - 15} y1={y - 12} x2={x + 15} y2={y - 12} stroke="#059669" strokeWidth={2} />
        <line x1={x} y1={y - 12} x2={x} y2={y - 20} stroke="#059669" strokeWidth={2} />
    </>
);

const SlideSwitch = ({ x, y }: { x: number; y: number }) => (
    <>
        <line x1={x - 30} y1={y} x2={x - 15} y2={y} stroke="#059669" strokeWidth={2} />
        <line x1={x + 15} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
        <circle cx={x - 15} cy={y} r={3} fill="none" stroke="#059669" strokeWidth={2} />
        <circle cx={x + 15} cy={y} r={3} fill="none" stroke="#059669" strokeWidth={2} />
        <circle cx={x} cy={y} r={3} fill="#059669" />
        <line x1={x} y1={y} x2={x - 12} y2={y - 15} stroke="#059669" strokeWidth={2} />
    </>
);

export default function SchematicView({ components, wires, projectName }: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [zoom, setZoom] = useState(0.85);
    const [offset, setOffset] = useState({ x: 50, y: 40 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

    const comps = useMemo(() => {
        if (components.length === 0) return [];

        // 1. Calculate Comprehensive Bounding Box (Components + Wires)
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        // Track components
        components.forEach(c => {
            minX = Math.min(minX, c.x - 30);
            minY = Math.min(minY, c.y - 30);
            maxX = Math.max(maxX, c.x + 30);
            maxY = Math.max(maxY, c.y + 30);
        });

        // Track wires (including intermediate orthogonal points)
        wires.forEach(w => {
            const c1 = components.find(c => c.id === w.from.compId);
            const c2 = components.find(c => c.id === w.to.compId);
            if (!c1 || !c2) return;
            
            const p1 = getPin(c1, w.from.portIndex, c1.x, c1.y);
            const p2 = getPin(c2, w.to.portIndex, c2.x, c2.y);
            const midX = (p1.x + p2.x) / 2;

            [p1, { x: midX, y: p1.y }, { x: midX, y: p2.y }, p2].forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });

        const contentW = maxX - minX;
        const contentH = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // 2. Calculate Fit Scale
        // Inner sheet is roughly 950x500. We want a 'Safe Zone' of 850x350 to leave room for margins/titleblock.
        const safeW = 850;
        const safeH = 350;
        
        const scaleX = safeW / contentW;
        const scaleY = safeH / contentH;
        // fitScale is the scaling factor to shrink the circuit into the Safe Zone.
        // We never scale UP (max 1.0) to maintain standard symbol sizes if possible.
        const fitScale = Math.min(scaleX, scaleY, 1.0);

        // 3. Map Coordinates (Centered + Scaled)
        return components.map(c => ({
            ...c,
            x: snap((c.x - centerX) * fitScale + W / 2),
            y: snap((c.y - centerY) * fitScale + (H - 50) / 2)
        }));
    }, [components, wires]);

    const map = useMemo(() => new Map(comps.map(c => [c.id, c])), [comps]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY;
        const scaleChange = delta > 0 ? 0.9 : 1.1;
        const newZoom = Math.min(Math.max(zoom * scaleChange, 0.3), 3);
        
        // Zoom relative to mouse position
        if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newOffsetX = mouseX - (mouseX - offset.x) * (newZoom / zoom);
            const newOffsetY = mouseY - (mouseY - offset.y) * (newZoom / zoom);

            setZoom(newZoom);
            setOffset({ x: newOffsetX, y: newOffsetY });
        }
    }, [zoom, offset]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) { // Left click
            setIsDragging(true);
            setLastPos({ x: e.clientX, y: e.clientY });
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - lastPos.x;
            const dy = e.clientY - lastPos.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastPos({ x: e.clientX, y: e.clientY });
        }
    }, [isDragging, lastPos]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Sheet coordinate markers (Matching reference image: 1-6 and A-E)
    const cols = 6;
    const rows = 5;
    const horzMarkers = Array.from({ length: cols }, (_, i) => i + 1);
    const vertMarkers = ["A", "B", "C", "D", "E"];

    const resetZoom = () => {
        setZoom(0.85);
        setOffset({ x: 50, y: 40 });
    };

    const centerCircuit = useCallback(() => {
        if (comps.length === 0) return;

        // Since components are normalized to the center of (W, H),
        // centering just means fitting the 1000x550 sheet in view.
        // We calculate a zoom that fits the whole sheet comfortably.
        const margin = 100;
        const newZoom = Math.min((W - margin) / W, (H - margin) / H, 0.9);
        
        setZoom(newZoom);
        setOffset({ x: (W - W * newZoom) / 2, y: (H - H * newZoom) / 2 });
    }, [comps]);

    // Auto-center on load
    useEffect(() => {
        if (comps.length > 0) {
            // Slight delay to ensure parent containers have final sizes
            const t = setTimeout(centerCircuit, 50);
            return () => clearTimeout(t);
        }
    }, [comps.length, centerCircuit]);

    return (
        <div className="p-6 bg-[#f0f2f5] justify-center items-center flex overflow-hidden relative w-full h-full min-h-[600px]">
            {/* ZOOM CONTROLS */}
            <div className="absolute top-10 right-10 flex flex-col gap-2 z-10 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-gray-200 shadow-lg">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Zoom In" onClick={() => setZoom(prev => Math.min(prev * 1.1, 3))}>
                    <ZoomIn className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Zoom Out" onClick={() => setZoom(prev => Math.max(prev * 0.9, 0.3))}>
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <div className="h-px bg-gray-200 mx-2" />
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Center View" onClick={centerCircuit}>
                    <Maximize className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Reset View" onClick={resetZoom}>
                    <div className="text-[10px] font-black">1:1</div>
                </Button>
            </div>

            <svg 
                ref={svgRef}
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${W} ${H}`}
                className={`bg-white border border-gray-200 shadow-xl rounded-sm font-sans ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
                    {/* OUTER BORDER */}
                    <rect x="5" y="5" width={W - 10} height={H - 10} fill="none" stroke="#fca5a5" strokeWidth={0.5} />
                    
                    {/* INNER BORDER */}
                    <rect x="25" y="25" width={W - 50} height={H - 50} fill="none" stroke="#fca5a5" strokeWidth={1} />

                    {/* COORDINATE MARKERS */}
                    {horzMarkers.map((n, i) => (
                        <g key={`h-${i}`}>
                            <text x={25 + ((W - 50) / cols) * (i + 0.5)} y={18} fill="#fca5a5" fontSize={9} textAnchor="middle" fontWeight="600">{n}</text>
                            <text x={25 + ((W - 50) / cols) * (i + 0.5)} y={H - 9} fill="#fca5a5" fontSize={9} textAnchor="middle" fontWeight="600">{n}</text>
                            {i > 0 && (
                                <line 
                                    x1={25 + ((W - 50) / cols) * i} y1={5} 
                                    x2={25 + ((W - 50) / cols) * i} y2={25} 
                                    stroke="#fca5a5" strokeWidth={0.5} 
                                />
                            )}
                            {i > 0 && (
                                <line 
                                    x1={25 + ((W - 50) / cols) * i} y1={H - 25} 
                                    x2={25 + ((W - 50) / cols) * i} y2={H - 5} 
                                    stroke="#fca5a5" strokeWidth={0.5} 
                                />
                            )}
                        </g>
                    ))}

                    {vertMarkers.map((l, i) => (
                        <g key={`v-${i}`}>
                            <text x={15} y={25 + ((H - 50) / rows) * (i + 0.5) + 3} fill="#fca5a5" fontSize={9} textAnchor="middle" fontWeight="600">{l}</text>
                            <text x={W - 15} y={25 + ((H - 50) / rows) * (i + 0.5) + 3} fill="#fca5a5" fontSize={9} textAnchor="middle" fontWeight="600">{l}</text>
                            {i > 0 && (
                                <line 
                                    x1={5} y1={25 + ((H - 50) / rows) * i} 
                                    x2={25} y2={25 + ((H - 50) / rows) * i} 
                                    stroke="#fca5a5" strokeWidth={0.5} 
                                />
                            )}
                            {i > 0 && (
                                <line 
                                    x1={W - 25} y1={25 + ((H - 50) / rows) * i} 
                                    x2={W - 5} y2={25 + ((H - 50) / rows) * i} 
                                    stroke="#fca5a5" strokeWidth={0.5} 
                                />
                            )}
                        </g>
                    ))}

                    {/* WIRES */}
                    {wires.map(w => {
                        const c1 = map.get(w.from.compId);
                        const c2 = map.get(w.to.compId);
                        if (!c1 || !c2) return null;
                        const p1 = getPin(c1, w.from.portIndex, c1.x, c1.y);
                        const p2 = getPin(c2, w.to.portIndex, c2.x, c2.y);
                        const midX = (p1.x + p2.x) / 2;
                        return (
                            <path
                                key={w.id}
                                d={`M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`}
                                stroke="#059669"
                                strokeWidth={1.5}
                                fill="none"
                            />
                        );
                    })}

                    {/* COMPONENTS */}
                    {comps.map(c => {
                        const compId = c.componentId.toLowerCase();
                        return (
                            <g key={c.id}>
                                {(compId.includes("battery") || compId.includes("power")) && <Battery x={c.x} y={c.y} />}
                                {compId.includes("resistor") && <Resistor x={c.x} y={c.y} />}
                                {compId.includes("led") && <LED x={c.x} y={c.y} />}
                                {compId.includes("diode") && <Diode x={c.x} y={c.y} />}
                                {compId.includes("pushbutton") && <PushButton x={c.x} y={c.y} />}
                                {compId.includes("slideswitch") && <SlideSwitch x={c.x} y={c.y} />}
                                
                                <text x={c.x} y={c.y - 30} fontSize={10} textAnchor="middle" fill="#374151" fontWeight="500">{c.name}</text>
                                {c.ports.map((_, i) => {
                                    const p = getPin(c, i, c.x, c.y);
                                    return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#059669" />;
                                })}
                            </g>
                        )
                    })}

                    {/* TITLE BLOCK (Matching Tinkercad style) */}
                    <g transform={`translate(${W - 350}, ${H - 100})`}>
                        <rect x="0" y="0" width="325" height="75" fill="none" stroke="#fca5a5" strokeWidth={1} />
                        <line x1="0" y1="25" x2="325" y2="25" stroke="#fca5a5" strokeWidth={1} />
                        <line x1="0" y1="50" x2="325" y2="50" stroke="#fca5a5" strokeWidth={1} />
                        <line x1="200" y1="50" x2="200" y2="75" stroke="#fca5a5" strokeWidth={1} />
                        
                        <text x="8" y="16" fontSize={9} fill="#fca5a5" fontWeight="500">Title:</text>
                        <text x="40" y="17" fontSize={11} fill="#ef4444" fontWeight="600">{projectName || "Untitled Project"}</text>
                        
                        <text x="8" y="41" fontSize={9} fill="#fca5a5" fontWeight="500">Date:</text>
                        <text x="40" y="42" fontSize={11} fill="#ef4444" fontWeight="600">{new Date().toLocaleString()}</text>
                        
                        <text x="208" y="66" fontSize={9} fill="#fca5a5" fontWeight="500">Sheet:</text>
                        <text x="245" y="67" fontSize={11} fill="#ef4444" fontWeight="600">1/1</text>
                        
                        <text x="8" y="66" fontSize={9} fill="#fca5a5" fontWeight="500">Project:</text>
                        <text x="48" y="67" fontSize={10} fill="#ef4444" fontWeight="600">Inventa Lab</text>
                    </g>

                    {/* FOOTER BRANDING (Tinkercad style) */}
                    <text x="35" y={H - 34} fontSize={11} fill="#fca5a5" fontWeight="500" className="italic opacity-80">Made with Inventa®</text>
                </g>
            </svg>

            {/* INTERACTION HINT */}
            <div className="absolute bottom-10 left-10 text-[10px] text-gray-400 font-medium bg-white/50 px-2 py-1 rounded border border-gray-100 italic">
                Scroll to Zoom | Drag to Pan
            </div>
        </div>
    );
}


