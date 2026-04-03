"use client"
import { COLORS, PIN_RADIUS } from "@/simulator/constants/circuit";
import { IconComponent, svgToDataUrl } from "@/simulator/constants/components";
import { useImage } from "@/simulator/hooks/useImage";
import { ConnectingFrom, PlacedComponent } from "@/simulator/types/circuit";
import { useState, useMemo } from "react";
import { Group, Line, Circle, Rect, Image as KonvaImage, Text } from "react-konva";

const HIT_RADIUS = PIN_RADIUS + 8;

const COMP_SIZE: Record<string, { w: number; h: number }> = {
  resistor: { w: 96, h: 48 },
  capacitor: { w: 56, h: 84 },
  led:       { w: 56, h: 84 },
  battery9v: { w: 56, h: 90 },
  batteryaa: { w: 112, h: 42 },
  diode:     { w: 96,  h: 40 },
  ledrgb:    { w: 56,  h: 90 },
  motordc:     { w: 112, h: 70 },
  pushbutton:   { w: 70,  h: 84 },
  slideswitch:  { w: 112, h: 72 },
};
const DEFAULT_SIZE = { w: 80, h: 48 };

interface ComponentNodeProps {
  comp: PlacedComponent;
  icon: IconComponent;
  isSelected: boolean;
  connectingFrom: ConnectingFrom | null;
  onDragEnd: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onSelect: (compId: string, multi: boolean) => void;
}

const ComponentNode = ({
  comp,
  icon,
  isSelected,
  connectingFrom,
  onDragEnd,
  onPinClick,
  onSelect,
}: ComponentNodeProps) => {
  const { w, h } = COMP_SIZE[comp.componentId] ?? DEFAULT_SIZE;
  const dataUrl = useMemo(() => svgToDataUrl(icon, w, h), [icon, w, h]);
  const img = useImage(dataUrl);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  
  // Show which pins are available for connection
  const isConnecting = connectingFrom !== null;
  const isThisComponentConnecting = isConnecting && connectingFrom?.compId === comp.id;

  return (
    <Group
      x={comp.x}
      y={comp.y}
      rotation={comp.rotation}
      scaleX={comp.mirrored ? -1 : 1}
      draggable={!isConnecting}
      onDragEnd={(e) => onDragEnd(comp.id, e.target.x(), e.target.y())}
      onClick={(e) => {
        e.cancelBubble = true;
        if (!isConnecting) {
          onSelect(comp.id, e.evt.ctrlKey || e.evt.metaKey);
        }
      }}
    >
      {isSelected && (
        <Line
          points={[-4, -4, w + 4, -4, w + 4, h + 4, -4, h + 4, -4, -4]}
          stroke={COLORS.selectionRing}
          strokeWidth={2}
          dash={[6, 3]}
        />
      )}

      {img && <KonvaImage image={img} width={w} height={h} />}

      {comp.ports.map((pin, i) => {
        const isActive = connectingFrom?.compId === comp.id && connectingFrom?.portIndex === i;
        const isHovered = hoveredPin === i;
        const isAvailableForConnection = isConnecting && !isThisComponentConnecting;
        
        return (
          <Group key={i} x={pin.x} y={pin.y}>
            {/* Invisible larger hit area */}
            <Circle
              radius={HIT_RADIUS}
              fill="transparent"
              onMouseEnter={() => setHoveredPin(i)}
              onMouseLeave={() => setHoveredPin(null)}
              onClick={(e) => {
                e.cancelBubble = true;
                onPinClick(comp.id, i);
              }}
              style={{ cursor: "pointer" }}
            />
            {(isConnecting || isHovered) && (
              <Rect
                x={-5} y={-5} width={10} height={10} cornerRadius={1}
                fill="#E74C3C"
                stroke="#000000"
                strokeWidth={2}
                shadowColor={isActive || (isAvailableForConnection && isHovered) ? COLORS.wireActive : undefined}
                shadowBlur={isActive || (isAvailableForConnection && isHovered) ? 6 : 0}
                listening={false}
              />
            )}
            {isHovered && (
              <Text
                text={`Pin ${i + 1}`}
                x={PIN_RADIUS + 3}
                y={-6}
                fontSize={9}
                fill={COLORS.label}
              />
            )}
          </Group>
        );
      })}

      <Text
        text={comp.name}
        x={w / 2}
        y={h + 4}
        fontSize={10}
        fill={COLORS.label}
        align="center"
        offsetX={w / 2}
      />
    </Group>
  );
};

export default ComponentNode;
