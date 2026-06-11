import type { ChapterData, QuestIndex } from '@/shared/types/quest'
import { FALLBACK_LOCALE, normalizeLocale } from '@/shared/i18n/locale'
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

let enUsDictCache: Record<string, string> | null = null

async function fetchLangFile(locale: string): Promise<Record<string, string>> {
  const res = await fetch(questExportUrl(`lang/${locale}.json`))
  if (!res.ok) return {}
  return res.json() as Promise<Record<string, string>>
}

async function loadEnUsDict(): Promise<Record<string, string>> {
  if (!enUsDictCache) {
    enUsDictCache = await fetchLangFile(FALLBACK_LOCALE)
  }
  return enUsDictCache
}

export function mergeLangDicts(
  fallback: Record<string, string>,
  primary: Record<string, string>,
): Record<string, string> {
  if (!Object.keys(primary).length) return fallback
  if (!Object.keys(fallback).length) return primary
  return { ...fallback, ...primary }
}

export async function loadLangDict(locale: string): Promise<Record<string, string>> {
  const normalized = normalizeLocale(locale)
  if (normalized === FALLBACK_LOCALE) {
    return loadEnUsDict()
  }
  const [fallback, primary] = await Promise.all([
    loadEnUsDict(),
    fetchLangFile(normalized),
  ])
  return mergeLangDicts(fallback, primary)
}

export interface ItemNameKeysPayload {
  items?: Record<string, string>
}

export async function loadItemNameKeys(): Promise<Record<string, string>> {
  const res = await fetch(questExportUrl('items/name-keys.json'))
  if (!res.ok) return {}
  const data = (await res.json()) as ItemNameKeysPayload
  return data.items ?? {}
}
