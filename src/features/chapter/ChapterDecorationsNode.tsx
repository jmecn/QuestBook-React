import { useEffect, useMemo, useRef, useState } from 'react'
import type { NodeProps, Node } from '@xyflow/react'
import { chapterDecorationBounds, type ChapterDecorationBounds } from '@/shared/lib/chapter-decoration-bounds'
import {
  chapterImageLayout,
  isAnimatedChapterImage,
  sortedChapterImages,
} from '@/shared/lib/chapter-image-style'
import {
  chapterSpriteAnimationIntervalMs,
  chapterSpriteTextureFrame,
} from '@/shared/lib/chapter-sprite-frame'
import { isChapterImageClickable } from '@/shared/lib/chapter-image-click'
import { questExportAssetUrl } from '@/shared/lib/quest-export-asset'
import type { ChapterImage } from '@/shared/types/quest'

export interface ChapterDecorationsNodeData extends Record<string, unknown> {
  images: ChapterImage[]
  gridScale: number
  bounds: ChapterDecorationBounds
}

function decorationSrc(image: ChapterImage): string | undefined {
  return image.baked ? questExportAssetUrl(image.baked) : undefined
}

function drawDecoration(
  ctx: CanvasRenderingContext2D,
  image: ChapterImage,
  bounds: ChapterDecorationBounds,
  bitmap: CanvasImageSource,
  gridScale: number,
  frameIndex: number,
): void {
  const { x, y, widthPx, heightPx } = chapterImageLayout(image, gridScale)
  const left = x - widthPx / 2 - bounds.minX
  const top = y - heightPx / 2 - bounds.minY
  const rotation = ((image.rotation ?? 0) * Math.PI) / 180

  ctx.save()
  if (rotation !== 0) {
    const cx = left + widthPx / 2
    const cy = top + heightPx / 2
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.translate(-cx, -cy)
  }

  if (isAnimatedChapterImage(image)) {
    const frameCount = image.frameCount ?? 1
    const frameW = image.frameWidth ?? (bitmap as HTMLImageElement).naturalWidth
    const frameH = image.frameHeight ?? Math.floor((bitmap as HTMLImageElement).naturalHeight / frameCount)
    const sy = frameIndex * frameH
    ctx.drawImage(bitmap, 0, sy, frameW, frameH, left, top, widthPx, heightPx)
  } else {
    ctx.drawImage(bitmap, left, top, widthPx, heightPx)
  }
  ctx.restore()
}

/** Single canvas layer for chapter decorations — avoids per-tile DOM alpha stacking. */
export function ChapterDecorationsNode({ data }: NodeProps<Node<ChapterDecorationsNodeData>>) {
  const { images, gridScale, bounds } = data
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bitmapsRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const [ready, setReady] = useState(false)

  const sorted = useMemo(() => sortedChapterImages(images), [images])
  const sources = useMemo(() => {
    const unique = new Map<string, string>()
    for (const image of sorted) {
      const src = decorationSrc(image)
      if (src) unique.set(src, src)
    }
    return [...unique.values()]
  }, [sorted])

  const tickMs = useMemo(() => {
    let min = Number.POSITIVE_INFINITY
    for (const image of sorted) {
      const ms = chapterSpriteAnimationIntervalMs(image)
      if (ms != null) min = Math.min(min, ms)
    }
    return Number.isFinite(min) ? min : undefined
  }, [sorted])

  useEffect(() => {
    let cancelled = false
    bitmapsRef.current.clear()
    setReady(false)

    if (!sources.length) {
      return undefined
    }

    let pending = sources.length
    for (const src of sources) {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (cancelled) return
        bitmapsRef.current.set(src, img)
        pending -= 1
        if (pending === 0) setReady(true)
      }
      img.onerror = () => {
        if (cancelled) return
        pending -= 1
        if (pending === 0) setReady(true)
      }
      img.src = src
    }

    return () => {
      cancelled = true
    }
  }, [sources])

  useEffect(() => {
    if (!ready) return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined

    const paint = (now: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, bounds.widthPx, bounds.heightPx)
      for (const image of sorted) {
        const src = decorationSrc(image)
        if (!src) continue
        const bitmap = bitmapsRef.current.get(src)
        if (!bitmap?.complete || bitmap.naturalWidth === 0) continue
        const frameIndex = chapterSpriteTextureFrame(image, now)
        drawDecoration(ctx, image, bounds, bitmap, gridScale, frameIndex)
      }
    }

    paint(Date.now())
    if (tickMs == null) return undefined
    const id = window.setInterval(() => paint(Date.now()), tickMs)
    return () => window.clearInterval(id)
  }, [bounds.heightPx, bounds.widthPx, gridScale, ready, sorted, tickMs])

  return (
    <canvas
      ref={canvasRef}
      className="quest-chapter-decorations"
      width={bounds.widthPx}
      height={bounds.heightPx}
      aria-hidden="true"
    />
  )
}

export function buildChapterDecorationsNode(
  chapterId: string,
  images: ChapterImage[],
  gridScale: number,
): Node<ChapterDecorationsNodeData> | null {
  const passive = images.filter((image) => !isChapterImageClickable(image.click))
  const bounds = chapterDecorationBounds(passive, gridScale)
  if (!bounds || passive.length === 0) {
    return null
  }

  return {
    id: `chapter-decorations:${chapterId}`,
    type: 'chapterDecorations',
    position: { x: bounds.centerX, y: bounds.centerY },
    data: { images: passive, gridScale, bounds },
    selectable: false,
    draggable: false,
    focusable: false,
    measured: { width: bounds.widthPx, height: bounds.heightPx },
    style: {
      pointerEvents: 'none',
      width: bounds.widthPx,
      height: bounds.heightPx,
    },
    zIndex: -100,
  }
}
