import type { ChapterGridPoint } from '@/shared/lib/quest-chapter-bounds'

/** React Flow zoom at 100% — one FTB grid unit matches game-sized quest nodes on screen. */
export const QUEST_ZOOM_BASE = 1

/** Persisted across chapter switches within the session. */
let savedZoom = QUEST_ZOOM_BASE

const chapterCenters = new Map<string, ChapterGridPoint>()

export function getSavedQuestCanvasZoom(): number {
  return savedZoom
}

export function rememberQuestCanvasZoom(zoom: number): void {
  if (Number.isFinite(zoom) && zoom > 0) {
    savedZoom = zoom
  }
}

export function getRememberedChapterCenter(chapterId: string): ChapterGridPoint | null {
  return chapterCenters.get(chapterId) ?? null
}

export function rememberChapterCenter(chapterId: string, point: ChapterGridPoint): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return
  chapterCenters.set(chapterId, { x: point.x, y: point.y })
}
