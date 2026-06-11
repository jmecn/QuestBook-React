import { sortedChapterImages } from '@/shared/lib/chapter-image-style'
import type { ChapterImage } from '@/shared/types/quest'

export type ChapterDecorationDrawOp = {
  order: number
  image: ChapterImage
}

export function planChapterDecorationDraws(
  images: ChapterImage[] | undefined,
): ChapterDecorationDrawOp[] {
  return sortedChapterImages(images)
    .filter((image) => Boolean(image.baked))
    .map((image) => ({ order: image.order ?? 0, image }))
    .sort((a, b) => a.order - b.order)
}
