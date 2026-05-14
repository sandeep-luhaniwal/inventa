"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import CalculationPopup from "@/physics/components/coulombs-law/CalculationPopup";

// ─── Types ──────────────────────────────────────────────────────────
type ChargeUnit = "C" | "µC" | "nC" | "mC";
type DistanceUnit = "m" | "cm" | "mm";
type Polarity = "positive" | "negative";

const COULOMB_K = 8.987e9;
const UNIT_MUL: Record<ChargeUnit, number> = { C: 1, mC: 1e-3, "µC": 1e-6, nC: 1e-9 };
const DIST_MUL: Record<DistanceUnit, number> = { m: 1, cm: 1e-2, mm: 1e-3 };

function calcForce(q1: number, u1: ChargeUnit, q2: number, u2: ChargeUnit, r: number, ru: DistanceUnit) {
  const a = q1 * UNIT_MUL[u1], b = q2 * UNIT_MUL[u2], d = r * DIST_MUL[ru];
  if (d === 0) return Infinity;
  if (a === 0 || b === 0) return 0;
  return COULOMB_K * Math.abs(a * b) / (d * d);
}

function fmtForce(f: number): string {
  if (!isFinite(f)) return "∞";
  if (f === 0) return "0 N";
  if (f >= 1e6) return `${(f / 1e6).toFixed(2)} × 10⁶ N`;
  if (f >= 1e3) return `${(f / 1e3).toFixed(2)} × 10³ N`;
  if (f >= 1) return `${f.toFixed(4)} N`;
  if (f >= 1e-3) return `${(f * 1e3).toFixed(4)} mN`;
  if (f >= 1e-6) return `${(f * 1e6).toFixed(4)} µN`;
  return `${f.toExponential(3)} N`;
}

function getIonCount(q: number) { return Math.min(12, Math.max(0, Math.round(Math.abs(q) * 2.5))); }
function getGlow(q: number) { return Math.min(1, Math.abs(q) > 0 ? 0.25 + Math.log10(Math.abs(q) + 1) * 0.35 : 0); }

function fieldPath(x1: number, y1: number, x2: number, y2: number, i: number, n: number, attract: boolean) {
  const mx = (x1 + x2) / 2, spread = ((i - (n - 1) / 2) / Math.max(n - 1, 1)) * 80;
  if (attract) {
    // Attraction: lines curve gently between the two charges (inward)
    const cpY = y1 + spread * 0.6;
    return `M ${x1} ${y1} Q ${mx} ${cpY} ${x2} ${y2}`;
  }
  // Repulsion: lines bow outward away from each other
  const b1 = x1 + (x2 - x1) * 0.2, b2 = x1 + (x2 - x1) * 0.8, oy = y1 + spread * 2;
  return `M ${x1} ${y1} C ${b1} ${oy} ${b2} ${oy} ${x2} ${y2}`;
}

// ─── Main Component ─────────────────────────────────────────────────
export default function CoulombLab() {
  const [q1, setQ1] = useState(5);
  const [q1Unit, setQ1Unit] = useState<ChargeUnit>("µC");
  const [pol1, setPol1] = useState<Polarity>("positive");
  const [q2, setQ2] = useState(3);
  const [q2Unit, setQ2Unit] = useState<ChargeUnit>("µC");
  const [pol2, setPol2] = useState<Polarity>("negative");
  const [dist, setDist] = useState(0.5);
  const [distUnit, setDistUnit] = useState<DistanceUnit>("m");
  const [dragging, setDragging] = useState<"A" | "B" | null>(null);
  
  // Draggable Card State
  const [cardPos, setCardPos] = useState({ x: 24, y: 24 }); // Relative to bottom-left
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 900, h: 550 });

  useEffect(() => {
    const update = () => {
      const el = svgRef.current?.parentElement;
      if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const force = useMemo(() => calcForce(q1, q1Unit, q2, q2Unit, dist, distUnit), [q1, q1Unit, q2, q2Unit, dist, distUnit]);
  const forceStr = useMemo(() => fmtForce(force), [force]);
  const eq1 = pol1 === "negative" ? -q1 : q1;
  const eq2 = pol2 === "negative" ? -q2 : q2;
  const forceType: "attraction" | "repulsion" | "none" = q1 === 0 || q2 === 0 ? "none" : eq1 * eq2 < 0 ? "attraction" : "repulsion";

  const cy = dims.h * 0.42;
  const maxDist = distUnit === "m" ? 5 : distUnit === "cm" ? 500 : 5000;
  const spacing = Math.max(160, (dist / maxDist) * (dims.w - 280));
  const ax = dims.w / 2 - spacing / 2, bx = dims.w / 2 + spacing / 2;
  const R = 55;

  const ionCountA = getIonCount(q1), ionCountB = getIonCount(q2);
  const glowA = getGlow(q1), glowB = getGlow(q2);
  const lineCount = Math.min(7, Math.max(0, isFinite(force) && force > 0 ? Math.round(Math.log10(force + 1) * 1.5 + 2) : 0));
  const vibAmp = isFinite(force) ? Math.min(5, Math.log10(force + 1) * 1.2) : 0;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingCard) {
      setCardPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
      return;
    }
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const other = dragging === "A" ? bx : ax;
    const newPx = Math.abs(mx - other);
    setDist(Math.max(0.01, parseFloat(((newPx / (dims.w - 280)) * maxDist).toFixed(3))));
  }, [dragging, ax, bx, dims.w, maxDist, isDraggingCard]);

  const handleCardMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCard(true);
    dragOffset.current = {
      x: e.clientX - cardPos.x,
      y: e.clientY - cardPos.y
    };
  };

  const handleMouseUpGlobal = () => {
    setDragging(null);
    setIsDraggingCard(false);
  };

  const reset = () => { 
    setQ1(5); setQ1Unit("µC"); setPol1("positive"); setQ2(3); setQ2Unit("µC"); setPol2("negative"); setDist(0.5); setDistUnit("m"); 
    setCardPos({ x: 24, y: dims.h - 220 });
  };

  // Set initial card position on first load
  useEffect(() => {
    if (dims.h > 0) {
      setCardPos({ x: 24, y: dims.h - 240 });
    }
  }, [dims.h]);

  // Ion positions (golden angle)
  const makeIons = (cx: number, cy: number, count: number) => {
    const pts: { x: number; y: number }[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const r = (R - 16) * Math.sqrt((i + 0.5) / count);
      pts.push({ x: cx + r * Math.cos(i * ga), y: cy + r * Math.sin(i * ga) });
    }
    return pts;
  };

  const ionsA = useMemo(() => makeIons(ax, cy, ionCountA), [ax, cy, ionCountA]);
  const ionsB = useMemo(() => makeIons(bx, cy, ionCountB), [bx, cy, ionCountB]);

  const normForce = Math.min(1, isFinite(force) && force > 0 ? Math.log10(force * 1000 + 1) / 10 : 0);

  // Sphere renderer
  const renderSphere = (id: string, cx: number, pol: Polarity, q: number, unit: ChargeUnit, glow: number, ions: { x: number; y: number }[], bodyId: "A" | "B") => {
    const pos = pol === "positive";
    const col = pos ? "#ef4444" : "#3b82f6";
    const sign = pos ? "+" : "−";
    return (
      <g key={id} onMouseDown={() => setDragging(bodyId)} style={{ cursor: "ew-resize" }}
        className={vibAmp > 0.3 ? "coulomb-vib" : ""}>
        <defs>
          <radialGradient id={`sg-${id}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor={pos ? "#fca5a5" : "#93c5fd"} stopOpacity={0.9} />
            <stop offset="50%" stopColor={col} stopOpacity={0.7} />
            <stop offset="100%" stopColor={pos ? "#7f1d1d" : "#1e3a5f"} stopOpacity={0.95} />
          </radialGradient>
          <filter id={`gl-${id}`}><feGaussianBlur stdDeviation={3 + glow * 5} result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={cx} cy={cy} r={R + 18} fill="none" stroke={`${col}${Math.round(glow * 60).toString(16).padStart(2, "0")}`} strokeWidth={2} className="coulomb-glow-ring" />
        <circle cx={cx} cy={cy} r={R} fill={`url(#sg-${id})`} stroke={col} strokeWidth={2} filter={`url(#gl-${id})`} />
        <ellipse cx={cx - 10} cy={cy - 14} rx={18} ry={11} fill="white" opacity={0.1} />
        {ions.map((p, i) => <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={13} fontWeight={700} opacity={0.75} className="coulomb-ion">{sign}</text>)}
        <text x={cx} y={cy + R + 22} textAnchor="middle" fill="#e2e8f0" fontSize={15} fontWeight={700}>{bodyId}</text>
        <text x={cx} y={cy + R + 38} textAnchor="middle" fill={col} fontSize={12} fontFamily="monospace">{sign}{q} {unit}</text>
      </g>
    );
  };

  return (
    <div 
      className="flex h-full w-full bg-[#020617] select-none" 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUpGlobal} 
      onMouseLeave={handleMouseUpGlobal}
    >
      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${dims.w} ${dims.h}`}
          onMouseDown={(e) => { if (e.target === svgRef.current) setDragging(null); }}
          className="block">
          <defs>
            <pattern id="cg" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="cbg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cbg)" />
          <rect width="100%" height="100%" fill="url(#cg)" opacity={0.4} />
          <line x1={100} y1={cy} x2={dims.w - 100} y2={cy} stroke="#1e293b" strokeWidth={1} strokeDasharray="4 8" opacity={0.5} />

          {/* Force arrows */}
          {forceType !== "none" && force > 0 && <>
            {(() => {
              const len = 15 + normForce * 60;
              // Attraction: arrows point INWARD (toward each other)
              // Repulsion: arrows point OUTWARD (away from each other)
              const col = forceType === "attraction" ? "#22d3ee" : "#f87171";
              if (forceType === "attraction") {
                // Left sphere arrow → points RIGHT (toward B)
                const aStartX = ax + R + 6;
                const aEndX = aStartX + len;
                // Right sphere arrow → points LEFT (toward A)
                const bStartX = bx - R - 6;
                const bEndX = bStartX - len;
                return <>
                  <line x1={aStartX} y1={cy} x2={aEndX} y2={cy} stroke={col} strokeWidth={3} strokeLinecap="round" />
                  <polygon points={`${aEndX + 8},${cy} ${aEndX},${cy - 5} ${aEndX},${cy + 5}`} fill={col} />
                  <line x1={bStartX} y1={cy} x2={bEndX} y2={cy} stroke={col} strokeWidth={3} strokeLinecap="round" />
                  <polygon points={`${bEndX - 8},${cy} ${bEndX},${cy - 5} ${bEndX},${cy + 5}`} fill={col} />
                </>;
              } else {
                // Repulsion: Left sphere arrow → points LEFT (away from B)
                const aStartX = ax - R - 6;
                const aEndX = aStartX - len;
                // Right sphere arrow → points RIGHT (away from A)
                const bStartX = bx + R + 6;
                const bEndX = bStartX + len;
                return <>
                  <line x1={aStartX} y1={cy} x2={aEndX} y2={cy} stroke={col} strokeWidth={3} strokeLinecap="round" />
                  <polygon points={`${aEndX - 8},${cy} ${aEndX},${cy - 5} ${aEndX},${cy + 5}`} fill={col} />
                  <line x1={bStartX} y1={cy} x2={bEndX} y2={cy} stroke={col} strokeWidth={3} strokeLinecap="round" />
                  <polygon points={`${bEndX + 8},${cy} ${bEndX},${cy - 5} ${bEndX},${cy + 5}`} fill={col} />
                </>;
              }
            })()}
          </>}

          {/* Spheres */}
          {renderSphere("A", ax, pol1, q1, q1Unit, glowA, ionsA, "A")}
          {renderSphere("B", bx, pol2, q2, q2Unit, glowB, ionsB, "B")}

          {/* Distance scale */}
          <line x1={ax} y1={cy + R + 55} x2={bx} y2={cy + R + 55} stroke="#475569" strokeWidth={2} />
          <line x1={ax} y1={cy + R + 48} x2={ax} y2={cy + R + 62} stroke="#64748b" strokeWidth={1.5} />
          <line x1={bx} y1={cy + R + 48} x2={bx} y2={cy + R + 62} stroke="#64748b" strokeWidth={1.5} />
          <rect x={(ax + bx) / 2 - 44} y={cy + R + 66} width={88} height={22} rx={5} fill="#0f172a" stroke="#334155" strokeWidth={1} />
          <text x={(ax + bx) / 2} y={cy + R + 81} textAnchor="middle" fill="#94a3b8" fontSize={12} fontFamily="monospace">r = {dist} {distUnit}</text>

          <text x={dims.w / 2} y={28} textAnchor="middle" fill="#475569" fontSize={13}>Drag spheres to change distance • Use panel to set charges</text>
          {dragging && <text x={dims.w / 2} y={dims.h - 16} textAnchor="middle" fill="#64748b" fontSize={12}>Dragging Charge {dragging}...</text>}
        </svg>

        {/* Floating Draggable Calculation Card */}
        <CalculationPopup
          force={force}
          forceFormatted={forceStr}
          forceType={forceType}
          q1={q1}
          q1Unit={q1Unit}
          pol1={pol1}
          q2={q2}
          q2Unit={q2Unit}
          pol2={pol2}
          initialPos={cardPos}
        />
      </div>

      {/* Right panel */}
      <div className="w-[320px] min-w-[320px] border-l border-[#1e293b] bg-gradient-to-b from-[#0f172a] to-[#0a0e1a] overflow-y-auto coulomb-panel-scroll">
        <div className="p-4 flex flex-col gap-5 h-full">
          <div className="text-center pb-3 border-b border-[#1e293b]">
            <h2 className="text-lg font-bold text-[#f1f5f9]">⚡ Coulomb&apos;s Law</h2>
            <p className="text-xs text-[#64748b] mt-1">कूलम्ब का नियम</p>
          </div>

          {/* Charge A */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#818cf8] mb-2">Charge A (q₁)</h3>
            <div className="bg-[#1e293b44] border border-[#1e293b] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#ef4444] font-bold px-2 py-0.5 rounded border border-[#ef444444] bg-[#ef444411]">q₁</span>
                <div className="flex gap-1">
                  <button onClick={() => setPol1("positive")} className={`w-7 h-6 rounded text-sm font-bold border ${pol1 === "positive" ? "bg-[#ef444422] text-[#ef4444] border-[#ef4444]" : "text-[#64748b] border-[#334155]"}`}>+</button>
                  <button onClick={() => setPol1("negative")} className={`w-7 h-6 rounded text-sm font-bold border ${pol1 === "negative" ? "bg-[#3b82f622] text-[#3b82f6] border-[#3b82f6]" : "text-[#64748b] border-[#334155]"}`}>−</button>
                </div>
              </div>
              <div className="flex gap-1.5">
                <input type="number" value={q1} min={0} step={0.1} onChange={e => setQ1(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-[#e2e8f0] text-sm font-mono outline-none focus:border-[#818cf8]" />
                <select value={q1Unit} onChange={e => setQ1Unit(e.target.value as ChargeUnit)}
                  className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-1.5 py-1.5 text-[#94a3b8] text-xs outline-none">
                  {(["C", "mC", "µC", "nC"] as ChargeUnit[]).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Charge B */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#818cf8] mb-2">Charge B (q₂)</h3>
            <div className="bg-[#1e293b44] border border-[#1e293b] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#3b82f6] font-bold px-2 py-0.5 rounded border border-[#3b82f644] bg-[#3b82f611]">q₂</span>
                <div className="flex gap-1">
                  <button onClick={() => setPol2("positive")} className={`w-7 h-6 rounded text-sm font-bold border ${pol2 === "positive" ? "bg-[#ef444422] text-[#ef4444] border-[#ef4444]" : "text-[#64748b] border-[#334155]"}`}>+</button>
                  <button onClick={() => setPol2("negative")} className={`w-7 h-6 rounded text-sm font-bold border ${pol2 === "negative" ? "bg-[#3b82f622] text-[#3b82f6] border-[#3b82f6]" : "text-[#64748b] border-[#334155]"}`}>−</button>
                </div>
              </div>
              <div className="flex gap-1.5">
                <input type="number" value={q2} min={0} step={0.1} onChange={e => setQ2(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-[#e2e8f0] text-sm font-mono outline-none focus:border-[#818cf8]" />
                <select value={q2Unit} onChange={e => setQ2Unit(e.target.value as ChargeUnit)}
                  className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-1.5 py-1.5 text-[#94a3b8] text-xs outline-none">
                  {(["C", "mC", "µC", "nC"] as ChargeUnit[]).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#818cf8] mb-2">Distance (r)</h3>
            <div className="flex gap-1.5 mb-2">
              <input type="number" value={dist} min={0.001} step={0.01} onChange={e => setDist(Math.max(0.001, parseFloat(e.target.value) || 0.001))}
                className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-[#e2e8f0] text-sm font-mono outline-none focus:border-[#818cf8]" />
              <select value={distUnit} onChange={e => setDistUnit(e.target.value as DistanceUnit)}
                className="w-16 bg-[#0f172a] border border-[#334155] rounded-lg px-1.5 py-1.5 text-[#94a3b8] text-xs outline-none">
                {(["m", "cm", "mm"] as DistanceUnit[]).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <input type="range" min={0.01} max={maxDist} step={distUnit === "m" ? 0.01 : 1} value={dist} onChange={e => setDist(parseFloat(e.target.value))}
              className="w-full accent-[#818cf8] h-1 cursor-pointer" />
          </div>

          <button onClick={reset} className="w-full py-2 bg-[#6366f118] border border-[#6366f14d] rounded-lg text-[#818cf8] text-sm font-semibold hover:bg-[#6366f133] transition-colors mt-auto">
            Reset Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
