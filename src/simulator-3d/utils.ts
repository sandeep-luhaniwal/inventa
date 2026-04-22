import * as THREE from "three";
import { GRID_SIZE, COMPONENT_LIBRARY } from "./modelLibrary";
import { PlacedComponent, Vec3Tuple } from "./types";

export function snapToGrid(value: number, step = GRID_SIZE) {
  return Math.round(value / step) * step;
}

export function snapVector(point: THREE.Vector3, y: number) {
  return new THREE.Vector3(snapToGrid(point.x), y, snapToGrid(point.z));
}

export function tupleToVector3(tuple: [number, number, number]) {
  return new THREE.Vector3(tuple[0], tuple[1], tuple[2]);
}

export function vector3ToTuple(vector: THREE.Vector3): Vec3Tuple {
  return [vector.x, vector.y, vector.z];
}

export function rotateY(tuple: [number, number, number], radians: number) {
  return tupleToVector3(tuple).applyAxisAngle(new THREE.Vector3(0, 1, 0), radians);
}

export function getPinWorldPosition(component: PlacedComponent, pinId: string) {
  const definition = COMPONENT_LIBRARY[component.type];
  const pin = definition?.pins.find((item) => item.id === pinId);

  if (!pin) {
    return new THREE.Vector3(...component.position);
  }

  return new THREE.Vector3(...component.position).add(rotateY(pin.position, component.rotationY));
}

export function createWireCurve(start: THREE.Vector3, end: THREE.Vector3) {
  const distance = start.distanceTo(end);
  const lift = Math.max(0.35, distance * 0.18);
  const startControl = start.clone().lerp(end, 0.25).add(new THREE.Vector3(0, lift, 0));
  const endControl = start.clone().lerp(end, 0.75).add(new THREE.Vector3(0, lift, 0));

  return new THREE.CubicBezierCurve3(start, startControl, endControl, end);
}

export function alignComponentPinToWorldPosition(
  component: PlacedComponent,
  pinId: string,
  targetWorld: THREE.Vector3
) {
  const currentPinWorld = getPinWorldPosition(component, pinId);
  const delta = targetWorld.clone().sub(currentPinWorld);

  return new THREE.Vector3(...component.position).add(delta);
}
