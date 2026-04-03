import React from "react";

const MotorDC3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* Main cylindrical body — top-to-bottom for 3D round look */}
      <linearGradient id="m_bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#5D6D7E" />
        <stop offset="15%"  stopColor="#AAB7B8" />
        <stop offset="45%"  stopColor="#2C3E50" />
        <stop offset="80%"  stopColor="#1C2833" />
        <stop offset="100%" stopColor="#5D6D7E" />
      </linearGradient>
      {/* End cap */}
      <linearGradient id="m_capGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#AAB7B8" />
        <stop offset="40%"  stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      {/* Shaft */}
      <linearGradient id="m_shaftGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#D5D8DC" />
        <stop offset="50%"  stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      {/* Wire terminals */}
      <linearGradient id="m_termGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#D5D8DC" />
        <stop offset="50%"  stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#AAB7B8" />
      </linearGradient>
      {/* Label */}
      <linearGradient id="m_labelGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#FDFEFE" />
        <stop offset="100%" stopColor="#EBF5FB"  />
      </linearGradient>
      <filter id="m_shadow">
        <feDropShadow dx="2" dy="3" stdDeviation="2.5" floodOpacity="0.45" />
      </filter>
    </defs>

    {/* Shaft (left side) */}
    <rect x="0" y="44" width="28" height="12" rx="5" fill="url(#m_shaftGrad)" />
    <rect x="0" y="46" width="28" height="4"  rx="2" fill="#FDFEFE" opacity="0.4" />

    {/* Left end cap */}
    <rect x="24" y="18" width="16" height="64" rx="6" fill="url(#m_capGrad)" />

    {/* Main cylindrical body */}
    <rect x="38" y="12" width="86" height="76" rx="10" fill="url(#m_bodyGrad)" filter="url(#m_shadow)" />

    {/* Top shine */}
    <rect x="40" y="13" width="82" height="12" rx="6" fill="#FDFEFE" opacity="0.12" />

    {/* Ventilation slots */}
    <rect x="50" y="20" width="4" height="60" rx="2" fill="#111" opacity="0.35" />
    <rect x="60" y="20" width="4" height="60" rx="2" fill="#111" opacity="0.35" />
    <rect x="70" y="20" width="4" height="60" rx="2" fill="#111" opacity="0.35" />
    <rect x="80" y="20" width="4" height="60" rx="2" fill="#111" opacity="0.35" />
    <rect x="90" y="20" width="4" height="60" rx="2" fill="#111" opacity="0.35" />
    <rect x="100" y="20" width="4" height="60" rx="2" fill="#111" opacity="0.35" />

    {/* Label plate */}
    <rect x="48" y="32" width="64" height="36" rx="4" fill="url(#m_labelGrad)" opacity="0.88" />

    {/* DC MOTOR text */}
    <text x="80" y="52" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#1A5276">DC MOTOR</text>
    <text x="80" y="63" fontSize="8"  textAnchor="middle" fill="#5D6D7E">3-6V</text>

    {/* Right end cap */}
    <rect x="122" y="18" width="14" height="64" rx="6" fill="url(#m_capGrad)" />

    {/* Terminal block on right */}
    <rect x="134" y="28" width="16" height="44" rx="4" fill="#2E4053" />

    {/* Terminal 1 — positive */}
    <rect x="136" y="32" width="12" height="14" rx="3" fill="url(#m_termGrad)" />
    <text x="142" y="42" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#E74C3C">+</text>

    {/* Terminal 2 — negative */}
    <rect x="136" y="54" width="12" height="14" rx="3" fill="url(#m_termGrad)" />
    <text x="142" y="64" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#2980B9">−</text>
  </svg>
);

export default MotorDC3D;
