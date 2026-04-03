import React from "react";

const BatteryAA3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* Cylindrical body gradient (top-to-bottom for 3D round effect) */}
      <linearGradient id="aa_bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#5D6D7E" />
        <stop offset="18%"  stopColor="#D5D8DC" />
        <stop offset="50%"  stopColor="#2E4053" />
        <stop offset="82%"  stopColor="#1C2833" />
        <stop offset="100%" stopColor="#5D6D7E" />
      </linearGradient>
      {/* Label white wrap */}
      <linearGradient id="aa_labelGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#FDFEFE" />
        <stop offset="50%"  stopColor="#EBF5FB" />
        <stop offset="100%" stopColor="#D6EAF8" />
      </linearGradient>
      {/* Metal end caps */}
      <linearGradient id="aa_capGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#D5D8DC" />
        <stop offset="40%"  stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      {/* Positive nub */}
      <linearGradient id="aa_nubGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#AAB7B8" />
      </linearGradient>
      <filter id="aa_shadow">
        <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* Main cylindrical body */}
    <rect x="18" y="8" width="118" height="44" rx="10" fill="url(#aa_bodyGrad)" filter="url(#aa_shadow)" />

    {/* Label wrap in the middle */}
    <rect x="38" y="9" width="78" height="42" rx="2" fill="url(#aa_labelGrad)" />

    {/* Red brand stripe */}
    <rect x="38" y="9" width="78" height="9" rx="2" fill="#E74C3C" opacity="0.9" />

    {/* AA text */}
    <text x="77" y="36" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#1A5276">AA</text>

    {/* 1.5V text */}
    <text x="77" y="47" fontSize="8" textAnchor="middle" fill="#5D6D7E">1.5V</text>

    {/* Left end cap (negative) */}
    <rect x="8" y="10" width="14" height="40" rx="6" fill="url(#aa_capGrad)" />
    <text x="15" y="34" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#717D7E">−</text>

    {/* Right end cap (positive base) */}
    <rect x="134" y="10" width="14" height="40" rx="6" fill="url(#aa_capGrad)" />

    {/* Positive nub */}
    <rect x="148" y="22" width="8" height="16" rx="4" fill="url(#aa_nubGrad)" />
    <text x="152" y="34" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#717D7E">+</text>

    {/* Top shine highlight */}
    <rect x="20" y="9" width="116" height="7" rx="5" fill="#FDFEFE" opacity="0.18" />
  </svg>
);

export default BatteryAA3D;
