import React from "react";

const Capacitor3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="c_bodyGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1A5276" />
        <stop offset="30%" stopColor="#2E86C1" />
        <stop offset="60%" stopColor="#5DADE2" />
        <stop offset="100%" stopColor="#1A5276" />
      </linearGradient>
      <linearGradient id="c_topGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#717D7E" />
        <stop offset="40%" stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <linearGradient id="c_pinGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#717D7E" />
        <stop offset="50%" stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="c_shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="33" y="108" width="8" height="38" rx="3" fill="url(#c_pinGrad)" />
    <rect x="59" y="108" width="8" height="38" rx="3" fill="url(#c_pinGrad)" />
    <rect x="15" y="30" width="70" height="80" rx="12" fill="url(#c_bodyGrad)" filter="url(#c_shadow)" />
    <ellipse cx="50" cy="110" rx="35" ry="9" fill="#154360" />
    <ellipse cx="50" cy="30" rx="35" ry="9" fill="url(#c_topGrad)" />
    <ellipse cx="50" cy="30" rx="20" ry="5" fill="#FDFEFE" opacity="0.3" />
    <rect x="15" y="55" width="70" height="18" rx="4" fill="#FDFEFE" opacity="0.12" />
    <rect x="15" y="38" width="14" height="64" fill="#D5D8DC" opacity="0.15" />
    <text x="19" y="76" fontSize="18" fontWeight="bold" fill="#FDFEFE" opacity="0.7">−</text>
  </svg>
);

export default Capacitor3D;