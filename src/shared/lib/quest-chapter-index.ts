import { normalizeLocale } from '@/shared/i18n/locale'
import { loadLocalizedExportJson } from '@/shared/lib/locale-export'
import { questExportUrl } from '@/shared/lib/site-base'

interface SearchIndexQuestRef {
  id: string
  chapter: string
}

interface SearchIndexPayload {
  quests?: SearchIndexQuestRef[]
}

const indexByLocale = new Map<string, Promise<Map<string, string>>>()

function hasSearchIndex(data: SearchIndexPayload | null): data is SearchIndexPayload {
  return Boolean(data?.quests?.length)
}

function buildQuestChapterMap(data: SearchIndexPayload | null): Map<string, string> {
  const map = new Map<string, string>()
  for (const quest of data?.quests ?? []) {
    if (quest.id && quest.chapter) {
      map.set(quest.id, quest.chapter)
    }
  }
  return map
}

/** quest id → chapter filename（来自 search-index，用于按需拉取 link 目标章）。 */
export async function loadQuestChapterIndex(locale: string): Promise<Map<string, string>> {
  const key = normalizeLocale(locale)
  const existing = indexByLocale.get(key)
  if (existing) return existing

  const promise = loadLocalizedExportJson<SearchIndexPayload>(
    (loc) => questExportUrl(`search-index/${loc}.json`),
    key,
    hasSearchIndex,
  ).then((data) => buildQuestChapterMap(data))

  indexByLocale.set(key, promise)
  return promise
}
