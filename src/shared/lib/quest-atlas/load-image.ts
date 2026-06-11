const imageCache = new Map<string, Promise<HTMLImageElement>>()

export function loadImageCached(url: string): Promise<HTMLImageElement> {
  const existing = imageCache.get(url)
  if (existing) return existing

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
  imageCache.set(url, promise)
  return promise
}
