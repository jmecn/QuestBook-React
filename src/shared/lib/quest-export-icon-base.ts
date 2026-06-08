import { questExportUrl } from '@/shared/lib/site-base'

/**
 * emi-recipe-renderer {@code baseUrl} for quest-export icon atlas.
 * Layout: {@code data/quest-export/assets/{bundle.json, icons/, lang/}}.
 */
export function questExportIconBundleBaseUrl(): string {
  return questExportUrl('assets/')
}
