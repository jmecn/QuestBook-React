import { useEffect, useMemo, useState } from 'react'
import { questItemIconUrl } from '@/shared/lib/quest-item-icon'
import {
  questExportIconCandidates,
  questIconFallbackLabel,
} from '@/shared/lib/quest-icon'

export interface QuestIconProps {
  icon?: string
  iconItems?: string[]
  size?: number
  shape?: string
  /** {@code tile}: full-size square list icon; {@code node}: shaped quest canvas button (default). */
  variant?: 'node' | 'tile'
  /** Tooltip on hover; defaults to {@code icon} id. Pass {@code ''} to hide. */
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

  const [exportIndex, setExportIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  const exportSrc = carouselUrls.length > 0
    ? carouselUrls[carouselIndex]
    : exportCandidates[exportIndex]

  const fallback = questIconFallbackLabel(icon)
  const isCarousel = carouselUrls.length > 1

  useEffect(() => {
    setExportIndex(0)
    setCarouselIndex(0)
    setFailed(false)
  }, [icon, iconItems, exportCandidates.length])

  useEffect(() => {
    if (!isCarousel) return undefined
    const timer = window.setInterval(() => {
      setCarouselIndex((value) => (value + 1) % carouselUrls.length)
    }, ICON_CAROUSEL_MS)
    return () => window.clearInterval(timer)
  }, [carouselUrls.length, isCarousel])

  const shapeClass = shape ? `quest-icon--shape-${shape}` : ''
  const classes = [
    'quest-icon',
    variant === 'tile' ? 'quest-icon--tile' : '',
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

  const tooltipText = tooltip !== undefined ? (tooltip || undefined) : icon

  return (
    <span
      className={classes}
      style={{ width: size, height: size }}
      title={tooltipText}
    >
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
      {!failed && !isCarousel && exportSrc ? (
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
      ) : null}
    </span>
  )
}
