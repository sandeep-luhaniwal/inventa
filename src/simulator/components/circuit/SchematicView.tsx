"use client"
import { PlacedComponent, Wire } from "@/simulator/types/circuit";
import { useMemo, useState, useCallback } from "react";

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
        <line x1={x - 30} y1={y} x2={x - 10} y2={y} stroke="#059669" strokeWidth={2} />
        <line x1={x - 10} y1={y - 12} x2={x - 10} y2={y + 12} stroke="#059669" strokeWidth={2} />
        <line x1={x + 5} y1={y - 6} x2={x + 5} y2={y + 6} stroke="#059669" strokeWidth={2} />
        <line x1={x + 5} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
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
        <polygon points={`${x - 10},${y - 8} ${x - 10},${y + 8} ${x + 5},${y}`} fill="none" stroke="#059669" strokeWidth={2} />
        <line x1={x + 5} y1={y - 8} x2={x + 5} y2={y + 8} stroke="#059669" strokeWidth={2} />
        <line x1={x + 5} y1={y} x2={x + 30} y2={y} stroke="#059669" strokeWidth={2} />
    </>
);

export default function SchematicView({ components, wires, projectName }: Props) {
    const comps = useMemo(() =>
        components.map(c => ({ ...c, x: snap(c.x), y: snap(c.y) })),
        [components]
    );

    const map = useMemo(() => new Map(comps.map(c => [c.id, c])), [comps]);

    return (
        <div className="p-6 bg-gray-100 justify-center items-center flex overflow-auto">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="bg-white border border-gray-300 shadow-sm">

                {/* BORDER */}
                <rect x="1" y="1" width={W - 2} height={H - 2} fill="none" stroke="red" strokeWidth={2} />
                <rect x="24" y="24" width={W - 48} height={H - 48} fill="none" stroke="red" />

                {/* TOP NUMBERS */}
                {[1, 2, 3, 4, 5, 6].map((n, i) => (
                    <text key={i} x={24 + ((W - 48) / 6) * (i + 0.5)} y={16} fill="red" fontSize={10} textAnchor="middle">{n}</text>
                ))}

                {/* SIDE LETTERS */}
                {["A", "B", "C", "D", "E"].map((l, i) => (
                    <text key={i} x={10} y={24 + ((H - 142) / 5) * i + 4} fill="red" fontSize={10}>{l}</text>
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
                {comps.map(c => (
                    <g key={c.id}>
                        {c.componentId === "battery" && <Battery x={c.x} y={c.y} />}
                        {c.componentId === "resistor" && <Resistor x={c.x} y={c.y} />}
                        {c.componentId === "led" && <LED x={c.x} y={c.y} />}
                        {c.componentId === "diode" && <Diode x={c.x} y={c.y} />}
                        <text x={c.x} y={c.y - 20} fontSize={10} textAnchor="middle" fill="#374151">{c.name}</text>
                        {c.ports.map((_, i) => {
                            const p = getPin(c, i, c.x, c.y);
                            return <circle key={i} cx={p.x} cy={p.y} r={2} fill="#059669" />;
                        })}
                    </g>
                ))}

                {/* TITLE BLOCK */}
                <rect x={W - 360} y={H - 118} width={335} height={94} fill="none" stroke="red" />
                {/* <line x1={W - 360} y1={H - 80} x2={W - 25} y2={H - 80} stroke="red" /> */}
                <text x={W - 340} y={H - 95} fontSize={11} fill="red" fontWeight="bold">Title:</text>
                <text x={W - 340} y={H - 65} fontSize={11} fill="red">{projectName || "Untitled"}</text>
                <text x={W - 340} y={H - 45} fontSize={10} fill="red">Date: {new Date().toLocaleDateString()}</text>
                <text x={W - 100} y={H - 45} fontSize={10} fill="red">Sheet: 1/1</text>

                {/* FOOTER */}
                <text x="30" y={H - 35} fontSize={11} fill="red">Made with Inventa®</text>
            </svg>
        </div>
    );
}
