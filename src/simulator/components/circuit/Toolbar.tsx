"use client"
import { useRef, useEffect, useState } from "react";
import {
  Copy, ClipboardPaste, Trash2, Undo2, Redo2,
  AlignJustify, RotateCcw, ArrowRightLeft, Zap, Grid3X3,
} from "lucide-react";
import { WIRE_COLOR_OPTIONS, WIRE_STYLES } from "@/simulator/constants/circuit";

interface ToolbarProps {
  canUndo?: boolean;
  canRedo?: boolean;
  showGrid?: boolean;
  wireColor?: string;
  wireType?: string;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  onToggleGrid?: () => void;
  onAlign?: () => void;
  onRotate?: () => void;
  onMirror?: () => void;
  onWireColorChange?: (color: string) => void;
  onWireTypeChange?: (type: string) => void;
  // kept for API compatibility
  onSimulate?: () => void;
  onPreview?: () => void;
  onView?: () => void;
  onSplit?: () => void;
}

const ToolButton = ({
  icon: Icon,
  tooltip,
  disabled,
  active,
  onClick,
}: {
  icon: React.ElementType;
  tooltip: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    title={tooltip}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed
      ${active ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
  >
    <Icon size={18} />
  </button>
);

const Divider = () => <div className="w-px h-6 bg-border mx-1 shrink-0" />;

/** Closes a dropdown when clicking outside of it */
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

const Toolbar = ({
  canUndo,
  canRedo,
  showGrid,
  wireColor,
  wireType,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onToggleGrid,
  onAlign,
  onRotate,
  onMirror,
  onWireColorChange,
  onWireTypeChange,
}: ToolbarProps) => {
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useOutsideClick(colorRef, () => setColorMenuOpen(false));
  useOutsideClick(typeRef, () => setTypeMenuOpen(false));

  return (
    <div className="flex items-center justify-between px-4 h-11 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-0.5 flex-wrap">
        <ToolButton icon={Copy}           tooltip="Copy"   onClick={onCopy} />
        <ToolButton icon={ClipboardPaste} tooltip="Paste"  onClick={onPaste} />
        <ToolButton icon={Trash2}         tooltip="Delete" onClick={onDelete} />
        <Divider />
        <ToolButton icon={Undo2} tooltip="Undo" disabled={!canUndo} onClick={onUndo} />
        <ToolButton icon={Redo2} tooltip="Redo" disabled={!canRedo} onClick={onRedo} />
        <Divider />
        <ToolButton icon={Grid3X3}        tooltip="Toggle Grid"  active={showGrid} onClick={onToggleGrid} />
        <ToolButton icon={AlignJustify}   tooltip="Align"        onClick={onAlign} />
        <ToolButton icon={RotateCcw}      tooltip="Rotate 90°"   onClick={onRotate} />
        <ToolButton icon={ArrowRightLeft} tooltip="Mirror"       onClick={onMirror} />
        <Divider />

        {/* Wire colour picker */}
        <div ref={colorRef} className="relative">
          <button
            title="Wire Color"
            onClick={() => setColorMenuOpen((p) => !p)}
            className="w-6 h-6 rounded-md border-2 border-border hover:border-primary transition-colors"
            style={{ backgroundColor: wireColor ?? "#3b82f6" }}
          />
          {colorMenuOpen && (
            <div className="absolute left-0 top-8 z-30 w-44 bg-card border border-border rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
              {WIRE_COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onWireColorChange?.(opt.value); setColorMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary"
                >
                  <span className="w-3 h-3 rounded-full border border-border shrink-0" style={{ backgroundColor: opt.value }} />
                  {opt.label}
                  {wireColor === opt.value && <span className="ml-auto text-primary text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wire type picker */}
        <div ref={typeRef} className="relative">
          <ToolButton icon={Zap} tooltip="Wire Type" active={wireType !== "normal"} onClick={() => setTypeMenuOpen((p) => !p)} />
          {typeMenuOpen && (
            <div className="absolute left-0 top-10 z-30 w-48 bg-card border border-border rounded-lg shadow-lg py-1">
              {Object.entries(WIRE_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => { onWireTypeChange?.(key); setTypeMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary"
                >
                  <svg width="28" height="12" className="shrink-0">
                    <line
                      x1="0" y1="6" x2="28" y2="6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={style.dash.join(",") || undefined}
                    />
                  </svg>
                  {style.label}
                  {wireType === key && <span className="ml-auto text-primary text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side filters (kept from original) */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Filters</span>
        <select className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option>Select subject</option>
        </select>
        <select className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option>Select Lecture</option>
        </select>
      </div>
    </div>
  );
};

export default Toolbar;
