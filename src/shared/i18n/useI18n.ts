import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { FALLBACK_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from '@/shared/i18n/locale'

export function useAppLocale() {
  const [params, setParams] = useSearchParams()
  const { i18n } = useTranslation()

  const locale = useMemo(() => {
    const fromUrl = params.get('lang')
    if (fromUrl) return normalizeLocale(fromUrl)
    const fromStorage = localStorage.getItem(LOCALE_STORAGE_KEY)
    return fromStorage ? normalizeLocale(fromStorage) : FALLBACK_LOCALE
  }, [params])

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    if (normalizeLocale(i18n.language) !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [i18n, locale])

  useEffect(() => {
    document.title = i18n.t('appTitle')
  }, [i18n, i18n.language])

  const setLocale = (next: string) => {
    const normalized = normalizeLocale(next)
    const nextParams = new URLSearchParams(params)
    nextParams.set('lang', normalized)
    setParams(nextParams)
  }

  return { locale, setLocale, i18n }
}

export function useI18n() {
  const { t } = useTranslation()
  const { locale, setLocale, i18n } = useAppLocale()
  return { locale, setLocale, t, i18n }
}
