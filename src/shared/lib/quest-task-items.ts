import type { QuestTask } from '@/shared/types/quest'
import { resolveQuestText } from '@/shared/lib/quest-text'

/** FTB Filter System placeholder item used in SNBT — not a player-facing requirement. */
export const FTB_SMART_FILTER_ID = 'ftbfiltersystem:smart_filter'

const FILTER_TAG = /(?:item_tag|block_tag|fluid_tag|tag)\(([^)]+)\)/gi
const HASH_TAG = /#([a-z0-9_.\-/]+:[a-z0-9_.\-/]+)/gi

/** Tag ids from {@code ftbfiltersystem:item_tag(...)} filter expressions. */
export function extractFilterTagIds(filterRaw: string): string[] {
  const ids: string[] = []
  for (const match of filterRaw.matchAll(FILTER_TAG)) {
    let id = match[1].trim()
    if (id.startsWith('#')) id = id.slice(1)
    if (id.includes(':')) ids.push(id)
  }
  return ids
}

/** {@code #namespace:path} refs in resolved task titles. */
export function extractHashTagIds(text: string): string[] {
  const ids = new Set<string>()
  for (const match of text.matchAll(HASH_TAG)) {
    ids.add(match[1])
  }
  return [...ids]
}

/** Item ids to render as task icons (drops smart-filter placeholders). */
export function taskDisplayItemIds(task: QuestTask): string[] {
  return (task.items ?? []).filter((id) => id !== FTB_SMART_FILTER_ID)
}

/** Task uses {@code ftbfiltersystem:smart_filter} / {@code filterRaw} instead of a single item id. */
export function isFilterPlaceholderTask(task: QuestTask): boolean {
  if (task.filterRaw) return true
  const items = task.items ?? []
  return items.length > 0 && items.every((id) => id === FTB_SMART_FILTER_ID)
}

/**
 * FTB {@code ViewQuestPanel} puts each task in {@code CompactGridLayout} (18×18 cells, wrap).
 * Icon-only tasks become one grid cell; titled tasks (tag filters, etc.) span a full row.
 */
export function isCompactGridTask(task: QuestTask, dict: Record<string, string>): boolean {
  if (isFilterPlaceholderTask(task)) return false
  const title = resolveQuestText(dict, task.title).trim()
  if (title) return false
  if (task.type === 'checkmark') return true
  if (task.type === 'item' && taskDisplayItemIds(task).length > 0) return true
  return false
}
