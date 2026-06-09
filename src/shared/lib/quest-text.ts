import { parseRichText, plainQuestText } from '@/shared/lib/quest-rich-text-parser'

export { parseQuestDescription, parseRichText, plainQuestText, richTextToPlain } from '@/shared/lib/quest-rich-text-parser'
export type { QuestDescriptionBlock, RichTextNode } from '@/shared/lib/quest-rich-text-parser'

/** @deprecated Prefer {@link plainQuestText}; kept for callers that only need a plain string. */
export function stripColorCodes(text: string): string {
  return text.replace(/[&§]./g, '')
}

export function resolveQuestText(
  dict: Record<string, string>,
  raw: string | undefined | null,
): string {
  return plainQuestText(dict, raw)
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

/** Rich-text nodes for titles/subtitles that may contain {@code &} color codes. */
export function resolveQuestRichText(
  dict: Record<string, string>,
  raw: string | undefined | null,
) {
  if (!raw) return []
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const key = trimmed.slice(1, -1)
    if (dict[key] != null && !key.startsWith('image:') && key !== '@pagebreak') {
      return parseRichText(dict[key], dict)
    }
  }
  return parseRichText(raw, dict)
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
