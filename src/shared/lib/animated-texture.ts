export interface TextureAnimationMeta {
  frameWidth: number
  frameHeight: number
  frametime: number
  frameCount: number
}

export async function loadTextureAnimation(
  pngUrl: string,
): Promise<TextureAnimationMeta | null> {
  try {
    const img = await loadImage(pngUrl)
    const metaRes = await fetch(`${pngUrl}.mcmeta`)
    if (!metaRes.ok) return null

    const meta = (await metaRes.json()) as {
      animation?: { width?: number; height?: number; frametime?: number; frames?: number[] }
    }
    const animation = meta.animation
    if (!animation?.width || !animation?.height) return null

    const frameCount = animation.frames?.length
      ?? Math.max(1, Math.floor(img.naturalHeight / animation.height))

    return {
      frameWidth: animation.width,
      frameHeight: animation.height,
      frametime: animation.frametime ?? 1,
      frameCount,
    }
  } catch {
    return null
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
