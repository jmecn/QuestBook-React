import { FALLBACK_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from '@/shared/i18n/locale'

export function resolveAppLocale(search = window.location.search): string {
  const lang = new URLSearchParams(search).get('lang')
  return normalizeLocale(
    lang || localStorage.getItem(LOCALE_STORAGE_KEY) || FALLBACK_LOCALE,
  )
}
