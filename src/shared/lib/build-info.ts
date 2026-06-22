import { fetchJson } from '@/shared/api/http'
import { siteUrl } from '@/shared/lib/site-base'

export interface BuildInfo {
  modpack?: string
}

export function formatModpackVersion(raw: string | undefined | null): string | null {
  const value = String(raw ?? '').trim().replace(/^v/i, '')
  return value || null
}

let cachedBuildInfo: BuildInfo | null | undefined
let buildInfoPromise: Promise<BuildInfo | null> | null = null

export function loadBuildInfo(): Promise<BuildInfo | null> {
  if (cachedBuildInfo !== undefined) return Promise.resolve(cachedBuildInfo)
  if (!buildInfoPromise) {
    buildInfoPromise = fetchJson<BuildInfo | null>(siteUrl('build.json'), null).then((data) => {
      cachedBuildInfo = data
      return data
    })
  }
  return buildInfoPromise
}
