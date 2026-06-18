import { useEffect, useRef, useState } from 'react'
import Giscus from '@giscus/react'
import { useI18n } from '@/shared/i18n/useI18n'
import { loadGiscusConfig, type GiscusConfig } from '@/shared/lib/giscus-config'
import { giscusLang } from '@/shared/lib/giscus-lang'
import {
  questSharePathname,
  questShareShellUrl,
  resolveQuestSiteBase,
  setGiscusBacklink,
} from '@/shared/lib/quest-share-url'
import { useTheme } from '@/shared/hooks/useTheme'
import type { Theme } from '@/shared/lib/theme'
import '@/styles/quest-giscus.css'

type GiscusWidgetElement = HTMLElement & { theme?: Theme }

function syncGiscusWidgetTheme(root: HTMLElement | null, theme: Theme) {
  const widget = root?.querySelector('giscus-widget') as GiscusWidgetElement | null
  if (widget) widget.theme = theme
}

export interface QuestGiscusProps {
  locale: string
  chapterFilename: string
  questId: string
}

export function QuestGiscus({ locale, chapterFilename, questId }: QuestGiscusProps) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const sectionRef = useRef<HTMLElement>(null)
  const [cfg, setCfg] = useState<GiscusConfig | null>(null)
  const [term, setTerm] = useState('')

  useEffect(() => {
    void loadGiscusConfig().then(setCfg)
  }, [])

  useEffect(() => {
    void resolveQuestSiteBase().then((base) => {
      setTerm(questSharePathname(base, locale, chapterFilename, questId))
      setGiscusBacklink(questShareShellUrl(base, locale, chapterFilename, questId))
    })
    return () => setGiscusBacklink(null)
  }, [locale, chapterFilename, questId])

  useEffect(() => {
    const root = sectionRef.current
    if (!root) return undefined

    const apply = () => syncGiscusWidgetTheme(root, theme)
    apply()

    const observer = new MutationObserver(apply)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [theme])

  if (!cfg || !term) return null

  return (
    <section
      ref={sectionRef}
      className="quest-detail__section quest-detail__section--secondary quest-detail__section--comments"
    >
      <h4>{t('detailComments')}</h4>
      <Giscus
        repo={cfg.repo}
        repoId={cfg.repoId}
        category={cfg.category}
        categoryId={cfg.categoryId}
        mapping="specific"
        term={term}
        strict="1"
        theme={theme}
        lang={giscusLang(locale)}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        loading="lazy"
      />
    </section>
  )
}
