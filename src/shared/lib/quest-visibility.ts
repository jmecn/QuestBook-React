import type { QuestNode } from '@/shared/types/quest'

export function isQuestVisibleOnMap(quest: Pick<QuestNode, 'invisible'>): boolean {
  return quest.invisible !== true
}

/** Hidden (invisible) quests must not reveal prerequisite links in the detail panel. */
export function shouldHideQuestPrerequisites(quest: Pick<QuestNode, 'invisible'>): boolean {
  return quest.invisible === true
}

export function isQuestLinkVisibleOnMap(
  linkedQuest: Pick<QuestNode, 'invisible'> | undefined,
): boolean {
  return linkedQuest != null && isQuestVisibleOnMap(linkedQuest)
}
