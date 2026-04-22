"use client"
import { useState, useCallback, useRef, useEffect } from "react";
import { ConnectingFrom, HistoryEntry, Note, PlacedComponent, Wire, WirePoint } from "../types/circuit";
import { getLedDataUrls, STATIC_COMPONENTS, svgToDataUrl } from "../constants/staticComponents";

export type { PlacedComponent, Wire, ConnectingFrom };

const STORAGE_KEY = "circuit_project";

function resolveStaticComponentImages(comp: PlacedComponent): PlacedComponent {
  if (comp.componentId === "breadboard") {
    return comp;
  }

  if (comp.componentId.startsWith("led_") || comp.componentId === "led") {
    const resolvedColor =
      comp.ledColor ??
      (comp.componentId.startsWith("led_")
        ? comp.componentId.replace("led_", "")
        : "red");
    const { imageSrc, litImageSrc } = getLedDataUrls(resolvedColor);
    return {
      ...comp,
      ledColor: resolvedColor,
      imageSrc,
      litImageSrc,
    };
  }

  const def = STATIC_COMPONENTS.find((item) => item.id === comp.componentId);
  if (!def) {
    return comp;
  }

  return {
    ...comp,
    imageSrc: svgToDataUrl(def, false),
    litImageSrc: def.litSvgBody ? svgToDataUrl(def, true) : comp.litImageSrc,
  };
}

function loadFromStorage(): { components: PlacedComponent[]; wires: Wire[]; notes: Note[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { components?: PlacedComponent[]; wires?: Wire[]; notes?: Note[] };
      const components = (parsed.components ?? []).map(resolveStaticComponentImages);
      const wires = parsed.wires ?? [];
      const notes = parsed.notes ?? [];
      return { components, wires, notes };
    }
  } catch {}
  return { components: [], wires: [], notes: [] };
}

export function useCircuitStore() {
  const initial = loadFromStorage();
  const [components, setComponents] = useState<PlacedComponent[]>(initial.components);
  const [wires, setWires] = useState<Wire[]>(initial.wires);
  const [notes, setNotes] = useState<Note[]>(initial.notes);
  const [connectingFrom, setConnectingFrom] = useState<ConnectingFrom | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ components, wires, notes }));
    } catch {}
  }, [components, wires, notes]);

  const saveToHistory = useCallback((comps: PlacedComponent[], ws: Wire[], ns: Note[]) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ components: comps, wires: ws, notes: ns });
    historyIndexRef.current = historyRef.current.length - 1;
    forceUpdate((n) => n + 1);
  }, []);

  const addComponent = useCallback(
    (comp: PlacedComponent) => {
      setComponents((prev) => {
        const next = [...prev, comp];
        saveToHistory(next, wires, notes);
        return next;
      });
    },
    [wires, notes, saveToHistory]
  );

  const moveComponent = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<PlacedComponent>) => {
    setComponents((prev) => {
      // When ledColor changes, auto-refresh the SVG data URLs so the canvas shows the right icon
      let resolvedUpdates = updates;
      if (updates.ledColor !== undefined) {
        const { imageSrc, litImageSrc } = getLedDataUrls(updates.ledColor);
        resolvedUpdates = { ...updates, imageSrc, litImageSrc };
      }
      const next = prev.map((c) => (c.id === id ? { ...c, ...resolvedUpdates } : c));
      saveToHistory(next, wires, notes);
      return next;
    });
  }, [saveToHistory, wires, notes]);

  const handlePinClick = useCallback(
    (compId: string, portIndex: number) => {
      if (!connectingFrom) {
        setConnectingFrom({ compId, portIndex, draftMidPoints: [] });
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
        from: {
          compId: connectingFrom.compId,
          portIndex: connectingFrom.portIndex,
        },
        to: { compId, portIndex },
        midPoints: connectingFrom.draftMidPoints ?? [],
      };

      setWires((prevWires) => {
        const next = [...prevWires, nextWire];
        setComponents((prevComps) => {
          saveToHistory(prevComps, next, notes);
          return prevComps;
        });
        return next;
      });

      return true;
    },
    [connectingFrom, saveToHistory, wires, notes]
  );

  const addConnectingMidPoint = useCallback((point: WirePoint) => {
    setConnectingFrom((prev) => {
      if (!prev) return prev;

      const nextPoints = [...(prev.draftMidPoints ?? [])];
      const lastPoint = nextPoints[nextPoints.length - 1];
      if (lastPoint && Math.hypot(lastPoint.x - point.x, lastPoint.y - point.y) < 6) {
        return prev;
      }

      nextPoints.push(point);
      return { ...prev, draftMidPoints: nextPoints };
    });
  }, []);

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
        saveToHistory(nextComps, nextWires, notes);
        return nextWires;
      });
      return nextComps;
    });
    setSelectedComponents([]);
    setSelectedWire(null);
  }, [selectedComponents, selectedWire, saveToHistory, notes]);

  const deleteWire = useCallback(
    (wireId: string) => {
      setWires((prevWires) => {
        const next = prevWires.filter((w) => w.id !== wireId);
        setComponents((prevComps) => {
          saveToHistory(prevComps, next, notes);
          return prevComps;
        });
        return next;
      });
      setSelectedWire((prev) => (prev === wireId ? null : prev));
    },
    [saveToHistory, notes]
  );

  const rotateSelected = useCallback(() => {
    setComponents((prev) => {
      const next = prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, rotation: (c.rotation + 30) % 360 } : c
      );
      saveToHistory(next, wires, notes);
      return next;
    });
  }, [selectedComponents, saveToHistory, wires, notes]);

  const mirrorSelected = useCallback(() => {
    setComponents((prev) => {
      const next = prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, mirrored: !c.mirrored } : c
      );
      saveToHistory(next, wires, notes);
      return next;
    });
  }, [selectedComponents, saveToHistory, wires, notes]);

  const flipSelected = useCallback(() => {
    setComponents((prev) => {
      const next = prev.map((c) =>
        selectedComponents.includes(c.id) ? { ...c, flipped: !c.flipped } : c
      );
      saveToHistory(next, wires, notes);
      return next;
    });
  }, [selectedComponents, saveToHistory, wires, notes]);

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
    setNotes(state.notes);
    forceUpdate((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const state = historyRef.current[historyIndexRef.current];
    setComponents(state.components);
    setWires(state.wires);
    setNotes(state.notes);
    forceUpdate((n) => n + 1);
  }, []);

  const updateWireMidPoints = useCallback((wireId: string, midPoints: { x: number; y: number }[]) => {
    setWires((prev) => prev.map((w) => (w.id === wireId ? { ...w, midPoints } : w)));
  }, []);

  /**
   * Called by ComponentNode once the image has loaded and ink-bounds have been
   * computed. Stores the exact mapped port positions so wire-snap (circuitUtils)
   * uses the same coordinates as the visible pin dots.
   */
  const updateComponentPorts = useCallback(
    (compId: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => {
      setComponents((prev) =>
        prev.map((c) => (c.id === compId ? { ...c, ports: resolvedPorts, width, height } : c))
      );
    },
    []
  );

  const addNote = useCallback(() => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      x: 100,
      y: 100,
      text: "New Note",
      width: 120,
      height: 80,
    };
    setNotes((prev) => {
      const next = [...prev, newNote];
      saveToHistory(components, wires, next);
      return next;
    });
  }, [components, wires, saveToHistory]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, ...updates } : n));
      saveToHistory(components, wires, next);
      return next;
    });
  }, [components, wires, saveToHistory]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveToHistory(components, wires, next);
      return next;
    });
  }, [components, wires, saveToHistory]);

  const reset = useCallback(() => {
    setComponents([]);
    setWires([]);
    setNotes([]);
    setSelectedComponents([]);
    setSelectedWire(null);
    setConnectingFrom(null);
    saveToHistory([], [], []);
    localStorage.removeItem(STORAGE_KEY);
  }, [saveToHistory]);

  return {
    components,
    wires,
    notes,
    connectingFrom,
    setConnectingFrom,
    addConnectingMidPoint,
    selectedComponents,
    selectedWire,
    setSelectedWire,
    showGrid,
    setShowGrid,
    wireColor,
    setWireColor,
    wireType,
    setWireType,
    toggleGrid: () => setShowGrid((p) => !p),
    isSimulating,
    setIsSimulating,
    addComponent,
    moveComponent,
    updateComponent,
    handlePinClick,
    deleteSelected,
    deleteWire,
    rotateSelected,
    mirrorSelected,
    flipSelected,
    selectComponent,
    undo,
    redo,
    reset,
    updateWireMidPoints,
    updateComponentPorts,
    addNote,
    updateNote,
    deleteNote,
    // eslint-disable-next-line react-hooks/refs
    canUndo: historyIndexRef.current > 0,
    // eslint-disable-next-line react-hooks/refs
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  };
}
