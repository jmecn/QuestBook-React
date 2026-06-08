const LANG_KEY = /\{([^{}]+)}/g

export function stripColorCodes(text: string): string {
  return text.replace(/§./g, '')
}

export function resolveQuestText(
  dict: Record<string, string>,
  raw: string | undefined | null,
): string {
  if (!raw) return ''
  return stripColorCodes(
    raw.replace(LANG_KEY, (_, key: string) => dict[key] ?? `{${key}}`),
  )
}

export function resolveQuestLines(
  dict: Record<string, string>,
  raw: string | string[] | undefined | null,
): string {
  if (!raw) return ''
  if (Array.isArray(raw)) {
    return raw.map((line) => resolveQuestText(dict, line)).join('\n')
  }
  if (typeof raw === 'string' && raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim()
    if (!inner) return ''
    return inner
      .split('", "')
      .map((part) => resolveQuestText(dict, part.replace(/^"|"$/g, '')))
      .join('\n')
  }
  return resolveQuestText(dict, raw)
}

/** FTB Quests chapter grid: one unit = 24px at gridScale 1; smaller gridScale = coarser grid in editor. */
export function gridToPx(value: number, gridScale = 0.5): number {
  const GRID_SIZE = 24
  const scale = gridScale > 0 ? gridScale : 0.5
  return value * (GRID_SIZE / scale)
}

export function gridStepPx(gridScale = 0.5): number {
  const scale = gridScale > 0 ? gridScale : 0.5
  return 24 / scale
}
