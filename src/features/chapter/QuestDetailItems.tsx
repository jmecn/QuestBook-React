import { useEffect, useMemo, useState } from 'react'
import { resolveItemDisplayName } from '@/shared/lib/item-display-name'
import { extractFilterTagIds, taskDisplayItemIds } from '@/shared/lib/quest-task-items'
import { QuestItemRow } from '@/shared/ui/QuestItemRow'
import { QuestTagLinkedText } from '@/shared/ui/QuestTagLinkedText'
import type { QuestReward, QuestTask } from '@/shared/types/quest'
import { resolveQuestText } from '@/shared/lib/quest-text'
import { formatRewardLabel } from '@/shared/lib/reward-text'

function TaskTitle({
  task,
  dict,
  locale,
}: {
  task: QuestTask
  dict: Record<string, string>
  locale: string
}) {
  const [label, setLabel] = useState(() => resolveQuestText(dict, task.title))

  useEffect(() => {
    let cancelled = false
    const base = resolveQuestText(dict, task.title)
    const observe = task.toObserve?.trim()
    if (!observe || !base.includes(observe)) {
      setLabel(base)
      return undefined
    }
    void resolveItemDisplayName(observe, locale).then((name) => {
      if (!cancelled) setLabel(base.replace(observe, name))
    })
    return () => {
      cancelled = true
    }
  }, [dict, locale, task.title, task.toObserve])

  const filterTagIds = useMemo(
    () => (task.filterRaw ? extractFilterTagIds(task.filterRaw) : []),
    [task.filterRaw],
  )

  return (
    <QuestTagLinkedText text={label} locale={locale} extraTagIds={filterTagIds} />
  )
}

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
  const displayItems = taskDisplayItemIds(task)

  if (task.type === 'item' && displayItems.length > 0) {
    return (
      <span className="quest-task-items">
        {displayItems.map((itemId) => (
          <TaskItemLabel key={`${task.id}:${itemId}`} itemId={itemId} locale={locale} />
        ))}
      </span>
    )
  }

  if (title) {
    return <TaskTitle task={task} dict={dict} locale={locale} />
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
      <span className="quest-task-items">
        {reward.items.map((itemId, index) => (
          <QuestItemRow
            key={`${reward.id}:${itemId}`}
            itemId={itemId}
            count={reward.count}
            label={labels[index] ?? itemId}
            locale={locale}
          />
        ))}
      </span>
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
