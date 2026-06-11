import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadQuestIndex } from '@/shared/lib/quest-export'
import { loadGlobalAtlasFromIndex } from '@/shared/lib/quest-atlas/global-atlas'
import type { GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'

interface QuestAtlasContextValue {
  globalAtlas: GlobalAtlasContext | null
  loading: boolean
}

const QuestAtlasContext = createContext<QuestAtlasContextValue>({
  globalAtlas: null,
  loading: true,
})

export function QuestAtlasProvider({ children }: { children: ReactNode }) {
  const [globalAtlas, setGlobalAtlas] = useState<GlobalAtlasContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const index = await loadQuestIndex()
        const ctx = await loadGlobalAtlasFromIndex(index)
        if (!cancelled) setGlobalAtlas(ctx)
      } catch {
        if (!cancelled) setGlobalAtlas(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <QuestAtlasContext.Provider value={{ globalAtlas, loading }}>
      {children}
    </QuestAtlasContext.Provider>
  )
}

export function useQuestGlobalAtlas(): QuestAtlasContextValue {
  return useContext(QuestAtlasContext)
}
