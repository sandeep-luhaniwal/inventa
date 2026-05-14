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
const CHARGING_METHOD_OPTIONS = [
  "Methods of Charging",
  "Friction",
  "Conduction",
  "Induction",
  "Earthing",
];
const EARTHING_OPTIONS = ["Not Earthed", "Earthed", "Temporary Earthing"];
const MEDIUM_OPTIONS = [
  { name: "Vacuum", value: 1 },
  { name: "Air", value: 1.0006 },
  { name: "Glass", value: 5 },
  { name: "Paper", value: 3.7 },
  { name: "Mica", value: 6 },
  { name: "Water", value: 80 },
  { name: "Metal", value: Infinity },
];

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
      "Electric field intensity describes force experienced per unit positive charge at a point.",
    bullets: [
      "Field direction is outward for positive charge.",
      "Field direction is inward for negative charge.",
      "Field strength depends on charge and distance.",
    ],
  },
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({ component, onUpdate, onClose }) => {
  const isLed = component.componentId.startsWith('led');
  const isMicrobit = component.componentId === 'microbit';
  const isChargedSphere = component.componentId.startsWith('sphere_');
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

              {isCoulombTopic ? (
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
