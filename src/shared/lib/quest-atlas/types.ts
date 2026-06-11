import type {
  GlobalAtlas,
  IconAtlasPage,
  IconSpriteRect,
} from '@/shared/types/quest'

export interface GlobalAtlasContext {
  meta: GlobalAtlas
  image: HTMLImageElement
}

export interface ChapterAtlasContext {
  iconAtlases: Record<string, IconAtlasPage>
  iconSprites: Record<string, IconSpriteRect>
  images: Map<string, HTMLImageElement>
}
