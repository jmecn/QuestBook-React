import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import {
  filterQuestSearchRows,
  highlightSnippet,
  loadQuestSearchIndex,
  navigateToQuest,
  questSearchBreadcrumb,
  searchResultSnippet,
  type QuestSearchRow,
} from '@/shared/lib/quest-search'
import '@/styles/search-modal.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface QuestSearchModalProps {
  open: boolean
  initialQuery: string
  onClose: () => void
}

const indexCache = new Map<string, QuestSearchRow[] | null>()

export function QuestSearchModal({ open, initialQuery, onClose }: QuestSearchModalProps) {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const currentChapter = params.get('chapter') ?? ''
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(initialQuery)
  const [rows, setRows] = useState<QuestSearchRow[] | null>(null)
  const [hasIndex, setHasIndex] = useState(true)

  useEffect(() => {
    if (!open) return
    setQuery(initialQuery)
  }, [initialQuery, open])

  useEffect(() => {
    if (!open) return
    const cached = indexCache.get(locale)
    if (cached !== undefined) {
      setRows(cached)
      setHasIndex(cached !== null && cached.length > 0)
      return
    }

    let cancelled = false
    setRows(null)
    void loadQuestSearchIndex(locale).then((index) => {
      if (cancelled) return
      const quests = index?.quests ?? null
      indexCache.set(locale, quests)
      setRows(quests)
      setHasIndex(Boolean(quests?.length))
    })
    return () => {
      cancelled = true
    }
  }, [locale, open])

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const trimmedQuery = query.trim()
  const showBody = Boolean(trimmedQuery)
  const results = useMemo(() => {
    if (!rows || !trimmedQuery) return []
    return filterQuestSearchRows(rows, trimmedQuery)
  }, [rows, trimmedQuery])

  const selectResult = (row: QuestSearchRow) => {
    navigateToQuest(navigate, locale, currentChapter, row.chapter, row.id)
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  if (!open) return null

  return createPortal(
    <div className="search-modal-overlay" onClick={onClose}>
      <div
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('searchTitle')}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className={`search-modal-header${showBody ? ' search-modal-header--divider' : ''}`}>
          <label className="search-modal-query">
            <span className="search-modal-query-icon">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="search"
              className="search-modal-query-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              spellCheck={false}
              aria-label={t('searchPlaceholder')}
            />
          </label>
        </div>

        {showBody ? (
        <div className="search-modal-body">
          {rows === null ? (
            <p className="search-modal-message">{t('searchLoading')}</p>
          ) : results.length === 0 ? (
            <p className="search-modal-message">
              {t('searchNoResults')}
              {!hasIndex ? ` ${t('searchIndexMissing')}` : ''}
            </p>
          ) : (
            <ul className="search-modal-results">
              {results.map((row) => {
                const breadcrumb = questSearchBreadcrumb(row)
                const snippet = searchResultSnippet(row.content, trimmedQuery)
                return (
                  <li key={`${row.chapter}:${row.id}`}>
                    <button
                      type="button"
                      className="search-modal-result"
                      onClick={() => selectResult(row)}
                    >
                      <span
                        className="search-modal-breadcrumb"
                        dangerouslySetInnerHTML={{
                          __html: highlightSnippet(breadcrumb, trimmedQuery),
                        }}
                      />
                      <span
                        className="search-modal-snippet"
                        dangerouslySetInnerHTML={{
                          __html: highlightSnippet(snippet, trimmedQuery),
                        }}
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
