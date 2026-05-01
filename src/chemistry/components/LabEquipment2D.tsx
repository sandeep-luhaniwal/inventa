"use client";

type EquipmentType =
  | "test-tube"
  | "large-test-tube"
  | "round-flask"
  | "conical-flask"
  | "gas-bottle"
  | "beaker"
  | "measuring-cylinder"
  | "funnel"
  | "burner"
  | "alcohol-burner"
  | "dropper";

type Props = {
  type: EquipmentType;
  size?: number;
  glow?: boolean;
  className?: string;
};

const glassProps = {
  stroke: "rgba(255,255,255,0.85)",
  strokeWidth: 1.5,
  fill: "rgba(150,210,255,0.07)",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const shineProps = {
  stroke: "rgba(255,255,255,0.35)",
  strokeWidth: 1,
  fill: "none",
  strokeLinecap: "round" as const,
};

function TestTube({ large }: { large?: boolean }) {
  const h = large ? 72 : 52;
  const w = large ? 18 : 13;
  const cx = 50;
  const top = large ? 18 : 24;
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(100,180,255,0.18)" />
          <stop offset="100%" stopColor="rgba(100,180,255,0.04)" />
        </linearGradient>
      </defs>
      {/* neck rim */}
      <rect x={cx - w / 2 - 2} y={top - 4} width={w + 4} height={4} rx={1.5} {...glassProps} fill="rgba(150,210,255,0.12)" />
      {/* tube body */}
      <path
        d={`M${cx - w / 2} ${top} L${cx - w / 2} ${top + h - w / 2} Q${cx} ${top + h} ${cx + w / 2} ${top + h - w / 2} L${cx + w / 2} ${top}`}
        {...glassProps}
        fill="url(#tg)"
      />
      {/* liquid */}
      <path
        d={`M${cx - w / 2 + 1} ${top + h * 0.55} L${cx - w / 2 + 1} ${top + h - w / 2 - 2} Q${cx} ${top + h - 2} ${cx + w / 2 - 1} ${top + h - w / 2 - 2} L${cx + w / 2 - 1} ${top + h * 0.55}`}
        fill="rgba(80,200,180,0.28)"
        stroke="rgba(80,200,180,0.5)"
        strokeWidth={0.8}
      />
      {/* shine */}
      <line x1={cx - w / 2 + 3} y1={top + 6} x2={cx - w / 2 + 3} y2={top + h * 0.45} {...shineProps} />
    </svg>
  );
}

function RoundFlask() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rfg" cx="40%" cy="40%">
          <stop offset="0%" stopColor="rgba(150,210,255,0.18)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.04)" />
        </radialGradient>
      </defs>
      {/* neck */}
      <rect x={44} y={12} width={12} height={22} rx={3} {...glassProps} fill="rgba(150,210,255,0.1)" />
      {/* rim */}
      <rect x={42} y={10} width={16} height={5} rx={2} {...glassProps} fill="rgba(150,210,255,0.15)" />
      {/* body */}
      <circle cx={50} cy={66} r={26} {...glassProps} fill="url(#rfg)" />
      {/* liquid */}
      <path d="M26 72 Q28 90 50 90 Q72 90 74 72 Z" fill="rgba(80,200,180,0.28)" stroke="rgba(80,200,180,0.5)" strokeWidth={0.8} />
      {/* shine */}
      <ellipse cx={40} cy={55} rx={4} ry={7} fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}

function ConicalFlask() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cfg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(150,210,255,0.16)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.04)" />
        </linearGradient>
      </defs>
      {/* neck */}
      <rect x={44} y={10} width={12} height={20} rx={3} {...glassProps} fill="rgba(150,210,255,0.1)" />
      {/* rim */}
      <rect x={42} y={8} width={16} height={5} rx={2} {...glassProps} fill="rgba(150,210,255,0.15)" />
      {/* body */}
      <path d="M44 30 L22 86 Q24 90 50 90 Q76 90 78 86 L56 30 Z" {...glassProps} fill="url(#cfg)" />
      {/* liquid */}
      <path d="M28 76 L72 76 Q74 88 50 88 Q26 88 28 76 Z" fill="rgba(80,200,180,0.28)" stroke="rgba(80,200,180,0.5)" strokeWidth={0.8} />
      {/* shine */}
      <line x1={30} y1={50} x2={36} y2={80} {...shineProps} />
    </svg>
  );
}

function GasBottle() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gbg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(150,210,255,0.2)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.05)" />
        </linearGradient>
      </defs>
      {/* valve */}
      <rect x={44} y={8} width={12} height={8} rx={2} fill="rgba(180,180,200,0.3)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
      <rect x={46} y={6} width={8} height={4} rx={1.5} fill="rgba(180,180,200,0.4)" stroke="rgba(255,255,255,0.7)" strokeWidth={1} />
      {/* neck */}
      <rect x={45} y={16} width={10} height={10} rx={2} {...glassProps} fill="rgba(150,210,255,0.12)" />
      {/* shoulder */}
      <path d="M45 26 Q30 30 28 40 L28 82 Q28 88 50 88 Q72 88 72 82 L72 40 Q70 30 55 26 Z" {...glassProps} fill="url(#gbg)" />
      {/* base ring */}
      <ellipse cx={50} cy={87} rx={22} ry={4} fill="rgba(100,150,200,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      {/* shine */}
      <line x1={34} y1={38} x2={34} y2={78} {...shineProps} />
    </svg>
  );
}

function Beaker() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bkg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(150,210,255,0.16)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.04)" />
        </linearGradient>
      </defs>
      {/* spout */}
      <path d="M68 18 L76 14 L76 22 Z" fill="rgba(150,210,255,0.2)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeLinejoin="round" />
      {/* body */}
      <path d="M28 20 L28 84 Q28 88 50 88 Q72 88 72 84 L72 20 Z" {...glassProps} fill="url(#bkg)" />
      {/* rim */}
      <rect x={26} y={16} width={48} height={6} rx={2} {...glassProps} fill="rgba(150,210,255,0.15)" />
      {/* liquid */}
      <path d="M29 68 L71 68 L71 84 Q71 87 50 87 Q29 87 29 84 Z" fill="rgba(80,200,180,0.28)" stroke="rgba(80,200,180,0.5)" strokeWidth={0.8} />
      {/* graduation lines */}
      {[40, 52, 64].map((y) => (
        <line key={y} x1={29} y1={y} x2={36} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
      ))}
      {/* shine */}
      <line x1={34} y1={24} x2={34} y2={65} {...shineProps} />
    </svg>
  );
}

function MeasuringCylinder() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mcg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(150,210,255,0.16)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.04)" />
        </linearGradient>
      </defs>
      {/* spout */}
      <path d="M58 12 L66 8 L66 16 Z" fill="rgba(150,210,255,0.2)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} strokeLinejoin="round" />
      {/* body */}
      <path d="M38 14 L38 84 Q38 88 50 88 Q62 88 62 84 L62 14 Z" {...glassProps} fill="url(#mcg)" />
      {/* rim */}
      <rect x={36} y={10} width={28} height={6} rx={2} {...glassProps} fill="rgba(150,210,255,0.15)" />
      {/* base */}
      <ellipse cx={50} cy={87} rx={18} ry={4} fill="rgba(100,150,200,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      {/* liquid */}
      <path d="M39 65 L61 65 L61 84 Q61 87 50 87 Q39 87 39 84 Z" fill="rgba(80,200,180,0.28)" stroke="rgba(80,200,180,0.5)" strokeWidth={0.8} />
      {/* graduation lines */}
      {[30, 40, 50, 60].map((y) => (
        <line key={y} x1={39} y1={y} x2={46} y2={y} stroke="rgba(255,255,255,0.3)" strokeWidth={0.8} />
      ))}
      {/* shine */}
      <line x1={43} y1={18} x2={43} y2={62} {...shineProps} />
    </svg>
  );
}

function Funnel() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fng" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(150,210,255,0.16)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.04)" />
        </linearGradient>
      </defs>
      {/* cone */}
      <path d="M18 16 L82 16 L56 62 L56 88 L44 88 L44 62 Z" {...glassProps} fill="url(#fng)" />
      {/* rim */}
      <rect x={16} y={12} width={68} height={6} rx={2} {...glassProps} fill="rgba(150,210,255,0.15)" />
      {/* shine */}
      <line x1={26} y1={22} x2={44} y2={58} {...shineProps} />
    </svg>
  );
}

function Burner() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flame" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="rgba(80,140,255,0.9)" />
          <stop offset="60%" stopColor="rgba(120,200,255,0.7)" />
          <stop offset="100%" stopColor="rgba(200,240,255,0.0)" />
        </linearGradient>
        <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,190,210,0.4)" />
          <stop offset="100%" stopColor="rgba(80,90,120,0.4)" />
        </linearGradient>
      </defs>
      {/* flame */}
      <path d="M50 18 Q44 30 46 40 Q48 48 50 44 Q52 48 54 40 Q56 30 50 18 Z" fill="url(#flame)" />
      <path d="M50 28 Q47 36 49 42 Q50 46 51 42 Q53 36 50 28 Z" fill="rgba(200,240,255,0.5)" />
      {/* barrel */}
      <rect x={44} y={44} width={12} height={20} rx={3} fill="url(#base)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
      {/* air hole ring */}
      <rect x={42} y={56} width={16} height={5} rx={2} fill="rgba(100,120,160,0.4)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      {/* base */}
      <rect x={30} y={64} width={40} height={8} rx={3} fill="url(#base)" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
      {/* feet */}
      <rect x={32} y={72} width={8} height={14} rx={2} fill="rgba(100,120,160,0.4)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      <rect x={60} y={72} width={8} height={14} rx={2} fill="rgba(100,120,160,0.4)" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
      {/* gas tube */}
      <path d="M50 72 Q50 82 38 84" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function AlcoholBurner() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ab_glassBody" cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
        </radialGradient>
        <filter id="ab_ultraGlass" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="40" lightingColor="#ffffff" result="spec">
            <fePointLight x="-50" y="-50" z="200" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Shadow */}
      <ellipse cx="80" cy="145" rx="50" ry="8" fill="rgba(0,0,0,0.15)" />

      {/* Volumetric Body */}
      <g filter="url(#ab_ultraGlass)">
        <path
          d="M40 120 q0 15 40 15 t40 -15 q0 -30 -20 -55 t-20 -40 h-10 q0 15 -20 40 t-20 55Z"
          fill="url(#ab_glassBody)"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />
        
        {/* Alcohol Liquid */}
        <path
          d="M45 115 q0 10 35 10 t35 -10 q-8 -15 -35 -15 t-35 15Z"
          fill="#3b82f6"
          fillOpacity="0.25"
        />

        {/* The Wick */}
        <path
          d="M80 35 L80 50 q0 20 15 40 t0 40"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />

        {/* Glass Cap (Off-center like reference) */}
        <path
          d="M105 40 q0 -25 12 -25 t12 25 v20 q0 2 -12 2 t-12 -2 Z"
          fill="rgba(255,255,255,0.1)"
          stroke="#ffffff"
          strokeWidth="0.5"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  );
}

function Dropper() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="drg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(150,210,255,0.16)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.04)" />
        </linearGradient>
      </defs>
      {/* rubber bulb */}
      <ellipse cx={50} cy={22} rx={14} ry={16} fill="rgba(200,60,60,0.55)" stroke="rgba(255,120,120,0.8)" strokeWidth={1.5} />
      {/* bulb highlight */}
      <ellipse cx={44} cy={16} rx={5} ry={4} fill="rgba(255,180,180,0.2)" />
      {/* glass tube */}
      <rect x={46} y={36} width={8} height={42} rx={3} {...glassProps} fill="url(#drg)" />
      {/* liquid in tube */}
      <rect x={47} y={52} width={6} height={22} rx={2} fill="rgba(80,200,180,0.35)" />
      {/* tip */}
      <path d="M46 78 L50 90 L54 78 Z" {...glassProps} fill="rgba(150,210,255,0.1)" />
      {/* drop */}
      <ellipse cx={50} cy={94} rx={2.5} ry={3.5} fill="rgba(80,200,180,0.7)" stroke="rgba(80,200,180,0.9)" strokeWidth={0.8} />
      {/* shine */}
      <line x1={48} y1={40} x2={48} y2={72} {...shineProps} />
    </svg>
  );
}

const equipmentMap: Record<string, React.ReactNode> = {
  "test-tube": <TestTube />,
  "large-test-tube": <TestTube large />,
  "round-flask": <RoundFlask />,
  "conical-flask": <ConicalFlask />,
  "gas-bottle": <GasBottle />,
  beaker: <Beaker />,
  "measuring-cylinder": <MeasuringCylinder />,
  funnel: <Funnel />,
  burner: <AlcoholBurner />,
  dropper: <Dropper />,
  "alcohol-burner": <AlcoholBurner />,
};

export default function LabEquipment2D({ type, size = 80, glow = true, className = "" }: Props) {
  return (
    <div
      className={`flex items-center justify-center transition-all duration-300 hover:scale-110 ${className}`}
      style={{
        width: size,
        height: size,
        filter: glow ? "drop-shadow(0 0 8px rgba(80,160,255,0.7)) drop-shadow(0 0 2px rgba(150,220,255,0.4))" : undefined,
      }}
    >
      {equipmentMap[type]}
    </div>
  );
}
