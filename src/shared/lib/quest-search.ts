import { normalizeLocale } from '@/shared/i18n/locale'
import { loadLocalizedExportJson } from '@/shared/lib/locale-export'
import { questExportUrl } from '@/shared/lib/site-base'
import type { NavigateFunction } from 'react-router-dom'

export interface QuestSearchRow {
  id: string

  chapter: string

  chapterTitle?: string

  title?: string
  content: string
}

export interface QuestSearchIndex {
  schema?: number
  locale?: string
  questCount?: number
  quests: QuestSearchRow[]
}

export function normalizedSearchQuery(input: string): string {
  return String(input || '').trim().toLowerCase()
}

const searchIndexByLocale = new Map<string, Promise<QuestSearchIndex | null>>()

function hasSearchIndex(data: QuestSearchIndex | null): data is QuestSearchIndex {
  return Boolean(data?.quests?.length)
}

export async function loadQuestSearchIndex(locale: string): Promise<QuestSearchIndex | null> {
  const key = normalizeLocale(locale)
  const existing = searchIndexByLocale.get(key)
  if (existing) return existing

  const promise = loadLocalizedExportJson<QuestSearchIndex>(
    (loc) => questExportUrl(`search-index/${loc}.json`),
    key,
    hasSearchIndex,
  )
  searchIndexByLocale.set(key, promise)
  return promise
}

export const QUEST_SEARCH_MAX_RESULTS = 50

export function filterQuestSearchRows(rows: QuestSearchRow[], query: string): QuestSearchRow[] {
  const q = normalizedSearchQuery(query)
  if (!q) return []
  return rows.filter((row) => row.content.includes(q)).slice(0, QUEST_SEARCH_MAX_RESULTS)
}

export function questSearchBreadcrumb(row: QuestSearchRow): string {
  const chapter = row.chapterTitle || row.chapter
  const title = row.title || row.id
  return `${chapter} > ${title}`
}

export function buildQuestDeepLink(locale: string, chapter: string, questId: string): string {
  const params = new URLSearchParams()
  params.set('lang', locale)
  params.set('chapter', chapter)
  return `/?${params.toString()}#quest=${encodeURIComponent(questId)}`
}

export function navigateToQuest(
  navigate: NavigateFunction,
  locale: string,
  currentChapter: string,
  chapter: string,
  questId: string,
): void {
  const hash = `#quest=${encodeURIComponent(questId)}`
  if (chapter === currentChapter) {
    window.location.hash = hash
    return
  }
  navigate({
    pathname: '/',
    search: `?lang=${encodeURIComponent(locale)}&chapter=${encodeURIComponent(chapter)}`,
    hash,
  })
}

const SNIPPET_RADIUS = 72

export function searchResultSnippet(content: string, query: string): string {
  const q = normalizedSearchQuery(query)
  if (!q) return content.slice(0, SNIPPET_RADIUS * 2)
  const lower = content.toLowerCase()
  const index = lower.indexOf(q)
  if (index < 0) return content.slice(0, SNIPPET_RADIUS * 2)
  const start = Math.max(0, index - SNIPPET_RADIUS)
  const end = Math.min(content.length, index + q.length + SNIPPET_RADIUS)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < content.length ? '…' : ''
  return `${prefix}${content.slice(start, end)}${suffix}`
}

export function highlightSnippet(snippet: string, query: string): string {
  const q = normalizedSearchQuery(query)
  if (!q) return snippet
  const lower = snippet.toLowerCase()
  const index = lower.indexOf(q)
  if (index < 0) return snippet
  const before = snippet.slice(0, index)
  const match = snippet.slice(index, index + q.length)
  const after = snippet.slice(index + q.length)
  return `${before}<mark>${match}</mark>${after}`
}
