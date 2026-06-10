import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { QuestCatalogEntry } from '@/shared/lib/quest-catalog'
import { normalizeQuestObjectId } from '@/shared/lib/minecraft-text-component'

export interface QuestRichTextNavigationContextValue {
  navigateToQuest: (questId: string) => boolean
}

const QuestRichTextNavigationContext = createContext<QuestRichTextNavigationContextValue>({
  navigateToQuest: () => false,
})

export interface QuestRichTextNavigationProviderProps {
  catalog: Map<string, QuestCatalogEntry>
  onNavigateQuest: (chapterFilename: string, questId: string) => void
  children: ReactNode
}

export function QuestRichTextNavigationProvider({
  catalog,
  onNavigateQuest,
  children,
}: QuestRichTextNavigationProviderProps) {
  const value = useMemo<QuestRichTextNavigationContextValue>(() => ({
    navigateToQuest(questId: string) {
      const normalized = normalizeQuestObjectId(questId)
      const entry = catalog.get(normalized)
      if (!entry) return false
      onNavigateQuest(entry.chapterFilename, entry.id)
      return true
    },
  }), [catalog, onNavigateQuest])

  return (
    <QuestRichTextNavigationContext.Provider value={value}>
      {children}
    </QuestRichTextNavigationContext.Provider>
  )
}

export function useQuestRichTextNavigation(): QuestRichTextNavigationContextValue {
  return useContext(QuestRichTextNavigationContext)
}
