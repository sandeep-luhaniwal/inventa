export type Vec3Tuple = [number, number, number];
export type ConnectionMode = "wire" | "direct";

export interface PinDefinition {
  id: string;
  label: string;
  position: Vec3Tuple;
  color?: string;
}

export interface ComponentDefinition {
  type: string;
  name: string;
  scale?: number;
  color: string;
  bodySize: Vec3Tuple;
  pins: PinDefinition[];
}

export interface PlacedComponent {
  id: string;
  type: string;
  position: Vec3Tuple;
  rotationY: number;
}

export interface WireEndpoint {
  componentId: string;
  pinId: string;
}

export interface WireConnection {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
  color: string;
}

export interface DirectConnection {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
}

export interface PendingWire {
  componentId: string;
  pinId: string;
  worldPosition: Vec3Tuple;
}
