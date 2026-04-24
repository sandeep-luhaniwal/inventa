"use client"
import React, { useState } from 'react';
import { Settings, Thermometer, Sun, Compass, Smartphone, Move } from 'lucide-react';

interface MicrobitSimulatorPanelProps {
  onClose?: () => void;
}

const MicrobitSimulatorPanel: React.FC<MicrobitSimulatorPanelProps> = ({ onClose }) => {
  const [temp, setTemp] = useState(21);
  const [light, setLight] = useState(128);
  const [viewScale, setViewScale] = useState(1);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setViewScale(s => Math.min(Math.max(s + delta, 0.5), 2.0));
  };

  return (
    <div className="absolute bottom-6 right-6 z-[100] bg-white rounded-lg shadow-2xl border-2 border-[#E91E63] overflow-hidden w-[340px] animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-gray-100">
        <span className="text-[11px] font-medium text-gray-500">micro:bit</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="w-1 h-1 rounded-full bg-gray-300" />
        </div>
      </div>

      <div className="flex h-[240px]">
        {/* Sliders Area */}
        <div className="flex p-3 gap-4 border-r border-gray-100">
          {/* Temperature */}
          <div className="flex flex-col items-center">
            <Thermometer size={14} className="text-gray-400 mb-2" />
            <div className="relative w-[18px] h-[160px] bg-gray-100 rounded-full border border-gray-200">
              <div 
                className="absolute bottom-0 w-full bg-[#FF5722] rounded-full transition-all duration-300" 
                style={{ height: `${(temp / 50) * 100}%` }}
              />
              <div 
                className="absolute w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-sm left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ bottom: `${(temp / 50) * 100}%` }}
              />
              <input 
                type="range" min="0" max="50" value={temp} 
                onChange={(e) => setTemp(parseInt(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer [appearance:slider-vertical]"
              />
            </div>
            <span className="text-[10px] font-bold text-gray-600 mt-2">{temp}°C</span>
          </div>

          {/* Light */}
          <div className="flex flex-col items-center">
            <Sun size={14} className="text-gray-400 mb-2" />
            <div className="relative w-[18px] h-[160px] bg-gray-100 rounded-full border border-gray-200">
              <div 
                className="absolute bottom-0 w-full bg-[#546E7A] rounded-full transition-all duration-300" 
                style={{ height: `${(light / 255) * 100}%` }}
              />
              <div 
                className="absolute w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-sm left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ bottom: `${(light / 255) * 100}%` }}
              />
              <input 
                type="range" min="0" max="255" value={light} 
                onChange={(e) => setLight(parseInt(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer [appearance:slider-vertical]"
              />
            </div>
            <span className="text-[10px] font-bold text-gray-600 mt-2">{light}</span>
          </div>
        </div>

        {/* 3D Visualizer Area */}
        <div 
          className="flex-1 bg-[#F1F7F9] p-3 flex flex-col items-center relative overflow-hidden"
          onWheel={handleWheel}
        >
          <div className="w-full flex justify-between text-gray-400">
            <div className="hover:text-[#02adea] cursor-pointer"><div className="border border-gray-200 rounded p-0.5"><Move size={12} /></div></div>
            <div className="text-[9px] font-bold tracking-tight mt-1 uppercase">Compass 0°</div>
            <div className="hover:text-[#02adea] cursor-pointer"><div className="border border-gray-200 rounded p-0.5"><Compass size={12} /></div></div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div 
              className="w-32 h-20 bg-[#1B1B1B] rounded-sm shadow-xl border border-gray-800 relative transition-transform duration-200"
              style={{ transform: `perspective(400px) rotateX(65deg) rotateZ(0deg) scale(${viewScale})` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-4 border border-[#E91E63] opacity-40 rounded-full" />
            </div>
          </div>

          {/* Bottom Icons Row */}
          <div className="w-full flex justify-between mt-auto pt-2 border-t border-gray-200/50">
            <ControlBtn icon={<Smartphone size={14} />} />
            <ControlBtn icon={<Move size={14} className="rotate-45" />} onClick={() => setViewScale(s => Math.min(s + 0.1, 2))} />
            <ControlBtn icon={<Move size={14} />} onClick={() => setViewScale(1)} />
            <ControlBtn icon={<Move size={14} className="-rotate-45" />} onClick={() => setViewScale(s => Math.max(s - 0.1, 0.5))} />
            <ControlBtn icon={<div className="text-[7px] font-black border border-current px-0.5 rounded">SHAKE</div>} />
          </div>
        </div>
      </div>
    </div>
  );
};


const ControlBtn = ({ icon, onClick }: { icon: React.ReactNode; onClick?: () => void }) => (
  <button onClick={onClick} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-[#02adea] transition-all">
    {icon}
  </button>
);

export default MicrobitSimulatorPanel;
