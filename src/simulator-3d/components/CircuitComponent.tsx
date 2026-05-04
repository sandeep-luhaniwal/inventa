"use client";


import { Html } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { COMPONENT_LIBRARY, FallbackComponentMesh } from "../modelLibrary";
import { PlacedComponent } from "../types";
import { snapVector } from "../utils";
import PinHandle from "./PinHandle";


interface CircuitComponentProps {
  component: PlacedComponent;
  isWireSource: boolean;
  connectionMode: "wire" | "direct";
  onMove: (componentId: string, position: [number, number, number]) => void;
  onDragEndSnap: (componentId: string) => void;
  onRotate: (componentId: string, radians: number) => void;
  onPinSelect: (componentId: string, pinId: string, worldPosition: [number, number, number]) => void;
}

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function withPointerCapture(event: ThreeEvent<PointerEvent>, action: "set" | "release") {
  const target = event.target as EventTarget | null;
  const captureTarget = target as
    | (EventTarget & {
        setPointerCapture?: (pointerId: number) => void;
        releasePointerCapture?: (pointerId: number) => void;
      })
    | null;

  if (action === "set") {
    captureTarget?.setPointerCapture?.(event.pointerId);
    return;
  }

  captureTarget?.releasePointerCapture?.(event.pointerId);
}

export default function CircuitComponent({
  component,
  isWireSource,
  connectionMode,
  onMove,
  onDragEndSnap,
  onRotate,
  onPinSelect,
}: CircuitComponentProps) {
  const definition = COMPONENT_LIBRARY[component.type];
  const draggingRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const bodyPosition = useMemo<[number, number, number]>(() => {
    return [0, definition.bodySize[1] / 2, 0];
  }, [definition.bodySize]);

  const updateDragPosition = (event: ThreeEvent<PointerEvent>) => {
    const worldPoint = new THREE.Vector3();
    if (!event.ray.intersectPlane(dragPlane, worldPoint)) return;
    const snapped = snapVector(worldPoint, component.position[1]);
    onMove(component.id, [snapped.x, component.position[1], snapped.z]);
  };

  return (
    <group
      position={component.position}
      rotation={[0, component.rotationY, 0]}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <group
        onDoubleClick={(event) => {
          event.stopPropagation();
          onRotate(component.id, component.rotationY + Math.PI / 2);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          draggingRef.current = true;
          withPointerCapture(event, "set");
          updateDragPosition(event);
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          event.stopPropagation();
          updateDragPosition(event);
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          event.stopPropagation();
          withPointerCapture(event, "release");
          onDragEndSnap(component.id);
        }}
      >
        <FallbackComponentMesh
          type={component.type}
          color={definition.color}
          position={bodyPosition}
        />

      </group>

      {definition.pins.map((pin) => (
        <PinHandle
          key={pin.id}
          componentId={component.id}
          pin={pin}
          active={isWireSource}
          mode={connectionMode}
          onSelect={onPinSelect}
        />
      ))}

      {hovered && (
        <Html position={[0, definition.bodySize[1] + 0.65, 0]} center distanceFactor={10}>
          <div className="rounded-full border border-white/20 bg-slate-950/85 px-3 py-1 text-xs text-white shadow-lg">
            {definition.name}
          </div>
        </Html>
      )}
    </group>
  );
}
