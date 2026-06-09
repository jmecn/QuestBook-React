import { questExportTextureCandidates } from '@/shared/lib/quest-export-asset'

export type QuestShapeLayer = 'background' | 'outline' | 'shape'

/** FTB {@code QuestShape} id; empty/default → circle (game default). */
export function resolveQuestShapeId(shape?: string | null): string {
  const trimmed = shape?.trim()
  if (!trimmed || trimmed === 'default') return 'circle'
  return trimmed
}

export function questShapeTextureUrl(
  shape: string | undefined | null,
  layer: QuestShapeLayer,
): string | null {
  const shapeId = resolveQuestShapeId(shape)
  if (shapeId === 'none') return null
  const ref = `ftbquests:textures/shapes/${shapeId}/${layer}.png`
  const urls = questExportTextureCandidates(ref)
  return urls[0] ?? null
}
