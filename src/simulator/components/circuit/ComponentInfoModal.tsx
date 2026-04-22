"use client"
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, BookOpen, Zap, Link2, Lightbulb, PlayCircle, Info } from 'lucide-react';
import { ComponentInfo, ComponentSection } from '@/simulator/constants/componentInfo';

interface ComponentInfoModalProps {
  info: ComponentInfo;
  imageSrc?: string;
  onClose: () => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'How it works':      <Zap size={15} className="text-amber-500" />,
  'Connect it':        <Link2 size={15} className="text-blue-500" />,
  'How it is used':    <Lightbulb size={15} className="text-emerald-500" />,
  'Get started':       <PlayCircle size={15} className="text-violet-500" />,
  'More information':  <Info size={15} className="text-slate-500" />,
};

function AccordionItem({ section, defaultOpen = false }: { section: ComponentSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const icon = SECTION_ICONS[section.title] ?? <BookOpen size={15} className="text-slate-400" />;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left select-none"
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-slate-700">{section.title}</span>
        <ChevronRight
          size={16}
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
        </div>
      )}
    </div>
  );
}

const ComponentInfoModal: React.FC<ComponentInfoModalProps> = ({ info, imageSrc, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dim backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Slide-in panel (right side, like the reference image) */}
      <div
        className="relative z-10 h-full w-[340px] flex flex-col bg-white shadow-2xl"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">Component Info</span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero: image + name */}
          <div className="flex flex-col items-center py-6 px-4 border-b border-slate-100 bg-white">
            {imageSrc ? (
              <div className="w-20 h-20 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm mb-3">
                <img src={imageSrc} alt={info.displayName} className="w-14 h-14 object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm mb-3">
                <BookOpen size={32} className="text-slate-400" />
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-800">{info.displayName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{info.tagline}</p>
          </div>

          {/* Description */}
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-[#02adea]" />
              <span className="text-xs font-bold text-[#02adea] uppercase tracking-wider">Description</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{info.description}</p>
          </div>

          {/* Accordion sections */}
          <div className="px-4 py-4 space-y-2">
            {info.sections.map((section, i) => (
              <AccordionItem key={section.title} section={section} defaultOpen={i === 0} />
            ))}
          </div>

          <div className="h-4" />
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ComponentInfoModal;
