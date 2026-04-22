"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ApiPin = {
  _id?: string;
  name: string;
  relX: number;
  relY: number;
  type?: string;
};

type ApiComponent = {
  _id: string;
  name?: string;
  imageUrl?: string;
  filepath?: string;
  filename?: string;
  base64?: string;
  pins?: ApiPin[];
  category?: string;
};

type CanvasInstance = {
  id: string;
  component: ApiComponent;
  x: number;
  y: number;
};

type WireEndpoint = {
  instanceId: string;
  pinKey: string;
};

type Wire = {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
};

type PinPosition = {
  x: number;
  y: number;
  name: string;
};

const API_URL = "http://localhost:5004/api/images/getAllImages";
const API_BASE = "http://localhost:5004";
const DEFAULT_CATEGORY = "Components";
const CARD_PADDING = 12;
const PIN_SNAP_DISTANCE = 18;

function makeInstanceId() {
  return `instance-${Math.random().toString(36).slice(2, 10)}`;
}

function makeWireId() {
  return `wire-${Math.random().toString(36).slice(2, 10)}`;
}

function getPinKey(pin: ApiPin, index: number) {
  return pin._id ?? `${pin.name}-${index}`;
}

function getWirePath(start: PinPosition, end: PinPosition) {
  const lead = 34;
  const radius = 12;
  const startDir = end.y >= start.y ? 1 : -1;
  const endDir = start.y >= end.y ? 1 : -1;

  const p0 = { x: start.x, y: start.y };
  const p1 = { x: start.x, y: start.y + lead * startDir };
  const p4 = { x: end.x, y: end.y + lead * endDir };
  const p5 = { x: end.x, y: end.y };

  const horizontalGap = Math.abs(p4.x - p1.x);
  const verticalGap = Math.abs(p4.y - p1.y);
  const r1 = Math.min(radius, horizontalGap / 2 || radius, verticalGap / 2 || radius);

  if (horizontalGap < 8) {
    const midY = (p1.y + p4.y) / 2;
    return [
      `M ${p0.x} ${p0.y}`,
      `L ${p1.x} ${p1.y}`,
      `L ${p1.x} ${midY}`,
      `L ${p4.x} ${midY}`,
      `L ${p4.x} ${p4.y}`,
      `L ${p5.x} ${p5.y}`,
    ].join(" ");
  }

  const xTurnDir = p4.x >= p1.x ? 1 : -1;
  const yTurnDir = p4.y >= p1.y ? 1 : -1;

  const p2 = { x: p4.x - r1 * xTurnDir, y: p1.y };
  const p3 = { x: p4.x, y: p1.y + r1 * yTurnDir };

  return [
    `M ${p0.x} ${p0.y}`,
    `L ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `Q ${p4.x} ${p1.y} ${p3.x} ${p3.y}`,
    `L ${p4.x} ${p4.y}`,
    `L ${p5.x} ${p5.y}`,
  ].join(" ");
}

function getInstancePinPixelPosition(
  instance: CanvasInstance,
  pin: ApiPin,
  size: { width: number; height: number }
) {
  return {
    x: instance.x + CARD_PADDING + size.width * pin.relX,
    y: instance.y + CARD_PADDING + size.height * pin.relY,
  };
}

function inferCategory(component: ApiComponent) {
  if (component.category?.trim()) return component.category.trim();

  const name = getComponentDisplayName(component).toLowerCase();
  if (name.includes("battery")) return "Power";
  if (name.includes("switch") || name.includes("button")) return "Switches";
  if (name.includes("led")) return "Indicators";
  if (name.includes("motor")) return "Motors";
  return "Passive";
}

function getComponentDisplayName(component: ApiComponent) {
  if (component.name?.trim()) return component.name.trim();
  if (component.filename?.trim()) {
    return component.filename
      .replace(/^\d+-/, "")
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
  }
  return "Unnamed Component";
}

function getComponentImageUrl(component: ApiComponent) {
  if (component.imageUrl) return component.imageUrl;
  if (component.base64) return `data:image/png;base64,${component.base64}`;
  if (component.filepath) return `${API_BASE}/${component.filepath.replace(/\\/g, "/")}`;
  return "";
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const node = ref.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    setSize({
      width: node.clientWidth,
      height: node.clientHeight,
    });

    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function SidebarCard({ component }: { component: ApiComponent }) {
  const imageUrl = getComponentImageUrl(component);
  const displayName = getComponentDisplayName(component);
  const pins = component.pins ?? [];

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("application/json", JSON.stringify(component));
      }}
      className="cursor-grab rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-sky-400 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 p-2">
          {imageUrl ? (
            <img src={imageUrl} alt={component.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-slate-400">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="mt-1 text-xs text-slate-500">{pins.length} pins</p>
        </div>
      </div>
    </div>
  );
}

function ComponentInstance({
  instance,
  workspaceRef,
  onMove,
  onSizeChange,
  onPinClick,
  isWireStartingPin,
}: {
  instance: CanvasInstance;
  workspaceRef: React.RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
  onPinClick: (instanceId: string, pinKey: string) => void;
  isWireStartingPin: (instanceId: string, pinKey: string) => boolean;
}) {
  const { ref: imageWrapRef, size } = useElementSize<HTMLDivElement>();
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!workspaceRef.current) return;

      event.preventDefault();
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: event.clientX - workspaceRect.left - instance.x,
        y: event.clientY - workspaceRect.top - instance.y,
      };

      const handleMove = (moveEvent: PointerEvent) => {
        if (!workspaceRef.current) return;
        const rect = workspaceRef.current.getBoundingClientRect();
        const nextX = moveEvent.clientX - rect.left - dragOffsetRef.current.x;
        const nextY = moveEvent.clientY - rect.top - dragOffsetRef.current.y;
        onMove(instance.id, Math.max(0, nextX), Math.max(0, nextY));
      };

      const stopMove = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", stopMove);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", stopMove, { once: true });
    },
    [instance.id, instance.x, instance.y, onMove, workspaceRef]
  );

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      onSizeChange(instance.id, size.width, size.height);
    }
  }, [instance.id, onSizeChange, size.height, size.width]);

  return (
    <div
      className="absolute select-none rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_12px_24px_rgba(15,23,42,0.12)] backdrop-blur"
      style={{ left: instance.x, top: instance.y }}
      onPointerDown={beginDrag}
    >
      <div ref={imageWrapRef} className="relative inline-flex items-center justify-center">
        <img
          src={getComponentImageUrl(instance.component)}
          alt={getComponentDisplayName(instance.component)}
          className="max-h-32 w-auto object-contain"
          draggable={false}
        />

        {size.width > 0 &&
          size.height > 0 &&
          (instance.component.pins ?? []).map((pin, index) => {
            const pinX = size.width * pin.relX;
            const pinY = size.height * pin.relY;

            return (
              <div
                key={pin._id ?? `${instance.id}-${pin.name}`}
                className="group absolute"
                style={{ left: pinX, top: pinY, transform: "translate(-50%, -50%)" }}
              >
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onPinClick(instance.id, getPinKey(pin, index));
                  }}
                  className={`h-3 w-3 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(16,185,129,0.28)] transition ${
                    isWireStartingPin(instance.id, getPinKey(pin, index))
                      ? "bg-amber-500"
                      : "bg-emerald-500 hover:bg-sky-500"
                  }`}
                  aria-label={`Pin ${pin.name}`}
                />
                <div className="pointer-events-none absolute left-1/2 top-5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] text-white group-hover:block">
                  {pin.name} ({Math.round(pinX)}, {Math.round(pinY)})
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="max-w-44 truncate text-xs font-semibold text-slate-800">
          {getComponentDisplayName(instance.component)}
        </p>
        <p className="text-[10px] text-slate-500">
          x:{Math.round(instance.x)} y:{Math.round(instance.y)}
        </p>
      </div>
    </div>
  );
}

export default function ImageCircuitEditor() {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [components, setComponents] = useState<ApiComponent[]>([]);
  const [instances, setInstances] = useState<CanvasInstance[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [pinPositions, setPinPositions] = useState<Record<string, PinPosition>>({});
  const [instanceSizes, setInstanceSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [pendingWire, setPendingWire] = useState<WireEndpoint | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadComponents() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        const payload = await response.json();
        const list = Array.isArray(payload) ? payload : payload.value;
        if (!Array.isArray(list)) {
          throw new Error("Unexpected API response shape");
        }

        if (!active) return;

        const normalized = (list as ApiComponent[]).map((item) => ({
          ...item,
          pins: Array.isArray(item.pins) ? item.pins : [],
        }));
        setComponents(normalized);

        const categories = Array.from(new Set(normalized.map((item) => inferCategory(item))));
        setExpandedCategories(
          categories.reduce<Record<string, boolean>>((acc, category, index) => {
            acc[category] = index === 0;
            return acc;
          }, {})
        );
      } catch (fetchError) {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load components");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadComponents();
    return () => {
      active = false;
    };
  }, []);

  const groupedComponents = useMemo(() => {
    return components.reduce<Record<string, ApiComponent[]>>((acc, component) => {
      const category = inferCategory(component) || DEFAULT_CATEGORY;
      if (!acc[category]) acc[category] = [];
      acc[category].push(component);
      return acc;
    }, {});
  }, [components]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!workspaceRef.current) return;

    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;

    const component = JSON.parse(raw) as ApiComponent;
    const rect = workspaceRef.current.getBoundingClientRect();

    setInstances((prev) => [
      ...prev,
      {
        id: makeInstanceId(),
        component,
        x: event.clientX - rect.left - 48,
        y: event.clientY - rect.top - 48,
      },
    ]);
  }, []);

  const updateInstancePosition = useCallback((id: string, x: number, y: number) => {
    setInstances((prev) => {
      const movedInstance = prev.find((instance) => instance.id === id);
      const movedSize = instanceSizes[id];

      if (!movedInstance || !movedSize) {
        return prev.map((instance) => (instance.id === id ? { ...instance, x, y } : instance));
      }

      const movedDraft = { ...movedInstance, x, y };
      let snappedPosition = { x, y };
      let bestSnap:
        | {
            distance: number;
            offsetX: number;
            offsetY: number;
          }
        | undefined;

      for (const sourcePin of movedDraft.component.pins ?? []) {
        const sourcePoint = getInstancePinPixelPosition(movedDraft, sourcePin, movedSize);

        for (const targetInstance of prev) {
          if (targetInstance.id === movedDraft.id) continue;
          const targetSize = instanceSizes[targetInstance.id];
          if (!targetSize) continue;

          for (const targetPin of targetInstance.component.pins ?? []) {
            const targetPoint = getInstancePinPixelPosition(targetInstance, targetPin, targetSize);
            const distance = Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y);

            if (distance <= PIN_SNAP_DISTANCE && (!bestSnap || distance < bestSnap.distance)) {
              bestSnap = {
                distance,
                offsetX: targetPoint.x - sourcePoint.x,
                offsetY: targetPoint.y - sourcePoint.y,
              };
            }
          }
        }
      }

      if (bestSnap) {
        snappedPosition = {
          x: x + bestSnap.offsetX,
          y: y + bestSnap.offsetY,
        };
      }

      return prev.map((instance) =>
        instance.id === id ? { ...instance, x: Math.max(0, snappedPosition.x), y: Math.max(0, snappedPosition.y) } : instance
      );
    });
  }, [instanceSizes]);

  const handleInstanceSizeChange = useCallback((id: string, width: number, height: number) => {
    setInstanceSizes((prev) => {
      const current = prev[id];
      if (current?.width === width && current?.height === height) return prev;
      return { ...prev, [id]: { width, height } };
    });
  }, []);

  useEffect(() => {
    const nextPinPositions: Record<string, PinPosition> = {};

    for (const instance of instances) {
      const size = instanceSizes[instance.id];
      if (!size) continue;

      (instance.component.pins ?? []).forEach((pin, index) => {
        const pinKey = getPinKey(pin, index);
        nextPinPositions[`${instance.id}:${pinKey}`] = {
          x: instance.x + 12 + size.width * pin.relX,
          y: instance.y + 12 + size.height * pin.relY,
          name: pin.name,
        };
      });
    }

    setPinPositions(nextPinPositions);
  }, [instanceSizes, instances]);

  const handlePinClick = useCallback((instanceId: string, pinKey: string) => {
    const endpoint = { instanceId, pinKey };

    setPendingWire((current) => {
      if (!current) return endpoint;

      if (current.instanceId === endpoint.instanceId && current.pinKey === endpoint.pinKey) {
        return null;
      }

      setWires((prev) => {
        const duplicate = prev.some(
          (wire) =>
            (wire.from.instanceId === current.instanceId &&
              wire.from.pinKey === current.pinKey &&
              wire.to.instanceId === endpoint.instanceId &&
              wire.to.pinKey === endpoint.pinKey) ||
            (wire.from.instanceId === endpoint.instanceId &&
              wire.from.pinKey === endpoint.pinKey &&
              wire.to.instanceId === current.instanceId &&
              wire.to.pinKey === current.pinKey)
        );

        if (duplicate) return prev;

        return [...prev, { id: makeWireId(), from: current, to: endpoint }];
      });

      return null;
    });
  }, []);

  const isWireStartingPin = useCallback(
    (instanceId: string, pinKey: string) =>
      pendingWire?.instanceId === instanceId && pendingWire?.pinKey === pinKey,
    [pendingWire]
  );

  const placedWirePaths = useMemo(() => {
    return wires
      .map((wire) => {
        const start = pinPositions[`${wire.from.instanceId}:${wire.from.pinKey}`];
        const end = pinPositions[`${wire.to.instanceId}:${wire.to.pinKey}`];
        if (!start || !end) return null;
        return { id: wire.id, path: getWirePath(start, end) };
      })
      .filter((wire): wire is { id: string; path: string } => Boolean(wire));
  }, [pinPositions, wires]);

  const pendingWirePath = useMemo(() => {
    if (!pendingWire || !cursorPosition) return null;
    const start = pinPositions[`${pendingWire.instanceId}:${pendingWire.pinKey}`];
    if (!start) return null;
    return getWirePath(start, { ...cursorPosition, name: "cursor" });
  }, [cursorPosition, pendingWire, pinPositions]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#e4eef8_100%)] p-6">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Component Library</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Drag parts into the workspace</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Components load from your backend and keep their pin percentages so the pins render at exact pixel locations
              on the dropped image.
            </p>
          </div>

          {loading && <p className="text-sm text-slate-500">Loading components from {API_URL}...</p>}
          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div className="space-y-3 overflow-y-auto pr-1">
            {Object.entries(groupedComponents).map(([category, items]) => (
              <section key={category} className="rounded-2xl border border-slate-200 bg-slate-50/80">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900">{category}</span>
                  <span className="text-xs text-slate-500">{items.length} items</span>
                </button>

                {expandedCategories[category] && (
                  <div className="space-y-3 border-t border-slate-200 px-3 py-3">
                    {items.map((component) => (
                      <SidebarCard key={component._id} component={component} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </aside>

        <main className="rounded-[32px] border border-slate-200 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Workspace</h2>
              <p className="mt-1 text-sm text-slate-600">
                Drop components here, then drag them to update their stored `x` and `y` coordinates.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">
              Instances: {instances.length}
            </div>
          </div>

          <div
            ref={workspaceRef}
            onMouseMove={(event) => {
              if (!workspaceRef.current || !pendingWire) return;
              const rect = workspaceRef.current.getBoundingClientRect();
              setCursorPosition({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }}
            onClick={() => {
              if (pendingWire) setPendingWire(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleDrop}
            className="relative h-[78vh] min-h-[620px] overflow-hidden rounded-[28px] border border-dashed border-sky-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(226,238,250,0.95))]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.85), rgba(226,238,250,0.95))",
              backgroundSize: "24px 24px, 24px 24px, auto",
              backgroundPosition: "0 0, 0 0, 0 0",
            }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {placedWirePaths.map((wire) => (
                <path
                  key={wire.id}
                  d={wire.path}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}
              {pendingWirePath && (
                <path
                  d={pendingWirePath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                />
              )}
            </svg>

            {instances.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-3xl border border-white/80 bg-white/85 px-8 py-6 text-center shadow-lg">
                  <p className="text-lg font-semibold text-slate-900">Drop a component to start</p>
                  <p className="mt-2 text-sm text-slate-500">
                    The canvas stores instance coordinates and computes exact pixel pin positions from `relX` and `relY`.
                  </p>
                </div>
              </div>
            )}

            {instances.map((instance) => (
              <ComponentInstance
                key={instance.id}
                instance={instance}
                workspaceRef={workspaceRef}
                onMove={updateInstancePosition}
                onSizeChange={handleInstanceSizeChange}
                onPinClick={handlePinClick}
                isWireStartingPin={isWireStartingPin}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
