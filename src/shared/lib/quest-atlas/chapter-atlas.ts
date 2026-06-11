import { questExportUrl } from '@/shared/lib/site-base'
import type { ChapterData } from '@/shared/types/quest'
import { loadImageCached } from '@/shared/lib/quest-atlas/load-image'
import type { ChapterAtlasContext } from '@/shared/lib/quest-atlas/types'

const chapterCache = new Map<string, Promise<ChapterAtlasContext | null>>()

export async function loadChapterAtlasContext(
  chapter: ChapterData,
): Promise<ChapterAtlasContext | null> {
  if (!chapter.iconAtlases || !chapter.iconSprites) {
    return null
  }

  const cacheKey = chapter.filename
  const existing = chapterCache.get(cacheKey)
  if (existing) return existing

  const promise = (async () => {
    const images = new Map<string, HTMLImageElement>()
    const pages = Object.entries(chapter.iconAtlases ?? {})
    await Promise.all(
      pages.map(async ([pageKey, page]) => {
        const image = await loadImageCached(questExportUrl(page.src))
        images.set(pageKey, image)
      }),
    )
    return {
      iconAtlases: chapter.iconAtlases!,
      iconSprites: chapter.iconSprites!,
      images,
    }
  })()

  chapterCache.set(cacheKey, promise)
  return promise
}
