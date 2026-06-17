export const GISCUS_DEFAULT = {
  repo: 'TerraFirmaGreg-Team/Modpack-Modern' as const,
  repoId: 'R_kgDOH_FIbA',
  category: 'General',
  categoryId: 'DIC_kwDOH_FIbM4CbMDm',
}

export type GiscusConfig = typeof GISCUS_DEFAULT & { enabled?: boolean }

export async function loadGiscusConfig(): Promise<GiscusConfig | null> {
  for (const url of ['/giscus-config.json', 'https://wiki.terrafirmagreg.team/giscus-config.json']) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const json = (await res.json()) as GiscusConfig
      if (json.enabled === false || !json.repoId) return null
      return { ...GISCUS_DEFAULT, ...json }
    } catch {
    }
  }
  return GISCUS_DEFAULT
}
