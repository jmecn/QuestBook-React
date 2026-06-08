import type { QuestReward } from '@/shared/types/quest'

const REWARD_TYPE_LABELS: Record<string, string> = {
  xp: 'Experience',
  item: 'Item',
  command: 'Command',
  loot: 'Loot',
  random: 'Random reward',
  choice: 'Choice reward',
}

export function formatRewardLabel(reward: QuestReward): string {
  if (reward.title) return reward.title

  if (reward.type === 'item' && reward.items?.length) {
    const count = reward.count && reward.count > 1 ? `${reward.count}× ` : ''
    const names = reward.items.join(', ')
    return `${count}${names}`
  }

  if (reward.type === 'xp') {
    if (reward.xp != null && reward.xp > 0) return `${reward.xp} XP`
    return 'XP'
  }

  return REWARD_TYPE_LABELS[reward.type] ?? reward.type
}
