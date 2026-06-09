import { QuestIcon } from '@/shared/ui/QuestIcon'

export interface QuestItemRowProps {
  itemId: string
  count?: number
  label: string
  locale?: string
  iconSize?: number
}

/** Icon-only task/reward chip; item name is shown on hover via {@code title}. */
export function QuestItemRow({
  itemId,
  count,
  label,
  iconSize = 32,
}: QuestItemRowProps) {
  const tooltip = count != null && count > 1 ? `${count}× ${label}` : label

  return (
    <span className="quest-item-row" title={tooltip} aria-label={tooltip}>
      <QuestIcon icon={itemId} size={iconSize} variant="tile" tooltip="" />
    </span>
  )
}
