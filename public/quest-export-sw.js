/* global caches, fetch, URL, Response, self */
/**
 * Cache-first + stale-while-revalidate for quest-export static assets.
 * Cache bucket name comes from site root build.json#contentHash
 * (written by QuestBook-Modern ci/run.sh record-build-versions).
 */

const EXPORT_PATH = '/data/quest-export/'
const CACHE_PREFIX = 'quest-export-'
const PENDING_CACHE = `${CACHE_PREFIX}pending`

/** @type {string | null} */
let activeContentHash = null

function isQuestExportUrl(url) {
  return url.pathname.includes(EXPORT_PATH)
}

function buildJsonUrl() {
  return new URL('build.json', self.registration.scope).href
}

function cacheNameForContentHash(contentHash) {
  const safe = String(contentHash || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${CACHE_PREFIX}${safe}`
}

async function purgeOldExportCaches(keepName) {
  const keys = await caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== keepName && key !== PENDING_CACHE)
      .map((key) => caches.delete(key)),
  )
}

async function readContentHash(response) {
  try {
    const build = await response.clone().json()
    return build.contentHash || null
  } catch {
    return null
  }
}

async function fetchContentHash({ forceNetwork = false } = {}) {
  if (!forceNetwork && activeContentHash) return activeContentHash

  try {
    const response = await fetch(buildJsonUrl(), { cache: forceNetwork ? 'no-store' : 'default' })
    if (!response.ok) return null
    const hash = await readContentHash(response)
    if (hash) activeContentHash = hash
    return hash
  } catch {
    return null
  }
}

async function syncCacheFromBuildJson({ forceNetwork = false } = {}) {
  const hash = await fetchContentHash({ forceNetwork })
  if (!hash) return PENDING_CACHE

  const cacheName = cacheNameForContentHash(hash)
  await purgeOldExportCaches(cacheName)
  return cacheName
}

async function getActiveCacheName() {
  if (activeContentHash) {
    return cacheNameForContentHash(activeContentHash)
  }

  const keys = await caches.keys()
  const named = keys.filter(
    (key) => key.startsWith(CACHE_PREFIX) && key !== PENDING_CACHE,
  )
  if (named.length === 1) return named[0]
  if (named.length > 1) {
    named.sort()
    return named[named.length - 1]
  }
  return PENDING_CACHE
}

async function handleQuestExportFetch(request) {
  let cacheName = await getActiveCacheName()

  if (cacheName === PENDING_CACHE) {
    cacheName = await syncCacheFromBuildJson({ forceNetwork: true })
  } else {
    void syncCacheFromBuildJson({ forceNetwork: true })
  }

  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const revalidate = fetch(request)
    .then(async (response) => {
      if (!response.ok) return response
      const targetCache = await caches.open(cacheName)
      await targetCache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    void revalidate
    return cached
  }

  const network = await revalidate
  if (network) return network
  return new Response('Quest export asset unavailable', { status: 504 })
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await caches.open(PENDING_CACHE)
      await syncCacheFromBuildJson({ forceNetwork: true })
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (!isQuestExportUrl(url)) return

  event.respondWith(handleQuestExportFetch(event.request))
})
