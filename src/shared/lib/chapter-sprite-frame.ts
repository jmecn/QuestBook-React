import {
  MINECRAFT_DEFAULT_FRAME_TIME,
  isAnimatedChapterImage,
} from '@/shared/lib/chapter-image-style'
import type { ChapterImage } from '@/shared/types/quest'

function resolveFrameSequence(image: ChapterImage): number[] {
  const textureFrames = image.frameCount ?? 1
  if (image.frameSequence?.length) {
    return image.frameSequence
  }
  return Array.from({ length: textureFrames }, (_, index) => index)
}

/** Current texture frame index for a chapter sprite strip (shared global clock). */
export function chapterSpriteTextureFrame(image: ChapterImage, now = Date.now()): number {
  if (!isAnimatedChapterImage(image)) {
    return 0
  }
  const sequence = resolveFrameSequence(image)
  const frameTime = image.frameTime ?? MINECRAFT_DEFAULT_FRAME_TIME
  const msPerStep = frameTime * 50
  const cycleMs = sequence.length * msPerStep
  const elapsed = now % cycleMs
  const seqIndex = Math.floor(elapsed / msPerStep) % sequence.length
  return sequence[seqIndex] ?? 0
}

export function chapterSpriteAnimationIntervalMs(image: ChapterImage): number | undefined {
  if (!isAnimatedChapterImage(image)) {
    return undefined
  }
  const frameTime = image.frameTime ?? MINECRAFT_DEFAULT_FRAME_TIME
  return frameTime * 50
}
