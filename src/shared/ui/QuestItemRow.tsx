import { useRecipeBookItemHref } from '@/shared/hooks/useRecipeBookItemHref'
import { QuestHoverLabel } from '@/shared/ui/QuestHoverLabel'
import { QuestIcon } from '@/shared/ui/QuestIcon'

export interface QuestItemRowProps {
  itemId: string
  count?: number
  label: string
  locale?: string
  iconSize?: number
}

/** Icon-only task/reward chip; name on hover; links to recipe book when configured. */
export function QuestItemRow({
  itemId,
  count,
  label,
  locale = 'en_us',
  iconSize = 32,
}: QuestItemRowProps) {
  const tooltip = count != null && count > 1 ? `${count}× ${label}` : label
  const recipeHref = useRecipeBookItemHref(itemId, locale)
  const className = recipeHref
    ? 'quest-item-row quest-item-row--link'
    : 'quest-item-row'

  const content = (
    <QuestIcon icon={itemId} size={iconSize} variant="tile" tooltip="" />
  )

  if (recipeHref) {
    return (
      <QuestHoverLabel
        as="a"
        className={className}
        href={recipeHref}
        target="_blank"
        rel="noopener noreferrer"
        label={tooltip}
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
