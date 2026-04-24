"use client"
import React, { useState } from 'react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';
import { PlacedComponent } from '@/simulator/types/circuit';
import { LED_COLOR_OPTIONS } from '@/simulator/constants/circuit';
import { getComponentInfo } from '@/simulator/constants/componentInfo';
import ComponentInfoModal from './ComponentInfoModal';

interface PropertyPanelProps {
  component: PlacedComponent;
  onUpdate: (id: string, updates: Partial<PlacedComponent>) => void;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ component, onUpdate, onClose }) => {
  const isLed = component.componentId.startsWith('led');
  const isMicrobit = component.componentId === 'microbit';
  const showColor = isLed || isMicrobit;
  const [showTooltip, setShowTooltip] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const componentInfo = getComponentInfo(component.componentId);

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
