export type Hole = {
  id: string;
  x: number;
  y: number;
  group: string;
};

export type CircuitComponentBase = {
  id: string;
  x: number;
  y: number;
};

export type LEDComponent = CircuitComponentBase & {
  type: "LED";
};

export type PinDefinition = {
  id: string;
  x: number;
  y: number;
};
