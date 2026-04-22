"use client";

import { memo } from "react";
import ledSVG from "./LED3D";
import type { LEDComponent, PinDefinition } from "./types";
import SvgComponentNode from "./SvgComponentNode";

const LED_WIDTH = 50;
const LED_HEIGHT = 80;

export const LED_PIN_DEFS: readonly PinDefinition[] = [
  { id: "anode", x: 17.5, y: 78 },
  { id: "cathode", x: 32.5, y: 78 },
] as const;

interface LEDKonvaProps {
  component: LEDComponent;
  onDragMove: (id: string, x: number, y: number) => void;
  onPinClick?: (componentId: string, pinId: string) => void;
}

const LEDKonva = ({ component, onDragMove, onPinClick }: LEDKonvaProps) => {
  return (
    <SvgComponentNode
      component={component}
      svgMarkup={ledSVG}
      width={LED_WIDTH}
      height={LED_HEIGHT}
      pins={LED_PIN_DEFS}
      onDragMove={onDragMove}
      onPinClick={onPinClick}
    />
  );
};

export default memo(LEDKonva);
