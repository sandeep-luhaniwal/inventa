"use client"
import { COLORS, GRID_STEP } from "@/simulator/constants/circuit";
import { Layer, Line } from "react-konva";

interface GridLayerProps {
  width: number;
  height: number;
}

const GridLayer = ({ width, height }: GridLayerProps) => {
  const lines: number[][] = [];
  for (let x = 0; x <= width; x += GRID_STEP) lines.push([x, 0, x, height]);
  for (let y = 0; y <= height; y += GRID_STEP) lines.push([0, y, width, y]);

  return (
    <Layer listening={false}>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} stroke={COLORS.grid} strokeWidth={0.5} />
      ))}
    </Layer>
  );
};

export default GridLayer;
