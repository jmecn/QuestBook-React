import { resolveItemDisplayName } from '@/shared/lib/item-display-name'
import {
  resolveQuestAltTitle,
  syncQuestAltTitle,
} from '@/shared/lib/quest-alt-title'
import { resolveQuestText } from '@/shared/lib/quest-text'
import type { QuestNode } from '@/shared/types/quest'
import { useEffect, useState } from 'react'

export function formatQuestItemTitle(count: number | undefined, name: string): string {
  return count != null && count > 1 ? `${count}x ${name}` : name
}

function registryIdFallback(itemId: string): string {
  const segment = itemId.split(':')[1] ?? itemId
  return segment.replace(/_/g, ' ')
}

export function syncQuestDisplayTitle(quest: QuestNode, dict: Record<string, string>): string {
  const fromLang = resolveQuestText(dict, quest.title)
  if (fromLang) {
    return fromLang
  }
  if (quest.titleItem) {
    return formatQuestItemTitle(quest.titleCount, registryIdFallback(quest.titleItem))
  }
  return syncQuestAltTitle(quest, dict)
}

export function useQuestDisplayTitle(
  quest: QuestNode,
  dict: Record<string, string>,
  locale: string,
): string {
  const [label, setLabel] = useState(
    () => syncQuestDisplayTitle(quest, dict),
  )

  useEffect(() => {
    const fromLang = resolveQuestText(dict, quest.title)
    if (fromLang) {
      setLabel(fromLang)
      return undefined
    }
    if (quest.titleItem) {
      let cancelled = false
      void resolveItemDisplayName(quest.titleItem, locale).then((name) => {
        if (!cancelled) {
          setLabel(formatQuestItemTitle(quest.titleCount, name))
        }
      })
      return () => {
        cancelled = true
      }
    }

    let cancelled = false
    void resolveQuestAltTitle(quest, dict, locale).then((title) => {
      if (!cancelled) setLabel(title)
    })
    return () => {
      cancelled = true
    }
  }, [dict, locale, quest])

  return label
}
