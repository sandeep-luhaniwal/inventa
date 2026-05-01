"use client";

import React from "react";

export function GlassDefs() {
  return (
    <defs>
      {/* Ultra-Realistic Glass Gradients */}
      <radialGradient id="glassBody" cx="50%" cy="40%" r="80%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.03" />
        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
      </radialGradient>

      <linearGradient id="glassRim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
      </linearGradient>

      <linearGradient id="internalReflection" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="10%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="90%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
      </linearGradient>

      {/* Advanced Refraction & Depth Filter */}
      <filter id="ultraGlass" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="0.8" result="blur" />
        <feSpecularLighting in="blur" surfaceScale="7" specularConstant="1.5" specularExponent="50" lightingColor="#ffffff" result="spec">
          <fePointLight x="-100" y="-100" z="300" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceGraphic" operator="in" result="specOut" />
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0" result="specAlpha" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="specAlpha" />
        </feMerge>
      </filter>

      <filter id="softRim" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="0.5" />
      </filter>
    </defs>
  );
}


export function BurnerAsset({ lit = false, isOpen = false }: { lit?: boolean; isOpen?: boolean }) {
  return (
    <svg viewBox="0 0 140 140" className="h-44 w-44 drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]">
      <GlassDefs />
      
      {/* Flame - Dynamic and centered */}
      {lit && isOpen && (
        <g transform="translate(70, 32)">
          <path d="M0 0 q-6 -10 0 -28 q6 18 0 28Z" fill="#3b82f6" opacity="0.9" filter="url(#softRim)">
            <animate attributeName="d" values="M0 0 q-6 -10 0 -28 q6 18 0 28Z; M0 0 q-8 -12 0 -32 q8 -20 0 -32Z; M0 0 q-6 -10 0 -28 q6 18 0 28Z" dur="0.15s" repeatCount="indefinite" />
          </path>
          <path d="M0 0 q-12 -15 0 -50 q12 35 0 50Z" fill="#f97316" opacity="0.7" filter="url(#ultraGlass)">
            <animate attributeName="d" values="M0 0 q-12 -15 0 -50 q12 35 0 50Z; M0 0 q-16 -18 0 -55 q16 -37 0 -55Z; M0 0 q-12 -15 0 -50 q12 35 0 50Z" dur="0.25s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* Burner Body - Volumetric Glass */}
      <g filter="url(#ultraGlass)">
        {/* Defining the Squat Base and Neck */}
        <path
          d="M25 110 q0 15 45 15 t45 -15 q0 -25 -20 -50 t-20 -35 h-10 q0 10 -20 35 t-20 50Z"
          fill="url(#glassBody)"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
        
        {/* Internal Alcohol Liquid with Surface Refraction */}
        <g opacity="0.2">
          <path d="M28 105 q0 12 42 12 t42 -12 q-10 -20 -42 -20 t-42 20Z" fill="#3b82f6" />
          <path d="M30 100 q40 -5 80 0" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.5" />
        </g>

        {/* The Wick - Prominent and Curved */}
        <path
          d="M70 32 L70 45 q0 15 12 30 t0 40"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity="0.8"
          filter="url(#softRim)"
        />
        {/* Frayed Wick Tip */}
        {isOpen && (
          <g transform="translate(70, 32)">
            <path d="M-4 0 L0 -6 L4 0" fill="#ffffff" fillOpacity="0.9" />
            <path d="M-2 -2 L0 -8 L2 -2" fill="#ffffff" fillOpacity="0.7" />
          </g>
        )}

        {/* Neck Stopper */}
        <path d="M62 38 h16 v10 q0 4 -8 4 t-8 -4 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.5" />

        {/* Glass Cap - More visible/frosted when closed */}
        {!isOpen && (
          <path
            d="M58 40 q0 -28 12 -28 t12 28 v28 q0 2 -12 2 t-12 -2 Z"
            fill="rgba(255, 255, 255, 0.15)"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.6"
            filter="url(#ultraGlass)"
          />
        )}
        
        {/* Base Rim Detail */}
        <ellipse cx="70" cy="125" rx="35" ry="3" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />
        
        {/* Surface Highlights */}
        <path d="M40 80 q-15 20 10 35" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.12" filter="url(#softRim)" />
      </g>
    </svg>
  );
}

export function StandAsset() {
  return (
    <svg viewBox="0 0 160 300" className="h-64 w-32">
      <rect x="40" y="270" width="80" height="15" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />
      <rect x="77" y="20" width="6" height="250" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      {/* Ring Holder */}
      <g transform="translate(0, 120)">
        <rect x="65" y="10" width="15" height="8" rx="2" fill="#334155" />
        <rect x="80" y="12" width="50" height="4" fill="#94a3b8" />
        <ellipse cx="110" cy="14" rx="30" ry="8" fill="none" stroke="#94a3b8" strokeWidth="3" />
      </g>
    </svg>
  );
}

export function RoundBottomFlaskAsset() {
  return (
    <svg viewBox="0 0 120 160" className="h-44 w-44 drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)]">
      <GlassDefs />
      {/* Volumetric Body */}
      <g filter="url(#ultraGlass)">
        {/* Outer Shell */}
        <circle
          cx="60"
          cy="105"
          r="42"
          fill="url(#glassBody)"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeOpacity="0.4"
        />
        {/* Inner Thickness Rim */}
        <circle
          cx="60"
          cy="105"
          r="41"
          fill="none"
          stroke="url(#glassRim)"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* Neck */}
        <rect
          x="48"
          y="15"
          width="24"
          height="65"
          fill="url(#glassBody)"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        {/* Neck highlights */}
        <rect x="48" y="15" width="24" height="65" fill="url(#internalReflection)" />
        {/* Top Rim */}
        <ellipse
          cx="60"
          cy="15"
          rx="13"
          ry="3"
          fill="none"
          stroke="url(#glassRim)"
          strokeWidth="1.5"
          strokeOpacity="0.8"
        />
        
        {/* Curved Surface Highlights */}
        <path
          d="M35 85 q-5 15 15 35"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity="0.15"
          filter="url(#softRim)"
        />
        <path
          d="M85 85 q5 15 -15 35"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.08"
        />
      </g>
      
      {/* Integrated Label */}
      <text
        x="60"
        y="120"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="11"
        fontWeight="500"
        fontFamily="system-ui"
        fillOpacity="0.5"
        style={{ letterSpacing: "0.02em" }}
      >
        250 mL
      </text>
    </svg>
  );
}

export function SeparatoryFunnelAsset() {
  return (
    <svg viewBox="0 0 120 160" className="h-44 w-44 drop-shadow-[0_20px_35px_rgba(0,0,0,0.15)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        {/* Top Stopper Area */}
        <rect x="53" y="10" width="14" height="20" rx="3" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.3" />
        
        {/* Globe Body */}
        <circle cx="60" cy="55" r="32" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
        <circle cx="60" cy="55" r="31" fill="none" stroke="url(#glassRim)" strokeWidth="1" strokeOpacity="0.2" />
        
        {/* Stem */}
        <rect x="57" y="87" width="6" height="45" rx="2" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.3" />
        <rect x="57" y="87" width="6" height="45" fill="url(#internalReflection)" />
        
        {/* Stopcock - More detailed */}
        <rect x="50" y="75" width="20" height="8" rx="2" fill="#d4af37" stroke="#b8860b" strokeWidth="1" />
        <circle cx="60" cy="79" r="3" fill="#ffffff" fillOpacity="0.5" />
        
        {/* Surface Highlights */}
        <path d="M45 45 q-8 10 0 20" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.1" filter="url(#softRim)" />
      </g>
    </svg>
  );
}

export function MeasureBottleAsset({ isOpen = true }: { isOpen?: boolean }) {
  return (
    <svg viewBox="0 0 120 160" className="h-44 w-44 drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        {/* Bottle Body */}
        <rect x="35" y="40" width="50" height="90" rx="12" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.3" />
        <rect x="35" y="40" width="50" height="90" rx="12" fill="url(#internalReflection)" />
        
        {/* Neck */}
        <rect x="47" y="15" width="26" height="25" rx="4" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.3" />
        
        {/* Stopper */}
        {!isOpen && (
          <path d="M50 8 L70 8 L66 22 L54 22 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" />
        )}
        
        {/* Measurement Marks - Very subtle like Nobook */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line
            key={i}
            x1="40"
            y1={115 - i * 12}
            x2={40 + (i % 2 === 0 ? 12 : 8)}
            y2={115 - i * 12}
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.2"
          />
        ))}
      </g>
    </svg>
  );
}

export function TestTubeAsset({ size = "large" }: { size?: "small" | "large" | "mini" }) {
  const dims = {
    small: { x: 38, y: 15, w: 24, h: 105, rx: 12 },
    large: { x: 35, y: 10, w: 30, h: 130, rx: 15 },
    mini: { x: 42, y: 40, w: 16, h: 75, rx: 8 },
  }[size];

  return (
    <svg viewBox="0 0 100 160" className="h-44 w-44 drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        {/* Main Body */}
        <rect
          x={dims.x}
          y={dims.y}
          width={dims.w}
          height={dims.h}
          rx={dims.rx}
          fill="url(#glassBody)"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        {/* Edge Reflection */}
        <rect x={dims.x} y={dims.y} width={dims.w} height={dims.h} rx={dims.rx} fill="url(#internalReflection)" />
        
        {/* Top Opening Rim */}
        <ellipse
          cx={dims.x + dims.w / 2}
          cy={dims.y}
          rx={dims.w / 2 + 1}
          ry="3"
          fill="none"
          stroke="url(#glassRim)"
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
        
        {/* Vertical Highlight */}
        <rect
          x={dims.x + dims.w * 0.15}
          y={dims.y + 10}
          width={dims.w * 0.2}
          height={dims.h - 25}
          rx="2"
          fill="#ffffff"
          fillOpacity="0.12"
          filter="url(#softRim)"
        />
      </g>
    </svg>
  );
}

export function GlassBottleAsset({ isOpen = true }: { isOpen?: boolean }) {
  return (
    <svg viewBox="0 0 120 160" className="h-44 w-44 drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        <rect x="35" y="40" width="50" height="85" rx="10" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.3" />
        <rect x="35" y="40" width="50" height="85" rx="10" fill="url(#internalReflection)" />
        <rect x="47" y="15" width="26" height="25" rx="3" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.3" />
        
        {!isOpen && (
          <path d="M50 10 L70 10 L66 22 L54 22 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" />
        )}
      </g>
    </svg>
  );
}

export function MatchAsset({ lit = false }: { lit?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 drop-shadow-lg">
      <GlassDefs />
      {/* Stick - Longer and more wood-like */}
      <rect x="10" y="55" width="75" height="3" fill="#f5e6d3" rx="0.5" stroke="#d9c39a" strokeWidth="0.5" />
      {/* Head - Slightly charred if lit */}
      <ellipse cx="85" cy="56.5" rx="5" ry="3.5" fill={lit ? "#0f172a" : "#dc2626"} />
      
      {/* Flame - More vibrant with inner core */}
      {lit && (
        <g filter="url(#flameGlow)" transform="translate(85, 56.5)">
          <path d="M0 -4 q-10 -15 0 -50 q10 35 0 50Z" fill="#fb923c">
            <animate attributeName="d" values="M0 -4 q-10 -15 0 -50 q10 35 0 50Z; M0 -4 q-14 -18 0 -55 q14 -37 0 -55Z; M0 -4 q-10 -15 0 -50 q10 35 0 50Z" dur="0.2s" repeatCount="indefinite" />
          </path>
          <path d="M0 -4 q-5 -12 0 -30 q5 18 0 30Z" fill="#ffedd5" opacity="0.9">
            <animate attributeName="d" values="M0 -4 q-5 -12 0 -30 q5 18 0 30Z; M0 -4 q-7 -15 0 -35 q7 -20 0 -35Z; M0 -4 q-5 -12 0 -30 q5 18 0 30Z" dur="0.1s" repeatCount="indefinite" />
          </path>
        </g>
      )}
    </svg>
  );
}

export function MatchboxAsset() {
  return (
    <svg viewBox="0 0 140 120" className="h-44 w-44 drop-shadow-2xl">
      {/* Perspective Box Base */}
      <path d="M30 85 L100 85 L100 65 L30 65 Z" fill="#423126" /> {/* Front side (striking) */}
      <path d="M30 65 L100 65 L115 45 L45 45 Z" fill="#e5d5c0" stroke="#cbb497" strokeWidth="1" /> {/* Top surface */}
      <path d="M100 85 L115 65 L115 45 L100 65 Z" fill="#d4c3ab" /> {/* Right side */}
      
      {/* Striking Surface Pattern */}
      <rect x="32" y="67" width="66" height="16" fill="#2d1f18" rx="1" />
      
      {/* Labels */}
      <g transform="translate(48, 56) skewX(-20)">
        <text fill="#8b1e1e" fontSize="6" fontWeight="bold" opacity="0.7">INVENTA</text>
        <text y="8" fill="#8b1e1e" fontSize="10" fontWeight="bold">Matches</text>
      </g>
      
      {/* Subtle details */}
      <line x1="30" y1="65" x2="100" y2="65" stroke="#cbb497" strokeWidth="0.5" />
    </svg>
  );
}

export function DropperAsset() {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 drop-shadow-lg">
      <rect x="44" y="15" width="12" height="25" rx="6" fill="#d24b2d" stroke="#b33d23" strokeWidth="1.5" />
      <rect x="48" y="40" width="4" height="45" fill="#dfe6ef" opacity="0.6" />
      <path d="M48 85 L52 85 L51 95 L49 95 Z" fill="#9ca7b5" />
    </svg>
  );
}

export function ForcepsAsset() {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32">
      <path d="M40 20 L55 85 M60 20 L45 85" fill="none" stroke="#cfd8e3" strokeWidth="3" strokeLinecap="round" />
      <rect x="46" y="20" width="8" height="4" rx="1" fill="#9ca7b5" />
    </svg>
  );
}

export function GauzeAsset() {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32">
      <rect x="20" y="30" width="60" height="40" fill="none" stroke="#cfd8e3" strokeWidth="1.5" />
      <rect x="35" y="35" width="30" height="30" fill="rgba(255,255,255,0.05)" stroke="#94a3b8" strokeDasharray="2,2" />
      {[0, 1, 2, 3, 4, 5].map(i => (
         <React.Fragment key={i}>
           <line x1="20" y1={30+i*8} x2="80" y2={30+i*8} stroke="#475569" strokeWidth="0.5" />
           <line x1={20+i*12} y1="30" x2={20+i*12} y2="70" stroke="#475569" strokeWidth="0.5" />
         </React.Fragment>
      ))}
    </svg>
  );
}

export function SpatulaAsset() {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32">
      <rect x="25" y="48" width="45" height="4" rx="2" fill="#cfd8e3" />
      <path d="M70 42 L85 42 L88 58 L70 58 Z" fill="#d9e0ea" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  );
}

export function GlassConduitAsset() {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 drop-shadow-xl">
      <path d="M30 80 L30 30 L70 30" fill="none" stroke="#dfe8f2" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      <path d="M30 80 L30 30 L70 30" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function RubberStopperAsset() {
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32">
      <path d="M35 35 L65 35 L58 75 L42 75 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />
    </svg>
  );
}

export function SparkEffect() {
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20 pointer-events-none">
      <g>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="50"
            y1="50"
            x2="50"
            y2="30"
            stroke="#ffcc00"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          >
            <animate attributeName="y2" values="50;20;50" dur="0.3s" repeatCount="1" />
            <animate attributeName="opacity" values="1;0" dur="0.3s" repeatCount="1" />
          </line>
        ))}
      </g>
    </svg>
  );
}
