/** Right overlay width for the quest detail drawer (matches CSS). */
export function questDrawerInsetPx(viewportWidth: number): number {
  return Math.min(360, Math.round(viewportWidth * 0.34))
}

/** Left chapter sidebar width (matches CSS flex-basis). */
export function sidebarWidthPx(viewportWidth: number, collapsed: boolean): number {
  return collapsed ? 52 : Math.min(240, Math.round(viewportWidth * 0.28))
}

/** Map width delta when sidebar toggles (positive = map grew). */
export function sidebarMapWidthDelta(viewportWidth: number, wasCollapsed: boolean, isCollapsed: boolean): number {
  const prev = sidebarWidthPx(viewportWidth, wasCollapsed)
  const next = sidebarWidthPx(viewportWidth, isCollapsed)
  return prev - next
}
