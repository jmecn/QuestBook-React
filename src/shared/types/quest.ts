export interface QuestTask {
  id: string
  type: string
  title?: string
  items?: string[]
  /** {@code ftbfiltersystem:smart_filter} expression when task accepts a tag/filter, not one item. */
  filterRaw?: string
  toObserve?: string
  dimension?: string
}

export interface ChapterImage {
  image: string
  /** Pre-baked PNG (or vertical sprite strip) under quest-export {@code assets/chapter-images/}. */
  baked?: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  click?: string | null
  order?: number
  /** 0–255; export always writes (default 255). */
  alpha?: number
  /** FTB {@code Color4I.rgb()} when not white. */
  color?: number
  alignToCorner?: boolean
  animated?: boolean
  frameCount?: number
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
  /** FTB {@code guide_page} — Field Guide deep link target. */
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
  /** FTB {@code autofocus_id} — quest or quest-link id to center on when opening the chapter. */
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
}

export interface ChapterGroup {
  id: string
  title?: string
  /** List index in FTB {@code chapterGroups} (group order in sidebar). */
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
