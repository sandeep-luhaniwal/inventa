/**
 * Static component registry used by the simulator palette and canvas.
 *
 * Each entry carries:
 *  - id / name / category   -> metadata shown in the palette
 *  - svgBody                -> raw SVG string used to build a data URL for Konva
 *  - viewBox                -> width x height of the SVG coordinate space
 *  - relativePins           -> pin positions as fractions of the viewBox (0-1)
 */

import { METAL_PHYSICS } from "./physics";

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
  voltageValue?: number;
  wattageValue?: number;
  capacitanceValue?: number;
  capacitanceUnit?: string;
  powerVoltageSet?: number;
  powerCurrentLimit?: number;
  powerFrequency?: number;
}

export function svgToDataUrl(def: StaticComponentDef, lit = false, outlined = false, uniqueId = ""): string {
  let body = (lit && def.litSvgBody) ? def.litSvgBody : def.svgBody;
  let outlineId = "component_outline";

  if (uniqueId) {
    const cleanId = uniqueId.replace(/[^a-zA-Z0-9_-]/g, "_");
    outlineId = `component_outline_${cleanId}`;
    body = body.replace(/id\s*=\s*["']([^"']+)["']/g, `id="$1_${cleanId}"`);
    body = body.replace(/url\(\s*['"]?#([^'"\s)]+)['"]?\s*\)/g, `url(#$1_${cleanId})`);
    body = body.replace(/(href|xlink:href)\s*=\s*["']#([^"']+)["']/g, `$1="#$2_${cleanId}"`);
    body = body.replace(/component_outline/g, outlineId);
  }

  const outlineDefs = outlined
    ? `<defs>
         <filter id="${outlineId}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
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
  const wrappedBody = outlined ? `<g filter="url(#${outlineId})">${body}</g>` : body;
  const svg = `<svg width="${def.viewBoxW}" height="${def.viewBoxH}" viewBox="0 0 ${def.viewBoxW} ${def.viewBoxH}" xmlns="http://www.w3.org/2000/svg">${outlineDefs}${wrappedBody}</svg>`;
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
      red: { dome: ["#FF6B6B", "#E74C3C", "#922B21"], lit: ["#FFFFFF", "#FF4444", "#CC0000"], dark: "#922B21", litDark: "#FF2222", glow: "#f87171" },
      orange: { dome: ["#e9eb7fff", "#F97316", "#9A3412"], lit: ["#FFFFFF", "#FF8C00", "#CC5500"], dark: "#9A3412", litDark: "#FF7700", glow: "#fb923c" },
      blue: { dome: ["#93C5FD", "#3B82F6", "#1E3A8A"], lit: ["#FFFFFF", "#60A5FA", "#1D4ED8"], dark: "#1E3A8A", litDark: "#3B82F6", glow: "#60a5fa" },
      white: { dome: ["#F8FAFC", "#E2E8F0", "#94A3B8"], lit: ["#FFFFFF", "#F8FAFC", "#E2E8F0"], dark: "#94A3B8", litDark: "#FFFFFF", glow: "#f1f5f9" },
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
      <path d="M 38 100 L 38 115 L 36.5 125 L 36.5 145" stroke="url(#${uid}_pin)" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Right Lead (Cathode, Straight) -->
      <rect x="59.5" y="100" width="8" height="45" rx="4" fill="url(#${uid}_pin)"/>
      
      <!-- Rim -->
      <path d="M 22 90 L 78 90 A 28 10 0 0 1 78 105 L 22 105 A 28 10 0 0 1 22 90 Z" fill="url(#${uid}_base)"/>
      <path d="M 22 90 L 78 90 A 28 10 0 0 1 78 100 L 22 100 A 28 10 0 0 1 22 90 Z" fill="${dark}" opacity="0.6"/>

      <!-- Dome -->
      <path d="M 25 90 L 75 90 L 75 45 A 25 25 0 0 0 25 45 Z" fill="url(#${uid}_glow)" filter="url(#${uid}_${litMode ? 'outerGlow' : 'shadow'})"/>
      
      <!-- Highlight -->
      <ellipse cx="40" cy="40" rx="10" ry="15" fill="url(#${uid}_domeTop)"/>`;
    return {
      id: `led_${color}`,
      name: `LED ${color.charAt(0).toUpperCase() + color.slice(1)}`,
      category: "Indicators",
      ledColor: color,
      voltageValue: 220,
      viewBoxW: 100,
      viewBoxH: 150,
      svgBody: sharedDefs(p.dome, false) + sharedBody(p.dark, false),
      litSvgBody: sharedDefs(p.lit, true) + sharedBody(p.litDark, true),
      relativePins: [
        { name: "Anode (+)", relX: 36.5 / 100, relY: 145 / 150, type: "anode" },
        { name: "Cathode (-)", relX: 63.5 / 100, relY: 145 / 150, type: "cathode" },
      ],
    } satisfies StaticComponentDef;
  }),
  {
    id: "ac_bulb",
    name: "AC LED Bulb",
    category: "Output",
    voltageValue: 220,
    wattageValue: 9,
    viewBoxW: 100,
    viewBoxH: 140,
    svgBody: `
      <defs>
        <!-- Metal Thread Gradient -->
        <linearGradient id="metal_thread_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4a535a" />
          <stop offset="25%" stop-color="#9aa2a8" />
          <stop offset="50%" stop-color="#e2e6e9" />
          <stop offset="75%" stop-color="#80878d" />
          <stop offset="100%" stop-color="#3d444a" />
        </linearGradient>
        
        <!-- Glass Unlit Gradient -->
        <radialGradient id="glass_unlit_grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5" />
          <stop offset="40%" stop-color="#ffffff" stop-opacity="0.1" />
          <stop offset="80%" stop-color="#e2e8f0" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#94a3b8" stop-opacity="0.3" />
        </radialGradient>
      </defs>
      
      <!-- Screw Cap of Bulb -->
      <!-- Threads -->
      <ellipse cx="50" cy="71" rx="15.5" ry="3" fill="url(#metal_thread_grad)" stroke="#222" stroke-width="0.3" />
      <ellipse cx="50" cy="75" rx="15" ry="3" fill="url(#metal_thread_grad)" stroke="#222" stroke-width="0.3" />
      <ellipse cx="50" cy="79" rx="14.5" ry="3" fill="url(#metal_thread_grad)" stroke="#222" stroke-width="0.3" />
      
      <!-- Bulb Glass Dome (Unlit) -->
      <path d="M 34 68 C 32 60, 27 52, 27 42 A 23 23 0 0 1 73 42 C 73 52, 68 60, 66 68 Z" fill="url(#glass_unlit_grad)" stroke="#b8c0ca" stroke-width="0.8" />
      
      <!-- Specular Glass Highlight Crescent -->
      <path d="M 31 42 A 19 19 0 0 1 60 25 A 22 22 0 0 0 29 42 Z" fill="#ffffff" opacity="0.4" />
      
      <!-- Filament and Support Wires (Unlit) -->
      <path d="M 44 68 L 44 48 M 56 68 L 56 48" stroke="#5a5e66" stroke-width="1.2" stroke-linecap="round" />
      <!-- Filament wire coil -->
      <path d="M 44 48 Q 45.5 45, 47 48 Q 48.5 45, 50 48 Q 51.5 45, 53 48 Q 54.5 45, 56 48" stroke="#5a5e66" stroke-width="1.2" fill="none" stroke-linecap="round" />
    `,
    litSvgBody: `
      <defs>
        <!-- Glow filters -->
        <filter id="bulb_glow_filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur1"/>
          <feGaussianBlur stdDeviation="12" result="blur2"/>
          <feMerge>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- Metal Thread Gradient -->
        <linearGradient id="metal_thread_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4a535a" />
          <stop offset="25%" stop-color="#9aa2a8" />
          <stop offset="50%" stop-color="#e2e6e9" />
          <stop offset="75%" stop-color="#80878d" />
          <stop offset="100%" stop-color="#3d444a" />
        </linearGradient>
        
        <!-- Glass Lit Gradient -->
        <radialGradient id="glass_lit_grad" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="20%" stop-color="#fff59d" stop-opacity="0.95" />
          <stop offset="55%" stop-color="#ffb300" stop-opacity="0.75" />
          <stop offset="85%" stop-color="#ff6f00" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#e65100" stop-opacity="0.1" />
        </radialGradient>
      </defs>
      
      <!-- Screw Cap of Bulb -->
      <ellipse cx="50" cy="71" rx="15.5" ry="3" fill="url(#metal_thread_grad)" stroke="#222" stroke-width="0.3" />
      <ellipse cx="50" cy="75" rx="15" ry="3" fill="url(#metal_thread_grad)" stroke="#222" stroke-width="0.3" />
      <ellipse cx="50" cy="79" rx="14.5" ry="3" fill="url(#metal_thread_grad)" stroke="#222" stroke-width="0.3" />
      
      <!-- Soft base glow behind the bulb -->
      <circle cx="50" cy="45" r="35" fill="#ff8f00" opacity="0.3" filter="url(#bulb_glow_filter)" />

      <!-- Bulb Glass Dome (Lit) -->
      <path d="M 34 68 C 32 60, 27 52, 27 42 A 23 23 0 0 1 73 42 C 73 52, 68 60, 66 68 Z" fill="url(#glass_lit_grad)" stroke="#ffb300" stroke-width="1.2" filter="url(#bulb_glow_filter)" />
      
      <!-- Specular Glass Highlight Crescent -->
      <path d="M 31 42 A 19 19 0 0 1 60 25 A 22 22 0 0 0 29 42 Z" fill="#ffffff" opacity="0.6" />
      
      <!-- Filament and Support Wires (Lit) -->
      <path d="M 44 68 L 44 48 M 56 68 L 56 48" stroke="#ffb300" stroke-width="1.5" stroke-linecap="round" />
      <!-- Filament wire coil (Glowing White-Yellow) -->
      <path d="M 44 48 Q 45.5 45, 47 48 Q 48.5 45, 50 48 Q 51.5 45, 53 48 Q 54.5 45, 56 48" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round" filter="url(#bulb_glow_filter)" />
      <path d="M 44 48 Q 45.5 45, 47 48 Q 48.5 45, 50 48 Q 51.5 45, 53 48 Q 54.5 45, 56 48" stroke="#fff9c4" stroke-width="1.2" fill="none" stroke-linecap="round" />
    `,
    relativePins: [
      { name: "Terminal 1", relX: 42 / 100, relY: 80 / 140 },
      { name: "Terminal 2", relX: 58 / 100, relY: 80 / 140 },
    ],
  },
  {
    id: "bulb_holder",
    name: "Bulb Holder",
    category: "Output",
    viewBoxW: 100,
    viewBoxH: 140,
    svgBody: `
      <defs>
        <!-- Ground shadow filter -->
        <filter id="shadow_filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        
        <!-- Porcelain Base Gradient -->
        <linearGradient id="porcelain_base_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#a8a594" />
          <stop offset="20%" stop-color="#dbd8cc" />
          <stop offset="50%" stop-color="#ebe8dc" />
          <stop offset="80%" stop-color="#d1cebf" />
          <stop offset="100%" stop-color="#a09d8c" />
        </linearGradient>
        
        <!-- Porcelain Neck Gradient -->
        <linearGradient id="porcelain_neck_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#9a9786" />
          <stop offset="20%" stop-color="#d4d1c3" />
          <stop offset="50%" stop-color="#ebe8dc" />
          <stop offset="80%" stop-color="#cbc8b8" />
          <stop offset="100%" stop-color="#928f7f" />
        </linearGradient>
        
        <!-- Thread Metallic Gradient -->
        <linearGradient id="thread_metal_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#3a3c3e" />
          <stop offset="25%" stop-color="#9fa2a6" />
          <stop offset="50%" stop-color="#e2e5e9" />
          <stop offset="75%" stop-color="#8c8f92" />
          <stop offset="100%" stop-color="#313234" />
        </linearGradient>
        
        <!-- Copper Contact Gradient -->
        <linearGradient id="copper_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#d35400" />
          <stop offset="50%" stop-color="#f39c12" />
          <stop offset="100%" stop-color="#a04000" />
        </linearGradient>

        <clipPath id="inner_socket_clip">
          <ellipse cx="50" cy="80" rx="18" ry="4.8" />
        </clipPath>
      </defs>
      
      <!-- 1. Ambient Ground Shadow -->
      <ellipse cx="50" cy="130" rx="38" ry="10" fill="#1a1916" opacity="0.45" filter="url(#shadow_filter)" />
      
      <!-- 2. Wires -->
      <!-- White Wire Outer Loop -->
      <path d="M 74 121 C 96 121, 93 141, 37 135" stroke="#9da0a8" stroke-width="4.8" fill="none" stroke-linecap="round" />
      <path d="M 74 121 C 96 121, 93 141, 37 135" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.9" />
      
      <!-- Black Wire Inner Loop -->
      <path d="M 74 118 C 91 118, 89 136, 63 135" stroke="#121315" stroke-width="4.8" fill="none" stroke-linecap="round" />
      <path d="M 74 118 C 91 118, 89 136, 63 135" stroke="#424652" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85" />
      
      <!-- 3. Terminal Connectors -->
      <!-- Left Terminal -->
      <circle cx="37" cy="135" r="3.2" fill="#1e1e1b" />
      <circle cx="37" cy="135" r="3.2" fill="none" stroke="url(#copper_grad)" stroke-width="1.5" />
      <!-- Right Terminal -->
      <circle cx="63" cy="135" r="3.2" fill="#1e1e1b" />
      <circle cx="63" cy="135" r="3.2" fill="none" stroke="url(#copper_grad)" stroke-width="1.5" />
      
      <!-- 4. Porcelain Base (Main cylinder body) -->
      <path d="M 14 110 A 36 10 0 0 0 86 110 L 86 128 A 36 10 0 0 1 14 128 Z" fill="url(#porcelain_base_grad)" />
      <ellipse cx="50" cy="110" rx="36" ry="10" fill="url(#porcelain_base_grad)" stroke="#e4e1d5" stroke-width="0.3" />
      
      <!-- 5. Mounting Holes -->
      <!-- Left Mounting Hole -->
      <ellipse cx="28" cy="115" rx="4.5" ry="2.2" fill="#504d44" />
      <ellipse cx="28" cy="115.5" rx="3.5" ry="1.7" fill="#1f1e1b" />
      <ellipse cx="28" cy="115" rx="4.5" ry="2.2" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.7" />
      
      <!-- Right/Back Mounting Hole -->
      <ellipse cx="72" cy="107" rx="3.5" ry="1.7" fill="#504d44" />
      <ellipse cx="72" cy="107.4" rx="2.6" ry="1.2" fill="#1f1e1b" />
      <ellipse cx="72" cy="107" rx="3.5" ry="1.7" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.7" />
      
      <!-- 6. Notch/Housing on the right for Wires -->
      <path d="M 68 111.5 L 78 113.5 L 76 109 L 66 108 Z" fill="url(#porcelain_base_grad)" stroke="#d1cebf" stroke-width="0.3" />
      <path d="M 66 108 L 68 111.5 L 68 125 L 66 121 Z" fill="url(#porcelain_base_grad)" />
      <path d="M 68 111.5 L 78 113.5 L 78 127 L 68 125 Z" fill="url(#porcelain_base_grad)" />
      <path d="M 72 113 L 75 113.6 L 75 124 L 72 123.4 Z" fill="#22211e" />
      
      <!-- 7. Porcelain Neck Cylinder (covers the flare and height) -->
      <path d="M 28 80 C 28 83, 32 85, 32 88 L 32 110 A 18 5 0 0 0 68 110 L 68 88 C 68 85, 72 83, 72 80 A 22 6 0 0 1 28 80 Z" fill="url(#porcelain_neck_grad)" />
      
      <!-- Neck Flared Top Rim Face -->
      <ellipse cx="50" cy="80" rx="22" ry="6" fill="url(#porcelain_neck_grad)" stroke="#eae7db" stroke-width="0.5" />
      
      <!-- Inner Socket Hole and Metallic Threads inside clip path -->
      <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="#1a1a19" />
      
      <g clip-path="url(#inner_socket_clip)">
        <!-- Dark interior background -->
        <rect x="30" y="70" width="40" height="40" fill="#1b1b19" />
        
        <!-- Metallic Screw Threads -->
        <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="79.2" rx="17.2" ry="4.5" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="78.4" rx="16.4" ry="4.2" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="77.6" rx="15.6" ry="3.9" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="76.8" rx="14.8" ry="3.6" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="76" rx="14" ry="3.3" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="75.2" rx="13.2" ry="3.0" fill="none" stroke="url(#thread_metal_grad)" stroke-width="1.8" />
        
        <!-- Center Bottom Contact Plate -->
        <ellipse cx="50" cy="74.5" rx="3.5" ry="1" fill="url(#copper_grad)" />
      </g>
      
      <!-- Inner edge bevel stroke for porcelain wall thickness -->
      <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="none" stroke="#cfcbc0" stroke-width="0.8" />
      
      <!-- Specular Highlight on rim -->
      <path d="M 29 81 A 21 5.8 0 0 1 68 78.5" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.65" stroke-linecap="round" />
    `,
    litSvgBody: `
      <defs>
        <!-- Ground shadow filter -->
        <filter id="shadow_filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        
        <!-- Porcelain Base Gradient -->
        <linearGradient id="porcelain_base_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#a8a594" />
          <stop offset="20%" stop-color="#dbd8cc" />
          <stop offset="50%" stop-color="#ebe8dc" />
          <stop offset="80%" stop-color="#d1cebf" />
          <stop offset="100%" stop-color="#a09d8c" />
        </linearGradient>
        
        <!-- Porcelain Neck Gradient -->
        <linearGradient id="porcelain_neck_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#9a9786" />
          <stop offset="20%" stop-color="#d4d1c3" />
          <stop offset="50%" stop-color="#ebe8dc" />
          <stop offset="80%" stop-color="#cbc8b8" />
          <stop offset="100%" stop-color="#928f7f" />
        </linearGradient>
        
        <!-- Lit Thread Metallic Gradient (Warm Golden Reflection) -->
        <linearGradient id="thread_lit_metal_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#6e5722" />
          <stop offset="25%" stop-color="#cfa344" />
          <stop offset="50%" stop-color="#ffe58f" />
          <stop offset="75%" stop-color="#b58e38" />
          <stop offset="100%" stop-color="#54431a" />
        </linearGradient>
        
        <!-- Copper Contact Gradient -->
        <linearGradient id="copper_grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#d35400" />
          <stop offset="50%" stop-color="#f39c12" />
          <stop offset="100%" stop-color="#a04000" />
        </linearGradient>

        <!-- Vertical reflection gradient on neck -->
        <linearGradient id="porcelain_glow_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffb300" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#ffb300" stop-opacity="0" />
        </linearGradient>

        <clipPath id="inner_socket_clip_lit">
          <ellipse cx="50" cy="80" rx="18" ry="4.8" />
        </clipPath>
      </defs>
      
      <!-- 1. Ambient Ground Shadow -->
      <ellipse cx="50" cy="130" rx="38" ry="10" fill="#1a1916" opacity="0.45" filter="url(#shadow_filter)" />
      
      <!-- 2. Wires -->
      <!-- White Wire Outer Loop -->
      <path d="M 74 121 C 96 121, 93 141, 37 135" stroke="#9da0a8" stroke-width="4.8" fill="none" stroke-linecap="round" />
      <path d="M 74 121 C 96 121, 93 141, 37 135" stroke="#ffffff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.9" />
      
      <!-- Black Wire Inner Loop -->
      <path d="M 74 118 C 91 118, 89 136, 63 135" stroke="#121315" stroke-width="4.8" fill="none" stroke-linecap="round" />
      <path d="M 74 118 C 91 118, 89 136, 63 135" stroke="#424652" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85" />
      
      <!-- 3. Terminal Connectors -->
      <!-- Left Terminal -->
      <circle cx="37" cy="135" r="3.2" fill="#1e1e1b" />
      <circle cx="37" cy="135" r="3.2" fill="none" stroke="url(#copper_grad)" stroke-width="1.5" />
      <!-- Right Terminal -->
      <circle cx="63" cy="135" r="3.2" fill="#1e1e1b" />
      <circle cx="63" cy="135" r="3.2" fill="none" stroke="url(#copper_grad)" stroke-width="1.5" />
      
      <!-- 4. Porcelain Base (Main cylinder body) -->
      <path d="M 14 110 A 36 10 0 0 0 86 110 L 86 128 A 36 10 0 0 1 14 128 Z" fill="url(#porcelain_base_grad)" />
      <ellipse cx="50" cy="110" rx="36" ry="10" fill="url(#porcelain_base_grad)" stroke="#e4e1d5" stroke-width="0.3" />
      
      <!-- Warm light reflection on base top -->
      <ellipse cx="50" cy="110" rx="34" ry="9.2" fill="#ffa000" opacity="0.2" filter="url(#shadow_filter)" />
      
      <!-- 5. Mounting Holes -->
      <!-- Left Mounting Hole -->
      <ellipse cx="28" cy="115" rx="4.5" ry="2.2" fill="#504d44" />
      <ellipse cx="28" cy="115.5" rx="3.5" ry="1.7" fill="#1f1e1b" />
      <ellipse cx="28" cy="115" rx="4.5" ry="2.2" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.7" />
      
      <!-- Right/Back Mounting Hole -->
      <ellipse cx="72" cy="107" rx="3.5" ry="1.7" fill="#504d44" />
      <ellipse cx="72" cy="107.4" rx="2.6" ry="1.2" fill="#1f1e1b" />
      <ellipse cx="72" cy="107" rx="3.5" ry="1.7" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.7" />
      
      <!-- 6. Notch/Housing on the right for Wires -->
      <path d="M 68 111.5 L 78 113.5 L 76 109 L 66 108 Z" fill="url(#porcelain_base_grad)" stroke="#d1cebf" stroke-width="0.3" />
      <path d="M 66 108 L 68 111.5 L 68 125 L 66 121 Z" fill="url(#porcelain_base_grad)" />
      <path d="M 68 111.5 L 78 113.5 L 78 127 L 68 125 Z" fill="url(#porcelain_base_grad)" />
      <path d="M 72 113 L 75 113.6 L 75 124 L 72 123.4 Z" fill="#22211e" />
      
      <!-- 7. Porcelain Neck Cylinder (covers the flare and height) -->
      <path d="M 28 80 C 28 83, 32 85, 32 88 L 32 110 A 18 5 0 0 0 68 110 L 68 88 C 68 85, 72 83, 72 80 A 22 6 0 0 1 28 80 Z" fill="url(#porcelain_neck_grad)" />
      
      <!-- Warm light cast on neck cylinder -->
      <path d="M 28 80 C 28 83, 32 85, 32 88 L 32 108 A 18 5 0 0 0 68 108 L 68 88 C 68 85, 72 83, 72 80 Z" fill="url(#porcelain_glow_grad)" opacity="0.45" />
      
      <!-- Neck Flared Top Rim Face -->
      <ellipse cx="50" cy="80" rx="22" ry="6" fill="url(#porcelain_neck_grad)" stroke="#eae7db" stroke-width="0.5" />
      
      <!-- Glow reflection on rim -->
      <ellipse cx="50" cy="80" rx="21.5" ry="5.8" fill="#ffe082" opacity="0.4" filter="url(#shadow_filter)" />
      
      <!-- Inner Socket Hole and Metallic Threads inside clip path -->
      <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="#1a1a19" />
      
      <g clip-path="url(#inner_socket_clip_lit)">
        <!-- Dark interior background -->
        <rect x="30" y="70" width="40" height="40" fill="#1b1b19" />
        
        <!-- Lit/Glowing Metallic Screw Threads -->
        <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="79.2" rx="17.2" ry="4.5" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="78.4" rx="16.4" ry="4.2" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="77.6" rx="15.6" ry="3.9" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="76.8" rx="14.8" ry="3.6" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="76" rx="14" ry="3.3" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        <ellipse cx="50" cy="75.2" rx="13.2" ry="3.0" fill="none" stroke="url(#thread_lit_metal_grad)" stroke-width="1.8" />
        
        <!-- Center Bottom Contact Plate -->
        <ellipse cx="50" cy="74.5" rx="3.5" ry="1" fill="#ffe082" />
        
        <!-- Warm filament glow reflection overlay inside the socket hole -->
        <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="#ffb300" opacity="0.22" />
      </g>
      
      <!-- Inner edge bevel stroke for porcelain wall thickness -->
      <ellipse cx="50" cy="80" rx="18" ry="4.8" fill="none" stroke="#ffe082" stroke-width="0.8" opacity="0.8" />
      
      <!-- Specular Highlight on rim (warmer for lit state) -->
      <path d="M 29 81 A 21 5.8 0 0 1 68 78.5" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.8" stroke-linecap="round" />
    `,
    relativePins: [
      { name: "Terminal 1", relX: 37 / 100, relY: 135 / 140, type: "path1" },
      { name: "Terminal 2", relX: 63 / 100, relY: 135 / 140, type: "path2" },
      { name: "Socket 1", relX: 42 / 100, relY: 80 / 140, type: "path1" },
      { name: "Socket 2", relX: 58 / 100, relY: 80 / 140, type: "path2" },
    ],
  },
  {
    id: "dc_power_supply",
    name: "DC Power Supply",
    category: "Power",
    viewBoxW: 180,
    viewBoxH: 170,
    svgBody: `
      <defs>
        <!-- Realistic horizontal brushed metal gradient -->
        <linearGradient id="dc_brushed" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b8c0ca"/>
          <stop offset="4%" stop-color="#e2e8f0"/>
          <stop offset="8%" stop-color="#cbd5e1"/>
          <stop offset="12%" stop-color="#94a3b8"/>
          <stop offset="16%" stop-color="#e2e8f0"/>
          <stop offset="22%" stop-color="#cbd5e1"/>
          <stop offset="28%" stop-color="#f1f5f9"/>
          <stop offset="34%" stop-color="#cbd5e1"/>
          <stop offset="40%" stop-color="#94a3b8"/>
          <stop offset="48%" stop-color="#e2e8f0"/>
          <stop offset="55%" stop-color="#cbd5e1"/>
          <stop offset="62%" stop-color="#f8fafc"/>
          <stop offset="70%" stop-color="#cbd5e1"/>
          <stop offset="78%" stop-color="#94a3b8"/>
          <stop offset="85%" stop-color="#e2e8f0"/>
          <stop offset="92%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#88909a"/>
        </linearGradient>
        
        <!-- Chrome Bezel Gradient -->
        <linearGradient id="dc_bezel_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="20%" stop-color="#cbd5e1"/>
          <stop offset="50%" stop-color="#64748b"/>
          <stop offset="80%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>

        <linearGradient id="dc_inner_bezel_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="30%" stop-color="#475569"/>
          <stop offset="70%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>

        <!-- Screen Recess / Bezel -->
        <linearGradient id="dc_screen_bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="50%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>

        <!-- Banana Jacks Port Colors -->
        <radialGradient id="dc_red_port" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="50%" stop-color="#dc2626"/>
          <stop offset="85%" stop-color="#991b1b"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>
        
        <radialGradient id="dc_black_port" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#9ca3af"/>
          <stop offset="50%" stop-color="#374151"/>
          <stop offset="85%" stop-color="#1f2937"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>

        <radialGradient id="dc_short_lamp_lens" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="18%" stop-color="#fb923c"/>
          <stop offset="45%" stop-color="#ef4444"/>
          <stop offset="78%" stop-color="#b91c1c"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>

        <radialGradient id="dc_short_lamp_bezel" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="35%" stop-color="#94a3b8"/>
          <stop offset="72%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>

        <!-- Shadow filter -->
        <filter id="dc_shadow" x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#000000" flood-opacity="0.45"/>
        </filter>

        <!-- Embossed text shadow -->
        <filter id="dc_emboss_shadow">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0" flood-color="#ffffff" flood-opacity="0.75"/>
        </filter>
      </defs>

      <!-- Chassis Body -->
      <rect x="3" y="3" width="174" height="164" rx="18" fill="url(#dc_bezel_grad)" filter="url(#dc_shadow)"/>
      <rect x="5" y="5" width="170" height="160" rx="16" fill="url(#dc_inner_bezel_grad)"/>
      <rect x="8" y="8" width="164" height="154" rx="13" fill="url(#dc_brushed)"/>

      <!-- Embossed Title Text -->
      <text x="90" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" letter-spacing="1" text-anchor="middle" fill="#334155" filter="url(#dc_emboss_shadow)">DC POWER SUPPLY</text>

      <!-- Glossy LCD Display Bezel & Screen -->
      <rect x="18" y="26" width="104" height="48" rx="6" fill="url(#dc_screen_bezel)" stroke="#0f172a" stroke-width="0.8"/>
      <rect x="20" y="28" width="100" height="44" rx="4" fill="#04060a" stroke="#000000" stroke-width="1.2"/>
      
      <!-- Short Circuit Indicator Lamp Bezel -->
      <circle cx="146" cy="45" r="13.5" fill="url(#dc_short_lamp_bezel)" stroke="#1f2937" stroke-width="0.8"/>
      <circle cx="146" cy="45" r="11" fill="#7f1d1d" stroke="#7f1d1d" stroke-width="1"/>
      <circle cx="146" cy="45" r="8.3" fill="url(#dc_short_lamp_lens)" stroke="#7f1d1d" stroke-width="0.7"/>
      <circle cx="142.5" cy="40.5" r="2.6" fill="#fff7ed" opacity="0.9"/>
      <circle cx="146" cy="45" r="6" fill="#fb2d18" opacity="0.35"/>
      <text x="146" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="900" text-anchor="middle" fill="#334155">SHORT</text>
      <text x="146" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="900" text-anchor="middle" fill="#334155">CIRCUIT</text>

      <!-- Knob Ticks Dials (Voltage: center at 52, 108. Amperage: center at 122, 108) -->
      <!-- Voltage Group -->
      <g>
        <!-- Voltage Ticks (centered at 52, 108) -->
        <path d="M 36.4 123.6 L 34.3 125.7 M 31.1 114.8 L 28.2 115.7 M 30.3 104.6 L 27.3 104.1 M 34.2 95.1 L 31.8 93.3 M 42.0 88.4 L 40.6 85.7 M 52 86 L 52 83 M 62.0 88.4 L 63.4 85.7 M 69.8 95.1 L 72.2 93.3 M 73.7 104.6 L 76.7 104.1 M 72.9 114.8 L 75.8 115.7 M 67.6 123.6 L 69.7 125.7" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Controls Labels -->
        <text x="52" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#2c3038">VOLTAGE</text>
        <!-- Voltage FINE buttons labels & placeholders -->
        <text x="84" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="900" text-anchor="middle" fill="#334155">FINE</text>
        <text x="84" y="112.5" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#334155">V</text>
      </g>

      <!-- Middle Separator line -->
      <line x1="95" y1="87" x2="95" y2="125" stroke="#7a808e" stroke-width="1.2" stroke-linecap="round"/>

      <!-- Amperage Group -->
      <g>
        <!-- Amperage Ticks (centered at 122, 108) -->
        <path d="M 106.4 123.6 L 104.3 125.7 M 101.1 114.8 L 98.2 115.7 M 100.3 104.6 L 97.3 104.1 M 104.2 95.1 L 101.8 93.3 M 112.0 88.4 L 110.6 85.7 M 122 86 L 122 83 M 132.0 88.4 L 133.4 85.7 M 139.8 95.1 L 142.2 93.3 M 143.7 104.6 L 146.7 104.1 M 142.9 114.8 L 145.8 115.7 M 137.6 123.6 L 139.7 125.7" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Controls Labels -->
        <text x="122" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#2c3038">AMPERAGE</text>
        <!-- Amperage FINE Buttons labels -->
        <text x="154" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="900" text-anchor="middle" fill="#334155">FINE</text>
        <text x="154" y="112.5" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#334155">A</text>
      </g>

      <!-- Bottom Panel Section Separator Line -->
      <line x1="10" y1="133" x2="170" y2="133" stroke="#7a808e" stroke-width="1" stroke-linecap="round"/>

      <!-- Toggle Switch Frame -->
      <rect x="29" y="137" width="20" height="26" rx="4" fill="url(#dc_bezel_grad)" stroke="#1a1c22" stroke-width="0.8"/>
      <rect x="31" y="139" width="16" height="22" rx="2.5" fill="#04060a" stroke="#000" stroke-width="1"/>
      <text x="56" y="146" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#334155">ON</text>
      <text x="56" y="157" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#334155">OFF</text>

      <!-- Terminals Section (Red centered at 106, Black centered at 142) -->
      <text x="124" y="141" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#334155">OUTPUT</text>
      
      <!-- Positive Terminal Red (+) -->
      <text x="89" y="157" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" text-anchor="middle" fill="#334155">+</text>
      <circle cx="106" cy="153" r="11" fill="url(#dc_bezel_grad)" stroke="#0f172a" stroke-width="0.8"/>
      <circle cx="106" cy="153" r="8" fill="url(#dc_red_port)"/>
      <circle cx="106" cy="153" r="4.5" fill="#150202" stroke="#450a0a" stroke-width="0.6"/>

      <!-- Negative Terminal Black (-) -->
      <circle cx="142" cy="153" r="11" fill="url(#dc_bezel_grad)" stroke="#0f172a" stroke-width="0.8"/>
      <circle cx="142" cy="153" r="8" fill="url(#dc_black_port)"/>
      <circle cx="142" cy="153" r="4.5" fill="#020305" stroke="#1f2937" stroke-width="0.6"/>
      <text x="159" y="157" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" text-anchor="middle" fill="#334155">-</text>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 106 / 180, relY: 153 / 170, type: "positive" },
      { name: "Negative (-)", relX: 142 / 180, relY: 153 / 170, type: "negative" },
    ],
  },
  {
    id: "ac_power_supply",
    name: "AC Power Supply",
    category: "Power",
    viewBoxW: 180,
    viewBoxH: 170,
    powerVoltageSet: 230.5,
    powerCurrentLimit: 1.15,
    powerFrequency: 50,
    svgBody: `
      <defs>
        <linearGradient id="acps_brushed" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b8c0ca"/>
          <stop offset="4%" stop-color="#e2e8f0"/>
          <stop offset="8%" stop-color="#cbd5e1"/>
          <stop offset="12%" stop-color="#94a3b8"/>
          <stop offset="16%" stop-color="#e2e8f0"/>
          <stop offset="22%" stop-color="#cbd5e1"/>
          <stop offset="28%" stop-color="#f1f5f9"/>
          <stop offset="34%" stop-color="#cbd5e1"/>
          <stop offset="40%" stop-color="#94a3b8"/>
          <stop offset="48%" stop-color="#e2e8f0"/>
          <stop offset="55%" stop-color="#cbd5e1"/>
          <stop offset="62%" stop-color="#f8fafc"/>
          <stop offset="70%" stop-color="#cbd5e1"/>
          <stop offset="78%" stop-color="#94a3b8"/>
          <stop offset="85%" stop-color="#e2e8f0"/>
          <stop offset="92%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#88909a"/>
        </linearGradient>
        <linearGradient id="acps_bezel_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="20%" stop-color="#cbd5e1"/>
          <stop offset="50%" stop-color="#64748b"/>
          <stop offset="80%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="acps_inner_bezel_grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="30%" stop-color="#475569"/>
          <stop offset="70%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <linearGradient id="acps_screen_bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="50%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#94a3b8"/>
        </linearGradient>
        <radialGradient id="acps_black_port" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#9ca3af"/>
          <stop offset="50%" stop-color="#374151"/>
          <stop offset="85%" stop-color="#1f2937"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
        <radialGradient id="acps_green_port" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#a7f3d0"/>
          <stop offset="55%" stop-color="#10b981"/>
          <stop offset="85%" stop-color="#047857"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </radialGradient>
        <radialGradient id="acps_fault_lamp_lens" cx="38%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="18%" stop-color="#fb923c"/>
          <stop offset="45%" stop-color="#ef4444"/>
          <stop offset="78%" stop-color="#b91c1c"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>
        <radialGradient id="acps_fault_lamp_bezel" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="35%" stop-color="#94a3b8"/>
          <stop offset="72%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
        <filter id="acps_shadow" x="-8%" y="-8%" width="116%" height="116%">
          <feDropShadow dx="0" dy="5" stdDeviation="4.5" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
        <filter id="acps_emboss_shadow">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0" flood-color="#ffffff" flood-opacity="0.75"/>
        </filter>
      </defs>
      <rect x="3" y="3" width="174" height="164" rx="18" fill="url(#acps_bezel_grad)" filter="url(#acps_shadow)"/>
      <rect x="5" y="5" width="170" height="160" rx="16" fill="url(#acps_inner_bezel_grad)"/>
      <rect x="8" y="8" width="164" height="154" rx="13" fill="url(#acps_brushed)"/>
      <text x="90" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="900" letter-spacing="1" text-anchor="middle" fill="#334155" filter="url(#acps_emboss_shadow)">AC POWER SUPPLY</text>
      <rect x="18" y="26" width="104" height="48" rx="6" fill="url(#acps_screen_bezel)" stroke="#0f172a" stroke-width="0.8"/>
      <rect x="20" y="28" width="100" height="44" rx="4" fill="#04060a" stroke="#000000" stroke-width="1.2"/>
      <circle cx="146" cy="45" r="13.5" fill="url(#acps_fault_lamp_bezel)" stroke="#1f2937" stroke-width="0.8"/>
      <circle cx="146" cy="45" r="11" fill="#7f1d1d" stroke="#7f1d1d" stroke-width="1"/>
      <circle cx="146" cy="45" r="8.3" fill="url(#acps_fault_lamp_lens)" stroke="#7f1d1d" stroke-width="0.7"/>
      <circle cx="142.5" cy="40.5" r="2.6" fill="#fff7ed" opacity="0.9"/>
      <circle cx="146" cy="45" r="6" fill="#fb2d18" opacity="0.35"/>
      <text x="146" y="65" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="900" text-anchor="middle" fill="#334155">AC</text>
      <text x="146" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="6.5" font-weight="900" text-anchor="middle" fill="#334155">FAULT</text>
      <g>
        <path d="M 36.4 123.6 L 34.3 125.7 M 31.1 114.8 L 28.2 115.7 M 30.3 104.6 L 27.3 104.1 M 34.2 95.1 L 31.8 93.3 M 42.0 88.4 L 40.6 85.7 M 52 86 L 52 83 M 62.0 88.4 L 63.4 85.7 M 69.8 95.1 L 72.2 93.3 M 73.7 104.6 L 76.7 104.1 M 72.9 114.8 L 75.8 115.7 M 67.6 123.6 L 69.7 125.7" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
        <text x="52" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#2c3038">AC VOLTAGE</text>
        <text x="84" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="900" text-anchor="middle" fill="#334155">FINE</text>
        <text x="84" y="112.5" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#334155">V</text>
      </g>
      <line x1="95" y1="87" x2="95" y2="125" stroke="#7a808e" stroke-width="1.2" stroke-linecap="round"/>
      <g>
        <path d="M 106.4 123.6 L 104.3 125.7 M 101.1 114.8 L 98.2 115.7 M 100.3 104.6 L 97.3 104.1 M 104.2 95.1 L 101.8 93.3 M 112.0 88.4 L 110.6 85.7 M 122 86 L 122 83 M 132.0 88.4 L 133.4 85.7 M 139.8 95.1 L 142.2 93.3 M 143.7 104.6 L 146.7 104.1 M 142.9 114.8 L 145.8 115.7 M 137.6 123.6 L 139.7 125.7" stroke="#334155" stroke-width="1.2" stroke-linecap="round"/>
        <text x="122" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#2c3038">AC AMPERAGE</text>
        <text x="154" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="900" text-anchor="middle" fill="#334155">FINE</text>
        <text x="154" y="112.5" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#334155">A</text>
      </g>
      <line x1="10" y1="133" x2="170" y2="133" stroke="#7a808e" stroke-width="1" stroke-linecap="round"/>
      <rect x="29" y="137" width="20" height="26" rx="4" fill="url(#acps_bezel_grad)" stroke="#1a1c22" stroke-width="0.8"/>
      <rect x="31" y="139" width="16" height="22" rx="2.5" fill="#04060a" stroke="#000" stroke-width="1"/>
      <text x="56" y="146" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#334155">OFF</text>
      <text x="56" y="157" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" fill="#334155">ON</text>
      <text x="124" y="141" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="#334155">AC OUTPUT</text>
      <text x="89" y="157" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="#334155">N</text>
      <circle cx="106" cy="153" r="11" fill="url(#acps_bezel_grad)" stroke="#0f172a" stroke-width="0.8"/>
      <circle cx="106" cy="153" r="8" fill="url(#acps_black_port)"/>
      <circle cx="106" cy="153" r="4.5" fill="#020305" stroke="#1f2937" stroke-width="0.6"/>
      <circle cx="142" cy="153" r="11" fill="url(#acps_bezel_grad)" stroke="#0f172a" stroke-width="0.8"/>
      <circle cx="142" cy="153" r="8" fill="url(#acps_green_port)"/>
      <circle cx="142" cy="153" r="4.5" fill="#021f0a" stroke="#047857" stroke-width="0.6"/>
      <text x="159" y="157" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="#334155">P</text>
    `,
    relativePins: [
      { name: "Neutral (N)", relX: 106 / 180, relY: 153 / 170, type: "negative" },
      { name: "Phase (P)", relX: 142 / 180, relY: 153 / 170, type: "positive" },
    ],
  },
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
      <path d="M 29.5 32 L 37.5 32 L 39.5 20 L 27.5 20 Z" fill="#C0392B"/>
      <rect x="31.5" y="12" width="4" height="8" rx="1" fill="#7B7D7D"/>
      
      <!-- Black Cap (Negative) -->
      <path d="M 62.5 32 L 70.5 32 L 72.5 20 L 60.5 20 Z" fill="#1C2833"/>
      <rect x="64.5" y="12" width="4" height="8" rx="1" fill="#7B7D7D"/>

      <!-- Polarity Symbols -->
      <circle cx="35" cy="78" r="8" fill="#000" opacity="0.2"/>
      <text x="35" y="84" font-size="16" font-weight="bold" text-anchor="middle" fill="#000" opacity="0.5">+</text>
      <circle cx="65" cy="78" r="8" fill="#000" opacity="0.2"/>
      <text x="65" y="84" font-size="16" font-weight="bold" text-anchor="middle" fill="#000" opacity="0.5">−</text>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 33.5 / 100, relY: 12 / 180, type: "positive" },
      { name: "Negative (-)", relX: 66.5 / 100, relY: 12 / 180, type: "negative" },
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
    capacitanceValue: 1000,
    capacitanceUnit: "uF",
    voltageValue: 25,
    svgBody: `
      <defs>
        <!-- Clip path for the cylinder body to ensure stripe and highlights are clean -->
        <clipPath id="cap_body_clip">
          <path d="M 15 29 A 35 12 0 0 0 85 29 V 111 A 35 12 0 0 1 15 111 Z"/>
        </clipPath>
        
        <!-- Main metallic body gradient with specular highlight on the right (63%) -->
        <linearGradient id="cap_body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0c0e12"/>
          <stop offset="20%" stop-color="#12151b"/>
          <stop offset="40%" stop-color="#1b2029"/>
          <stop offset="58%" stop-color="#2c3341"/>
          <stop offset="63%" stop-color="#e8eff9"/> <!-- Bright Specular Highlight Core -->
          <stop offset="68%" stop-color="#2c3341"/>
          <stop offset="80%" stop-color="#1b2029"/>
          <stop offset="95%" stop-color="#0c0e12"/>
          <stop offset="100%" stop-color="#050608"/>
        </linearGradient>

        <!-- Vertical Gloss overlay gradient aligned with body highlight -->
        <linearGradient id="cap_gloss" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.03"/>
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.0"/>
          <stop offset="58%" stop-color="#ffffff" stop-opacity="0.3"/>
          <stop offset="63%" stop-color="#ffffff" stop-opacity="0.7"/> <!-- Glossy glare center -->
          <stop offset="68%" stop-color="#ffffff" stop-opacity="0.3"/>
          <stop offset="85%" stop-color="#ffffff" stop-opacity="0.0"/>
          <stop offset="95%" stop-color="#ffffff" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0"/>
        </linearGradient>
        
        <!-- Slate-grey/blue-grey gradient matching Nichicon stripe -->
        <linearGradient id="cap_stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#697689"/>
          <stop offset="25%" stop-color="#909eb4"/>
          <stop offset="70%" stop-color="#bcc9db"/>
          <stop offset="100%" stop-color="#808e9f"/>
        </linearGradient>
        
        <!-- Metallic pins/leads gradient -->
        <linearGradient id="cap_pin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#2c3540"/>
          <stop offset="25%" stop-color="#8a99a8"/>
          <stop offset="50%" stop-color="#f1f5f9"/>
          <stop offset="75%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#2c3540"/>
        </linearGradient>
        
        <!-- Metallic top cap gradient - Lip -->
        <linearGradient id="cap_top_lip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="30%" stop-color="#e2e8f0"/>
          <stop offset="70%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>

        <!-- Metallic top cap gradient - Recess -->
        <linearGradient id="cap_top_recess" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="30%" stop-color="#cbd5e1"/>
          <stop offset="70%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>

        <!-- Premium Gold Text Gradient (vertical gradient for crispness) -->
        <linearGradient id="cap_gold_text" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd56b"/>
          <stop offset="100%" stop-color="#b88a14"/>
        </linearGradient>
        
        <!-- Drop shadow for 3D depth -->
        <filter id="cap_shadow" x="-20%" y="-15%" width="140%" height="135%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.45"/>
        </filter>

        <!-- Bottom sleeve edge highlight rim gradient -->
        <linearGradient id="cap_bottom_rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="35%" stop-color="#64748b"/>
          <stop offset="50%" stop-color="#cbd5e1"/>
          <stop offset="65%" stop-color="#64748b"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
      </defs>
      
      <!-- 1. Metallic Leads (Pins) -->
      <rect x="34.5" y="113" width="5" height="34" rx="2.5" fill="url(#cap_pin)" stroke="#1e293b" stroke-width="0.4"/>
      <rect x="60.5" y="113" width="5" height="34" rx="2.5" fill="url(#cap_pin)" stroke="#1e293b" stroke-width="0.4"/>
      
      <!-- 2. Main Cylinder Body (Clipped to 3D cylinder shape) -->
      <g clip-path="url(#cap_body_clip)" filter="url(#cap_shadow)">
        <!-- Cylinder background sleeve -->
        <rect x="15" y="15" width="70" height="120" fill="url(#cap_body)" />
        
        <!-- Silver stripe on the left -->
        <rect x="16" y="15" width="16" height="110" fill="url(#cap_stripe)"/>
        
        <!-- Negative Indicator Capsules on the silver stripe -->
        <!-- Top Capsule -->
        <rect x="19.5" y="32" width="9" height="16" rx="2.5" fill="none" stroke="#222b35" stroke-width="1.2"/>
        <rect x="22" y="36.5" width="4" height="7" rx="1.5" fill="none" stroke="#222b35" stroke-width="1.2"/>
        
        <!-- Middle Capsule -->
        <rect x="19.5" y="62" width="9" height="16" rx="2.5" fill="none" stroke="#222b35" stroke-width="1.2"/>
        <rect x="22" y="66.5" width="4" height="7" rx="1.5" fill="none" stroke="#222b35" stroke-width="1.2"/>
        
        <!-- Bottom Capsule -->
        <rect x="19.5" y="92" width="9" height="16" rx="2.5" fill="none" stroke="#222b35" stroke-width="1.2"/>
        <rect x="22" y="96.5" width="4" height="7" rx="1.5" fill="none" stroke="#222b35" stroke-width="1.2"/>

        <!-- Cylinder gloss reflection overlay -->
        <rect x="15" y="15" width="70" height="120" fill="url(#cap_gloss)" pointer-events="none" />
      </g>
      
      <!-- 3. Text Labels on the black body (Clipped to body for realism) -->
      <g clip-path="url(#cap_body_clip)">
        <!-- "evalab" Brand Label -->
        <text x="58.5" y="54" font-family="Georgia, serif" font-size="7.5" font-weight="bold" text-anchor="middle" fill="url(#cap_gold_text)" letter-spacing="0.5">evalab</text>
        
        <!-- Capacitance Value -->
        <text x="58.5" y="72" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" fill="url(#cap_gold_text)">
          <tspan font-size="12" font-weight="900">VAR_CAP_VALUE</tspan>
          <tspan font-size="9" font-weight="bold" dx="1">VAR_CAP_UNIT</tspan>
        </text>
        
        <!-- Voltage Value -->
        <text x="58.5" y="89" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" fill="url(#cap_gold_text)">
          <tspan font-size="12" font-weight="900">VAR_CAP_VOLTAGE</tspan>
          <tspan font-size="9" font-weight="bold" dx="2">v</tspan>
        </text>
      </g>
      
      <!-- 4. Top Metal Face (Bezel Rim + Recessed Inner Vent) -->
      <!-- Outer lip bezel -->
      <ellipse cx="50" cy="29" rx="35" ry="12" fill="url(#cap_top_lip)" stroke="#1e293b" stroke-width="1"/>
      <!-- Recessed top face -->
      <ellipse cx="50" cy="29" rx="32" ry="10" fill="url(#cap_top_recess)" stroke="#334155" stroke-width="0.5"/>
      
      <!-- 3D engraved cross vent lines -->
      <g opacity="0.85">
        <!-- Engraving dark groove -->
        <path d="M 32 29 H 68 M 50 23.5 V 34.5" stroke="#101725" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Engraving light edge reflection -->
        <path d="M 32 28.5 H 68 M 50 23 V 34" stroke="#f1f5f9" stroke-width="0.8" stroke-linecap="round"/>
      </g>
      
      <!-- 5. Bottom Rubber Base and Bottom sleeve fold highlight -->
      <!-- Rubber plug protruding slightly at the bottom -->
      <ellipse cx="50" cy="113" rx="34" ry="11.5" fill="#0b0e14" stroke="#1e293b" stroke-width="0.5" />
      <!-- Soft shiny highlight rim at the bottom edge of crimped sleeve -->
      <path d="M15 109 A 35 12 0 0 0 85 109" fill="none" stroke="url(#cap_bottom_rim)" stroke-width="1.8"/>
    `,
    relativePins: [
      { name: "Negative (-)", relX: 37 / 100, relY: 146 / 150, type: "negative" },
      { name: "Positive (+)", relX: 63 / 100, relY: 146 / 150, type: "positive" },
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
      const x1 = (60 + r1 * Math.cos(angle * Math.PI / 180)).toFixed(2);
      const y1 = (65 + r1 * Math.sin(angle * Math.PI / 180)).toFixed(2);
      const x2 = (60 + r2 * Math.cos(angle * Math.PI / 180)).toFixed(2);
      const y2 = (65 + r2 * Math.sin(angle * Math.PI / 180)).toFixed(2);
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
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(n => `
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
      ${[35, 67, 100, 133, 165].map((y) => `
        <circle cx="178" cy="${y}" r="9" fill="#FDFEFE" stroke="#B7950B" stroke-width="1.5"/>
      `).join("")}
      
      <!-- LED Matrix (Heart) -->
      ${Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 5 }).map((_, c) => {
        const heart = [[0, 1, 0, 1, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0], [0, 0, 1, 0, 0]];
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
      <path d="M 44 85 L 44 120 L 30 145 L 30 195" fill="none" stroke="#1C2833" stroke-width="5" stroke-linecap="round"/>
      <rect x="29" y="195" width="2" height="8" fill="#BDC3C7"/>

      <!-- Red Wire (Positive) -->
      <path d="M 56 85 L 56 120 L 70 145 L 70 195" fill="none" stroke="#C0392B" stroke-width="5" stroke-linecap="round"/>
      <rect x="69" y="195" width="2" height="8" fill="#BDC3C7"/>

      <!-- Motor Body -->
      <circle cx="50" cy="45" r="38" fill="url(#motor_rim)" stroke="#7F8C8D" stroke-width="1.5"/>
      <circle cx="50" cy="45" r="30" fill="#212121"/>
      <circle cx="50" cy="45" r="28" fill="#282828" stroke="#111" stroke-width="1"/>
    `,
    litSvgBody: `
      <!-- Base and Wires same as static -->
      <rect x="38" y="75" width="24" height="15" rx="2" fill="#7F8C8D"/>
      <path d="M 44 85 L 44 120 L 30 145 L 30 195" fill="none" stroke="#1C2833" stroke-width="5" stroke-linecap="round"/>
      <rect x="29" y="195" width="2" height="8" fill="#BDC3C7"/>
      <path d="M 56 85 L 56 120 L 70 145 L 70 195" fill="none" stroke="#C0392B" stroke-width="5" stroke-linecap="round"/>
      <rect x="69" y="195" width="2" height="8" fill="#BDC3C7"/>

      <!-- Vibrating Body (Slightly offset/blur) -->
      <g>
        <animateTransform attributeName="transform" type="translate" values="-1,0; 1,0; -1,1; 1,-1; 0,0" dur="0.05s" repeatCount="indefinite" />
        <circle cx="50" cy="45" r="38" fill="#BDC3C7" stroke="#7F8C8D" stroke-width="1.5"/>
        <circle cx="50" cy="45" r="30" fill="#212121"/>
        <circle cx="50" cy="45" r="28" fill="#282828" stroke="#111" stroke-width="1"/>
      </g>
    `,
    relativePins: [
      { name: "Positive (+)", relX: 70 / 100, relY: 200 / 220, type: "positive" },
      { name: "Negative (-)", relX: 30 / 100, relY: 200 / 220, type: "negative" },
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
      <g id="gear_group" transform="translate(70, 70)">
        ${Array.from({ length: 12 }).map((_, i) => `
          <path d="M 0 -15 L 3 -10 L -3 -10 Z" fill="#F4D03F" transform="rotate(${i * 30})"/>
        `).join("")}
        <circle r="11" fill="#F4D03F"/>
        <!-- Direction Dots -->
        <circle cx="0" cy="-6" r="2.5" fill="#d35400" opacity="0.8"/>
        <circle cx="5" cy="3" r="1.5" fill="#d35400" opacity="0.6"/>
        <circle cx="-5" cy="3" r="1.5" fill="#d35400" opacity="0.6"/>
        
        <circle r="6" fill="#D4AC0D" opacity="0.6"/>
        <circle r="3" fill="#7d6608"/>
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

      <!-- No gear here; it is rendered live by Konva in ComponentNode.tsx -->

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
  {
    id: "bldc_motor",
    name: "BLDC Motor",
    category: "Output",
    viewBoxW: 140,
    viewBoxH: 140,
    svgBody: `
      <!-- Motor Body -->
      <circle cx="70" cy="70" r="60" fill="#2C3E50" stroke="#1B2631" stroke-width="2"/>
      <circle cx="70" cy="70" r="50" fill="#34495E"/>
      
      <!-- Internal Magnets/Coils -->
      ${Array.from({ length: 8 }).map((_, i) => `
        <rect x="65" y="25" width="10" height="20" rx="2" fill="#E74C3C" transform="rotate(${i * 45}, 70, 70)" opacity="0.8"/>
      `).join("")}

      <!-- Center Shaft -->
      <circle cx="70" cy="70" r="10" fill="#BDC3C7"/>
      <rect x="68" y="55" width="4" height="30" fill="#D5D8DC"/>

      <!-- Terminals (3 Phase) -->
      <rect x="40" y="120" width="8" height="15" rx="1" fill="#BDC3C7"/>
      <rect x="66" y="120" width="8" height="15" rx="1" fill="#BDC3C7"/>
      <rect x="92" y="120" width="8" height="15" rx="1" fill="#BDC3C7"/>
    `,
    litSvgBody: `
      <circle cx="70" cy="70" r="60" fill="#2C3E50" stroke="#1B2631" stroke-width="2"/>
      <circle cx="70" cy="70" r="50" fill="#34495E"/>
      <!-- Internal Coils Glowing -->
      ${Array.from({ length: 8 }).map((_, i) => `
        <rect x="65" y="25" width="10" height="20" rx="2" fill="#FF5252" transform="rotate(${i * 45}, 70, 70)">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="0.2s" repeatCount="indefinite" begin="${i * 0.05}s"/>
        </rect>
      `).join("")}
      <circle cx="70" cy="70" r="10" fill="#BDC3C7"/>
      <rect x="40" y="120" width="8" height="15" rx="1" fill="#BDC3C7"/>
      <rect x="66" y="120" width="8" height="15" rx="1" fill="#BDC3C7"/>
      <rect x="92" y="120" width="8" height="15" rx="1" fill="#BDC3C7"/>
    `,
    relativePins: [
      { name: "Phase A", relX: 44 / 140, relY: 130 / 140, type: "phase_a" },
      { name: "Phase B", relX: 70 / 140, relY: 130 / 140, type: "phase_b" },
      { name: "Phase C", relX: 96 / 140, relY: 130 / 140, type: "phase_c" },
    ],
  },
  {
    id: "esc",
    name: "Electronic Speed Controller (ESC)",
    category: "Controllers",
    viewBoxW: 120,
    viewBoxH: 100,
    svgBody: `
      <rect x="10" y="10" width="100" height="80" rx="4" fill="#1C2833" stroke="#2C3E50" stroke-width="2"/>
      <rect x="20" y="20" width="80" height="15" rx="2" fill="#C0392B" opacity="0.8"/>
      <text x="60" y="31" font-size="10" font-weight="bold" fill="#FFF" text-anchor="middle">30A ESC</text>
      
      <!-- Input Pins -->
      <rect x="20" y="0" width="6" height="15" rx="1" fill="#C0392B"/> <!-- + -->
      <rect x="35" y="0" width="6" height="15" rx="1" fill="#212121"/> <!-- - -->
      <rect x="50" y="0" width="6" height="15" rx="1" fill="#F1C40F"/> <!-- SIG -->
      
      <!-- Output Pins -->
      <rect x="30" y="85" width="8" height="15" rx="1" fill="#BDC3C7"/>
      <rect x="56" y="85" width="8" height="15" rx="1" fill="#BDC3C7"/>
      <rect x="82" y="85" width="8" height="15" rx="1" fill="#BDC3C7"/>
    `,
    relativePins: [
      { name: "Battery +", relX: 23 / 120, relY: 5 / 100, type: "positive" },
      { name: "Battery -", relX: 38 / 120, relY: 5 / 100, type: "negative" },
      { name: "Signal (PWM)", relX: 53 / 120, relY: 5 / 100, type: "signal" },
      { name: "Motor Phase A", relX: 34 / 120, relY: 95 / 100, type: "phase_a" },
      { name: "Motor Phase B", relX: 60 / 120, relY: 95 / 100, type: "phase_b" },
      { name: "Motor Phase C", relX: 86 / 120, relY: 95 / 100, type: "phase_c" },
    ],
  },
  {
    id: "ac_motor",
    name: "AC Motor",
    category: "Output",
    viewBoxW: 160,
    viewBoxH: 160,
    svgBody: `
      <!-- Fins -->
      ${Array.from({ length: 12 }).map((_, i) => `
        <rect x="20" y="${30 + i * 8}" width="120" height="4" fill="#7F8C8D" rx="1"/>
      `).join("")}
      
      <!-- Main Body -->
      <rect x="40" y="20" width="80" height="120" rx="10" fill="#BDC3C7" stroke="#95A5A6" stroke-width="2"/>
      
      <!-- Junction Box -->
      <rect x="60" y="10" width="40" height="25" rx="2" fill="#2C3E50"/>
      
      <!-- Terminals -->
      <rect x="68" y="0" width="6" height="10" rx="1" fill="#BDC3C7"/>
      <rect x="86" y="0" width="6" height="10" rx="1" fill="#BDC3C7"/>
      
      <!-- Shaft -->
      <circle cx="80" cy="145" r="12" fill="#D5D8DC" stroke="#BDC3C7"/>
      <rect x="78" y="145" width="4" height="15" fill="#7F8C8D"/>
    `,
    relativePins: [
      { name: "Line (L)", relX: 71 / 160, relY: 5 / 160, type: "line" },
      { name: "Neutral (N)", relX: 89 / 160, relY: 5 / 160, type: "neutral" },
    ],
  },
  {
    id: "stepper_motor",
    name: "Stepper Motor",
    category: "Output",
    viewBoxW: 140,
    viewBoxH: 140,
    svgBody: `
      <rect x="10" y="10" width="120" height="120" rx="8" fill="#34495E" stroke="#2C3E50" stroke-width="2"/>
      <rect x="25" y="25" width="90" height="90" rx="4" fill="#2C3E50"/>
      
      <!-- Face Screws -->
      <circle cx="25" cy="25" r="4" fill="#7F8C8D"/>
      <circle cx="115" cy="25" r="4" fill="#7F8C8D"/>
      <circle cx="25" cy="115" r="4" fill="#7F8C8D"/>
      <circle cx="115" cy="115" r="4" fill="#7F8C8D"/>
      
      <!-- Center Shaft -->
      <circle cx="70" cy="70" r="15" fill="#BDC3C7" stroke="#95A5A6"/>
      <rect x="67" y="55" width="6" height="30" fill="#7F8C8D"/>
      
      <!-- Connector -->
      <rect x="40" y="125" width="60" height="15" rx="2" fill="#1B2631"/>
      ${Array.from({ length: 4 }).map((_, i) => `
        <rect x="${48 + i * 12}" y="132" width="4" height="8" rx="1" fill="#BDC3C7"/>
      `).join("")}
    `,
    relativePins: [
      { name: "A1", relX: 50 / 140, relY: 136 / 140 },
      { name: "A2", relX: 62 / 140, relY: 136 / 140 },
      { name: "B1", relX: 74 / 140, relY: 136 / 140 },
      { name: "B2", relX: 86 / 140, relY: 136 / 140 },
    ],
  },
  {
    id: "sphere_red",
    name: "Charged Sphere",
    category: "Physics",
    viewBoxW: 100,
    viewBoxH: 100,
    svgBody: `
      <defs>
        <radialGradient id="sphere_grad" cx="40%" cy="35%">
          <stop offset="0%" stop-color="VAR_LIGHT" stop-opacity="0.9" />
          <stop offset="50%" stop-color="VAR_MAIN" stop-opacity="0.7" />
          <stop offset="100%" stop-color="VAR_DARK" stop-opacity="0.95" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#sphere_grad)" stroke="VAR_MAIN" stroke-width="2" />
    `,
    relativePins: [
      { name: "Ground (⏚)", relX: 0.5, relY: 0.9, type: "ground" }
    ],
  },
  {
    id: "earthing_icon",
    name: "Earthing",
    category: "Physics",
    viewBoxW: 100,
    viewBoxH: 100,
    svgBody: `
      <rect x="0" y="0" width="100" height="100" rx="10" fill="#F0FDF4"/>
      <rect x="46" y="16" width="8" height="36" rx="1" fill="#22C55E"/>
      <rect x="20" y="48" width="60" height="8" rx="1" fill="#22C55E"/>
      <rect x="28" y="62" width="44" height="8" rx="1" fill="#22C55E"/>
      <rect x="36" y="76" width="28" height="8" rx="1" fill="#22C55E"/>
    `,
    relativePins: [],
  },
];

/**
 * Returns { imageSrc, litImageSrc } data URLs for any LED color value (e.g. "blue", "red").
 * Safe to call at any time â€” STATIC_COMPONENTS is already initialised by the time
 * any React component renders.
 */
export function getLedDataUrls(
  colorValue: string,
  outlined = false,
  uniqueId = ""
): { imageSrc: string; litImageSrc?: string } {
  const def = STATIC_COMPONENTS.find((d) => d.id === `led_${colorValue}`);
  if (def) {
    return {
      imageSrc: svgToDataUrl(def, false, outlined, uniqueId),
      litImageSrc: def.litSvgBody ? svgToDataUrl(def, true, outlined, uniqueId) : undefined,
    };
  }
  // Fallback to red
  const fallback = STATIC_COMPONENTS.find((d) => d.id === "led_red");
  if (fallback) {
    return {
      imageSrc: svgToDataUrl(fallback, false, outlined, uniqueId),
      litImageSrc: fallback.litSvgBody ? svgToDataUrl(fallback, true, outlined, uniqueId) : undefined,
    };
  }
  return { imageSrc: "" };
}

export function getMicrobitDataUrls(
  colorValue: string,
  outlined = false,
  uniqueId = ""
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
    imageSrc: svgToDataUrl(modifiedDef, false, outlined, uniqueId),
    litImageSrc: modifiedDef.litSvgBody ? svgToDataUrl(modifiedDef, true, outlined, uniqueId) : undefined,
  };
}

export function getSphereDataUrls(
  metal: string,
  outlined = false,
  uniqueId = ""
): { imageSrc: string } {
  const def = STATIC_COMPONENTS.find((d) => d.id === "sphere_red");
  if (!def) return { imageSrc: "" };

  const colors = (METAL_PHYSICS[metal] || METAL_PHYSICS.Copper).colors;

  const modifiedDef = {
    ...def,
    svgBody: def.svgBody
      .replace(/VAR_MAIN/g, colors.main)
      .replace(/VAR_LIGHT/g, colors.light)
      .replace(/VAR_DARK/g, colors.dark)
  };

  return {
    imageSrc: svgToDataUrl(modifiedDef, false, outlined, uniqueId),
  };
}

export function getCapacitorDataUrl(
  capacitanceValue = 1000,
  capacitanceUnit = "uF",
  voltageValue = 25,
  outlined = false,
  uniqueId = ""
): string {
  const def = STATIC_COMPONENTS.find((d) => d.id === "capacitor");
  if (!def) return "";

  const displayUnit = (capacitanceUnit === "uF" || capacitanceUnit === "µF") ? "µF" : capacitanceUnit;
  const modifiedDef = {
    ...def,
    svgBody: def.svgBody
      .replace(/VAR_CAP_VALUE/g, `${capacitanceValue || 0}`)
      .replace(/VAR_CAP_UNIT/g, displayUnit || "µF")
      .replace(/VAR_CAP_VOLTAGE/g, `${voltageValue || 0}`),
  };

  return svgToDataUrl(modifiedDef, false, outlined, uniqueId);
}

export function getCapacitorShellDataUrl(outlined = false, uniqueId = ""): string {
  const def = STATIC_COMPONENTS.find((d) => d.id === "capacitor");
  if (!def) return "";

  const modifiedDef = {
    ...def,
    svgBody: def.svgBody
      .replace(/VAR_CAP_VALUE/g, "")
      .replace(/VAR_CAP_UNIT/g, "")
      .replace(/VAR_CAP_VOLTAGE/g, ""),
  };

  return svgToDataUrl(modifiedDef, false, outlined, uniqueId);
}
/*
  <circle cx="70" cy = "70" r = "15" fill = "#BDC3C7" stroke = "#95A5A6" />
    <rect x="67" y = "55" width = "6" height = "30" fill = "#7F8C8D" />

      <!--Connector -->
        <rect x="40" y = "125" width = "60" height = "15" rx = "2" fill = "#1B2631" />
          ${
            Array.from({ length: 4 }).map((_, i) => `
        <rect x="${48 + i * 12}" y="132" width="4" height="8" rx="1" fill="#BDC3C7"/>
      `).join("")
}
`,
    relativePins: [
      { name: "A1", relX: 50 / 140, relY: 136 / 140 },
      { name: "A2", relX: 62 / 140, relY: 136 / 140 },
      { name: "B1", relX: 74 / 140, relY: 136 / 140 },
      { name: "B2", relX: 86 / 140, relY: 136 / 140 },
    ],
  },
  {
    id: "sphere_red",
    name: "Charged Sphere",
    category: "Physics",
    viewBoxW: 100,
    viewBoxH: 100,
    svgBody: `
  < defs >
  <radialGradient id="sphere_grad" cx = "40%" cy = "35%" >
    <stop offset="0%" stop - color="VAR_LIGHT" stop - opacity="0.9" />
      <stop offset="50%" stop - color="VAR_MAIN" stop - opacity="0.7" />
        <stop offset="100%" stop - color="VAR_DARK" stop - opacity="0.95" />
          </radialGradient>
          </defs>
          < circle cx = "50" cy = "50" r = "40" fill = "url(#sphere_grad)" stroke = "VAR_MAIN" stroke - width="2" />
            `,
    relativePins: [
      { name: "Ground (⏚)", relX: 0.5, relY: 0.9, type: "ground" }
    ],
  },
  {
    id: "earthing_icon",
    name: "Earthing",
    category: "Physics",
    viewBoxW: 100,
    viewBoxH: 100,
    svgBody: `
            < rect x = "0" y = "0" width = "100" height = "100" rx = "10" fill = "#F0FDF4" />
              <rect x="46" y = "16" width = "8" height = "36" rx = "1" fill = "#22C55E" />
                <rect x="20" y = "48" width = "60" height = "8" rx = "1" fill = "#22C55E" />
                  <rect x="28" y = "62" width = "44" height = "8" rx = "1" fill = "#22C55E" />
                    <rect x="36" y = "76" width = "28" height = "8" rx = "1" fill = "#22C55E" />
                      `,
    relativePins: [],
  },
];

/**
 * Returns { imageSrc, litImageSrc } data URLs for any LED color value (e.g. "blue", "red").
 * Safe to call at any time â€” STATIC_COMPONENTS is already initialised by the time
 * any React component renders.
 * /
export function getLedDataUrls(
  colorValue: string,
  outlined = false
): { imageSrc: string; litImageSrc?: string } {
  const def = STATIC_COMPONENTS.find((d) => d.id === `led_${ colorValue } `);
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
    svgBody: def.svgBody.replace('fill="#1B1B1B"', `fill = "${pcbColor}"`),
    litSvgBody: def.litSvgBody?.replace('fill="#1B1B1B"', `fill = "${pcbColor}"`),
  };

  return {
    imageSrc: svgToDataUrl(modifiedDef, false, outlined),
    litImageSrc: modifiedDef.litSvgBody ? svgToDataUrl(modifiedDef, true, outlined) : undefined,
  };
}

export function getSphereDataUrls(
  metal: string,
  outlined = false
): { imageSrc: string } {
  const def = STATIC_COMPONENTS.find((d) => d.id === "sphere_red");
  if (!def) return { imageSrc: "" };

  const colors = (METAL_PHYSICS[metal] || METAL_PHYSICS.Copper).colors;

  const modifiedDef = {
    ...def,
    svgBody: def.svgBody
      .replace(/VAR_MAIN/g, colors.main)
      .replace(/VAR_LIGHT/g, colors.light)
      .replace(/VAR_DARK/g, colors.dark)
  };

  return {
    imageSrc: svgToDataUrl(modifiedDef, false, outlined),
  };
} */
