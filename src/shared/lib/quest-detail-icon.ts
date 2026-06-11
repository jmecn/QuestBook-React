import { FTB_SMART_FILTER_ID } from '@/shared/lib/quest-task-items'
import type { IconDisplay } from '@/shared/types/quest'

/** 按 itemId 在导出 frames 序列里定位 iconDisplay（与 Java collectItemRefs 顺序一致，含 smart_filter 占位）。 */
export function iconDisplayForItem(
  display: IconDisplay | undefined,
  itemId: string,
  rawItems: string[] | undefined,
): IconDisplay | undefined {
  if (!display) return undefined

  const items = rawItems ?? []
  const exportIndex = items.indexOf(itemId)
  if (exportIndex < 0) {
    return display.spriteId.startsWith(`${itemId}@`)
      ? { ...display, frames: undefined }
      : undefined
  }

  if (display.frames && display.frames.length > exportIndex) {
    const frame = display.frames[exportIndex]
    if (frame) {
      return { ...display, spriteId: frame.spriteId, frames: undefined }
    }
  }

  if (exportIndex === 0 && display.spriteId.startsWith(`${itemId}@`)) {
    return { ...display, frames: undefined }
  }

  return undefined
}

export function iconDisplayForItemList(
  display: IconDisplay | undefined,
  itemId: string,
  rawItems: string[] | undefined,
): IconDisplay | undefined {
  const filtered = (rawItems ?? []).filter((id) => id !== FTB_SMART_FILTER_ID)
  const displayIndex = filtered.indexOf(itemId)
  if (displayIndex < 0) return undefined

  // Legacy fallback: frames 与过滤后 items 等长时仍按显示序索引
  if (display?.frames && display.frames.length === filtered.length) {
    const frame = display.frames[displayIndex]
    if (frame) {
      return { ...display, spriteId: frame.spriteId, frames: undefined }
    }
  }

  return iconDisplayForItem(display, itemId, rawItems)
}
