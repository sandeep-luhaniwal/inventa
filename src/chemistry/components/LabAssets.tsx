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

      <filter id="flameGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}


export function BurnerAsset({ lit = false, isOpen = false }: { lit?: boolean; isOpen?: boolean }) {
  return (
    <svg viewBox="0 0 220 190" className="h-44 w-44 drop-shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
      <defs>
        <radialGradient id="abGlassFill" cx="50%" cy="38%" r="82%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="42%" stopColor="#dbe4ef" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#8d98a8" stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id="abGlassShade" cx="50%" cy="56%" r="72%">
          <stop offset="0%" stopColor="#64707f" stopOpacity="0.28" />
          <stop offset="78%" stopColor="#434a56" stopOpacity="0.46" />
          <stop offset="100%" stopColor="#343942" stopOpacity="0.54" />
        </radialGradient>
        <linearGradient id="abTubeFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#97aabd" stopOpacity="0.62" />
          <stop offset="18%" stopColor="#eef6ff" stopOpacity="0.24" />
          <stop offset="50%" stopColor="#dbe4ef" stopOpacity="0.06" />
          <stop offset="82%" stopColor="#eef6ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#97aabd" stopOpacity="0.56" />
        </linearGradient>
        <linearGradient id="abGlassEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.56" />
          <stop offset="25%" stopColor="#dbe4ef" stopOpacity="0.16" />
          <stop offset="75%" stopColor="#dbe4ef" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.46" />
        </linearGradient>
        <filter id="abGlassFx" x="-18%" y="-18%" width="136%" height="136%">
          <feGaussianBlur stdDeviation="0.85" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.1" specularExponent="34" lightingColor="#ffffff" result="spec">
            <fePointLight x="-80" y="-80" z="270" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specular" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="specular" />
          </feMerge>
        </filter>
        <filter id="abSoftBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      {/* Flame */}
      {lit && isOpen && (
        <g transform="translate(110, 26)">
          <path d="M0 0 q-6 -10 0 -26 q6 16 0 26Z" fill="#3b82f6" opacity="0.9" filter="url(#abSoftBlur)">
            <animate attributeName="d" values="M0 0 q-6 -10 0 -26 q6 16 0 26Z; M0 0 q-8 -12 0 -30 q8 18 0 30Z; M0 0 q-6 -10 0 -26 q6 16 0 26Z" dur="0.15s" repeatCount="indefinite" />
          </path>
          <path d="M0 0 q-12 -15 0 -44 q12 29 0 44Z" fill="#f97316" opacity="0.75" filter="url(#abSoftBlur)">
            <animate attributeName="d" values="M0 0 q-12 -15 0 -44 q12 29 0 44Z; M0 0 q-15 -17 0 -50 q15 33 0 50Z; M0 0 q-12 -15 0 -44 q12 29 0 44Z" dur="0.22s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      <g filter="url(#abGlassFx)">
        {/* Burner body */}
        <path
          d="M34 108
             C42 79 65 62 110 56
             C155 62 178 79 186 108
             C170 136 148 151 110 154
             C72 151 50 136 34 108 Z"
          fill="url(#abGlassShade)"
        />
        <path
          d="M34 108
             C42 79 65 62 110 56
             C155 62 178 79 186 108
             C170 136 148 151 110 154
             C72 151 50 136 34 108 Z"
          fill="url(#abGlassFill)"
          stroke="url(#abGlassEdge)"
          strokeWidth="2.2"
        />

        {/* Neck */}
        <path
          d="M93 30 H127
             C130 30 132 32 132 36
             V58
             C132 65 127 70 121 72
             H99
             C93 70 88 65 88 58
             V36
             C88 32 90 30 93 30 Z"
          fill="url(#abTubeFill)"
          stroke="url(#abGlassEdge)"
          strokeWidth="2"
        />

        {/* Cap */}
        <rect x="95" y="18" width="30" height="20" rx="3" fill="#d9e2ec" stroke="#c8d3e0" strokeWidth="1.2" />

        {/* Liquid level */}
        <path d="M45 93 C68 88 152 88 175 93" fill="none" stroke="#d9efff" strokeWidth="3.2" strokeOpacity="0.45" filter="url(#abSoftBlur)" />
        <path d="M47 94 C70 91 150 91 173 94" fill="none" stroke="#c8e2ff" strokeWidth="1.4" strokeOpacity="0.42" />

        {/* Wick */}
        <path
          d="M110 34
             V78
             C110 88 118 94 124 100
             C132 108 133 118 128 126
             C123 134 114 138 114 145
             C114 150 118 153 123 154"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeOpacity="0.85"
          filter="url(#abSoftBlur)"
        />

        {/* Wick tip */}
        {isOpen && (
          <g transform="translate(110, 16)">
            <path d="M-4 0 L0 -9 L4 0" fill="#f8fafc" fillOpacity="0.95" />
            <path d="M-2 -1 L0 -12 L2 -1" fill="#f8fafc" fillOpacity="0.7" />
          </g>
        )}

        {/* Outer snuffer cap */}
        {!isOpen && (
          <g>
            <path
              d="M88 4
                 H132
                 C139 4 145 10 145 18
                 V58
                 C145 66 139 72 132 72
                 H88
                 C81 72 75 66 75 58
                 V18
                 C75 10 81 4 88 4 Z"
              fill="url(#abTubeFill)"
              fillOpacity="0.72"
              stroke="url(#abGlassEdge)"
              strokeWidth="1.8"
            />
            <ellipse cx="110" cy="4" rx="22" ry="7" fill="#eef6ff" fillOpacity="0.18" />
            <path d="M98 12 C96 18 100 24 106 27" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.16" filter="url(#abSoftBlur)" />
            <ellipse cx="110" cy="71" rx="22" ry="5" fill="#dbe4ef" fillOpacity="0.08" />
          </g>
        )}

        {/* Base ring */}
        <ellipse cx="110" cy="156" rx="42" ry="6" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2.4" />
        <ellipse cx="110" cy="160" rx="39" ry="5" fill="#2f343d" fillOpacity="0.4" />

        {/* Highlights */}
        <path d="M56 101 C63 118 73 132 83 140" fill="none" stroke="#ffffff" strokeWidth="6.5" strokeLinecap="round" strokeOpacity="0.14" filter="url(#abSoftBlur)" />
        <path d="M148 96 C159 104 165 116 166 126" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.12" filter="url(#abSoftBlur)" />
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
    <svg viewBox="0 0 200 280" className="h-44 w-44 drop-shadow-[0_22px_40px_rgba(0,0,0,0.18)]">
      <defs>
        <radialGradient id="rbfBulbFill" cx="38%" cy="36%" r="72%">
          <stop offset="0%" stopColor="#e8f4ff" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#c8d8e8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#7a8fa8" stopOpacity="0.22" />
        </radialGradient>
        <linearGradient id="rbfNeck" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8faabf" stopOpacity="0.7" />
          <stop offset="18%" stopColor="#ddeeff" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#c8d8e8" stopOpacity="0.1" />
          <stop offset="82%" stopColor="#ddeeff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8faabf" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="rbfShoulder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8faabf" stopOpacity="0.65" />
          <stop offset="20%" stopColor="#ddeeff" stopOpacity="0.22" />
          <stop offset="50%" stopColor="#c8d8e8" stopOpacity="0.08" />
          <stop offset="80%" stopColor="#ddeeff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8faabf" stopOpacity="0.6" />
        </linearGradient>
        <filter id="rbfGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="40" lightingColor="#ffffff" result="spec">
            <fePointLight x="-60" y="-80" z="280" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specular" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="specular" />
          </feMerge>
        </filter>
        <filter id="rbfBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      <g filter="url(#rbfGlow)">
        {/* NECK */}
        <rect x="84" y="18" width="32" height="112" rx="2" fill="url(#rbfNeck)" />
        <line x1="84" y1="20" x2="84" y2="128" stroke="#8faabf" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="116" y1="20" x2="116" y2="128" stroke="#8faabf" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="90" y1="22" x2="90" y2="126" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.28" filter="url(#rbfBlur)" />
        <line x1="110" y1="22" x2="110" y2="126" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.12" />

        {/* TOP LIP */}
        <ellipse cx="100" cy="18" rx="17" ry="4.5" fill="none" stroke="#8faabf" strokeWidth="3" />
        <ellipse cx="100" cy="18" rx="13" ry="2.5" fill="#ddeeff" fillOpacity="0.12" />
        <path d="M87 16 Q100 13 113 16" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.55" />

        {/* BULB */}
        <circle cx="100" cy="196" r="76" fill="url(#rbfBulbFill)" />
        <circle cx="100" cy="196" r="76" fill="none" stroke="#8faabf" strokeWidth="3" />
        <circle cx="100" cy="196" r="73" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.08" />
        <path d="M34 172 C22 192 24 224 42 248" fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeOpacity="0.18" filter="url(#rbfBlur)" />
        <path d="M38 166 C28 184 30 214 46 236" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.1" />
        <path d="M162 168 C174 190 172 222 158 244" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.07" />
        <ellipse cx="100" cy="258" rx="48" ry="12" fill="#ffffff" fillOpacity="0.06" />
      </g>

      <text x="100" y="202" textAnchor="middle" fill="#c8d8e8" fontSize="18" fontWeight="300" fontFamily="system-ui" fillOpacity="0.55" letterSpacing="0.5">
        250 mL
      </text>
    </svg>
  );
}
export function SeparatoryFunnelAsset() {
  return (
    <svg viewBox="0 0 220 660" className="h-56 w-44 drop-shadow-[0_22px_36px_rgba(0,0,0,0.18)]">
      <defs>
        <radialGradient id="sfBulbFill" cx="44%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="38%" stopColor="#dbe4ef" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#8d98a8" stopOpacity="0.16" />
        </radialGradient>
        <radialGradient id="sfBulbShade" cx="50%" cy="46%" r="66%">
          <stop offset="0%" stopColor="#5f6774" stopOpacity="0.34" />
          <stop offset="76%" stopColor="#444b57" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#343942" stopOpacity="0.56" />
        </radialGradient>
        <linearGradient id="sfTubeFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#97aabd" stopOpacity="0.62" />
          <stop offset="18%" stopColor="#eef6ff" stopOpacity="0.24" />
          <stop offset="50%" stopColor="#dbe4ef" stopOpacity="0.06" />
          <stop offset="82%" stopColor="#eef6ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#97aabd" stopOpacity="0.56" />
        </linearGradient>
        <linearGradient id="sfGlassEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.54" />
          <stop offset="25%" stopColor="#dbe4ef" stopOpacity="0.16" />
          <stop offset="75%" stopColor="#dbe4ef" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.46" />
        </linearGradient>
        <linearGradient id="sfStopcockGlass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c3ccd8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f8fbff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8c97a7" stopOpacity="0.7" />
        </linearGradient>
        <filter id="sfGlassFx" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.85" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.1" specularExponent="34" lightingColor="#ffffff" result="spec">
            <fePointLight x="-90" y="-90" z="280" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specular" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="specular" />
          </feMerge>
        </filter>
        <filter id="sfSoftBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      <g filter="url(#sfGlassFx)">
        {/* top stopper ball */}
        <circle cx="110" cy="24" r="18" fill="url(#sfTubeFill)" stroke="url(#sfGlassEdge)" strokeWidth="2.2" />
        <circle cx="110" cy="24" r="15" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1.2" />
        <path d="M96 18 C94 26 99 34 107 38" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeOpacity="0.18" filter="url(#sfSoftBlur)" />

        {/* stopper neck */}
        <path
          d="M98 45 H122 L128 66 C128 70 120 74 110 74 C100 74 92 70 92 66 Z"
          fill="url(#sfTubeFill)"
          stroke="url(#sfGlassEdge)"
          strokeWidth="2"
        />

        {/* upper collar */}
        <rect x="92" y="66" width="36" height="28" rx="4" fill="url(#sfTubeFill)" stroke="url(#sfGlassEdge)" strokeWidth="2" />
        <ellipse cx="110" cy="66" rx="18" ry="4.5" fill="none" stroke="url(#sfGlassEdge)" strokeWidth="1.8" />

        {/* globe body */}
        <path
          d="M110 94
             C74 94 47 122 47 159
             C47 200 69 230 92 257
             C101 268 106 281 110 301
             C114 281 119 268 128 257
             C151 230 173 200 173 159
             C173 122 146 94 110 94 Z"
          fill="url(#sfBulbShade)"
        />
        <path
          d="M110 94
             C74 94 47 122 47 159
             C47 200 69 230 92 257
             C101 268 106 281 110 301
             C114 281 119 268 128 257
             C151 230 173 200 173 159
             C173 122 146 94 110 94 Z"
          fill="url(#sfBulbFill)"
          stroke="url(#sfGlassEdge)"
          strokeWidth="2.4"
        />
        <path d="M63 135 C49 161 51 198 69 223" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.15" filter="url(#sfSoftBlur)" />
        <path d="M70 128 C58 149 60 181 74 203" fill="none" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" strokeOpacity="0.08" />

        {/* lower neck joint */}
        <path d="M101 298 C102 313 104 327 105 342 H115 C116 327 118 313 119 298 Z" fill="url(#sfTubeFill)" stroke="url(#sfGlassEdge)" strokeWidth="1.8" />

        {/* stopcock body - Horizontal Cylinder */}
        <rect x="75" y="338" width="70" height="26" rx="6" fill="url(#sfStopcockGlass)" stroke="url(#sfGlassEdge)" strokeWidth="1.8" />
        
        {/* Yellow Clip/Band as seen in the reference image */}
        <path 
          d="M85 334 Q78 351 85 368 M85 334 L92 334 Q85 351 92 368 L85 368" 
          fill="none" 
          stroke="#eab308" 
          strokeWidth="2" 
          strokeLinecap="round" 
          opacity="0.9"
        />
        <path 
          d="M135 334 Q142 351 135 368 M135 334 L128 334 Q135 351 128 368 L135 368" 
          fill="none" 
          stroke="#eab308" 
          strokeWidth="2" 
          strokeLinecap="round" 
          opacity="0.9"
        />
        {/* Connectors of the clip */}
        <path d="M85 334 H135 M85 368 H135" fill="none" stroke="#eab308" strokeWidth="1.2" opacity="0.6" />

        {/* stopcock knob / handle */}
        <g transform="translate(145, 351)">
           <circle cx="15" cy="0" r="10" fill="url(#sfStopcockGlass)" stroke="url(#sfGlassEdge)" strokeWidth="1.6" />
           <path d="M10 -5 L20 5 M10 5 L20 -5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* very long stem */}
        <rect x="106" y="364" width="8" height="260" rx="1" fill="url(#sfTubeFill)" stroke="url(#sfGlassEdge)" strokeWidth="1.5" />
        <path d="M110 366 V620" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.12" />
        
        {/* beveled stem tip - angled cut */}
        <path 
          d="M106 624 L114 624 L114 645 L106 630 Z" 
          fill="url(#sfTubeFill)" 
          stroke="url(#sfGlassEdge)" 
          strokeWidth="1.4" 
        />
        <path d="M107 625 L113 625 L113 643 L107 629 Z" fill="#ffffff" fillOpacity="0.08" />
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

export function GasJarAsset({ isOpen = true }: { isOpen?: boolean }) {
  return (
    <svg viewBox="0 0 220 300" className="h-52 w-44 drop-shadow-[0_22px_40px_rgba(0,0,0,0.15)]">
      <defs>
        <radialGradient id="gjBodyFill" cx="42%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#dbe4ef" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#8d98a8" stopOpacity="0.22" />
        </radialGradient>
        <radialGradient id="gjBodyShade" cx="50%" cy="48%" r="70%">
          <stop offset="0%" stopColor="#606874" stopOpacity="0.3" />
          <stop offset="78%" stopColor="#454c57" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#343942" stopOpacity="0.54" />
        </radialGradient>
        <linearGradient id="gjGlassEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.58" />
          <stop offset="25%" stopColor="#dbe4ef" stopOpacity="0.14" />
          <stop offset="75%" stopColor="#dbe4ef" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.48" />
        </linearGradient>
        <linearGradient id="gjNeckFill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a3b7c9" stopOpacity="0.65" />
          <stop offset="20%" stopColor="#f0f7ff" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#dbe4ef" stopOpacity="0.1" />
          <stop offset="80%" stopColor="#f0f7ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#a3b7c9" stopOpacity="0.6" />
        </linearGradient>
        <filter id="gjGlassFx" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="38" lightingColor="#ffffff" result="spec">
            <fePointLight x="-90" y="-90" z="280" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specular" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="specular" />
          </feMerge>
        </filter>
        <filter id="gjSoftBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      <g filter="url(#gjGlassFx)">
        {/* THE BODY SILHOUETTE - Based on the reference image */}
        {/* Main Body with rounded shoulders */}
        <path
          d="M84 72 
             C60 72 48 90 48 120 
             V250 
             C48 262 58 272 72 272 
             H148 
             C162 272 172 262 172 250 
             V120 
             C172 90 160 72 136 72 
             H84 Z"
          fill="url(#gjBodyShade)"
        />
        <path
          d="M84 72 
             C60 72 48 90 48 120 
             V250 
             C48 262 58 272 72 272 
             H148 
             C162 272 172 262 172 250 
             V120 
             C172 90 160 72 136 72 
             H84 Z"
          fill="url(#gjBodyFill)"
          stroke="url(#gjGlassEdge)"
          strokeWidth="2.5"
        />

        {/* Neck */}
        <rect x="84" y="38" width="52" height="34" fill="url(#gjNeckFill)" stroke="url(#gjGlassEdge)" strokeWidth="2.2" />
        
        {/* Thick Lip / Rim */}
        <path 
          d="M80 18 
             C80 15 85 12 110 12 
             S140 15 140 18 
             V38 
             C140 42 135 44 110 44 
             S80 42 80 38 
             Z"
          fill="url(#gjNeckFill)"
          stroke="url(#gjGlassEdge)"
          strokeWidth="2.4"
        />
        
        {/* Lighting Details from Reference */}
        {/* Highlight on shoulder */}
        <ellipse cx="78" cy="110" rx="14" ry="7" fill="#ffffff" fillOpacity="0.45" filter="url(#gjSoftBlur)" />
        
        {/* Vertical side reflections */}
        <path d="M60 130 V240" fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeOpacity="0.12" filter="url(#gjSoftBlur)" />
        <path d="M160 130 V240" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.08" />

        {/* Thick Base Effect */}
        <path d="M52 255 H168" fill="none" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.15" />
        <path d="M52 262 H168" fill="none" stroke="#2a3038" strokeWidth="6" strokeOpacity="0.4" />
        
        {/* Lid (when closed) */}
        {!isOpen && <rect x="85" y="14" width="50" height="12" rx="4" fill="#d1dae5" fillOpacity="0.65" />}
      </g>
    </svg>
  );
}

export function TestTubeAsset({ size = "large" }: { size?: "small" | "large" | "mini" }) {
  const dims = {
    small: { x: 40, y: 15, w: 20, h: 140 },
    large: { x: 36, y: 10, w: 28, h: 170 },
    mini: { x: 44, y: 40, w: 12, h: 100 },
  }[size];

  const midX = dims.x + dims.w / 2;
  const radius = dims.w / 2;
  const bodyHeight = dims.h - radius;

  return (
    <svg viewBox="0 0 100 200" className="h-52 w-44 drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        {/* Main Body - Path for U-shape */}
        <path
          d={`M${dims.x} ${dims.y} 
             V${dims.y + bodyHeight} 
             A${radius} ${radius} 0 0 0 ${dims.x + dims.w} ${dims.y + bodyHeight} 
             V${dims.y} Z`}
          fill="url(#glassBody)"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeOpacity="0.35"
        />
        
        {/* Internal Reflection / Depth */}
        <path
          d={`M${dims.x + 1} ${dims.y} 
             V${dims.y + bodyHeight} 
             A${radius - 1} ${radius - 1} 0 0 0 ${dims.x + dims.w - 1} ${dims.y + bodyHeight} 
             V${dims.y} Z`}
          fill="url(#internalReflection)"
        />

        {/* Flared Rim / Lip */}
        <ellipse
          cx={midX}
          cy={dims.y}
          rx={radius + 1.5}
          ry="3"
          fill="none"
          stroke="url(#glassRim)"
          strokeWidth="1.8"
          strokeOpacity="0.8"
        />

        {/* Highlights */}
        <rect
          x={dims.x + dims.w * 0.15}
          y={dims.y + 15}
          width={dims.w * 0.25}
          height={dims.h - 40}
          rx="2"
          fill="#ffffff"
          fillOpacity="0.14"
          filter="url(#softRim)"
        />
        
        {/* Bottom Curved Highlight */}
        <path 
          d={`M${dims.x + radius * 0.5} ${dims.y + bodyHeight + radius * 0.6} A${radius * 0.5} ${radius * 0.2} 0 0 0 ${dims.x + dims.w - radius * 0.5} ${dims.y + bodyHeight + radius * 0.6}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.18"
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

export function ChemicalContainerAsset({
  state,
  label,
  symbol,
  accent,
}: {
  state: "solid" | "liquid" | "gas";
  label: string;
  symbol: string;
  accent: string;
}) {
  if (state === "gas") {
    return (
      <svg viewBox="0 0 130 160" className="h-40 w-40 drop-shadow-[0_18px_28px_rgba(0,0,0,0.22)]">
        <GlassDefs />
        <defs>
          <linearGradient id={`gasCylinder-${symbol}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="45%" stopColor="#dbe4ef" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
        </defs>
        <rect x="42" y="35" width="46" height="100" rx="18" fill={`url(#gasCylinder-${symbol})`} stroke="#d8e2ee" strokeWidth="1.5" />
        <ellipse cx="65" cy="43" rx="22" ry="9" fill="#edf4fb" fillOpacity="0.45" />
        <path d="M56 31 h18 v10 h-18z" fill="#475569" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M48 28 h34" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <circle cx="86" cy="28" r="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
        <path d="M86 28 l5 -4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M51 54 q14 -10 28 0" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.22" filter="url(#softRim)" />
        <rect x="48" y="83" width="34" height="29" rx="4" fill="#f8fafc" fillOpacity="0.86" stroke="#dbe4ef" />
        <text x="65" y="99" textAnchor="middle" fill="#111827" fontSize="11" fontWeight="700" fontFamily="system-ui">
          {symbol}
        </text>
        <text x="65" y="109" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="system-ui">
          {label.slice(0, 14)}
        </text>
        <path d="M89 52 q16 8 16 24 q0 16 -13 24" fill="none" stroke={accent} strokeWidth="2" strokeOpacity="0.34" strokeDasharray="4 5" />
      </svg>
    );
  }

  const isSolid = state === "solid";

  return (
    <svg viewBox="0 0 130 160" className="h-40 w-40 drop-shadow-[0_18px_28px_rgba(0,0,0,0.2)]">
      <GlassDefs />
      <g filter="url(#ultraGlass)">
        <rect x="36" y="48" width="58" height="82" rx="11" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.7" strokeOpacity="0.45" />
        <rect x="36" y="48" width="58" height="82" rx="11" fill="url(#internalReflection)" />
        <rect x="48" y="27" width="34" height="24" rx="5" fill="url(#glassBody)" stroke="#ffffff" strokeWidth="0.7" strokeOpacity="0.36" />
        <path d="M46 25 h38 v9 h-38z" fill="#1f2937" stroke="#0f172a" strokeWidth="1" />
        <ellipse cx="65" cy="50" rx="27" ry="7" fill="#ffffff" fillOpacity="0.13" stroke="#ffffff" strokeOpacity="0.22" />
        {isSolid ? (
          <g>
            <path d="M41 102 q24 -14 48 0 v20 q-24 12 -48 0z" fill={accent} fillOpacity="0.8" />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <circle
                key={index}
                cx={47 + (index % 5) * 9}
                cy={96 + Math.floor(index / 5) * 12}
                r={index % 3 === 0 ? 2.8 : 2.1}
                fill={accent}
                opacity={index % 2 === 0 ? 0.95 : 0.62}
              />
            ))}
          </g>
        ) : (
          <g>
            <path d="M40 88 q25 5 50 0 v34 q-25 10 -50 0z" fill={accent} fillOpacity="0.78" />
            <path d="M42 87 q23 5 46 0" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.4" />
            <path d="M45 98 q18 4 38 0" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.18" />
          </g>
        )}
        <rect x="43" y="67" width="44" height="25" rx="4" fill="#f8fafc" fillOpacity="0.86" stroke="#dbe4ef" />
        <text x="65" y="82" textAnchor="middle" fill="#111827" fontSize="10" fontWeight="700" fontFamily="system-ui">
          {symbol}
        </text>
        <text x="65" y="90" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="system-ui">
          {label.slice(0, 13)}
        </text>
        <path d="M47 55 q-10 24 0 56" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.13" filter="url(#softRim)" />
      </g>
    </svg>
  );
}

export function MatchAsset({ lit = false }: { lit?: boolean }) {
  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
      <defs>
        <filter id="matchSoftGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="perfectBurn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="35%" stopColor="#452a1e" />
          <stop offset="55%" stopColor="#d97706" />
          <stop offset="70%" stopColor="#fde68a" />
        </linearGradient>
      </defs>

      <g transform="translate(30 80) rotate(22)">
        {/* The Matchstick Body - Rounded and clean */}
        <rect x="0" y="-3" width="85" height="6" fill={lit ? "url(#perfectBurn)" : "#f8eed3"} rx="2" />
        
        {/* Ash Head */}
        <ellipse cx="6" cy="0" rx="10" ry="7" fill={lit ? "#e5e7eb" : "#e14a3b"} stroke={lit ? "#9ca3af" : "none"} strokeWidth="0.5" />
        
        {lit && (
          <g transform="translate(10, 0)">
            {/* Soft Atmospheric Outer Glow - Scoped to the flame */}
            <circle cx="15" cy="-20" r="30" fill="#f59e0b" opacity="0.15" filter="url(#matchSoftGlow)" />
            
            {/* The Flame - High Fidelity and Clean */}
            <g filter="url(#matchSoftGlow)">
              <path d="M0 0 q-12 -16 0 -40 q12 24 0 40Z" fill="#3b82f6" opacity="0.4" />
              <path d="M0 -5 q-18 -26 0 -65 q18 39 0 65Z" fill="#f59e0b" opacity="0.8">
                <animate attributeName="opacity" values="0.7;0.9;0.7" dur="0.2s" repeatCount="indefinite" />
              </path>
              <path d="M0 -10 q-8 -15 0 -35 q8 20 0 35Z" fill="#ffffff" opacity="1" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
}

export function MatchboxAsset({
  lit = false,
  showStick = true,
  isStriking = false,
}: {
  lit?: boolean;
  showStick?: boolean;
  isStriking?: boolean;
}) {
  return (
    <svg viewBox="0 0 240 160" className="h-44 w-52 drop-shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
      <defs>
        <filter id="mbFlameGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="mbSparkGlow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      {/* Match stick - protruding from the side like in the image */}
      {showStick && (
        <g transform={`translate(${isStriking ? 148 : 138} ${isStriking ? 76 : 72}) rotate(${isStriking ? 18 : 22})`}>
          <rect x="0" y="-3" width={isStriking ? 84 : 75} height="6" fill="#f8eed3" />
          <ellipse cx="6" cy="0" rx="9" ry="6" fill={lit ? "#20120d" : "#e14a3b"} />

          {isStriking && (
            <g transform="translate(1, -1)">
              {[0, 40, 80, 120, 160].map((angle) => (
                <line
                  key={angle}
                  x1="8"
                  y1="0"
                  x2="18"
                  y2="0"
                  stroke="#ffd166"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${angle} 8 0)`}
                  filter="url(#mbSparkGlow)"
                />
              ))}
            </g>
          )}

          {lit && (
            <g transform="translate(10, 0)" filter="url(#mbFlameGlow)">
              <path d="M0 0 q-8 -12 0 -34 q8 18 0 34Z" fill="#3b82f6" opacity="0.8">
                <animate attributeName="d" values="M0 0 q-8 -12 0 -34 q8 18 0 34Z; M0 0 q-10 -15 0 -38 q10 20 0 38Z; M0 0 q-8 -12 0 -34 q8 18 0 30Z" dur="0.15s" repeatCount="indefinite" />
              </path>
              <path d="M0 0 q-14 -18 0 -50 q14 28 0 50Z" fill="#fb923c" opacity="0.9">
                 <animate attributeName="d" values="M0 0 q-14 -18 0 -50 q14 28 0 50Z; M0 0 q-18 -22 0 -55 q18 32 0 55Z; M0 0 q-14 -18 0 -50 q14 28 0 50Z" dur="0.2s" repeatCount="indefinite" />
              </path>
            </g>
          )}
        </g>
      )}

      {/* Matchbox Body - Perspective Paths */}
      <g transform="translate(40 30)">
        {/* Front-Left Face */}
        <path d="M0 45 L40 75 L40 100 L0 70 Z" fill="#b9a67e" stroke="#9d8a64" strokeWidth="0.5" />
        
        {/* Front-Right Face (Striking Surface) */}
        <path d="M40 75 L145 35 L145 60 L40 100 Z" fill="#311c1d" stroke="#1f1213" strokeWidth="0.5" />
        
        {/* Top Face */}
        <path d="M0 45 L105 5 L145 35 L40 75 Z" fill="#dfd1b3" stroke="#cbb994" strokeWidth="0.5" />

        {/* Red Border Design on Top */}
        <path 
          d="M12 47 L102 12 L133 35 L43 70 Z" 
          fill="none" 
          stroke="#b44f50" 
          strokeWidth="1.8" 
        />
        <path 
          d="M18 48 L100 16 L128 36 L46 67 Z" 
          fill="none" 
          stroke="#b44f50" 
          strokeWidth="0.8" 
          opacity="0.6"
        />

        {/* Text - Perfectly centered within borders */}
        <g transform="translate(75 38) rotate(-21)">
           <text textAnchor="middle" fill="#b44f50" fontSize="9" fontWeight="700" fontFamily="serif" letterSpacing="1.2">INVENTA</text>
           <text x="0" y="18" textAnchor="middle" fill="#b44f50" fontSize="20" fontWeight="500" fontFamily="serif">Matches</text>
        </g>
      </g>
    </svg>
  );
}

export function DropperAsset() {
  return (
    <svg viewBox="0 0 80 220" className="h-56 w-20 drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)]">
      <defs>
        <radialGradient id="dropperBulb" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ff5f3f" />
          <stop offset="60%" stopColor="#e12d0a" />
          <stop offset="100%" stopColor="#8b1c06" />
        </radialGradient>
        <linearGradient id="dropperGlass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Glass Body - Slender and Tapered */}
      <path 
        d="M34 80 
           L46 80 
           L45 160 
           Q44 210 42 215 
           L38 215 
           Q36 210 35 160 
           Z" 
        fill="url(#dropperGlass)" 
        stroke="rgba(255,255,255,0.2)" 
        strokeWidth="0.5" 
      />
      
      {/* Glossy Red Bulb */}
      <path 
        d="M32 80 
           C32 75 30 70 28 60 
           C24 45 24 25 40 10 
           C56 25 56 45 52 60 
           C50 70 48 75 48 80 
           Z" 
        fill="url(#dropperBulb)" 
      />
      
      {/* Bulb Highlights */}
      <path d="M33 25 Q38 18 45 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      <path d="M31 35 Q32 30 35 28" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />

      {/* Glass Internal Reflection */}
      <path d="M37 90 V150" fill="none" stroke="white" strokeWidth="1" opacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

export function ForcepsAsset() {
  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 drop-shadow-[0_16px_24px_rgba(0,0,0,0.24)]">
      <defs>
        <linearGradient id="forcepsSteel" x1="18" y1="130" x2="132" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#eef3f8" />
          <stop offset="18%" stopColor="#aeb9c3" />
          <stop offset="48%" stopColor="#f7fafc" />
          <stop offset="78%" stopColor="#8e99a4" />
          <stop offset="100%" stopColor="#e5ebf1" />
        </linearGradient>
        <linearGradient id="forceShadow" x1="30" y1="136" x2="126" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5f6b75" />
          <stop offset="55%" stopColor="#cbd3db" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        <filter id="forcepsSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
      </defs>

      <g transform="rotate(-43 80 80)">
        <path
          d="M72 18 q8 -8 16 0 q4 4 3 10 q-2 10 -7 24 l-19 70 q-4 14 -13 23 q-3 3 -6 1 q-3 -2 -1 -6 q6 -13 9 -26 l14 -67 q3 -17 4 -29Z"
          fill="url(#forceShadow)"
          opacity="0.9"
        />
        <path
          d="M78 17 q7 -7 15 1 q4 4 2 10 q-3 12 -10 29 l-31 80 q-4 10 -13 17 q-3 2 -5 0 q-2 -2 0 -5 q8 -10 12 -22 l22 -77 q5 -18 8 -33Z"
          fill="url(#forcepsSteel)"
          stroke="#f8fafc"
          strokeWidth="1.2"
          strokeOpacity="0.72"
        />
        <path
          d="M67 26 q5 -9 11 -9 q2 14 -2 30 l-24 86 q-4 13 -13 21"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.42"
          filter="url(#forcepsSoft)"
        />
        <path
          d="M88 30 q-1 12 -7 28 l-28 82"
          fill="none"
          stroke="#5d6872"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.42"
        />

        <path
          d="M62 51 q11 7 24 4"
          fill="none"
          stroke="#dfe5eb"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.72"
        />
        {[0, 1, 2, 3, 4, 5, 6].map((line) => (
          <line
            key={line}
            x1={61 + line * 2.8}
            y1={61 + line * 3.2}
            x2={76 + line * 2.8}
            y2={58 + line * 3.2}
            stroke="#7f8a94"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.55"
          />
        ))}

        <path
          d="M36 149 q4 -13 11 -23"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M45 146 q3 -13 8 -24"
          fill="none"
          stroke="#88939d"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.72"
        />
        <ellipse cx="86" cy="23" rx="10" ry="11" fill="#d8e0e8" opacity="0.75" />
      </g>
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

export function ClayNetAsset() {
  return (
    <svg viewBox="0 0 130 90" className="h-28 w-40 drop-shadow-[0_12px_18px_rgba(0,0,0,0.2)]">
      <defs>
        <linearGradient id="clayNetSteel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="48%" stopColor="#b7c0c8" />
          <stop offset="100%" stopColor="#6b7480" />
        </linearGradient>
        <radialGradient id="clayCenter" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#fff7df" />
          <stop offset="70%" stopColor="#dad4bd" />
          <stop offset="100%" stopColor="#a39b85" />
        </radialGradient>
      </defs>
      <g transform="translate(12 19) skewX(-13)">
        <rect x="0" y="0" width="104" height="42" rx="4" fill="url(#clayNetSteel)" opacity="0.42" stroke="#e7edf4" strokeWidth="1.2" />
        {[0, 1, 2, 3, 4, 5, 6].map((line) => (
          <line key={`h-${line}`} x1="1" y1={6 + line * 5.2} x2="103" y2={6 + line * 5.2} stroke="#6f7a85" strokeWidth="0.65" opacity="0.58" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
          <line key={`v-${line}`} x1={8 + line * 11} y1="1" x2={8 + line * 11} y2="41" stroke="#f8fafc" strokeWidth="0.6" opacity="0.48" />
        ))}
        <ellipse cx="52" cy="21" rx="34" ry="13" fill="url(#clayCenter)" stroke="#f8fafc" strokeOpacity="0.42" />
        <ellipse cx="52" cy="19" rx="24" ry="7" fill="#ffffff" fillOpacity="0.22" />
      </g>
    </svg>
  );
}

export function RetortStandAsset() {
  return (
    <svg viewBox="0 0 150 210" className="h-56 w-36 drop-shadow-[0_18px_26px_rgba(0,0,0,0.24)]">
      <defs>
        <linearGradient id="standSteel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c8792" />
          <stop offset="45%" stopColor="#f4f7fa" />
          <stop offset="100%" stopColor="#5f6873" />
        </linearGradient>
      </defs>
      <ellipse cx="72" cy="190" rx="48" ry="8" fill="#27313b" opacity="0.55" />
      <path d="M34 179 h78 q10 0 14 9 q-49 12 -102 0 q2 -9 10 -9Z" fill="#6b7480" stroke="#dfe6ee" strokeWidth="1" />
      <rect x="68" y="20" width="8" height="162" rx="4" fill="url(#standSteel)" />
      <path d="M72 35 h46 q7 0 7 7 q0 7 -7 7 h-46Z" fill="url(#standSteel)" stroke="#edf2f7" strokeWidth="0.8" />
      <circle cx="72" cy="42" r="9" fill="#56616b" stroke="#e5ecf2" strokeWidth="1.2" />
      <path d="M115 42 q18 8 0 18" fill="none" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
      <path d="M116 42 q14 8 0 16" fill="none" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M75 72 h34 q7 0 7 6 q0 6 -7 6 h-34Z" fill="url(#standSteel)" opacity="0.95" />
      <path d="M108 78 l24 -11 M108 79 l24 11" stroke="#cfd8e3" strokeWidth="4" strokeLinecap="round" />
      <path d="M108 78 l24 -11 M108 79 l24 11" stroke="#4b5563" strokeWidth="1" strokeLinecap="round" />
      <path d="M62 24 q7 -9 18 0" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.48" />
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
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={angle}
            x1="50"
            y1="50"
            x2="50"
            y2="35"
            stroke="#ffcc00"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          >
            <animate attributeName="y2" values="50;35;50" dur="0.25s" repeatCount="1" />
            <animate attributeName="opacity" values="1;0" dur="0.25s" repeatCount="1" />
          </line>
        ))}
      </g>
    </svg>
  );
}
