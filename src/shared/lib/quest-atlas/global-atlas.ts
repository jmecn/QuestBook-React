import { questExportUrl } from '@/shared/lib/site-base'
import type { GlobalAtlas, QuestIndex } from '@/shared/types/quest'
import { loadImageCached } from '@/shared/lib/quest-atlas/load-image'
import type { GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'

let cachedContext: GlobalAtlasContext | null = null
let cachedSrc: string | null = null

export function questIndexGlobalAtlas(index: QuestIndex): GlobalAtlas | null {
  if (index.globalAtlas) return index.globalAtlas
  const legacy = index as QuestIndex & { shapeAtlas?: GlobalAtlas }
  return legacy.shapeAtlas ?? null
}

export async function loadGlobalAtlasContext(
  meta: GlobalAtlas,
): Promise<GlobalAtlasContext> {
  if (cachedContext && cachedSrc === meta.src) {
    return cachedContext
  }
  const image = await loadImageCached(questExportUrl(meta.src))
  cachedContext = { meta, image }
  cachedSrc = meta.src
  return cachedContext
}

export async function loadGlobalAtlasFromIndex(
  index: QuestIndex,
): Promise<GlobalAtlasContext | null> {
  const meta = questIndexGlobalAtlas(index)
  if (!meta) return null
  return loadGlobalAtlasContext(meta)
}
