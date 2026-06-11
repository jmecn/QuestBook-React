export function questIconFallbackLabel(icon?: string): string {
  if (!icon) return '?'
  const trimmed = icon.trim()
  if (!trimmed.includes(':')) return trimmed.slice(0, 1).toUpperCase()
  const path = trimmed.split(':', 2)[1] ?? trimmed
  const segment = path.split('/').pop() ?? path
  return segment.slice(0, 2).toUpperCase()
}
