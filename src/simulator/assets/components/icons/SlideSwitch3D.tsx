import React from "react";

const SlideSwitch3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* Main housing */}
      <linearGradient id="ss_bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#5D6D7E" />
        <stop offset="20%"  stopColor="#AAB7B8" />
        <stop offset="55%"  stopColor="#2E4053" />
        <stop offset="100%" stopColor="#1C2833" />
      </linearGradient>
      {/* Top face */}
      <linearGradient id="ss_topGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#717D7E" />
        <stop offset="40%"  stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#5D6D7E" />
      </linearGradient>
      {/* Slider knob */}
      <linearGradient id="ss_knobGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#F0F3F4" />
        <stop offset="35%"  stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#AAB7B8" />
      </linearGradient>
      {/* Track groove */}
      <linearGradient id="ss_trackGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1C2833" />
        <stop offset="100%" stopColor="#2E4053" />
      </linearGradient>
      {/* Pin */}
      <linearGradient id="ss_pinGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#717D7E" />
        <stop offset="50%"  stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="ss_shadow">
        <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* 3 pins at bottom */}
    <rect x="32"  y="68" width="6" height="20" rx="2" fill="url(#ss_pinGrad)" />
    <rect x="67"  y="68" width="6" height="20" rx="2" fill="url(#ss_pinGrad)" />
    <rect x="102" y="68" width="6" height="20" rx="2" fill="url(#ss_pinGrad)" />

    {/* Housing side depth */}
    <rect x="10" y="55" width="120" height="16" rx="4" fill="#1C2833" />

    {/* Housing main body */}
    <rect x="10" y="18" width="120" height="40" rx="6" fill="url(#ss_bodyGrad)" filter="url(#ss_shadow)" />

    {/* Top face plate */}
    <rect x="10" y="18" width="120" height="14" rx="6" fill="url(#ss_topGrad)" />

    {/* Top shine */}
    <rect x="12" y="19" width="116" height="5" rx="3" fill="#FDFEFE" opacity="0.2" />

    {/* Slider track groove */}
    <rect x="22" y="30" width="96" height="14" rx="7" fill="url(#ss_trackGrad)" />

    {/* Track inner highlight */}
    <rect x="24" y="32" width="92" height="4" rx="2" fill="#111" opacity="0.5" />

    {/* ON / OFF labels */}
    <text x="38"  y="43" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#AAB7B8" opacity="0.8">ON</text>
    <text x="102" y="43" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#AAB7B8" opacity="0.8">OFF</text>

    {/* Slider knob — positioned at ON (left) */}
    <rect x="26" y="27" width="30" height="20" rx="5" fill="url(#ss_knobGrad)" filter="url(#ss_shadow)" />
    {/* Knob grip lines */}
    <rect x="37" y="30" width="2" height="14" rx="1" fill="#AAB7B8" opacity="0.6" />
    <rect x="42" y="30" width="2" height="14" rx="1" fill="#AAB7B8" opacity="0.6" />
    <rect x="47" y="30" width="2" height="14" rx="1" fill="#AAB7B8" opacity="0.6" />
    {/* Knob top shine */}
    <rect x="28" y="28" width="26" height="5" rx="3" fill="#FDFEFE" opacity="0.5" />
  </svg>
);

export default SlideSwitch3D;
 