"use client"
import Konva from "konva";
import { COLORS, PIN_RADIUS, LED_COLOR_OPTIONS } from "@/simulator/constants/circuit";
import { useImage } from "@/simulator/hooks/useImage";
import { ConnectingFrom, PlacedComponent } from "@/simulator/types/circuit";
import { computeSmartLayout, getInkBounds } from "@/simulator/utils/imageUtils";
import { SimulatedComponentState } from "@/simulator/utils/simulation";
import { getComponentSnapOffset } from "@/simulator/utils/snapUtils";
import { useEffect, useMemo, useState } from "react";
import { Group, Circle, Image as KonvaImage, Text, Rect as KonvaRect, Path } from "react-konva";
import { getMicrobitDataUrls } from "@/simulator/constants/staticComponents";

const HIT_RADIUS = PIN_RADIUS + 8;
const DISPLAY_TARGET = 110;
const ANIMATED_OUTPUT_COMPONENTS = new Set(["ac_bulb", "dc_motor", "gearmotor", "vibration_motor", "microbit"]);

function resolveFullImageLayout(
  img: HTMLImageElement,
  relativePins: { relX: number; relY: number }[]
): { w: number; h: number; crop?: { x: number; y: number; width: number; height: number }; pins: { x: number; y: number }[] } {
  const nw = img.naturalWidth || 100;
  const nh = img.naturalHeight || 100;
  const scale = DISPLAY_TARGET / Math.max(nw, nh);
  const w = Math.round(nw * scale);
  const h = Math.round(nh * scale);
  const pins = relativePins.map((p) => ({ x: p.relX * w, y: p.relY * h }));

  return { w, h, pins };
}

interface ComponentNodeProps {
  comp: PlacedComponent;
  imageSrc?: string;
  litImageSrc?: string;
  connectingFrom: ConnectingFrom | null;
  simulationState?: SimulatedComponentState;
  blinkToggle?: boolean;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onSelect: (compId: string, multi: boolean) => void;
  onSizeResolved?: (id: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => void;
  allComponents: PlacedComponent[];
}

const ComponentNode = ({
  comp,
  imageSrc,
  litImageSrc,
  connectingFrom,
  simulationState,
  blinkToggle,
  onDragMove,
  onDragEnd,
  onPinClick,
  onSelect,
  onSizeResolved,
  allComponents,
}: ComponentNodeProps) => {
  const isLitBase = (comp.componentId.startsWith("led") || ANIMATED_OUTPUT_COMPONENTS.has(comp.componentId)) && !!simulationState?.lit;
  const isBlinking = comp.isBlinking;
  const isLit = isLitBase && (!isBlinking || !!blinkToggle);

  let activeImageSrc = imageSrc;
  let activeLitSrc = litImageSrc;

  if (comp.componentId === "microbit") {
    const urls = getMicrobitDataUrls(comp.ledColor || "black");
    activeImageSrc = urls.imageSrc;
    activeLitSrc = urls.litImageSrc;
  }

  const resolvedLitSrc = activeLitSrc ?? comp.litImageSrc;
  let activeSrc = (isLit && resolvedLitSrc) ? resolvedLitSrc : (activeImageSrc ?? "");

  // Hide the static gear in the SVG when we're going to overlay a live one
  if (isLit && comp.componentId === "dc_motor" && activeSrc.startsWith("data:image/svg+xml")) {
    const decoded = decodeURIComponent(activeSrc.replace("data:image/svg+xml;charset=utf-8,", ""));
    const modified = decoded.replace('id="gear_group"', 'id="gear_group" style="display:none;opacity:0"');
    activeSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(modified)}`;
  }

  const img = useImage(activeSrc);

  const layout = useMemo(() => {
    if (!img) return null;

    const relativePins = comp.relativePins ?? [];
    const isSvgSource =
      activeSrc.startsWith("data:image/svg+xml") ||
      activeSrc.toLowerCase().endsWith(".svg");

    if (isSvgSource) {
      return resolveFullImageLayout(img, relativePins);
    }

    const bounds = getInkBounds(img);
    if (bounds) {
      const smart = computeSmartLayout(bounds, relativePins, DISPLAY_TARGET);
      const resolvedPorts = relativePins.map((p) => smart.mapPin(p.relX, p.relY));

      return {
        w: smart.displayW,
        h: smart.displayH,
        crop: smart.crop,
        pins: resolvedPorts,
      };
    }

    return resolveFullImageLayout(img, relativePins);
  }, [img, comp.relativePins, activeSrc]);

  useEffect(() => {
    if (layout) {
      onSizeResolved?.(comp.id, layout.pins, layout.w, layout.h);
    }
  }, [comp.id, layout, onSizeResolved]);

  const w = layout?.w ?? 100;
  const h = layout?.h ?? 100;
  const crop = layout?.crop;
  const visualPins = layout?.pins ?? comp.ports ?? [];

  const isConnecting = connectingFrom !== null;
  const isThisComponentConnecting = isConnecting && connectingFrom?.compId === comp.id;

    const isBurned = simulationState?.isBurned;
    const brightness = simulationState?.brightness ?? 0;
    const isShortCircuit = simulationState?.isShortCircuit;

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
        {/* Inner transformation group for rotation and flipping around center */}
        <Group
          x={w / 2}
          y={h / 2}
          offsetX={w / 2}
          offsetY={h / 2}
          rotation={comp.rotation}
          scaleX={comp.mirrored ? -1 : 1}
          scaleY={comp.flipped ? -1 : 1}
        >
          {img && (
            <KonvaImage 
              image={img} 
              width={w} 
              height={h} 
              {...(crop ? { crop } : {})}
              opacity={isBurned ? 0.4 : 1}
            />
          )}


          {/* Visual Effects (Glow/Animations) driven by AI/Simulation state */}
          {(isLit || isBurned) && (() => {
            if (isBurned) {
              return <SmokeAnimation x={w / 2} y={h * 0.3} />;
            }

            // If it's a motor (CW/CCW rotation)
            const isMotor = comp.componentId.toLowerCase().includes('motor');
            if (isMotor) {
               return <RotatingGear x={w / 2} y={h / 2} direction={simulationState?.direction ?? 1} />;
            }

            // Default glow for LEDs and bulbs
            const ledOpt = LED_COLOR_OPTIONS.find(o => o.value === comp.ledColor) || LED_COLOR_OPTIONS[0];
            const colorHex = comp.componentId === 'ac_bulb' ? '#FBC02D' : ledOpt.hex;
            const glowY = comp.componentId === 'ac_bulb' ? h * 0.45 : h * 0.38;
            const glowRadius = comp.componentId === 'ac_bulb' ? Math.max(w, h) * 0.45 : Math.max(w, h) * 0.38;

            return (
              <>
                <Circle
                  x={w / 2}
                  y={glowY}
                  radius={glowRadius}
                  fill={`${colorHex}30`}
                  shadowColor={colorHex}
                  shadowBlur={32 * brightness}
                  opacity={brightness}
                  listening={false}
                />
                <Circle
                  x={w / 2}
                  y={glowY}
                  radius={glowRadius * 0.6}
                  fill={`${colorHex}55`}
                  opacity={brightness}
                  listening={false}
                />
              </>
            );
          })()}

          {/* Short Circuit Spark */}
          {isShortCircuit && <SparkEffect x={w / 2} y={h / 2} />}

          {visualPins.map((pin, i) => (
            <PinDot
              key={i}
              x={pin.x}
              y={pin.y}
              index={i}
              name={comp.relativePins?.[i]?.name}
              isActive={connectingFrom?.compId === comp.id && connectingFrom?.portIndex === i}
              isAvailable={isConnecting && !isThisComponentConnecting}
              onClick={() => onPinClick(comp.id, i)}
            />
          ))}
        </Group>
      </Group>
    );
  };

  const SmokeAnimation = ({ x, y }: { x: number; y: number }) => {
    const [offset, setOffset] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => setOffset(o => (o + 1) % 40), 50);
      return () => clearInterval(interval);
    }, []);

    return (
      <Group x={x} y={y}>
        {[1, 2, 3].map(i => (
          <Circle
            key={i}
            x={(i - 2) * 5}
            y={-((offset + i * 15) % 40)}
            radius={2 + ((offset + i * 15) % 40) / 10}
            fill="#555555"
            opacity={1 - ((offset + i * 15) % 40) / 40}
          />
        ))}
      </Group>
    );
  };

  const SparkEffect = ({ x, y }: { x: number; y: number }) => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
      const interval = setInterval(() => setVisible(v => !v), 100);
      return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    return (
      <Group x={x} y={y}>
        {[0, 72, 144, 216, 288].map(angle => (
          <Circle
            key={angle}
            x={Math.cos(angle) * 15}
            y={Math.sin(angle) * 15}
            radius={2}
            fill="#ffff00"
            shadowColor="#ffaa00"
            shadowBlur={5}
          />
        ))}
      </Group>
    );
  };


const RotatingGear = ({ x, y, direction }: { x: number; y: number; direction: number }) => {
  const groupRef = useMemo(() => ({ current: null as any }), []);

  useEffect(() => {
    const anim = new Konva.Animation((frame) => {
      if (groupRef.current && frame) {
        groupRef.current.rotation((frame.time * 0.2 * direction) % 360);
      }
    }, groupRef.current?.getLayer());
    
    anim.start();
    return () => { anim.stop(); };
  }, [direction]);

  return (
    <Group x={x} y={y} ref={groupRef} shadowColor="#000" shadowBlur={4} shadowOpacity={0.2} shadowOffset={{ x: 1, y: 1 }}>
      {/* 12 Tapered Teeth */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Group key={i} rotation={i * 30}>
          <Path 
            data="M -4 -18 L 4 -18 L 3 -10 L -3 -10 Z"
            fill="#f1c40f"
            stroke="#d4ac0d"
            strokeWidth={0.5}
            y={-2} // Slight outward shift
          />
        </Group>
      ))}
      
      {/* Main Gear Body with Gradient */}
      <Circle 
        radius={11} 
        fillRadialGradientStartPoint={{ x: -2, y: -2 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={11}
        fillRadialGradientColorStops={[0, '#f1c40f', 1, '#d4ac0d']}
        stroke="#b7950b"
        strokeWidth={0.5}
      />
      
      {/* Center Detail */}
      <Circle radius={6} fill="#b7950b" opacity={0.6} />
      <Circle radius={3} fill="#7d6608" />
    </Group>
  );
};

const PinDot = ({
  x,
  y,
  index,
  name,
  isActive,
  isAvailable,
  onClick,
}: {
  x: number;
  y: number;
  index: number;
  name?: string;
  isActive: boolean;
  isAvailable: boolean;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const showVisual = hovered || isActive || isAvailable;
  const displayName = name ?? `Pin ${index + 1}`;

  return (
    <Group x={x} y={y}>
      {/* Hit Area */}
      <Circle
        radius={HIT_RADIUS}
        fill="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => {
          e.cancelBubble = true;
          onClick();
        }}
      />

      {/* Red Square Pin (from reference) */}
      <Group visible={showVisual} listening={false}>
        <KonvaRect
          x={-5}
          y={-5}
          width={10}
          height={10}
          fill="#ff0000"
          stroke="#000000"
          strokeWidth={2}
        />
        
        {/* Tooltip (from reference) */}
        {hovered && (
          <Group y={-25} x={-40}>
            {/* Tooltip Background */}
            <KonvaRect
              width={80}
              height={18}
              fill="#34495E"
              cornerRadius={4}
              shadowBlur={4}
              shadowOpacity={0.3}
            />
            {/* Tooltip Arrow */}
            <Path 
              data="M 35 18 L 40 23 L 45 18 Z" 
              fill="#34495E" 
            />
            <Text
              text={displayName}
              width={80}
              height={18}
              fontSize={10}
              fontStyle="bold"
              fill="#FFFFFF"
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )}
      </Group>
    </Group>
  );
};

export default ComponentNode;
