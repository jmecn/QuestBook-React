import type { ChapterData, QuestNode } from '@/shared/types/quest'

export interface QuestCatalogEntry {
  id: string
  chapterFilename: string
  quest: QuestNode
}

export function buildQuestCatalog(chapters: ChapterData[]): Map<string, QuestCatalogEntry> {
  const catalog = new Map<string, QuestCatalogEntry>()
  for (const chapter of chapters) {
    for (const quest of chapter.quests) {
      catalog.set(quest.id, {
        id: quest.id,
        chapterFilename: chapter.filename,
        quest,
      })
    }
  }
  return catalog
}

export function resolvePrerequisites(
  quest: QuestNode,
  catalog: Map<string, QuestCatalogEntry>,
): QuestCatalogEntry[] {
  const entries: QuestCatalogEntry[] = []
  for (const depId of quest.dependencies ?? []) {
    const entry = catalog.get(depId)
    if (entry) entries.push(entry)
  }
  return entries
}

export function resolveDependents(
  questId: string,
  chapters: ChapterData[],
): QuestCatalogEntry[] {
  const dependents: QuestCatalogEntry[] = []
  for (const chapter of chapters) {
    for (const quest of chapter.quests) {
      if ((quest.dependencies ?? []).includes(questId)) {
        dependents.push({
          id: quest.id,
          chapterFilename: chapter.filename,
          quest,
        })
      }
    }
  }
  return dependents
}
