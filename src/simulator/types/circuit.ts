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
  isPressed?: boolean;
  relativePins?: RelativePin[];
  
  // Ohm's Law fields
  resistanceValue?: number;
  resistanceUnit?: string;
  voltageValue?: number;
  wattageValue?: number;
  capacitanceValue?: number;
  capacitanceUnit?: string;
  isBurned?: boolean;
  brightness?: number; // 0 to 1

  // Power Supply Simulation Engine fields
  powerSupplyType?: "DC" | "AC";
  powerVoltageSet?: number;
  powerCurrentLimit?: number;
  powerFrequency?: number;
  powerEnabled?: boolean;

  // Physics fields (Coulomb's Law)
  chargeValue?: number;
  chargeUnit?: string;
  physicsRadius?: number;
  physicsColor?: string;
  physicsTopic?: string;
  physicsMetal?: string;
  physicsMedium?: string;
  physicsDielectric?: number;
  physicsSphereType?: "Conducting" | "Non-Conducting";
  opticsMirrorView?: "Front View" | "Side View";
  opticsLensView?: "Front View" | "Side View";
  physicsObservationDistance?: number;
  opticsLaserMode?: "Off" | "Red" | "Green" | "White" | "Both";
  opticsGreenLaserAngle?: number;
  opticsStandLength?: number;
  opticsStatus?: "Active" | "Unactive";
  opticsRadiusValue?: number;
  opticsRadiusUnit?: "m" | "cm";
  physicsFluxSurfaceType?: "Triangular" | "Disc" | "Cylindrical" | "Spherical";
  physicsFluxArea?: number;
  physicsFluxAngle?: number;
  physicsFluxSurfaceSize?: number;
  physicsChargeMethod?: string;
  physicsEarthing?: string;
  physicsWaveDirection?: "outward" | "inward";
  physicsWaveTick?: number;
  physicsInductionSourceId?: string;
  physicsInductionPendingCharge?: number;
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
  color?: string;
}


export interface ConnectingFrom {
  compId: string;
  portIndex: number;
  draftMidPoints?: WirePoint[];
}

export interface Drawing {
  id: string;
  points: number[]; // Flat array of [x, y, x, y, ...]
  color: string;
  width: number;
}

export interface HistoryEntry {
  components: PlacedComponent[];
  wires: Wire[];
  notes: Note[];
  drawings: Drawing[];
}
