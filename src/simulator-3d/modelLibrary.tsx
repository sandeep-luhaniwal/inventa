import { Box, Cylinder, Sphere } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { ComponentDefinition } from "./types";

export const GRID_SIZE = 0.5;

export const COMPONENT_LIBRARY: Record<string, ComponentDefinition> = {
  led: {
    type: "led",
    name: "LED",
    scale: 1,
    color: "#ef4444",
    bodySize: [0.6, 1, 0.6],
    pins: [
      { id: "anode", label: "Anode", position: [-0.16, -0.8, 0], color: "#f97316" },
      { id: "cathode", label: "Cathode", position: [0.16, -0.95, 0], color: "#94a3b8" },
    ],
  },
  resistor: {
    type: "resistor",
    name: "Resistor",
    scale: 1,
    color: "#d97706",
    bodySize: [1.4, 0.32, 0.32],
    pins: [
      { id: "left", label: "Pin 1", position: [-1.15, 0, 0], color: "#94a3b8" },
      { id: "right", label: "Pin 2", position: [1.15, 0, 0], color: "#94a3b8" },
    ],
  },
  battery: {
    type: "battery",
    name: "Battery",
    scale: 1,
    color: "#1d4ed8",
    bodySize: [1.2, 1.8, 0.8],
    pins: [
      { id: "positive", label: "+", position: [0.25, 1.05, 0], color: "#ef4444" },
      { id: "negative", label: "-", position: [-0.25, 1.05, 0], color: "#111827" },
    ],
  },
};

export const INITIAL_COMPONENTS = [
  { id: "battery-1", type: "battery", position: [-2, 0.9, 0] as [number, number, number], rotationY: 0 },
  { id: "resistor-1", type: "resistor", position: [0, 0.2, 0] as [number, number, number], rotationY: 0 },
  { id: "led-1", type: "led", position: [2.2, 0.85, 0] as [number, number, number], rotationY: 0 },
];

export function FallbackComponentMesh({
  type,
  color,
  ...props
}: ThreeElements["group"] & { type: string; color: string }) {
  if (type === "led") {
    return (
      <group {...props}>
        <Cylinder args={[0.18, 0.18, 0.8, 24]} position={[0, -0.15, 0]} rotation={[0, 0, 0]} castShadow>
          <meshStandardMaterial color={color} metalness={0.15} roughness={0.32} />
        </Cylinder>
        <Sphere args={[0.28, 24, 24]} position={[0, 0.35, 0]} castShadow>
          <meshStandardMaterial color={color} transparent opacity={0.85} roughness={0.18} />
        </Sphere>
        <Cylinder args={[0.03, 0.03, 1.1, 8]} position={[-0.16, -0.95, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Cylinder args={[0.03, 0.03, 1.35, 8]} position={[0.16, -1.05, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>
    );
  }

  if (type === "battery") {
    return (
      <group {...props}>
        <Box args={[1.2, 1.8, 0.8]} castShadow>
          <meshStandardMaterial color={color} roughness={0.45} />
        </Box>
        <Box args={[1.24, 0.18, 0.84]} position={[0, 0.92, 0]} castShadow>
          <meshStandardMaterial color="#dbeafe" roughness={0.3} />
        </Box>
        <Cylinder args={[0.08, 0.08, 0.12, 16]} position={[-0.25, 1.05, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 0.12, 16]} position={[0.25, 1.05, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.15} />
        </Cylinder>
      </group>
    );
  }

  return (
    <group {...props}>
      <Cylinder args={[0.1, 0.1, 1.1, 10]} position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 1.1, 10]} position={[1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.18, 0.18, 1.4, 20]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color={color} roughness={0.55} />
      </Cylinder>
    </group>
  );
}
