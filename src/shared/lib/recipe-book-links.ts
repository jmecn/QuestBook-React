import { loadSiteConfig } from '@/shared/lib/quest-export'

let cachedRecipeBookBase: string | null | undefined

/**
 * External TFG-Recipe-Viewer base for item/tag tooltip links ({@code site-config.json}).
 * Empty when unset — never used for icon atlas data.
 */
export async function recipeBookSiteBase(): Promise<string> {
  if (cachedRecipeBookBase !== undefined) {
    return cachedRecipeBookBase ?? ''
  }
  const config = await loadSiteConfig()
  const raw = config.recipeBookBaseUrl?.trim() ?? ''
  if (!raw) {
    cachedRecipeBookBase = null
    return ''
  }
  cachedRecipeBookBase = raw.endsWith('/') ? raw : `${raw}/`
  return cachedRecipeBookBase
}

export function recipeBookItemUrl(locale: string, itemId: string, base: string): string {
  const url = new URL(base)
  url.searchParams.set('lang', locale)
  url.searchParams.set('item', itemId.toLowerCase())
  return url.href
}

export function recipeBookTagUrl(locale: string, tagId: string, base: string): string {
  const url = new URL(base)
  url.searchParams.set('lang', locale)
  const bare = tagId.startsWith('#') ? tagId.slice(1) : tagId
  url.searchParams.set('tag', bare)
  return url.href
}
