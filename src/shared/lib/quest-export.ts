import type { ChapterData, QuestIndex } from '@/shared/types/quest'
import { FALLBACK_LOCALE, normalizeLocale } from '@/shared/i18n/locale'
import { questExportUrl, siteUrl } from '@/shared/lib/site-base'

const jsonCache = new Map<string, Promise<unknown>>()

async function fetchJsonCached<T>(url: string): Promise<T> {
  let pending = jsonCache.get(url)
  if (!pending) {
    pending = (async () => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`)
      }
      const contentType = String(res.headers.get('content-type') || '').toLowerCase()
      if (!contentType.includes('application/json')) {
        throw new Error(`Not JSON: ${url}`)
      }
      return res.json() as Promise<T>
    })()
    jsonCache.set(url, pending)
    void pending.catch(() => {
      jsonCache.delete(url)
    })
  }
  return pending as Promise<T>
}

export interface SiteConfig {
  recipeBookBaseUrl?: string
  fieldGuideBaseUrl?: string
}

export async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    return await fetchJsonCached<SiteConfig>(siteUrl('site-config.json'))
  } catch {
    return {}
  }
}

export async function loadQuestIndex(): Promise<QuestIndex> {
  return fetchJsonCached<QuestIndex>(questExportUrl('quests/index.json'))
}

export async function loadChapter(filename: string): Promise<ChapterData> {
  return fetchJsonCached<ChapterData>(questExportUrl(`quests/chapters/${filename}.json`))
}

const langDictCache = new Map<string, Promise<Record<string, string>>>()

async function fetchLangFile(locale: string): Promise<Record<string, string>> {
  const url = questExportUrl(`lang/${locale}.json`)
  try {
    return await fetchJsonCached<Record<string, string>>(url)
  } catch {
    return {}
  }
}

async function loadEnUsDict(): Promise<Record<string, string>> {
  return fetchLangFile(FALLBACK_LOCALE)
}

export function mergeLangDicts(
  fallback: Record<string, string>,
  primary: Record<string, string>,
): Record<string, string> {
  if (!Object.keys(primary).length) return fallback
  if (!Object.keys(fallback).length) return primary
  return { ...fallback, ...primary }
}

/** 任务文本 lang 表：缺失 locale 文件时以 en_us 为底，再用目标语言覆盖。 */
export async function loadLangDict(locale: string): Promise<Record<string, string>> {
  const normalized = normalizeLocale(locale)
  const cached = langDictCache.get(normalized)
  if (cached) return cached

  const promise = (async () => {
    const fallback = await loadEnUsDict()
    if (normalized === FALLBACK_LOCALE) {
      return fallback
    }
    const primary = await fetchLangFile(normalized)
    return mergeLangDicts(fallback, primary)
  })()

  langDictCache.set(normalized, promise)
  return promise
}

export interface ItemNameKeysPayload {
  items?: Record<string, string>
}

let itemNameKeysPromise: Promise<Record<string, string>> | null = null

export async function loadItemNameKeys(): Promise<Record<string, string>> {
  if (!itemNameKeysPromise) {
    itemNameKeysPromise = fetchJsonCached<ItemNameKeysPayload>(
      questExportUrl('items/name-keys.json'),
    ).then((data) => data.items ?? {}).catch(() => ({}))
  }
  return itemNameKeysPromise
}
