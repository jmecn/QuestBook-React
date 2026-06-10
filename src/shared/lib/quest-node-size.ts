import { gridStepPx } from '@/shared/lib/quest-text'

/**
 * FTB {@code QuestButton} draws the item at {@code w * 2/3} inside the shape
 * (default zoom 16 → 24px frame, 16px icon; export PNGs are 32px = 2× that icon).
 */
export const FTB_QUEST_ICON_INNER_RATIO = 2 / 3

/** FTB {@code QuestLink} default width when the link omits {@code size} in export JSON. */
export const DEFAULT_QUEST_NODE_SIZE = 1

/** Default {@code quest_spacing} from {@code ftb_quests_theme.txt}. */
export const FTB_DEFAULT_QUEST_SPACING = 1

/**
 * FTB {@code getQuestButtonSize() / (getQuestButtonSize() + getQuestButtonSpacing())}
 * at default zoom — button does not fill the grid cell; spacing keeps dependency lines visible.
 */
export function ftbQuestButtonCellRatio(questSpacing = FTB_DEFAULT_QUEST_SPACING): number {
  const button = 1.5
  const cell = button + questSpacing / 4
  return button / cell
}

/** One FTB grid unit on screen (node centers this far apart); {@code gridToPx(1)}. */
export function questGridCellPx(gridScale = 0.5): number {
  return gridStepPx(gridScale)
}

/** Quest shape outer diameter — fraction of grid cell, matching in-game button vs spacing. */
export function questIconPx(size = 1, gridScale = 0.5, questSpacing = FTB_DEFAULT_QUEST_SPACING): number {
  const questSize = Number(size) > 0 ? Number(size) : 1
  return Math.round(questGridCellPx(gridScale) * ftbQuestButtonCellRatio(questSpacing) * questSize)
}

export function questIconInnerPx(outerPx: number): number {
  return Math.round(outerPx * FTB_QUEST_ICON_INNER_RATIO)
}
