/** 更新 quest 深链 hash，避免 `window.location.hash =` 触发整页导航与 favicon 重拉。 */
export function setQuestHash(questId: string | null): void {
  const base = `${window.location.pathname}${window.location.search}`
  const next = questId ? `${base}#quest=${encodeURIComponent(questId)}` : base
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (current !== next) {
    window.history.replaceState(null, '', next)
  }
}

export function questIdFromHash(hash: string): string | null {
  const match = hash.match(/quest=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
