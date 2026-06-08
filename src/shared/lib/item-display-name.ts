import { getRecipeViewerIconClient } from '@/adapters/recipe-viewer-icon-client'

const nameCache = new Map<string, string>()

function stripRegistryIdFallback(itemId: string): string {
  const colon = itemId.indexOf(':')
  return colon >= 0 ? itemId.slice(colon + 1) : itemId
}

function cacheKey(itemId: string, locale: string): string {
  return `${locale}:${itemId}`
}

/** Human-readable item label via EMI registry labels, with id fallback. */
export async function resolveItemDisplayName(
  itemId: string,
  locale = 'en_us',
): Promise<string> {
  const key = cacheKey(itemId, locale)
  const cached = nameCache.get(key)
  if (cached) return cached

  try {
    const client = getRecipeViewerIconClient()
    const renderer = await client.whenReady()
    const label = await renderer.translateRegistryAsync(itemId, 'item')
    const resolved = label && label !== itemId ? label : stripRegistryIdFallback(itemId)
    nameCache.set(key, resolved)
    return resolved
  } catch {
    const fallback = stripRegistryIdFallback(itemId)
    nameCache.set(key, fallback)
    return fallback
  }
}
