export interface QuestTask {
  id: string
  type: string
  title?: string
  items?: string[]
  toObserve?: string
  dimension?: string
}

export interface ChapterImage {
  image: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  click?: string | null
  order?: number
}

export interface QuestReward {
  id: string
  type: string
  title?: string
  items?: string[]
  count?: number
  xp?: number
}

export interface QuestNode {
  id: string
  x: number
  y: number
  size?: number
  /** SNBT {@code invisible} — hidden in-game until the quest is completed. */
  invisible?: boolean
  shape?: string
  title?: string
  /** First-task item id when {@code title} is unset (FTB {@code getAltTitle}). */
  titleItem?: string
  /** Item-task count prefix for {@code titleItem} (e.g. {@code 3x Stick}). */
  titleCount?: number
  subtitle?: string
  description?: string | string[]
  icon?: string
  /** Extra task icon item ids when FTB uses {@code AnimatedIcon}. */
  iconItems?: string[]
  dependencies?: string[]
  hideDependencyLines?: boolean
  tasks?: QuestTask[]
  rewards?: QuestReward[]
}

export interface QuestLink {
  id: string
  linkedQuest: string
  x: number
  y: number
  size?: number
  shape?: string
}

export interface ChapterData {
  id: string
  filename: string
  group?: string | null
  title?: string
  subtitle?: string | string[]
  quests: QuestNode[]
  questLinks?: QuestLink[]
  images?: ChapterImage[]
}

export interface ChapterSummary {
  id: string
  filename: string
  group?: string | null
  orderIndex?: number
  icon?: string
  title?: string
}

export interface ChapterGroup {
  id: string
  title?: string
}

export interface QuestIndex {
  title?: string
  gridScale?: number
  chapterGroups?: ChapterGroup[]
  chapters?: ChapterSummary[]
}

export interface LanguageConfig {
  defaultLocale: string
  enabledLocales: string[]
  localeNames: Record<string, string>
}
