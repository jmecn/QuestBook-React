import { plainQuestText } from '@/shared/lib/quest-text'
import type { QuestNode } from '@/shared/types/quest'

const PREVIEW_MAX = 120

function truncate(text: string, max = PREVIEW_MAX): string {
  const plain = text.replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  return `${plain.slice(0, max - 1)}…`
}

/** Plain-text blurb for the share preview card (not identical to Discord OG). */
export function questSharePreviewText(
  quest: QuestNode,
  dict: Record<string, string>,
): string {
  if (quest.subtitle) {
    const fromSubtitle = plainQuestText(dict, quest.subtitle)
    if (fromSubtitle) return truncate(fromSubtitle)
  }
  if (quest.description) {
    const lines = Array.isArray(quest.description)
      ? quest.description
      : [quest.description]
    const parts = lines
      .map((line) => plainQuestText(dict, line))
      .filter(Boolean)
    if (parts.length) return truncate(parts.join(' '))
  }
  return ''
}
