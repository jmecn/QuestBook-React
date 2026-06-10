import { gridStepPx } from '@/shared/lib/quest-text'

/**
 * FTB {@code QuestButton} draws the item at {@code w * 2/3} inside the shape
 * (default zoom 16 → 24px frame, 16px icon; export PNGs are 32px = 2× that icon).
 */
export const FTB_QUEST_ICON_INNER_RATIO = 2 / 3

/** FTB {@code QuestLink} default width when the link omits {@code size} in export JSON. */
export const DEFAULT_QUEST_NODE_SIZE = 1

/** Quest shape outer diameter in canvas pixels ({@code size} 1 ≈ one grid step at 2× FTB button). */
export function questIconPx(size = 1, gridScale = 0.5): number {
  const questSize = Number(size) > 0 ? Number(size) : 1
  return Math.round(gridStepPx(gridScale) * questSize)
}

export function questIconInnerPx(outerPx: number): number {
  return Math.round(outerPx * FTB_QUEST_ICON_INNER_RATIO)
}
