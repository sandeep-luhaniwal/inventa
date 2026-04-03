import React from "react";

const LED3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="l_glow" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="50%" stopColor="#E74C3C" />
        <stop offset="100%" stopColor="#922B21" />
      </radialGradient>
      <radialGradient id="l_domeTop" cx="38%" cy="30%" r="55%">
        <stop offset="0%" stopColor="#FDFEFE" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#E74C3C" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="l_base" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#717D7E" />
        <stop offset="40%" stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <linearGradient id="l_pinGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#717D7E" />
        <stop offset="50%" stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="l_shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.4" />
      </filter>
      <filter id="l_glowFilter">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <rect x="32" y="105" width="7" height="42" rx="3" fill="url(#l_pinGrad)" />
    <rect x="61" y="105" width="7" height="42" rx="3" fill="url(#l_pinGrad)" />
    <rect x="18" y="88" width="64" height="18" rx="5" fill="url(#l_base)" />
    <ellipse cx="50" cy="88" rx="32" ry="7" fill="#D5D8DC" />
    <ellipse cx="50" cy="52" rx="34" ry="38" fill="#E74C3C" opacity="0.25" filter="url(#l_glowFilter)" />
    <ellipse cx="50" cy="60" rx="30" ry="34" fill="url(#l_glow)" filter="url(#l_shadow)" />
    <ellipse cx="50" cy="88" rx="30" ry="7" fill="#922B21" />
    <ellipse cx="40" cy="44" rx="12" ry="16" fill="url(#l_domeTop)" />
  </svg>
);

export default LED3D;