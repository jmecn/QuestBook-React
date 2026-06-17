import { useEffect, useState } from 'react'
import Giscus from '@giscus/react'
import { useI18n } from '@/shared/i18n/useI18n'
import { loadGiscusConfig, type GiscusConfig } from '@/shared/lib/giscus-config'
import { giscusLang } from '@/shared/lib/giscus-lang'
import { questSharePathname, resolveQuestSiteBase } from '@/shared/lib/quest-share-url'
import { useTheme } from '@/shared/hooks/useTheme'
import '@/styles/quest-giscus.css'

export interface QuestGiscusProps {
  locale: string
  chapterFilename: string
  questId: string
}

export function QuestGiscus({ locale, chapterFilename, questId }: QuestGiscusProps) {
  const { t } = useI18n()
  const { theme } = useTheme()
  const [cfg, setCfg] = useState<GiscusConfig | null>(null)
  const [term, setTerm] = useState('')

  useEffect(() => {
    void loadGiscusConfig().then(setCfg)
  }, [])

  useEffect(() => {
    void resolveQuestSiteBase().then((base) => {
      setTerm(questSharePathname(base, locale, chapterFilename, questId))
    })
  }, [locale, chapterFilename, questId])

  if (!cfg || !term) return null

  return (
    <section className="quest-detail__section quest-detail__section--secondary quest-detail__section--comments">
      <h4>{t('detailComments')}</h4>
      <Giscus
        repo={cfg.repo}
        repoId={cfg.repoId}
        category={cfg.category}
        categoryId={cfg.categoryId}
        mapping="specific"
        term={term}
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
