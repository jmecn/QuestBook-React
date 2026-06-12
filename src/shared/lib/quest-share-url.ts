import { loadSiteConfig } from '@/shared/lib/quest-export'
import { siteBase } from '@/shared/lib/site-base'
import { QUEST_QUERY_KEY } from '@/shared/lib/quest-url'

export const DEFAULT_SHARE_OG_IMAGE = 'https://wiki.terrafirmagreg.team/logo.png'

let cachedSiteBase: string | null | undefined

function normalizeSiteRoot(url: string): string {
  return String(url || '').trim().replace(/\/+$/, '')
}

/** Fallback when site-config.json has no siteBaseUrl (local preview). */
export function questSiteOriginBase(): string {
  const prefix = siteBase()
  const origin = window.location.origin
  if (prefix === '/') return origin
  return `${origin}${prefix.replace(/\/$/, '')}`
}

export async function resolveQuestSiteBase(): Promise<string> {
  if (cachedSiteBase !== undefined) {
    return cachedSiteBase ?? questSiteOriginBase()
  }
  const config = await loadSiteConfig()
  const fromConfig = config.siteBaseUrl?.trim()
  if (fromConfig) {
    cachedSiteBase = normalizeSiteRoot(fromConfig)
    return cachedSiteBase
  }
  cachedSiteBase = null
  return questSiteOriginBase()
}

export function questShareShellUrl(
  siteBaseUrl: string,
  locale: string,
  chapterFilename: string,
  questId: string,
): string {
  const root = normalizeSiteRoot(siteBaseUrl)
  const loc = locale.trim().toLowerCase().replace(/-/g, '_')
  return `${root}/share/${loc}/quests/${chapterFilename}/${questId}.html`
}

export function questAppDeepLink(
  siteBaseUrl: string,
  locale: string,
  chapterFilename: string,
  questId: string,
): string {
  const root = normalizeSiteRoot(siteBaseUrl)
  const params = new URLSearchParams({
    lang: locale,
    chapter: chapterFilename,
    [QUEST_QUERY_KEY]: questId,
  })
  return `${root}/?${params.toString()}`
}
