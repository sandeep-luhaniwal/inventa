"use client";

import React from "react";

export function GlassDefs() {
  return (
    <defs>
      <linearGradient id="glassStroke" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="glassFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.05" />
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="flameGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feColorMatrix type="saturate" values="2" />
      </filter>
    </defs>
  );
}

export function BeakerAsset({ boiling = false, level = 60, color = "#38bdf8" }) {
  return (
    <svg viewBox="0 0 140 160" className="h-40 w-40 drop-shadow-2xl">
      <GlassDefs />
      {/* Liquid */}
      <path
        d={`M40 ${140 - (level / 100) * 100} h60 v${(level / 100) * 100 - 15} q0 15 -15 15 h-30 q-15 0 -15 -15 Z`}
        fill={color}
        fillOpacity="0.4"
        className="transition-all duration-1000"
      />
      
      {/* Bubbles Animation */}
      {boiling && (
        <g className="bubbles">
          {[1, 2, 3, 4, 5].map((i) => (
            <circle
              key={i}
              cx={50 + Math.random() * 40}
              cy={120}
              r={1 + Math.random() * 3}
              fill="white"
              fillOpacity="0.6"
            >
              <animate
                attributeName="cy"
                from="120"
                to={140 - (level / 100) * 100}
                dur={`${0.5 + Math.random()}s`}
                repeatCount="indefinite"
                begin={`${i * 0.2}s`}
              />
              <animate
                attributeName="opacity"
                values="0.6;0"
                dur={`${0.5 + Math.random()}s`}
                repeatCount="indefinite"
                begin={`${i * 0.2}s`}
              />
            </circle>
          ))}
        </g>
      )}

      {/* Glass Body */}
      <path
        d="M35 25 h70 v10 h-5 v85 q0 20 -20 20 h-20 q-20 0 -20 -20 v-85 h-5 Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="2"
      />
      
      {/* Measurement Marks */}
      <g stroke="white" strokeOpacity="0.3" strokeWidth="1">
        <line x1="85" y1="50" x2="95" y2="50" />
        <line x1="85" y1="75" x2="100" y2="75" />
        <line x1="85" y1="100" x2="95" y2="100" />
        <text x="105" y="78" fill="white" fillOpacity="0.4" fontSize="8" fontFamily="sans-serif">100ml</text>
      </g>
    </svg>
  );
}

export function BurnerAsset({ lit = false }) {
  return (
    <svg viewBox="0 0 140 140" className="h-32 w-32 drop-shadow-xl">
      <GlassDefs />
      {/* Flame */}
      {lit && (
        <g filter="url(#flameGlow)">
          <path d="M70 45 q-10 15 0 35 q10 -20 0 -35Z" fill="#2990ff">
             <animate attributeName="d" values="M70 45 q-10 15 0 35 q10 -20 0 -35Z; M70 42 q-12 18 0 38 q12 -20 0 -38Z; M70 45 q-10 15 0 35 q10 -20 0 -35Z" dur="0.2s" repeatCount="indefinite" />
          </path>
          <path d="M70 35 q-8 15 0 45 q8 -30 0 -45Z" fill="#ffcc00" opacity="0.6">
             <animate attributeName="d" values="M70 35 q-8 15 0 45 q8 -30 0 -45Z; M70 30 q-10 18 0 50 q10 -32 0 -50Z; M70 35 q-8 15 0 45 q8 -30 0 -45Z" dur="0.3s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* Burner Body */}
      <path
        d="M45 110 q0 -40 25 -40 t25 40 q0 15 -25 15 t-25 -15Z"
        fill="url(#glassFill)"
        stroke="url(#glassStroke)"
        strokeWidth="2"
      />
      {/* Wick */}
      <rect x="68" y="65" width="4" height="15" fill="#e2e8f0" />
      <rect x="64" y="62" width="12" height="6" rx="2" fill="#94a3b8" />
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
