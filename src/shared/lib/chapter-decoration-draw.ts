import { chapterImageLayout, sortedChapterImages } from '@/shared/lib/chapter-image-style'
import type { ChapterDecorationBounds } from '@/shared/lib/chapter-decoration-bounds'
import type { ChapterImage } from '@/shared/types/quest'

export type ChapterDecorationPatternOp = {
  type: 'pattern'
  order: number
  images: ChapterImage[]
  /** Union rect in canvas-local pixels. */
  left: number
  top: number
  widthPx: number
  heightPx: number
  tileWidthPx: number
  tileHeightPx: number
  baked: string
}

export type ChapterDecorationSingleOp = {
  type: 'single'
  order: number
  image: ChapterImage
}

export type ChapterDecorationDrawOp = ChapterDecorationPatternOp | ChapterDecorationSingleOp

function decorationGroupKey(image: ChapterImage): string {
  const rotation = image.rotation ?? 0
  return [
    image.baked ?? image.image,
    image.width,
    image.height,
    rotation,
    image.animated ? 'a' : 's',
  ].join('|')
}

function unionRect(
  images: ChapterImage[],
  gridScale: number,
  bounds: ChapterDecorationBounds,
): Pick<ChapterDecorationPatternOp, 'left' | 'top' | 'widthPx' | 'heightPx' | 'tileWidthPx' | 'tileHeightPx'> | null {
  if (!images.length) return null
  const first = chapterImageLayout(images[0]!, gridScale)
  let minLeft = Number.POSITIVE_INFINITY
  let minTop = Number.POSITIVE_INFINITY
  let maxRight = Number.NEGATIVE_INFINITY
  let maxBottom = Number.NEGATIVE_INFINITY

  for (const image of images) {
    const { x, y, widthPx, heightPx } = chapterImageLayout(image, gridScale)
    const left = x - widthPx / 2 - bounds.minX
    const top = y - heightPx / 2 - bounds.minY
    minLeft = Math.min(minLeft, left)
    minTop = Math.min(minTop, top)
    maxRight = Math.max(maxRight, left + widthPx)
    maxBottom = Math.max(maxBottom, top + heightPx)
  }

  return {
    left: minLeft,
    top: minTop,
    widthPx: Math.max(1, Math.ceil(maxRight - minLeft)),
    heightPx: Math.max(1, Math.ceil(maxBottom - minTop)),
    tileWidthPx: first.widthPx,
    tileHeightPx: first.heightPx,
  }
}

/**
 * Plan chapter decoration draws. Identical tiles (same baked asset + size) merge into one
 * repeating pattern fill so overlap regions do not stack alpha like DOM/canvas source-over.
 */
export function planChapterDecorationDraws(
  images: ChapterImage[] | undefined,
  gridScale: number,
  bounds: ChapterDecorationBounds,
): ChapterDecorationDrawOp[] {
  const sorted = sortedChapterImages(images)
  const groups = new Map<string, ChapterImage[]>()

  for (const image of sorted) {
    if (!image.baked) continue
    const key = decorationGroupKey(image)
    const bucket = groups.get(key) ?? []
    bucket.push(image)
    groups.set(key, bucket)
  }

  const ops: ChapterDecorationDrawOp[] = []

  for (const [, group] of groups) {
    const sample = group[0]!
    const order = Math.min(...group.map((image) => image.order ?? 0))
    const canPattern = group.length >= 2 && (sample.rotation ?? 0) === 0
    if (canPattern) {
      const rect = unionRect(group, gridScale, bounds)
      if (rect) {
        ops.push({
          type: 'pattern',
          order,
          images: group,
          baked: sample.baked!,
          ...rect,
        })
        continue
      }
    }
    for (const image of group) {
      ops.push({ type: 'single', order: image.order ?? 0, image })
    }
  }

  return ops.sort((a, b) => a.order - b.order)
}
