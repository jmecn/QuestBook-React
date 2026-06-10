import { questExportUrl } from '@/shared/lib/site-base'

/** Placeholder item written by ftb-quest-export when icon render fails. */
export const QUEST_MISSING_ITEM_ICON = 'minecraft_web_export:missing_icon'

function splitRef(ref: string): { namespace: string; path: string } | null {
  const trimmed = ref.trim()
  if (!trimmed.includes(':')) return null
  const [namespace, path] = trimmed.split(':', 2)
  if (!namespace || !path) return null
  return { namespace, path }
}

function isRegistryItemPath(path: string): boolean {
  return !path.startsWith('textures/')
    && !path.startsWith('block/')
    && !path.startsWith('item/')
    && !path.startsWith('gui/')
    && !path.startsWith('icons/')
    && !path.endsWith('.png')
}

/** Per-item PNG under {@code assets/icons/items/<ns>/<path>.png}. */
export function questItemIconUrl(itemId: string): string | null {
  const parts = splitRef(itemId)
  if (!parts || !isRegistryItemPath(parts.path)) return null
  return questExportUrl(`assets/icons/items/${parts.namespace}/${parts.path}.png`)
}

export function questMissingItemIconUrl(): string {
  return questItemIconUrl(QUEST_MISSING_ITEM_ICON)
    ?? questExportUrl('assets/icons/items/minecraft_web_export/missing_icon.png')
}
