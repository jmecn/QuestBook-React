import { createContext, useContext, useMemo, useState, type ReactElement, type ReactNode } from 'react'

/** FTB default theme: {@code ftb_quests_theme.txt} */
export const FTB_DEPENDENCY_LINE_REQUIRES_COLOR = '#00C8C8'
export const FTB_DEPENDENCY_LINE_REQUIRED_FOR_COLOR = '#C8C800'

type QuestCanvasHoverContextValue = {
  hoveredQuestId: string | null
  setHoveredQuestId: (id: string | null) => void
  /** Hovered quest, else selected quest — drives dependency line highlight like FTB QuestPanel pass 2. */
  highlightQuestId: string | null
}

const QuestCanvasHoverContext = createContext<QuestCanvasHoverContextValue | null>(null)

export function QuestCanvasHoverProvider({
  selectedId,
  children,
}: {
  selectedId: string | null
  children: ReactNode
}): ReactElement {
  const [hoveredQuestId, setHoveredQuestId] = useState<string | null>(null)
  const highlightQuestId = hoveredQuestId ?? selectedId

  const value = useMemo(
    () => ({ hoveredQuestId, setHoveredQuestId, highlightQuestId }),
    [highlightQuestId, hoveredQuestId],
  )

  return (
    <QuestCanvasHoverContext.Provider value={value}>
      {children}
    </QuestCanvasHoverContext.Provider>
  )
}

export function useQuestCanvasHover(): QuestCanvasHoverContextValue {
  const ctx = useContext(QuestCanvasHoverContext)
  if (!ctx) {
    throw new Error('useQuestCanvasHover must be used within QuestCanvasHoverProvider')
  }
  return ctx
}
