"use client"
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Resistor3D from "../assets/components/icons/Resistor3D";
import Capacitor3D from "../assets/components/icons/Capacitor3D";
import LED3D from "../assets/components/icons/LED3D";
import Battery9V3D from "../assets/components/icons/Battery9V3D";
import BatteryAA3D from "../assets/components/icons/BatteryAA3D";
import Diode3D from "../assets/components/icons/Diode3D";
import LEDRGB3D from "../assets/components/icons/LEDRGB3D";
import MotorDC3D from "../assets/components/icons/MotorDC3D";
import PushButton3D from "../assets/components/icons/PushButton3D";
import SlideSwitch3D from "../assets/components/icons/SlideSwitch3D";
import { Pin } from "../types/circuit";
// import type { Pin } from "@/types/circuit";
// import Resistor3D from "@/assets/components/icons/Resistor3D";
// import Capacitor3D from "@/assets/components/icons/Capacitor3D";
// import LED3D from "@/assets/components/icons/LED3D";
// import Battery9V3D from "@/assets/components/icons/Battery9V3D";
// import BatteryAA3D from "@/assets/components/icons/BatteryAA3D";
// import Diode3D from "@/assets/components/icons/Diode3D";
// import LEDRGB3D from "@/assets/components/icons/LEDRGB3D";
// import MotorDC3D from "@/assets/components/icons/MotorDC3D";
// import PushButton3D from "@/assets/components/icons/PushButton3D";
// import SlideSwitch3D from "@/assets/components/icons/SlideSwitch3D";

export type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export interface ComponentDefinition {
  id: string;
  name: string;
  ports: Pin[];
  icon: IconComponent;
}

/** Serialize a TSX SVG icon to a data: URL usable by HTMLImageElement / KonvaImage */
export function svgToDataUrl(Icon: IconComponent, width = 80, height = 48): string {
  const markup = renderToStaticMarkup(
    React.createElement(Icon, { width, height })
  );
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

const RESISTOR_PINS: [Pin, Pin] = [{ x: 0, y: 24 }, { x: 96, y: 24 }];

// Battery9V viewBox 100x160 | COMP_SIZE 56x90 => terminals on top
const BATTERY_PINS: [Pin, Pin] = [{ x: 20, y: 14 }, { x: 36, y: 13 }];

// BatteryAA viewBox 160x60 | COMP_SIZE 112x42 => left=negative, right=positive
// scale x: 112/160=0.7 | scale y: 42/60=0.7
// negative cap center x=15*0.7=10, positive nub center x=152*0.7=106, y=30*0.7=21
const BATTERY_AA_PINS: [Pin, Pin] = [{ x: 10, y: 21 }, { x: 106, y: 21 }];

// Adjusted for related icon viewBox + component render size (w,h) mapping
// Capacitor icon viewBox 100x150 | COMP_SIZE 56x84 => scale 0.56
// Updated to center connections on the metal leg centers (not top-left of pin rectangles)
const CAPACITOR_PINS: [Pin, Pin] = [{ x: 21, y: 71 }, { x: 35, y: 71 }];

// LED icon viewBox 100x150 | COMP_SIZE 56x84 => scale 0.56
const LED_PINS: [Pin, Pin] = [{ x: 20, y: 71 }, { x: 36, y: 71 }];

// Diode viewBox 120x50 | COMP_SIZE 96x40 => scale x:0.8, y:0.8
const DIODE_PINS: [Pin, Pin] = [{ x: 0, y: 20 }, { x: 96, y: 20 }];

// SlideSwitch viewBox 140x90 | COMP_SIZE 112x72 => scale x:0.8, y:0.8
// 3 pins at bottom: x=35,70,105 in viewBox => *0.8 = 28,56,84 | y=88*0.8=70
const SLIDE_SWITCH_PINS: [Pin, Pin, Pin] = [
  { x: 28, y: 70 }, // pin 1 (left)
  { x: 56, y: 70 }, // pin 2 (common/center)
  { x: 84, y: 70 }, // pin 3 (right)
];

// PushButton viewBox 100x120 | COMP_SIZE 70x84 => scale 0.7
// 4 pins at bottom: x=20,32,67,79 in viewBox => *0.7 = 14,22,47,55 | y=118*0.7=82
const PUSH_BUTTON_PINS: [Pin, Pin, Pin, Pin] = [
  { x: 14, y: 82 }, // pin 1
  { x: 22, y: 82 }, // pin 2
  { x: 47, y: 82 }, // pin 3
  { x: 55, y: 82 }, // pin 4
];

// MotorDC viewBox 160x100 | COMP_SIZE 112x70 => scale x:0.7, y:0.7
// terminal 1 center x=142*0.7=99, terminal 2 center x=142*0.7=99, y1=39*0.7=27, y2=61*0.7=43
const MOTOR_DC_PINS: [Pin, Pin] = [{ x: 99, y: 27 }, { x: 99, y: 43 }];

// LEDRGB viewBox 100x160 | COMP_SIZE 56x90 => scale 0.56
// 4 pins: R(x=17), G(x=29), B(x=71), GND(x=83) in viewBox => scaled *0.56
// y bottom of pins in viewBox=154/148 => scaled ~86/83, use base bottom ~90*0.56=50
const LED_RGB_PINS: [Pin, Pin, Pin, Pin] = [
  { x: 10, y: 90 }, // R
  { x: 18, y: 90 }, // G
  { x: 38, y: 90 }, // B
  { x: 46, y: 90 }, // GND
];

export const COMPONENT_REGISTRY: ComponentDefinition[] = [
  { id: "resistor", name: "Resistor", ports: RESISTOR_PINS, icon: Resistor3D as IconComponent },
  { id: "capacitor", name: "Capacitor", ports: CAPACITOR_PINS, icon: Capacitor3D as IconComponent },
  { id: "led", name: "LED", ports: LED_PINS, icon: LED3D as IconComponent },
  { id: "battery9v", name: "Battery 9V", ports: BATTERY_PINS, icon: Battery9V3D as IconComponent },
  { id: "batteryaa", name: "Battery AA", ports: BATTERY_AA_PINS, icon: BatteryAA3D as IconComponent },
  { id: "diode",   name: "Diode",    ports: DIODE_PINS,    icon: Diode3D   as IconComponent },
  { id: "ledrgb",   name: "LED RGB",   ports: LED_RGB_PINS,   icon: LEDRGB3D  as IconComponent },
  { id: "motordc",     name: "DC Motor",    ports: MOTOR_DC_PINS,     icon: MotorDC3D     as IconComponent },
  { id: "pushbutton",   name: "Push Button",  ports: PUSH_BUTTON_PINS,   icon: PushButton3D   as IconComponent },
  { id: "slideswitch",  name: "Slide Switch",  ports: SLIDE_SWITCH_PINS,  icon: SlideSwitch3D  as IconComponent },
];

let _map: Record<string, ComponentDefinition> | null = null;
export function getComponentMap(): Record<string, ComponentDefinition> {
  if (!_map) _map = Object.fromEntries(COMPONENT_REGISTRY.map((c) => [c.id, c]));
  return _map;
}
