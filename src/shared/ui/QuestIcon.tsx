import { useEffect, useMemo, useState } from 'react'
import { loadTextureAnimation, type TextureAnimationMeta } from '@/shared/lib/animated-texture'
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
  const [animation, setAnimation] = useState<TextureAnimationMeta | null>(null)

  const exportSrc = carouselUrls.length > 0
    ? carouselUrls[carouselIndex]
    : exportCandidates[exportIndex]

  const fallback = questIconFallbackLabel(icon)
  const isCarousel = carouselUrls.length > 1

  useEffect(() => {
    setExportIndex(0)
    setCarouselIndex(0)
    setFailed(false)
    setAnimation(null)
  }, [icon, iconItems, exportCandidates.length])

  useEffect(() => {
    if (!isCarousel) return undefined
    const timer = window.setInterval(() => {
      setCarouselIndex((value) => (value + 1) % carouselUrls.length)
    }, ICON_CAROUSEL_MS)
    return () => window.clearInterval(timer)
  }, [carouselUrls.length, isCarousel])

  useEffect(() => {
    if (!exportSrc || isCarousel) return undefined

    let cancelled = false
    void loadTextureAnimation(exportSrc).then((meta) => {
      if (cancelled || !meta || meta.frameCount <= 1) return
      setAnimation(meta)
    })

    return () => {
      cancelled = true
    }
  }, [exportSrc, isCarousel])

  const shapeClass = shape ? `quest-icon--shape-${shape}` : ''
  const classes = [
    'quest-icon',
    shapeClass,
    selected ? 'is-selected' : '',
    className,
  ].filter(Boolean).join(' ')

  const animationStyle = animation && exportSrc && !isCarousel
    ? {
        backgroundImage: `url(${exportSrc})`,
        backgroundSize: `100% ${animation.frameCount * 100}%`,
        animationDuration: `${(animation.frametime * animation.frameCount) / 20}s`,
        ['--quest-texture-frames' as string]: animation.frameCount,
      }
    : undefined

  const handleImageError = () => {
    if (isCarousel) return
    if (exportIndex + 1 < exportCandidates.length) {
      setExportIndex((value) => value + 1)
      return
    }
    setFailed(true)
  }

  return (
    <span className={classes} style={{ width: size, height: size }} title={icon}>
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
      {!failed && !isCarousel && exportSrc && !animation ? (
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
      {!failed && !isCarousel && exportSrc && animation ? (
        <span className="quest-icon__inner">
          <span
            className="quest-icon__animated"
            style={animationStyle}
            aria-hidden="true"
          />
        </span>
      ) : null}
    </span>
  )
}
