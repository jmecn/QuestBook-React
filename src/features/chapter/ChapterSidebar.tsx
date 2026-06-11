import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { useBookLayout } from '@/app/context/BookLayoutContext'
import { useQuestExport } from '@/app/context/QuestExportContext'
import { useQuestGlobalAtlas } from '@/app/context/QuestAtlasContext'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import { setQuestHash } from '@/shared/lib/quest-hash'
import { resolveQuestText, resolveQuestRichText, resolveQuestLines } from '@/shared/lib/quest-text'
import { QuestRichText } from '@/shared/ui/QuestRichText'
import { QuestHoverLabel } from '@/shared/ui/QuestHoverLabel'
import { DEFAULT_CHAPTER_GROUP_ID } from '@/shared/lib/chapter-image-style'
import type { ChapterGroup, ChapterSummary, QuestIndex } from '@/shared/types/quest'

function sortChaptersInGroup(chapters: ChapterSummary[]): ChapterSummary[] {
  return [...chapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
}

function sidebarGroupLabel(group: ChapterGroup): ChapterGroup | null {
  return group.id === DEFAULT_CHAPTER_GROUP_ID ? null : group
}

function groupChapters(
  index: QuestIndex,
): Array<{ group: ChapterGroup | null; chapters: ChapterSummary[] }> {
  const groups = [...(index.chapterGroups ?? [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  )
  const grouped = new Map<string | null, ChapterSummary[]>()

  for (const chapter of index.chapters ?? []) {
    const key = chapter.group ?? null
    const list = grouped.get(key) ?? []
    list.push(chapter)
    grouped.set(key, list)
  }

  if (groups.length === 0) {
    return [{ group: null, chapters: sortChaptersInGroup(index.chapters ?? []) }]
  }

  const sections: Array<{ group: ChapterGroup | null; chapters: ChapterSummary[] }> = []
  const used = new Set<string>()

  for (const group of groups) {
    const list = grouped.get(group.id)
    if (!list?.length) continue
    used.add(group.id)
    sections.push({
      group: sidebarGroupLabel(group),
      chapters: sortChaptersInGroup(list),
    })
  }

  const ungrouped = grouped.get(null)
  if (ungrouped?.length) {
    sections.unshift({ group: null, chapters: sortChaptersInGroup(ungrouped) })
  }

  for (const [groupId, list] of grouped) {
    if (groupId && !used.has(groupId) && list.length) {
      sections.push({
        group: { id: groupId, title: groupId },
        chapters: sortChaptersInGroup(list),
      })
    }
  }

  return sections.length > 0
    ? sections
    : [{ group: null, chapters: sortChaptersInGroup(index.chapters ?? []) }]
}

function chapterLabel(chapter: ChapterSummary, dict: Record<string, string>): string {
  return resolveQuestText(dict, chapter.title) || chapter.filename
}

function chapterSubtitle(chapter: ChapterSummary, dict: Record<string, string>): string {
  return resolveQuestLines(dict, chapter.subtitle)
}

function chapterLabelNodes(chapter: ChapterSummary, dict: Record<string, string>) {
  if (chapter.title) {
    return resolveQuestRichText(dict, chapter.title)
  }
  return [{ type: 'text' as const, text: chapter.filename, style: {} }]
}

export function ChapterSidebar() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { locale, t } = useI18n()
  const { sidebarCollapsed: collapsed, toggleSidebar } = useBookLayout()
  const { globalAtlas } = useQuestGlobalAtlas()
  const { index, dict, ready, error } = useQuestExport()
  const activeChapter = params.get('chapter') ?? ''

  const selectChapter = (filename: string) => {
    setParams({ lang: locale, chapter: filename })
    navigate(`/?lang=${locale}&chapter=${filename}`, { replace: true })
    setQuestHash(null)
  }

  if (error) {
    return <aside className="chapter-sidebar"><p className="page-message page-message--error">{error}</p></aside>
  }

  if (!ready || !index) {
    return <aside className="chapter-sidebar"><p className="page-message">{t('loading')}</p></aside>
  }

  const bookTitlePlain = resolveQuestText(dict, index.title)
  const sections = groupChapters(index)
  const sidebarClass = collapsed ? 'chapter-sidebar is-collapsed' : 'chapter-sidebar'

  return (
    <aside className={sidebarClass} aria-label={t('chapters')}>
      <div className="chapter-sidebar__header">
        <div className="chapter-sidebar__title">
          {bookTitlePlain ? (
            <QuestRichText nodes={resolveQuestRichText(dict, index.title)} />
          ) : (
            t('appTitle')
          )}
        </div>
        <button
          type="button"
          className="chapter-sidebar__toggle"
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('sidebarExpand') : t('sidebarCollapse')}
          title={collapsed ? t('sidebarExpand') : t('sidebarCollapse')}
          onClick={toggleSidebar}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <nav className="chapter-sidebar__nav">
        {sections.map(({ group, chapters }) => {
          const groupTitlePlain = group
            ? resolveQuestText(dict, group.title) || group.id
            : null
          return (
            <section key={group?.id ?? '_ungrouped'} className="chapter-sidebar__section">
              {groupTitlePlain && group ? (
                <h2 className="chapter-sidebar__group">
                  <QuestRichText nodes={resolveQuestRichText(dict, group.title)} />
                </h2>
              ) : null}
              <ul className="chapter-sidebar__list">
                {chapters.map((chapter) => {
                  const active = chapter.filename === activeChapter
                  const label = chapterLabel(chapter, dict)
                  const subtitle = chapterSubtitle(chapter, dict)
                  return (
                    <li key={chapter.filename}>
                      <QuestHoverLabel
                        as="button"
                        type="button"
                        className={`chapter-sidebar__item${active ? ' is-active' : ''}`}
                        label={label}
                        subtitle={subtitle || undefined}
                        onClick={() => selectChapter(chapter.filename)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <QuestIcon
                          display={chapter.iconDisplay}
                          icon={chapter.icon}
                          globalAtlas={globalAtlas}
                          size={32}
                          variant="tile"
                          tooltip=""
                        />
                        <span className="chapter-sidebar__label">
                          <QuestRichText nodes={chapterLabelNodes(chapter, dict)} />
                        </span>
                      </QuestHoverLabel>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </nav>
    </aside>
  )
}
