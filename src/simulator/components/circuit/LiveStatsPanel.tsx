"use client"
import React from 'react';
import { SimulationResult } from '@/simulator/utils/simulation';

interface LiveStatsPanelProps {
  simulation: SimulationResult;
}

const LiveStatsPanel: React.FC<LiveStatsPanelProps> = ({ simulation }) => {
  if (!simulation.runnable || !simulation.voltage) return null;

  return (
    <div className="absolute bottom-6 left-6 z-50 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border-2 border-[#02adea] p-4 w-64 pointer-events-none select-none">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
        <span className="text-sm font-bold text-[#02adea] uppercase tracking-wider">Circuit Stats</span>
        {simulation.isShortCircuit && (
          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse font-bold">SHORT CIRCUIT</span>
        )}
      </div>
      
      <div className="space-y-3">
        <StatRow label="Voltage" value="9.0" unit="V" color="text-amber-600" />
        <StatRow 
          label="Resistance" 
          value={simulation.totalResistance?.toFixed(1) ?? "0"} 
          unit="Ω" 
          color="text-violet-600" 
        />
        <StatRow 
          label="Current" 
          value={simulation.currentMA?.toFixed(2) ?? "0"} 
          unit="mA" 
          color="text-emerald-600" 
        />
        <StatRow 
          label="Power" 
          value={simulation.powerWatts?.toFixed(3) ?? "0"} 
          unit="W" 
          color="text-sky-600" 
        />
      </div>

      <div className="mt-4 pt-2 border-t border-gray-100 flex justify-center">
        <p className="text-[10px] text-gray-400 font-mono italic">V = I × R | P = V × I</p>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <div className="flex items-center justify-between font-mono">
    <span className="text-xs text-gray-500">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-400 font-medium">{unit}</span>
    </div>
  </div>
);

export default LiveStatsPanel;
