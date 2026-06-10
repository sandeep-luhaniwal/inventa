"use client"
import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';
import { PlacedComponent } from '@/simulator/types/circuit';
import { LED_COLOR_OPTIONS } from '@/simulator/constants/circuit';
import { getComponentInfo } from '@/simulator/constants/componentInfo';
import { METAL_OPTIONS, METAL_PHYSICS } from '@/simulator/constants/physics';
import ComponentInfoModal from './ComponentInfoModal';

interface PropertyPanelProps {
  component: PlacedComponent;
  onUpdate: (id: string, updates: Partial<PlacedComponent>) => void;
  onClose: () => void;
}

const CHARGE_UNITS = ["C", "mC", "µC", "nC"];
const ELECTRIC_FIELD_K = 9e9;
const CHARGE_UNIT_MULTIPLIER: Record<string, number> = {
  C: 1,
  mC: 1e-3,
  uC: 1e-6,
  nC: 1e-9,
};

const CHARGING_METHOD_OPTIONS = [
  "Methods of Charging",
  "Friction",
  "Conduction",
  "Induction",
];
const EARTHING_OPTIONS = ["Not Earthing", "Earthing", ];
const MEDIUM_OPTIONS = [
  { name: "Vacuum", value: 1 },
  { name: "Air", value: 1.0006 },
  { name: "Glass", value: 5 },
  { name: "Paper", value: 3.7 },
  { name: "Mica", value: 6 },
  { name: "Water", value: 80 },
  { name: "Metal", value: Infinity },
];
const FLUX_SURFACE_OPTIONS = ["Triangular", "Disc", "Cylindrical", "Spherical"] as const;
const SPHERE_MIN_SIZE = 15;
const SPHERE_MAX_SIZE = 220;
const FLUX_SURFACE_MIN_SIZE = 40;
const FLUX_SURFACE_MAX_SIZE = 180;
const POTENTIAL_RING_RADIUS_FACTOR = 4;

function normalizeChargeUnit(unit = "uC") {
  return unit.replace("Ã‚Âµ", "u").replace("Âµ", "u");
}

function toCoulombs(value = 0, unit = "uC") {
  return value * (CHARGE_UNIT_MULTIPLIER[normalizeChargeUnit(unit)] ?? 1e-6);
}

function formatElectricField(value: number) {
  if (!Number.isFinite(value)) return "infinity N/C";
  if (value === 0) return "0 N/C";
  if (Math.abs(value) >= 1e6) return `${value.toExponential(2)} N/C`;
  return `${value.toFixed(2)} N/C`;
}

function formatFlux(value: number) {
  if (!Number.isFinite(value)) return "infinity N m^2/C";
  if (value === 0) return "0 N m^2/C";
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.01) return `${value.toExponential(2)} N m^2/C`;
  return `${value.toFixed(2)} N m^2/C`;
}

function formatPotential(value: number) {
  if (!Number.isFinite(value)) return "infinity V";
  if (value === 0) return "0 V";
  if (Math.abs(value) >= 1e6 || Math.abs(value) < 0.01) return `${value.toExponential(2)} V`;
  return `${value.toFixed(2)} V`;
}

const CHARGING_THEORY: Record<string, { summary: string; bullets: string[] }> = {
  "Methods of Charging": {
    summary:
      "Charge is of two types: positive and negative. A body becomes charged when electrons are transferred, removed, or redistributed.",
    bullets: [
      "Like charges repel and unlike charges attract.",
      "A neutral body has equal positive and negative charge.",
      "Charging is commonly demonstrated by friction, conduction, and induction.",
    ],
  },
  Friction: {
    summary:
      "Charging by friction happens when two different metals are rubbed and electrons transfer based on Work Functions (Wf).",
    bullets: [
      "Low Wf (e.g., Cesium 2.14 eV) loses electrons and becomes Positive (+).",
      "High Wf (e.g., Platinum 5.65 eV) gains electrons and becomes Negative (-).",
      "If both spheres are same metal (same Wf), no net charge is generated.",
    ],
  },
  Conduction: {
    summary:
      "Charging by conduction happens through direct contact. Charge flows until both spheres reach the same Electric Potential (V).",
    bullets: [
      "For two same-sized spheres, charge is shared equally: (Q1 + Q2) / 2.",
      "The total charge (Q1 + Q2) remains conserved.",
      "If positive and negative charges cancel out, both spheres become neutral.",
    ],
  },
  Induction: {
    summary:
      "Charging by induction happens without direct contact. A nearby charged body separates charges inside the conductor.",
    bullets: [
      "Step 1: Bring a charged sphere near the neutral sphere.",
      "Step 2: Set Earthing to 'Earthed' (electrons flow from/to ground).",
      "Step 3: Set Earthing back to 'Not Earthed' to trap the charge.",
      "Step 4: Move the charged sphere away for a permanent charge.",
    ],
  },
  Earthing: {
    summary:
      "Earthing connects the body to the ground so excess electrons can move to earth or be supplied from earth.",
    bullets: [
      "It is used to neutralize a charged body safely.",
      "It is essential in induction experiments to obtain a permanent net charge.",
      "Good earthing is easiest with conducting materials such as metals.",
    ],
  },
};

const PHYSICS_TOPIC_THEORY: Record<string, { summary: string; bullets: string[] }> = {
  "Coulomb's Law": {
    summary:
      "Coulomb's Law calculates the electrostatic force between two charged spheres: F = k |q1 q2| / r².",
    bullets: [
      "Like charges repel and unlike charges attract.",
      "Force increases when charge values increase.",
      "Force decreases rapidly as distance increases.",
      "In a medium, force becomes F = k |q1 q2| / (K r^2).",
      "For 3 or more spheres, calculate every pair force and add them as vectors.",
      "Resultant force: FR = sqrt(F1^2 + F2^2 + 2 F1 F2 cos theta).",
    ],
  },
  "Electric Field Intensity": {
    summary:
      "Electric field intensity is the force per unit positive test charge at a point: E = F / q0.",
    bullets: [
      "Conducting/Hollow sphere: if r < R, E = 0; if r >= R, E = kq / r^2.",
      "Non-Conducting/Solid sphere: if r < R, E = kqr / R^3; if r >= R, E = kq / r^2.",
      "Field lines go outward for positive charge and inward for negative charge.",
    ],
  },
  "Electric Field Lines": {
    summary:
      "Electric field lines show the direction and density of the electric field around charges.",
    bullets: [
      "Lines originate from positive charge and terminate on negative charge.",
      "Lines are perpendicular to the conductor surface.",
      "Higher charge produces denser field lines.",
      "Like charges repel field paths; unlike charges connect from + to -.",
      "Field lines never cross each other and do not form closed loops.",
    ],
  },
  "Electric Flux": {
    summary:
      "Electric flux is the number of electric field lines passing through a surface: Phi = E * A * cos(theta).",
    bullets: [
      "Area A increases flux in direct proportion.",
      "Angle theta controls alignment; at 90 degrees flux becomes zero.",
      "For closed cylindrical/spherical Gaussian surfaces, total flux is q / epsilon0.",
    ],
  },
  "Electric Potential": {
    summary:
      "Electric potential is work stored per unit test charge at a point near a charged conducting sphere: V = kQ / r.",
    bullets: [
      "Outside the sphere (r > R): V = kQ / r and E = kQ / r^2.",
      "At the surface (r = R): Vmax = kQ / R.",
      "Inside a conducting sphere (r < R): E = 0 and V stays constant at kQ / R.",
      "Potential rings fade with distance because V is inversely proportional to r.",
    ],
  },
  "Electric Potential Difference": {
    summary:
      "Electric potential difference is work done per unit positive charge between two points: delta V = VB - VA = WAB / q.",
    bullets: [
      "Use one charged sphere as source Q and two small spheres as voltmeter probe points A and B.",
      "Point potentials are VA = kQ / (K rA) and VB = kQ / (K rB).",
      "If both probes are on the same equipotential ring, delta V is zero.",
      "Increasing medium dielectric K reduces the reading: delta Vmedium = delta V / K.",
    ],
  },
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({ component, onUpdate, onClose }) => {
  const isLed = component.componentId.startsWith('led');
  const isMicrobit = component.componentId === 'microbit';
  const isChargedSphere = component.componentId.startsWith('sphere_');
  const isPowerSupply = component.componentId === "dc_power_supply" || component.componentId === "ac_power_supply";
  const isAcPowerSupply = component.componentId === "ac_power_supply";
  const showColor = isLed || isMicrobit;
  const [showTooltip, setShowTooltip] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const componentInfo = getComponentInfo(component.componentId);
  const selectedMethod = component.physicsChargeMethod || "Methods of Charging";
  const selectedMetal = component.physicsMetal || "Copper";
  const selectedMetalMeta = METAL_PHYSICS[selectedMetal] || METAL_PHYSICS.Copper;
  const selectedPhysicsTopic = component.physicsTopic || "Methods of Charging";
  const showChargingMethodInput = selectedPhysicsTopic === "Methods of Charging";
  const isCoulombTopic = selectedPhysicsTopic === "Coulomb's Law";
  const isElectricFieldTopic = selectedPhysicsTopic === "Electric Field Intensity";
  const isElectricFieldLinesTopic = selectedPhysicsTopic === "Electric Field Lines";
  const isElectricFluxTopic = selectedPhysicsTopic === "Electric Flux";
  const isElectricPotentialTopic = selectedPhysicsTopic === "Electric Potential";
  const isElectricPotentialDifferenceTopic = selectedPhysicsTopic === "Electric Potential Difference";
  const sphereSize = Math.round(component.width || 100);
  const sphereRadiusM = ((component.width || 100) / 2) / 100;
  const observationDistance = component.physicsObservationDistance ?? Math.max(1, sphereRadiusM);
  const selectedSphereType = component.physicsSphereType || "Conducting";
  const selectedFluxSurface = component.physicsFluxSurfaceType || "Disc";
  const fluxArea = component.physicsFluxArea ?? 1;
  const fluxAngle = component.physicsFluxAngle ?? 0;
  const fluxSurfaceSize = Math.round(component.physicsFluxSurfaceSize ?? 100);
  const chargeCoulombs = toCoulombs(component.chargeValue || 0, component.chargeUnit);
  const electricField =
    selectedSphereType === "Conducting" && observationDistance < sphereRadiusM
      ? 0
      : selectedSphereType === "Non-Conducting" && observationDistance < sphereRadiusM
        ? (ELECTRIC_FIELD_K * Math.abs(chargeCoulombs) * observationDistance) / Math.pow(sphereRadiusM || 1, 3)
        : (ELECTRIC_FIELD_K * Math.abs(chargeCoulombs)) / Math.pow(observationDistance || 1, 2);
  const fluxField = observationDistance > 0 ? (ELECTRIC_FIELD_K * Math.abs(chargeCoulombs)) / Math.pow(observationDistance, 2) : 0;
  const electricFlux = selectedFluxSurface === "Cylindrical" || selectedFluxSurface === "Spherical"
    ? Math.abs(chargeCoulombs) / 8.854e-12
    : fluxField * fluxArea * Math.cos((fluxAngle * Math.PI) / 180);
  const potentialDistance = observationDistance > 0 ? observationDistance : sphereRadiusM;
  const potentialOuterRingRadius = sphereRadiusM * POTENTIAL_RING_RADIUS_FACTOR;
  const electricPotential = Math.abs(chargeCoulombs) === 0
    ? 0
    : !Number.isFinite(potentialDistance)
      ? 0
      : potentialDistance < sphereRadiusM
      ? (ELECTRIC_FIELD_K * chargeCoulombs) / (sphereRadiusM || 1)
      : (ELECTRIC_FIELD_K * chargeCoulombs) / potentialDistance;
  const distanceInputValue = isElectricPotentialTopic && !Number.isFinite(observationDistance)
    ? ""
    : observationDistance;
  const selectedMedium = component.physicsMedium || "Vacuum";
  const selectedDielectric = component.physicsDielectric ?? 1;
  const activeTheory = showChargingMethodInput
    ? CHARGING_THEORY[selectedMethod] || CHARGING_THEORY["Methods of Charging"]
    : PHYSICS_TOPIC_THEORY[selectedPhysicsTopic] || {
      summary: `${selectedPhysicsTopic} settings are shown for the selected sphere.`,
      bullets: [
        "Use charge value and unit to set the sphere state.",
        "Move charged spheres on the canvas to observe the related visual effect.",
      ],
    };

  const updateSphereCharge = (nextChargeValue: number) => {
    const currentMagnitude = Math.abs(component.chargeValue || 0);
    const nextMagnitude = Math.abs(nextChargeValue);

    const updates: Partial<PlacedComponent> = {
      chargeValue: nextChargeValue,
    };

    if (nextMagnitude > currentMagnitude) {
      updates.physicsWaveDirection = "outward";
      updates.physicsWaveTick = Date.now();
    } else if (nextMagnitude < currentMagnitude) {
      updates.physicsWaveDirection = "inward";
      updates.physicsWaveTick = Date.now();
    }

    onUpdate(component.id, updates);
  };

  const updateMedium = (mediumName: string) => {
    const medium = MEDIUM_OPTIONS.find((option) => option.name === mediumName) || MEDIUM_OPTIONS[0];
    onUpdate(component.id, {
      physicsMedium: medium.name,
      physicsDielectric: medium.value,
    });
  };

  const updateSphereSize = (nextSize: number) => {
    const size = Math.max(SPHERE_MIN_SIZE, Math.min(SPHERE_MAX_SIZE, Math.round(nextSize || 100)));
    const currentWidth = component.width || 100;
    const currentHeight = component.height || currentWidth;
    const centerX = component.x + currentWidth / 2;
    const centerY = component.y + currentHeight / 2;

    onUpdate(component.id, {
      width: size,
      height: size,
      physicsRadius: size / 2,
      x: centerX - size / 2,
      y: centerY - size / 2,
    });
  };

  return (
    <>
      <div className="absolute top-4 right-4 w-72 bg-white rounded-md shadow-2xl border-2 border-[#02adea] flex flex-col z-50 overflow-visible font-sans">
        {/* Header */}
        <div className="bg-[#02adea] px-3 py-2 flex items-center justify-between text-white select-none rounded-t-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide uppercase">
              {isLed ? 'LED' : component.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Help button — tooltip on hover, modal on click */}
            <div className="relative">
              <button
                className="hover:bg-white/20 p-1 rounded-full transition-colors"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => { setShowTooltip(false); setShowInfoModal(true); }}
                title="Learn more"
              >
                <HelpCircle size={18} />
              </button>
              {showTooltip && (
                <div className="absolute top-full left-0 mt-2 z-[9999] bg-[#333] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-[#333] rotate-45 rounded-sm" />
                  Learn more
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="hover:bg-red-500/80 p-0.5 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-2 space-y-2">
          {/* Name Field */}
          <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
            <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
              Name
            </div>
            <input
              type="text"
              value={component.name}
              onChange={(e) => onUpdate(component.id, { name: e.target.value })}
              className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none"
            />
          </div>

          {component.componentId === "pushbutton" && (
            <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
              <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                Status
              </div>
              <div className="flex-1 relative">
                <select
                  value={component.isPressed ? "On" : "Off"}
                  onChange={(e) => onUpdate(component.id, { isPressed: e.target.value === "On" })}
                  className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                >
                  <option value="On">On</option>
                  <option value="Off">Off</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          {isChargedSphere && (
            <>
              <div className="flex gap-1 h-9">
                <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                  <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[85px]">
                    Charge
                  </div>
                  <input
                    type="number"
                    value={component.chargeValue || 0}
                    onChange={(e) => {
                      updateSphereCharge(parseFloat(e.target.value) || 0);
                    }}
                    className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                  />
                </div>
                <div className="w-20 border-2 border-[#02adea] rounded-md overflow-hidden relative">
                  <select
                    value={component.chargeUnit || "uC"}
                    onChange={(e) => onUpdate(component.id, { chargeUnit: e.target.value })}
                    className="w-full h-full px-2 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    {CHARGE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Metal
                </div>
                <div className="flex-1 relative">
                  <select
                    value={selectedMetal}
                    onChange={(e) => onUpdate(component.id, { physicsMetal: e.target.value })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    {METAL_OPTIONS.map((metal) => (
                      <option key={metal} value={metal}>{metal}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 rounded-md border-2 border-[#02adea] px-3 py-2">
                <div className="flex min-w-[58px] items-center text-xs font-bold text-[#02adea]">
                  Size
                </div>
                <input
                  type="range"
                  min={SPHERE_MIN_SIZE}
                  max={SPHERE_MAX_SIZE}
                  step={5}
                  value={sphereSize}
                  onChange={(e) => updateSphereSize(parseFloat(e.target.value))}
                  className="min-w-0 flex-1 accent-[#02adea]"
                />
                <input
                  type="number"
                  min={SPHERE_MIN_SIZE}
                  max={SPHERE_MAX_SIZE}
                  step={5}
                  value={sphereSize}
                  onChange={(e) => updateSphereSize(parseFloat(e.target.value))}
                  className="w-14 rounded border border-[#02adea]/40 px-1.5 py-0.5 text-xs font-semibold text-[#02adea] outline-none"
                />
              </div>

              {(isElectricFieldTopic || isElectricFluxTopic || isElectricPotentialTopic) && (
                <>
                  {isElectricFieldTopic && (
                    <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                      <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                        Type
                      </div>
                      <div className="flex-1 relative">
                        <select
                          value={selectedSphereType}
                          onChange={(e) => onUpdate(component.id, { physicsSphereType: e.target.value as PlacedComponent["physicsSphereType"] })}
                          className="w-full h-full px-3 py-1 text-xs text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                        >
                          <option value="Conducting">Conducting / Hollow</option>
                          <option value="Non-Conducting">Non-Conducting / Solid</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1 h-9">
                    <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                      <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                        Distance r
                      </div>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={distanceInputValue}
                        placeholder={isElectricPotentialTopic ? "infinity" : undefined}
                        onChange={(e) => onUpdate(component.id, {
                          physicsObservationDistance: Math.max(0, parseFloat(e.target.value) || 0),
                        })}
                        className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                      />
                    </div>
                    <div className="w-14 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                      m
                    </div>
                  </div>
                  {isElectricFluxTopic && (
                    <>
                      <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                        <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                          Surface
                        </div>
                        <div className="flex-1 relative">
                          <select
                            value={selectedFluxSurface}
                            onChange={(e) => onUpdate(component.id, { physicsFluxSurfaceType: e.target.value as PlacedComponent["physicsFluxSurfaceType"] })}
                            className="w-full h-full px-3 py-1 text-xs text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                          >
                            {FLUX_SURFACE_OPTIONS.map((surface) => (
                              <option key={surface} value={surface}>{surface}</option>
                            ))}
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 h-9">
                        <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                          <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                            Area A
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={fluxArea}
                            onChange={(e) => onUpdate(component.id, { physicsFluxArea: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                          />
                        </div>
                        <div className="w-14 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                          m2
                        </div>
                      </div>

                      <div className="flex gap-2 rounded-md border-2 border-[#02adea] px-3 py-2">
                        <div className="flex min-w-[82px] items-center text-xs font-bold text-[#02adea]">
                          Surface Size
                        </div>
                        <input
                          type="range"
                          min={FLUX_SURFACE_MIN_SIZE}
                          max={FLUX_SURFACE_MAX_SIZE}
                          step={5}
                          value={fluxSurfaceSize}
                          onChange={(e) => onUpdate(component.id, {
                            physicsFluxSurfaceSize: Math.max(FLUX_SURFACE_MIN_SIZE, Math.min(FLUX_SURFACE_MAX_SIZE, parseFloat(e.target.value) || 100)),
                          })}
                          className="min-w-0 flex-1 accent-[#02adea]"
                        />
                        <input
                          type="number"
                          min={FLUX_SURFACE_MIN_SIZE}
                          max={FLUX_SURFACE_MAX_SIZE}
                          step={5}
                          value={fluxSurfaceSize}
                          onChange={(e) => onUpdate(component.id, {
                            physicsFluxSurfaceSize: Math.max(FLUX_SURFACE_MIN_SIZE, Math.min(FLUX_SURFACE_MAX_SIZE, parseFloat(e.target.value) || 100)),
                          })}
                          className="w-14 rounded border border-[#02adea]/40 px-1.5 py-0.5 text-xs font-semibold text-[#02adea] outline-none"
                        />
                      </div>

                      <div className="flex gap-1 h-9">
                        <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                          <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                            Angle
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={360}
                            step={1}
                            value={fluxAngle}
                            onChange={(e) => onUpdate(component.id, { physicsFluxAngle: Math.max(0, Math.min(360, parseFloat(e.target.value) || 0)) })}
                            className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                          />
                        </div>
                        <div className="w-14 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                          deg
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {showChargingMethodInput && (
                <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                  <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                    Method
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={selectedMethod}
                      onChange={(e) => onUpdate(component.id, { physicsChargeMethod: e.target.value })}
                      className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                    >
                      {CHARGING_METHOD_OPTIONS.map((method) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              )}

              {(isCoulombTopic || isElectricPotentialDifferenceTopic) ? (
                <div className="flex gap-1 h-9">
                  <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                    <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                      Medium
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={0.0001}
                      value={Number.isFinite(selectedDielectric) ? selectedDielectric : ""}
                      placeholder="∞"
                      onChange={(e) => {
                        const nextValue = parseFloat(e.target.value);
                        onUpdate(component.id, {
                          physicsMedium: selectedMedium,
                          physicsDielectric: Number.isFinite(nextValue) ? nextValue : Infinity,
                        });
                      }}
                      className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                    />
                  </div>
                  <div className="w-24 border-2 border-[#02adea] rounded-md overflow-hidden relative">
                    <select
                      value={selectedMedium}
                      onChange={(e) => updateMedium(e.target.value)}
                      className="w-full h-full px-2 py-1 text-xs text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                    >
                      {MEDIUM_OPTIONS.map((medium) => (
                        <option key={medium.name} value={medium.name}>{medium.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                  <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                    Earthing
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={component.physicsEarthing || "Not Earthed"}
                      onChange={(e) => onUpdate(component.id, { physicsEarthing: e.target.value })}
                      className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                    >
                      {EARTHING_OPTIONS.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-md border border-[#02adea]/30 bg-sky-50 px-3 py-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
                  Theory
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-700">
                  {activeTheory.summary}
                </p>
                <div className="mt-2 space-y-1">
                  {activeTheory.bullets.map((point) => (
                    <p key={point} className="text-[10px] leading-4 text-slate-600">
                      • {point}
                    </p>
                  ))}
                </div>
                <div className="mt-2 rounded bg-white/80 px-2 py-1.5 text-[10px] text-slate-600">
                  Selected metal: <span className="font-semibold text-slate-800">{selectedMetal}</span>
                  {" "}({selectedMetalMeta.symbol})
                  {" "}• Work Function: <span className="font-semibold text-slate-800">{selectedMetalMeta.workFunctionEv.toFixed(2)} eV</span>
                  {isCoulombTopic ? (
                    <>
                      {" "}• Medium: <span className="font-semibold text-slate-800">{selectedMedium}</span>
                      {" "}• K: <span className="font-semibold text-slate-800">{Number.isFinite(selectedDielectric) ? selectedDielectric : "∞"}</span>
                    </>
                  ) : isElectricFieldTopic ? (
                    <>
                      {" "}â€¢ Type: <span className="font-semibold text-slate-800">{selectedSphereType}</span>
                      {" "}â€¢ R: <span className="font-semibold text-slate-800">{sphereRadiusM.toFixed(2)} m</span>
                      {" "}â€¢ r: <span className="font-semibold text-slate-800">{observationDistance.toFixed(2)} m</span>
                      {" "}â€¢ E: <span className="font-semibold text-slate-800">{formatElectricField(electricField)}</span>
                    </>
                  ) : isElectricFieldLinesTopic ? (
                    <>
                      {" "}â€¢ Direction: <span className="font-semibold text-slate-800">{(component.chargeValue || 0) >= 0 ? "Outward from + charge" : "Inward to - charge"}</span>
                      {" "}â€¢ Density follows |Q|: <span className="font-semibold text-slate-800">{Math.abs(component.chargeValue || 0).toFixed(2)} {component.chargeUnit || "uC"}</span>
                    </>
                  ) : isElectricFluxTopic ? (
                    <>
                      {" "}• Surface: <span className="font-semibold text-slate-800">{selectedFluxSurface}</span>
                      {" "}• A: <span className="font-semibold text-slate-800">{fluxArea.toFixed(2)} m2</span>
                      {" "}• theta: <span className="font-semibold text-slate-800">{fluxAngle.toFixed(0)} deg</span>
                      {" "}• Phi: <span className="font-semibold text-slate-800">{formatFlux(electricFlux)}</span>
                    </>
                  ) : isElectricPotentialTopic ? (
                    <>
                      {" "}â€¢ R: <span className="font-semibold text-slate-800">{sphereRadiusM.toFixed(2)} m</span>
                      {" "}â€¢ Outer ring: <span className="font-semibold text-slate-800">{potentialOuterRingRadius.toFixed(2)} m</span>
                      {" "}â€¢ r: <span className="font-semibold text-slate-800">{Number.isFinite(potentialDistance) ? potentialDistance.toFixed(2) : "infinity"} m</span>
                      {" "}â€¢ V: <span className="font-semibold text-slate-800">{formatPotential(electricPotential)}</span>
                    </>
                  ) : isElectricPotentialDifferenceTopic ? (
                    <>
                      {" "}â€¢ Medium: <span className="font-semibold text-slate-800">{selectedMedium}</span>
                      {" "}â€¢ K: <span className="font-semibold text-slate-800">{Number.isFinite(selectedDielectric) ? selectedDielectric : "∞"}</span>
                      {" "}â€¢ Add two probe spheres A and B to read ΔV.
                    </>
                  ) : (
                    <>
                      {" "}• Earthing: <span className="font-semibold text-slate-800">{component.physicsEarthing || "Not Earthed"}</span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Color selection */}
          {showColor && (
            <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
              <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                Color
              </div>
              <div className="flex-1 relative">
                <select
                  value={component.ledColor || 'red'}
                  onChange={(e) => onUpdate(component.id, { ledColor: e.target.value })}
                  className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                >
                  {LED_COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          {/* LED Voltage selection */}
          {(isLed || component.componentId === 'ac_bulb') && (
            <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
              <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                Voltage
              </div>
              <input
                type="number"
                value={component.voltageValue ?? 220}
                onChange={(e) => {
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) val = 0;
                  if (val > 220) val = 220;
                  onUpdate(component.id, { voltageValue: val });
                }}
                className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none"
                min="0"
                max="220"
              />
            </div>
          )}

          {/* AC Bulb Wattage selection */}
          {component.componentId === 'ac_bulb' && (
            <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
              <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                Watt
              </div>
              <input
                type="number"
                value={component.wattageValue ?? 9}
                onChange={(e) => {
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) val = 0;
                  onUpdate(component.id, { wattageValue: Math.max(0, val) });
                }}
                className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none"
                min="0"
              />
              <div className="w-12 bg-white flex items-center justify-center text-xs font-bold text-[#02adea] border-l-2 border-[#02adea]">
                W
              </div>
            </div>
          )}

          {/* Resistor-specific: Value and Unit */}
          {component.componentId === 'resistor' && (
            <>
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Resistance
                </div>
                <input
                  type="number"
                  value={component.resistanceValue || 0}
                  onChange={(e) => onUpdate(component.id, { resistanceValue: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none"
                />
              </div>
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Unit
                </div>
                <div className="flex-1 relative">
                  <select
                    value={component.resistanceUnit || 'Ω'}
                    onChange={(e) => onUpdate(component.id, { resistanceUnit: e.target.value })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    {['pΩ', 'nΩ', 'µΩ', 'mΩ', 'Ω', 'kΩ', 'MΩ', 'GΩ'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Capacitor-specific: Value and Unit on same row as per image */}
          {component.componentId === 'capacitor' && (
            <div className="flex gap-1 h-9">
              <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[85px]">
                  Capacitance
                </div>
                <input
                  type="number"
                  value={component.capacitanceValue || 0}
                  onChange={(e) => onUpdate(component.id, { capacitanceValue: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                />
              </div>
              <div className="w-20 border-2 border-[#02adea] rounded-md overflow-hidden relative">
                <select
                  value={component.capacitanceUnit || 'µF'}
                  onChange={(e) => onUpdate(component.id, { capacitanceUnit: e.target.value })}
                  className="w-full h-full px-2 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                >
                  {['pF', 'nF', 'µF', 'mF', 'F'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          )}

          {component.componentId === 'capacitor' && (
            <div className="flex gap-1 h-9">
              <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[85px]">
                  Working V
                </div>
                <input
                  type="number"
                  min="0"
                  value={component.voltageValue ?? 25}
                  onChange={(e) => onUpdate(component.id, { voltageValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                />
              </div>
              <div className="w-20 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                V
              </div>
            </div>
          )}

          {component.componentId === 'semiconductor' && (
            <div className="flex flex-col gap-2">
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Material
                </div>
                <div className="flex-1 relative">
                  <select
                    value={component.semiconductorMaterial || 'Silicon'}
                    onChange={(e) => onUpdate(component.id, { semiconductorMaterial: e.target.value as "Silicon" | "Germanium" })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="Silicon">Silicon</option>
                    <option value="Germanium">Germanium</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Doping
                </div>
                <div className="flex-1 relative">
                  <select
                    value={component.semiconductorDoping || 'None'}
                    onChange={(e) => onUpdate(component.id, { semiconductorDoping: e.target.value as "None" | "Aluminium" | "Phosphorus" })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="None">None</option>
                    <option value="Aluminium">Aluminium</option>
                    <option value="Phosphorus">Phosphorus</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {['plane_mirror', 'concave_mirror', 'convex_mirror'].includes(component.componentId) && (
            <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
              <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                View
              </div>
              <div className="flex-1 relative">
                <select
                  value={component.opticsMirrorView || "Front View"}
                  onChange={(e) => onUpdate(component.id, { opticsMirrorView: e.target.value as "Front View" | "Side View" })}
                  className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                >
                  <option value="Front View">Front View</option>
                  <option value="Side View">Side View</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          {['concave_lens', 'convex_lens'].includes(component.componentId) && (
            <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
              <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                View
              </div>
              <div className="flex-1 relative">
                <select
                  value={component.opticsLensView || "Front View"}
                  onChange={(e) => onUpdate(component.id, { opticsLensView: e.target.value as "Front View" | "Side View" })}
                  className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                >
                  <option value="Front View">Front View</option>
                  <option value="Side View">Side View</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          )}

          {['concave_lens', 'convex_lens', 'plane_mirror', 'concave_mirror', 'convex_mirror'].includes(component.componentId) && (
            <>
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9 mt-2">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Status
                </div>
                <div className="flex-1 relative">
                  <select
                    value={component.opticsStatus || "Unactive"}
                    onChange={(e) => onUpdate(component.id, { opticsStatus: e.target.value as "Active" | "Unactive" })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Unactive">Unactive</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9 mt-2">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Radius
                </div>
                <input
                  type="number"
                  value={component.opticsRadiusValue ?? 15}
                  onChange={(e) => onUpdate(component.id, { opticsRadiusValue: Number(e.target.value) })}
                  className="flex-1 min-w-0 px-2 text-sm text-[#02adea] font-bold bg-transparent outline-none"
                />
                <div className="w-[1px] bg-[#02adea]"></div>
                <select
                  value={component.opticsRadiusUnit || "cm"}
                  onChange={(e) => onUpdate(component.id, { opticsRadiusUnit: e.target.value as "cm" | "m" })}
                  className="bg-[#02adea]/10 text-[#02adea] text-xs font-bold px-2 outline-none appearance-none cursor-pointer"
                >
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                </select>
              </div>
            </>
          )}

          {component.componentId === 'laser' && (
            <>
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[70px]">
                  Switch
                </div>
                <div className="flex-1 relative">
                  <select
                    value={component.opticsLaserMode || (component.powerEnabled ? "Both" : "Off")}
                    onChange={(e) => onUpdate(component.id, { 
                      opticsLaserMode: e.target.value as PlacedComponent["opticsLaserMode"],
                      powerEnabled: e.target.value !== "Off"
                    })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="Off">Off</option>
                    <option value="Both">Both</option>
                    <option value="Red">Red Only</option>
                    <option value="Green">Green Only</option>
                    <option value="White">White Light</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {(component.opticsLaserMode === "Both" || component.opticsLaserMode === "Green" || (component.powerEnabled && !component.opticsLaserMode)) && (
                <div className="flex gap-2 h-9 items-center mt-2 border-2 border-[#02adea] rounded-md overflow-hidden">
                  <div className="bg-[#02adea] text-white px-3 h-full flex items-center font-bold text-xs min-w-[70px]">
                    Green &deg;
                  </div>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    step={1}
                    value={component.opticsGreenLaserAngle || 0}
                    onChange={(e) => onUpdate(component.id, { opticsGreenLaserAngle: Number(e.target.value) })}
                    className="flex-1 min-w-0 mx-2"
                  />
                  <div className="text-xs text-[#02adea] font-bold w-8 text-right pr-2">
                    {component.opticsGreenLaserAngle || 0}&deg;
                  </div>
                </div>
              )}
            </>
          )}

          {component.componentId === 'laser_stand' && (
            <div className="flex gap-2 h-9 items-center border-2 border-[#02adea] rounded-md overflow-hidden">
              <div className="bg-[#02adea] text-white px-3 h-full flex items-center font-bold text-xs min-w-[70px]">
                Length
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={component.opticsStandLength || 14}
                onChange={(e) => onUpdate(component.id, { opticsStandLength: Number(e.target.value) })}
                className="flex-1 min-w-0 mx-2"
              />
              <div className="text-xs text-[#02adea] font-bold w-12 text-right pr-2">
                {component.opticsStandLength || 14} cm
              </div>
            </div>
          )}

          {isPowerSupply && (
            <>
              <div className="flex border-2 border-[#02adea] rounded-md overflow-hidden h-9">
                <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[82px]">
                  Output
                </div>
                <div className="flex-1 relative">
                  <select
                    value={component.powerEnabled === false ? "Off" : "On"}
                    onChange={(e) => onUpdate(component.id, { powerEnabled: e.target.value === "On" })}
                    className="w-full h-full px-3 py-1 text-sm text-[#02adea] font-medium bg-transparent outline-none appearance-none cursor-pointer"
                  >
                    <option value="On">On</option>
                    <option value="Off">Off</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#02adea]">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="flex gap-1 h-9">
                <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                  <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[92px]">
                    {isAcPowerSupply ? "Voltage RMS" : "Voltage Set"}
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={isAcPowerSupply ? 260 : 100}
                    step={isAcPowerSupply ? 1 : 0.1}
                    value={component.powerVoltageSet ?? (isAcPowerSupply ? 230.5 : 12.5)}
                    onChange={(e) => {
                      const nextValue = parseFloat(e.target.value);
                      const maxVoltage = isAcPowerSupply ? 260 : 100;
                      onUpdate(component.id, {
                        powerVoltageSet: Math.max(0, Math.min(maxVoltage, Number.isFinite(nextValue) ? nextValue : 0)),
                      });
                    }}
                    className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                  />
                </div>
                <div className="w-16 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                  {isAcPowerSupply ? "Vrms" : "V"}
                </div>
              </div>

              <div className="flex gap-1 h-9">
                <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                  <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[92px]">
                    {isAcPowerSupply ? "Current RMS" : "Current Set"}
                  </div>
                  <input
                    type="number"
                    min={0.001}
                    step={0.01}
                    value={component.powerCurrentLimit ?? (isAcPowerSupply ? 1.15 : 0.25)}
                    onChange={(e) => {
                      const nextValue = parseFloat(e.target.value);
                      onUpdate(component.id, {
                        powerCurrentLimit: Math.max(0.001, Number.isFinite(nextValue) ? nextValue : 0.001),
                      });
                    }}
                    className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                  />
                </div>
                <div className="w-16 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                  {isAcPowerSupply ? "Arms" : "A"}
                </div>
              </div>

              <div className="flex gap-1 h-9">
                <div className="flex flex-1 border-2 border-[#02adea] rounded-md overflow-hidden">
                  <div className="bg-[#02adea] text-white px-3 flex items-center font-bold text-xs min-w-[92px]">
                    Frequency
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={400}
                    step={1}
                    value={component.powerFrequency ?? (isAcPowerSupply ? 50 : 0)}
                    onChange={(e) => {
                      const nextValue = parseFloat(e.target.value);
                      onUpdate(component.id, {
                        powerFrequency: Math.max(0, Math.min(400, Number.isFinite(nextValue) ? nextValue : (isAcPowerSupply ? 50 : 0))),
                      });
                    }}
                    className="flex-1 px-3 py-1 text-sm text-[#02adea] font-medium outline-none min-w-0"
                  />
                </div>
                <div className="w-16 border-2 border-[#02adea] rounded-md flex items-center justify-center text-xs font-bold text-[#02adea]">
                  Hz
                </div>
              </div>

              <div className="rounded-md border border-[#02adea]/30 bg-sky-50 px-3 py-2">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#0284c7]">
                  Theory
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-700">
                  {isAcPowerSupply
                    ? "AC supply outputs a sine wave. Peak voltage = Vrms x 1.414 and instantaneous voltage changes with frequency."
                    : "DC supply works in CV and CC modes. Ideal current is I = V / R."}
                </p>
                <div className="mt-2 space-y-1">
                  {isAcPowerSupply ? (
                    <>
                      <p className="text-[10px] leading-4 text-slate-600">- Vrms is the effective AC voltage shown on the display.</p>
                      <p className="text-[10px] leading-4 text-slate-600">- Vpeak = Vrms x 1.414.</p>
                      <p className="text-[10px] leading-4 text-slate-600">- Instant voltage: V(t) = Vpeak x sin(2*pi*f*t).</p>
                      <p className="text-[10px] leading-4 text-slate-600">- Current limit protects the connected circuit from overload.</p>
                      <p className="text-[10px] leading-4 text-slate-600">- Frequency controls how many sine cycles occur per second.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] leading-4 text-slate-600">- CV mode: current is below limit, so output voltage stays at Vset.</p>
                      <p className="text-[10px] leading-4 text-slate-600">- CC mode: overload clamps current and drops voltage.</p>
                      <p className="text-[10px] leading-4 text-slate-600">- New voltage in overload: Vout = I_limit x R.</p>
                      <p className="text-[10px] leading-4 text-slate-600">- DC frequency is 0 Hz because output is constant.</p>
                    </>
                  )}
                </div>
                <div className="mt-2 rounded bg-white/80 px-2 py-1.5 text-[10px] text-slate-600">
                  Range: <span className="font-semibold text-slate-800">{isAcPowerSupply ? "0 to 260 Vrms" : "0 to 100 V"}</span>
                  {" "} - Current limit: <span className="font-semibold text-slate-800">{component.powerCurrentLimit ?? (isAcPowerSupply ? 1.15 : 0.25)} A</span>
                  {" "} - Frequency: <span className="font-semibold text-slate-800">{component.powerFrequency ?? (isAcPowerSupply ? 50 : 0)} Hz</span>
                </div>
              </div>
            </>
          )}

          {/* Learn more button at bottom if info available */}
          {componentInfo && (
            <button
              onClick={() => setShowInfoModal(true)}
              className="w-full mt-1 py-1.5 text-xs font-semibold text-[#02adea] border border-[#02adea] rounded-md hover:bg-[#02adea]/10 transition-colors"
            >
              Learn more about this component →
            </button>
          )}
        </div>
      </div>

      {/* "Learn more" info modal */}
      {showInfoModal && componentInfo && (
        <ComponentInfoModal
          info={componentInfo}
          imageSrc={component.imageSrc}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </>
  );
};

export default PropertyPanel;
