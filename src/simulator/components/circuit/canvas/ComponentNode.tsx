"use client"
import Konva from "konva";
import { PIN_RADIUS, LED_COLOR_OPTIONS } from "@/simulator/constants/circuit";
import { useImage } from "@/simulator/hooks/useImage";
import { ConnectingFrom, PlacedComponent } from "@/simulator/types/circuit";
import { computeSmartLayout, getInkBounds } from "@/simulator/utils/imageUtils";
import { SimulatedComponentState } from "@/simulator/utils/simulation";
import { getComponentSnapOffset } from "@/simulator/utils/snapUtils";
import { METAL_PHYSICS } from "@/simulator/constants/physics";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Circle, Image as KonvaImage, Text, Rect as KonvaRect, Path, Arrow } from "react-konva";
import { getMicrobitDataUrls } from "@/simulator/constants/staticComponents";

const HIT_RADIUS = PIN_RADIUS + 8;
const DISPLAY_TARGET = 110;
const ANIMATED_OUTPUT_COMPONENTS = new Set(["ac_bulb", "dc_motor", "gearmotor", "vibration_motor", "microbit", "bldc_motor", "ac_motor", "stepper_motor"]);
const SPHERE_CHARGE_WAVE_COLOR = "#ef4444";

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
  isSimulating?: boolean;
  simulationState?: SimulatedComponentState;
  blinkToggle?: boolean;
  onDragMove?: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onSelect: (compId: string, multi: boolean) => void;
  onSizeResolved?: (id: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => void;
  allComponents: PlacedComponent[];
}

function hasFrictionMethod(a: PlacedComponent, b: PlacedComponent) {
  return a.physicsChargeMethod === "Friction" || b.physicsChargeMethod === "Friction";
}

function findInductionSource(comp: PlacedComponent, allComponents: PlacedComponent[]) {
  if (
    !comp.componentId.startsWith("sphere_") ||
    comp.physicsChargeMethod !== "Induction" ||
    comp.physicsEarthing === "Earthed" ||
    Math.abs(comp.chargeValue ?? 0) > 0
  ) {
    return null;
  }

  const radiusA = (comp.width || 100) / 2;
  const centerA = { x: comp.x + radiusA, y: comp.y + radiusA };
  const inductionRange = radiusA + 180;

  return allComponents.reduce<{
    component: PlacedComponent;
    dx: number;
    dy: number;
    distance: number;
  } | null>((nearest, candidate) => {
    if (candidate.id === comp.id || !candidate.componentId.startsWith("sphere_")) return nearest;
    if (Math.abs(candidate.chargeValue ?? 0) === 0) return nearest;

    const radiusB = (candidate.width || 100) / 2;
    const centerB = { x: candidate.x + radiusB, y: candidate.y + radiusB };
    const dx = centerB.x - centerA.x;
    const dy = centerB.y - centerA.y;
    const distance = Math.hypot(dx, dy);
    if (distance > inductionRange) return nearest;
    if (nearest && nearest.distance <= distance) return nearest;

    return { component: candidate, dx, dy, distance };
  }, null);
}

const ComponentNode = ({
  comp,
  imageSrc,
  litImageSrc,
  connectingFrom,
  isSimulating,
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
  const isSphere = comp.componentId.startsWith("sphere_");
  const sphereMetal = METAL_PHYSICS[comp.physicsMetal || "Copper"] || METAL_PHYSICS.Copper;
  const sphereTextColor = getContrastTextColor(sphereMetal.colors.main);
  const isFrictionSphere = isSphere && comp.physicsChargeMethod === "Friction";
  const isEarthedSphere = isSphere && comp.physicsEarthing === "Earthed";
  const inductionSource = findInductionSource(comp, allComponents);
  const visibleChargeValue = (!isEarthedSphere && !inductionSource && comp.physicsInductionPendingCharge)
    ? comp.physicsInductionPendingCharge
    : (comp.chargeValue ?? 0);
  const sphereChargeMagnitude = Math.abs(visibleChargeValue);
  const isRubbing = isFrictionSphere && allComponents.some(c => {
    if (c.id === comp.id || !c.componentId.startsWith('sphere_')) return false;
    if (!hasFrictionMethod(comp, c)) return false;
    const rA = (comp.width || 100) / 2, rB = (c.width || 100) / 2;
    return Math.hypot((comp.x + rA) - (c.x + rB), (comp.y + rA) - (c.y + rB)) < rA + rB + 12;
  });
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const shakeRef = useRef<Konva.Animation | null>(null);
  useEffect(() => {
    if (!isRubbing) {
      shakeRef.current?.stop();
      shakeRef.current = null;
      requestAnimationFrame(() => setShakeOffset({ x: 0, y: 0 }));
      return;
    }
    const layer = groupRef.current?.getLayer();
    if (!layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = frame.time;
      setShakeOffset({
        x: Math.sin(t * 0.08) * 3,
        y: Math.cos(t * 0.11) * 2,
      });
    }, layer);
    shakeRef.current = anim;
    anim.start();
    return () => {
      anim.stop();
      shakeRef.current = null;
      requestAnimationFrame(() => setShakeOffset({ x: 0, y: 0 }));
    };
  }, [isRubbing]);
  const chargeWaveDirection = isSphere
    ? (isFrictionSphere
        ? (visibleChargeValue >= 0 ? "outward" : "inward")
        : comp.physicsWaveDirection ?? null)
    : null;
  const chargeWaveTick = isSphere ? (isFrictionSphere ? 1 : comp.physicsWaveTick ?? 0) : 0;

    const groupRef = useRef<Konva.Group>(null);
  const isBurned = simulationState?.isBurned;
    const brightness = simulationState?.brightness ?? 0;
    const isShortCircuit = simulationState?.isShortCircuit;

    return (
      <Group
        ref={groupRef}
        x={comp.x + shakeOffset.x}
        y={comp.y + shakeOffset.y}
        draggable={!isConnecting && !isSimulating}
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
          {isSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <SphereChargeWave
              key={`sphere-wave-${comp.id}-${chargeWaveTick}-${chargeWaveDirection ?? "idle"}`}
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.38}
              color={SPHERE_CHARGE_WAVE_COLOR}
              chargeMagnitude={sphereChargeMagnitude}
              direction={chargeWaveDirection}
              waveTick={chargeWaveTick}
            />
          )}

          {img && (
            <KonvaImage 
              image={img} 
              width={w} 
              height={h} 
              {...(crop ? { crop } : {})}
              opacity={isBurned ? 0.4 : 1}
            />
          )}
          {isSphere && (
            <SphereMetalBadge
              x={w / 2}
              y={h / 2}
              symbol={sphereMetal.symbol}
              workFunctionEv={sphereMetal.workFunctionEv}
              chargeValue={visibleChargeValue}
              chargeUnit={comp.chargeUnit}
              showChargeValue={
                comp.physicsChargeMethod === "Conduction" ||
                comp.physicsTopic === "Coulomb's Law"
              }
              textColor={sphereTextColor}
            />
          )}
          {isSphere && !isEarthedSphere && sphereChargeMagnitude > 0 && (
            <SphereChargeSigns
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.51}
              sign={visibleChargeValue >= 0 ? "+" : "-"}
              color={SPHERE_CHARGE_WAVE_COLOR}
            />
          )}
          {!isEarthedSphere && inductionSource && (
            <SphereInductionSigns
              x={w / 2}
              y={h / 2}
              radius={Math.max(w, h) * 0.51}
              sourceDx={inductionSource.dx}
              sourceDy={inductionSource.dy}
              sourceCharge={inductionSource.component.chargeValue ?? 0}
              color={SPHERE_CHARGE_WAVE_COLOR}
            />
          )}


          {/* Visual Effects (Glow/Animations) driven by AI/Simulation state */}
          {(isLit || isBurned) && (() => {
            if (isBurned) {
              return <SmokeAnimation x={w / 2} y={h * 0.3} />;
            }

            // If it's a standard DC motor (CW/CCW rotation with gear)
            if (comp.componentId === 'dc_motor') {
               return <RotatingGear x={w / 2} y={h / 2} direction={simulationState?.direction ?? 1} speed={brightness} />;
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
          {/* Friction Rubbing Glow */}
          {(() => {
            if (isFrictionSphere) {
              const radiusA = (comp.width || 100) / 2;
              const centerA = { x: comp.x + radiusA, y: comp.y + radiusA };

              const otherTouching = allComponents.find(c => {
                if (c.id === comp.id || !c.componentId.startsWith('sphere_') || c.physicsChargeMethod !== 'Friction') return false;
                const radiusB = (c.width || 100) / 2;
                const centerB = { x: c.x + radiusB, y: c.y + radiusB };
                return Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y) < (radiusA + radiusB);
              });

              if (otherTouching) {
                const radiusB = (otherTouching.width || 100) / 2;
                const centerB = { x: otherTouching.x + radiusB, y: otherTouching.y + radiusB };
                const dx = centerB.x - centerA.x;
                const dy = centerB.y - centerA.y;
                const angle = Math.atan2(dy, dx);

                return (
                  <Circle
                    x={(w / 2) + Math.cos(angle) * (radiusA - 5)}
                    y={(h / 2) + Math.sin(angle) * (radiusA - 5)}
                    radius={20}
                    fillRadialGradientStartRadius={0}
                    fillRadialGradientEndRadius={20}
                    fillRadialGradientColorStops={[0, 'rgba(255, 255, 150, 0.9)', 0.5, 'rgba(255, 220, 100, 0.4)', 1, 'transparent']}
                    shadowColor="#fbbf24"
                    shadowBlur={15}
                    opacity={0.8}
                    listening={false}
                  />
                );
              }
            }
            return null;
          })()}

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

const SphereMetalBadge = ({
  x,
  y,
  symbol,
  workFunctionEv,
  chargeValue,
  chargeUnit,
  showChargeValue,
  textColor,
}: {
  x: number;
  y: number;
  symbol: string;
  workFunctionEv: number;
  chargeValue: number;
  chargeUnit?: string;
  showChargeValue: boolean;
  textColor: string;
}) => {
  const displayValue = showChargeValue
    ? formatChargeValue(chargeValue, chargeUnit)
    : `${workFunctionEv.toFixed(2)} eV`;

  return (
    <Group x={x} y={y} listening={false}>
      <Text
        y={-10}
        width={40}
        x={-20}
        align="center"
        text={symbol}
        fontSize={16}
        fontStyle="bold"
        fill={textColor}
        shadowColor="rgba(15,23,42,0.55)"
        shadowBlur={4}
      />
      <Text
        y={6}
        width={54}
        x={-27}
        align="center"
        text={displayValue}
        fontSize={showChargeValue ? 10 : 8}
        fontStyle="bold"
        fill={textColor}
        shadowColor="rgba(15,23,42,0.55)"
        shadowBlur={4}
      />
    </Group>
  );
};

const formatChargeValue = (value: number, unit = "uC") => {
  const normalizedUnit = unit.replace("Âµ", "u").replace("µ", "u");
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  const sign = value > 0 ? "+" : "";
  return `${sign}${rounded} ${normalizedUnit}`;
};

const SphereChargeSigns = ({
  x,
  y,
  radius,
  sign,
  color,
}: {
  x: number;
  y: number;
  radius: number;
  sign: "+" | "-";
  color: string;
}) => {
  const angles = [-96, -64, -32, 0, 32, 64, 96, 128, 160, 192, 224, 256];

  return (
    <Group x={x} y={y} listening={false}>
      {angles.map((angle) => {
        const theta = (angle * Math.PI) / 180;
        return (
          <Text
            key={`${sign}-${angle}`}
            x={Math.cos(theta) * radius - 6}
            y={Math.sin(theta) * radius - 7}
            text={sign}
            fontSize={17}
            fontStyle="bold"
            fill={color}
            opacity={0.92}
          />
        );
      })}
    </Group>
  );
};

const SphereInductionSigns = ({
  x,
  y,
  radius,
  sourceDx,
  sourceDy,
  sourceCharge,
  color,
}: {
  x: number;
  y: number;
  radius: number;
  sourceDx: number;
  sourceDy: number;
  sourceCharge: number;
  color: string;
}) => {
  const sourceAngle = Math.atan2(sourceDy, sourceDx);
  const nearSign = sourceCharge > 0 ? "-" : "+";
  const farSign = sourceCharge > 0 ? "+" : "-";
  const offsets = [-62, -44, -26, -8, 10, 28, 46, 64];

  const renderSide = (baseAngle: number, sign: string) =>
    offsets.map((offset) => {
      const theta = baseAngle + (offset * Math.PI) / 180;
      return (
        <Text
          key={`${sign}-${baseAngle}-${offset}`}
          x={Math.cos(theta) * radius - 7}
          y={Math.sin(theta) * radius - 8}
          text={sign}
          fontSize={17}
          fontStyle="bold"
          fill={color}
          opacity={0.92}
          listening={false}
        />
      );
    });

  return (
    <Group x={x} y={y} listening={false}>
      {renderSide(sourceAngle, nearSign)}
      {renderSide(sourceAngle + Math.PI, farSign)}
    </Group>
  );
};

const getContrastTextColor = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((ch) => ch + ch).join("")
    : normalized;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.68 ? "#0f172a" : "#ffffff";
};

const SphereChargeWave = ({
  x,
  y,
  radius,
  color,
  chargeMagnitude,
  direction,
  waveTick,
}: {
  x: number;
  y: number;
  radius: number;
  color: string;
  chargeMagnitude: number;
  direction: "outward" | "inward" | null;
  waveTick: number;
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const [tick, setTick] = useState(0);
  const loopDuration = Math.max(360, 1400 - Math.min(chargeMagnitude, 100) * 9);

  useEffect(() => {
    if (!direction || !waveTick || !groupRef.current) return;

    const layer = groupRef.current.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const nextTick = (frame.time % loopDuration) / loopDuration;
      setTick(nextTick);
    }, layer);

    anim.start();
    return () => {
      anim.stop();
    };
  }, [direction, loopDuration, waveTick]);

  if (!direction || !waveTick) return null;

  const arrowAngles = [-90, -54, -18, 18, 54, 90, 126, 162, 198, 234];
  const dashedRadius = radius + 12;
  const animatedTravel = 34 + Math.min(chargeMagnitude, 80) * 0.18;
  const shaftLength = 22 + Math.min(chargeMagnitude, 80) * 0.12;

  return (
    <Group ref={groupRef} x={x} y={y} listening={false}>
      <Circle
        radius={dashedRadius}
        stroke={color}
        strokeWidth={1.6}
        dash={[8, 7]}
        opacity={0.35}
      />
      {arrowAngles.map((angle, index) => {
        const phase = (tick + index * 0.085) % 1;
        const waveOffset = phase * animatedTravel;
        const theta = (angle * Math.PI) / 180;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const startBase = dashedRadius + 4;
        const endBase = startBase + shaftLength;

        const outwardStart = startBase + waveOffset;
        const outwardEnd = endBase + waveOffset;
        const inwardStart = startBase + (1 - phase) * animatedTravel;
        const inwardEnd = endBase + (1 - phase) * animatedTravel;
        const startRadius = direction === "outward" ? outwardStart : inwardStart;
        const endRadius = direction === "outward" ? outwardEnd : inwardEnd;
        const opacity = 0.25 + (1 - phase) * 0.55;

        return (
          <Arrow
            key={`${waveTick}-${direction}-${angle}`}
            points={[
              cos * startRadius,
              sin * startRadius,
              cos * endRadius,
              sin * endRadius,
            ]}
            stroke={color}
            fill={color}
            strokeWidth={2.2}
            pointerLength={7}
            pointerWidth={7}
            pointerAtBeginning={direction === "inward"}
            pointerAtEnding={direction === "outward"}
            opacity={opacity}
          />
        );
      })}
    </Group>
  );
};

const SmokeAnimation = ({ x, y }: { x: number; y: number }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; s: number; o: number }[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.map(p => ({ ...p, y: p.y - 1.5, o: p.o - 0.02, s: p.s + 0.1 })).filter(p => p.o > 0),
        { id: Math.random(), x: (Math.random() - 0.5) * 15, y: 0, s: 2, o: 0.8 }
      ]);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <Group x={x} y={y}>
      {particles.map(p => (
        <Circle
          key={p.id}
          x={p.x}
          y={p.y}
          radius={p.s}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={p.s}
          fillRadialGradientColorStops={[0, '#555', 1, 'rgba(0,0,0,0)']}
          opacity={p.o}
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

const RotatingGear = ({ x, y, direction, speed = 1 }: { x: number; y: number; direction: number; speed?: number }) => {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    let currentRotation = groupRef.current?.rotation() || 0;
    const anim = new Konva.Animation((frame) => {
      if (groupRef.current && frame) {
        // Accumulate rotation using timeDiff for smooth transitions
        currentRotation += frame.timeDiff * 0.3 * speed * direction;
        groupRef.current.rotation(currentRotation % 360);
      }
    }, groupRef.current?.getLayer());
    
    anim.start();
    return () => { anim.stop(); };
  }, [direction, speed]);

  return (
    <Group x={x} y={y} ref={groupRef} shadowColor="#000" shadowBlur={4} shadowOpacity={0.2} shadowOffset={{ x: 1, y: 1 }}>
      {/* 12 Sharp, Shorter Teeth */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Group key={i} rotation={i * 30}>
          <Path 
            data="M 0 -15 L 3 -10 L -3 -10 Z"
            fill="#f1c40f"
            stroke="#d4ac0d"
            strokeWidth={0.5}
          />
        </Group>
      ))}
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
      {/* Asymmetric Direction Indicators */}
      <Circle x={0} y={-6} radius={2.5} fill="#d35400" opacity={0.8} />
      <Circle x={5} y={3} radius={1.5} fill="#d35400" opacity={0.6} />
      <Circle x={-5} y={3} radius={1.5} fill="#d35400" opacity={0.6} />

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
