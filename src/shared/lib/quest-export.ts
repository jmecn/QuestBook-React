import type { ChapterData, QuestIndex } from '@/shared/types/quest'
import { questExportUrl, siteUrl } from '@/shared/lib/site-base'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface SiteConfig {
  recipeBookBaseUrl?: string
  fieldGuideBaseUrl?: string
}

export async function loadSiteConfig(): Promise<SiteConfig> {
  const res = await fetch(siteUrl('site-config.json'))
  if (!res.ok) return {}
  return res.json() as Promise<SiteConfig>
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

export interface ItemsLangRow {
  id: string
  label?: string
}

export interface ItemsLangPayload {
  items?: ItemsLangRow[]
}

/** Precomputed registry id → label table from quest-export {@code items-lang/}. */
export async function loadItemsLangLabels(
  locale: string,
): Promise<Record<string, string> | null> {
  const res = await fetch(questExportUrl(`items-lang/${locale}.json`))
  if (!res.ok) return null
  const data = (await res.json()) as ItemsLangPayload
  if (!data.items?.length) return null

  const labels: Record<string, string> = {}
  for (const row of data.items) {
    if (!row.id || row.label == null || row.label === '') continue
    labels[row.id] = row.label
  }
  return labels
}

export interface ItemNameKeysPayload {
  items?: Record<string, string>
}

/** Registry id → in-game description lang key ({@code items/name-keys.json}). */
export async function loadItemNameKeys(): Promise<Record<string, string>> {
  const res = await fetch(questExportUrl('items/name-keys.json'))
  if (!res.ok) return {}
  const data = (await res.json()) as ItemNameKeysPayload
  return data.items ?? {}
}
