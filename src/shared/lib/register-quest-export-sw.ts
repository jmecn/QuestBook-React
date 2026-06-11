import { siteBase, siteUrl } from '@/shared/lib/site-base'

/**
 * Register SW for quest-export cache-first + stale-while-revalidate.
 * Cache version comes from site root build.json#contentHash (QuestBook-Modern CI).
 */
export function registerQuestExportServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return

  const scriptUrl = siteUrl('quest-export-sw.js')
  const scope = siteBase()

  void navigator.serviceWorker
    .register(scriptUrl, { scope, type: 'classic', updateViaCache: 'none' })
    .catch((err: unknown) => {
      console.warn('[quest-export-sw] registration failed', err)
    })
}
