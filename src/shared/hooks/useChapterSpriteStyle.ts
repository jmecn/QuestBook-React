import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  MINECRAFT_DEFAULT_FRAME_TIME,
  isAnimatedChapterImage,
} from '@/shared/lib/chapter-image-style'
import type { ChapterImage } from '@/shared/types/quest'

/** Vertical strip: frame {@code index} of {@code textureFrameCount} as CSS {@code background-position-y}. */
export function chapterSpriteBackgroundY(textureFrameIndex: number, textureFrameCount: number): string {
  if (textureFrameCount <= 1) {
    return '0'
  }
  const clamped = Math.max(0, Math.min(textureFrameIndex, textureFrameCount - 1))
  return `${(clamped / (textureFrameCount - 1)) * 100}%`
}

function resolveFrameSequence(image: ChapterImage): number[] {
  const textureFrames = image.frameCount ?? 1
  if (image.frameSequence?.length) {
    return image.frameSequence
  }
  return Array.from({ length: textureFrames }, (_, index) => index)
}

/**
 * Minecraft-style sprite animation: discrete keyframes from {@code .mcmeta frames[]},
 * not continuous UV scroll. All instances share a global clock (atlas behaviour).
 */
export function useChapterSpriteStyle(image: ChapterImage): CSSProperties | undefined {
  const textureFrames = image.frameCount ?? 1
  const sequence = useMemo(() => resolveFrameSequence(image), [image.frameCount, image.frameSequence])
  const frameTime = image.frameTime ?? MINECRAFT_DEFAULT_FRAME_TIME
  const msPerStep = frameTime * 50
  const cycleMs = sequence.length * msPerStep

  const [backgroundPosition, setBackgroundPosition] = useState('0 0')

  useEffect(() => {
    if (!isAnimatedChapterImage(image)) {
      return undefined
    }

    const update = () => {
      const elapsed = Date.now() % cycleMs
      const seqIndex = Math.floor(elapsed / msPerStep) % sequence.length
      const textureFrame = sequence[seqIndex] ?? 0
      setBackgroundPosition(`0 ${chapterSpriteBackgroundY(textureFrame, textureFrames)}`)
    }

    update()
    const id = window.setInterval(update, msPerStep)
    return () => window.clearInterval(id)
  }, [cycleMs, image, msPerStep, sequence, textureFrames])

  if (!isAnimatedChapterImage(image)) {
    return undefined
  }

  return {
    ['--chapter-sprite-frame-count' as string]: String(textureFrames),
    backgroundPosition,
  }
}
