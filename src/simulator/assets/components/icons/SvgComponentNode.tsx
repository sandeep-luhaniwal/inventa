"use client";

import { memo } from "react";
import { Circle, Group, Image as KonvaImage } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { CircuitComponentBase, PinDefinition } from "./types";
import { useSvgImage } from "./useSvgImage";

interface SvgComponentNodeProps<TComponent extends CircuitComponentBase> {
  component: TComponent;
  svgMarkup: string;
  width: number;
  height: number;
  pins: readonly PinDefinition[];
  pinRadius?: number;
  draggable?: boolean;
  onDragMove: (id: string, x: number, y: number) => void;
  onPinClick?: (componentId: string, pinId: string) => void;
}

function SvgComponentNodeInner<TComponent extends CircuitComponentBase>({
  component,
  svgMarkup,
  width,
  height,
  pins,
  pinRadius = 4,
  draggable = true,
  onDragMove,
  onPinClick,
}: SvgComponentNodeProps<TComponent>) {
  const image = useSvgImage(svgMarkup);

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onDragMove(component.id, e.target.x(), e.target.y());
  };

  return (
    <Group
      x={component.x}
      y={component.y}
      draggable={draggable}
      onDragEnd={handleDragEnd}
    >
      {image && (
        <KonvaImage
          image={image}
          width={width}
          height={height}
          listening={false}
        />
      )}

      {pins.map((pin) => (
        <Circle
          key={pin.id}
          x={pin.x}
          y={pin.y}
          radius={pinRadius}
          fill="#111"
          stroke="#fff"
          strokeWidth={1}
          onClick={() => onPinClick?.(component.id, pin.id)}
        />
      ))}
    </Group>
  );
}

const SvgComponentNode = memo(
  SvgComponentNodeInner
) as typeof SvgComponentNodeInner;

export default SvgComponentNode;
