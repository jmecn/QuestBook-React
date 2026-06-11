import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { useBookLayout } from '@/app/context/BookLayoutContext'
import { QuestDetailPanel } from '@/features/chapter/QuestDetailPanel'
import { useQuestGlobalAtlas } from '@/app/context/QuestAtlasContext'
import { loadChapterAtlasContext } from '@/shared/lib/quest-atlas/chapter-atlas'
import type { ChapterAtlasContext } from '@/shared/lib/quest-atlas/types'
import { buildQuestCatalog } from '@/shared/lib/quest-catalog'
import { loadChapter, loadLangDict, loadQuestIndex } from '@/shared/lib/quest-export'
import { questDrawerInsetPx } from '@/shared/lib/viewport-inset'
import type { ChapterData, QuestIndex, QuestNode } from '@/shared/types/quest'

const QuestCanvas = lazy(() =>
  import('@/features/chapter/QuestCanvas').then((m) => ({ default: m.QuestCanvas })),
)

function findQuest(chapter: ChapterData, id: string): QuestNode | null {
  return chapter.quests.find((q) => q.id === id) ?? null
}

function normalizeSelectedQuestId(
  selectedId: string | null,
  chapter: ChapterData | null,
  catalog: ReturnType<typeof buildQuestCatalog>,
): string | null {
  if (!selectedId || !chapter) return selectedId
  if (catalog.has(selectedId)) return selectedId
  if (selectedId === chapter.id && chapter.quests.length > 0) {
    return chapter.quests[0].id
  }
  return selectedId
}

function questIdFromHash(hash: string): string | null {
  const match = hash.match(/quest=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function ChapterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { locale, t } = useI18n()
  const chapterFile = params.get('chapter') ?? ''

  const { globalAtlas } = useQuestGlobalAtlas()
  const [chapterAtlas, setChapterAtlas] = useState<ChapterAtlasContext | null>(null)

  const [index, setIndex] = useState<QuestIndex | null>(null)
  const [chapters, setChapters] = useState<ChapterData[]>([])
  const [dict, setDict] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const { layoutEpoch, sidebarCollapsed, setSidebarCollapsed } = useBookLayout()
  const drawerRef = useRef<HTMLElement>(null)
  const [drawerInset, setDrawerInset] = useState(0)

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    questIdFromHash(window.location.hash),
  )

  useEffect(() => {
    const onHash = () => {
      setSelectedId(questIdFromHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    setSelectedId(questIdFromHash(location.hash || window.location.hash))
  }, [chapterFile, location.hash])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        const [idx, langDict] = await Promise.all([
          loadQuestIndex(),
          loadLangDict(locale),
        ])
        const filenames = idx.chapters?.map((ch) => ch.filename).filter(Boolean) ?? []
        const loadedChapters = await Promise.all(filenames.map((filename) => loadChapter(filename)))
        if (cancelled) return
        setIndex(idx)
        setChapters(loadedChapters)
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

  const chapter = useMemo(
    () => chapters.find((ch) => ch.filename === chapterFile) ?? null,
    [chapterFile, chapters],
  )

  useEffect(() => {
    if (!chapter) {
      setChapterAtlas(null)
      return undefined
    }
    let cancelled = false
    void loadChapterAtlasContext(chapter).then((ctx) => {
      if (!cancelled) setChapterAtlas(ctx)
    })
    return () => {
      cancelled = true
    }
  }, [chapter])

  const catalog = useMemo(() => buildQuestCatalog(chapters), [chapters])

  const effectiveSelectedId = useMemo(
    () => normalizeSelectedQuestId(selectedId, chapter, catalog),
    [catalog, chapter, selectedId],
  )

  useEffect(() => {
    if (!effectiveSelectedId || effectiveSelectedId === selectedId) return
    setSelectedId(effectiveSelectedId)
    window.location.hash = `quest=${encodeURIComponent(effectiveSelectedId)}`
  }, [effectiveSelectedId, selectedId])

  const selectedQuest = effectiveSelectedId
    ? catalog.get(effectiveSelectedId)?.quest ?? (chapter ? findQuest(chapter, effectiveSelectedId) : null)
    : null

  const onSelectQuest = (id: string) => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setSidebarCollapsed(true)
    }
    setSelectedId(id)
    window.location.hash = `quest=${encodeURIComponent(id)}`
  }

  const onNavigateQuest = (targetChapter: string, questId: string) => {
    setSelectedId(questId)
    const hash = `#quest=${encodeURIComponent(questId)}`
    if (targetChapter === chapterFile) {
      window.location.hash = hash
      return
    }
    navigate({
      pathname: '/',
      search: `?lang=${encodeURIComponent(locale)}&chapter=${encodeURIComponent(targetChapter)}`,
      hash,
    })
  }

  const onCloseDetail = () => {
    setSelectedId(null)
    const next = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', next)
  }

  useEffect(() => {
    if (!selectedQuest) {
      setDrawerInset(0)
      return undefined
    }

    const measure = () => {
      if (window.innerWidth <= 900) {
        setDrawerInset(0)
        return
      }
      const width = drawerRef.current?.getBoundingClientRect().width
      if (width && width > 0) {
        setDrawerInset(width)
        return
      }
      setDrawerInset(questDrawerInsetPx(window.innerWidth))
    }

    measure()
    const drawerEl = drawerRef.current
    if (!drawerEl) return undefined

    const observer = new ResizeObserver(measure)
    observer.observe(drawerEl)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [layoutEpoch, selectedQuest])

  if (error) {
    return <p className="page-message page-message--error">{error}</p>
  }

  if (!chapter || !index) {
    return <p className="page-message">{t('loadingChapter')}</p>
  }

  const gridScale = index.gridScale ?? 0.5

  return (
    <div className="chapter-layout">
      <div className="chapter-map">
        <Suspense fallback={<p className="page-message">{t('loadingChapter')}</p>}>
          <QuestCanvas
            chapter={chapter}
            catalog={catalog}
            dict={dict}
            gridScale={gridScale}
            selectedId={effectiveSelectedId}
            locale={locale}
            drawerInset={drawerInset}
            layoutEpoch={layoutEpoch}
            sidebarCollapsed={sidebarCollapsed}
            globalAtlas={globalAtlas}
            chapterAtlas={chapterAtlas}
            onSelectQuest={onSelectQuest}
            onClearSelection={onCloseDetail}
          />
        </Suspense>
      </div>
      {selectedQuest ? (
        <aside
          ref={drawerRef}
          className="chapter-detail chapter-detail--drawer"
          aria-labelledby="quest-detail-title"
        >
          <div className="chapter-detail__toolbar">
            <button
              type="button"
              className="chapter-detail__close"
              aria-label={t('detailClose')}
              onClick={onCloseDetail}
            >
              ×
            </button>
          </div>
          <QuestDetailPanel
            quest={selectedQuest}
            chapters={chapters}
            catalog={catalog}
            dict={dict}
            locale={locale}
            globalAtlas={globalAtlas}
            chapterAtlas={chapterAtlas}
            onNavigateQuest={onNavigateQuest}
          />
        </aside>
      ) : null}
    </div>
  )
}
