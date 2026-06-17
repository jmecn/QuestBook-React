import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  getActiveTheme,
  getThemePreference,
  resolveInitialTheme,
  setThemePreference,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/shared/lib/theme'

function syncThemeState() {
  return applyTheme(resolveInitialTheme())
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getActiveTheme())

  const applySyncedState = useCallback(() => {
    setTheme(syncThemeState())
  }, [])

  useEffect(() => {
    applySyncedState()
  }, [applySyncedState])

  useEffect(() => {
    const root = document.documentElement
    const syncFromDom = () => setTheme(getActiveTheme())

    const observer = new MutationObserver(syncFromDom)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
      applySyncedState()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [applySyncedState])

  useEffect(() => {
    const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media || getThemePreference() !== 'auto') return undefined
    const handler = () => {
      if (getThemePreference() !== 'auto') return
      setTheme(applyTheme(media.matches ? 'dark' : 'light'))
    }
    try {
      media.addEventListener('change', handler)
      return () => media.removeEventListener('change', handler)
    } catch {
      media.addListener?.(handler)
      return () => media.removeListener?.(handler)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const next: Theme = getActiveTheme() === 'dark' ? 'light' : 'dark'
    setThemePreference(next)
    setTheme(applyTheme(next))
  }, [])

  return { theme, toggleTheme }
}
