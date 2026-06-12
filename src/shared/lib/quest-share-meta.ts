/**
 * Share shell og:title / og:site_name conventions.
 * Keep in sync with QuestBook-Modern/ci/scripts/lib/quest-share-meta.mjs
 */
export const QUEST_SHARE_SITE_NAME = 'TerraFirmaGreg Quest Book'

/** og:title for per-quest share shells (same as deploy generate-share-shells). */
export function formatQuestShareOgTitle(
  questTitle: string,
  chapterTitle: string,
  siteName: string = QUEST_SHARE_SITE_NAME,
): string {
  const quest = String(questTitle ?? '').trim()
  const chapter = String(chapterTitle ?? '').trim()
  return `${quest} | ${chapter} | ${siteName}`
}
