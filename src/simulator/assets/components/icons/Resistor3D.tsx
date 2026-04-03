import React from "react";

const Resistor3D = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="r_bodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F9E07A" />
        <stop offset="40%" stopColor="#F4D03F" />
        <stop offset="100%" stopColor="#B7950B" />
      </linearGradient>
      <linearGradient id="r_wireGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D5D8DC" />
        <stop offset="50%" stopColor="#AAB7B8" />
        <stop offset="100%" stopColor="#717D7E" />
      </linearGradient>
      <filter id="r_shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.35" />
      </filter>
    </defs>
    <rect x="0" y="27" width="30" height="6" rx="3" fill="url(#r_wireGrad)" />
    <rect x="90" y="27" width="30" height="6" rx="3" fill="url(#r_wireGrad)" />
    <rect x="28" y="13" width="64" height="34" rx="10" fill="url(#r_bodyGrad)" filter="url(#r_shadow)" />
    <rect x="32" y="14" width="56" height="8" rx="6" fill="#FEF9E7" opacity="0.5" />
    <rect x="42" y="13" width="6" height="34" rx="1" fill="#C0392B" opacity="0.9" />
    <rect x="54" y="13" width="6" height="34" rx="1" fill="#1E8449" opacity="0.9" />
    <rect x="66" y="13" width="6" height="34" rx="1" fill="#1A5276" opacity="0.9" />
    <rect x="78" y="13" width="4" height="34" rx="1" fill="#B7950B" opacity="0.9" />
  </svg>
);

export default Resistor3D;