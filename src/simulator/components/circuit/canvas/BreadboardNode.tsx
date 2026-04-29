"use client"
import { useState } from "react";
import { Group, Rect, Circle, Line, Text } from "react-konva";
import { COLORS, PIN_RADIUS } from "@/simulator/constants/circuit";
import { ConnectingFrom, PlacedComponent } from "@/simulator/types/circuit";
import { getComponentSnapOffset } from "@/simulator/utils/snapUtils";

// ── Layout constants (matching staticComponents.ts) ───────────────────────────
const SPACING         = 20;
const PAD_X           = 24;
const PAD_TOP         = 28;
const RAIL_DIST       = 18;
const RAIL_TO_GRID    = 34;
const GAP_Y           = 24;
const ROWS            = 30;

const TOP_N_Y      = PAD_TOP;
const TOP_P_Y      = TOP_N_Y + RAIL_DIST;
const GRID_TOP_Y   = TOP_P_Y + RAIL_TO_GRID;
const GRID_BOT_Y   = GRID_TOP_Y + 4 * SPACING + GAP_Y;
const BOT_N_Y      = GRID_BOT_Y + 4 * SPACING + RAIL_TO_GRID;
const BOT_P_Y      = BOT_N_Y + RAIL_DIST;

const BOARD_W = PAD_X * 2 + (ROWS - 1) * SPACING;
const BOARD_H = BOT_P_Y + PAD_TOP;

const HIT_R   = PIN_RADIUS + 6;

interface Hole {
  id: string;
  lx: number;
  ly: number;
  type: string;
}

function buildHoles(): Hole[] {
  const holes: Hole[] = [];

  for (let r = 1; r <= ROWS; r++) {
    const lx = PAD_X + (r - 1) * SPACING;

    // Power Rails
    holes.push({ id: `Top +${r}`, lx, ly: TOP_P_Y, type: 'TP' });
    holes.push({ id: `Top -${r}`, lx, ly: TOP_N_Y, type: 'TN' });

    // Grid Top (f-j in image)
    ["f","g","h","i","j"].forEach((col, ci) => {
      holes.push({ id: `${col}${r}`, lx, ly: GRID_TOP_Y + ci * SPACING, type: `T${r}` });
    });

    // Grid Bottom (a-e in image)
    ["a","b","c","d","e"].forEach((col, ci) => {
      holes.push({ id: `${col}${r}`, lx, ly: GRID_BOT_Y + ci * SPACING, type: `B${r}` });
    });

    // Bottom Power Rails
    holes.push({ id: `Bot -${r}`, lx, ly: BOT_N_Y, type: 'BN' });
    holes.push({ id: `Bot +${r}`, lx, ly: BOT_P_Y, type: 'BP' });
  }
  return holes;
}

const HOLES = buildHoles();

interface Props {
  comp: PlacedComponent;
  isSelected: boolean;
  connectingFrom: ConnectingFrom | null;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onSelect: (compId: string, multi: boolean) => void;
  allComponents: PlacedComponent[];
}

const BreadboardNode = ({
  comp, isSelected, connectingFrom, onDragMove, onDragEnd, onPinClick, onSelect, allComponents,
}: Props) => {
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);

  const hoveredStripType = hoveredPin !== null ? HOLES[hoveredPin].type : null;
  const stripHoles = hoveredStripType ? HOLES.filter(h => h.type === hoveredStripType) : [];

  const isConnecting = connectingFrom !== null;
  const isThisComp   = connectingFrom?.compId === comp.id;

  return (
    <Group
      x={comp.x}
      y={comp.y}
      draggable={!isConnecting}
      onDragMove={(e) => {
        const x = e.target.x();
        const y = e.target.y();
        const snap = getComponentSnapOffset(comp, x, y, allComponents);
        const finalX = snap ? x + snap.dx : x;
        const finalY = snap ? y + snap.dy : y;
        
        if (snap) {
          e.target.x(finalX);
          e.target.y(finalY);
        }
        
        onDragMove?.(comp.id, finalX, finalY);
      }}
      onDragEnd={(e) => {
        const x = e.target.x();
        const y = e.target.y();
        const snap = getComponentSnapOffset(comp, x, y, allComponents);
        const finalX = snap ? x + snap.dx : x;
        const finalY = snap ? y + snap.dy : y;
        onDragEnd(comp.id, finalX, finalY);
      }}
      onClick={(e) => {
        if (!isConnecting) {
          e.cancelBubble = true;
          onSelect(comp.id, e.evt.ctrlKey || e.evt.metaKey);
        }
      }}
    >
      <Group
        x={BOARD_W / 2}
        y={BOARD_H / 2}
        offsetX={BOARD_W / 2}
        offsetY={BOARD_H / 2}
        rotation={comp.rotation}
        scaleX={comp.mirrored ? -1 : 1}
        scaleY={comp.flipped ? -1 : 1}
      >
      {/* Background Body */}
      <Rect
        x={0} y={0} width={BOARD_W} height={BOARD_H}
        fill="#DDDDDD" 
        stroke={isSelected ? COLORS.selectionRing : "#CCCCCC"} 
        strokeWidth={isSelected ? 6 : 1} 
        cornerRadius={4}
        shadowColor="#000" 
        shadowBlur={isSelected ? 0 : 10} 
        shadowOpacity={isSelected ? 0 : 0.15} 
        shadowOffsetY={isSelected ? 0 : 4}
        shadowOffsetX={0}
      />

      {/* Power Rail Stripes */}
      <Rect x={PAD_X - 10} y={TOP_P_Y - 4} width={BOARD_W - (PAD_X - 10) * 2} height={RAIL_DIST + 8} fill="#E8E8E8" cornerRadius={2} />
      <Rect x={PAD_X - 10} y={BOT_N_Y - 4} width={BOARD_W - (PAD_X - 10) * 2} height={RAIL_DIST + 8} fill="#E8E8E8" cornerRadius={2} />

      {/* Center DIP Gap Stripe */}
      <Rect x={PAD_X - 10} y={GRID_TOP_Y + 4 * SPACING + 10} width={BOARD_W - (PAD_X - 10) * 2} height={GAP_Y} fill="#D0D0D0" cornerRadius={2} />

      {/* Red/Blue rail lines */}
      <Line points={[PAD_X, TOP_N_Y - 10, BOARD_W - PAD_X, TOP_N_Y - 10]} stroke="#2980B9" strokeWidth={1} opacity={0.5} />
      <Line points={[PAD_X, TOP_P_Y + 10, BOARD_W - PAD_X, TOP_P_Y + 10]} stroke="#E74C3C" strokeWidth={1} opacity={0.5} />
      <Line points={[PAD_X, BOT_N_Y - 10, BOARD_W - PAD_X, BOT_N_Y - 10]} stroke="#2980B9" strokeWidth={1} opacity={0.5} />
      <Line points={[PAD_X, BOT_P_Y + 10, BOARD_W - PAD_X, BOT_P_Y + 10]} stroke="#E74C3C" strokeWidth={1} opacity={0.5} />

      {/* +/- Labels */}
      <Text text="-" x={8} y={TOP_N_Y - 4} fontSize={12} fill="#2980B9" fontStyle="bold" />
      <Text text="+" x={8} y={TOP_P_Y - 4} fontSize={12} fill="#E74C3C" fontStyle="bold" />
      <Text text="-" x={8} y={BOT_N_Y - 4} fontSize={12} fill="#2980B9" fontStyle="bold" />
      <Text text="+" x={8} y={BOT_P_Y - 4} fontSize={12} fill="#E74C3C" fontStyle="bold" />
      
      <Text text="-" x={BOARD_W - 16} y={TOP_N_Y - 4} fontSize={12} fill="#2980B9" fontStyle="bold" />
      <Text text="+" x={BOARD_W - 16} y={TOP_P_Y - 4} fontSize={12} fill="#E74C3C" fontStyle="bold" />
      <Text text="-" x={BOARD_W - 16} y={BOT_N_Y - 4} fontSize={12} fill="#2980B9" fontStyle="bold" />
      <Text text="+" x={BOARD_W - 16} y={BOT_P_Y - 4} fontSize={12} fill="#E74C3C" fontStyle="bold" />

      {/* Column number labels (1, 5, 10...) */}
      {Array.from({ length: ROWS }, (_, i) => (i + 1) % 5 === 0 || i === 0 ? (
        <Group key={`col-grp-${i}`}>
          {/* Top numbers */}
          <Text
            text={String(i + 1)}
            x={PAD_X + (i * SPACING) - 4}
            y={GRID_TOP_Y - 14}
            fontSize={8}
            fill="#999999"
            align="center"
          />
          {/* Bottom numbers (shown in image) */}
          <Text
            text={String(i + 1)}
            x={PAD_X + (i * SPACING) - 4}
            y={GRID_BOT_Y - 14}
            fontSize={8}
            fill="#999999"
            align="center"
          />
        </Group>
      ) : null)}

      {/* Row letter labels (f-j, a-e) */}
      {["f","g","h","i","j"].map((col, ci) => (
        <Text key={`rl-t-${col}`} text={col} x={PAD_X - 16} y={GRID_TOP_Y + ci * SPACING - 4} fontSize={9} fill="#777777" fontStyle="italic" />
      ))}
      {["a","b","c","d","e"].map((col, ci) => (
        <Text key={`rl-b-${col}`} text={col} x={PAD_X - 16} y={GRID_BOT_Y + ci * SPACING - 4} fontSize={9} fill="#777777" fontStyle="italic" />
      ))}
      
      {["f","g","h","i","j"].map((col, ci) => (
        <Text key={`rl-tr-${col}`} text={col} x={BOARD_W - PAD_X + 6} y={GRID_TOP_Y + ci * SPACING - 4} fontSize={9} fill="#777777" fontStyle="italic" />
      ))}
      {["a","b","c","d","e"].map((col, ci) => (
        <Text key={`rl-br-${col}`} text={col} x={BOARD_W - PAD_X + 6} y={GRID_BOT_Y + ci * SPACING - 4} fontSize={9} fill="#777777" fontStyle="italic" />
      ))}

      {/* Conductive Strip Highlight (The Green Path) */}
      {stripHoles.length > 1 && (
        <>
          <Line
            points={
              hoveredStripType?.startsWith('T') || hoveredStripType?.startsWith('B')
                ? [stripHoles[0].lx, stripHoles[0].ly, stripHoles[stripHoles.length - 1].lx, stripHoles[stripHoles.length - 1].ly]
                : [stripHoles[0].lx, stripHoles[0].ly, stripHoles[stripHoles.length - 1].lx, stripHoles[stripHoles.length - 1].ly]
            }
            stroke="#4ade80"
            strokeWidth={2}
            opacity={0.8}
            lineCap="round"
          />
          {stripHoles.map((h) => (
            <Circle
              key={`h-${h.id}`}
              x={h.lx}
              y={h.ly}
              radius={6}
              stroke="#4ade80"
              strokeWidth={1.5}
              fill="transparent"
              listening={false}
            />
          ))}
        </>
      )}

      {/* Holes */}
      {HOLES.map((hole, i) => {
        const isActive    = connectingFrom?.compId === comp.id && connectingFrom?.portIndex === i;
        const isAvailable = isConnecting && !isThisComp;
        const isHovered   = hoveredPin === i;

        return (
          <Group key={hole.id} x={hole.lx} y={hole.ly}>
            <Circle
              radius={HIT_R}
              fill="transparent"
              onMouseEnter={() => setHoveredPin(i)}
              onMouseLeave={() => setHoveredPin(null)}
              onClick={(e) => { e.cancelBubble = true; onPinClick(comp.id, i); }}
            />
            <Circle
              radius={4}
              fill={
                isActive    ? COLORS.pinActiveStroke :
                isHovered   ? "#CCCCCC"              :
                isAvailable ? "#4ade80"              : "#333333"
              }
              stroke={isActive ? COLORS.pinActiveStroke : "#111111"}
              strokeWidth={1}
              shadowColor={isActive || (isAvailable && isHovered) ? COLORS.wireActive : undefined}
              shadowBlur={isActive  || (isAvailable && isHovered) ? 8 : 0}
              listening={false}
            />
            {/* Inner detail */}
            <Circle radius={1.5} fill="#000000" opacity={0.4} listening={false} />

            {/* Hover Indicator: Red Square (from image) */}
            {isHovered && (
              <Group listening={false}>
                <Rect
                  x={-6}
                  y={-6}
                  width={12}
                  height={12}
                  fill="#ef4444"
                  stroke="#000000"
                  strokeWidth={1.5}
                />
                <Text
                  text={hole.id}
                  x={12}
                  y={-15}
                  fontSize={10}
                  fill="#FFFFFF"
                  fontStyle="bold"
                  padding={2}
                  backgroundColor="#333333"
                />
              </Group>
            )}
          </Group>
        );
      })}

      {/* Component Name */}
      <Text
        text={comp.name}
        x={BOARD_W / 2}
        y={BOARD_H + 10}
        fontSize={12}
        fill={COLORS.label}
        align="center"
        offsetX={BOARD_W / 2}
        fontStyle="bold"
      />
      </Group>
    </Group>
  );
};

export { BOARD_W, BOARD_H };
export default BreadboardNode;
