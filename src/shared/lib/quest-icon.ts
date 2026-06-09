import { questExportTextureCandidates } from '@/shared/lib/quest-export-asset'
import { questItemIconUrl, questMissingItemIconUrl } from '@/shared/lib/quest-item-icon'

function urlsForRef(ref: string): string[] {
  const urls: string[] = []
  const itemUrl = questItemIconUrl(ref)
  if (itemUrl) urls.push(itemUrl)
  urls.push(...questExportTextureCandidates(ref))
  return urls
}

/** Quest-export icon URLs: per-item PNG, then closure texture paths. */
export function questExportIconCandidates(icon?: string, iconItems?: string[]): string[] {
  const seen = new Set<string>()
  const urls: string[] = []

  const addRef = (ref?: string) => {
    if (!ref || seen.has(ref)) return
    seen.add(ref)
    for (const url of urlsForRef(ref)) {
      if (!urls.includes(url)) urls.push(url)
    }
  }

  addRef(icon)
  iconItems?.forEach(addRef)

  if (urls.length === 0) {
    urls.push(questMissingItemIconUrl())
  }

  return urls
}

function splitIcon(icon: string): { namespace: string; path: string } | null {
  const trimmed = icon.trim()
  if (!trimmed.includes(':')) return null
  const [namespace, path] = trimmed.split(':', 2)
  if (!namespace || !path) return null
  return { namespace, path }
}

export function questIconFallbackLabel(icon?: string): string {
  if (!icon) return '?'
  const parts = splitIcon(icon)
  if (!parts) return icon.slice(0, 1).toUpperCase()
  const segment = parts.path.split('/').pop() ?? parts.path
  return segment.slice(0, 2).toUpperCase()
}
