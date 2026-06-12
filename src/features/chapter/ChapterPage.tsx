import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/shared/i18n/useI18n'
import { useBookLayout } from '@/app/context/BookLayoutContext'
import { useQuestExport } from '@/app/context/QuestExportContext'
import { QuestDetailPanel } from '@/features/chapter/QuestDetailPanel'
import { useQuestGlobalAtlas } from '@/app/context/QuestAtlasContext'
import { chapterNeedsIconAtlas, loadChapterAtlasContext } from '@/shared/lib/quest-atlas/chapter-atlas'
import type { ChapterAtlasContext } from '@/shared/lib/quest-atlas/types'
import { applyQuestToSearchParams, questIdFromSearchParams } from '@/shared/lib/quest-url'
import { questDrawerInsetPx } from '@/shared/lib/viewport-inset'
import { PageLoading } from '@/shared/ui/PageLoading'
import type { ChapterData, QuestNode } from '@/shared/types/quest'

const QuestCanvas = lazy(() =>
  import('@/features/chapter/QuestCanvas').then((m) => ({ default: m.QuestCanvas })),
)

function findQuest(chapter: ChapterData, id: string): QuestNode | null {
  return chapter.quests.find((q) => q.id === id) ?? null
}

function normalizeSelectedQuestId(
  selectedId: string | null,
  chapter: ChapterData | null,
  catalog: ReturnType<typeof import('@/shared/lib/quest-catalog').buildQuestCatalog>,
): string | null {
  if (!selectedId || !chapter) return selectedId
  if (catalog.has(selectedId)) return selectedId
  if (selectedId === chapter.id && chapter.quests.length > 0) {
    return chapter.quests[0].id
  }
  return selectedId
}

export function ChapterPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { locale, t } = useI18n()
  const chapterFile = params.get('chapter') ?? ''

  const { globalAtlas, loading: globalAtlasLoading } = useQuestGlobalAtlas()
  const {
    index,
    dict,
    chapters,
    catalog,
    ready,
    error,
    locale: exportLocale,
    ensureChapter,
    ensureChaptersForQuestIds,
  } = useQuestExport()

  const [chapterAtlas, setChapterAtlas] = useState<ChapterAtlasContext | null>(null)
  const [chapterAtlasLoading, setChapterAtlasLoading] = useState(false)
  const [chapterLoading, setChapterLoading] = useState(false)
  const [chapterError, setChapterError] = useState<string | null>(null)

  const { layoutEpoch, sidebarCollapsed, setSidebarCollapsed } = useBookLayout()
  const drawerRef = useRef<HTMLElement>(null)
  const [drawerInset, setDrawerInset] = useState(0)

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    questIdFromSearchParams(new URLSearchParams(window.location.search)),
  )

  useEffect(() => {
    setSelectedId(questIdFromSearchParams(params))
  }, [chapterFile, params])

  useEffect(() => {
    if (!ready || !chapterFile) {
      setChapterLoading(false)
      return undefined
    }
    let cancelled = false
    setChapterLoading(true)
    setChapterError(null)

    void (async () => {
      try {
        const loaded = await ensureChapter(chapterFile)
        if (cancelled) return
        const linkIds = (loaded.questLinks ?? [])
          .map((link) => link.linkedQuest)
          .filter(Boolean)
        if (linkIds.length) {
          await ensureChaptersForQuestIds(linkIds)
        }
      } catch (e) {
        if (!cancelled) {
          setChapterError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        setChapterLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [chapterFile, ensureChapter, ensureChaptersForQuestIds, exportLocale, ready])

  const chapter = useMemo(
    () => chapters.find((ch) => ch.filename === chapterFile) ?? null,
    [chapterFile, chapters],
  )

  useEffect(() => {
    if (!chapter) {
      setChapterAtlas(null)
      setChapterAtlasLoading(false)
      return undefined
    }

    if (!chapterNeedsIconAtlas(chapter)) {
      setChapterAtlas(null)
      setChapterAtlasLoading(false)
      return undefined
    }

    setChapterAtlas(null)
    setChapterAtlasLoading(true)
    let cancelled = false
    void loadChapterAtlasContext(chapter)
      .then((ctx) => {
        if (cancelled) return
        setChapterAtlas(ctx)
      })
      .catch(() => {
        if (cancelled) return
        setChapterAtlas(null)
      })
      .finally(() => {
        if (!cancelled) setChapterAtlasLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [chapter])

  const iconsPending = useMemo(() => {
    if (globalAtlasLoading) return true
    if (!chapter) return false
    return chapterNeedsIconAtlas(chapter) && chapterAtlasLoading
  }, [chapter, chapterAtlasLoading, globalAtlasLoading])

  const effectiveSelectedId = useMemo(
    () => normalizeSelectedQuestId(selectedId, chapter, catalog),
    [catalog, chapter, selectedId],
  )

  useEffect(() => {
    if (!effectiveSelectedId || effectiveSelectedId === selectedId) return
    setSelectedId(effectiveSelectedId)
    setParams(applyQuestToSearchParams(params, effectiveSelectedId), { replace: true })
  }, [effectiveSelectedId, params, selectedId, setParams])

  const selectedQuest = effectiveSelectedId
    ? catalog.get(effectiveSelectedId)?.quest ?? (chapter ? findQuest(chapter, effectiveSelectedId) : null)
    : null

  const onSelectQuest = (id: string) => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setSidebarCollapsed(true)
    }
    setSelectedId(id)
    setParams(applyQuestToSearchParams(params, id), { replace: true })
  }

  const onNavigateQuest = (targetChapter: string, questId: string) => {
    setSelectedId(questId)
    const next = new URLSearchParams({
      lang: locale,
      chapter: targetChapter,
      quest: questId,
    })
    navigate({
      pathname: '/',
      search: `?${next.toString()}`,
    })
  }

  const onCloseDetail = () => {
    setSelectedId(null)
    setParams(applyQuestToSearchParams(params, null), { replace: true })
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

  if (error || chapterError) {
    return <p className="page-message page-message--error">{error ?? chapterError}</p>
  }

  if (!ready || !index || chapterLoading || !chapter || iconsPending) {
    return <PageLoading message={t('loadingChapter')} />
  }

  const gridScale = index.gridScale ?? 0.5

  return (
    <div className="chapter-layout">
      <div className="chapter-map">
        <Suspense fallback={<PageLoading message={t('loadingChapter')} />}>
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
