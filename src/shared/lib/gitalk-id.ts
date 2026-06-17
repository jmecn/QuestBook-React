/** Gitalk issue id max length (GitHub / Gitalk constraint). */
export const GITALK_ID_MAX = 49

export async function hashGitalkRaw(raw: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
    return Array.from(new Uint8Array(buf))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }
  return syncHashGitalkRaw(raw)
}

function syncHashGitalkRaw(raw: string): string {
  const parts: string[] = []
  for (let seed = 0; seed < 4; seed++) {
    let hash = seed
    for (let i = 0; i < raw.length; i++) {
      hash = Math.imul(hash ^ raw.charCodeAt(i), 0x5bd1e995)
      hash = (hash ^ (hash >>> 15)) >>> 0
    }
    parts.push(hash.toString(16).padStart(8, '0'))
  }
  return parts.join('')
}

/** `{prefix}/{sha256(raw).slice(...)}` — always within GITALK_ID_MAX. */
export async function gitalkHashedId(sitePrefix: string, raw: string): Promise<string> {
  const hash = await hashGitalkRaw(raw)
  const hashBudget = GITALK_ID_MAX - sitePrefix.length - 1
  return `${sitePrefix}/${hash.slice(0, hashBudget)}`
}
