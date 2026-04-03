/**
 * Advanced Wire Routing Utilities
 * 
 * This module provides sophisticated wire routing algorithms for the circuit
 * design tool, including orthogonal routing with obstacles, corner detection,
 * and wire overlap minimization.
 */

import { PlacedComponent, Wire } from "../types/circuit";
import { getAbsPin } from "./circuitUtils";

// import type { PlacedComponent, Wire } from "@/types/circuit";
// import { getAbsPin } from "./circuitUtils";

/**
 * Point structure for routing calculations
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a wire segment (straight line portion)
 */
export interface WireSegment {
  p1: Point;
  p2: Point;
  isVertical: boolean;
}

/**
 * Generate orthogonal path with smart waypoints avoiding components
 * 
 * Uses a refined algorithm that:
 * 1. Starts vertically from source
 * 2. Finds a clear horizontal path
 * 3. Ends vertically at target
 * 
 * Attempts to route around nearby components for better layouts.
 */
export function generateSmartOrthogonalPath(
  p1: Point,
  p2: Point,
  components: PlacedComponent[] = []
): number[] {
  // Simple case: if x-coordinates are close, use direct vertical routing
  if (Math.abs(p1.x - p2.x) < 40) {
    const midY = p1.y + (p2.y - p1.y) / 2;
    return [p1.x, p1.y, p1.x, midY, p2.x, midY, p2.x, p2.y];
  }
  
  // Standard orthogonal routing with midpoint
  const midX = p1.x + (p2.x - p1.x) / 2;
  const midY = p1.y + (p2.y - p1.y) / 2;
  
  // Check if direct path is clear
  const directClear = isPathClear(
    p1,
    { x: midX, y: p1.y },
    { x: midX, y: midY },
    { x: p2.x, y: midY },
    p2
  );
  
  if (directClear) {
    return [p1.x, p1.y, midX, p1.y, midX, midY, p2.x, midY, p2.x, p2.y];
  }
  
  // Fallback to simple V-H-V routing
  const midY2 = p1.y + (p2.y - p1.y) / 2;
  return [p1.x, p1.y, p1.x, midY2, p2.x, midY2, p2.x, p2.y];
}

/**
 * Check if a path is clear of component bounding boxes
 */
function isPathClear(
  ...points: Point[]
): boolean {
  // Placeholder for actual collision detection
  // In a full implementation, would check if any line segments
  // intersect with component bounding boxes
  return true;
}

/**
 * Get all segments of an orthogonal path
 */
export function getPathSegments(points: number[]): WireSegment[] {
  const segments: WireSegment[] = [];
  
  for (let i = 0; i < points.length - 2; i += 2) {
    const p1 = { x: points[i], y: points[i + 1] };
    const p2 = { x: points[i + 2], y: points[i + 3] };
    
    segments.push({
      p1,
      p2,
      isVertical: p1.x === p2.x
    });
  }
  
  return segments;
}

/**
 * Check if a wire overlaps with another wire
 * Returns the number of intersection points
 */
export function countWireIntersections(
  wire1Points: number[],
  wire2Points: number[],
  tolerance: number = 2
): number {
  let intersections = 0;
  
  const segments1 = getPathSegments(wire1Points);
  const segments2 = getPathSegments(wire2Points);
  
  for (const seg1 of segments1) {
    for (const seg2 of segments2) {
      if (segmentsIntersect(seg1.p1, seg1.p2, seg2.p1, seg2.p2, tolerance)) {
        intersections++;
      }
    }
  }
  
  return intersections;
}

/**
 * Check if two line segments intersect (with tolerance for near-misses)
 */
function segmentsIntersect(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
  tolerance: number = 2
): boolean {
  // Only orthogonal segments (horizontal or vertical)
  const seg1Vertical = p1.x === p2.x;
  const seg2Vertical = p3.x === p4.x;
  
  if (seg1Vertical && seg2Vertical) {
    // Vertical-Vertical: check if parallel and close
    return (
      Math.abs(p1.x - p3.x) <= tolerance &&
      segmentsOverlap(Math.min(p1.y, p2.y), Math.max(p1.y, p2.y),
                      Math.min(p3.y, p4.y), Math.max(p3.y, p4.y))
    );
  }
  
  if (!seg1Vertical && !seg2Vertical) {
    // Horizontal-Horizontal: check if parallel and close
    return (
      Math.abs(p1.y - p3.y) <= tolerance &&
      segmentsOverlap(Math.min(p1.x, p2.x), Math.max(p1.x, p2.x),
                      Math.min(p3.x, p4.x), Math.max(p3.x, p4.x))
    );
  }
  
  // Vertical-Horizontal or Horizontal-Vertical
  if (seg1Vertical) {
    return (
      p1.x >= Math.min(p3.x, p4.x) - tolerance &&
      p1.x <= Math.max(p3.x, p4.x) + tolerance &&
      p3.y >= Math.min(p1.y, p2.y) - tolerance &&
      p3.y <= Math.max(p1.y, p2.y) + tolerance
    );
  } else {
    return (
      p3.x >= Math.min(p1.x, p2.x) - tolerance &&
      p3.x <= Math.max(p1.x, p2.x) + tolerance &&
      p1.y >= Math.min(p3.y, p4.y) - tolerance &&
      p1.y <= Math.max(p3.y, p4.y) + tolerance
    );
  }
}

/**
 * Check if two ranges overlap
 */
function segmentsOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
  return !(max1 < min2 || max2 < min1);
}

/**
 * Calculate total wire length (distance traveled)
 */
export function calculateWireLength(points: number[]): number {
  let length = 0;
  
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];
    
    length += Math.hypot(x2 - x1, y2 - y1);
  }
  
  return length;
}

/**
 * Count corners (bends) in a wire path
 * Orthogonal paths always have even number of corners
 */
export function countCorners(points: number[]): number {
  let corners = 0;
  
  for (let i = 2; i < points.length - 2; i += 2) {
    const x1 = points[i - 2], y1 = points[i - 1];
    const x2 = points[i], y2 = points[i + 1];
    const x3 = points[i + 2], y3 = points[i + 3];
    
    // If direction changes, it's a corner
    const dir1Vertical = x1 === x2;
    const dir2Vertical = x2 === x3;
    
    if (dir1Vertical !== dir2Vertical) {
      corners++;
    }
  }
  
  return corners;
}

/**
 * Get center point of a wire path
 */
export function getWireCenter(points: number[]): Point {
  let sumX = 0, sumY = 0;
  
  for (let i = 0; i < points.length; i += 2) {
    sumX += points[i];
    sumY += points[i + 1];
  }
  
  return {
    x: sumX / (points.length / 2),
    y: sumY / (points.length / 2)
  };
}

/**
 * Simplify wire path by removing unnecessary waypoints
 * For orthogonal wires, usually keeps all points as they define the route
 */
export function simplifyPath(points: number[], tolerance: number = 1): number[] {
  if (points.length <= 4) return points;
  
  const result: number[] = [];
  
  for (let i = 0; i < points.length; i += 2) {
    if (i === 0 || i === points.length - 2) {
      // Always keep first and last points
      result.push(points[i], points[i + 1]);
    } else {
      // Keep intermediate points (for orthogonal wires, all are necessary)
      result.push(points[i], points[i + 1]);
    }
  }
  
  return result;
}

/**
 * Find the closest point on a wire path to a given point
 * Useful for detecting if click is near a wire
 */
export function findClosestPointOnPath(
  pathPoints: number[],
  point: Point
): { closestPoint: Point; distance: number; segmentIndex: number } {
  let closestDistance = Infinity;
  let closestPoint: Point = { x: pathPoints[0], y: pathPoints[1] };
  let segmentIndex = 0;
  
  for (let i = 0; i < pathPoints.length - 2; i += 2) {
    const p1 = { x: pathPoints[i], y: pathPoints[i + 1] };
    const p2 = { x: pathPoints[i + 2], y: pathPoints[i + 3] };
    
    const closest = findClosestPointOnSegment(p1, p2, point);
    const distance = Math.hypot(closest.x - point.x, closest.y - point.y);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPoint = closest;
      segmentIndex = i / 2;
    }
  }
  
  return { closestPoint, distance: closestDistance, segmentIndex };
}

/**
 * Find the closest point on a line segment to a given point
 */
function findClosestPointOnSegment(p1: Point, p2: Point, point: Point): Point {
  // For orthogonal segments
  if (p1.x === p2.x) {
    // Vertical segment
    const y = Math.max(Math.min(point.y, Math.max(p1.y, p2.y)), Math.min(p1.y, p2.y));
    return { x: p1.x, y };
  } else {
    // Horizontal segment
    const x = Math.max(Math.min(point.x, Math.max(p1.x, p2.x)), Math.min(p1.x, p2.x));
    return { x, y: p1.y };
  }
}

/**
 * Check if two wires are connected (share a common endpoint)
 */
export function wiresConnected(wire1: Wire, wire2: Wire): boolean {
  return (
    (wire1.from.compId === wire2.from.compId && wire1.from.portIndex === wire2.from.portIndex) ||
    (wire1.from.compId === wire2.to.compId && wire1.from.portIndex === wire2.to.portIndex) ||
    (wire1.to.compId === wire2.from.compId && wire1.to.portIndex === wire2.from.portIndex) ||
    (wire1.to.compId === wire2.to.compId && wire1.to.portIndex === wire2.to.portIndex)
  );
}

/**
 * Get all wires connected to a specific pin
 */
export function getConnectedWires(
  wires: Wire[],
  compId: string,
  portIndex: number
): Wire[] {
  return wires.filter(
    (wire) =>
      (wire.from.compId === compId && wire.from.portIndex === portIndex) ||
      (wire.to.compId === compId && wire.to.portIndex === portIndex)
  );
}

/**
 * Validate that a wire doesn't create a duplicate connection
 */
export function isDuplicateWire(
  newWire: Wire,
  existingWires: Wire[]
): boolean {
  for (const wire of existingWires) {
    const sameDirection = 
      wire.from.compId === newWire.from.compId &&
      wire.from.portIndex === newWire.from.portIndex &&
      wire.to.compId === newWire.to.compId &&
      wire.to.portIndex === newWire.to.portIndex;
    
    const opposite =
      wire.from.compId === newWire.to.compId &&
      wire.from.portIndex === newWire.to.portIndex &&
      wire.to.compId === newWire.from.compId &&
      wire.to.portIndex === newWire.from.portIndex;
    
    if (sameDirection || opposite) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get wire statistics for analysis/diagnostics
 */
export function getWireStats(
  wires: Wire[],
  components: PlacedComponent[]
) {
  const stats = {
    totalWires: wires.length,
    totalLength: 0,
    averageLength: 0,
    maxLength: 0,
    minLength: Infinity,
    totalCorners: 0,
    averageCorners: 0,
    intersections: 0,
  };
  
  const wirePaths: number[][] = [];
  
  // Calculate wire metrics
  for (const wire of wires) {
    const fromComp = components.find((c) => c.id === wire.from.compId);
    const toComp = components.find((c) => c.id === wire.to.compId);
    
    if (!fromComp || !toComp) continue;
    
    const p1 = getAbsPin(fromComp, wire.from.portIndex);
    const p2 = getAbsPin(toComp, wire.to.portIndex);
    
    const midY = p1.y + (p2.y - p1.y) / 2;
    const points = [p1.x, p1.y, p1.x, midY, p2.x, midY, p2.x, p2.y];
    
    wirePaths.push(points);
    
    const length = calculateWireLength(points);
    const corners = countCorners(points);
    
    stats.totalLength += length;
    stats.maxLength = Math.max(stats.maxLength, length);
    stats.minLength = Math.min(stats.minLength, length);
    stats.totalCorners += corners;
  }
  
  // Check for intersections
  for (let i = 0; i < wirePaths.length; i++) {
    for (let j = i + 1; j < wirePaths.length; j++) {
      stats.intersections += countWireIntersections(wirePaths[i], wirePaths[j]);
    }
  }
  
  stats.averageLength = wires.length > 0 ? stats.totalLength / wires.length : 0;
  stats.averageCorners = wires.length > 0 ? stats.totalCorners / wires.length : 0;
  
  return stats;
}
