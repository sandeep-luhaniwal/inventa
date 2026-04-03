import React from "react";

const PushButton3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* PCB body */}
      <linearGradient id="pb_bodyGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#1E8449" />
        <stop offset="40%"  stopColor="#27AE60" />
        <stop offset="100%" stopColor="#145A32" />
      </linearGradient>
      {/* Button cap top */}
      <radialGradient id="pb_capGrad" cx="38%" cy="35%" r="60%">
        <stop offset="0%"   stopColor="#F5B7B1" />
        <stop offset="40%"  stopColor="#E74C3C" />
        <stop offset="100%" stopColor="#922B21" />
      </radialGradient>
      {/* Button cap side */}
      <linearGradient id="pb_capSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#C0392B" />
        <stop offset="100%" stopColor="#7B241C" />
      </linearGradient>
      {/* Body side walls */}
      <linearGradient id="pb_sideGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#2E4053" />
        <stop offset="100%" stopColor="#1C2833" />
      </linearGradient>
      {/* Pin gradient */}
      <linearGradient id="pb_pinGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#717D7E" />
        <stop offset="50%"  stopColor="#D5D8DC" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="pb_shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="2" floodOpacity="0.4" />
      </filter>
    </defs>

    {/* 4 pins — two left, two right */}
    <rect x="18" y="90" width="5" height="28" rx="2" fill="url(#pb_pinGrad)" />
    <rect x="30" y="90" width="5" height="28" rx="2" fill="url(#pb_pinGrad)" />
    <rect x="65" y="90" width="5" height="28" rx="2" fill="url(#pb_pinGrad)" />
    <rect x="77" y="90" width="5" height="28" rx="2" fill="url(#pb_pinGrad)" />

    {/* Body side (3D depth) */}
    <rect x="14" y="72" width="72" height="20" rx="3" fill="url(#pb_sideGrad)" />

    {/* PCB top face */}
    <rect x="14" y="52" width="72" height="22" rx="4" fill="url(#pb_bodyGrad)" filter="url(#pb_shadow)" />

    {/* PCB shine */}
    <rect x="16" y="53" width="68" height="6" rx="3" fill="#FDFEFE" opacity="0.1" />

    {/* PCB corner pads */}
    <circle cx="24" cy="63" r="5" fill="#D4AC0D" opacity="0.9" />
    <circle cx="76" cy="63" r="5" fill="#D4AC0D" opacity="0.9" />
    <circle cx="24" cy="63" r="2.5" fill="#1C2833" />
    <circle cx="76" cy="63" r="2.5" fill="#1C2833" />

    {/* Button stem */}
    <rect x="40" y="36" width="20" height="18" rx="4" fill="url(#pb_capSide)" />

    {/* Button cap top */}
    <ellipse cx="50" cy="36" rx="14" ry="6" fill="url(#pb_capGrad)" filter="url(#pb_shadow)" />

    {/* Button cap shine */}
    <ellipse cx="44" cy="33" rx="5" ry="3" fill="#FDFEFE" opacity="0.4" />
  </svg>
);

export default PushButton3D;
