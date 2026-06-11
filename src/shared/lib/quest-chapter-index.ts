import { fetchJson } from '@/shared/api/http'
import { FALLBACK_LOCALE, normalizeLocale } from '@/shared/i18n/locale'
import { questExportUrl } from '@/shared/lib/site-base'

interface SearchIndexQuestRef {
  id: string
  chapter: string
}

interface SearchIndexPayload {
  quests?: SearchIndexQuestRef[]
}

const indexByLocale = new Map<string, Promise<Map<string, string>>>()

function buildQuestChapterMap(data: SearchIndexPayload | null): Map<string, string> {
  const map = new Map<string, string>()
  for (const quest of data?.quests ?? []) {
    if (quest.id && quest.chapter) {
      map.set(quest.id, quest.chapter)
    }
  }
  return map
}

async function fetchQuestChapterIndex(locale: string): Promise<Map<string, string>> {
  const data = await fetchJson<SearchIndexPayload | null>(
    questExportUrl(`search-index/${locale}.json`),
    null,
  )
  if (data) return buildQuestChapterMap(data)
  if (locale !== FALLBACK_LOCALE) {
    return fetchQuestChapterIndex(FALLBACK_LOCALE)
  }
  return new Map()
}

/** quest id → chapter filename（来自 search-index，用于按需拉取 link 目标章）。 */
export async function loadQuestChapterIndex(locale: string): Promise<Map<string, string>> {
  const key = normalizeLocale(locale)
  const existing = indexByLocale.get(key)
  if (existing) return existing

  const promise = fetchQuestChapterIndex(key)
  indexByLocale.set(key, promise)
  return promise
}
