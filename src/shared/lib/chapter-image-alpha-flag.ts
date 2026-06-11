import type { ChapterImage } from '@/shared/types/quest'

export function isChapterImageAlphaEnabled(): boolean {
  return window.__CHAPTER_IMAGE_ALPHA__ === true
}

export function chapterImageCanvasAlpha(image: ChapterImage): number {
  if (!isChapterImageAlphaEnabled()) {
    return 1
  }
  const alpha = image.alpha ?? 255
  return Math.max(0, Math.min(1, alpha / 255))
}
