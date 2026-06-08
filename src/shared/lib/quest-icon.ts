import { questExportTextureCandidates } from '@/shared/lib/quest-export-asset'

/** Quest-export bundle PNG paths (item, block, or full texture path). */
export function questExportIconCandidates(icon?: string): string[] {
  return questExportTextureCandidates(icon)
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
