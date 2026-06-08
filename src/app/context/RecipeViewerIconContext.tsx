import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useI18n } from '@/shared/i18n/useI18n'
import { getRecipeViewerIconClient } from '@/adapters/recipe-viewer-icon-client'
import { questExportIconBundleBaseUrl } from '@/shared/lib/quest-export-icon-base'
import { useTheme } from '@/shared/hooks/useTheme'

interface RecipeViewerIconContextValue {
  baseUrl: string
  ready: boolean
}

const RecipeViewerIconContext = createContext<RecipeViewerIconContextValue>({
  baseUrl: '',
  ready: false,
})

export function RecipeViewerIconProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n()
  const { theme } = useTheme()
  const [baseUrl, setBaseUrl] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    void (async () => {
      const bundleBase = questExportIconBundleBaseUrl()
      if (cancelled) return
      setBaseUrl(bundleBase)
      await getRecipeViewerIconClient().configure(bundleBase, locale, theme)
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [locale, theme])

  const value = useMemo(() => ({ baseUrl, ready }), [baseUrl, ready])

  return (
    <RecipeViewerIconContext.Provider value={value}>
      {children}
    </RecipeViewerIconContext.Provider>
  )
}

export function useRecipeViewerIcons() {
  return useContext(RecipeViewerIconContext)
}
