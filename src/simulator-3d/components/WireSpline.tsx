"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { PlacedComponent, WireConnection } from "../types";
import { createWireCurve, getPinWorldPosition } from "../utils";

interface WireSplineProps {
  wire: WireConnection;
  components: PlacedComponent[];
}

export default function WireSpline({ wire, components }: WireSplineProps) {
  const fromComponent = components.find((item) => item.id === wire.from.componentId);
  const toComponent = components.find((item) => item.id === wire.to.componentId);

  const geometry = useMemo(() => {
    if (!fromComponent || !toComponent) return null;

    const start = getPinWorldPosition(fromComponent, wire.from.pinId);
    const end = getPinWorldPosition(toComponent, wire.to.pinId);
    const curve = createWireCurve(start, end);
    return new THREE.TubeGeometry(curve, 40, 0.045, 12, false);
  }, [fromComponent, toComponent, wire.from.pinId, wire.to.pinId]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={wire.color} roughness={0.45} metalness={0.08} />
    </mesh>
  );
}

export function PendingWireSpline({
  fromComponent,
  fromPinId,
  cursor,
}: {
  fromComponent: PlacedComponent | undefined;
  fromPinId: string;
  cursor: THREE.Vector3 | null;
}) {
  const geometry = useMemo(() => {
    if (!fromComponent || !cursor) return null;

    const start = getPinWorldPosition(fromComponent, fromPinId);
    const curve = createWireCurve(start, cursor);
    return new THREE.TubeGeometry(curve, 32, 0.035, 10, false);
  }, [fromComponent, fromPinId, cursor]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#f97316" transparent opacity={0.75} />
    </mesh>
  );
}
