import { useEffect } from 'react'
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { BookLayoutProvider } from '@/app/context/BookLayoutContext'
import { SiteHeader } from '@/app/ui/SiteHeader'
import { QuestSearchProvider } from '@/features/search/QuestSearchContext'
import { ChapterSidebar } from '@/features/chapter/ChapterSidebar'
import { loadQuestIndex } from '@/shared/lib/quest-export'
import '@/styles/site-shell.css'

export function AppLayout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const locale = params.get('lang') ?? 'en_us'
  const chapter = params.get('chapter')

  useEffect(() => {
    if (chapter) return
    let cancelled = false
    void loadQuestIndex().then((index) => {
      if (cancelled) return
      const first = index.chapters?.[0]?.filename
      if (first) {
        navigate(`/?lang=${locale}&chapter=${first}`, { replace: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [chapter, locale, navigate])

  return (
    <QuestSearchProvider>
      <BookLayoutProvider>
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
    </QuestSearchProvider>
  )
}
