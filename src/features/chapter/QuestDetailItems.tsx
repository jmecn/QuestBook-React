import { useEffect, useState } from 'react'
import { resolveItemDisplayName } from '@/shared/lib/item-display-name'
import { QuestItemRow } from '@/shared/ui/QuestItemRow'
import type { QuestReward, QuestTask } from '@/shared/types/quest'
import { resolveQuestText } from '@/shared/lib/quest-text'
import { formatRewardLabel } from '@/shared/lib/reward-text'

function TaskRow({
  task,
  dict,
  locale,
}: {
  task: QuestTask
  dict: Record<string, string>
  locale: string
}) {
  const title = resolveQuestText(dict, task.title)
  const items = task.items ?? []

  if (task.type === 'item' && items.length > 0) {
    return (
      <>
        {items.map((itemId) => (
          <TaskItemLabel key={`${task.id}:${itemId}`} itemId={itemId} locale={locale} />
        ))}
      </>
    )
  }

  if (title) {
    return <span>{title}</span>
  }

  if (task.type === 'checkmark') {
    return <span className="quest-detail__checkmark">✓</span>
  }

  return <span>{task.type}</span>
}

function TaskItemLabel({ itemId, locale }: { itemId: string; locale: string }) {
  const [label, setLabel] = useState(itemId)

  useEffect(() => {
    let cancelled = false
    void resolveItemDisplayName(itemId, locale).then((name) => {
      if (!cancelled) setLabel(name)
    })
    return () => {
      cancelled = true
    }
  }, [itemId, locale])

  return <QuestItemRow itemId={itemId} label={label} locale={locale} />
}

function RewardRow({
  reward,
  locale,
}: {
  reward: QuestReward
  locale: string
}) {
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    if (reward.type !== 'item' || !reward.items?.length) {
      setLabels([])
      return undefined
    }

    void Promise.all(reward.items.map((itemId) => resolveItemDisplayName(itemId, locale)))
      .then((names) => {
        if (!cancelled) setLabels(names)
      })

    return () => {
      cancelled = true
    }
  }, [locale, reward.items, reward.type])

  if (reward.type === 'item' && reward.items?.length) {
    return (
      <>
        {reward.items.map((itemId, index) => (
          <QuestItemRow
            key={`${reward.id}:${itemId}`}
            itemId={itemId}
            count={reward.count}
            label={labels[index] ?? itemId}
            locale={locale}
          />
        ))}
      </>
    )
  }

  return <span>{formatRewardLabel(reward)}</span>
}

export function QuestTaskListItem({
  task,
  dict,
  locale,
}: {
  task: QuestTask
  dict: Record<string, string>
  locale: string
}) {
  return (
    <li>
      <TaskRow task={task} dict={dict} locale={locale} />
    </li>
  )
}

export function QuestRewardListItem({
  reward,
  locale,
}: {
  reward: QuestReward
  locale: string
}) {
  return (
    <li>
      <RewardRow reward={reward} locale={locale} />
    </li>
  )
}
