import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import { loadLangDict, loadQuestIndex } from '@/shared/lib/quest-export'
import { resolveQuestText } from '@/shared/lib/quest-text'
import type { QuestIndex } from '@/shared/types/quest'

export function HomePage() {
  const { locale, t } = useI18n()

  const [index, setIndex] = useState<QuestIndex | null>(null)
  const [dict, setDict] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [idx, langDict] = await Promise.all([
          loadQuestIndex(),
          loadLangDict(locale),
        ])
        if (cancelled) return
        setIndex(idx)
        setDict(langDict)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [locale])

  if (error) {
    return <p className="page-message page-message--error">{error}</p>
  }

  if (!index) {
    return <p className="page-message">{t('loading')}</p>
  }

  const bookTitle = resolveQuestText(dict, index.title) || t('appTitle')

  return (
    <div className="home-page">
      <h1>{bookTitle}</h1>
      {index.chapterGroups && index.chapterGroups.length > 0 ? (
        <section>
          <h2>{t('chapterGroups')}</h2>
          <ul>
            {index.chapterGroups.map((group) => (
              <li key={group.id}>{resolveQuestText(dict, group.title) || group.id}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <h2>{t('chapters')}</h2>
        <ul className="chapter-list">
          {(index.chapters ?? []).map((chapter) => (
            <li key={chapter.filename}>
              <Link to={`/?lang=${locale}&chapter=${chapter.filename}`}>
                <QuestIcon icon={chapter.icon} size={32} />
                <span>{chapter.filename}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
