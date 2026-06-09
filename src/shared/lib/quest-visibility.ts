import type { QuestNode } from '@/shared/types/quest'

/**
 * Whether a quest should appear on the chapter map.
 *
 * QuestBook is a full reference (no player progress). We only hide quests
 * marked {@code invisible} in SNBT — not {@code hide_until_deps_visible} etc.,
 * which are progression gates evaluated via {@code Quest.isVisible(TeamData)}.
 */
export function isQuestVisibleOnMap(quest: Pick<QuestNode, 'invisible'>): boolean {
  return quest.invisible !== true
}

export function isQuestLinkVisibleOnMap(
  linkedQuest: Pick<QuestNode, 'invisible'> | undefined,
): boolean {
  return linkedQuest != null && isQuestVisibleOnMap(linkedQuest)
}
