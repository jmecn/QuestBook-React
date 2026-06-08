import { useEffect, useState } from 'react'
import { fetchJson } from '@/shared/api/http'
import { FALLBACK_LOCALE, normalizeLocale } from '@/shared/i18n/locale'
import { siteUrl } from '@/shared/lib/site-base'

export interface LanguageConfig {
  defaultLocale: string
  enabledLocales: string[]
  localeNames: Record<string, string>
}

function normalizeLanguageConfig(raw: unknown): LanguageConfig {
  const cfg = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const enabledLocales = Array.isArray(cfg.enabledLocales)
    ? cfg.enabledLocales.map((code) => normalizeLocale(String(code))).filter(Boolean)
    : []

  const localeNames: Record<string, string> = {}
  if (cfg.localeNames && typeof cfg.localeNames === 'object') {
    for (const [code, label] of Object.entries(cfg.localeNames as Record<string, unknown>)) {
      if (typeof label === 'string' && label.trim()) {
        localeNames[normalizeLocale(code)] = label.trim()
      }
    }
  }

  return {
    defaultLocale: normalizeLocale(String(cfg.defaultLocale || FALLBACK_LOCALE)),
    enabledLocales,
    localeNames,
  }
}

const FALLBACK_CONFIG: LanguageConfig = {
  defaultLocale: 'en_us',
  enabledLocales: ['en_us', 'zh_cn'],
  localeNames: {
    en_us: 'English',
    zh_cn: '简体中文(中国大陆)',
  },
}

let cachedConfig: LanguageConfig | null = null
let configPromise: Promise<LanguageConfig> | null = null

export function loadLanguageConfig(): Promise<LanguageConfig> {
  if (cachedConfig) return Promise.resolve(cachedConfig)
  if (!configPromise) {
    configPromise = fetchJson(siteUrl('language.json'), null).then((raw) => {
      cachedConfig = raw ? normalizeLanguageConfig(raw) : FALLBACK_CONFIG
      return cachedConfig
    })
  }
  return configPromise
}

export function useLanguageConfig() {
  const [data, setData] = useState<LanguageConfig | undefined>(cachedConfig ?? undefined)

  useEffect(() => {
    if (cachedConfig) {
      setData(cachedConfig)
      return
    }
    void loadLanguageConfig().then(setData)
  }, [])

  return { data, isLoading: !data }
}

export function localeDisplayName(
  config: LanguageConfig | undefined,
  locale: string,
) {
  const key = normalizeLocale(locale)
  return config?.localeNames?.[key] || key
}

export function visibleLocales(config: LanguageConfig | undefined): string[] {
  const enabled = config?.enabledLocales ?? []
  if (enabled.length > 0) return [...enabled]
  return [config?.defaultLocale || FALLBACK_LOCALE]
}
