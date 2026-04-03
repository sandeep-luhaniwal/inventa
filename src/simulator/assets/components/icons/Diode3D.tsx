import React from "react";

const Diode3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* Glass body — top-to-bottom for cylindrical 3D look */}
      <linearGradient id="d_bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#AAB7B8" />
        <stop offset="20%"  stopColor="#FDFEFE" />
        <stop offset="50%"  stopColor="#D5D8DC" />
        <stop offset="80%"  stopColor="#717D7E" />
        <stop offset="100%" stopColor="#AAB7B8" />
      </linearGradient>
      {/* Cathode black band */}
      <linearGradient id="d_bandGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#555" />
        <stop offset="40%"  stopColor="#222" />
        <stop offset="100%" stopColor="#444" />
      </linearGradient>
      {/* Wire leads */}
      <linearGradient id="d_wireGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#D5D8DC" />
        <stop offset="50%"  stopColor="#AAB7B8" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="d_shadow">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Left wire lead (anode) */}
    <rect x="0" y="23" width="28" height="5" rx="2" fill="url(#d_wireGrad)" />

    {/* Right wire lead (cathode) */}
    <rect x="92" y="23" width="28" height="5" rx="2" fill="url(#d_wireGrad)" />

    {/* Glass cylindrical body */}
    <rect x="26" y="10" width="68" height="30" rx="14" fill="url(#d_bodyGrad)" filter="url(#d_shadow)" />

    {/* Top shine */}
    <rect x="28" y="11" width="64" height="8" rx="6" fill="#FDFEFE" opacity="0.45" />

    {/* Cathode band (right side) */}
    <rect x="78" y="10" width="12" height="30" rx="3" fill="url(#d_bandGrad)" />

    {/* Anode label */}
    <text x="50" y="30" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#5D6D7E" opacity="0.85">1N4007</text>
  </svg>
);

export default Diode3D;
