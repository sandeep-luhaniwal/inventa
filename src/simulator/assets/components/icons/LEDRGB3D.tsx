import React from "react";

const LEDRGB3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* RGB radial glow inside dome */}
      <radialGradient id="rgb_glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="30%"  stopColor="#FF4444" stopOpacity="0.7" />
        <stop offset="60%"  stopColor="#44FF44" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#4444FF" stopOpacity="0.8" />
      </radialGradient>
      {/* Dome highlight */}
      <radialGradient id="rgb_domeTop" cx="36%" cy="28%" r="50%">
        <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"   />
      </radialGradient>
      {/* Outer glow halo */}
      <radialGradient id="rgb_halo" cx="50%" cy="55%" r="55%">
        <stop offset="0%"   stopColor="#CC44FF" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#CC44FF" stopOpacity="0"   />
      </radialGradient>
      {/* Base gradient */}
      <linearGradient id="rgb_base" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#717D7E" />
        <stop offset="40%"  stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      {/* Pin gradient */}
      <linearGradient id="rgb_pin" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#717D7E" />
        <stop offset="50%"  stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="rgb_shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.4" />
      </filter>
      <filter id="rgb_glowBlur">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* 4 pins — R, G, B, GND (common cathode, longest) */}
    <rect x="14" y="108" width="6" height="46" rx="2" fill="url(#rgb_pin)" />
    <rect x="26" y="108" width="6" height="40" rx="2" fill="url(#rgb_pin)" />
    <rect x="68" y="108" width="6" height="40" rx="2" fill="url(#rgb_pin)" />
    <rect x="80" y="108" width="6" height="46" rx="2" fill="url(#rgb_pin)" />

    {/* Pin color dots at bottom */}
    <circle cx="17" cy="154" r="3" fill="#E74C3C" opacity="0.9" />
    <circle cx="29" cy="148" r="3" fill="#27AE60" opacity="0.9" />
    <circle cx="71" cy="148" r="3" fill="#2980B9" opacity="0.9" />
    <circle cx="83" cy="154" r="3" fill="#717D7E" opacity="0.9" />

    {/* Base */}
    <rect x="10" y="90" width="80" height="20" rx="5" fill="url(#rgb_base)" />
    <ellipse cx="50" cy="90" rx="40" ry="7" fill="#D5D8DC" />
    <ellipse cx="50" cy="110" rx="40" ry="7" fill="#5D6D7E" />

    {/* Outer halo glow */}
    <ellipse cx="50" cy="55" rx="42" ry="46" fill="url(#rgb_halo)" filter="url(#rgb_glowBlur)" />

    {/* Dome body */}
    <ellipse cx="50" cy="62" rx="36" ry="40" fill="url(#rgb_glow)" filter="url(#rgb_shadow)" />

    {/* Dome bottom rim */}
    <ellipse cx="50" cy="90" rx="36" ry="8" fill="#2C3E50" opacity="0.5" />

    {/* RGB color sectors inside dome */}
    <ellipse cx="35" cy="55" rx="14" ry="18" fill="#FF3333" opacity="0.35" />
    <ellipse cx="50" cy="48" rx="14" ry="18" fill="#33FF33" opacity="0.30" />
    <ellipse cx="65" cy="55" rx="14" ry="18" fill="#3333FF" opacity="0.35" />

    {/* Dome shine */}
    <ellipse cx="38" cy="42" rx="13" ry="17" fill="url(#rgb_domeTop)" />
  </svg>
);

export default LEDRGB3D;
