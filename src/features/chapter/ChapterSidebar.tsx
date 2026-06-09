import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { useBookLayout } from '@/app/context/BookLayoutContext'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import { loadLangDict, loadQuestIndex } from '@/shared/lib/quest-export'
import { resolveQuestText } from '@/shared/lib/quest-text'
import type { ChapterGroup, ChapterSummary, QuestIndex } from '@/shared/types/quest'

function groupChapters(
  index: QuestIndex,
): Array<{ group: ChapterGroup | null; chapters: ChapterSummary[] }> {
  const chapters = [...(index.chapters ?? [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  )
  const groups = index.chapterGroups ?? []
  const grouped = new Map<string | null, ChapterSummary[]>()

  for (const chapter of chapters) {
    const key = chapter.group ?? null
    const list = grouped.get(key) ?? []
    list.push(chapter)
    grouped.set(key, list)
  }

  if (groups.length === 0) {
    return [{ group: null, chapters }]
  }

  const sections: Array<{ group: ChapterGroup | null; chapters: ChapterSummary[] }> = []
  const used = new Set<string>()

  for (const group of groups) {
    const list = grouped.get(group.id)
    if (!list?.length) continue
    used.add(group.id)
    sections.push({ group, chapters: list })
  }

  const ungrouped = grouped.get(null)
  if (ungrouped?.length) {
    sections.unshift({ group: null, chapters: ungrouped })
  }

  for (const [groupId, list] of grouped) {
    if (groupId && !used.has(groupId) && list.length) {
      sections.push({ group: { id: groupId, title: groupId }, chapters: list })
    }
  }

  return sections.length > 0 ? sections : [{ group: null, chapters }]
}

function chapterLabel(chapter: ChapterSummary, dict: Record<string, string>): string {
  return resolveQuestText(dict, chapter.title) || chapter.filename
}

export function ChapterSidebar() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { locale, t } = useI18n()
  const { sidebarCollapsed: collapsed, toggleSidebar } = useBookLayout()
  const activeChapter = params.get('chapter') ?? ''

  const [index, setIndex] = useState<QuestIndex | null>(null)
  const [dict, setDict] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
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

  const selectChapter = (filename: string) => {
    setParams({ lang: locale, chapter: filename })
    navigate(`/?lang=${locale}&chapter=${filename}`, { replace: true })
    window.location.hash = ''
  }

  if (error) {
    return <aside className="chapter-sidebar"><p className="page-message page-message--error">{error}</p></aside>
  }

  if (!index) {
    return <aside className="chapter-sidebar"><p className="page-message">{t('loading')}</p></aside>
  }

  const bookTitle = resolveQuestText(dict, index.title) || t('appTitle')
  const sections = groupChapters(index)
  const sidebarClass = collapsed ? 'chapter-sidebar is-collapsed' : 'chapter-sidebar'

  return (
    <aside className={sidebarClass} aria-label={t('chapters')}>
      <div className="chapter-sidebar__header">
        <div className="chapter-sidebar__title">{bookTitle}</div>
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
          const groupTitle = group
            ? resolveQuestText(dict, group.title) || group.id
            : null
          return (
            <section key={group?.id ?? '_ungrouped'} className="chapter-sidebar__section">
              {groupTitle ? (
                <h2 className="chapter-sidebar__group">{groupTitle}</h2>
              ) : null}
              <ul className="chapter-sidebar__list">
                {chapters.map((chapter) => {
                  const active = chapter.filename === activeChapter
                  const label = chapterLabel(chapter, dict)
                  return (
                    <li key={chapter.filename}>
                      <button
                        type="button"
                        className={`chapter-sidebar__item${active ? ' is-active' : ''}`}
                        onClick={() => selectChapter(chapter.filename)}
                        aria-current={active ? 'page' : undefined}
                        title={collapsed ? label : undefined}
                      >
                        <QuestIcon icon={chapter.icon} size={32} variant="tile" />
                        <span className="chapter-sidebar__label">{label}</span>
                      </button>
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
