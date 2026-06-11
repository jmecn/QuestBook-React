import { questExportUrl } from '@/shared/lib/site-base'
import type { ResolvedSprite } from '@/shared/lib/quest-atlas/resolve-sprite'
import type { GlobalAtlas, GlobalSpriteRect } from '@/shared/types/quest'
import type { CSSProperties } from 'react'

/** CSS atlas 裁切：单次缩放 + image-rendering: pixelated，避免 canvas 二次采样发糊。 */
export function atlasSpriteBackgroundStyle(
  resolved: ResolvedSprite,
  displayPx: number,
): CSSProperties {
  const { image, rect } = resolved
  const scaleX = displayPx / rect.w
  const scaleY = displayPx / rect.h
  const atlasW = image.naturalWidth
  const atlasH = image.naturalHeight
  return {
    width: displayPx,
    height: displayPx,
    backgroundImage: `url("${image.src}")`,
    backgroundSize: `${atlasW * scaleX}px ${atlasH * scaleY}px`,
    backgroundPosition: `-${rect.x * scaleX}px -${rect.y * scaleY}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  }
}

export function globalAtlasMaskStyle(
  meta: GlobalAtlas,
  rect: GlobalSpriteRect,
  elementPx: number,
): CSSProperties {
  const url = questExportUrl(meta.src)
  const scale = elementPx / rect.w
  const maskWidth = meta.width * scale
  const maskHeight = meta.height * scale
  return {
    WebkitMaskImage: `url("${url}")`,
    maskImage: `url("${url}")`,
    WebkitMaskSize: `${maskWidth}px ${maskHeight}px`,
    maskSize: `${maskWidth}px ${maskHeight}px`,
    WebkitMaskPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
    maskPosition: `-${rect.x * scale}px -${rect.y * scale}px`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }
}
