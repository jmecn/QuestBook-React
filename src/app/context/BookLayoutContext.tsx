import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const SIDEBAR_COLLAPSED_KEY = 'questbook-sidebar-collapsed'

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export interface BookLayoutContextValue {
  sidebarCollapsed: boolean
  layoutEpoch: number
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const BookLayoutContext = createContext<BookLayoutContextValue | null>(null)

export function BookLayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(readSidebarCollapsed)
  const [layoutEpoch, setLayoutEpoch] = useState(0)

  const bumpLayout = useCallback(() => {
    setLayoutEpoch((value) => value + 1)
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed)
    bumpLayout()
  }, [bumpLayout])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((value) => !value)
    bumpLayout()
  }, [bumpLayout])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
    } catch {

    }
  }, [sidebarCollapsed])

  const value = useMemo(
    () => ({ sidebarCollapsed, layoutEpoch, setSidebarCollapsed, toggleSidebar }),
    [layoutEpoch, setSidebarCollapsed, sidebarCollapsed, toggleSidebar],
  )

  return (
    <BookLayoutContext.Provider value={value}>
      {children}
    </BookLayoutContext.Provider>
  )
}

export function useBookLayout(): BookLayoutContextValue {
  const ctx = useContext(BookLayoutContext)
  if (!ctx) {
    throw new Error('useBookLayout must be used within BookLayoutProvider')
  }
  return ctx
}
