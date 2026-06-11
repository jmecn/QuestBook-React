import { resolveQuestShapeId } from '@/shared/lib/quest-shape-texture'

type Point = { x: number; y: number }

function raySegmentIntersect(
  origin: Point,
  dir: Point,
  a: Point,
  b: Point,
): number | null {
  const segX = b.x - a.x
  const segY = b.y - a.y
  const denom = dir.x * segY - dir.y * segX
  if (Math.abs(denom) < 1e-9) return null
  const ox = a.x - origin.x
  const oy = a.y - origin.y
  const t = (ox * segY - oy * segX) / denom
  const u = (ox * dir.y - oy * dir.x) / denom
  if (t < 1e-9 || u < 0 || u > 1) return null
  return t
}

function polygonBorderToward(
  center: Point,
  toward: Point,
  vertices: Point[],
): Point {
  const dx = toward.x - center.x
  const dy = toward.y - center.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return { ...center }
  const dir = { x: dx / len, y: dy / len }
  const origin = { x: 0, y: 0 }

  let best = Infinity
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!
    const b = vertices[(i + 1) % vertices.length]!
    const t = raySegmentIntersect(origin, dir, a, b)
    if (t != null && t < best) best = t
  }

  if (!Number.isFinite(best)) {
    const { halfW, halfH } = verticesMaxHalf(vertices)
    return rectBorderToward(center, toward, halfW, halfH)
  }
  return { x: center.x + dir.x * best, y: center.y + dir.y * best }
}

function verticesMaxHalf(vertices: Point[]): { halfW: number; halfH: number } {
  let halfW = 0
  let halfH = 0
  for (const v of vertices) {
    halfW = Math.max(halfW, Math.abs(v.x))
    halfH = Math.max(halfH, Math.abs(v.y))
  }
  return { halfW: halfW || 1, halfH: halfH || 1 }
}

function scalePolygon(points: Array<[number, number]>, halfW: number, halfH: number): Point[] {
  return points.map(([nx, ny]) => ({ x: nx * halfW, y: ny * halfH }))
}

function hexagonVertices(halfW: number, halfH: number): Point[] {
  const s = Math.min(halfW, halfH)
  const w = (Math.sqrt(3) / 2) * s
  return scalePolygon([
    [0, -s],
    [w, -s / 2],
    [w, s / 2],
    [0, s],
    [-w, s / 2],
    [-w, -s / 2],
  ], 1, 1)
}

function octagonVertices(halfW: number, halfH: number): Point[] {
  const s = Math.min(halfW, halfH)
  const a = s * (Math.SQRT2 - 1)
  return [
    { x: a, y: -s },
    { x: s, y: -a },
    { x: s, y: a },
    { x: a, y: s },
    { x: -a, y: s },
    { x: -s, y: a },
    { x: -s, y: -a },
    { x: -a, y: -s },
  ]
}

function pentagonVertices(halfW: number, halfH: number): Point[] {
  const s = Math.min(halfW, halfH)
  const points: Point[] = []
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / 5
    points.push({ x: Math.cos(angle) * s, y: Math.sin(angle) * s })
  }
  return points
}

function circleBorderToward(center: Point, toward: Point, radius: number): Point {
  const dx = toward.x - center.x
  const dy = toward.y - center.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return { ...center }
  const scale = radius / len
  return { x: center.x + dx * scale, y: center.y + dy * scale }
}

function rectBorderToward(center: Point, toward: Point, halfW: number, halfH: number): Point {
  const dx = toward.x - center.x
  const dy = toward.y - center.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  if (adx < 1e-9 && ady < 1e-9) return { ...center }
  const t = Math.min(halfW / adx, halfH / ady)
  return { x: center.x + dx * t, y: center.y + dy * t }
}

function diamondBorderToward(center: Point, toward: Point, halfW: number, halfH: number): Point {
  const dx = toward.x - center.x
  const dy = toward.y - center.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  if (adx < 1e-9 && ady < 1e-9) return { ...center }
  const t = 1 / (adx / halfW + ady / halfH)
  return { x: center.x + dx * t, y: center.y + dy * t }
}

export function questShapeBorderToward(
  center: Point,
  toward: Point,
  halfW: number,
  halfH: number,
  shape?: string | null,
): Point {
  const shapeId = resolveQuestShapeId(shape)

  switch (shapeId) {
    case 'square':
    case 'rsquare':
      return rectBorderToward(center, toward, halfW, halfH)
    case 'diamond':
      return diamondBorderToward(center, toward, halfW, halfH)
    case 'hexagon':
      return polygonBorderToward(center, toward, hexagonVertices(halfW, halfH))
    case 'octagon':
      return polygonBorderToward(center, toward, octagonVertices(halfW, halfH))
    case 'pentagon':
      return polygonBorderToward(center, toward, pentagonVertices(halfW, halfH))
    case 'heart':
      return circleBorderToward(center, toward, Math.min(halfW, halfH) * 0.9)
    case 'gear':
      return circleBorderToward(center, toward, Math.min(halfW, halfH))
    case 'none':
      return { ...center }
    case 'circle':
    default:
      return circleBorderToward(center, toward, Math.min(halfW, halfH))
  }
}

export function questShapeFromNodeData(data: unknown): string | undefined {
  if (typeof data !== 'object' || data == null || !('quest' in data)) {
    return undefined
  }
  const quest = (data as { quest?: { shape?: string } }).quest
  return quest?.shape
}
