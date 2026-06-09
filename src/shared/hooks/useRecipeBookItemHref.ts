import { useEffect, useState } from 'react'
import { recipeBookItemUrl, recipeBookSiteBase } from '@/shared/lib/recipe-book-links'

/** Recipe-book item page URL when {@code site-config.json} sets {@code recipeBookBaseUrl}. */
export function useRecipeBookItemHref(itemId: string, locale: string): string | null {
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = itemId.trim()
    if (!id) {
      setHref(null)
      return undefined
    }

    void recipeBookSiteBase().then((base) => {
      if (cancelled || !base) {
        if (!cancelled) setHref(null)
        return
      }
      setHref(recipeBookItemUrl(locale, id, base))
    })

    return () => {
      cancelled = true
    }
  }, [itemId, locale])

  return href
}
