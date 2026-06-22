import { normalizeRegistryId } from '@/shared/lib/registry-lang-keys'

export interface ItemsLangRow {
  id: string
  label?: string
}

export interface ItemsLangData {
  items?: ItemsLangRow[]
}

export function buildItemLabelTable(data: ItemsLangData | null | undefined): Record<string, string> {
  const labels: Record<string, string> = {}
  if (!data?.items?.length) return labels
  for (const row of data.items) {
    if (!row?.id || row.label == null) continue
    labels[normalizeRegistryId(row.id)] = String(row.label)
  }
  return labels
}

export function lookupItemLabel(
  labels: Record<string, string> | null | undefined,
  itemId: string,
): string | null {
  const bare = normalizeRegistryId(itemId)
  const label = labels?.[bare]
  return label != null && label !== '' ? label : null
}
