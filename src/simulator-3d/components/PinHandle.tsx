"use client";

import { Sphere } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { PinDefinition } from "../types";

interface PinHandleProps {
  componentId: string;
  pin: PinDefinition;
  active: boolean;
  mode: "wire" | "direct";
  onSelect: (componentId: string, pinId: string, worldPosition: [number, number, number]) => void;
}

export default function PinHandle({ componentId, pin, active, mode, onSelect }: PinHandleProps) {
  const color = active ? "#22c55e" : pin.color ?? "#f59e0b";

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const point: [number, number, number] = [event.point.x, event.point.y, event.point.z];
    onSelect(componentId, pin.id, point);
  };

  return (
    <group position={pin.position}>
      <Sphere args={[0.08, 18, 18]} onClick={handleClick}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.45 : mode === "direct" ? 0.22 : 0.15}
        />
      </Sphere>
    </group>
  );
}
