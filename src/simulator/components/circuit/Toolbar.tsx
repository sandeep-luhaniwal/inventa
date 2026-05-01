"use client"
import { useRef, useEffect, useState } from "react";
import {
  Copy,
  ClipboardPaste,
  Trash2,
  Undo2,
  Redo2,
  StickyNote,
  Eye,
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  ChevronDown,
  Pencil,
  MousePointer2,
  Eraser,
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
  onFlip?: () => void;
  onWireColorChange?: (color: string) => void;
  onWireTypeChange?: (type: string) => void;
  onToggleSimulation?: () => void;
  onAddNote?: () => void;
  isSimulating?: boolean;
  simulationSummary?: string;
  activeTool?: "select" | "pencil" | "eraser";
  onActiveToolChange?: (tool: "select" | "pencil" | "eraser") => void;
  pencilColor?: string;
  onPencilColorChange?: (color: string) => void;
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

const ToolButton = ({
  icon: Icon,
  tooltip,
  disabled,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  tooltip: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    title={tooltip}
    onClick={onClick}
    disabled={disabled}
    className={[
      "relative flex items-center justify-center w-9 h-9 rounded-md transition-all duration-150",
      "disabled:opacity-40 disabled:cursor-not-allowed",
      active
        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white",
    ].join(" ")}
  >
    <Icon size={17} strokeWidth={1.8} />
  </button>
);

const Divider = () => (
  <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-0.5 shrink-0" />
);

const WireColorPicker = ({
  wireColor,
  onWireColorChange,
}: {
  wireColor?: string;
  onWireColorChange?: (color: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));

  const currentLabel =
    WIRE_COLOR_OPTIONS.find((o) => o.value === wireColor)?.label ?? "Color";

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        title={`Wire color: ${currentLabel}`}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 h-9 px-1.5 rounded-l-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span
          className="w-6 h-6 rounded-sm border border-slate-300 dark:border-slate-500 shadow-inner shrink-0"
          style={{ backgroundColor: wireColor ?? "#22c55e" }}
        />
      </button>
      <button
        title="Pick wire color"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-center w-5 h-9 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
      >
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-40 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto">
          {WIRE_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onWireColorChange?.(opt.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-500 shrink-0"
                style={{ backgroundColor: opt.value }}
              />
              {opt.label}
              {wireColor === opt.value && (
                <span className="ml-auto text-blue-500 text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PencilColorPicker = ({
  pencilColor,
  onPencilColorChange,
}: {
  pencilColor?: string;
  onPencilColorChange?: (color: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));

  const currentLabel =
    WIRE_COLOR_OPTIONS.find((o) => o.value === pencilColor)?.label ?? "Color";

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        title={`Pencil color: ${currentLabel}`}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 h-9 px-1.5 rounded-l-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span
          className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-500 shadow-inner shrink-0"
          style={{ backgroundColor: pencilColor ?? "#ef4444" }}
        />
      </button>
      <button
        title="Pick pencil color"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-center w-5 h-9 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
      >
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-40 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto">
          {WIRE_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onPencilColorChange?.(opt.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-500 shrink-0"
                style={{ backgroundColor: opt.value }}
              />
              {opt.label}
              {pencilColor === opt.value && (
                <span className="ml-auto text-blue-500 text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WireTypePicker = ({
  wireType,
  onWireTypeChange,
}: {
  wireType?: string;
  onWireTypeChange?: (type: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false));

  const currentStyle = wireType ? WIRE_STYLES[wireType] : WIRE_STYLES.normal;

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        title={`Wire style: ${currentStyle?.label ?? "Normal"}`}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 h-9 px-2 rounded-l-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <svg width="28" height="12" className="shrink-0 text-slate-600 dark:text-slate-300">
          <line
            x1="0"
            y1="6"
            x2="28"
            y2="6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={currentStyle?.dash?.join(",") || undefined}
          />
        </svg>
      </button>
      <button
        title="Pick wire style"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-center w-5 h-9 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
      >
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-40 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl py-1">
          {Object.entries(WIRE_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => {
                onWireTypeChange?.(key);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              <svg width="28" height="12" className="shrink-0">
                <line
                  x1="0"
                  y1="6"
                  x2="28"
                  y2="6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={style.dash.join(",") || undefined}
                />
              </svg>
              <span>{style.label}</span>
              {wireType === key && (
                <span className="ml-auto text-blue-500 text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Toolbar = ({
  canUndo,
  canRedo,
  wireColor,
  wireType,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onRotate,
  onMirror,
  onFlip,
  onWireColorChange,
  onWireTypeChange,
  isSimulating,
  simulationSummary,
  showGrid,
  onToggleGrid,
  onAddNote,
  activeTool,
  onActiveToolChange,
  pencilColor,
  onPencilColorChange,
}: ToolbarProps) => {
  return (
    <div
      className={[
        "flex items-center gap-0.5 px-3 h-11 shrink-0",
        "bg-white dark:bg-slate-800",
        "border-b border-slate-200 dark:border-slate-700",
        "shadow-sm",
      ].join(" ")}
    >
      <ToolButton 
        icon={MousePointer2} 
        tooltip="Select Tool" 
        onClick={() => onActiveToolChange?.("select")} 
        active={activeTool === "select"}
      />
      <ToolButton 
        icon={Pencil} 
        tooltip="Pencil Tool" 
        onClick={() => onActiveToolChange?.("pencil")} 
        active={activeTool === "pencil"}
      />
      <ToolButton 
        icon={Eraser} 
        tooltip="Eraser Tool" 
        onClick={() => onActiveToolChange?.("eraser")} 
        active={activeTool === "eraser"}
      />

      <Divider />

      <ToolButton icon={Copy} tooltip="Copy (Ctrl+C)" onClick={onCopy} />
      <ToolButton icon={ClipboardPaste} tooltip="Paste (Ctrl+V)" onClick={onPaste} />
      <ToolButton icon={Trash2} tooltip="Delete (Del)" onClick={onDelete} />

      <Divider />

      <ToolButton icon={Undo2} tooltip="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} />
      <ToolButton icon={Redo2} tooltip="Redo (Ctrl+Y/Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo} />

      <Divider />

      <ToolButton
        icon={Eye}
        tooltip="Toggle Grid"
        onClick={onToggleGrid}
        active={showGrid}
      />
      <ToolButton icon={StickyNote} tooltip="Add Note" onClick={onAddNote} />

      <Divider />

      <WireColorPicker wireColor={wireColor} onWireColorChange={onWireColorChange} />

      <Divider />

      <div className="flex items-center gap-1">
        <PencilColorPicker pencilColor={pencilColor} onPencilColorChange={onPencilColorChange} />
      </div>

      <Divider />

      <WireTypePicker wireType={wireType} onWireTypeChange={onWireTypeChange} />

      <Divider />

      <ToolButton icon={FlipHorizontal2} tooltip="Mirror Horizontally" onClick={onMirror} />
      <ToolButton icon={FlipVertical2} tooltip="Flip Vertically" onClick={onFlip} />
      <ToolButton icon={RotateCcw} tooltip="Rotate 30 degrees CCW" onClick={onRotate} />

      {simulationSummary && (
        <>
          <Divider />
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              isSimulating
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-50 text-slate-600 border border-slate-200"
            }`}
          >
            {simulationSummary}
          </div>
        </>
      )}
    </div>
  );
};

export default Toolbar;
