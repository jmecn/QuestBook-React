import { resolveItemDisplayName, resolveRegistryDisplayName } from '@/shared/lib/item-display-name'
import { taskDisplayItemIds } from '@/shared/lib/quest-task-items'
import { resolveQuestText } from '@/shared/lib/quest-text'
import type { QuestNode, QuestTask } from '@/shared/types/quest'

const FTB_UNNAMED_KEY = 'ftbquests.unnamed'
const FTB_TASK_TYPE_KEY_PREFIX = 'ftbquests.task.ftbquests.'

function registryIdFallback(registryId: string): string {
  const segment = registryId.split(':')[1] ?? registryId
  return segment.replace(/_/g, ' ')
}

function formatCountLabel(count: number | undefined, name: string): string {
  return count != null && count > 1 ? `${count}x ${name}` : name
}

function taskTypeLabel(dict: Record<string, string>, type: string): string {
  const key = `${FTB_TASK_TYPE_KEY_PREFIX}${type}`
  const label = dict[key]
  if (label && label !== key) return label
  return type.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function unnamedQuestLabel(dict: Record<string, string>): string {
  const label = dict[FTB_UNNAMED_KEY]
  return label && label !== FTB_UNNAMED_KEY ? label : 'Unnamed'
}

function appendDetailLabel(dict: Record<string, string>, type: string, detail: string): string {
  const prefix = taskTypeLabel(dict, type)
  return detail ? `${prefix}: ${detail}` : prefix
}

/** FTB Task.getTitle()：有 title 用 title，否则 getAltTitle()。 */
export function syncTaskDisplayTitle(task: QuestTask, dict: Record<string, string>): string {
  const fromTitle = resolveQuestText(dict, task.title)
  if (fromTitle) return fromTitle

  switch (task.type) {
    case 'item': {
      const itemId = taskDisplayItemIds(task)[0]
      if (itemId) {
        return formatCountLabel(task.value, registryIdFallback(itemId))
      }
      break
    }
    case 'fluid':
      if (task.fluid) {
        const fluid = registryIdFallback(task.fluid)
        if (task.value != null && task.value > 0) {
          return `${task.value} mB of ${fluid}`
        }
        return fluid
      }
      break
    case 'dimension':
      if (task.dimension) {
        return appendDetailLabel(dict, 'dimension', task.dimension)
      }
      break
    case 'biome':
      if (task.biome) {
        return appendDetailLabel(dict, 'biome', task.biome)
      }
      break
    case 'gamestage':
    case 'stage':
      if (task.stage) {
        return appendDetailLabel(dict, 'gamestage', task.stage)
      }
      break
    case 'observation':
      if (task.toObserve) {
        return appendDetailLabel(dict, 'observation', task.toObserve)
      }
      break
    case 'kill':
      if (task.entity) {
        return appendDetailLabel(dict, 'kill', registryIdFallback(task.entity))
      }
      break
    default:
      break
  }

  return taskTypeLabel(dict, task.type)
}

export async function resolveTaskDisplayTitle(
  task: QuestTask,
  dict: Record<string, string>,
  locale: string,
): Promise<string> {
  const fromTitle = resolveQuestText(dict, task.title)
  if (fromTitle) return fromTitle

  switch (task.type) {
    case 'item': {
      const itemId = taskDisplayItemIds(task)[0]
      if (itemId) {
        const name = await resolveItemDisplayName(itemId, locale)
        return formatCountLabel(task.value, name)
      }
      break
    }
    case 'fluid':
      if (task.fluid) {
        const name = await resolveRegistryDisplayName(task.fluid, locale)
          ?? registryIdFallback(task.fluid)
        if (task.value != null && task.value > 0) {
          return `${task.value} mB of ${name}`
        }
        return name
      }
      break
    case 'kill':
      if (task.entity) {
        const entityName = await resolveRegistryDisplayName(task.entity, locale)
          ?? registryIdFallback(task.entity)
        return appendDetailLabel(dict, 'kill', entityName)
      }
      break
    case 'observation':
      if (task.toObserve) {
        const observeName = await resolveRegistryDisplayName(task.toObserve, locale)
        return appendDetailLabel(dict, 'observation', observeName ?? task.toObserve)
      }
      break
    default:
      break
  }

  return syncTaskDisplayTitle(task, dict)
}

/** FTB Quest.getAltTitle()：第一个 task 的标题，无 task 则 unnamed。 */
export function syncQuestAltTitle(quest: QuestNode, dict: Record<string, string>): string {
  const firstTask = quest.tasks?.[0]
  if (firstTask) {
    return syncTaskDisplayTitle(firstTask, dict)
  }
  return unnamedQuestLabel(dict)
}

export async function resolveQuestAltTitle(
  quest: QuestNode,
  dict: Record<string, string>,
  locale: string,
): Promise<string> {
  const firstTask = quest.tasks?.[0]
  if (firstTask) {
    return resolveTaskDisplayTitle(firstTask, dict, locale)
  }
  return unnamedQuestLabel(dict)
}
