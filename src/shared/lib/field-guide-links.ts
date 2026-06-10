import { loadSiteConfig } from '@/shared/lib/quest-export'

let cachedFieldGuideBase: string | null | undefined

export async function fieldGuideSiteBase(): Promise<string> {
  if (cachedFieldGuideBase !== undefined) {
    return cachedFieldGuideBase ?? ''
  }
  const config = await loadSiteConfig()
  const raw = config.fieldGuideBaseUrl?.trim() ?? ''
  if (!raw) {
    cachedFieldGuideBase = null
    return ''
  }
  cachedFieldGuideBase = raw.endsWith('/') ? raw : `${raw}/`
  return cachedFieldGuideBase
}

/** {@code tfc:field_guide tfc:mechanics/hydration} → mechanics/hydration */
export function fieldGuidePathFromGuidePage(guidePage: string): string | null {
  const trimmed = guidePage.trim()
  if (!trimmed) {
    return null
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) {
    return null
  }
  const pageRef = parts[1]
  const colon = pageRef.indexOf(':')
  const path = colon >= 0 ? pageRef.slice(colon + 1) : pageRef
  return path || null
}

export function fieldGuidePageUrl(base: string, locale: string, guidePage: string): string | null {
  const path = fieldGuidePathFromGuidePage(guidePage)
  if (!path) {
    return null
  }
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedLocale = locale.trim().toLowerCase().replace('-', '_') || 'en_us'
  return `${normalizedBase}${normalizedLocale}/${path}.html`
}
