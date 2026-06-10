import type { ChapterGridPoint } from '@/shared/lib/quest-chapter-bounds'

/** React Flow zoom at 100% — one FTB grid unit between node centers; nodes are ~6/7 of cell width. */
export const QUEST_ZOOM_BASE = 1

/** Match {@code --quest-layout-transition-ms} in quest-canvas.css. */
export const QUEST_LAYOUT_TRANSITION_MS = 300

const CHAPTER_CENTERS_STORAGE_KEY = 'questbook-chapter-centers-v2'

/** Persisted across chapter switches within the session. */
let savedZoom = QUEST_ZOOM_BASE

/** Per-chapter map center in FTB grid units (FTB {@code centerQuestX/Y}). */
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
    // ignore corrupt storage
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
    // ignore quota / privacy mode
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

/** Skip persisting viewport while programmatic pan/zoom animations run. */
export function runProgrammaticViewportMove(run: () => void | Promise<void>): void {
  suppressRememberDepth += 1
  void Promise.resolve(run()).finally(() => {
    window.setTimeout(() => {
      suppressRememberDepth = Math.max(0, suppressRememberDepth - 1)
    }, QUEST_LAYOUT_TRANSITION_MS + 50)
  })
}
