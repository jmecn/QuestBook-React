import { gridStepPx } from '@/shared/lib/quest-text'

/** FTB quest icon diameter in canvas pixels (size 1 ≈ one grid step). */
export function questIconPx(size = 1, gridScale = 0.5): number {
  const questSize = Number(size) > 0 ? Number(size) : 1
  return Math.round(gridStepPx(gridScale) * questSize * 0.85)
}
