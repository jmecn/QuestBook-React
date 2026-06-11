import { useEffect, useMemo, useState } from 'react'
import { questItemIconUrl } from '@/shared/lib/quest-item-icon'
import {
  questExportIconCandidates,
  questIconFallbackLabel,
} from '@/shared/lib/quest-icon'
import {
  questShapeTextureUrl,
  resolveQuestShapeId,
} from '@/shared/lib/quest-shape-texture'

export interface QuestIconProps {
  icon?: string
  iconItems?: string[]
  size?: number
  shape?: string

  variant?: 'node' | 'tile'

  tooltip?: string
  selected?: boolean
  className?: string
}

const ICON_CAROUSEL_MS = 1000

export function QuestIcon({
  icon,
  iconItems,
  size = 32,
  selected = false,
  shape,
  variant = 'node',
  tooltip,
  className = '',
}: QuestIconProps) {
  const exportCandidates = useMemo(
    () => questExportIconCandidates(icon, iconItems),
    [icon, iconItems],
  )
  const carouselUrls = useMemo(() => {
    if (!iconItems || iconItems.length <= 1) return []
    const urls = iconItems
      .map((itemId) => questItemIconUrl(itemId))
      .filter((url): url is string => url != null)
    return urls.length > 1 ? urls : []
  }, [iconItems])

  const shapeId = resolveQuestShapeId(shape)
  const shapeBackgroundUrl = useMemo(
    () => (variant === 'node' ? questShapeTextureUrl(shapeId, 'background') : null),
    [shapeId, variant],
  )
  const shapeOutlineUrl = useMemo(
    () => (variant === 'node' ? questShapeTextureUrl(shapeId, 'outline') : null),
    [shapeId, variant],
  )
  const shapeMaskUrl = useMemo(
    () => (variant === 'node' ? questShapeTextureUrl(shapeId, 'shape') : null),
    [shapeId, variant],
  )

  const [exportIndex, setExportIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [failed, setFailed] = useState(false)
  const [shapeLayersFailed, setShapeLayersFailed] = useState(false)
  const [occludeMaskUrl, setOccludeMaskUrl] = useState<string | null>(null)

  const exportSrc = carouselUrls.length > 0
    ? carouselUrls[carouselIndex]
    : exportCandidates[exportIndex]

  const fallback = questIconFallbackLabel(icon)
  const isCarousel = carouselUrls.length > 1
  const useFtbShapeLayers = variant === 'node'
    && !shapeLayersFailed
    && shapeBackgroundUrl != null
    && shapeOutlineUrl != null

  useEffect(() => {
    setExportIndex(0)
    setCarouselIndex(0)
    setFailed(false)
    setShapeLayersFailed(false)
    setOccludeMaskUrl(null)
  }, [icon, iconItems, exportCandidates.length, shapeBackgroundUrl, shapeOutlineUrl, shapeMaskUrl])

  useEffect(() => {
    if (!isCarousel) return undefined
    const timer = window.setInterval(() => {
      setCarouselIndex((value) => (value + 1) % carouselUrls.length)
    }, ICON_CAROUSEL_MS)
    return () => window.clearInterval(timer)
  }, [carouselUrls.length, isCarousel])

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

  const handleImageError = () => {
    if (isCarousel) return
    if (exportIndex + 1 < exportCandidates.length) {
      setExportIndex((value) => value + 1)
      return
    }
    setFailed(true)
  }

  useEffect(() => {
    if (variant !== 'node' || !shapeBackgroundUrl || !shapeOutlineUrl) {
      return undefined
    }
    let cancelled = false
    const probe = new Image()
    probe.onload = () => {
      if (!cancelled) setShapeLayersFailed(false)
    }
    probe.onerror = () => {
      if (!cancelled) setShapeLayersFailed(true)
    }
    probe.src = shapeOutlineUrl
    return () => {
      cancelled = true
    }
  }, [shapeBackgroundUrl, shapeOutlineUrl, variant])

  useEffect(() => {
    if (variant !== 'node' || !shapeBackgroundUrl) {
      return undefined
    }
    let cancelled = false
    if (!shapeMaskUrl) {
      setOccludeMaskUrl(shapeBackgroundUrl)
      return () => {
        cancelled = true
      }
    }
    const probe = new Image()
    probe.onload = () => {
      if (!cancelled) setOccludeMaskUrl(shapeMaskUrl)
    }
    probe.onerror = () => {
      if (!cancelled) setOccludeMaskUrl(shapeBackgroundUrl)
    }
    probe.src = shapeMaskUrl
    return () => {
      cancelled = true
    }
  }, [shapeBackgroundUrl, shapeMaskUrl, variant])

  const tooltipText = tooltip !== undefined ? (tooltip || undefined) : icon

  const itemIcon = !failed && !isCarousel && exportSrc ? (
    <span className="quest-icon__inner">
      <img
        className="quest-icon__img"
        src={exportSrc}
        alt=""
        decoding="async"
        draggable={false}
        onError={handleImageError}
      />
    </span>
  ) : null

  return (
    <span
      className={classes}
      style={{ width: size, height: size }}
      title={tooltipText}
    >
      {useFtbShapeLayers ? (
        <>
          {occludeMaskUrl ? (
            <span
              className="quest-icon__shape-layer quest-icon__shape-occlude"
              style={{
                WebkitMaskImage: `url("${occludeMaskUrl}")`,
                maskImage: `url("${occludeMaskUrl}")`,
              }}
              aria-hidden="true"
            />
          ) : null}
          <span
            className="quest-icon__shape-layer quest-icon__shape-bg"
            style={{
              WebkitMaskImage: `url("${shapeBackgroundUrl}")`,
              maskImage: `url("${shapeBackgroundUrl}")`,
            }}
            aria-hidden="true"
          />
          <span
            className="quest-icon__shape-layer quest-icon__shape-outline"
            style={{
              WebkitMaskImage: `url("${shapeOutlineUrl}")`,
              maskImage: `url("${shapeOutlineUrl}")`,
            }}
            aria-hidden="true"
          />
        </>
      ) : null}
      {failed ? (
        <span className="quest-icon__inner">
          <span className="quest-icon__fallback" aria-hidden="true">{fallback}</span>
        </span>
      ) : null}
      {!failed && isCarousel ? (
        <span className="quest-icon__inner quest-icon__carousel" aria-hidden="true">
          {carouselUrls.map((url, index) => (
            <img
              key={url}
              className={`quest-icon__img${index === carouselIndex ? ' is-active' : ''}`}
              src={url}
              alt=""
              decoding="async"
              draggable={false}
            />
          ))}
        </span>
      ) : null}
      {itemIcon}
    </span>
  )
}
