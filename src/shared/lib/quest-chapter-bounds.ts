import type { ChapterData, ChapterImage, QuestLink, QuestNode } from '@/shared/types/quest'
import type { QuestCatalogEntry } from '@/shared/lib/quest-catalog'
import { DEFAULT_QUEST_NODE_SIZE } from '@/shared/lib/quest-node-size'
import { isQuestLinkVisibleOnMap, isQuestVisibleOnMap } from '@/shared/lib/quest-visibility'
import { gridToPx } from '@/shared/lib/quest-text'

/** FTB {@code QuestPanel.updateMinMax} padding in chapter grid units. */
const BOUNDS_PAD_X = 40
const BOUNDS_PAD_Y = 30

export interface ChapterGridBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface ChapterGridPoint {
  x: number
  y: number
}

function expandBounds(
  bounds: ChapterGridBounds,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): void {
  const halfW = width / 2
  const halfH = height / 2
  bounds.minX = Math.min(bounds.minX, centerX - halfW)
  bounds.minY = Math.min(bounds.minY, centerY - halfH)
  bounds.maxX = Math.max(bounds.maxX, centerX + halfW)
  bounds.maxY = Math.max(bounds.maxY, centerY + halfH)
}

function questSize(node: { size?: number }): number {
  const size = node.size ?? DEFAULT_QUEST_NODE_SIZE
  return Number(size) > 0 ? Number(size) : DEFAULT_QUEST_NODE_SIZE
}

function includeQuest(bounds: ChapterGridBounds, quest: QuestNode): void {
  expandBounds(bounds, quest.x, quest.y, questSize(quest), questSize(quest))
}

function includeLink(bounds: ChapterGridBounds, link: QuestLink): void {
  expandBounds(bounds, link.x, link.y, questSize(link), questSize(link))
}

function includeImage(bounds: ChapterGridBounds, image: ChapterImage): void {
  const width = image.width || 1
  const height = image.height || 1
  if (image.alignToCorner) {
    expandBounds(bounds, image.x + width / 2, image.y + height / 2, width, height)
    return
  }
  expandBounds(bounds, image.x, image.y, width, height)
}

/** Bounds of visible chapter content in FTB grid coordinates. */
export function computeChapterGridBounds(
  chapter: ChapterData,
  catalog: Map<string, QuestCatalogEntry>,
): ChapterGridBounds {
  const bounds: ChapterGridBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  }

  for (const quest of chapter.quests) {
    if (isQuestVisibleOnMap(quest)) {
      includeQuest(bounds, quest)
    }
  }

  for (const link of chapter.questLinks ?? []) {
    const entry = catalog.get(link.linkedQuest)
    if (entry && isQuestLinkVisibleOnMap(entry.quest)) {
      includeLink(bounds, link)
    }
  }

  for (const image of chapter.images ?? []) {
    includeImage(bounds, image)
  }

  if (!Number.isFinite(bounds.minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  return {
    minX: bounds.minX - BOUNDS_PAD_X,
    minY: bounds.minY - BOUNDS_PAD_Y,
    maxX: bounds.maxX + BOUNDS_PAD_X,
    maxY: bounds.maxY + BOUNDS_PAD_Y,
  }
}

/** FTB {@code resetScroll} — center of the virtual chapter canvas. */
export function chapterGridCenter(bounds: ChapterGridBounds): ChapterGridPoint {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
}

/** FTB {@code resetScroll} default — center of visible chapter content in grid units. */
export function getDefaultChapterViewCenter(
  chapter: ChapterData,
  catalog: Map<string, QuestCatalogEntry>,
): ChapterGridPoint {
  return chapterGridCenter(computeChapterGridBounds(chapter, catalog))
}

export function gridToFlowPoint(point: ChapterGridPoint, gridScale: number): ChapterGridPoint {
  return {
    x: gridToPx(point.x, gridScale),
    y: gridToPx(point.y, gridScale),
  }
}

export function flowToGridPoint(flowX: number, flowY: number, gridScale: number): ChapterGridPoint {
  const units = gridToPx(1, gridScale)
  return {
    x: flowX / units,
    y: flowY / units,
  }
}

export function viewportCenterGrid(
  viewport: { x: number; y: number; zoom: number },
  paneWidth: number,
  paneHeight: number,
  gridScale: number,
): ChapterGridPoint {
  const flowX = (paneWidth / 2 - viewport.x) / viewport.zoom
  const flowY = (paneHeight / 2 - viewport.y) / viewport.zoom
  return flowToGridPoint(flowX, flowY, gridScale)
}

/** FTB {@code scrollTo} target for quest / quest-link autofocus ids. */
export function resolveAutofocusGridPoint(
  chapter: ChapterData,
  catalog: Map<string, QuestCatalogEntry>,
  autofocusId: string,
): ChapterGridPoint | null {
  const quest = chapter.quests.find((entry) => entry.id === autofocusId)
  if (quest && isQuestVisibleOnMap(quest)) {
    return { x: quest.x, y: quest.y }
  }

  const link = chapter.questLinks?.find((entry) => entry.id === autofocusId)
  if (link) {
    const entry = catalog.get(link.linkedQuest)
    if (entry && isQuestLinkVisibleOnMap(entry.quest)) {
      return { x: link.x + 0.5, y: link.y + 0.5 }
    }
  }

  const linkedQuest = catalog.get(autofocusId)?.quest
  if (linkedQuest && isQuestVisibleOnMap(linkedQuest)) {
    return { x: linkedQuest.x, y: linkedQuest.y }
  }

  return null
}
