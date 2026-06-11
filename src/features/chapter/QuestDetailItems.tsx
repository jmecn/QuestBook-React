import { useEffect, useMemo, useState } from 'react'
import { resolveItemDisplayName, resolveRegistryDisplayName } from '@/shared/lib/item-display-name'
import {
  extractFilterTagIds,
  isCompactGridTask,
  taskDisplayItemIds,
} from '@/shared/lib/quest-task-items'
import { iconDisplayForItemList } from '@/shared/lib/quest-detail-icon'
import type { ChapterAtlasContext, GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'
import { QuestItemRow } from '@/shared/ui/QuestItemRow'
import { QuestTagLinkedText } from '@/shared/ui/QuestTagLinkedText'
import type { IconDisplay, QuestReward, QuestTask } from '@/shared/types/quest'
import { resolveQuestText } from '@/shared/lib/quest-text'
import { formatRewardLabel } from '@/shared/lib/reward-text'

function taskItemIconDisplay(task: QuestTask, itemId: string): IconDisplay | undefined {
  return iconDisplayForItemList(task.iconDisplay, itemId, task.items)
}

function rewardItemIconDisplay(reward: QuestReward, itemId: string): IconDisplay | undefined {
  return iconDisplayForItemList(reward.iconDisplay, itemId, reward.items)
}

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

    if (!observe || observe.startsWith('#') || !base.includes(observe)) {
      setLabel(base)
      return undefined
    }
    void resolveRegistryDisplayName(observe, locale).then((name) => {
      if (!cancelled) {
        setLabel(name ? base.replace(observe, name) : base)
      }
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
  iconSize = 32,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  task: QuestTask
  dict: Record<string, string>
  locale: string
  iconSize?: number
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
}) {
  const title = resolveQuestText(dict, task.title)
  const displayItems = taskDisplayItemIds(task)

  if (task.type === 'item' && displayItems.length > 0) {
    return (
      <span className="quest-task-items">
        {displayItems.map((itemId) => (
          <TaskItemLabel
            key={`${task.id}:${itemId}`}
            itemId={itemId}
            locale={locale}
            iconSize={iconSize}
            iconDisplay={taskItemIconDisplay(task, itemId)}
            globalAtlas={globalAtlas}
            chapterAtlas={chapterAtlas}
          />
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

function TaskItemLabel({
  itemId,
  locale,
  iconSize = 32,
  iconDisplay,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  itemId: string
  locale: string
  iconSize?: number
  iconDisplay?: IconDisplay
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
}) {
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

  return (
    <QuestItemRow
      itemId={itemId}
      label={label}
      locale={locale}
      iconSize={iconSize}
      iconDisplay={iconDisplay}
      globalAtlas={globalAtlas}
      chapterAtlas={chapterAtlas}
    />
  )
}

function TaskGridCell({
  task,
  locale,
  iconSize = 32,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  task: QuestTask
  locale: string
  iconSize?: number
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
}) {
  const displayItems = taskDisplayItemIds(task)

  if (task.type === 'checkmark') {
    return <span className="quest-detail__checkmark">✓</span>
  }

  if (task.type === 'item' && displayItems.length > 0) {
    return (
      <>
        {displayItems.map((itemId) => (
          <TaskItemLabel
            key={`${task.id}:${itemId}`}
            itemId={itemId}
            locale={locale}
            iconSize={iconSize}
            iconDisplay={taskItemIconDisplay(task, itemId)}
            globalAtlas={globalAtlas}
            chapterAtlas={chapterAtlas}
          />
        ))}
      </>
    )
  }

  return null
}

function RewardRow({
  reward,
  locale,
  iconSize = 32,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  reward: QuestReward
  locale: string
  iconSize?: number
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
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
            iconSize={iconSize}
            iconDisplay={rewardItemIconDisplay(reward, itemId)}
            globalAtlas={globalAtlas}
            chapterAtlas={chapterAtlas}
          />
        ))}
      </span>
    )
  }

  return <span>{formatRewardLabel(reward)}</span>
}

function RewardGridCell({
  reward,
  locale,
  iconSize = 32,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  reward: QuestReward
  locale: string
  iconSize?: number
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
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

  if (reward.type !== 'item' || !reward.items?.length) {
    return null
  }

  return (
    <>
      {reward.items.map((itemId, index) => (
        <QuestItemRow
          key={`${reward.id}:${itemId}`}
          itemId={itemId}
          count={reward.count}
          label={labels[index] ?? itemId}
          locale={locale}
          iconSize={iconSize}
          iconDisplay={rewardItemIconDisplay(reward, itemId)}
          globalAtlas={globalAtlas}
          chapterAtlas={chapterAtlas}
        />
      ))}
    </>
  )
}

export function QuestTaskList({
  tasks,
  dict,
  locale,
  iconSize = 32,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  tasks: QuestTask[]
  dict: Record<string, string>
  locale: string
  iconSize?: number
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
}) {
  return (
    <div className="quest-task-grid">
      {tasks.map((task) =>
        isCompactGridTask(task, dict) ? (
          <div key={task.id} className="quest-task-grid__cell">
            <TaskGridCell
              task={task}
              locale={locale}
              iconSize={iconSize}
              globalAtlas={globalAtlas}
              chapterAtlas={chapterAtlas}
            />
          </div>
        ) : (
          <div key={task.id} className="quest-task-grid__text-row">
            <TaskRow
              task={task}
              dict={dict}
              locale={locale}
              iconSize={iconSize}
              globalAtlas={globalAtlas}
              chapterAtlas={chapterAtlas}
            />
          </div>
        ),
      )}
    </div>
  )
}

export function QuestRewardList({
  rewards,
  locale,
  iconSize = 32,
  globalAtlas = null,
  chapterAtlas = null,
}: {
  rewards: QuestReward[]
  locale: string
  iconSize?: number
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
}) {
  return (
    <div className="quest-task-grid">
      {rewards.map((reward) =>
        reward.type === 'item' && reward.items?.length ? (
          <div key={reward.id} className="quest-task-grid__cell">
            <RewardGridCell
              reward={reward}
              locale={locale}
              iconSize={iconSize}
              globalAtlas={globalAtlas}
              chapterAtlas={chapterAtlas}
            />
          </div>
        ) : (
          <div key={reward.id} className="quest-task-grid__text-row">
            <RewardRow
              reward={reward}
              locale={locale}
              iconSize={iconSize}
              globalAtlas={globalAtlas}
              chapterAtlas={chapterAtlas}
            />
          </div>
        ),
      )}
    </div>
  )
}
