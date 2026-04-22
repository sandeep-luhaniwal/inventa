/**
 * Static component registry used by the simulator palette and canvas.
 *
 * Each entry carries:
 *  - id / name / category   -> metadata shown in the palette
 *  - svgBody                -> raw SVG string used to build a data URL for Konva
 *  - viewBox                -> width x height of the SVG coordinate space
 *  - relativePins           -> pin positions as fractions of the viewBox (0-1)
 */

export interface StaticPin {
  name: string;
  relX: number;
  relY: number;
  type?: string;
}

export interface StaticComponentDef {
  id: string;
  name: string;
  category: string;
  viewBoxW: number;
  viewBoxH: number;
  svgBody: string;
  litSvgBody?: string;
  relativePins: StaticPin[];
  ledColor?: string;
}

export function svgToDataUrl(def: StaticComponentDef, lit = false, outlined = false): string {
  const body = (lit && def.litSvgBody) ? def.litSvgBody : def.svgBody;
  const outlineDefs = outlined
    ? `<defs>
         <filter id="component_outline" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
           <feDropShadow dx="1.5" dy="0" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="-1.5" dy="0" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="0" dy="1.5" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="0" dy="-1.5" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="1.05" dy="1.05" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="-1.05" dy="1.05" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="1.05" dy="-1.05" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
           <feDropShadow dx="-1.05" dy="-1.05" stdDeviation="0.2" flood-color="#3b82f6" flood-opacity="1"/>
         </filter>
       </defs>`
    : "";
  const wrappedBody = outlined ? `<g filter="url(#component_outline)">${body}</g>` : body;
  const svg = `<svg viewBox="0 0 ${def.viewBoxW} ${def.viewBoxH}" xmlns="http://www.w3.org/2000/svg">${outlineDefs}${wrappedBody}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const BB_SPACING = 20;
const BB_PAD_X = 24;
const BB_PAD_TOP = 28;
const BB_RAIL_DIST = 18; // Dist between + and - rails
const BB_RAIL_TO_GRID = 34; // Gap between rails and main grid
const BB_GAP_Y = 24; // Center DIP gap
const BB_ROWS = 30; // Standard full size

// Calculate vertical positions
const BB_TOP_N_Y = BB_PAD_TOP;
const BB_TOP_P_Y = BB_TOP_N_Y + BB_RAIL_DIST;
const BB_GRID_TOP_Y = BB_TOP_P_Y + BB_RAIL_TO_GRID;
const BB_GRID_BOT_Y = BB_GRID_TOP_Y + 4 * BB_SPACING + BB_GAP_Y;
const BB_BOT_N_Y = BB_GRID_BOT_Y + 4 * BB_SPACING + BB_RAIL_TO_GRID;
const BB_BOT_P_Y = BB_BOT_N_Y + BB_RAIL_DIST;

const BB_W = BB_PAD_X * 2 + (BB_ROWS - 1) * BB_SPACING;
const BB_H = BB_BOT_P_Y + BB_PAD_TOP;

function buildBreadboardPins(): StaticPin[] {
  const pins: StaticPin[] = [];
  for (let r = 1; r <= BB_ROWS; r++) {
    const lx = BB_PAD_X + (r - 1) * BB_SPACING;
    
    // Top Power Rails
    pins.push({ name: `Top +${r}`, relX: lx / BB_W, relY: BB_TOP_P_Y / BB_H, type: 'TP' });
    pins.push({ name: `Top -${r}`, relX: lx / BB_W, relY: BB_TOP_N_Y / BB_H, type: 'TN' });

    // Top Grid (j-f)
    ["j", "i", "h", "g", "f"].forEach((col, ci) => {
      pins.push({ name: `${col}${r}`, relX: lx / BB_W, relY: (BB_GRID_TOP_Y + ci * BB_SPACING) / BB_H, type: `T${r}` });
    });
    
    // Bottom Grid (e-a)
    ["e", "d", "c", "b", "a"].forEach((col, ci) => {
      pins.push({ name: `${col}${r}`, relX: lx / BB_W, relY: (BB_GRID_BOT_Y + ci * BB_SPACING) / BB_H, type: `B${r}` });
    });

    // Bottom Power Rails
    pins.push({ name: `Bot -${r}`, relX: lx / BB_W, relY: BB_BOT_N_Y / BB_H, type: 'BN' });
    pins.push({ name: `Bot +${r}`, relX: lx / BB_W, relY: BB_BOT_P_Y / BB_H, type: 'BP' });
  }
  return pins;
}

export const STATIC_COMPONENTS: StaticComponentDef[] = [
  
  {
    id: "resistor",
    name: "Resistor",
    category: "Passive",
    viewBoxW: 120,
    viewBoxH: 60,
    svgBody: `
      <defs>
        <linearGradient id="r_bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f6ff4cff"/>
          <stop offset="40%" stop-color="#e8eb49ff"/>
          <stop offset="100%" stop-color="#f7f477ff"/>
        </linearGradient>
        <linearGradient id="r_wireGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#D5D8DC"/>
          <stop offset="50%" stop-color="#AAB7B8"/>
          <stop offset="100%" stop-color="#717D7E"/>
        </linearGradient>
        <filter id="r_shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Metallic Leads -->
      <rect x="0" y="27" width="30" height="6" rx="3" fill="url(#r_wireGrad)"/>
      <rect x="90" y="27" width="30" height="6" rx="3" fill="url(#r_wireGrad)"/>
      
      <!-- Curvy Ceramic Body -->
      <path d="M 28 30 
               C 28 8, 40 8, 45 15 
               L 75 15 
               C 80 8, 92 8, 92 30 
               C 92 52, 80 52, 75 45 
               L 45 45 
               C 40 52, 28 52, 28 30 Z" 
            fill="url(#r_bodyGrad)" filter="url(#r_shadow)"/>
      
      <!-- Color Bands -->
      <rect x="36" y="10" width="6" height="40" rx="1" fill="#C0392B" opacity="0.9"/>
      <rect x="50" y="14" width="6" height="32" rx="1" fill="#1E8449" opacity="0.9"/>
      <rect x="64" y="14" width="6" height="32" rx="1" fill="#1A5276" opacity="0.9"/>
      <rect x="78" y="10" width="5" height="40" rx="1" fill="#817c3bff" opacity="0.9"/>
    `,
    relativePins: [
      { name: "Lead 1", relX: 0, relY: 30 / 60 },
      { name: "Lead 2", relX: 1, relY: 30 / 60 },
    ],
  },
  ...(["red", "orange", "blue", "white"] as const).map((color) => {
    const palette: Record<string, { dome: string[]; lit: string[]; dark: string; litDark: string; glow: string }> = {
      red:    { dome: ["#FF6B6B", "#E74C3C", "#922B21"], lit: ["#FFFFFF", "#FF4444", "#CC0000"], dark: "#922B21", litDark: "#FF2222", glow: "#f87171" },
      orange: { dome: ["#e9eb7fff", "#F97316", "#9A3412"], lit: ["#FFFFFF", "#FF8C00", "#CC5500"], dark: "#9A3412", litDark: "#FF7700", glow: "#fb923c" },
      blue:   { dome: ["#93C5FD", "#3B82F6", "#1E3A8A"], lit: ["#FFFFFF", "#60A5FA", "#1D4ED8"], dark: "#1E3A8A", litDark: "#3B82F6", glow: "#60a5fa" },
      white:  { dome: ["#F8FAFC", "#E2E8F0", "#94A3B8"], lit: ["#FFFFFF", "#F8FAFC", "#E2E8F0"], dark: "#94A3B8", litDark: "#FFFFFF", glow: "#f1f5f9" },
    };
    const p = palette[color];
    const uid = `l_${color}`;
    const sharedDefs = (stops: string[], litMode: boolean) => `
      <defs>
        <radialGradient id="${uid}_glow" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="${stops[0]}"/>
          <stop offset="50%" stop-color="${stops[1]}"/>
          <stop offset="100%" stop-color="${stops[2]}"/>
        </radialGradient>
        <radialGradient id="${uid}_domeTop" cx="38%" cy="30%" r="55%">
          <stop offset="0%" stop-color="#FDFEFE" stop-opacity="${litMode ? 1 : 0.7}"/>
          <stop offset="100%" stop-color="${stops[1]}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${uid}_base" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#717D7E"/>
          <stop offset="40%" stop-color="#D5D8DC"/>
          <stop offset="100%" stop-color="#717D7E"/>
        </linearGradient>
        <linearGradient id="${uid}_pin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#717D7E"/>
          <stop offset="50%" stop-color="#D5D8DC"/>
          <stop offset="100%" stop-color="#717D7E"/>
        </linearGradient>
        <filter id="${uid}_shadow">
          <feDropShadow dx="2" dy="3" stdDeviation="${litMode ? 5 : 2}" flood-color="${stops[1]}" flood-opacity="${litMode ? 0.9 : 0.4}"/>
        </filter>
        ${litMode ? `<filter id="${uid}_outerGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ""}
      </defs>`;
    const sharedBody = (dark: string, litMode: boolean) => `
      <!-- Leads -->
      <!-- Left Lead (Anode, Bent) -->
      <path d="M 38 100 L 38 115 L 28 125 L 28 145" stroke="url(#${uid}_pin)" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Right Lead (Cathode, Straight) -->
      <rect x="58" y="100" width="8" height="45" rx="4" fill="url(#${uid}_pin)"/>
      
      <!-- Rim -->
      <path d="M 22 90 L 78 90 A 28 10 0 0 1 78 105 L 22 105 A 28 10 0 0 1 22 90 Z" fill="url(#${uid}_base)"/>
      <path d="M 22 90 L 78 90 A 28 10 0 0 1 78 100 L 22 100 A 28 10 0 0 1 22 90 Z" fill="${dark}" opacity="0.6"/>

      <!-- Dome -->
      <path d="M 25 90 L 75 90 L 75 45 A 25 25 0 0 0 25 45 Z" fill="url(#${uid}_glow)" filter="url(#${uid}_shadow)" ${litMode ? `filter="url(#${uid}_outerGlow)"` : ""}/>
      
      <!-- Highlight -->
      <ellipse cx="40" cy="40" rx="10" ry="15" fill="url(#${uid}_domeTop)"/>`;
    return {
      id: `led_${color}`,
      name: `LED ${color.charAt(0).toUpperCase() + color.slice(1)}`,
      category: "Indicators",
      ledColor: color,
      viewBoxW: 100,
      viewBoxH: 150,
      svgBody: sharedDefs(p.dome, false) + sharedBody(p.dark, false),
      litSvgBody: sharedDefs(p.lit, true) + sharedBody(p.litDark, true),
      relativePins: [
        { name: "Anode (+)", relX: 28 / 100, relY: 145 / 150, type: "anode" },
        { name: "Cathode (-)", relX: 62 / 100, relY: 145 / 150, type: "cathode" },
      ],
    } satisfies StaticComponentDef;
  }),
  {
    id: "battery9v",
    name: "Battery 9V",
    category: "Power",
    viewBoxW: 100,
    viewBoxH: 180,
    svgBody: `
      <defs>
        <linearGradient id="b_copper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#A0522D"/>
          <stop offset="45%" stop-color="#CD853F"/>
          <stop offset="100%" stop-color="#8B4513"/>
        </linearGradient>
      </defs>
      <!-- Main Case -->
      <rect x="10" y="55" width="80" height="120" rx="6" fill="#212F3D"/>
      
      <!-- Copper Top -->
      <path d="M 10 61 A 6 6 0 0 1 16 55 L 84 55 A 6 6 0 0 1 90 61 L 90 100 L 10 100 Z" fill="url(#b_copper)"/>
      
      <!-- Terminals (from reference image) -->
      <!-- Left Terminal (Tapered) -->
      <path d="M 20 55 L 46 55 L 42 42 L 24 42 Z" fill="#BDC3C7"/>
      <!-- Right Terminal (Straight) -->
      <rect x="54" y="42" width="26" height="13" fill="#BDC3C7"/>
      
      <!-- Connector Bar -->
      <rect x="14" y="32" width="72" height="10" rx="2" fill="#212F3D"/>
      
      <!-- Red/Black Caps (Pins) -->
      <!-- Red Cap (Positive) -->
      <path d="M 31 32 L 39 32 L 41 20 L 29 20 Z" fill="#C0392B"/>
      <rect x="33" y="12" width="4" height="8" rx="1" fill="#7B7D7D"/>
      
      <!-- Black Cap (Negative) -->
      <path d="M 61 32 L 69 32 L 71 20 L 59 20 Z" fill="#1C2833"/>
      <rect x="63" y="12" width="4" height="8" rx="1" fill="#7B7D7D"/>

      <!-- Polarity Symbols -->
      <circle cx="35" cy="78" r="8" fill="#000" opacity="0.2"/>
      <text x="35" y="84" font-size="16" font-weight="bold" text-anchor="middle" fill="#000" opacity="0.5">+</text>
      <circle cx="65" cy="78" r="8" fill="#000" opacity="0.2"/>
      <text x="65" y="84" font-size="16" font-weight="bold" text-anchor="middle" fill="#000" opacity="0.5">−</text>
      
      <!-- Label -->
      <text x="50" y="145" font-size="38" font-weight="bold" text-anchor="middle" fill="#FFFFFF" opacity="0.9">9V</text>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 35 / 100, relY: 12 / 180, type: "positive" },
      { name: "Negative (-)", relX: 65 / 100, relY: 12 / 180, type: "negative" },
    ],
  },
  {
    id: "batteryaa",
    name: "Battery AA",
    category: "Power",
    viewBoxW: 160,
    viewBoxH: 60,
    svgBody: `
      <defs>
        <linearGradient id="aa_bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5D6D7E"/>
          <stop offset="18%" stop-color="#D5D8DC"/>
          <stop offset="50%" stop-color="#2E4053"/>
          <stop offset="82%" stop-color="#1C2833"/>
          <stop offset="100%" stop-color="#5D6D7E"/>
        </linearGradient>
      </defs>
      <rect x="18" y="8" width="118" height="44" rx="10" fill="url(#aa_bodyGrad)"/>
      <rect x="38" y="9" width="78" height="42" rx="2" fill="#FDFEFE"/>
      <rect x="8" y="10" width="14" height="40" rx="6" fill="#D5D8DC"/>
      <rect x="134" y="10" width="14" height="40" rx="6" fill="#D5D8DC"/>
      <rect x="148" y="22" width="8" height="16" rx="4" fill="#FDFEFE"/>
      <text x="77" y="36" font-size="14" font-weight="700" text-anchor="middle" fill="#1A5276">AA</text>
    `,
    relativePins: [
      { name: "Negative (-)", relX: 8 / 160, relY: 30 / 60, type: "negative" },
      { name: "Positive (+)", relX: 156 / 160, relY: 30 / 60, type: "positive" },
    ],
  },
  {
    id: "capacitor",
    name: "Capacitor",
    category: "Passive",
    viewBoxW: 100,
    viewBoxH: 150,
    svgBody: `
      <defs>
        <linearGradient id="c_bodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1A5276"/>
          <stop offset="30%" stop-color="#2E86C1"/>
          <stop offset="60%" stop-color="#5DADE2"/>
          <stop offset="100%" stop-color="#1A5276"/>
        </linearGradient>
      </defs>
      <rect x="33" y="108" width="8" height="38" rx="3" fill="#BFC7CE"/>
      <rect x="59" y="108" width="8" height="38" rx="3" fill="#BFC7CE"/>
      <rect x="15" y="30" width="70" height="80" rx="12" fill="url(#c_bodyGrad)"/>
      <ellipse cx="50" cy="110" rx="35" ry="9" fill="#154360"/>
      <ellipse cx="50" cy="30" rx="35" ry="9" fill="#D5D8DC"/>
      <text x="19" y="76" font-size="18" font-weight="700" fill="#FDFEFE" opacity="0.7">-</text>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 37 / 100, relY: 146 / 150, type: "positive" },
      { name: "Negative (-)", relX: 63 / 100, relY: 146 / 150, type: "negative" },
    ],
  },
  {
    id: "diode",
    name: "Diode",
    category: "Passive",
    viewBoxW: 120,
    viewBoxH: 50,
    svgBody: `
      <rect x="0" y="23" width="28" height="5" rx="2" fill="#AAB7B8"/>
      <rect x="92" y="23" width="28" height="5" rx="2" fill="#AAB7B8"/>
      <rect x="26" y="10" width="68" height="30" rx="14" fill="#D5D8DC"/>
      <rect x="78" y="10" width="12" height="30" rx="3" fill="#444"/>
      <text x="50" y="30" font-size="9" font-weight="700" text-anchor="middle" fill="#5D6D7E">1N4007</text>
    `,
    relativePins: [
      { name: "Anode (+)", relX: 0, relY: 25.5 / 50, type: "anode" },
      { name: "Cathode (-)", relX: 1, relY: 25.5 / 50, type: "cathode" },
    ],
  },
  {
    id: "pushbutton",
    name: "Push Button",
    category: "Switches",
    viewBoxW: 100,
    viewBoxH: 120,
    svgBody: `
      <!-- Metallic Legs -->
      <rect x="18" y="5" width="6" height="25" rx="2" fill="#AAB7B8"/>
      <rect x="76" y="5" width="6" height="25" rx="2" fill="#AAB7B8"/>
      <rect x="18" y="90" width="6" height="25" rx="2" fill="#AAB7B8"/>
      <rect x="76" y="90" width="6" height="25" rx="2" fill="#AAB7B8"/>
      
      <!-- Body -->
      <rect x="10" y="20" width="80" height="80" rx="8" fill="#BDC3C7" stroke="#99A3A4" stroke-width="2"/>
      
      <!-- Corner Rivets -->
      <circle cx="22" cy="32" r="6" fill="#34495E" opacity="0.4"/>
      <circle cx="78" cy="32" r="6" fill="#34495E" opacity="0.4"/>
      <circle cx="22" cy="88" r="6" fill="#34495E" opacity="0.4"/>
      <circle cx="78" cy="88" r="6" fill="#34495E" opacity="0.4"/>
      
      <!-- Central Button -->
      <circle cx="50" cy="60" r="28" fill="#2C3E50" stroke="#1B2631" stroke-width="2"/>
      <circle cx="50" cy="60" r="24" fill="#1B2631" opacity="0.2"/>
    `,
    relativePins: [
      { name: "Terminal 1", relX: 21 / 100, relY: 10 / 120 },
      { name: "Terminal 2", relX: 79 / 100, relY: 10 / 120 },
      { name: "Terminal 3", relX: 21 / 100, relY: 110 / 120 },
      { name: "Terminal 4", relX: 79 / 100, relY: 110 / 120 },
    ],
  },
  {
    id: "slideswitch",
    name: "Slide Switch",
    category: "Switches",
    viewBoxW: 140,
    viewBoxH: 90,
    svgBody: `
      <rect x="32" y="68" width="6" height="20" rx="2" fill="#BFC7CE"/>
      <rect x="67" y="68" width="6" height="20" rx="2" fill="#BFC7CE"/>
      <rect x="102" y="68" width="6" height="20" rx="2" fill="#BFC7CE"/>
      <rect x="10" y="18" width="120" height="40" rx="6" fill="#5D6D7E"/>
      <rect x="22" y="30" width="96" height="14" rx="7" fill="#1C2833"/>
      <rect x="26" y="27" width="30" height="20" rx="5" fill="#FDFEFE"/>
      <text x="38" y="43" font-size="8" font-weight="700" text-anchor="middle" fill="#AAB7B8">ON</text>
      <text x="102" y="43" font-size="8" font-weight="700" text-anchor="middle" fill="#AAB7B8">OFF</text>
    `,
    relativePins: [
      { name: "Common", relX: 35 / 140, relY: 88 / 90 },
      { name: "Position 1", relX: 70 / 140, relY: 88 / 90 },
      { name: "Position 2", relX: 105 / 140, relY: 88 / 90 },
    ],
  },
  {
    id: "breadboard",
    name: "Breadboard",
    category: "Board",
    viewBoxW: BB_W,
    viewBoxH: BB_H,
    svgBody: `
      <rect x="0" y="0" width="${BB_W}" height="${BB_H}" rx="6" fill="#DDDDDD"/>
      <rect x="${BB_PAD_X - 10}" y="${BB_TOP_N_Y - 4}" width="${BB_W - (BB_PAD_X - 10) * 2}" height="${BB_RAIL_DIST + 8}" fill="#E8E8E8" rx="2"/>
      <rect x="${BB_PAD_X - 10}" y="${BB_BOT_N_Y - 4}" width="${BB_W - (BB_PAD_X - 10) * 2}" height="${BB_RAIL_DIST + 8}" fill="#E8E8E8" rx="2"/>
      <rect x="${BB_PAD_X - 10}" y="${BB_GRID_TOP_Y + 4 * BB_SPACING + 10}" width="${BB_W - (BB_PAD_X - 10) * 2}" height="${BB_GAP_Y}" fill="#D0D0D0" rx="2"/>
      
      <!-- +/- Lines -->
      <line x1="${BB_PAD_X}" y1="${BB_TOP_N_Y - 10}" x2="${BB_W - BB_PAD_X}" y2="${BB_TOP_N_Y - 10}" stroke="#2980B9" stroke-width="1" opacity="0.5"/>
      <line x1="${BB_PAD_X}" y1="${BB_TOP_P_Y + 10}" x2="${BB_W - BB_PAD_X}" y2="${BB_TOP_P_Y + 10}" stroke="#E74C3C" stroke-width="1" opacity="0.5"/>
      <line x1="${BB_PAD_X}" y1="${BB_BOT_N_Y - 10}" x2="${BB_W - BB_PAD_X}" y2="${BB_BOT_N_Y - 10}" stroke="#2980B9" stroke-width="1" opacity="0.5"/>
      <line x1="${BB_PAD_X}" y1="${BB_BOT_P_Y + 10}" x2="${BB_W - BB_PAD_X}" y2="${BB_BOT_P_Y + 10}" stroke="#E74C3C" stroke-width="1" opacity="0.5"/>
      ${Array.from({ length: BB_ROWS }, (_, ri) => {
          const lx = BB_PAD_X + ri * BB_SPACING;
          const holes = [];
          holes.push(`<circle cx="${lx}" cy="${BB_TOP_N_Y}" r="3" fill="#333333"/>`);
          holes.push(`<circle cx="${lx}" cy="${BB_TOP_P_Y}" r="3" fill="#333333"/>`);
          holes.push(`<circle cx="${lx}" cy="${BB_BOT_N_Y}" r="3" fill="#333333"/>`);
          holes.push(`<circle cx="${lx}" cy="${BB_BOT_P_Y}" r="3" fill="#333333"/>`);
          for (let ci = 0; ci < 5; ci++) {
            holes.push(`<circle cx="${lx}" cy="${BB_GRID_TOP_Y + ci * BB_SPACING}" r="3" fill="#333333"/>`);
            holes.push(`<circle cx="${lx}" cy="${BB_GRID_BOT_Y + ci * BB_SPACING}" r="3" fill="#333333"/>`);
          }
          return holes.join("");
      }).join("")}
    `,
    relativePins: buildBreadboardPins(),
  },
  {
    id: "led_rgb",
    name: "RGB LED",
    category: "Indicators",
    viewBoxW: 100,
    viewBoxH: 150,
    svgBody: `
      <defs>
        <linearGradient id="rgb_pin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#717D7E"/>
          <stop offset="50%" stop-color="#D5D8DC"/>
          <stop offset="100%" stop-color="#717D7E"/>
        </linearGradient>
      </defs>
      <!-- Metallic Legs (4 Pins) -->
      <!-- Left Bent Leg -->
      <path d="M 32 95 L 32 115 L 14 135 L 14 150" stroke="url(#rgb_pin)" stroke-width="6" fill="none" stroke-linecap="round"/>
      <!-- Middle Straight Legs -->
      <rect x="41" y="95" width="6" height="55" rx="2" fill="url(#rgb_pin)"/>
      <rect x="53" y="95" width="6" height="55" rx="2" fill="url(#rgb_pin)"/>
      <!-- Right Bent Leg -->
      <path d="M 68 95 L 68 115 L 86 135 L 86 150" stroke="url(#rgb_pin)" stroke-width="6" fill="none" stroke-linecap="round"/>
      
      <!-- Clear Rim -->
      <path d="M 22 90 L 78 90 A 28 8 0 0 1 78 102 L 22 102 A 28 8 0 0 1 22 90 Z" fill="#D5D8DC" opacity="0.3" stroke="#AAB7B8" stroke-width="0.5"/>
      
      <!-- Internal Structure (Anode dies) -->
      <path d="M 40 90 L 40 65 L 32 55 L 48 55 L 44 65 L 44 90 Z" fill="#AAB7B8" opacity="0.7"/>
      <path d="M 52 90 L 52 75 L 56 75 L 56 90 Z" fill="#AAB7B8" opacity="0.7"/>
      <path d="M 60 90 L 60 75 L 64 75 L 64 90 Z" fill="#AAB7B8" opacity="0.7"/>

      <!-- Clear Dome -->
      <path d="M 25 90 L 75 90 L 75 45 A 25 25 0 0 0 25 45 Z" fill="rgba(255,255,255,0.15)" stroke="#D5D8DC" stroke-width="1"/>
      
      <!-- Highlight -->
      <ellipse cx="40" cy="40" rx="10" ry="15" fill="#FFFFFF" opacity="0.2"/>
    `,
    relativePins: [
      { name: "Red (R)", relX: 14 / 100, relY: 150 / 150, type: "anode_r" },
      { name: "Common Cathode (-)", relX: 44 / 100, relY: 150 / 150, type: "cathode" },
      { name: "Green (G)", relX: 56 / 100, relY: 150 / 150, type: "anode_g" },
      { name: "Blue (B)", relX: 86 / 100, relY: 150 / 150, type: "anode_b" },
    ],
  },
  {
    id: "potentiometer",
    name: "Potentiometer",
    category: "Passive",
    viewBoxW: 120,
    viewBoxH: 150,
    svgBody: `
      <defs>
        <linearGradient id="pot_pin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#717D7E"/>
          <stop offset="50%" stop-color="#D5D8DC"/>
          <stop offset="100%" stop-color="#717D7E"/>
        </linearGradient>
      </defs>
      <!-- Metallic Pins -->
      <rect x="36" y="115" width="7" height="30" rx="3" fill="url(#pot_pin)"/>
      <rect x="56.5" y="115" width="7" height="30" rx="3" fill="url(#pot_pin)"/>
      <rect x="77" y="115" width="7" height="30" rx="3" fill="url(#pot_pin)"/>
      
      <!-- Outer Body -->
      <circle cx="60" cy="65" r="55" fill="#212F3D" stroke="#17202A" stroke-width="2"/>
      
      <!-- Rim Dots -->
      <circle cx="60" cy="18" r="4" fill="#5D9CEC" opacity="0.5"/>
      <circle cx="102" cy="35" r="4" fill="#5D9CEC" opacity="0.5"/>
      <circle cx="102" cy="95" r="4" fill="#5D9CEC" opacity="0.5"/>
      <circle cx="18" cy="35" r="4" fill="#5D9CEC" opacity="0.5"/>
      <circle cx="18" cy="95" r="4" fill="#5D9CEC" opacity="0.5"/>
      
      <!-- Tick Marks -->
      ${Array.from({ length: 40 }).map((_, i) => {
        const angle = (i * 9) - 90;
        const r1 = 42;
        const r2 = 50;
        const x1 = 60 + r1 * Math.cos(angle * Math.PI / 180);
        const y1 = 65 + r1 * Math.sin(angle * Math.PI / 180);
        const x2 = 60 + r2 * Math.cos(angle * Math.PI / 180);
        const y2 = 65 + r2 * Math.sin(angle * Math.PI / 180);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#17202A" stroke-width="1.5" />`;
      }).join("")}

      <!-- Center Knob -->
      <circle cx="60" cy="65" r="40" fill="#5D9CEC" stroke="#2E86C1" stroke-width="1"/>
      
      <!-- Pointer -->
      <path d="M 60 65 L 30 90 L 40 100 Z" fill="#17202A" opacity="0.9"/>
    `,
    relativePins: [
      { name: "Terminal 1", relX: 39.5 / 120, relY: 145 / 150 },
      { name: "Wiper", relX: 60 / 120, relY: 145 / 150 },
      { name: "Terminal 2", relX: 80.5 / 120, relY: 145 / 150 },
    ],
  },
  {
    id: "battery3v",
    name: "Battery 3V",
    category: "Power",
    viewBoxW: 120,
    viewBoxH: 180,
    svgBody: `
      <defs>
        <linearGradient id="coin_grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E5E7E9"/>
          <stop offset="50%" stop-color="#BDC3C7"/>
          <stop offset="100%" stop-color="#99A3A4"/>
        </linearGradient>
      </defs>
      <!-- Holder -->
      <circle cx="60" cy="90" r="58" fill="#17202A"/>
      <rect x="45" y="32" width="30" height="15" rx="2" fill="#17202A"/>
      <rect x="45" y="133" width="30" height="15" rx="2" fill="#17202A"/>
      
      <!-- Coin Cell -->
      <circle cx="60" cy="90" r="50" fill="url(#coin_grad)" stroke="#7F8C8D" stroke-width="1"/>
      
      <!-- Red Cap (Positive +) -->
      <path d="M 54 35 L 66 35 L 68 25 L 52 25 Z" fill="#C0392B"/>
      <rect x="58" y="18" width="4" height="7" rx="1" fill="#7B7D7D"/>
      
      <!-- Black Cap (Negative -) -->
      <path d="M 54 145 L 66 145 L 68 155 L 52 155 Z" fill="#212F3D"/>
      <rect x="58" y="162" width="4" height="7" rx="1" fill="#7B7D7D"/>
      
      <!-- Text Labels -->
      <text x="60" y="70" font-size="20" font-weight="bold" text-anchor="middle" fill="#7F8C8D" opacity="0.5">+</text>
      <text x="60" y="100" font-size="10" font-weight="bold" text-anchor="middle" fill="#7F8C8D" opacity="0.8">COIN BATTERY</text>
      <text x="60" y="115" font-size="12" font-weight="bold" text-anchor="middle" fill="#7F8C8D" opacity="0.8">CR 2032</text>
      <text x="60" y="130" font-size="14" font-weight="bold" text-anchor="middle" fill="#7F8C8D" opacity="0.8">3.0V</text>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 60 / 120, relY: 18 / 180, type: "positive" },
      { name: "Negative (-)", relX: 60 / 120, relY: 162 / 180, type: "negative" },
    ],
  },
  {
    id: "arduino_uno",
    name: "Arduino Uno R3",
    category: "Controllers",
    viewBoxW: 340,
    viewBoxH: 260,
    svgBody: `
      <defs>
        <linearGradient id="uno_pcb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00878F"/>
          <stop offset="100%" stop-color="#005C62"/>
        </linearGradient>
      </defs>
      <!-- PCB -->
      <path d="M 40 30 L 300 30 L 310 40 L 310 220 L 300 230 L 40 230 L 30 220 L 30 40 Z" fill="url(#uno_pcb)"/>
      
      <!-- USB Port -->
      <rect x="20" y="60" width="55" height="45" rx="2" fill="#D5D8DC" stroke="#A6ACAF"/>
      <rect x="15" y="70" width="8" height="25" fill="#BDC3C7"/>

      <!-- DC Power Jack -->
      <rect x="25" y="165" width="50" height="45" rx="2" fill="#17202A"/>
      <circle cx="50" cy="187.5" r="12" fill="#000"/>

      <!-- Header Blocks -->
      <!-- Top Digital Headers -->
      <rect x="155" y="32" width="75" height="15" fill="#212F3D"/>
      <rect x="235" y="32" width="60" height="15" fill="#212F3D"/>
      <!-- Bottom Power/Analog Headers -->
      <rect x="165" y="213" width="60" height="15" fill="#212F3D"/>
      <rect x="235" y="213" width="60" height="15" fill="#212F3D"/>

      <!-- ATMega328P Chip -->
      <rect x="175" y="145" width="120" height="35" rx="2" fill="#212F3D"/>
      <circle cx="185" cy="162.5" r="3" fill="#000" opacity="0.3"/>
      ${Array.from({ length: 14 }).map((_, i) => `
        <rect x="${182 + i * 8}" y="142" width="3" height="5" fill="#BDC3C7"/>
        <rect x="${182 + i * 8}" y="178" width="3" height="5" fill="#BDC3C7"/>
      `).join("")}

      <!-- Branding and Labels -->
      <text x="230" y="90" font-size="20" font-weight="bold" fill="#FFF" opacity="0.8">ARDUINO</text>
      <text x="230" y="115" font-size="24" font-weight="900" fill="#FFF" opacity="0.4">UNO</text>
      
      <!-- Digital Pin Labels -->
      <text x="215" y="58" font-size="7" fill="#FFF" opacity="0.7" text-anchor="end" transform="rotate(-90, 215, 58)">DIGITAL (PWM~)</text>
      ${[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(n => `
        <text x="${288 - n * 10}" y="28" font-size="7" fill="#FFF" opacity="0.7" text-anchor="middle">${n}</text>
      `).join("")}

      <!-- Mounting Holes -->
      <circle cx="45" cy="45" r="8" fill="none" stroke="#F1C40F" stroke-width="2" opacity="0.5"/>
      <circle cx="45" cy="215" r="8" fill="none" stroke="#F1C40F" stroke-width="2" opacity="0.5"/>
      <circle cx="295" cy="125" r="8" fill="none" stroke="#F1C40F" stroke-width="2" opacity="0.5"/>
    `,
    litSvgBody: `
      <!-- PCB -->
      <path d="M 40 30 L 300 30 L 310 40 L 310 220 L 300 230 L 40 230 L 30 220 L 30 40 Z" fill="#00878F"/>
      
      <!-- ON LED -->
      <circle cx="285" cy="180" r="3" fill="#2ECC71" filter="blur(1px)"/>
      
      <!-- USB Port with Cable -->
      <rect x="20" y="60" width="55" height="45" rx="2" fill="#D5D8DC"/>
      <g transform="translate(-50, 62)">
        <rect x="15" y="0" width="60" height="40" rx="4" fill="#212121"/>
        <rect x="0" y="10" width="15" height="20" fill="#212121"/>
        <rect x="75" y="5" width="10" height="30" rx="1" fill="#BDC3C7"/>
      </g>

      <!-- Main Components -->
      <rect x="155" y="32" width="75" height="15" fill="#212F3D"/>
      <rect x="235" y="32" width="60" height="15" fill="#212F3D"/>
      <rect x="165" y="213" width="60" height="15" fill="#212F3D"/>
      <rect x="235" y="213" width="60" height="15" fill="#212F3D"/>
      <rect x="175" y="145" width="120" height="35" rx="2" fill="#212F3D"/>
    `,
    relativePins: [
      // Digital Pins
      ...Array.from({ length: 14 }).map((_, i) => ({
        name: `Digital ${13 - i}`,
        relX: (288 - i * 10) / 340,
        relY: 40 / 260
      })),
      // Analog Pins
      ...Array.from({ length: 6 }).map((_, i) => ({
        name: `Analog A${i}`,
        relX: (240 + i * 10) / 340,
        relY: 220 / 260
      })),
      // Power Pins
      { name: "5V", relX: 200 / 340, relY: 220 / 260, type: "vcc" },
      { name: "GND", relX: 210 / 340, relY: 220 / 260, type: "ground" },
    ],
  },
  {
    id: "microbit",
    name: "micro:bit",
    category: "Controllers",
    viewBoxW: 200,
    viewBoxH: 200,
    svgBody: `
      <defs>
        <linearGradient id="gold_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#D4AF37"/>
          <stop offset="50%" stop-color="#F1C40F"/>
          <stop offset="100%" stop-color="#D4AF37"/>
        </linearGradient>
      </defs>
      <!-- PCB -->
      <rect x="20" y="20" width="160" height="160" rx="12" fill="#1B1B1B"/>
      
      <!-- Decorative Red Shapes -->
      <path d="M 20 120 L 60 180 L 20 180 Z" fill="#E91E63" opacity="0.9"/>
      <path d="M 20 140 L 40 180 L 20 180 Z" fill="#C2185B"/>
      
      <!-- Edge Connector (Gold) -->
      <rect x="165" y="20" width="25" height="160" fill="url(#gold_grad)" rx="2"/>
      
      <!-- Large Gold Pads (Pins) -->
      ${[35, 67, 100, 133, 165].map((y, i) => `
        <circle cx="178" cy="${y}" r="9" fill="#FDFEFE" stroke="#B7950B" stroke-width="1.5"/>
        <text x="162" y="${y + 4}" font-size="9" font-weight="bold" text-anchor="end" fill="#BDC3C7" transform="rotate(0, 162, ${y})">${["GND", "3V", "2", "1", "0"][i]}</text>
      `).join("")}
      
      <!-- Small Gold Strips -->
      ${Array.from({ length: 20 }).map((_, i) => `
        <rect x="165" y="${25 + i * 8}" width="12" height="2" fill="#B7950B" opacity="0.4"/>
      `).join("")}

      <!-- LED Matrix (5x5) -->
      ${Array.from({ length: 5 }).map((_, r) => 
        Array.from({ length: 5 }).map((_, c) => `
          <rect x="${65 + c * 16}" y="${65 + r * 16}" width="8" height="5" rx="1" fill="#424242"/>
        `).join("")
      ).join("")}

      <!-- Buttons -->
      <!-- Button B (Top) -->
      <rect x="135" y="35" width="20" height="20" rx="4" fill="#333" stroke="#555"/>
      <circle cx="145" cy="45" r="6" fill="#BDC3C7"/>
      <text x="125" y="48" font-size="10" font-weight="bold" fill="#E91E63">B</text>
      
      <!-- Button A (Bottom) -->
      <rect x="135" y="145" width="20" height="20" rx="4" fill="#333" stroke="#555"/>
      <circle cx="145" cy="155" r="6" fill="#BDC3C7"/>
      <text x="125" y="158" font-size="10" font-weight="bold" fill="#E91E63">A</text>

      <!-- Micro USB Port -->
      <rect x="15" y="85" width="10" height="30" rx="2" fill="#BDC3C7"/>
      <rect x="10" y="90" width="8" height="20" rx="1" fill="#7F8C8D"/>
      
      <!-- Logo/Branding -->
      <circle cx="45" cy="100" r="10" fill="none" stroke="#E91E63" stroke-width="4"/>
      <circle cx="41" cy="100" r="2" fill="#E91E63"/>
      <circle cx="49" cy="100" r="2" fill="#E91E63"/>
    `,
    litSvgBody: `
      <defs>
        <filter id="led_glow_red">
          <feGaussianBlur stdDeviation="1" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <!-- PCB -->
      <rect x="20" y="20" width="160" height="160" rx="12" fill="#1B1B1B"/>
      <!-- Edge Connector -->
      <rect x="165" y="20" width="25" height="160" fill="#D4AF37" rx="2"/>
      ${[35, 67, 100, 133, 165].map((y, i) => `
        <circle cx="178" cy="${y}" r="9" fill="#FDFEFE" stroke="#B7950B" stroke-width="1.5"/>
      `).join("")}
      
      <!-- LED Matrix (Heart) -->
      ${Array.from({ length: 5 }).map((_, r) => 
        Array.from({ length: 5 }).map((_, c) => {
          const heart = [[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]];
          const isLit = heart[r][c] === 1;
          return `<rect x="${65 + c * 16}" y="${65 + r * 16}" width="8" height="5" rx="1" fill="${isLit ? "#FF5252" : "#424242"}" ${isLit ? 'filter="url(#led_glow_red)"' : ""} />`;
        }).join("")
      ).join("")}

      <!-- Buttons -->
      <circle cx="145" cy="45" r="10" fill="#333"/><circle cx="145" cy="155" r="10" fill="#333"/>
      
      <!-- Logo -->
      <circle cx="45" cy="100" r="10" fill="none" stroke="#E91E63" stroke-width="4"/>

      <!-- USB Cable (from reference) -->
      <g transform="translate(-50, 85)">
        <!-- Silver Tip -->
        <rect x="52" y="5" width="12" height="20" rx="2" fill="#BDC3C7"/>
        <rect x="55" y="8" width="2" height="14" fill="#7F8C8D" opacity="0.5"/>
        <rect x="60" y="8" width="2" height="14" fill="#7F8C8D" opacity="0.5"/>
        
        <!-- Black Connector Body -->
        <rect x="15" y="0" width="38" height="30" rx="2" fill="#212121"/>
        <rect x="22" y="5" width="24" height="20" rx="1" fill="#333" opacity="0.5"/>
        
        <!-- Strain Relief -->
        <rect x="0" y="7" width="15" height="16" fill="#212121"/>
        ${Array.from({ length: 4 }).map((_, i) => `
          <rect x="${i * 3 + 2}" y="7" width="1.5" height="16" fill="#000" opacity="0.3"/>
        `).join("")}
        
        <!-- Cable Wire -->
        <rect x="-40" y="10" width="40" height="10" fill="#212121"/>
      </g>
    `,
    relativePins: [
      { name: "GND", relX: 178 / 200, relY: 35 / 200, type: "ground" },
      { name: "3V", relX: 178 / 200, relY: 67 / 200, type: "vcc" },
      { name: "Pin 2", relX: 178 / 200, relY: 100 / 200 },
      { name: "Pin 1", relX: 178 / 200, relY: 133 / 200 },
      { name: "Pin 0", relX: 178 / 200, relY: 165 / 200 },
    ],
  },
  {
    id: "vibration_motor",
    name: "vibration_motor",
    category: "Output",
    viewBoxW: 100,
    viewBoxH: 220,
    svgBody: `
      <defs>
        <linearGradient id="motor_rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E5E7E9"/>
          <stop offset="100%" stop-color="#99A3A4"/>
        </linearGradient>
      </defs>
      <!-- Connector Base -->
      <rect x="38" y="75" width="24" height="15" rx="2" fill="#7F8C8D"/>
      
      <!-- Wires -->
      <!-- Black Wire (Negative) -->
      <path d="M 44 85 L 44 120 L 38 145 L 38 195" fill="none" stroke="#1C2833" stroke-width="5" stroke-linecap="round"/>
      <rect x="37" y="195" width="2" height="8" fill="#BDC3C7"/>

      <!-- Red Wire (Positive) -->
      <path d="M 56 85 L 56 120 L 62 145 L 62 195" fill="none" stroke="#C0392B" stroke-width="5" stroke-linecap="round"/>
      <rect x="61" y="195" width="2" height="8" fill="#BDC3C7"/>

      <!-- Motor Body -->
      <circle cx="50" cy="45" r="38" fill="url(#motor_rim)" stroke="#7F8C8D" stroke-width="1.5"/>
      <circle cx="50" cy="45" r="30" fill="#212121"/>
      <circle cx="50" cy="45" r="28" fill="#282828" stroke="#111" stroke-width="1"/>
    `,
    litSvgBody: `
      <!-- Base and Wires same as static -->
      <rect x="38" y="75" width="24" height="15" rx="2" fill="#7F8C8D"/>
      <path d="M 44 85 L 44 120 L 38 145 L 38 195" fill="none" stroke="#1C2833" stroke-width="5" stroke-linecap="round"/>
      <rect x="37" y="195" width="2" height="8" fill="#BDC3C7"/>
      <path d="M 56 85 L 56 120 L 62 145 L 62 195" fill="none" stroke="#C0392B" stroke-width="5" stroke-linecap="round"/>
      <rect x="61" y="195" width="2" height="8" fill="#BDC3C7"/>

      <!-- Vibrating Body (Slightly offset/blur) -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="-1,0; 1,0; -1,1; 1,-1; 0,0" dur="0.05s" repeatCount="indefinite" />
        <circle cx="50" cy="45" r="38" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="1.5"/>
        <circle cx="50" cy="45" r="30" fill="#212121"/>
        <circle cx="50" cy="45" r="28" fill="#282828" stroke="#111" stroke-width="1"/>
      </g>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 62 / 100, relY: 200 / 220, type: "positive" },
      { name: "Negative (-)", relX: 38 / 100, relY: 200 / 220, type: "negative" },
    ],
  },
  {
    id: "dc_motor",
    name: "DC Motor",
    category: "Output",
    viewBoxW: 140,
    viewBoxH: 140,
    svgBody: `
      <!-- Motor Body -->
      <path d="M 30 20 L 110 20 Q 130 20 130 40 L 130 80 Q 130 100 110 100 L 30 100 Q 10 100 10 80 L 10 40 Q 10 20 30 20" fill="#BDC3C7" stroke="#95A5A6" stroke-width="2"/>
      
      <!-- Ventilation Holes -->
      <circle cx="70" cy="42" r="8" fill="#5D6D7E"/>
      <circle cx="38" cy="70" r="8" fill="#5D6D7E"/>
      <circle cx="102" cy="70" r="8" fill="#5D6D7E"/>

      <!-- Gear (Static) -->
      <g transform="translate(70, 70)">
        <circle r="12" fill="#F4D03F"/>
        ${Array.from({ length: 12 }).map((_, i) => `
          <rect x="-3" y="-18" width="6" height="8" rx="1.5" fill="#F4D03F" transform="rotate(${i * 30})"/>
        `).join("")}
        <circle r="7" fill="#D4AC0D"/>
      </g>

      <!-- Terminals -->
      <rect x="52" y="100" width="10" height="12" rx="1" fill="#212121"/>
      <rect x="56" y="112" width="2" height="6" fill="#BDC3C7"/>
      
      <rect x="78" y="100" width="10" height="12" rx="1" fill="#C0392B"/>
      <rect x="82" y="112" width="2" height="6" fill="#BDC3C7"/>
    `,
    litSvgBody: `
      <path d="M 30 20 L 110 20 Q 130 20 130 40 L 130 80 Q 130 100 110 100 L 30 100 Q 10 100 10 80 L 10 40 Q 10 20 30 20" fill="#BDC3C7" stroke="#95A5A6" stroke-width="2"/>
      <circle cx="70" cy="42" r="8" fill="#5D6D7E"/><circle cx="38" cy="70" r="8" fill="#5D6D7E"/><circle cx="102" cy="70" r="8" fill="#5D6D7E"/>

      <!-- Rotating Gear -->
      <g transform="translate(70, 70)">
        <animateTransform attributeName="transform" type="rotate" from="0 70 70" to="360 70 70" dur="0.5s" repeatCount="indefinite" additive="sum"/>
        <circle r="12" fill="#F4D03F"/>
        ${Array.from({ length: 12 }).map((_, i) => `
          <rect x="-3" y="-18" width="6" height="8" rx="1.5" fill="#F4D03F" transform="rotate(${i * 30})"/>
        `).join("")}
        <circle r="7" fill="#D4AC0D"/>
      </g>

      <rect x="52" y="100" width="10" height="12" rx="1" fill="#212121"/>
      <rect x="56" y="112" width="2" height="6" fill="#BDC3C7"/>
      <rect x="78" y="100" width="10" height="12" rx="1" fill="#C0392B"/>
      <rect x="82" y="112" width="2" height="6" fill="#BDC3C7"/>
    `,
    relativePins: [
      { name: "Terminal 1", relX: 57 / 140, relY: 115 / 140, type: "negative" },
      { name: "Terminal 2", relX: 83 / 140, relY: 115 / 140, type: "positive" },
    ],
  },
  {
    id: "gearmotor",
    name: "Gearmotor",
    category: "Output",
    viewBoxW: 140,
    viewBoxH: 260,
    svgBody: `
      <!-- Output Shafts (White) -->
      <rect x="15" y="80" width="110" height="14" rx="2" fill="#FDFEFE" stroke="#D5D8DC" stroke-width="1"/>
      
      <!-- Gearbox (Yellow) -->
      <rect x="45" y="30" width="50" height="115" rx="3" fill="#F1C40F" stroke="#D4AC0D" stroke-width="1.5"/>
      <rect x="45" y="30" width="50" height="10" rx="1" fill="#F4D03F" opacity="0.6"/>
      
      <!-- Motor Section (Translucent) -->
      <rect x="48" y="145" width="44" height="45" rx="4" fill="#F2F3F4" stroke="#BDC3C7" stroke-width="1" opacity="0.8"/>
      <rect x="48" y="180" width="44" height="15" rx="2" fill="#2C3E50"/>
      
      <!-- Small Detail (Mounting hole/nub) -->
      <rect x="65" y="15" width="10" height="15" fill="#F1C40F"/>

      <!-- Terminals -->
      <g>
        <!-- Black (-) -->
        <rect x="35" y="155" width="15" height="10" rx="1" fill="#1C2833"/>
        <rect x="30" y="158" width="5" height="4" fill="#BDC3C7"/>
        <!-- Red (+) -->
        <rect x="35" y="170" width="15" height="10" rx="1" fill="#C0392B"/>
        <rect x="30" y="173" width="5" height="4" fill="#BDC3C7"/>
      </g>
      
      <!-- Bottom Shaft -->
      <rect x="68" y="195" width="4" height="20" fill="#BDC3C7"/>
    `,
    litSvgBody: `
      <!-- Shafts Rotating Animation -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,1; 0,-1; 0,0" dur="0.1s" repeatCount="indefinite" />
        <rect x="15" y="80" width="110" height="14" rx="2" fill="#FDFEFE" stroke="#D5D8DC" stroke-width="1"/>
      </g>
      
      <!-- Body same as static -->
      <rect x="45" y="30" width="50" height="115" rx="3" fill="#F1C40F" stroke="#D4AC0D" stroke-width="1.5"/>
      <rect x="48" y="145" width="44" height="45" rx="4" fill="#F2F3F4" stroke="#BDC3C7" opacity="0.8"/>
      <rect x="48" y="180" width="44" height="15" rx="2" fill="#2C3E50"/>
      <rect x="68" y="195" width="4" height="20" fill="#BDC3C7"/>
      
      <g>
        <rect x="35" y="155" width="15" height="10" rx="1" fill="#1C2833"/>
        <rect x="30" y="158" width="5" height="4" fill="#BDC3C7"/>
        <rect x="35" y="170" width="15" height="10" rx="1" fill="#C0392B"/>
        <rect x="30" y="173" width="5" height="4" fill="#BDC3C7"/>
      </g>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 32 / 140, relY: 175 / 260, type: "positive" },
      { name: "Negative (-)", relX: 32 / 140, relY: 160 / 260, type: "negative" },
    ],
  },
  {
    id: "npn_transistor",
    name: "NPN Transistor (BJT)",
    category: "Semiconductors",
    viewBoxW: 60,
    viewBoxH: 80,
    svgBody: `
      <!-- Legs -->
      <path d="M 20 50 L 20 62 L 15 72 L 15 78" fill="none" stroke="#95A5A6" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 30 50 L 30 78" fill="none" stroke="#95A5A6" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 40 50 L 40 62 L 45 72 L 45 78" fill="none" stroke="#95A5A6" stroke-width="2.5" stroke-linecap="round"/>

      <!-- TO-92 Body -->
      <path d="M 10 25 L 50 25 L 50 50 L 10 50 Z" fill="#212121" stroke="#111" stroke-width="1"/>
      <path d="M 10 25 Q 30 10 50 25" fill="#282828" stroke="#111" stroke-width="1"/>
      
      <!-- Markings -->
      <text x="30" y="42" font-size="14" font-weight="900" fill="#BDC3C7" text-anchor="middle" font-family="Arial">N</text>
      <g opacity="0.5" font-size="4" font-weight="bold" fill="#BDC3C7" font-family="monospace">
        <text x="18" y="48" text-anchor="middle">C</text>
        <text x="30" y="48" text-anchor="middle">B</text>
        <text x="42" y="48" text-anchor="middle">E</text>
      </g>
    `,
    relativePins: [
      { name: "Collector", relX: 15 / 60, relY: 78 / 80 },
      { name: "Base", relX: 30 / 60, relY: 78 / 80 },
      { name: "Emitter", relX: 45 / 60, relY: 78 / 80 },
    ],
  },
  {
    id: "photoresistor",
    name: "Photoresistor (LDR)",
    category: "Sensors",
    viewBoxW: 80,
    viewBoxH: 100,
    svgBody: `
      <!-- Legs -->
      <path d="M 25 65 L 25 95" fill="none" stroke="#95A5A6" stroke-width="6" stroke-linecap="round"/>
      <path d="M 55 65 L 55 95" fill="none" stroke="#95A5A6" stroke-width="6" stroke-linecap="round"/>

      <!-- Body Outer Ring -->
      <circle cx="40" cy="40" r="38" fill="#A0522D"/>
      
      <!-- Ceramic Face -->
      <circle cx="40" cy="40" r="32" fill="#E8E2C2"/>
      
      <!-- Serpentine Zig-Zag Track (LDR Pattern) -->
      <path d="M 22 24 
               H 58 Q 62 24 62 28 Q 62 32 58 32
               H 22 Q 18 32 18 36 Q 18 40 22 40
               H 58 Q 62 40 62 44 Q 62 48 58 48
               H 22 Q 18 48 18 52 Q 18 56 22 56
               H 58" 
            fill="none" stroke="#A0522D" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
            
      <!-- Small details -->
      <circle cx="22" cy="40" r="2.5" fill="#BDC3C7" opacity="0.4"/>
      <circle cx="58" cy="40" r="2.5" fill="#BDC3C7" opacity="0.4"/>
    `,
    relativePins: [
      { name: "Terminal 1", relX: 25 / 80, relY: 95 / 100 },
      { name: "Terminal 2", relX: 55 / 80, relY: 95 / 100 },
    ],
  },
  {
    id: "soil_moisture",
    name: "Soil Moisture Sensor",
    category: "Sensors",
    viewBoxW: 120,
    viewBoxH: 260,
    svgBody: `
      <!-- Prongs (Silver with Gold Trim) -->
      <path d="M 15 80 L 15 230 L 30 255 L 45 230 L 45 80 Z" fill="#BDC3C7" stroke="#D4AC0D" stroke-width="1"/>
      <path d="M 75 80 L 75 230 L 90 255 L 105 230 L 105 80 Z" fill="#BDC3C7" stroke="#D4AC0D" stroke-width="1"/>
      
      <!-- Dots on Prongs -->
      ${Array.from({ length: 6 }).map((_, i) => `
        <circle cx="22" cy="${100 + i * 25}" r="2" fill="#999" opacity="0.3"/>
        <circle cx="38" cy="${100 + i * 25}" r="2" fill="#999" opacity="0.3"/>
        <circle cx="82" cy="${100 + i * 25}" r="2" fill="#999" opacity="0.3"/>
        <circle cx="98" cy="${100 + i * 25}" r="2" fill="#999" opacity="0.3"/>
      `).join("")}

      <!-- PCB (Red) -->
      <path d="M 10 20 Q 10 10 20 10 H 100 Q 110 10 110 20 V 85 H 10 Z" fill="#C0392B"/>
      
      <!-- Labels -->
      <text x="60" y="78" font-size="9" fill="#FFF" font-weight="bold" text-anchor="middle" font-family="monospace">Soil Moisture Sensor</text>
      
      <!-- Connector Area -->
      <rect x="35" y="15" width="50" height="35" fill="none" stroke="#FFF" stroke-width="0.8" opacity="0.5"/>
      <circle cx="45" cy="35" r="4.5" fill="#BDC3C7" stroke="#FFF" stroke-width="1"/>
      <circle cx="60" cy="35" r="4.5" fill="#BDC3C7" stroke="#FFF" stroke-width="1"/>
      <circle cx="75" cy="35" r="4.5" fill="#BDC3C7" stroke="#FFF" stroke-width="1"/>

      <!-- Second Row of Pins (from reference) -->
      <circle cx="50" cy="50" r="4.5" fill="#BDC3C7" stroke="#FFF" stroke-width="1"/>
      <circle cx="65" cy="50" r="4.5" fill="#BDC3C7" stroke="#FFF" stroke-width="1"/>
      <circle cx="80" cy="50" r="4.5" fill="#BDC3C7" stroke="#FFF" stroke-width="1"/>
      
      <g font-size="5" fill="#FFF" font-weight="bold" text-anchor="middle" font-family="Arial">
        <text x="45" y="25">VCC</text>
        <text x="60" y="25">GND</text>
        <text x="75" y="25">SIG</text>
      </g>

      <!-- Components & Logo -->
      <rect x="52" y="62" width="16" height="10" rx="1" fill="#333"/>
      <path d="M 95 45 Q 105 45 105 55 Q 105 65 95 65 Q 85 65 85 55 Q 85 45 95 45" fill="#FFF" opacity="0.2"/>
      
      <!-- Mounting Holes -->
      <circle cx="20" cy="22" r="6" fill="#FDFEFE" stroke="#FFF" stroke-width="0.5"/>
      <circle cx="100" cy="22" r="6" fill="#FDFEFE" stroke="#FFF" stroke-width="0.5"/>
    `,
    relativePins: [
      { name: "VCC", relX: 45 / 120, relY: 35 / 260, type: "vcc" },
      { name: "GND", relX: 60 / 120, relY: 35 / 260, type: "ground" },
      { name: "SIG", relX: 75 / 120, relY: 35 / 260 },
      { name: "Pin 4", relX: 50 / 120, relY: 50 / 260 },
      { name: "Pin 5", relX: 65 / 120, relY: 50 / 260 },
      { name: "Pin 5", relX: 65 / 120, relY: 50 / 260 },
      { name: "Pin 6", relX: 80 / 120, relY: 50 / 260 },
    ],
  },
  {
    id: "ultrasonic_ping",
    name: "Ultrasonic Distance Sensor",
    category: "Sensors",
    viewBoxW: 240,
    viewBoxH: 160,
    svgBody: `
      <!-- PCB -->
      <rect x="10" y="10" width="220" height="130" rx="4" fill="#004C66" stroke="#02adea" stroke-width="1"/>
      
      <!-- Transducers -->
      <g transform="translate(65, 75)">
        <circle r="48" fill="#BDC3C7" stroke="#333" stroke-width="1.5"/>
        <circle r="36" fill="#8E9F1B" opacity="0.8"/>
        <circle r="26" fill="#7F8C8D"/>
      </g>
      <g transform="translate(175, 75)">
        <circle r="48" fill="#BDC3C7" stroke="#333" stroke-width="1.5"/>
        <circle r="36" fill="#8E9F1B" opacity="0.8"/>
        <circle r="26" fill="#7F8C8D"/>
      </g>

      <!-- Labels -->
      <text x="120" y="78" font-size="18" font-weight="900" fill="#FFF" text-anchor="middle" font-family="Arial">PING)))</text>
      <text x="120" y="25" font-size="8" font-weight="bold" fill="#FFF" text-anchor="middle" opacity="0.6">WWW.PARALLAX.COM</text>
      <g font-size="7" fill="#FFF" opacity="0.8" font-family="monospace">
        <text x="18" y="25">28015</text>
        <text x="18" y="35">REV C</text>
      </g>

      <!-- ACT LED Area -->
      <rect x="110" y="35" width="20" height="20" fill="none" stroke="#FFF" stroke-width="0.5"/>
      <rect x="114" y="42" width="12" height="6" fill="#333"/>
      <text x="120" y="55" font-size="6" fill="#FFF" font-weight="bold" text-anchor="middle">ACT</text>

      <!-- Pins Header -->
      <rect x="100" y="90" width="40" height="40" fill="none" stroke="#FFF" stroke-width="0.5" opacity="0.5"/>
      <g transform="translate(108, 120)" font-size="7" font-weight="bold" fill="#FFF" font-family="monospace">
        <text x="0" y="0" transform="rotate(-90)" text-anchor="start">GND</text>
        <text x="12" y="0" transform="rotate(-90)" text-anchor="start">5V</text>
        <text x="24" y="0" transform="rotate(-90)" text-anchor="start">SIG</text>
      </g>

      <!-- Header Housing & Legs -->
      <rect x="102" y="130" width="36" height="12" fill="#212121"/>
      <rect x="108" y="142" width="2.5" height="15" fill="#BDC3C7"/>
      <rect x="120" y="142" width="2.5" height="15" fill="#BDC3C7"/>
      <rect x="132" y="142" width="2.5" height="15" fill="#BDC3C7"/>

      <!-- Mounting Holes -->
      <circle cx="215" cy="25" r="8" fill="#FDFEFE" stroke="#FFF" stroke-width="0.5"/>
      <circle cx="25" cy="125" r="8" fill="#FDFEFE" stroke="#FFF" stroke-width="0.5"/>
    `,
    relativePins: [
      { name: "GND", relX: 109 / 240, relY: 155 / 160, type: "ground" },
      { name: "5V", relX: 121 / 240, relY: 155 / 160, type: "vcc" },
      { name: "SIG", relX: 133 / 240, relY: 155 / 160 },
    ],
  },
];

/**
 * Returns { imageSrc, litImageSrc } data URLs for any LED color value (e.g. "blue", "red").
 * Safe to call at any time â€” STATIC_COMPONENTS is already initialised by the time
 * any React component renders.
 */
export function getLedDataUrls(
  colorValue: string,
  outlined = false
): { imageSrc: string; litImageSrc?: string } {
  const def = STATIC_COMPONENTS.find((d) => d.id === `led_${colorValue}`);
  if (def) {
    return {
      imageSrc: svgToDataUrl(def, false, outlined),
      litImageSrc: def.litSvgBody ? svgToDataUrl(def, true, outlined) : undefined,
    };
  }
  // Fallback to red
  const fallback = STATIC_COMPONENTS.find((d) => d.id === "led_red");
  if (fallback) {
    return {
      imageSrc: svgToDataUrl(fallback, false, outlined),
      litImageSrc: fallback.litSvgBody ? svgToDataUrl(fallback, true, outlined) : undefined,
    };
  }
  return { imageSrc: "" };
}

export function getMicrobitDataUrls(
  colorValue: string,
  outlined = false
): { imageSrc: string; litImageSrc?: string } {
  const def = STATIC_COMPONENTS.find((d) => d.id === "microbit");
  if (!def) return { imageSrc: "" };

  const pcbColors: Record<string, string> = {
    black: "#1B1B1B",
    red: "#C0392B",
    green: "#27AE60",
    blue: "#2980B9",
    yellow: "#F1C40F",
  };
  const pcbColor = pcbColors[colorValue?.toLowerCase()] || pcbColors.black;

  // Clone and modify the SVG body to change the PCB color
  const modifiedDef = {
    ...def,
    svgBody: def.svgBody.replace('fill="#1B1B1B"', `fill="${pcbColor}"`),
    litSvgBody: def.litSvgBody?.replace('fill="#1B1B1B"', `fill="${pcbColor}"`),
  };

  return {
    imageSrc: svgToDataUrl(modifiedDef, false, outlined),
    litImageSrc: modifiedDef.litSvgBody ? svgToDataUrl(modifiedDef, true, outlined) : undefined,
  };
}
