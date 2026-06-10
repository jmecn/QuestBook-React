/** Client routes that must not be treated as the static asset deploy prefix. */
const APP_ROUTE_SEGMENTS = new Set(['search'])

function pathnameWithoutIndexHtml(pathname: string): string {
  return pathname.replace(/\/index\.html$/i, '')
}

/** Deploy prefix for static assets (excludes client router segments like /search). */
export function deployPathPrefix(): string {
  const parts = pathnameWithoutIndexHtml(window.location.pathname).split('/').filter(Boolean)
  while (parts.length > 0 && APP_ROUTE_SEGMENTS.has(parts[parts.length - 1]!)) {
    parts.pop()
  }
  if (parts.length === 0) return '/'
  return `/${parts.join('/')}/`
}

export function siteBase(): string {
  return deployPathPrefix()
}

export function siteUrl(relative: string): string {
  const rel = String(relative).replace(/^\//, '')
  const base = siteBase()
  if (base === '/') return `/${rel}`
  return `${base}${rel}`
}

export function routerBasename(): string {
  const base = siteBase()
  if (base === '/') return '/'
  return base.replace(/\/$/, '')
}

export function normalizeSitePath(): void {
  const base = siteBase()
  const path = pathnameWithoutIndexHtml(window.location.pathname)
  const baseNoSlash = base === '/' ? '/' : base.slice(0, -1)
  if (path === baseNoSlash) {
    const next = base + window.location.search + window.location.hash
    window.history.replaceState({}, '', next)
  }
}

export const QUEST_EXPORT_BASE = 'data/quest-export'

export function questExportUrl(relative: string): string {
  const rel = relative.replace(/^\//, '')
  return siteUrl(`${QUEST_EXPORT_BASE}/${rel}`)
}
