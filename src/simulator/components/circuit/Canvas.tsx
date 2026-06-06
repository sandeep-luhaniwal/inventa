"use client"
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Line, Circle } from "react-konva";
import Konva from "konva";
import WireSVGOverlay from "./canvas/WireLayer";
import ComponentNode from "./canvas/ComponentNode";
import BreadboardNode from "./canvas/BreadboardNode";
import PhysicsLayer from "./canvas/PhysicsLayer";
import CalculationPopup from "./CalculationPopup";
import ElectricFieldCalculationPopup from "./ElectricFieldCalculationPopup";
import ElectricFluxCalculationPopup from "./ElectricFluxCalculationPopup";
import ElectricPotentialCalculationPopup from "./ElectricPotentialCalculationPopup";
import ElectricPotentialDifferenceCalculationPopup from "./ElectricPotentialDifferenceCalculationPopup";
import { ConnectingFrom, Note, PlacedComponent, Wire, Drawing } from "@/simulator/types/circuit";
import NoteNode from "./canvas/NoteNode";
import { getWireDash, snapToPin } from "@/simulator/utils/circuitUtils";
import { SimulatedComponentState } from "@/simulator/utils/simulation";
import { STATIC_COMPONENTS, svgToDataUrl, getCapacitorDataUrl, getLedDataUrls, getSphereDataUrls, getMirrorDataUrl, getLensDataUrl } from "@/simulator/constants/staticComponents";
import { ZoomIn, ZoomOut, Maximize, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import MicrobitSimulatorPanel from "./MicrobitSimulatorPanel";

const PENCIL_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE3IDNsNCA0TDcgMjFIM3YtNEwxNyAzeiIvPjwvc3ZnPg==") 0 24, auto`;
const ERASER_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOS4zIDEyTDE1IDYuM0wyMC43IDEyTDE1IDE3LjdMOS4zIDEyeiIgZmlsbD0iI0ZGNjlCNCIvPjxwYXRoIGQ9Ik0zIDIxSDExTDcuMTUgMTcuMTUiIGZpbGw9IiNDMEMwQzAiLz48cGF0aCBkPSJNMTEgMjFMMjEgMTEiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=") 0 24, auto`;

const ZOOM_SCALE = 1.08;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 4;
const COULOMB_K = 8.9875517923e9;
const ELECTRIC_FIELD_K = 9e9;
const EPSILON_0 = 8.854e-12;
const POTENTIAL_RING_RADIUS_FACTOR = 4;
const CHARGE_UNIT_MULTIPLIER: Record<string, number> = {
  C: 1,
  mC: 1e-3,
  uC: 1e-6,
  nC: 1e-9,
};

function normalizeChargeUnit(unit = "uC") {
  return unit.replace("Âµ", "u").replace("µ", "u");
}

function toCoulombs(value = 0, unit = "uC") {
  return value * (CHARGE_UNIT_MULTIPLIER[normalizeChargeUnit(unit)] ?? 1e-6);
}

function toMicroCoulombs(value = 0, unit = "uC") {
  return toCoulombs(value, unit) / 1e-6;
}

function getPairDielectric(a: PlacedComponent, b: PlacedComponent) {
  const value = a.physicsDielectric ?? b.physicsDielectric ?? 1;
  return value > 0 ? value : 1;
}

function getPairMediumName(a: PlacedComponent, b: PlacedComponent) {
  return a.physicsMedium || b.physicsMedium || "Vacuum";
}

function getSphereCenter(component: PlacedComponent) {
  return {
    x: component.x + (component.width || 100) / 2,
    y: component.y + (component.height || 100) / 2,
  };
}

export interface CanvasProps {
  placedComponents: PlacedComponent[];
  wires: Wire[];
  connectingFrom: ConnectingFrom | null;
  selectedComponents: string[];
  selectedWire: string | null;
  isSimulating: boolean;
  showGrid: boolean;
  wireColor: string;
  wireType: string;
  notes: Note[];
  onNoteUpdate: (id: string, updates: Partial<Note>) => void;
  onNoteDelete: (id: string) => void;
  simulatedComponents?: Record<string, SimulatedComponentState>;
  blinkToggle: boolean;
  poweredWireIds?: string[];
  simulationSummary?: string;
  onDrop: (e: React.DragEvent, stagePos: { x: number; y: number }) => void;
  onDragOver: (e: React.DragEvent) => void; 
  onComponentMove: (id: string, x: number, y: number) => void;
  onComponentMoveEnd: (id: string, x: number, y: number) => void;
  onComponentUpdate?: (id: string, updates: Partial<PlacedComponent>) => void;
  onPinClick: (compId: string, portIndex: number) => void;
  onComponentSelect: (compId: string, multi: boolean) => void;
  onWireSelect: (wireId: string) => void;
  onWireDelete: (wireId: string) => void;
  onWireMidPointsChange: (wireId: string, pts: { x: number; y: number }[]) => void;
  onCanvasWirePointAdd: (point: { x: number; y: number }) => void;
  onPortsResolved?: (compId: string, resolvedPorts: { x: number; y: number }[], width: number, height: number) => void;
  drawings: Drawing[];
  activeTool: "select" | "pencil" | "eraser";
  pencilColor: string;
  onAddDrawing: (drawing: Drawing) => void;
  onDeleteDrawing: (id: string) => void;
}

const Canvas = ({
  placedComponents,
  wires,
  connectingFrom,
  selectedComponents,
  selectedWire,
  isSimulating,
  showGrid,
  wireColor,
  wireType,
  notes,
  onNoteUpdate,
  onNoteDelete,
  simulatedComponents,
  blinkToggle,
  poweredWireIds,
  simulationSummary,
  onDrop,
  onDragOver,
  onComponentMove,
  onComponentMoveEnd,
  onComponentUpdate,
  onPinClick,
  onComponentSelect,
  onWireSelect,
  onWireDelete,
  onWireMidPointsChange,
  onCanvasWirePointAdd,
  onPortsResolved,
  drawings,
  activeTool,
  pencilColor,
  onAddDrawing,
  onDeleteDrawing,
}: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [snapTarget, setSnapTarget] = useState<{ x: number; y: number } | null>(null);
  const [stageTransform, setStageTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [currentLine, setCurrentLine] = useState<number[] | null>(null);
  const coulombCalculation = useMemo(() => {
    const spheres = placedComponents.filter((component) =>
      component.componentId.startsWith("sphere_") &&
      component.physicsTopic === "Coulomb's Law"
    );

    if (spheres.length < 2) return null;

    const [sphereA, sphereB] = spheres;
    if (spheres.length > 2) {
      const selectedSphere = spheres.find((sphere) => selectedComponents.includes(sphere.id)) || sphereA;
      const targetCharge = toCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit);
      const targetCenter = getSphereCenter(selectedSphere);
      let fx = 0;
      let fy = 0;
      const forceVectors: { fx: number; fy: number; magnitude: number }[] = [];

      if (targetCharge !== 0) {
        for (const source of spheres) {
          if (source.id === selectedSphere.id) continue;

          const sourceCharge = toCoulombs(source.chargeValue || 0, source.chargeUnit);
          if (sourceCharge === 0) continue;

          const sourceCenter = getSphereCenter(source);
          const dx = targetCenter.x - sourceCenter.x;
          const dy = targetCenter.y - sourceCenter.y;
          const distancePx = Math.hypot(dx, dy);
          const distanceM = distancePx / 100;
          if (distanceM < 0.01) continue;

          const dielectric = getPairDielectric(selectedSphere, source);
          const baseMagnitude = (COULOMB_K * Math.abs(targetCharge * sourceCharge)) / (distanceM * distanceM);
          const magnitude = Number.isFinite(dielectric) ? baseMagnitude / dielectric : 0;
          const direction = targetCharge * sourceCharge > 0 ? 1 : -1;
          const vectorX = (dx / distancePx) * magnitude * direction;
          const vectorY = (dy / distancePx) * magnitude * direction;
          fx += vectorX;
          fy += vectorY;
          forceVectors.push({ fx: vectorX, fy: vectorY, magnitude });
        }
      }

      const [firstForce, secondForce] = forceVectors;
      const dotProduct = firstForce && secondForce
        ? firstForce.fx * secondForce.fx + firstForce.fy * secondForce.fy
        : 0;
      const thetaRadians = firstForce && secondForce && firstForce.magnitude > 0 && secondForce.magnitude > 0
        ? Math.acos(Math.min(1, Math.max(-1, dotProduct / (firstForce.magnitude * secondForce.magnitude))))
        : 0;

      return {
        q1: toMicroCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit),
        q2: spheres
          .filter((sphere) => sphere.id !== selectedSphere.id)
          .reduce((sum, sphere) => sum + toMicroCoulombs(sphere.chargeValue || 0, sphere.chargeUnit), 0),
        distance: 0,
        sphereCount: spheres.length,
        force: Math.hypot(fx, fy),
        isRepulsive: true,
        isSuperposition: true,
        mediumName: selectedSphere.physicsMedium || "Vacuum",
        dielectric: selectedSphere.physicsDielectric ?? 1,
        baseForce: undefined,
        superpositionWorking: firstForce && secondForce ? {
          f1: firstForce.magnitude,
          f2: secondForce.magnitude,
          thetaDeg: thetaRadians * (180 / Math.PI),
        } : undefined,
      };
    }

    const q1 = toCoulombs(sphereA.chargeValue || 0, sphereA.chargeUnit);
    const q2 = toCoulombs(sphereB.chargeValue || 0, sphereB.chargeUnit);
    const dielectric = getPairDielectric(sphereA, sphereB);
    const mediumName = getPairMediumName(sphereA, sphereB);
    const centerA = {
      x: sphereA.x + (sphereA.width || 100) / 2,
      y: sphereA.y + (sphereA.height || 100) / 2,
    };
    const centerB = {
      x: sphereB.x + (sphereB.width || 100) / 2,
      y: sphereB.y + (sphereB.height || 100) / 2,
    };
    const distancePx = Math.hypot(centerB.x - centerA.x, centerB.y - centerA.y);
    const distanceM = distancePx / 100;
    const baseValues = {
      q1: toMicroCoulombs(sphereA.chargeValue || 0, sphereA.chargeUnit),
      q2: toMicroCoulombs(sphereB.chargeValue || 0, sphereB.chargeUnit),
      distance: distancePx / 10,
      sphereCount: spheres.length,
      mediumName,
      dielectric,
      baseForce: distanceM > 0 ? (COULOMB_K * Math.abs(q1 * q2)) / (distanceM * distanceM) : 0,
    };

    if (distanceM < 0.01 || q1 === 0 || q2 === 0) {
      return {
        ...baseValues,
        force: 0,
        isRepulsive: false,
      };
    }

    return {
      ...baseValues,
      force: Number.isFinite(dielectric)
        ? ((COULOMB_K * Math.abs(q1 * q2)) / (distanceM * distanceM)) / dielectric
        : 0,
      isRepulsive: q1 * q2 > 0,
    };
  }, [placedComponents, selectedComponents]);

  const electricFieldCalculation = useMemo(() => {
    const spheres = placedComponents.filter((component) =>
      component.componentId.startsWith("sphere_") &&
      component.physicsTopic === "Electric Field Intensity"
    );

    const selectedSphere = spheres.find((sphere) => selectedComponents.includes(sphere.id)) || spheres[0];
    if (!selectedSphere) return null;

    const q = toCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit);
    if (q === 0) return null;

    const radiusM = ((selectedSphere.width || 100) / 2) / 100;
    const distanceM = selectedSphere.physicsObservationDistance ?? Math.max(1, radiusM);
    const sphereType = selectedSphere.physicsSphereType || "Conducting";
    const region: "inside" | "surface/outside" = distanceM < radiusM ? "inside" : "surface/outside";
    const electricField =
      sphereType === "Conducting" && distanceM < radiusM
        ? 0
        : sphereType === "Non-Conducting" && distanceM < radiusM
          ? (ELECTRIC_FIELD_K * Math.abs(q) * distanceM) / Math.pow(radiusM || 1, 3)
          : (ELECTRIC_FIELD_K * Math.abs(q)) / Math.pow(distanceM || 1, 2);

    return {
      chargeMicroC: toMicroCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit),
      radiusM,
      distanceM,
      electricField,
      sphereType,
      region,
    };
  }, [placedComponents, selectedComponents]);

  const electricFluxCalculation = useMemo(() => {
    const spheres = placedComponents.filter((component) =>
      component.componentId.startsWith("sphere_") &&
      component.physicsTopic === "Electric Flux"
    );
    const selectedSphere = spheres.find((sphere) => selectedComponents.includes(sphere.id)) || spheres[0];
    if (!selectedSphere) return null;

    const q = toCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit);
    if (q === 0) return null;

    const distanceM = selectedSphere.physicsObservationDistance ?? 1;
    const electricField = distanceM > 0 ? (ELECTRIC_FIELD_K * Math.abs(q)) / (distanceM * distanceM) : 0;
    const area = selectedSphere.physicsFluxArea ?? 1;
    const angle = selectedSphere.physicsFluxAngle ?? 0;
    const surfaceType = selectedSphere.physicsFluxSurfaceType || "Disc";
    const closedSurface = surfaceType === "Cylindrical" || surfaceType === "Spherical";
    const flux = closedSurface
      ? Math.abs(q) / EPSILON_0
      : electricField * area * Math.cos((angle * Math.PI) / 180);

    return {
      chargeMicroC: toMicroCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit),
      electricField,
      area,
      angle,
      surfaceType,
      closedSurface,
      flux,
    };
  }, [placedComponents, selectedComponents]);

  const electricPotentialCalculation = useMemo(() => {
    const spheres = placedComponents.filter((component) =>
      component.componentId.startsWith("sphere_") &&
      component.physicsTopic === "Electric Potential"
    );
    const selectedSphere = spheres.find((sphere) => selectedComponents.includes(sphere.id)) || spheres[0];
    if (!selectedSphere) return null;

    const selectedCharge = toCoulombs(selectedSphere.chargeValue || 0, selectedSphere.chargeUnit);
    const selectedCenter = getSphereCenter(selectedSphere);
    const sourceSphere = selectedCharge !== 0
      ? selectedSphere
      : spheres
        .filter((sphere) => toCoulombs(sphere.chargeValue || 0, sphere.chargeUnit) !== 0)
        .map((sphere) => ({
          sphere,
          distance: Math.hypot(
            getSphereCenter(sphere).x - selectedCenter.x,
            getSphereCenter(sphere).y - selectedCenter.y
          ),
        }))
        .sort((a, b) => a.distance - b.distance)[0]?.sphere;
    if (!sourceSphere) return null;

    const sourceCenter = getSphereCenter(sourceSphere);
    const nearestTest = spheres.length > 1
      ? spheres
        .filter((sphere) => sphere.id !== sourceSphere.id)
        .map((sphere) => ({
          sphere,
          distancePx: Math.hypot(
            getSphereCenter(sphere).x - sourceCenter.x,
            getSphereCenter(sphere).y - sourceCenter.y
          ),
        }))
        .sort((a, b) => a.distancePx - b.distancePx)[0]
      : undefined;
    const q = toCoulombs(sourceSphere.chargeValue || 0, sourceSphere.chargeUnit);
    if (q === 0) return null;

    const radiusM = ((sourceSphere.width || 100) / 2) / 100;
    const nearestTestDistanceM = nearestTest
      ? nearestTest.distancePx <= ((sourceSphere.width || 100) / 2) * POTENTIAL_RING_RADIUS_FACTOR + ((nearestTest.sphere.width || 100) / 2)
        ? nearestTest.distancePx / 100
        : Infinity
      : undefined;
    const distanceM = nearestTestDistanceM ?? sourceSphere.physicsObservationDistance ?? Math.max(1, radiusM);
    const region: "inside" | "surface" | "outside" = distanceM < radiusM
      ? "inside"
      : Math.abs(distanceM - radiusM) < 0.001
        ? "surface"
        : "outside";
    const electricField = region === "inside" || !Number.isFinite(distanceM)
      ? 0
      : (ELECTRIC_FIELD_K * Math.abs(q)) / Math.pow(distanceM || 1, 2);
    const electricPotential = !Number.isFinite(distanceM)
      ? 0
      : region === "inside"
      ? (ELECTRIC_FIELD_K * q) / (radiusM || 1)
      : (ELECTRIC_FIELD_K * q) / (distanceM || 1);

    return {
      chargeMicroC: toMicroCoulombs(sourceSphere.chargeValue || 0, sourceSphere.chargeUnit),
      radiusM,
      distanceM,
      electricField,
      electricPotential,
      region,
    };
  }, [placedComponents, selectedComponents]);

  const electricPotentialDifferenceCalculation = useMemo(() => {
    const spheres = placedComponents.filter((component) =>
      component.componentId.startsWith("sphere_") &&
      component.physicsTopic === "Electric Potential Difference"
    );
    const selectedSource = spheres.find((sphere) =>
      selectedComponents.includes(sphere.id) &&
      toCoulombs(sphere.chargeValue || 0, sphere.chargeUnit) !== 0
    );
    const sourceSphere = selectedSource || spheres.find((sphere) =>
      toCoulombs(sphere.chargeValue || 0, sphere.chargeUnit) !== 0
    );
    if (!sourceSphere) return null;

    const sourceCenter = getSphereCenter(sourceSphere);
    const probes = spheres
      .filter((sphere) => sphere.id !== sourceSphere.id)
      .map((sphere) => ({
        sphere,
        distanceM: Math.max(
          0.001,
          Math.hypot(
            getSphereCenter(sphere).x - sourceCenter.x,
            getSphereCenter(sphere).y - sourceCenter.y
          ) / 100
        ),
      }))
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 2);

    if (probes.length < 2) return null;

    const q = toCoulombs(sourceSphere.chargeValue || 0, sourceSphere.chargeUnit);
    const dielectric = sourceSphere.physicsDielectric ?? 1;
    const mediumName = sourceSphere.physicsMedium || "Vacuum";
    const potentialAt = (distanceM: number) =>
      Number.isFinite(dielectric) ? (ELECTRIC_FIELD_K * q) / (dielectric * distanceM) : 0;
    const potentialA = potentialAt(probes[0].distanceM);
    const potentialB = potentialAt(probes[1].distanceM);

    return {
      chargeMicroC: toMicroCoulombs(sourceSphere.chargeValue || 0, sourceSphere.chargeUnit),
      distanceA: probes[0].distanceM,
      distanceB: probes[1].distanceM,
      potentialA,
      potentialB,
      deltaV: potentialB - potentialA,
      mediumName,
      dielectric,
    };
  }, [placedComponents, selectedComponents]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback(() => {
    const pos = stageRef.current?.getRelativePointerPosition();
    if (!pos) return;
    setCursor(pos);
    if (connectingFrom) {
      const snap = snapToPin(pos.x, pos.y, placedComponents, connectingFrom.compId, connectingFrom.portIndex);
      setSnapTarget(snap ? { x: snap.x, y: snap.y } : null);
    } else {
      setSnapTarget(null);
    }
  }, [connectingFrom, placedComponents]);

  const handleStageClick = useCallback(() => {
    if (activeTool === "pencil" || activeTool === "eraser") return;
    if (!connectingFrom) {
      onComponentSelect("", false);
      return;
    }

    const pos = stageRef.current?.getRelativePointerPosition();
    if (!pos) return;

    const nextPoint = snapTarget ?? pos;
    onCanvasWirePointAdd(nextPoint);
  }, [activeTool, connectingFrom, onCanvasWirePointAdd, onComponentSelect, snapTarget]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (activeTool === "pencil") {
      setIsDrawing(true);
      const pos = stageRef.current?.getRelativePointerPosition();
      if (pos) {
        setCurrentLine([pos.x, pos.y]);
      }
    } else if (activeTool === "eraser") {
      setIsErasing(true);
      // Immediate erase on click
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        const shape = stageRef.current?.getIntersection(pos);
        if (shape && shape.attrs.id?.startsWith("drawing-")) {
          onDeleteDrawing(shape.attrs.id);
        }
      }
    }
  }, [activeTool, onDeleteDrawing]);

  const handleMouseMoveDrawing = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    handleMouseMove();
    if (activeTool === "pencil" && isDrawing) {
      const pos = stageRef.current?.getRelativePointerPosition();
      if (pos && currentLine) {
        setCurrentLine([...currentLine, pos.x, pos.y]);
      }
    } else if (activeTool === "eraser" && isErasing) {
      const pos = stageRef.current?.getPointerPosition();
      if (pos) {
        const shape = stageRef.current?.getIntersection(pos);
        if (shape && shape.attrs.id?.startsWith("drawing-")) {
          onDeleteDrawing(shape.attrs.id);
        }
      }
    }
  }, [activeTool, isDrawing, isErasing, currentLine, handleMouseMove, onDeleteDrawing]);

  const handleMouseUp = useCallback(() => {
    if (activeTool === "pencil" && isDrawing && currentLine) {
      if (currentLine.length >= 4) {
        onAddDrawing({
          id: `drawing-${Date.now()}`,
          points: currentLine,
          color: pencilColor,
          width: 3,
        });
      }
    }
    setIsDrawing(false);
    setIsErasing(false);
    setCurrentLine(null);
  }, [activeTool, currentLine, isDrawing, onAddDrawing, pencilColor]);

  const centerCircuit = useCallback((padding = 80) => {
    if (!stageRef.current || placedComponents.length === 0) return;
    
    const stage = stageRef.current;
    
    // Get bounding box of all components
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    placedComponents.forEach(comp => {
      minX = Math.min(minX, comp.x);
      minY = Math.min(minY, comp.y);
      // Assume a default size of 100x100 for components if not specific
      maxX = Math.max(maxX, comp.x + 120);
      maxY = Math.max(maxY, comp.y + 120);
    });
    
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    // Calculate scale to fit
    const scaleX = (size.w - padding * 2) / contentW;
    const scaleY = (size.h - padding * 2) / contentH;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.5);
    
    // Calculate new position to center
    const newX = (size.w / 2) - (minX + contentW / 2) * newScale;
    const newY = (size.h / 2) - (minY + contentH / 2) * newScale;
    
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: newX, y: newY });
    setStageTransform({ x: newX, y: newY, scale: newScale });
  }, [placedComponents, size]);

  // Auto-center on load
  const hasAutoCentered = useRef(false);
  useEffect(() => {
    if (!hasAutoCentered.current && placedComponents.length > 0 && size.w > 0) {
      requestAnimationFrame(() => centerCircuit());
      hasAutoCentered.current = true;
    }
  }, [placedComponents.length, size.w, centerCircuit]);

  const syncTransform = useCallback(() => {
    const s = stageRef.current;
    if (!s) return;
    setStageTransform({ x: s.x(), y: s.y(), scale: s.scaleX() });
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const origin = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = Math.min(
      Math.max(e.evt.deltaY < 0 ? oldScale * ZOOM_SCALE : oldScale / ZOOM_SCALE, ZOOM_MIN),
      ZOOM_MAX
    );
    stage.scale({ x: newScale, y: newScale });
    stage.position({ x: pointer.x - origin.x * newScale, y: pointer.y - origin.y * newScale });
    setStageTransform({ x: stage.x(), y: stage.y(), scale: newScale });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isSimulating) return;
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.container().getBoundingClientRect();
    const stagePos = {
      x: (e.clientX - box.left - stage.x()) / stage.scaleX(),
      y: (e.clientY - box.top - stage.y()) / stage.scaleY(),
    };
    onDrop(e, stagePos);
  }, [onDrop, isSimulating]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-canvas"
      onDrop={handleDrop}
      onDragOver={onDragOver}
      style={{ 
        cursor: connectingFrom 
          ? "crosshair" 
          : activeTool === "pencil" 
            ? PENCIL_CURSOR 
            : activeTool === "eraser"
              ? ERASER_CURSOR
              : "default" 
      }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        draggable={!connectingFrom && activeTool !== "pencil"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveDrawing}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMoveDrawing}
        onTouchEnd={handleMouseUp}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onWheel={handleWheel}
        onDragEnd={syncTransform}
        onDragMove={syncTransform}
      >
        <Layer>
          {showGrid && (() => {
            const lines = [];
            const grid = 25;
            const width = 5000;
            const height = 5000;
            for (let i = 0; i < width / grid; i++) {
              lines.push(<Rect key={`v-${i}`} x={i * grid} y={0} width={1} height={height} fill="#e5e7eb" opacity={0.5} listening={false} />);
            }
            for (let i = 0; i < height / grid; i++) {
              lines.push(<Rect key={`h-${i}`} x={0} y={i * grid} width={width} height={1} fill="#e5e7eb" opacity={0.5} listening={false} />);
            }
            return lines;
          })()}
        </Layer>
        <Layer>
          {drawings.map((drawing) => (
            <Line
              key={drawing.id}
              id={drawing.id}
              points={drawing.points}
              stroke={drawing.color}
              strokeWidth={drawing.width}
              hitStrokeWidth={drawing.width + 10} // Larger hit area for easier erasing
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              onClick={() => {
                if (activeTool === "eraser") {
                  onDeleteDrawing(drawing.id);
                }
              }}
              onMouseEnter={(e) => {
                if (activeTool === "eraser") {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = activeTool === "eraser" ? ERASER_CURSOR : (activeTool === "pencil" ? PENCIL_CURSOR : "default");
              }}
            />
          ))}
          {isDrawing && currentLine && (
            <Line
              points={currentLine}
              stroke={pencilColor}
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {activeTool === "eraser" && cursor && (
            <Circle
              x={cursor.x}
              y={cursor.y}
              radius={10 / stageTransform.scale}
              stroke="#ef4444"
              strokeWidth={1 / stageTransform.scale}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Layer>
        <Layer>
          {notes.map((note) => (
            <NoteNode
              key={note.id}
              note={note}
              onUpdate={onNoteUpdate}
              onDelete={onNoteDelete}
            />
          ))}
        </Layer>
        <Layer>
          {[...placedComponents].sort((a, b) => {
             const zA = a.componentId.includes('stand') || a.componentId === 'breadboard' ? 0 : 1;
             const zB = b.componentId.includes('stand') || b.componentId === 'breadboard' ? 0 : 1;
             return zA - zB;
          }).map((comp) =>
            comp.componentId === "breadboard" ? (
              <BreadboardNode
                key={comp.id}
                comp={comp}
                isSelected={selectedComponents.includes(comp.id)}
                connectingFrom={connectingFrom}
                isSimulating={isSimulating}
                onDragMove={onComponentMove}
                onDragEnd={onComponentMoveEnd}
                onPinClick={onPinClick}
                onSelect={onComponentSelect}
                allComponents={placedComponents}
              />
            ) : (() => {
                const isSelected = selectedComponents.includes(comp.id);
                const staticDef = STATIC_COMPONENTS.find((d) => d.id === comp.componentId);
                const isSphere = comp.componentId.startsWith('sphere_');
                const isCapacitor = comp.componentId === 'capacitor';
                const isMirror = ['plane_mirror', 'concave_mirror', 'convex_mirror'].includes(comp.componentId);
                const isLens = ['concave_lens', 'convex_lens'].includes(comp.componentId);
                const isPowerSupply = comp.componentId === 'dc_power_supply' || comp.componentId === 'ac_power_supply';
                const sphereUrls = isSphere ? getSphereDataUrls(comp.physicsMetal || "Copper", isSelected && !isSphere, comp.id) : null;
                const capacitorImageSrc = isCapacitor
                  ? getCapacitorDataUrl(
                      comp.capacitanceValue ?? 1000,
                      comp.capacitanceUnit ?? "uF",
                      comp.voltageValue ?? 25,
                      isSelected,
                      comp.id
                    )
                  : null;
                const mirrorImageSrc = isMirror
                  ? getMirrorDataUrl(comp.componentId, comp.opticsMirrorView, isSelected, comp.id)
                  : null;
                const lensImageSrc = isLens
                  ? getLensDataUrl(comp.componentId, comp.opticsLensView, isSelected, comp.id)
                  : null;
                const resolvedBaseImageSrc = lensImageSrc || mirrorImageSrc || capacitorImageSrc || (sphereUrls ? sphereUrls.imageSrc : (staticDef
                  ? svgToDataUrl(staticDef, false, isSelected && !isPowerSupply, comp.id)
                  : comp.imageSrc));
                // For LEDs, resolve the live image URLs from the current ledColor
                const isLed = comp.componentId.startsWith('led_');
                const resolvedColor = isLed ? (comp.ledColor ?? comp.componentId.replace('led_', '')) : null;
                const ledUrls = isLed && resolvedColor ? getLedDataUrls(resolvedColor, isSelected, comp.id) : null;
                return (
                  <ComponentNode
                    key={comp.id}
                    comp={comp}
                    imageSrc={ledUrls ? ledUrls.imageSrc : resolvedBaseImageSrc}
                    litImageSrc={ledUrls ? ledUrls.litImageSrc : comp.litImageSrc}
                    connectingFrom={connectingFrom}
                    isSimulating={isSimulating}
                    simulationState={simulatedComponents?.[comp.id]}
                    blinkToggle={blinkToggle}
                    onDragMove={onComponentMove}
                    onDragEnd={onComponentMoveEnd}
                    onUpdate={onComponentUpdate}
                    onPinClick={onPinClick}
                    onSelect={onComponentSelect}
                    onSizeResolved={onPortsResolved}
                    allComponents={placedComponents}
                  />
                );
              })()
          )}
        </Layer>
        <Layer listening={false}>
          <PhysicsLayer components={placedComponents} />
        </Layer>
      </Stage>

      <WireSVGOverlay
        wires={wires}
        components={placedComponents}
        connectingFrom={connectingFrom}
        selectedWire={selectedWire}
        isSimulating={isSimulating}
        poweredWireIds={poweredWireIds}
        wireColor={wireColor}
        wireDash={getWireDash(wireType)}
        cursor={cursor}
        snapTarget={snapTarget}
        stageX={stageTransform.x}
        stageY={stageTransform.y}
        stageScale={stageTransform.scale}
        canvasW={size.w}
        canvasH={size.h}
        onWireClick={onWireSelect}
        onWireDoubleClick={onWireDelete}
        onMidPointsChange={onWireMidPointsChange}
        onComponentClick={(componentId) => onComponentSelect(componentId, false)}
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded-full border border-border pointer-events-none select-none">
        Scroll to zoom | Drag to pan | Double-click wire to add bend point
      </div>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full pointer-events-none select-none">
          Click anywhere to add a bend | Click another pin to finish | Esc to cancel
        </div>
      )}

      {isSimulating && placedComponents.some(c => c.componentId === 'microbit') && (
        <MicrobitSimulatorPanel />
      )}

      {coulombCalculation && (
        <CalculationPopup
          q1={coulombCalculation.q1}
          q2={coulombCalculation.q2}
          distance={coulombCalculation.distance}
          force={coulombCalculation.force}
          isRepulsive={coulombCalculation.isRepulsive}
          sphereCount={coulombCalculation.sphereCount}
          isSuperposition={coulombCalculation.isSuperposition}
          superpositionWorking={coulombCalculation.superpositionWorking}
          mediumName={coulombCalculation.mediumName}
          dielectric={coulombCalculation.dielectric}
          baseForce={coulombCalculation.baseForce}
        />
      )}

      {!coulombCalculation && electricFieldCalculation && (
        <ElectricFieldCalculationPopup
          chargeMicroC={electricFieldCalculation.chargeMicroC}
          radiusM={electricFieldCalculation.radiusM}
          distanceM={electricFieldCalculation.distanceM}
          electricField={electricFieldCalculation.electricField}
          sphereType={electricFieldCalculation.sphereType}
          region={electricFieldCalculation.region}
        />
      )}

      {!coulombCalculation && !electricFieldCalculation && electricFluxCalculation && (
        <ElectricFluxCalculationPopup
          chargeMicroC={electricFluxCalculation.chargeMicroC}
          electricField={electricFluxCalculation.electricField}
          area={electricFluxCalculation.area}
          angle={electricFluxCalculation.angle}
          surfaceType={electricFluxCalculation.surfaceType}
          closedSurface={electricFluxCalculation.closedSurface}
          flux={electricFluxCalculation.flux}
        />
      )}

      {!coulombCalculation && !electricFieldCalculation && !electricFluxCalculation && electricPotentialCalculation && (
        <ElectricPotentialCalculationPopup
          chargeMicroC={electricPotentialCalculation.chargeMicroC}
          radiusM={electricPotentialCalculation.radiusM}
          distanceM={electricPotentialCalculation.distanceM}
          electricField={electricPotentialCalculation.electricField}
          electricPotential={electricPotentialCalculation.electricPotential}
          region={electricPotentialCalculation.region}
        />
      )}

      {!coulombCalculation && !electricFieldCalculation && !electricFluxCalculation && !electricPotentialCalculation && electricPotentialDifferenceCalculation && (
        <ElectricPotentialDifferenceCalculationPopup
          chargeMicroC={electricPotentialDifferenceCalculation.chargeMicroC}
          distanceA={electricPotentialDifferenceCalculation.distanceA}
          distanceB={electricPotentialDifferenceCalculation.distanceB}
          potentialA={electricPotentialDifferenceCalculation.potentialA}
          potentialB={electricPotentialDifferenceCalculation.potentialB}
          deltaV={electricPotentialDifferenceCalculation.deltaV}
          mediumName={electricPotentialDifferenceCalculation.mediumName}
          dielectric={electricPotentialDifferenceCalculation.dielectric}
        />
      )}

      {/* ZOOM CONTROLS */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-lg border border-gray-200 shadow-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Zoom In"
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            const newScale = Math.min(stage.scaleX() * 1.2, ZOOM_MAX);
            stage.scale({ x: newScale, y: newScale });
            syncTransform();
          }}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Zoom Out"
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            const newScale = Math.max(stage.scaleX() / 1.2, ZOOM_MIN);
            stage.scale({ x: newScale, y: newScale });
            syncTransform();
          }}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-px bg-gray-200 mx-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Center View"
          onClick={() => centerCircuit()}
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-600 hover:bg-white" 
          title="Reset View"
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            stage.scale({ x: 1, y: 1 });
            stage.position({ x: 0, y: 0 });
            syncTransform();
          }}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Canvas;
