export interface Pin {
  x: number;
  y: number;
}

export interface RelativePin {
  name: string;
  relX: number;
  relY: number;
  type?: string;
}

export interface PlacedComponent {
  id: string;
  componentId: string;
  name: string;
  imageSrc?: string;
  litImageSrc?: string;
  ledColor?: string;
  x: number;
  y: number;
  rotation: number;
  mirrored: boolean;
  flipped: boolean;
  width?: number;
  height?: number;
  ports: Pin[];
  isBlinking?: boolean;
  relativePins?: RelativePin[];
  
  // Ohm's Law fields
  resistanceValue?: number;
  resistanceUnit?: string;
  isBurned?: boolean;
  brightness?: number; // 0 to 1
}

export interface Note {
  id: string;
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
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
  draftMidPoints?: WirePoint[];
}

export interface HistoryEntry {
  components: PlacedComponent[];
  wires: Wire[];
  notes: Note[];
}
