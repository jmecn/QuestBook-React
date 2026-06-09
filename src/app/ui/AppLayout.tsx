import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookLayoutProvider } from '@/app/context/BookLayoutContext'
import { SiteHeader } from '@/app/ui/SiteHeader'
import { ChapterPage } from '@/features/chapter/ChapterPage'
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
    <BookLayoutProvider>
      <div className="app-shell">
        <SiteHeader />
        <div className="book-body">
          <ChapterSidebar />
          <main className="book-main">
            {chapter ? <ChapterPage /> : <p className="page-message">Loading…</p>}
          </main>
        </div>
      </div>
    </BookLayoutProvider>
  )
}
