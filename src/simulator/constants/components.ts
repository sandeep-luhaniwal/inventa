import { Pin } from "../types/circuit";

export type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export interface ComponentDefinition {
  id: string;
  name: string;
  ports: Pin[];
}

/**
 * Minimal registry used only by BomView to look up human-readable names.
 * Visual assets are resolved through the local static component registry.
 */
export const COMPONENT_REGISTRY: ComponentDefinition[] = [];

let _map: Record<string, ComponentDefinition> | null = null;
export function getComponentMap(): Record<string, ComponentDefinition> {
  if (!_map) _map = Object.fromEntries(COMPONENT_REGISTRY.map((c) => [c.id, c]));
  return _map;
}

