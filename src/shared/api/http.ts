export async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url)
    if (!response.ok) return fallback
    const contentType = String(response.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('application/json')) return fallback
    return (await response.json()) as T
  } catch {
    return fallback
  }
}

export async function fetchJsonRequired<T>(url: string): Promise<T | null> {
  return fetchJson<T | null>(url, null)
}
