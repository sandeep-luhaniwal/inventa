"use client";

import { create } from "zustand";
import { COMPONENT_LIBRARY, GRID_SIZE, INITIAL_COMPONENTS } from "../modelLibrary";
import {
  ConnectionMode,
  DirectConnection,
  PendingWire,
  PlacedComponent,
  Vec3Tuple,
  WireConnection,
  WireEndpoint,
} from "../types";
import { alignComponentPinToWorldPosition, getPinWorldPosition, snapToGrid } from "../utils";

interface CircuitEditorState {
  connectionMode: ConnectionMode;
  components: PlacedComponent[];
  wires: WireConnection[];
  directConnections: DirectConnection[];
  pendingWire: PendingWire | null;
  setConnectionMode: (mode: ConnectionMode) => void;
  addComponent: (type: string) => void;
  moveComponent: (id: string, position: Vec3Tuple) => void;
  rotateComponent: (id: string, radians: number) => void;
  startWire: (pending: PendingWire) => void;
  cancelWire: () => void;
  completeWire: (target: WireEndpoint, color?: string) => void;
  tryAutoDirectConnect: (componentId: string) => void;
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function connectionExists(
  directConnections: DirectConnection[],
  a: WireEndpoint,
  b: WireEndpoint
) {
  return directConnections.some(
    (item) =>
      (item.from.componentId === a.componentId &&
        item.from.pinId === a.pinId &&
        item.to.componentId === b.componentId &&
        item.to.pinId === b.pinId) ||
      (item.from.componentId === b.componentId &&
        item.from.pinId === b.pinId &&
        item.to.componentId === a.componentId &&
        item.to.pinId === a.pinId)
  );
}

function propagateDirectConnections(
  components: PlacedComponent[],
  directConnections: DirectConnection[],
  movedComponentId: string
) {
  const next = components.map((item) => ({ ...item, position: [...item.position] as Vec3Tuple }));
  const queue = [movedComponentId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);

    const currentComponent = next.find((item) => item.id === currentId);
    if (!currentComponent) continue;

    for (const connection of directConnections) {
      const isFrom = connection.from.componentId === currentId;
      const isTo = connection.to.componentId === currentId;
      if (!isFrom && !isTo) continue;

      const currentPinId = isFrom ? connection.from.pinId : connection.to.pinId;
      const neighborEndpoint = isFrom ? connection.to : connection.from;
      if (visited.has(neighborEndpoint.componentId)) continue;

      const neighborComponent = next.find((item) => item.id === neighborEndpoint.componentId);
      if (!neighborComponent) continue;

      const currentPinWorld = getPinWorldPosition(currentComponent, currentPinId);
      const alignedNeighbor = alignComponentPinToWorldPosition(
        neighborComponent,
        neighborEndpoint.pinId,
        currentPinWorld
      );

      neighborComponent.position = [
        snapToGrid(alignedNeighbor.x, GRID_SIZE),
        alignedNeighbor.y,
        snapToGrid(alignedNeighbor.z, GRID_SIZE),
      ];

      queue.push(neighborEndpoint.componentId);
    }
  }

  return next;
}

function findBestDirectSnap(
  components: PlacedComponent[],
  directConnections: DirectConnection[],
  componentId: string
) {
  const sourceComponent = components.find((item) => item.id === componentId);
  if (!sourceComponent) return null;

  let best:
    | {
        source: WireEndpoint;
        target: WireEndpoint;
        distance: number;
      }
    | null = null;

  const threshold = 0.42;
  const sourcePins = COMPONENT_LIBRARY[sourceComponent.type]?.pins ?? [];

  for (const sourcePin of sourcePins) {
    const sourceWorld = getPinWorldPosition(sourceComponent, sourcePin.id);

    for (const targetComponent of components) {
      if (targetComponent.id === sourceComponent.id) continue;
      const targetPins = COMPONENT_LIBRARY[targetComponent.type]?.pins ?? [];

      for (const targetPin of targetPins) {
        const sourceEndpoint = { componentId: sourceComponent.id, pinId: sourcePin.id };
        const targetEndpoint = { componentId: targetComponent.id, pinId: targetPin.id };
        if (connectionExists(directConnections, sourceEndpoint, targetEndpoint)) continue;

        const targetWorld = getPinWorldPosition(targetComponent, targetPin.id);
        const distance = sourceWorld.distanceTo(targetWorld);
        if (distance > threshold) continue;

        if (!best || distance < best.distance) {
          best = { source: sourceEndpoint, target: targetEndpoint, distance };
        }
      }
    }
  }

  return best;
}

export const useCircuitEditorStore = create<CircuitEditorState>((set, get) => ({
  connectionMode: "wire",
  components: INITIAL_COMPONENTS,
  wires: [],
  directConnections: [],
  pendingWire: null,
  setConnectionMode: (connectionMode) => set({ connectionMode, pendingWire: null }),
  addComponent: (type) =>
    set((state) => ({
      components: [
        ...state.components,
        {
          id: makeId(type),
          type,
          position: [0, 0.5, 2 + state.components.length * 0.75],
          rotationY: 0,
        },
      ],
    })),
  moveComponent: (id, position) =>
    set((state) => {
      const moved = state.components.map((item) => (item.id === id ? { ...item, position } : item));
      return {
        components: propagateDirectConnections(moved, state.directConnections, id),
      };
    }),
  rotateComponent: (id, radians) =>
    set((state) => {
      const rotated = state.components.map((item) => (item.id === id ? { ...item, rotationY: radians } : item));
      return {
        components: propagateDirectConnections(rotated, state.directConnections, id),
      };
    }),
  startWire: (pendingWire) => set({ pendingWire }),
  cancelWire: () => set({ pendingWire: null }),
  completeWire: (target, color = "#ef4444") => {
    const { pendingWire, connectionMode, directConnections } = get();
    if (!pendingWire) return;

    if (
      pendingWire.componentId === target.componentId &&
      pendingWire.pinId === target.pinId
    ) {
      set({ pendingWire: null });
      return;
    }

    if (connectionMode === "direct") {
      const source = { componentId: pendingWire.componentId, pinId: pendingWire.pinId };
      if (connectionExists(directConnections, source, target)) {
        set({ pendingWire: null });
        return;
      }

      set((state) => {
        const sourceComponent = state.components.find((item) => item.id === source.componentId);
        const targetComponent = state.components.find((item) => item.id === target.componentId);
        if (!sourceComponent || !targetComponent) {
          return { pendingWire: null };
        }

        const targetWorld = getPinWorldPosition(targetComponent, target.pinId);
        const alignedSource = alignComponentPinToWorldPosition(sourceComponent, source.pinId, targetWorld);
        const alignedComponents = state.components.map((item) =>
          item.id === source.componentId
            ? {
                ...item,
                position: [
                  snapToGrid(alignedSource.x, GRID_SIZE),
                  alignedSource.y,
                  snapToGrid(alignedSource.z, GRID_SIZE),
                ] as Vec3Tuple,
              }
            : item
        );
        const nextDirectConnections = [...state.directConnections, { id: makeId("direct"), from: source, to: target }];

        return {
          components: propagateDirectConnections(alignedComponents, nextDirectConnections, source.componentId),
          directConnections: nextDirectConnections,
          pendingWire: null,
        };
      });
      return;
    }

    set((state) => ({
      wires: [
        ...state.wires,
        {
          id: makeId("wire"),
          from: { componentId: pendingWire.componentId, pinId: pendingWire.pinId },
          to: target,
          color,
        },
      ],
      pendingWire: null,
    }));
  },
  tryAutoDirectConnect: (componentId) =>
    set((state) => {
      if (state.connectionMode !== "direct") return {};

      const best = findBestDirectSnap(state.components, state.directConnections, componentId);
      if (!best) return {};

      const sourceComponent = state.components.find((item) => item.id === best.source.componentId);
      const targetComponent = state.components.find((item) => item.id === best.target.componentId);
      if (!sourceComponent || !targetComponent) return {};

      const targetWorld = getPinWorldPosition(targetComponent, best.target.pinId);
      const alignedSource = alignComponentPinToWorldPosition(sourceComponent, best.source.pinId, targetWorld);
      const alignedComponents = state.components.map((item) =>
        item.id === sourceComponent.id
          ? {
              ...item,
              position: [
                snapToGrid(alignedSource.x, GRID_SIZE),
                alignedSource.y,
                snapToGrid(alignedSource.z, GRID_SIZE),
              ] as Vec3Tuple,
            }
          : item
      );
      const nextDirectConnections = [
        ...state.directConnections,
        { id: makeId("direct"), from: best.source, to: best.target },
      ];

      return {
        components: propagateDirectConnections(alignedComponents, nextDirectConnections, sourceComponent.id),
        directConnections: nextDirectConnections,
      };
    }),
}));
