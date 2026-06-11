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

export type SpriteResolveStatus = 'pending' | 'found' | 'missing'

export interface SpriteResolveResult {
  status: SpriteResolveStatus
  sprite: ResolvedSprite | null
}

export function isGlobalAtlasSprite(
  spriteId: string,
  globalAtlas: GlobalAtlasContext | null,
): boolean {
  return spriteId.startsWith('chapter:') || globalAtlas?.meta.sprites[spriteId] != null
}

/** 章图集 sprite；global 未就绪或章图集未加载时应保持 pending，不得 fallback 到 missing。 */
export function needsChapterAtlasSprite(
  spriteId: string,
  globalAtlas: GlobalAtlasContext | null,
): boolean {
  return !isGlobalAtlasSprite(spriteId, globalAtlas)
}

export function resolveSpriteWithStatus(
  spriteId: string | undefined,
  globalAtlas: GlobalAtlasContext | null,
  chapterAtlas: ChapterAtlasContext | null,
): SpriteResolveResult {
  if (!spriteId) {
    if (!globalAtlas) return { status: 'pending', sprite: null }
    return { status: 'missing', sprite: resolveMissing(globalAtlas) }
  }

  if (spriteId.startsWith('chapter:')) {
    const fromGlobal = resolveGlobalSprite(spriteId, globalAtlas)
    if (fromGlobal) return { status: 'found', sprite: fromGlobal }
    return globalAtlas
      ? { status: 'missing', sprite: resolveMissing(globalAtlas) }
      : { status: 'pending', sprite: null }
  }

  const fromChapter = resolveChapterSprite(spriteId, chapterAtlas)
  if (fromChapter) return { status: 'found', sprite: fromChapter }

  const fromGlobal = resolveGlobalSprite(spriteId, globalAtlas)
  if (fromGlobal) return { status: 'found', sprite: fromGlobal }

  if (needsChapterAtlasSprite(spriteId, globalAtlas)) {
    if (globalAtlas == null || chapterAtlas == null) {
      return { status: 'pending', sprite: null }
    }
  } else if (globalAtlas == null) {
    return { status: 'pending', sprite: null }
  }

  return {
    status: 'missing',
    sprite: resolveMissing(globalAtlas),
  }
}

export function resolveSprite(
  spriteId: string | undefined,
  globalAtlas: GlobalAtlasContext | null,
  chapterAtlas: ChapterAtlasContext | null,
): ResolvedSprite | null {
  const result = resolveSpriteWithStatus(spriteId, globalAtlas, chapterAtlas)
  if (result.status === 'pending') return null
  return result.sprite
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
