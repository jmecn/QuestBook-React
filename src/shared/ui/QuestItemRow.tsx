import { QuestIcon } from '@/shared/ui/QuestIcon'

export interface QuestItemRowProps {
  itemId: string
  count?: number
  label: string
  locale?: string
  iconSize?: number
}

export function QuestItemRow({
  itemId,
  count,
  label,
  iconSize = 32,
}: QuestItemRowProps) {
  const countPrefix = count != null && count > 1 ? `${count}× ` : ''

  return (
    <span className="quest-item-row">
      <QuestIcon icon={itemId} size={iconSize} variant="tile" />
      <span className="quest-item-row__label">{countPrefix}{label}</span>
    </span>
  )
}
