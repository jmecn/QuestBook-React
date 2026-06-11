

export function normalizeRegistryId(registryId: string): string {
  let id = registryId.trim()
  if (id.startsWith('item:')) {
    id = id.slice(5)
  }
  const brace = id.indexOf('{')
  if (brace >= 0) {
    id = id.slice(0, brace)
  }
  const at = id.indexOf('@')
  if (at >= 0) {
    id = id.slice(0, at)
  }
  return id
}

export function dottedRegistryId(registryId: string): string {
  return normalizeRegistryId(registryId).replace(/\//g, '.').replace(/:/g, '.')
}

export function itemLookupKeys(registryId: string): string[] {
  const dotted = dottedRegistryId(registryId)
  if (!dotted) return []
  return [`item.${dotted}`, `block.${dotted}`, `fluid.${dotted}`]
}
