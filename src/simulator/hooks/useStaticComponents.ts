/**
 * useStaticComponents reads the local STATIC_COMPONENTS registry and exposes it in the grouped palette shape expected by the simulator UI.
 *
 * Each component's imageSrc is an SVG data URL so Konva can load it without any network dependency.
 */

"use client";

import { useMemo } from "react";
import { RelativePin } from "../types/circuit";
import { STATIC_COMPONENTS, svgToDataUrl, getCapacitorDataUrl, getSphereDataUrls } from "../constants/staticComponents";

// Re-export so ComponentPalette can keep the same import shape
export interface PaletteComponentItem {
  id: string;
  name: string;
  imageSrc: string;
  litImageSrc?: string;
  category: string;
  relativePins: RelativePin[];
  ledColor?: string;
  physicsTopic?: string;
  voltageValue?: number;
  capacitanceValue?: number;
  capacitanceUnit?: string;
  powerVoltageSet?: number;
  powerCurrentLimit?: number;
  powerFrequency?: number;
  viewBoxW: number;
  viewBoxH: number;
}

const HIDDEN_COMPONENTS = ["led_red", "led_blue", "led_white"];

export function useStaticComponents() {
  const components: PaletteComponentItem[] = useMemo(
    () =>
      STATIC_COMPONENTS.filter((def) => !HIDDEN_COMPONENTS.includes(def.id)).map((def) => ({
        id: def.id,
        name: def.name,
        category: def.category,
        imageSrc: def.id === "capacitor"
          ? getCapacitorDataUrl(def.capacitanceValue ?? 1000, def.capacitanceUnit ?? "uF", def.voltageValue ?? 25, false, `palette-${def.id}`)
          : def.id === "sphere_red"
            ? getSphereDataUrls("Copper", false, `palette-${def.id}`).imageSrc
            : svgToDataUrl(def, false, false, `palette-${def.id}`),
        litImageSrc: def.litSvgBody ? svgToDataUrl(def, true, false, `palette-${def.id}`) : undefined,
        ledColor: def.ledColor,
        voltageValue: def.voltageValue,
        capacitanceValue: def.capacitanceValue,
        capacitanceUnit: def.capacitanceUnit,
        powerVoltageSet: def.powerVoltageSet,
        powerCurrentLimit: def.powerCurrentLimit,
        powerFrequency: def.powerFrequency,
        viewBoxW: def.viewBoxW,
        viewBoxH: def.viewBoxH,
        relativePins: def.relativePins.map((p) => ({
          name: p.name,
          relX: p.relX,
          relY: p.relY,
          type: p.type,
        })),
      })),
    []
  );

  const grouped = useMemo(
    () =>
      components.reduce<Record<string, PaletteComponentItem[]>>((acc, c) => {
        (acc[c.category] ??= []).push(c);
        return acc;
      }, {}),
    [components]
  );

  return { components, grouped, loading: false, error: null };
}
