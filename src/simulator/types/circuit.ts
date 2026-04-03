export interface Pin {
  x: number;
  y: number;
}

export interface PlacedComponent {
  id: string;
  componentId: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  mirrored: boolean;
  ports: Pin[];
}

export interface WireEndpoint {
  compId: string;
  portIndex: number;
}

export interface WirePoint {
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
  midPoints?: WirePoint[];
}

export interface ConnectingFrom {
  compId: string;
  portIndex: number;
}

export interface HistoryEntry {
  components: PlacedComponent[];
  wires: Wire[];
}
