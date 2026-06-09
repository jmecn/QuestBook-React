type Point = { x: number; y: number }

type SizedNode = {
  measured: { width?: number; height?: number }
  width?: number
  height?: number
  initialWidth?: number
  initialHeight?: number
  internals: { positionAbsolute: Point }
}

export function questNodeSize(node: SizedNode): { width: number; height: number } {
  return {
    width: node.measured.width ?? node.width ?? node.initialWidth ?? 48,
    height: node.measured.height ?? node.height ?? node.initialHeight ?? 48,
  }
}

/**
 * Geometric center of a quest node.
 *
 * With {@code nodeOrigin=[0.5,0.5]}, {@code node.position} is the center but
 * {@code internals.positionAbsolute} is always the top-left of the node box.
 */
export function questNodeCenter(node: SizedNode): Point {
  const { width, height } = questNodeSize(node)
  const { x, y } = node.internals.positionAbsolute
  return { x: x + width / 2, y: y + height / 2 }
}

/** Quest nodes are circular; radius is half the measured box. */
export function questNodeRadius(node: SizedNode): number {
  const { width, height } = questNodeSize(node)
  return Math.min(width, height) / 2
}

/** Point on the circle border along the ray from center toward another point. */
export function circleBorderToward(center: Point, toward: Point, radius: number): Point {
  const dx = toward.x - center.x
  const dy = toward.y - center.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-6) return { ...center }
  const scale = radius / len
  return { x: center.x + dx * scale, y: center.y + dy * scale }
}
