import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { loadSiteConfig } from '@/shared/lib/quest-export'
import { buildQuestGitalkOptions, isGitalkConfigured } from '@/shared/lib/quest-gitalk'
import 'gitalk/dist/gitalk.css'
import '@/styles/quest-gitalk.css'

export interface QuestGitalkProps {
  locale: string
  chapterFilename: string
  chapterTitle: string
  questId: string
  questTitle: string
}

export function QuestGitalk({
  locale,
  chapterFilename,
  chapterTitle,
  questId,
  questTitle,
}: QuestGitalkProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadSiteConfig().then((config) => {
      if (!cancelled) setReady(isGitalkConfigured(config))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!ready || !container) return

    let cancelled = false

    void (async () => {
      const siteConfig = await loadSiteConfig()
      const options = buildQuestGitalkOptions(siteConfig, {
        locale,
        chapterFilename,
        chapterTitle,
        questId,
        questTitle,
        pageUrl: window.location.href,
      })
      if (!options || cancelled) return

      const { default: Gitalk } = await import('gitalk')
      if (cancelled) return

      container.replaceChildren()
      const gitalk = new Gitalk(options)
      gitalk.render(container)
    })()

    return () => {
      cancelled = true
      container.replaceChildren()
    }
  }, [ready, locale, chapterFilename, chapterTitle, questId, questTitle])

  if (!ready) return null

  return (
    <section className="quest-detail__section quest-detail__section--comments">
      <h4>{t('detailComments')}</h4>
      <div ref={containerRef} className="quest-gitalk" />
    </section>
  )
}
