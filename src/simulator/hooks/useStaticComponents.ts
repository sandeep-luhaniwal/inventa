/**
 * useStaticComponents reads the local STATIC_COMPONENTS registry and exposes it in the grouped palette shape expected by the simulator UI.
 *
 * Each component's imageSrc is an SVG data URL so Konva can load it without any network dependency.
 */

"use client";

import { useMemo } from "react";
import { RelativePin } from "../types/circuit";
import { STATIC_COMPONENTS, svgToDataUrl } from "../constants/staticComponents";

// Re-export so ComponentPalette can keep the same import shape
export interface PaletteComponentItem {
  id: string;
  name: string;
  imageSrc: string;
  litImageSrc?: string;
  category: string;
  relativePins: RelativePin[];
  ledColor?: string;
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
        imageSrc: svgToDataUrl(def, false),
        litImageSrc: def.litSvgBody ? svgToDataUrl(def, true) : undefined,
        ledColor: def.ledColor,
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
