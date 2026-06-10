import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { QuestSearchModal } from '@/features/search/QuestSearchModal'

interface QuestSearchContextValue {
  open: boolean
  openSearch: (query?: string) => void
  closeSearch: () => void
}

const QuestSearchContext = createContext<QuestSearchContextValue | null>(null)

export function useQuestSearch(): QuestSearchContextValue {
  const ctx = useContext(QuestSearchContext)
  if (!ctx) {
    throw new Error('useQuestSearch must be used within QuestSearchProvider')
  }
  return ctx
}

export function QuestSearchProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  const openSearch = useCallback((query = '') => {
    setInitialQuery(query)
    setOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setInitialQuery('')
  }, [])

  useLayoutEffect(() => {
    if (!location.pathname.endsWith('/search')) return
    const q = params.get('q') ?? ''
    openSearch(q)
    const next = new URLSearchParams(params)
    next.delete('q')
    const search = next.toString()
    navigate({ pathname: '/', search: search ? `?${search}` : '' }, { replace: true })
  }, [location.pathname, navigate, openSearch, params])

  const value = useMemo(
    () => ({ open, openSearch, closeSearch }),
    [closeSearch, open, openSearch],
  )

  return (
    <QuestSearchContext.Provider value={value}>
      {children}
      <QuestSearchModal
        open={open}
        initialQuery={initialQuery}
        onClose={closeSearch}
      />
    </QuestSearchContext.Provider>
  )
}
