import type { CSSProperties } from 'react'
import type { ChapterImage } from '@/shared/types/quest'
import { gridToPx } from '@/shared/lib/quest-text'

/** FTB default chapter group — chapters render without a group heading. */
export const DEFAULT_CHAPTER_GROUP_ID = '0000000000000000'

export function chapterImageOpacity(alpha?: number): number {
  if (alpha == null || Number.isNaN(alpha)) {
    return 1
  }
  return Math.max(0, Math.min(1, alpha / 255))
}

export function chapterImageRgb(color?: number): { r: number; g: number; b: number } | null {
  if (color == null) {
    return null
  }
  return {
    r: (color >> 16) & 0xff,
    g: (color >> 8) & 0xff,
    b: color & 0xff,
  }
}

/**
 * Node position for React Flow {@code nodeOrigin=[0.5,0.5]} (center of decoration rect).
 */
export function chapterImageLayout(image: ChapterImage, gridScale: number) {
  const widthPx = gridToPx(image.width, gridScale)
  const heightPx = gridToPx(image.height, gridScale)
  const anchorX = gridToPx(image.x, gridScale)
  const anchorY = gridToPx(image.y, gridScale)

  if (image.alignToCorner) {
    return {
      x: anchorX + widthPx / 2,
      y: anchorY + heightPx / 2,
      widthPx,
      heightPx,
    }
  }

  return {
    x: anchorX,
    y: anchorY,
    widthPx,
    heightPx,
  }
}

export function chapterImageTransformOrigin(alignToCorner?: boolean): string {
  return alignToCorner ? 'top left' : 'center center'
}

export function chapterImageSpriteVars(image: ChapterImage): CSSProperties | undefined {
  if (!image.animated || !image.frameCount || image.frameCount <= 1) {
    return undefined
  }

  const frameWidth = image.frameWidth ?? 16
  const frameHeight = image.frameHeight ?? frameWidth
  const frameCount = image.frameCount
  const durationSec = Math.max(0.8, frameCount / 20)

  return {
    ['--chapter-sprite-fw' as string]: `${frameWidth}px`,
    ['--chapter-sprite-fh' as string]: `${frameHeight}px`,
    ['--chapter-sprite-frames' as string]: String(frameCount - 1),
    ['--chapter-sprite-duration' as string]: `${durationSec}s`,
    ['--chapter-sprite-shift' as string]: `${-(frameCount - 1) * frameHeight}px`,
  }
}

export function sortedChapterImages(images: ChapterImage[] | undefined): ChapterImage[] {
  if (!images?.length) {
    return []
  }
  return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
