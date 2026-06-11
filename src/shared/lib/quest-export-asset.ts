import { questExportUrl } from '@/shared/lib/site-base'

function splitRef(ref: string): { namespace: string; path: string } | null {
  const trimmed = ref.trim()
  if (!trimmed.includes(':')) return null
  const [namespace, path] = trimmed.split(':', 2)
  if (!namespace || !path) return null
  return { namespace, path }
}

export function questExportAssetUrl(relativePath: string): string {
  return questExportUrl(relativePath)
}

export function questExportTextureCandidates(ref?: string): string[] {
  if (!ref) return []
  const parts = splitRef(ref)
  if (!parts) return []

  const { namespace, path } = parts

  if (path.startsWith('textures/')) {
    const base = path.endsWith('.png') ? path.slice(0, -4) : path
    return [questExportUrl(`assets/${namespace}/${base}.png`)]
  }

  if (
    path.startsWith('block/')
    || path.startsWith('item/')
    || path.startsWith('gui/')
    || path.startsWith('icons/')
  ) {
    return [questExportUrl(`assets/${namespace}/textures/${path}.png`)]
  }

  return []
}
