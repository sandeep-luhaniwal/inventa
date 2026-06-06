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
      
      <div className="space-y-4">
        <StatRow label="Voltage" value={simulation.voltage?.toFixed(1) ?? "0.0"} unit="V" color="text-[#f59e0b]" />
        <StatRow 
          label="Resistance" 
          value={simulation.totalResistance?.toFixed(1) ?? "0.0"} 
          unit="Ω" 
          color="text-[#8b5cf6]" 
        />
        <StatRow 
          label="Current" 
          value={simulation.currentMA?.toFixed(2) ?? "0.00"} 
          unit="mA" 
          color="text-[#10b981]" 
        />
        <StatRow 
          label="Power" 
          value={simulation.powerWatts?.toFixed(3) ?? "0.000"} 
          unit="W" 
          color="text-[#0ea5e9]" 
        />
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
        <p className="text-[11px] text-gray-400 font-medium tracking-tight">V = I × R | P = V × I</p>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[13px] text-gray-500 font-medium">{label}</span>
    <div className="flex items-baseline gap-1.5">
      <span className={`text-[15px] font-bold ${color}`}>{value}</span>
      <span className="text-[11px] text-gray-400 font-bold lowercase">{unit}</span>
    </div>
  </div>
);

export default LiveStatsPanel;
