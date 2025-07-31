// Camera utilities for smooth movement and constraints

export interface CameraConstraints {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZoom: number;
  maxZoom: number;
}

export function clampCamera(
  x: number,
  y: number,
  zoom: number,
  constraints: CameraConstraints,
): { x: number; y: number; zoom: number } {
  // Ensure values are valid numbers
  const safeX = isNaN(x) ? constraints.minX : x;
  const safeY = isNaN(y) ? constraints.minY : y;
  const safeZoom = isNaN(zoom) ? 1 : zoom;

  return {
    x: Math.max(constraints.minX, Math.min(constraints.maxX, safeX)),
    y: Math.max(constraints.minY, Math.min(constraints.maxY, safeY)),
    zoom: Math.max(
      constraints.minZoom,
      Math.min(constraints.maxZoom, safeZoom),
    ),
  };
}

export function smoothCameraMovement(
  current: { x: number; y: number; zoom: number },
  target: { x: number; y: number; zoom: number },
  deltaTime: number,
  speed: number = 5,
): { x: number; y: number; zoom: number } {
  const factor = 1 - Math.exp((-speed * deltaTime) / 1000);

  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
    zoom: current.zoom + (target.zoom - current.zoom) * factor,
  };
}

export function getDistanceBetweenPoints(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getMidpoint(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}
