import React from "react";

const Battery9V3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="b_bodyGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1C2833" />
        <stop offset="25%" stopColor="#2E4053" />
        <stop offset="55%" stopColor="#5D6D7E" />
        <stop offset="100%" stopColor="#1C2833" />
      </linearGradient>
      <linearGradient id="b_topGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#717D7E" />
        <stop offset="40%" stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <linearGradient id="b_labelGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#E8F4FD" />
        <stop offset="50%" stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#E8F4FD" />
      </linearGradient>
      <linearGradient id="b_termGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#717D7E" />
        <stop offset="50%" stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="b_shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="2.5" floodOpacity="0.45" />
      </filter>
    </defs>

    {/* Body */}
    <rect x="14" y="38" width="72" height="100" rx="8" fill="url(#b_bodyGrad)" filter="url(#b_shadow)" />

    {/* Top cap */}
    <rect x="14" y="30" width="72" height="14" rx="5" fill="url(#b_topGrad)" />
    <ellipse cx="50" cy="30" rx="36" ry="5" fill="#D5D8DC" opacity="0.6" />

    {/* Negative terminal (–) */}
    <rect x="26" y="18" width="18" height="14" rx="4" fill="url(#b_termGrad)" />
    <text x="35" y="29" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#1C2833">−</text>

    {/* Positive terminal (+) */}
    <rect x="56" y="14" width="18" height="18" rx="4" fill="url(#b_termGrad)" />
    <text x="65" y="27" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#1C2833">+</text>

    {/* Label background */}
    <rect x="20" y="55" width="60" height="52" rx="4" fill="url(#b_labelGrad)" opacity="0.92" />

    {/* 9V text */}
    <text x="50" y="88" fontSize="22" fontWeight="bold" textAnchor="middle" fill="#1A5276">9V</text>

    {/* Brand line */}
    <rect x="24" y="60" width="52" height="6" rx="2" fill="#E74C3C" opacity="0.85" />

    {/* Bottom shine */}
    <rect x="14" y="120" width="72" height="10" rx="4" fill="#FDFEFE" opacity="0.07" />

    {/* Side highlight */}
    <rect x="14" y="38" width="12" height="100" rx="4" fill="#FDFEFE" opacity="0.08" />
  </svg>
);

export default Battery9V3D;
