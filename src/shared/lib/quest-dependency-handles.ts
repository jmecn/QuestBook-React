import {
  questShapeBorderToward,
  questShapeFromNodeData,
} from '@/shared/lib/quest-shape-border'

type Point = { x: number; y: number }

type BorderNode = SizedNode & { data?: unknown }

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

/** @deprecated Prefer {@link questNodeBorderToward} for shape-aware clipping. */
export function questNodeRadius(node: SizedNode): number {
  const { width, height } = questNodeSize(node)
  return Math.min(width, height) / 2
}

/** Point on the node shape border along the ray from center toward another node. */
export function questNodeBorderToward(node: BorderNode, toward: Point): Point {
  const center = questNodeCenter(node)
  const { width, height } = questNodeSize(node)
  const shape = questShapeFromNodeData(node.data)
  return questShapeBorderToward(center, toward, width / 2, height / 2, shape)
}
