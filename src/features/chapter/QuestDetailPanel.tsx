import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { QuestRichTextNavigationProvider } from '@/app/context/QuestRichTextNavigationContext'
import { QuestRewardList, QuestTaskList } from '@/features/chapter/QuestDetailItems'
import type { QuestCatalogEntry } from '@/shared/lib/quest-catalog'
import { resolveDependents, resolvePrerequisites } from '@/shared/lib/quest-catalog'
import { useQuestDisplayTitle } from '@/shared/lib/quest-display'
import { fieldGuidePageUrl, fieldGuideSiteBase } from '@/shared/lib/field-guide-links'
import { resolveQuestRichText } from '@/shared/lib/quest-text'
import type { ChapterData, QuestNode as QuestData } from '@/shared/types/quest'
import { QuestDescription } from '@/shared/ui/QuestDescription'
import { QuestRichText } from '@/shared/ui/QuestRichText'

export interface QuestDetailPanelProps {
  quest: QuestData | null
  chapters: ChapterData[]
  catalog: Map<string, QuestCatalogEntry>
  dict: Record<string, string>
  locale: string
  onNavigateQuest: (chapterFilename: string, questId: string) => void
}

const DETAIL_ICON_SIZE = 32
const GUIDE_LINK_LANG_KEY = 'ftbquests.gui.open_in_guide'

function QuestLinkButton({
  entry,
  dict,
  locale,
  onNavigateQuest,
}: {
  entry: QuestCatalogEntry
  dict: Record<string, string>
  locale: string
  onNavigateQuest: (chapterFilename: string, questId: string) => void
}) {
  const label = useQuestDisplayTitle(entry.quest, dict, locale)

  return (
    <li>
      <button
        type="button"
        className="quest-detail__link"
        onClick={() => onNavigateQuest(entry.chapterFilename, entry.id)}
      >
        {label}
      </button>
    </li>
  )
}

function QuestGuidePageLink({
  guidePage,
  locale,
  dict,
}: {
  guidePage: string
  locale: string
  dict: Record<string, string>
}) {
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const base = await fieldGuideSiteBase()
      if (!base || cancelled) return
      setHref(fieldGuidePageUrl(base, locale, guidePage))
    })()
    return () => {
      cancelled = true
    }
  }, [guidePage, locale])

  if (!href) {
    return null
  }

  const label = dict[GUIDE_LINK_LANG_KEY] || 'Click here to read more...'

  return (
    <p className="quest-detail__guide-link">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </p>
  )
}

function QuestLinkList({
  entries,
  dict,
  locale,
  onNavigateQuest,
}: {
  entries: QuestCatalogEntry[]
  dict: Record<string, string>
  locale: string
  onNavigateQuest: (chapterFilename: string, questId: string) => void
}) {
  const { t } = useI18n()

  if (entries.length === 0) {
    return <p className="quest-detail__none">{t('detailNone')}</p>
  }

  return (
    <ul className="quest-detail__links">
      {entries.map((entry) => (
        <QuestLinkButton
          key={entry.id}
          entry={entry}
          dict={dict}
          locale={locale}
          onNavigateQuest={onNavigateQuest}
        />
      ))}
    </ul>
  )
}

export function QuestDetailPanel({
  quest,
  chapters,
  catalog,
  dict,
  locale,
  onNavigateQuest,
}: QuestDetailPanelProps) {
  const { t } = useI18n()

  const prerequisites = useMemo(
    () => (quest ? resolvePrerequisites(quest, catalog) : []),
    [catalog, quest],
  )

  const dependents = useMemo(
    () => (quest ? resolveDependents(quest.id, chapters) : []),
    [chapters, quest],
  )

  const title = useQuestDisplayTitle(
    quest ?? { id: '', x: 0, y: 0 },
    dict,
    locale,
  )

  const subtitleNodes = useMemo(
    () => (quest?.subtitle ? resolveQuestRichText(dict, quest.subtitle) : []),
    [dict, quest?.subtitle],
  )

  if (!quest) {
    return (
      <p className="quest-detail__placeholder">
        {t('detailSelectQuest')}
      </p>
    )
  }

  const rewards = quest.rewards ?? []
  const tasks = quest.tasks ?? []
  const hasBody = subtitleNodes.length > 0 || Boolean(quest.description) || Boolean(quest.guidePage)

  return (
    <div className="quest-detail">
      <h2 id="quest-detail-title">{title}</h2>

      <div className="quest-detail__objectives">
        <section className="quest-detail__panel quest-detail__panel--tasks">
          <h4>{t('detailTasks')}</h4>
          {tasks.length > 0 ? (
            <QuestTaskList
              tasks={tasks}
              dict={dict}
              locale={locale}
              iconSize={DETAIL_ICON_SIZE}
            />
          ) : (
            <p className="quest-detail__none">{t('detailNone')}</p>
          )}
        </section>

        <section className="quest-detail__panel quest-detail__panel--rewards">
          <h4>{t('detailRewards')}</h4>
          {rewards.length > 0 ? (
            <QuestRewardList
              rewards={rewards}
              locale={locale}
              iconSize={DETAIL_ICON_SIZE}
            />
          ) : (
            <p className="quest-detail__none">{t('detailNone')}</p>
          )}
        </section>
      </div>

      {hasBody ? (
        <div className="quest-detail__body">
          {subtitleNodes.length > 0 ? (
            <QuestRichText as="h3" className="quest-detail__subtitle" nodes={subtitleNodes} />
          ) : null}
          {quest.description ? (
            <QuestRichTextNavigationProvider
              catalog={catalog}
              onNavigateQuest={onNavigateQuest}
            >
              <QuestDescription dict={dict} description={quest.description} />
            </QuestRichTextNavigationProvider>
          ) : null}
          {quest.guidePage ? (
            <QuestGuidePageLink guidePage={quest.guidePage} locale={locale} dict={dict} />
          ) : null}
        </div>
      ) : null}

      <section className="quest-detail__section quest-detail__section--secondary">
        <h4>{t('detailPrerequisites')}</h4>
        <QuestLinkList
          entries={prerequisites}
          dict={dict}
          locale={locale}
          onNavigateQuest={onNavigateQuest}
        />
      </section>

      <section className="quest-detail__section quest-detail__section--secondary">
        <h4>{t('detailDependents')}</h4>
        <QuestLinkList
          entries={dependents}
          dict={dict}
          locale={locale}
          onNavigateQuest={onNavigateQuest}
        />
      </section>
    </div>
  )
}
