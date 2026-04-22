"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { useCircuitEditorStore } from "../store/useCircuitEditorStore";
import CircuitComponent from "./CircuitComponent";
import WireSpline, { PendingWireSpline } from "./WireSpline";

function CursorFollower({
  onChange,
}: {
  onChange: (point: THREE.Vector3 | null) => void;
}) {
  const { raycaster, camera, pointer } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  useFrame(() => {
    const point = new THREE.Vector3();
    raycaster.setFromCamera(pointer, camera);
    onChange(raycaster.ray.intersectPlane(plane, point) ? point.clone() : null);
  });

  return null;
}

function CircuitScene() {
  const [cursor, setCursor] = useState<THREE.Vector3 | null>(null);
  const {
    components,
    wires,
    pendingWire,
    connectionMode,
    moveComponent,
    tryAutoDirectConnect,
    rotateComponent,
    startWire,
    completeWire,
  } =
    useCircuitEditorStore();

  return (
    <>
      <color attach="background" args={["#e5eef7"]} />
      <fog attach="fog" args={["#e5eef7", 14, 30]} />

      <ambientLight intensity={1.2} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.001, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#d8e2ec" />
      </mesh>

      <gridHelper args={[40, 80, "#58718b", "#9fb3c8"]} position={[0, 0.002, 0]} />

      {components.map((component) => (
        <CircuitComponent
          key={component.id}
          component={component}
          isWireSource={pendingWire?.componentId === component.id}
          connectionMode={connectionMode}
          onMove={moveComponent}
          onDragEndSnap={tryAutoDirectConnect}
          onRotate={rotateComponent}
          onPinSelect={(componentId, pinId, worldPosition) => {
            if (!pendingWire) {
              startWire({ componentId, pinId, worldPosition });
              return;
            }

            completeWire({ componentId, pinId });
          }}
        />
      ))}

      {wires.map((wire) => (
        <WireSpline key={wire.id} wire={wire} components={components} />
      ))}

      {pendingWire && (
        <PendingWireSpline
          fromComponent={components.find((item) => item.id === pendingWire.componentId)}
          fromPinId={pendingWire.pinId}
          cursor={connectionMode === "wire" ? cursor : null}
        />
      )}

      <CursorFollower onChange={setCursor} />
      <OrbitControls makeDefault enableDamping />
    </>
  );
}

export default function SceneCanvas() {
  return (
    <div className="h-full w-full overflow-hidden rounded-[28px] border border-slate-300/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(214,226,238,0.88))] shadow-[0_30px_80px_rgba(53,82,110,0.22)]">
      <Canvas camera={{ position: [7, 6, 7], fov: 45 }} shadows>
        <Suspense fallback={null}>
          <CircuitScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
