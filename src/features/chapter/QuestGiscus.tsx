import { useEffect, useRef } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { questSharePathname, resolveQuestSiteBase } from '@/shared/lib/quest-share-url'
import '@/styles/quest-giscus.css'

const GISCUS_DEFAULT = {
  repo: 'TerraFirmaGreg-Team/Modpack-Modern',
  repoId: 'R_kgDOH_FIbA',
  category: 'General',
  categoryId: 'DIC_kwDOH_FIbM4CbMDm',
}

const GISCUS_LANG: Record<string, string> = {
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

type GiscusConfig = typeof GISCUS_DEFAULT & { enabled?: boolean }

function giscusLang(locale: string) {
  const key = locale.trim().toLowerCase().replace(/-/g, '_')
  return GISCUS_LANG[key] ?? 'en'
}

function giscusTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function mountGiscus(container: HTMLElement, cfg: GiscusConfig, term: string, lang: string) {
  const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: { term, lang, theme: giscusTheme() },
        },
      },
      'https://giscus.app',
    )
    return
  }

  container.replaceChildren()
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', cfg.repo)
  script.setAttribute('data-repo-id', cfg.repoId)
  script.setAttribute('data-category', cfg.category)
  script.setAttribute('data-category-id', cfg.categoryId)
  script.setAttribute('data-mapping', 'specific')
  script.setAttribute('data-term', term)
  script.setAttribute('data-theme', giscusTheme())
  script.setAttribute('data-lang', lang)
  script.setAttribute('data-loading', 'lazy')
  script.crossOrigin = 'anonymous'
  script.async = true
  container.appendChild(script)
}

async function loadGiscusConfig(): Promise<GiscusConfig | null> {
  for (const url of ['/giscus-config.json', 'https://wiki.terrafirmagreg.team/giscus-config.json']) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const json = (await res.json()) as GiscusConfig
      if (json.enabled === false || !json.repoId) return null
      return { ...GISCUS_DEFAULT, ...json }
    } catch {
    }
  }
  return GISCUS_DEFAULT
}

export interface QuestGiscusProps {
  locale: string
  chapterFilename: string
  questId: string
}

export function QuestGiscus({ locale, chapterFilename, questId }: QuestGiscusProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    void (async () => {
      const cfg = await loadGiscusConfig()
      if (!cfg || cancelled) return
      const siteBase = await resolveQuestSiteBase()
      if (cancelled) return
      const term = questSharePathname(siteBase, locale, chapterFilename, questId)
      mountGiscus(container, cfg, term, giscusLang(locale))
    })()

    const onTheme = () => {
      const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
      iframe?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: giscusTheme() } } },
        'https://giscus.app',
      )
    }
    window.addEventListener('storage', onTheme)
    const observer = new MutationObserver(onTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      cancelled = true
      window.removeEventListener('storage', onTheme)
      observer.disconnect()
      container.replaceChildren()
    }
  }, [locale, chapterFilename, questId])

  return (
    <section className="quest-detail__section quest-detail__section--secondary quest-detail__section--comments">
      <h4>{t('detailComments')}</h4>
      <div ref={containerRef} className="quest-giscus" />
    </section>
  )
}
