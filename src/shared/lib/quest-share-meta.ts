export const QUEST_SHARE_SITE_NAME = 'TerraFirmaGreg Quest'

export function formatQuestShareOgTitle(
  questTitle: string,
  siteName: string = QUEST_SHARE_SITE_NAME,
): string {
  const quest = String(questTitle ?? '').trim()
  return `${quest} | ${siteName}`
}
