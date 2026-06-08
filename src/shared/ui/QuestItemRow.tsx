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
  locale = 'en_us',
  iconSize = 24,
}: QuestItemRowProps) {
  const countPrefix = count != null && count > 1 ? `${count}× ` : ''

  return (
    <span className="quest-item-row">
      <QuestIcon icon={itemId} size={iconSize} locale={locale} />
      <span className="quest-item-row__label">{countPrefix}{label}</span>
    </span>
  )
}
