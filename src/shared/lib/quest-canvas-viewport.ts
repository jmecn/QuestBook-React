/** React Flow zoom at 100% — one FTB grid unit matches game-sized quest nodes on screen. */
export const QUEST_ZOOM_BASE = 1

/** Persisted across chapter switches within the session. */
let savedZoom = QUEST_ZOOM_BASE

export function getSavedQuestCanvasZoom(): number {
  return savedZoom
}

export function rememberQuestCanvasZoom(zoom: number): void {
  if (Number.isFinite(zoom) && zoom > 0) {
    savedZoom = zoom
  }
}
