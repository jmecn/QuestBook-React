import { questExportUrl } from '@/shared/lib/site-base'

function splitRef(ref: string): { namespace: string; path: string } | null {
  const trimmed = ref.trim()
  if (!trimmed.includes(':')) return null
  const [namespace, path] = trimmed.split(':', 2)
  if (!namespace || !path) return null
  return { namespace, path }
}

/** Resolve quest-export asset URLs for texture refs (items, gui, icons). */
export function questExportTextureCandidates(ref?: string): string[] {
  if (!ref) return []
  const parts = splitRef(ref)
  if (!parts) return []

  const { namespace, path } = parts
  const candidates: string[] = []

  if (path.startsWith('textures/')) {
    const base = path.endsWith('.png') ? path.slice(0, -4) : path
    candidates.push(questExportUrl(`assets/${namespace}/${base}.png`))
    return candidates
  }

  candidates.push(
    questExportUrl(`assets/${namespace}/textures/item/${path}.png`),
    questExportUrl(`assets/${namespace}/textures/block/${path}.png`),
  )
  return candidates
}

export function questExportMcmetaUrl(pngUrl: string): string {
  return pngUrl.endsWith('.png') ? `${pngUrl}.mcmeta` : `${pngUrl}.mcmeta`
}
