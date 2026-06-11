import { useEffect, useMemo, useState } from 'react'
import { questIconFallbackLabel } from '@/shared/lib/quest-icon-fallback'
import { resolveSpriteWithStatus } from '@/shared/lib/quest-atlas/resolve-sprite'
import { atlasSpriteBackgroundStyle, globalAtlasMaskStyle } from '@/shared/lib/quest-atlas/sprite-mask-style'
import type { ChapterAtlasContext, GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'
import { resolveQuestShapeId } from '@/shared/lib/quest-shape-texture'
import type { IconDisplay } from '@/shared/types/quest'

export interface QuestIconProps {
  display?: IconDisplay
  icon?: string
  shape?: string
  variant?: 'node' | 'tile'
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
  size?: number
  selected?: boolean
  tooltip?: string
  className?: string
}

const ICON_CAROUSEL_MS = 1000

function iconOuterPx(display: IconDisplay | undefined, size: number): number {
  return display?.nodeOuterPx ?? size
}

function iconInnerPx(
  display: IconDisplay | undefined,
  outer: number,
  variant: 'node' | 'tile',
): number {
  if (variant === 'tile') {
    return outer
  }
  return display?.innerPx ?? Math.round(outer * (2 / 3))
}

function carouselSpriteIds(display: IconDisplay | undefined): string[] {
  if (!display) return []
  if (display.frames && display.frames.length > 1) {
    return display.frames.map((frame) => frame.spriteId)
  }
  return [display.spriteId]
}

function QuestIconSprite({
  spriteId,
  displayPx,
  globalAtlas,
  chapterAtlas,
}: {
  spriteId: string
  displayPx: number
  globalAtlas: GlobalAtlasContext | null | undefined
  chapterAtlas: ChapterAtlasContext | null | undefined
}) {
  const resolved = useMemo(
    () => resolveSpriteWithStatus(spriteId, globalAtlas ?? null, chapterAtlas ?? null),
    [chapterAtlas, globalAtlas, spriteId],
  )

  if (resolved.status === 'pending' || !resolved.sprite) return null

  return (
    <span
      className="quest-icon__img quest-icon__sprite"
      style={atlasSpriteBackgroundStyle(resolved.sprite, displayPx)}
      aria-hidden="true"
    />
  )
}

export function QuestIcon({
  display,
  icon,
  size = 32,
  selected = false,
  shape,
  variant = 'node',
  globalAtlas = null,
  chapterAtlas = null,
  tooltip,
  className = '',
}: QuestIconProps) {
  const outerPx = iconOuterPx(display, size)
  const innerPx = iconInnerPx(display, outerPx, variant)
  const shapeId = resolveQuestShapeId(shape)
  const spriteIds = carouselSpriteIds(display)
  const isCarousel = spriteIds.length > 1

  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    setCarouselIndex(0)
  }, [display?.spriteId, display?.frames?.length, outerPx])

  useEffect(() => {
    if (!isCarousel) return undefined
    const timer = window.setInterval(() => {
      setCarouselIndex((value) => (value + 1) % spriteIds.length)
    }, ICON_CAROUSEL_MS)
    return () => window.clearInterval(timer)
  }, [isCarousel, spriteIds.length])

  const activeSpriteId = spriteIds[carouselIndex] ?? display?.spriteId
  const spriteResolution = useMemo(
    () => resolveSpriteWithStatus(activeSpriteId, globalAtlas, chapterAtlas),
    [activeSpriteId, chapterAtlas, globalAtlas],
  )

  const iconState = !display || !activeSpriteId
    ? 'empty'
    : spriteResolution.status === 'pending'
      ? 'loading'
      : spriteResolution.status === 'found'
        ? 'ready'
        : 'missing'

  const shapeBackgroundRect = globalAtlas?.meta.sprites[`${shapeId}:background`]
  const shapeOutlineRect = globalAtlas?.meta.sprites[`${shapeId}:outline`]
  const shapeMaskRect = globalAtlas?.meta.sprites[`${shapeId}:shape`]

  const useFtbShapeLayers = variant === 'node'
    && globalAtlas != null
    && shapeBackgroundRect != null
    && shapeOutlineRect != null

  const occludeRect = shapeMaskRect ?? shapeBackgroundRect
  const fallback = questIconFallbackLabel(icon)

  const shapeClass = !useFtbShapeLayers && shape ? `quest-icon--shape-${shapeId}` : ''
  const classes = [
    'quest-icon',
    variant === 'tile' ? 'quest-icon--tile' : '',
    useFtbShapeLayers ? 'quest-icon--ftb-shape' : '',
    useFtbShapeLayers ? `quest-icon--shape-${shapeId}` : '',
    shapeClass,
    selected ? 'is-selected' : '',
    className,
  ].filter(Boolean).join(' ')

  const tooltipText = tooltip !== undefined ? (tooltip || undefined) : icon

  const innerStyle = { width: innerPx, height: innerPx }

  const itemLayer = iconState === 'ready' && activeSpriteId ? (
    <span className="quest-icon__inner" style={innerStyle}>
      <QuestIconSprite
        spriteId={activeSpriteId}
        displayPx={innerPx}
        globalAtlas={globalAtlas}
        chapterAtlas={chapterAtlas}
      />
    </span>
  ) : null

  const loadingLayer = iconState === 'loading' ? (
    <span className="quest-icon__inner quest-icon__inner--loading" style={innerStyle}>
      <span className="quest-icon__spinner" aria-hidden="true" />
    </span>
  ) : null

  return (
    <span
      className={classes}
      style={{ width: outerPx, height: outerPx }}
      title={tooltipText}
    >
      {useFtbShapeLayers && shapeBackgroundRect && shapeOutlineRect ? (
        <>
          {occludeRect ? (
            <span
              className="quest-icon__shape-layer quest-icon__shape-occlude"
              style={globalAtlasMaskStyle(globalAtlas.meta, occludeRect, outerPx)}
              aria-hidden="true"
            />
          ) : null}
          <span
            className="quest-icon__shape-layer quest-icon__shape-bg"
            style={globalAtlasMaskStyle(globalAtlas.meta, shapeBackgroundRect, outerPx)}
            aria-hidden="true"
          />
          <span
            className="quest-icon__shape-layer quest-icon__shape-outline"
            style={globalAtlasMaskStyle(globalAtlas.meta, shapeOutlineRect, outerPx)}
            aria-hidden="true"
          />
        </>
      ) : null}
      {iconState === 'missing' ? (
        <span className="quest-icon__inner" style={innerStyle}>
          {spriteResolution.sprite ? (
            <span
              className="quest-icon__img quest-icon__sprite"
              style={atlasSpriteBackgroundStyle(spriteResolution.sprite, innerPx)}
              aria-hidden="true"
            />
          ) : (
            <span className="quest-icon__fallback" aria-hidden="true">{fallback}</span>
          )}
        </span>
      ) : null}
      {loadingLayer}
      {itemLayer}
    </span>
  )
}
