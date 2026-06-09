import { loadItemNameKeys, loadItemsLangLabels, loadLangDict } from '@/shared/lib/quest-export'
import { itemLookupKeys, normalizeRegistryId } from '@/shared/lib/registry-lang-keys'
import { stripColorCodes } from '@/shared/lib/quest-text'

const nameCache = new Map<string, string>()
const langCache = new Map<string, Record<string, string>>()
const itemsLangCache = new Map<string, Record<string, string> | null>()
const nameKeysCache: { value: Record<string, string> | null } = { value: null }

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

async function nameKeysFor(): Promise<Record<string, string>> {
  if (nameKeysCache.value) return nameKeysCache.value
  const keys = await loadItemNameKeys()
  nameKeysCache.value = keys
  return keys
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

function resolveFromNameKey(
  dict: Record<string, string>,
  nameKeys: Record<string, string>,
  itemId: string,
): string | null {
  const bare = normalizeRegistryId(itemId)
  const descriptionKey = nameKeys[bare]
  if (descriptionKey) {
    const fromKey = dict[descriptionKey]
    if (fromKey && fromKey !== descriptionKey) {
      return stripColorCodes(fromKey)
    }
  }
  return resolveFromLangDict(dict, itemId)
}

function isUnresolvedLabel(label: string, itemId: string): boolean {
  const bare = normalizeRegistryId(itemId)
  return label === itemId || label === bare
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
    const bare = normalizeRegistryId(itemId)
    const dict = await langDictFor(locale)
    const nameKeys = await nameKeysFor()

    const itemsLang = await itemsLangFor(locale)
    const fromItemsLang = itemsLang?.[bare] ?? itemsLang?.[itemId]
    if (fromItemsLang && !isUnresolvedLabel(fromItemsLang, itemId)) {
      const resolved = stripColorCodes(fromItemsLang)
      nameCache.set(key, resolved)
      return resolved
    }

    const fromNameKey = resolveFromNameKey(dict, nameKeys, itemId)
    const resolved = fromNameKey ?? stripRegistryIdFallback(itemId)
    nameCache.set(key, resolved)
    return resolved
  } catch {
    const fallback = stripRegistryIdFallback(itemId)
    nameCache.set(key, fallback)
    return fallback
  }
}
