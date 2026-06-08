import type { EmiRendererOptions, EmiThemeName } from 'emi-recipe-renderer'
import type { Theme } from '@/shared/lib/theme'

export interface IconMountSession {
  disconnect(): void
}

type EmiModule = typeof import('emi-recipe-renderer')

type IconRenderer = InstanceType<EmiModule['EmiRecipeRenderer']> & {
  ensureIconStylesheets(): Promise<void>
  createAtlasSpanForIconKey(itemId: string): HTMLElement
  translateRegistryAsync(registryId: string, kind?: string): Promise<string>
  setLocale?(locale: string): Promise<void> | void
  setTheme?(theme: EmiThemeName): void
}

let emiModulePromise: Promise<EmiModule> | null = null

function loadEmiModule(): Promise<EmiModule> {
  emiModulePromise ??= import('emi-recipe-renderer')
  return emiModulePromise
}

class RecipeViewerIconClient {
  baseUrl = ''
  locale = 'en_us'
  theme: EmiThemeName = 'dark'
  private renderer: IconRenderer | null = null
  private configurePromise: Promise<void> | null = null

  private rendererOptions(): EmiRendererOptions {
    return {
      baseUrl: this.baseUrl,
      locale: this.locale,
      theme: this.theme,
      injectIconStylesheets: true,
    }
  }

  private async createRenderer(): Promise<IconRenderer> {
    const { EmiRecipeRenderer } = await loadEmiModule()
    return new EmiRecipeRenderer(this.rendererOptions()) as IconRenderer
  }

  private async getRenderer(): Promise<IconRenderer> {
    if (!this.renderer) {
      this.renderer = await this.createRenderer()
    }
    return this.renderer
  }

  private async warmup(): Promise<IconRenderer> {
    const renderer = await this.getRenderer()
    await renderer.loadIndex()
    await renderer.ensureIconStylesheets()
    if (typeof renderer.setLocale === 'function') {
      await renderer.setLocale(this.locale)
    }
    return renderer
  }

  async configure(baseUrl: string, locale: string, theme: Theme): Promise<void> {
    const baseChanged = this.baseUrl !== baseUrl
    this.baseUrl = baseUrl
    this.locale = locale
    this.theme = theme
    if (baseChanged) {
      this.renderer = null
    }
    this.configurePromise = this.warmup().then(() => undefined)
    await this.configurePromise
  }

  setTheme(theme: Theme) {
    this.theme = theme
    this.renderer?.setTheme?.(theme)
  }

  mountItemIcon(
    host: HTMLElement,
    itemId: string,
    options?: { baseUrl?: string; locale?: string; fallbackText?: string },
  ): IconMountSession {
    let cancelled = false
    const fallbackText = options?.fallbackText ?? '??'
    host.textContent = fallbackText
    host.title = itemId

    void this.ensureReady(options?.baseUrl, options?.locale)
      .then(async (renderer) => {
        if (cancelled) return
        await renderer.ensureIconStylesheets()
        host.replaceChildren(renderer.createAtlasSpanForIconKey(itemId))
      })
      .catch(() => {
        if (!cancelled) host.textContent = fallbackText
      })

    return {
      disconnect: () => {
        cancelled = true
        host.replaceChildren()
      },
    }
  }

  async whenReady(): Promise<IconRenderer> {
    if (this.configurePromise) await this.configurePromise
    else await this.warmup()
    return this.getRenderer()
  }

  private async ensureReady(baseUrl?: string, locale?: string): Promise<IconRenderer> {
    if (baseUrl) {
      await this.configure(baseUrl, locale ?? this.locale, this.theme)
    } else {
      await this.whenReady()
    }
    return this.getRenderer()
  }
}

let singleton: RecipeViewerIconClient | null = null

export function getRecipeViewerIconClient(): RecipeViewerIconClient {
  if (!singleton) singleton = new RecipeViewerIconClient()
  return singleton
}
