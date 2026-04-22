const ledSVG = `
<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="l_glow" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#FF6B6B"/>
      <stop offset="50%" stop-color="#E74C3C"/>
      <stop offset="100%" stop-color="#922B21"/>
    </radialGradient>
  </defs>

  <rect x="32" y="105" width="7" height="42" rx="3" fill="#aaa"/>
  <rect x="61" y="105" width="7" height="42" rx="3" fill="#aaa"/>
  <ellipse cx="50" cy="60" rx="30" ry="34" fill="url(#l_glow)"/>
</svg>
`;

export default ledSVG;