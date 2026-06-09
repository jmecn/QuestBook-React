import { useMemo } from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { QuestRewardListItem, QuestTaskListItem } from '@/features/chapter/QuestDetailItems'
import type { QuestCatalogEntry } from '@/shared/lib/quest-catalog'
import { resolveDependents, resolvePrerequisites } from '@/shared/lib/quest-catalog'
import { useQuestDisplayTitle } from '@/shared/lib/quest-display'
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

  return (
    <div className="quest-detail">
      <h2 id="quest-detail-title">{title}</h2>
      {subtitleNodes.length > 0 ? (
        <QuestRichText as="h3" className="quest-detail__subtitle" nodes={subtitleNodes} />
      ) : null}
      {quest.description ? (
        <QuestDescription dict={dict} description={quest.description} />
      ) : null}

      <section className="quest-detail__section">
        <h4>{t('detailTasks')}</h4>
        {quest.tasks && quest.tasks.length > 0 ? (
          <ul className="quest-detail__list">
            {quest.tasks.map((task) => (
              <QuestTaskListItem key={task.id} task={task} dict={dict} locale={locale} />
            ))}
          </ul>
        ) : (
          <p className="quest-detail__none">{t('detailNone')}</p>
        )}
      </section>

      <section className="quest-detail__section">
        <h4>{t('detailRewards')}</h4>
        {rewards.length > 0 ? (
          <ul className="quest-detail__list">
            {rewards.map((reward) => (
              <QuestRewardListItem key={reward.id} reward={reward} locale={locale} />
            ))}
          </ul>
        ) : (
          <p className="quest-detail__none">{t('detailNone')}</p>
        )}
      </section>

      <section className="quest-detail__section">
        <h4>{t('detailPrerequisites')}</h4>
        <QuestLinkList
          entries={prerequisites}
          dict={dict}
          locale={locale}
          onNavigateQuest={onNavigateQuest}
        />
      </section>

      <section className="quest-detail__section">
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
