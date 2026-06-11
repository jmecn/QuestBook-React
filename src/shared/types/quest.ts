export interface QuestTask {
  id: string
  type: string
  title?: string
  items?: string[]

  filterRaw?: string
  toObserve?: string
  dimension?: string
}

export interface ChapterImage {
  image: string

  baked?: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  click?: string | null
  order?: number

  alpha?: number

  color?: number
  alignToCorner?: boolean
  animated?: boolean
  frameCount?: number

  frameTime?: number

  frameSequence?: number[]
  frameWidth?: number
  frameHeight?: number
  dependency?: string
  editorsOnly?: boolean
  hover?: string[]
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

  invisible?: boolean
  shape?: string
  title?: string

  titleItem?: string

  titleCount?: number
  subtitle?: string
  description?: string | string[]
  icon?: string

  iconItems?: string[]
  dependencies?: string[]
  hideDependencyLines?: boolean

  guidePage?: string
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

  autofocusId?: string
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
  subtitle?: string | string[]
}

export interface ChapterGroup {
  id: string
  title?: string

  orderIndex?: number
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
