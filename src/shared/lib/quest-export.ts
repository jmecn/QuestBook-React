import type { ChapterData, QuestIndex } from '@/shared/types/quest'
import { questExportUrl, siteUrl } from '@/shared/lib/site-base'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function loadSiteConfig(): Promise<{ recipeBookBaseUrl?: string }> {
  const res = await fetch(siteUrl('site-config.json'))
  if (!res.ok) return {}
  return res.json() as Promise<{ recipeBookBaseUrl?: string }>
}

export async function loadQuestIndex(): Promise<QuestIndex> {
  return fetchJson<QuestIndex>(questExportUrl('quests/index.json'))
}

export async function loadChapter(filename: string): Promise<ChapterData> {
  return fetchJson<ChapterData>(questExportUrl(`quests/chapters/${filename}.json`))
}

export async function loadLangDict(locale: string): Promise<Record<string, string>> {
  const res = await fetch(questExportUrl(`lang/${locale}.json`))
  if (!res.ok) return {}
  return res.json() as Promise<Record<string, string>>
}
