import type {
  GlobalSpriteRect,
  IconSpriteRect,
} from '@/shared/types/quest'
import type { ChapterAtlasContext, GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'

export interface ResolvedSprite {
  image: HTMLImageElement
  rect: GlobalSpriteRect | IconSpriteRect
}

const CHAPTER_SPRITE_TIER_FALLBACK = [32, 64, 128, 16] as const

export function resolveSprite(
  spriteId: string | undefined,
  globalAtlas: GlobalAtlasContext | null,
  chapterAtlas: ChapterAtlasContext | null,
): ResolvedSprite | null {
  if (!spriteId) {
    return resolveMissing(globalAtlas)
  }

  if (spriteId.startsWith('chapter:')) {
    return resolveGlobalSprite(spriteId, globalAtlas)
  }

  const fromChapter = resolveChapterSprite(spriteId, chapterAtlas)
  if (fromChapter) return fromChapter

  const fromGlobal = resolveGlobalSprite(spriteId, globalAtlas)
  if (fromGlobal) return fromGlobal

  if (chapterAtlas == null && !isGlobalOnlySprite(spriteId, globalAtlas)) {
    return null
  }

  return resolveMissing(globalAtlas)
}

function isGlobalOnlySprite(
  spriteId: string,
  globalAtlas: GlobalAtlasContext | null,
): boolean {
  return globalAtlas?.meta.sprites[spriteId] != null
}

function resolveGlobalSprite(
  spriteId: string,
  globalAtlas: GlobalAtlasContext | null,
): ResolvedSprite | null {
  if (!globalAtlas) return null
  const rect = globalAtlas.meta.sprites[spriteId]
  if (!rect) return null
  return { image: globalAtlas.image, rect }
}

function resolveChapterSprite(
  spriteId: string,
  chapterAtlas: ChapterAtlasContext | null,
): ResolvedSprite | null {
  if (!chapterAtlas) return null

  let spr = chapterAtlas.iconSprites[spriteId]
  if (!spr) {
    const at = spriteId.lastIndexOf('@')
    if (at > 0) {
      const base = spriteId.slice(0, at)
      for (const tier of CHAPTER_SPRITE_TIER_FALLBACK) {
        const alt = `${base}@${tier}`
        if (alt !== spriteId && chapterAtlas.iconSprites[alt]) {
          spr = chapterAtlas.iconSprites[alt]
          break
        }
      }
    }
  }

  if (!spr) return null
  const image = chapterAtlas.images.get(spr.a)
  if (!image) return null
  return { image, rect: spr }
}

function resolveMissing(globalAtlas: GlobalAtlasContext | null): ResolvedSprite | null {
  if (!globalAtlas) return null
  const missingId = globalAtlas.meta.missingIconId
  return resolveGlobalSprite(missingId, globalAtlas)
}
