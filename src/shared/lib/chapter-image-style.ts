import type { ChapterImage } from '@/shared/types/quest'
import { gridToPx } from '@/shared/lib/quest-text'

export const DEFAULT_CHAPTER_GROUP_ID = '0000000000000000'

export const FTB_COLOR4I_WHITE_RGB = 0xffffff

export const MINECRAFT_DEFAULT_FRAME_TIME = 2

export interface ChapterImagePaint {
  mediaOpacity?: number
  tintRgb?: string
  tintOpacity?: number
}

export function isAnimatedChapterImage(image: ChapterImage): boolean {
  return Boolean(image.animated && image.frameCount && image.frameCount > 1)
}

export function chapterImagePaint(image: ChapterImage): ChapterImagePaint | undefined {
  const alpha = image.alpha ?? 255
  const hasTint = image.color != null && image.color !== FTB_COLOR4I_WHITE_RGB
  const hasAlpha = alpha < 255
  if (!hasTint && !hasAlpha) {
    return undefined
  }

  const a = Math.max(0, Math.min(1, alpha / 255))

  if (!hasTint) {
    return { mediaOpacity: a }
  }

  const rgb = image.color ?? FTB_COLOR4I_WHITE_RGB
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = rgb & 0xff
  return {
    tintRgb: `rgb(${r}, ${g}, ${b})`,
    tintOpacity: a,
  }
}

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

export function sortedChapterImages(images: ChapterImage[] | undefined): ChapterImage[] {
  if (!images?.length) {
    return []
  }
  return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
