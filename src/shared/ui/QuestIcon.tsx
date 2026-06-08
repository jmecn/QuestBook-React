import { useEffect, useMemo, useRef, useState } from 'react'
import { getRecipeViewerIconClient } from '@/adapters/recipe-viewer-icon-client'
import { useRecipeViewerIcons } from '@/app/context/RecipeViewerIconContext'
import { loadTextureAnimation, type TextureAnimationMeta } from '@/shared/lib/animated-texture'
import {
  questExportIconCandidates,
  questIconFallbackLabel,
} from '@/shared/lib/quest-icon'

export interface QuestIconProps {
  icon?: string
  size?: number
  shape?: string
  selected?: boolean
  className?: string
  locale?: string
}

type IconMode = 'export' | 'animated' | 'recipe-viewer' | 'fallback'

export function QuestIcon({
  icon,
  size = 32,
  selected = false,
  shape,
  className = '',
  locale = 'en_us',
}: QuestIconProps) {
  const exportCandidates = useMemo(() => questExportIconCandidates(icon), [icon])
  const { baseUrl } = useRecipeViewerIcons()
  const emiHostRef = useRef<HTMLSpanElement | null>(null)
  const [mode, setMode] = useState<IconMode>(() => (
    exportCandidates.length > 0 ? 'export' : 'recipe-viewer'
  ))
  const [exportIndex, setExportIndex] = useState(0)
  const [animation, setAnimation] = useState<TextureAnimationMeta | null>(null)
  const exportSrc = (mode === 'export' || mode === 'animated') && exportCandidates[exportIndex]
    ? exportCandidates[exportIndex]
    : undefined
  const fallback = questIconFallbackLabel(icon)

  useEffect(() => {
    setMode(exportCandidates.length > 0 ? 'export' : 'recipe-viewer')
    setExportIndex(0)
    setAnimation(null)
  }, [icon, exportCandidates.length])

  useEffect(() => {
    if (mode !== 'export' || !exportSrc) return

    let cancelled = false
    void loadTextureAnimation(exportSrc).then((meta) => {
      if (cancelled || !meta || meta.frameCount <= 1) return
      setAnimation(meta)
      setMode('animated')
    })

    return () => {
      cancelled = true
    }
  }, [exportSrc, mode])

  useEffect(() => {
    if (mode !== 'recipe-viewer' || !icon || !baseUrl) return
    const host = emiHostRef.current
    if (!host) return
    const client = getRecipeViewerIconClient()
    const session = client.mountItemIcon(host, icon, {
      baseUrl,
      locale,
      fallbackText: fallback,
    })
    return () => session.disconnect()
  }, [baseUrl, fallback, icon, locale, mode])

  const shapeClass = shape ? `quest-icon--shape-${shape}` : ''
  const classes = [
    'quest-icon',
    shapeClass,
    selected ? 'is-selected' : '',
    className,
  ].filter(Boolean).join(' ')

  const animationStyle = animation && exportSrc
    ? {
        backgroundImage: `url(${exportSrc})`,
        backgroundSize: `100% ${animation.frameCount * 100}%`,
        animationDuration: `${(animation.frametime * animation.frameCount) / 20}s`,
        ['--quest-texture-frames' as string]: animation.frameCount,
      }
    : undefined

  return (
    <span className={classes} style={{ width: size, height: size }} title={icon}>
      {mode === 'export' && exportSrc ? (
        <img
          key={exportSrc}
          className="quest-icon__img"
          src={exportSrc}
          alt=""
          decoding="async"
          draggable={false}
          onError={() => {
            if (exportIndex + 1 < exportCandidates.length) {
              setExportIndex((value) => value + 1)
            } else {
              setMode('recipe-viewer')
            }
          }}
        />
      ) : null}
      {mode === 'animated' && exportSrc ? (
        <span
          className="quest-icon__animated"
          style={animationStyle}
          aria-hidden="true"
        />
      ) : null}
      {mode === 'recipe-viewer' ? (
        <span ref={emiHostRef} className="quest-icon__emi" />
      ) : null}
      {mode === 'fallback' ? (
        <span className="quest-icon__fallback" aria-hidden="true">{fallback}</span>
      ) : null}
    </span>
  )
}
