"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layer, Stage } from "react-konva";
import Breadboard from "./Breadboard";
import LEDKonva, { LED_PIN_DEFS } from "./Led";
import type { Hole, LEDComponent } from "./types";

const HOLE_SPACING = 20;
const BREADBOARD_OFFSET_X = 50;
const BREADBOARD_OFFSET_Y = 50;
const PIN_SNAP_DISTANCE = 12;
const DEFAULT_STAGE_SIZE = { width: 1200, height: 800 };

function generateHoles(): Hole[] {
  const holes: Hole[] = [];

  for (let r = 1; r <= 20; r++) {
    ["A", "B", "C", "D", "E"].forEach((col, i) => {
      holes.push({
        id: `${col}${r}`,
        x: i * HOLE_SPACING,
        y: r * HOLE_SPACING,
        group: `L${r}`,
      });
    });

    ["F", "G", "H", "I", "J"].forEach((col, i) => {
      holes.push({
        id: `${col}${r}`,
        x: (i + 6) * HOLE_SPACING,
        y: r * HOLE_SPACING,
        group: `R${r}`,
      });
    });
  }

  return holes;
}

function findNearestHole(x: number, y: number, holes: Hole[]) {
  let best: { hole: Hole; distance: number } | null = null;

  for (const hole of holes) {
    const worldX = BREADBOARD_OFFSET_X + hole.x;
    const worldY = BREADBOARD_OFFSET_Y + hole.y;
    const distance = Math.hypot(worldX - x, worldY - y);

    if (!best || distance < best.distance) {
      best = { hole, distance };
    }
  }

  return best && best.distance <= PIN_SNAP_DISTANCE ? best : null;
}

export default function CanvasBoard() {
  const holes = useMemo(() => generateHoles(), []);
  const [stageSize, setStageSize] = useState(DEFAULT_STAGE_SIZE);

  const [components, setComponents] = useState<LEDComponent[]>([
    { id: "led1", type: "LED", x: 200, y: 200 },
  ]);

  useEffect(() => {
    const updateStageSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateStageSize();
    window.addEventListener("resize", updateStageSize);

    return () => {
      window.removeEventListener("resize", updateStageSize);
    };
  }, []);

  const handleLEDDrag = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) =>
      prev.map((component) => {
        if (component.id !== id) return component;

        let nextX = x;
        let nextY = y;
        let bestSnap: { offsetX: number; offsetY: number; distance: number } | null = null;

        for (const pin of LED_PIN_DEFS) {
          const pinX = x + pin.x;
          const pinY = y + pin.y;
          const nearest = findNearestHole(pinX, pinY, holes);

          if (!nearest) continue;

          const targetX = BREADBOARD_OFFSET_X + nearest.hole.x;
          const targetY = BREADBOARD_OFFSET_Y + nearest.hole.y;
          const offsetX = targetX - pinX;
          const offsetY = targetY - pinY;

          if (!bestSnap || nearest.distance < bestSnap.distance) {
            bestSnap = { offsetX, offsetY, distance: nearest.distance };
          }
        }

        if (bestSnap) {
          nextX += bestSnap.offsetX;
          nextY += bestSnap.offsetY;
        }

        return { ...component, x: nextX, y: nextY };
      })
    );
  }, [holes]);

  const handlePinClick = useCallback((componentId: string, pinId: string) => {
    console.log("Pin clicked:", { componentId, pinId });
  }, []);

  return (
    <Stage width={stageSize.width} height={stageSize.height}>
      <Layer>
        <Breadboard holes={holes} x={BREADBOARD_OFFSET_X} y={BREADBOARD_OFFSET_Y} />

        {components.map((component) => (
          <LEDKonva
            key={component.id}
            component={component}
            onDragMove={handleLEDDrag}
            onPinClick={handlePinClick}
          />
        ))}
      </Layer>
    </Stage>
  );
}
