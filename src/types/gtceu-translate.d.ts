declare module '@gtceu-translate' {
  export function translateComposedRegistry(
    registryId: string,
    kind: 'item' | 'fluid' | 'block',
    translateKey: (key: string) => string,
    langTable?: Record<string, string> | null,
  ): string | null

  export function isComposedRegistryNamespace(namespace: string): boolean
}
