import { memo } from "react";
import { Circle, Group } from "react-konva";
import type { Hole } from "./types";

interface BreadboardProps {
  holes: Hole[];
  x?: number;
  y?: number;
}

const Breadboard = ({ holes, x = 50, y = 50 }: BreadboardProps) => {
  return (
    <Group x={x} y={y} listening={false}>
      {holes.map((hole) => (
        <Circle
          key={hole.id}
          x={hole.x}
          y={hole.y}
          radius={3}
          fill="#444"
        />
      ))}
    </Group>
  );
};

export default memo(Breadboard);
