import { fetchJson } from '@/shared/api/http'
import { FALLBACK_LOCALE, normalizeLocale } from '@/shared/i18n/locale'

/** 按 locale 加载 quest-export 下的 JSON；缺失或非 JSON 时回退到 en_us。 */
export async function loadLocalizedExportJson<T>(
  urlForLocale: (locale: string) => string,
  locale: string,
  isValid: (value: T | null) => boolean = (value) => value != null,
): Promise<T | null> {
  const key = normalizeLocale(locale)
  const primary = await fetchJson<T | null>(urlForLocale(key), null)
  if (isValid(primary)) return primary
  if (key === FALLBACK_LOCALE) return null
  const fallback = await fetchJson<T | null>(urlForLocale(FALLBACK_LOCALE), null)
  return isValid(fallback) ? fallback : null
}
