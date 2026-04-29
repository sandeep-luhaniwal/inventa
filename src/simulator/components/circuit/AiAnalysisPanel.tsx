"use client"
import React from 'react';
import { Brain, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface AiAnalysisPanelProps {
  isLoading: boolean;
  result: {
    status: "Correct" | "Wrong";
    reason: string;
  } | null;
  error?: string;
}

const AiAnalysisPanel: React.FC<AiAnalysisPanelProps> = ({ isLoading, result, error }) => {
  if (!isLoading && !result && !error) return null;

  return (
    <div className="absolute top-24 right-8 z-50 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-8 w-[400px] overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-right-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-purple-50 rounded-2xl">
          <Brain className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="font-bold text-[#1a1a1a] text-xl tracking-tight">Circuit Analysis</h3>
      </div>

      <div className="w-full h-[1px] bg-gray-100 mb-8" />

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-semibold tracking-wide animate-pulse uppercase">Analyzing Connections...</p>
        </div>
      ) : error ? (
        <div className="bg-[#FFF5F5] border border-[#FFE0E0] rounded-[20px] p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-[#E53E3E] shrink-0" />
          <div className="space-y-2 flex-1">
            <h4 className="font-bold text-[#C53030] text-sm">Action Required</h4>
            <p className="text-sm text-[#C53030] leading-relaxed font-medium">
              {error}
            </p>
            {error.includes("API key") && (
              <a 
                href="https://platform.openai.com/account/api-keys" 
                target="_blank" 
                className="flex items-center gap-1 text-xs text-[#E53E3E] font-bold hover:underline mt-2"
              >
                Get new API key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ) : result ? (
        <div className="space-y-6">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl w-fit ${
            result.status === "Correct" 
              ? "bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]" 
              : "bg-[#FFF7ED] text-[#9A3412] border border-[#FFEDD5]"
          }`}>
            {result.status === "Correct" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-extrabold uppercase tracking-widest">{result.status}</span>
          </div>
          
          <div className="bg-gray-50 rounded-[20px] p-6 border border-gray-100">
            <p className="text-sm text-[#4a4a4a] leading-relaxed font-medium">
              {result.reason}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
             <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">Verified by simulator rules</span>
             <div className="flex gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/40" />
             </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AiAnalysisPanel;
