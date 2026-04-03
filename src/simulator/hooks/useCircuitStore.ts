"use client"
import { useState, useCallback, useRef, useEffect } from "react";
import { ConnectingFrom, HistoryEntry, PlacedComponent, Wire } from "../types/circuit";

export type { PlacedComponent, Wire, ConnectingFrom };

const STORAGE_KEY = "circuit_project";

function loadFromStorage(): { components: PlacedComponent[]; wires: Wire[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { components: [], wires: [] };
}

export function useCircuitStore() {
  const initial = loadFromStorage();
  const [components, setComponents] = useState<PlacedComponent[]>(initial.components);
  const [wires, setWires] = useState<Wire[]>(initial.wires);
  const [connectingFrom, setConnectingFrom] = useState<ConnectingFrom | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [wireColor, setWireColor] = useState("#3b82f6");
  const [wireType, setWireType] = useState("normal");
  const [isSimulating, setIsSimulating] = useState(false);

  // Use a ref for history so saveToHistory never goes stale
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  // Trigger re-render when undo/redo availability changes
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ components, wires }));
    } catch {}
  }, [components, wires]);

  const saveToHistory = useCallback((comps: PlacedComponent[], ws: Wire[]) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ components: comps, wires: ws });
    historyIndexRef.current = historyRef.current.length - 1;
    forceUpdate((n) => n + 1);
  }, []);

  const addComponent = useCallback(
    (comp: PlacedComponent) => {
      setComponents((prev) => {
        const next = [...prev, comp];
        saveToHistory(next, wires);
        return next;
      });
    },
    [wires, saveToHistory]
  );

  const moveComponent = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  }, []);

  const handlePinClick = useCallback(
    (compId: string, portIndex: number) => {
      if (!connectingFrom) {
        setConnectingFrom({ compId, portIndex });
        return false;
      }

      // Cancel on same-pin click
      if (connectingFrom.compId === compId && connectingFrom.portIndex === portIndex) {
        setConnectingFrom(null);
        return false;
      }

      const duplicate = wires.some(
        (w) =>
          (w.from.compId === connectingFrom.compId &&
            w.from.portIndex === connectingFrom.portIndex &&
            w.to.compId === compId &&
            w.to.portIndex === portIndex) ||
          (w.to.compId === connectingFrom.compId &&
            w.to.portIndex === connectingFrom.portIndex &&
            w.from.compId === compId &&
            w.from.portIndex === portIndex)
      );

      setConnectingFrom(null);
      if (duplicate) return false;

      const nextWire: Wire = {
        id: `wire-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        from: connectingFrom,
        to: { compId, portIndex },
        midPoints: [],
      };

      setWires((prevWires) => {
        const next = [...prevWires, nextWire];
        setComponents((prevComps) => {
          saveToHistory(prevComps, next);
          return prevComps;
        });
        return next;
      });

      return true;
    },
    [connectingFrom, saveToHistory, wires]
  );

  const deleteSelected = useCallback(() => {
    setComponents((prevComps) => {
      const nextComps = prevComps.filter((c) => !selectedComponents.includes(c.id));
      setWires((prevWires) => {
        const nextWires = prevWires.filter(
          (w) =>
            !selectedComponents.includes(w.from.compId) &&
            !selectedComponents.includes(w.to.compId) &&
            w.id !== selectedWire
        );
        saveToHistory(nextComps, nextWires);
        return nextWires;
      });
      return nextComps;
    });
    setSelectedComponents([]);
    setSelectedWire(null);
  }, [selectedComponents, selectedWire, saveToHistory]);

  const deleteWire = useCallback(
    (wireId: string) => {
      setWires((prevWires) => {
        const next = prevWires.filter((w) => w.id !== wireId);
        setComponents((prevComps) => {
          saveToHistory(prevComps, next);
          return prevComps;
        });
        return next;
      });
      setSelectedWire((prev) => (prev === wireId ? null : prev));
    },
    [saveToHistory]
  );

  const rotateSelected = useCallback(() => {
    setComponents((prev) =>
      prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, rotation: (c.rotation + 90) % 360 } : c
      )
    );
  }, [selectedComponents]);

  const mirrorSelected = useCallback(() => {
    setComponents((prev) =>
      prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, mirrored: !c.mirrored } : c
      )
    );
  }, [selectedComponents]);

  const selectComponent = useCallback((compId: string, multi: boolean) => {
    setSelectedWire(null);
    setSelectedComponents((prev) => {
      if (!compId) return [];
      if (multi) return prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId];
      return prev.includes(compId) && prev.length === 1 ? [] : [compId];
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const state = historyRef.current[historyIndexRef.current];
    setComponents(state.components);
    setWires(state.wires);
    forceUpdate((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const state = historyRef.current[historyIndexRef.current];
    setComponents(state.components);
    setWires(state.wires);
    forceUpdate((n) => n + 1);
  }, []);

  const updateWireMidPoints = useCallback((wireId: string, midPoints: { x: number; y: number }[]) => {
    setWires((prev) => prev.map((w) => (w.id === wireId ? { ...w, midPoints } : w)));
  }, []);

  const reset = useCallback(() => {
    setComponents([]);
    setWires([]);
    setSelectedComponents([]);
    setSelectedWire(null);
    setConnectingFrom(null);
    saveToHistory([], []);
    localStorage.removeItem(STORAGE_KEY);
  }, [saveToHistory]);

  return {
    components,
    wires,
    connectingFrom,
    setConnectingFrom,
    selectedComponents,
    selectedWire,
    setSelectedWire,
    showGrid,
    setShowGrid,
    wireColor,
    setWireColor,
    wireType,
    setWireType,
    isSimulating,
    setIsSimulating,
    addComponent,
    moveComponent,
    handlePinClick,
    deleteSelected,
    deleteWire,
    rotateSelected,
    mirrorSelected,
    selectComponent,
    undo,
    redo,
    reset,
    updateWireMidPoints,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  };
}
