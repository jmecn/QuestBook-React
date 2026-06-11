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

export function questNodeCenter(node: SizedNode): Point {
  const { width, height } = questNodeSize(node)
  const { x, y } = node.internals.positionAbsolute
  return { x: x + width / 2, y: y + height / 2 }
}

export function questNodeRadius(node: SizedNode): number {
  const { width, height } = questNodeSize(node)
  return Math.min(width, height) / 2
}

export function questNodeBorderToward(node: BorderNode, toward: Point): Point {
  const center = questNodeCenter(node)
  const { width, height } = questNodeSize(node)
  const shape = questShapeFromNodeData(node.data)
  return questShapeBorderToward(center, toward, width / 2, height / 2, shape)
}
