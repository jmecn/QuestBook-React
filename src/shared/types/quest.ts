export interface QuestTask {
  id: string
  type: string
  title?: string
  items?: string[]
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
  shape?: string
  title?: string
  subtitle?: string
  description?: string | string[]
  icon?: string
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
  shape?: string
}

export interface ChapterData {
  id: string
  filename: string
  group?: string | null
  title?: string
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
