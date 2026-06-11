import type { QuestNode } from '@/shared/types/quest'

export function isQuestVisibleOnMap(quest: Pick<QuestNode, 'invisible'>): boolean {
  return quest.invisible !== true
}

export function isQuestLinkVisibleOnMap(
  linkedQuest: Pick<QuestNode, 'invisible'> | undefined,
): boolean {
  return linkedQuest != null && isQuestVisibleOnMap(linkedQuest)
}
