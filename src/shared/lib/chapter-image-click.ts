/** FTB {@code Widget.handleClick(String)} — split on first {@code :}. */
export function parseFtbClick(click: string): { scheme: string; path: string } {
  const index = click.indexOf(':')
  if (index === -1) {
    return { scheme: '', path: click }
  }
  return { scheme: click.slice(0, index), path: click.slice(index + 1) }
}

/** External link for chapter decoration {@code click} (http/https only). */
export function chapterImageClickHref(click: string | null | undefined): string | null {
  if (!click) return null
  const { scheme, path } = parseFtbClick(click)
  if (scheme === 'http' || scheme === 'https') {
    return `${scheme}:${path}`
  }
  return null
}

export function isChapterImageClickable(click: string | null | undefined): boolean {
  return chapterImageClickHref(click) != null
}
