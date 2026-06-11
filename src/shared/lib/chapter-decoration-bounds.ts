import { chapterImageLayout } from '@/shared/lib/chapter-image-style'
import type { ChapterImage } from '@/shared/types/quest'

export interface ChapterDecorationBounds {
  minX: number
  minY: number
  widthPx: number
  heightPx: number
  centerX: number
  centerY: number
}

/** Pixel bounds covering all chapter decoration rects (flow coordinates). */
export function chapterDecorationBounds(
  images: ChapterImage[],
  gridScale: number,
): ChapterDecorationBounds | null {
  if (!images.length) {
    return null
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const image of images) {
    const { x, y, widthPx, heightPx } = chapterImageLayout(image, gridScale)
    const left = x - widthPx / 2
    const top = y - heightPx / 2
    minX = Math.min(minX, left)
    minY = Math.min(minY, top)
    maxX = Math.max(maxX, left + widthPx)
    maxY = Math.max(maxY, top + heightPx)
  }

  const widthPx = Math.max(1, Math.ceil(maxX - minX))
  const heightPx = Math.max(1, Math.ceil(maxY - minY))
  return {
    minX,
    minY,
    widthPx,
    heightPx,
    centerX: minX + widthPx / 2,
    centerY: minY + heightPx / 2,
  }
}
