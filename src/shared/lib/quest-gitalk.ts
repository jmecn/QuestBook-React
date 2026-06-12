import type { GitalkOptions } from 'gitalk'
import type { SiteConfig } from '@/shared/lib/quest-export'

export interface GitalkSiteConfig {
  enabled?: boolean
  clientID?: string
  clientSecret?: string
  repo?: string
  owner?: string
  admin?: string[]
  proxy?: string
  distractionFreeMode?: boolean
  createIssueManually?: boolean
}

const GITALK_ID_MAX = 49

/** Stable issue id per quest (< 50 chars for Gitalk). */
export function questGitalkIssueId(chapterFilename: string, questId: string): string {
  const raw = `quest/${chapterFilename}/${questId}`
  if (raw.length <= GITALK_ID_MAX) return raw
  return raw.slice(0, GITALK_ID_MAX)
}

const GITALK_LANGUAGE: Record<string, string> = {
  en_us: 'en',
  zh_cn: 'zh-CN',
  zh_tw: 'zh-TW',
  zh_hk: 'zh-TW',
  ja_jp: 'ja',
  ko_kr: 'ko',
  fr_fr: 'fr',
  de_de: 'de',
  es_es: 'es',
  ru_ru: 'ru',
  uk_ua: 'ru',
  pl_pl: 'pl',
  pt_br: 'pt',
  tr_tr: 'tr',
  sv_se: 'sv',
  hu_hu: 'hu',
}

export function gitalkLanguageForLocale(locale: string): string {
  const key = locale.trim().toLowerCase().replace(/-/g, '_')
  return GITALK_LANGUAGE[key] ?? 'en'
}

export function isGitalkConfigured(config: SiteConfig): config is SiteConfig & {
  gitalk: GitalkSiteConfig & {
    clientID: string
    repo: string
    owner: string
    admin: string[]
  }
} {
  const g = config.gitalk
  if (!g || g.enabled === false) return false
  if (!g.clientID?.trim() || !g.repo?.trim() || !g.owner?.trim()) return false
  const admin = g.admin?.filter(Boolean) ?? []
  return admin.length > 0
}

export function buildQuestGitalkOptions(
  siteConfig: SiteConfig,
  input: {
    locale: string
    chapterFilename: string
    chapterTitle: string
    questId: string
    questTitle: string
    pageUrl: string
  },
): GitalkOptions | null {
  if (!isGitalkConfigured(siteConfig)) return null

  const g = siteConfig.gitalk!
  const id = questGitalkIssueId(input.chapterFilename, input.questId)

  return {
    clientID: g.clientID!.trim(),
    clientSecret: g.clientSecret?.trim() || undefined,
    repo: g.repo!.trim(),
    owner: g.owner!.trim(),
    admin: g.admin!.map((name) => name.trim()).filter(Boolean),
    id,
    title: `${input.chapterTitle} / ${input.questTitle}`,
    body: [
      'Quest Book discussion',
      '',
      `- Chapter: \`${input.chapterFilename}\``,
      `- Quest ID: \`${input.questId}\``,
      `- Page: ${input.pageUrl}`,
    ].join('\n'),
    labels: ['quest-book', input.chapterFilename].filter(Boolean),
    language: gitalkLanguageForLocale(input.locale),
    distractionFreeMode: g.distractionFreeMode ?? false,
    createIssueManually: g.createIssueManually ?? false,
    proxy: g.proxy?.trim() || undefined,
  }
}
