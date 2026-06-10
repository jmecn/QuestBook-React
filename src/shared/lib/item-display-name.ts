import { loadItemNameKeys, loadLangDict } from '@/shared/lib/quest-export'
import { dottedRegistryId, itemLookupKeys, normalizeRegistryId } from '@/shared/lib/registry-lang-keys'
import { stripColorCodes } from '@/shared/lib/quest-text'
import { translateComposedRegistry } from '@/shared/lib/gtceu-translate'

const nameCache = new Map<string, string>()
const langCache = new Map<string, Record<string, string>>()
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

async function nameKeysFor(): Promise<Record<string, string>> {
  if (nameKeysCache.value) return nameKeysCache.value
  const keys = await loadItemNameKeys()
  nameKeysCache.value = keys
  return keys
}

function translateKey(dict: Record<string, string>, key: string): string {
  return dict[key] ?? key
}

function registryLookupKeys(registryId: string): string[] {
  const dotted = dottedRegistryId(registryId)
  if (!dotted) return []
  return [...itemLookupKeys(registryId), `entity.${dotted}`]
}

function resolveFromLangDict(dict: Record<string, string>, itemId: string): string | null {
  const bare = normalizeRegistryId(itemId)
  for (const key of registryLookupKeys(bare)) {
    const value = dict[key]
    if (value && value !== bare && value !== itemId && !isLangTemplate(value)) {
      return stripColorCodes(value)
    }
  }
  return null
}

function isLangTemplate(value: string): boolean {
  return value.includes('%s')
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
    // name-keys often point at tagprefix.* (%s锭) — leave composition to GT rules.
    if (fromKey && fromKey !== descriptionKey && !isLangTemplate(fromKey)) {
      return stripColorCodes(fromKey)
    }
  }
  return resolveFromLangDict(dict, itemId)
}

function resolveComposedLabel(dict: Record<string, string>, itemId: string): string | null {
  const bare = normalizeRegistryId(itemId)
  const translate = (key: string) => translateKey(dict, key)
  for (const kind of ['item', 'fluid'] as const) {
    const composed = translateComposedRegistry(bare, kind, translate, dict)
    if (composed && composed !== bare) {
      return stripColorCodes(composed)
    }
  }
  return null
}

/**
 * Registry label from exported {@code lang/} only — no English id fallback.
 * Used for observation task titles (match FTB: keep raw id when lang is missing).
 */
export async function resolveRegistryDisplayName(
  registryId: string,
  locale = 'en_us',
): Promise<string | null> {
  try {
    const dict = await langDictFor(locale)
    const nameKeys = await nameKeysFor()

    const fromComposed = resolveComposedLabel(dict, registryId)
    if (fromComposed) return fromComposed

    const fromNameKey = resolveFromNameKey(dict, nameKeys, registryId)
    if (fromNameKey) return fromNameKey

    return resolveFromLangDict(dict, registryId)
  } catch {
    return null
  }
}

/** Human-readable item label: name-keys + exported {@code lang/}, with GT compose rules, then id fallback. */
export async function resolveItemDisplayName(
  itemId: string,
  locale = 'en_us',
): Promise<string> {
  const key = cacheKey(itemId, locale)
  const cached = nameCache.get(key)
  if (cached) return cached

  try {
    const dict = await langDictFor(locale)
    const nameKeys = await nameKeysFor()

    const fromComposed = resolveComposedLabel(dict, itemId)
    if (fromComposed) {
      nameCache.set(key, fromComposed)
      return fromComposed
    }

    const fromNameKey = resolveFromNameKey(dict, nameKeys, itemId)
    if (fromNameKey) {
      nameCache.set(key, fromNameKey)
      return fromNameKey
    }

    const resolved = resolveFromLangDict(dict, itemId) ?? stripRegistryIdFallback(itemId)
    nameCache.set(key, resolved)
    return resolved
  } catch {
    const fallback = stripRegistryIdFallback(itemId)
    nameCache.set(key, fallback)
    return fallback
  }
}
