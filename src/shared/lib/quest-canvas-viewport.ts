import type { ChapterGridPoint } from '@/shared/lib/quest-chapter-bounds'

export const QUEST_ZOOM_BASE = 1

export const QUEST_LAYOUT_TRANSITION_MS = 300

const CHAPTER_CENTERS_STORAGE_KEY = 'questbook-chapter-centers-v2'

let savedZoom = QUEST_ZOOM_BASE

const chapterCenters = new Map<string, ChapterGridPoint>()

let suppressRememberDepth = 0

function loadStoredChapterCenters(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const raw = sessionStorage.getItem(CHAPTER_CENTERS_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Record<string, ChapterGridPoint>
    for (const [id, point] of Object.entries(parsed)) {
      if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
        chapterCenters.set(id, { x: point.x, y: point.y })
      }
    }
  } catch {

  }
}

function persistChapterCenters(): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const payload: Record<string, ChapterGridPoint> = {}
    for (const [id, point] of chapterCenters.entries()) {
      payload[id] = point
    }
    sessionStorage.setItem(CHAPTER_CENTERS_STORAGE_KEY, JSON.stringify(payload))
  } catch {

  }
}

loadStoredChapterCenters()

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
  persistChapterCenters()
}

export function shouldRememberViewportOnSettle(): boolean {
  return suppressRememberDepth === 0
}

export function runProgrammaticViewportMove(run: () => void | Promise<void>): void {
  suppressRememberDepth += 1
  void Promise.resolve(run()).finally(() => {
    window.setTimeout(() => {
      suppressRememberDepth = Math.max(0, suppressRememberDepth - 1)
    }, QUEST_LAYOUT_TRANSITION_MS + 50)
  })
}
