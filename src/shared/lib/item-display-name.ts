import { loadItemsLangLabels, loadLangDict } from '@/shared/lib/quest-export'
import { itemLookupKeys, normalizeRegistryId } from '@/shared/lib/registry-lang-keys'
import { stripColorCodes } from '@/shared/lib/quest-text'

const nameCache = new Map<string, string>()
const langCache = new Map<string, Record<string, string>>()
const itemsLangCache = new Map<string, Record<string, string> | null>()

function stripRegistryIdFallback(itemId: string): string {
  const bare = normalizeRegistryId(itemId)
  const colon = bare.indexOf(':')
  const path = colon >= 0 ? bare.slice(colon + 1) : bare
  return path.replace(/_/g, ' ').replace(/\//g, ' ')
}

function cacheKey(itemId: string, locale: string): string {
  return `${locale}:${normalizeRegistryId(itemId)}`
}

async function langDictFor(locale: string): Promise<Record<string, string>> {
  const cached = langCache.get(locale)
  if (cached) return cached
  const dict = await loadLangDict(locale)
  langCache.set(locale, dict)
  return dict
}

async function itemsLangFor(locale: string): Promise<Record<string, string> | null> {
  if (itemsLangCache.has(locale)) {
    return itemsLangCache.get(locale) ?? null
  }
  const labels = await loadItemsLangLabels(locale)
  itemsLangCache.set(locale, labels)
  return labels
}

function resolveFromLangDict(dict: Record<string, string>, itemId: string): string | null {
  const bare = normalizeRegistryId(itemId)
  for (const key of itemLookupKeys(bare)) {
    const value = dict[key]
    if (value && value !== bare && value !== itemId) {
      return stripColorCodes(value)
    }
  }
  return null
}

/** Human-readable item label: items-lang, then closure lang (item → block → fluid), then id fallback. */
export async function resolveItemDisplayName(
  itemId: string,
  locale = 'en_us',
): Promise<string> {
  const key = cacheKey(itemId, locale)
  const cached = nameCache.get(key)
  if (cached) return cached

  try {
    const itemsLang = await itemsLangFor(locale)
    const bare = normalizeRegistryId(itemId)
    const fromItemsLang = itemsLang?.[bare] ?? itemsLang?.[itemId]
    if (fromItemsLang) {
      const resolved = stripColorCodes(fromItemsLang)
      nameCache.set(key, resolved)
      return resolved
    }

    const dict = await langDictFor(locale)
    const fromLang = resolveFromLangDict(dict, itemId)
    const resolved = fromLang ?? stripRegistryIdFallback(itemId)
    nameCache.set(key, resolved)
    return resolved
  } catch {
    const fallback = stripRegistryIdFallback(itemId)
    nameCache.set(key, fallback)
    return fallback
  }
}
