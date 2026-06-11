import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { normalizeLocale } from '@/shared/i18n/locale'
import { buildQuestCatalog } from '@/shared/lib/quest-catalog'
import { loadQuestChapterIndex } from '@/shared/lib/quest-chapter-index'
import { loadChapter, loadLangDict, loadQuestIndex } from '@/shared/lib/quest-export'
import type { ChapterData, QuestIndex } from '@/shared/types/quest'

interface QuestExportContextValue {
  locale: string
  index: QuestIndex | null
  dict: Record<string, string>
  chapters: ChapterData[]
  catalog: ReturnType<typeof buildQuestCatalog>
  ready: boolean
  error: string | null
  ensureChapter: (filename: string) => Promise<ChapterData>
  ensureChaptersForQuestIds: (questIds: string[]) => Promise<void>
}

const QuestExportContext = createContext<QuestExportContextValue | null>(null)

export function QuestExportProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams()
  const locale = normalizeLocale(params.get('lang') ?? 'en_us')

  const [index, setIndex] = useState<QuestIndex | null>(null)
  const [dict, setDict] = useState<Record<string, string>>({})
  const [chaptersByFile, setChaptersByFile] = useState<Map<string, ChapterData>>(new Map())
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chapterLoadsRef = useRef(new Map<string, Promise<ChapterData>>())

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)
    setIndex(null)
    setDict({})
    setChaptersByFile(new Map())
    chapterLoadsRef.current.clear()

    void (async () => {
      try {
        const [idx, langDict] = await Promise.all([
          loadQuestIndex(),
          loadLangDict(locale),
        ])
        if (cancelled) return
        setIndex(idx)
        setDict(langDict)
        setReady(true)
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

  const ensureChapter = useCallback(async (filename: string): Promise<ChapterData> => {
    let pending = chapterLoadsRef.current.get(filename)
    if (!pending) {
      pending = loadChapter(filename).then((chapter) => {
        setChaptersByFile((prev) => {
          if (prev.has(filename)) return prev
          const next = new Map(prev)
          next.set(filename, chapter)
          return next
        })
        return chapter
      })
      chapterLoadsRef.current.set(filename, pending)
    }
    return pending
  }, [])

  const ensureChaptersForQuestIds = useCallback(async (questIds: string[]) => {
    if (!questIds.length) return
    const chapterIndex = await loadQuestChapterIndex(locale)
    const filenames = new Set<string>()
    for (const questId of questIds) {
      const filename = chapterIndex.get(questId)
      if (filename) filenames.add(filename)
    }
    await Promise.all([...filenames].map((filename) => ensureChapter(filename)))
  }, [ensureChapter, locale])

  const chapters = useMemo(
    () => [...chaptersByFile.values()],
    [chaptersByFile],
  )

  const catalog = useMemo(() => buildQuestCatalog(chapters), [chapters])

  const value = useMemo<QuestExportContextValue>(() => ({
    locale,
    index,
    dict,
    chapters,
    catalog,
    ready,
    error,
    ensureChapter,
    ensureChaptersForQuestIds,
  }), [
    catalog,
    chapters,
    dict,
    ensureChapter,
    ensureChaptersForQuestIds,
    error,
    index,
    locale,
    ready,
  ])

  return (
    <QuestExportContext.Provider value={value}>
      {children}
    </QuestExportContext.Provider>
  )
}

export function useQuestExport(): QuestExportContextValue {
  const ctx = useContext(QuestExportContext)
  if (!ctx) {
    throw new Error('useQuestExport must be used within QuestExportProvider')
  }
  return ctx
}
