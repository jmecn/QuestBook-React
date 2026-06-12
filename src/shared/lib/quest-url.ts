export const QUEST_QUERY_KEY = 'quest'

export function questIdFromSearchParams(params: URLSearchParams): string | null {
  const raw = params.get(QUEST_QUERY_KEY)
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function applyQuestToSearchParams(
  params: URLSearchParams,
  questId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(params)
  if (questId) {
    next.set(QUEST_QUERY_KEY, questId)
  } else {
    next.delete(QUEST_QUERY_KEY)
  }
  return next
}
