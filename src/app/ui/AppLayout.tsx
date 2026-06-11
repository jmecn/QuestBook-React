import { useEffect } from 'react'
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { BookLayoutProvider } from '@/app/context/BookLayoutContext'
import { QuestExportProvider, useQuestExport } from '@/app/context/QuestExportContext'
import { QuestAtlasProvider } from '@/app/context/QuestAtlasContext'
import { SiteHeader } from '@/app/ui/SiteHeader'
import { QuestSearchProvider } from '@/features/search/QuestSearchContext'
import { ChapterSidebar } from '@/features/chapter/ChapterSidebar'
import '@/styles/site-shell.css'

function AppLayoutRedirect() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const locale = params.get('lang') ?? 'en_us'
  const chapter = params.get('chapter')
  const { index, ready } = useQuestExport()

  useEffect(() => {
    if (chapter || !ready || !index) return
    const first = index.chapters?.[0]?.filename
    if (first) {
      navigate(`/?lang=${locale}&chapter=${first}`, { replace: true })
    }
  }, [chapter, index, locale, navigate, ready])

  return null
}

function AppLayoutBody() {
  const [params] = useSearchParams()
  const chapter = params.get('chapter')

  return (
    <BookLayoutProvider>
      <AppLayoutRedirect />
      <div className="app-shell">
        <SiteHeader />
        <div className="book-body">
          <ChapterSidebar />
          <main className="book-main">
            {chapter ? <Outlet /> : <p className="page-message">Loading…</p>}
          </main>
        </div>
      </div>
    </BookLayoutProvider>
  )
}

export function AppLayout() {
  return (
    <QuestSearchProvider>
      <QuestExportProvider>
        <QuestAtlasProvider>
          <AppLayoutBody />
        </QuestAtlasProvider>
      </QuestExportProvider>
    </QuestSearchProvider>
  )
}
