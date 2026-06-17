import type { GitalkOptions } from 'gitalk'

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

const GITALK_CONFIG_URLS = ['/gitalk-config.json', 'https://wiki.terrafirmagreg.team/gitalk-config.json']

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

export function isGitalkConfigured(
  config: GitalkSiteConfig | null | undefined,
): config is GitalkSiteConfig & {
  clientID: string
  repo: string
  owner: string
  admin: string[]
} {
  if (!config || config.enabled === false) return false
  if (!config.clientID?.trim() || !config.repo?.trim() || !config.owner?.trim()) return false
  const admin = config.admin?.filter(Boolean) ?? []
  return admin.length > 0
}

export async function loadGitalkConfig(): Promise<GitalkSiteConfig | null> {
  for (const url of GITALK_CONFIG_URLS) {
    try {
      const res = await fetch(url)
      if (res.ok) return (await res.json()) as GitalkSiteConfig
    } catch {
      // try next
    }
  }
  return null
}

export function buildQuestGitalkOptions(
  gitalkConfig: GitalkSiteConfig,
  input: {
    locale: string
    chapterFilename: string
    chapterTitle: string
    questId: string
    questTitle: string
    pageUrl: string
  },
): GitalkOptions | null {
  if (!isGitalkConfigured(gitalkConfig)) return null

  const g = gitalkConfig
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
