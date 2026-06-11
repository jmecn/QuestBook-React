import { useRecipeBookItemHref } from '@/shared/hooks/useRecipeBookItemHref'
import type { ChapterAtlasContext, GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'
import { QuestHoverLabel } from '@/shared/ui/QuestHoverLabel'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import type { IconDisplay } from '@/shared/types/quest'

export interface QuestItemRowProps {
  itemId: string
  count?: number
  label: string
  locale?: string
  iconSize?: number
  iconDisplay?: IconDisplay
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
}

export function QuestItemRow({
  itemId,
  count,
  label,
  locale = 'en_us',
  iconSize = 32,
  iconDisplay,
  globalAtlas = null,
  chapterAtlas = null,
}: QuestItemRowProps) {
  const tooltip = count != null && count > 1 ? `${count}× ${label}` : label
  const recipeHref = useRecipeBookItemHref(itemId, locale)
  const className = recipeHref
    ? 'quest-item-row quest-item-row--link'
    : 'quest-item-row'

  const content = (
    <QuestIcon
      display={iconDisplay}
      icon={itemId}
      globalAtlas={globalAtlas}
      chapterAtlas={chapterAtlas}
      size={iconSize}
      variant="tile"
      tooltip=""
    />
  )

  if (recipeHref) {
    return (
      <QuestHoverLabel
        as="button"
        type="button"
        className={className}
        label={tooltip}
        onClick={() => window.open(recipeHref, '_blank', 'noopener,noreferrer')}
      >
        {content}
      </QuestHoverLabel>
    )
  }

  return (
    <QuestHoverLabel className={className} label={tooltip}>
      {content}
    </QuestHoverLabel>
  )
}
