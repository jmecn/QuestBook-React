import { gridStepPx } from '@/shared/lib/quest-text'
import type { IconDisplay, QuestLink } from '@/shared/types/quest'

export const FTB_QUEST_ICON_INNER_RATIO = 2 / 3

export const DEFAULT_QUEST_NODE_SIZE = 1

export const FTB_DEFAULT_QUEST_SPACING = 1

export function ftbQuestButtonCellRatio(questSpacing = FTB_DEFAULT_QUEST_SPACING): number {
  const button = 1.5
  const cell = button + questSpacing / 4
  return button / cell
}

export function questGridCellPx(gridScale = 0.5): number {
  return gridStepPx(gridScale)
}

export function questIconPx(size = 1, gridScale = 0.5, questSpacing = FTB_DEFAULT_QUEST_SPACING): number {
  const questSize = Number(size) > 0 ? Number(size) : 1
  return Math.round(questGridCellPx(gridScale) * ftbQuestButtonCellRatio(questSpacing) * questSize)
}

export function questIconInnerPx(outerPx: number): number {
  return Math.round(outerPx * FTB_QUEST_ICON_INNER_RATIO)
}

/** questLink 在本章未写 size 时默认 1.0，不得沿用被引用任务的 iconDisplay 尺寸。 */
export function resolveQuestLinkIconDisplay(
  link: QuestLink,
  linkedQuestDisplay: IconDisplay | undefined,
  gridScale: number,
): IconDisplay | undefined {
  const base = link.iconDisplay ?? linkedQuestDisplay
  if (!base) return undefined

  const linkSize = link.size ?? DEFAULT_QUEST_NODE_SIZE
  const outerPx = questIconPx(linkSize, gridScale)
  const innerPx = questIconInnerPx(outerPx)

  if (base.nodeOuterPx === outerPx && base.innerPx === innerPx) {
    return base
  }

  return { ...base, nodeOuterPx: outerPx, innerPx }
}
