import { useEffect, useState, type CSSProperties } from 'react'
import { isAnimatedChapterImage } from '@/shared/lib/chapter-image-style'
import {
  chapterSpriteAnimationIntervalMs,
  chapterSpriteTextureFrame,
} from '@/shared/lib/chapter-sprite-frame'
import type { ChapterImage } from '@/shared/types/quest'

export function chapterSpriteBackgroundY(textureFrameIndex: number, textureFrameCount: number): string {
  if (textureFrameCount <= 1) {
    return '0'
  }
  const clamped = Math.max(0, Math.min(textureFrameIndex, textureFrameCount - 1))
  return `${(clamped / (textureFrameCount - 1)) * 100}%`
}

export function useChapterSpriteStyle(image: ChapterImage): CSSProperties | undefined {
  const textureFrames = image.frameCount ?? 1
  const msPerStep = chapterSpriteAnimationIntervalMs(image) ?? 100

  const [backgroundPosition, setBackgroundPosition] = useState('0 0')

  useEffect(() => {
    if (!isAnimatedChapterImage(image)) {
      return undefined
    }

    const update = () => {
      const textureFrame = chapterSpriteTextureFrame(image)
      setBackgroundPosition(`0 ${chapterSpriteBackgroundY(textureFrame, textureFrames)}`)
    }

    update()
    const id = window.setInterval(update, msPerStep)
    return () => window.clearInterval(id)
  }, [image, msPerStep, textureFrames])

  if (!isAnimatedChapterImage(image)) {
    return undefined
  }

  return {
    ['--chapter-sprite-frame-count' as string]: String(textureFrames),
    backgroundPosition,
  }
}
