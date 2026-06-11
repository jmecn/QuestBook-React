import { questExportUrl } from '@/shared/lib/site-base'
import { normalizeLocale } from '@/shared/i18n/locale'

interface SearchIndexQuestRef {
  id: string
  chapter: string
}

interface SearchIndexPayload {
  quests?: SearchIndexQuestRef[]
}

const indexByLocale = new Map<string, Promise<Map<string, string>>>()

/** quest id → chapter filename（来自 search-index，用于按需拉取 link 目标章）。 */
export async function loadQuestChapterIndex(locale: string): Promise<Map<string, string>> {
  const key = normalizeLocale(locale)
  const existing = indexByLocale.get(key)
  if (existing) return existing

  const promise = (async () => {
    const res = await fetch(questExportUrl(`search-index/${key}.json`))
    if (!res.ok) return new Map<string, string>()
    const data = (await res.json()) as SearchIndexPayload
    const map = new Map<string, string>()
    for (const quest of data.quests ?? []) {
      if (quest.id && quest.chapter) {
        map.set(quest.id, quest.chapter)
      }
    }
    return map
  })()

  indexByLocale.set(key, promise)
  return promise
}
