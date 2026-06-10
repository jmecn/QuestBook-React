/**
 * Minecraft / FTB Quests JSON text components in description lines.
 * See {@code MultilineTextEditorScreen.LINK_TEXT_TEMPLATE} and {@code ViewQuestPanel.handleCustomClickEvent}.
 */

import type { McTextStyle, RichTextNode } from '@/shared/lib/quest-rich-text-parser'
import { parseRichText } from '@/shared/lib/quest-rich-text-parser'

type McComponent = Record<string, unknown>

/** Minecraft named text colors → {@code &} code used by quest CSS. */
const NAMED_COLORS: Record<string, string> = {
  black: '0',
  dark_blue: '1',
  dark_green: '2',
  dark_aqua: '3',
  dark_red: '4',
  dark_purple: '5',
  gold: '6',
  gray: '7',
  grey: '7',
  dark_gray: '8',
  dark_grey: '8',
  blue: '9',
  green: 'a',
  aqua: 'b',
  red: 'c',
  light_purple: 'd',
  yellow: 'e',
  white: 'f',
}

export function normalizeQuestObjectId(raw: string): string {
  const trimmed = raw.trim().replace(/^#/, '')
  if (!trimmed) return trimmed
  return trimmed.toUpperCase()
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true'
}

function cloneStyle(style: McTextStyle): McTextStyle {
  return { ...style }
}

function applyComponentStyle(base: McTextStyle, comp: McComponent): McTextStyle {
  const style = cloneStyle(base)

  const color = comp.color
  if (typeof color === 'string') {
    const lower = color.toLowerCase()
    if (color.startsWith('#')) {
      style.hexColor = color
      style.mcColor = undefined
    } else if (NAMED_COLORS[lower]) {
      style.mcColor = NAMED_COLORS[lower]
      style.hexColor = undefined
    }
  }

  if (asBoolean(comp.bold)) style.bold = true
  if (asBoolean(comp.italic)) style.italic = true
  if (asBoolean(comp.underlined)) style.underline = true
  if (asBoolean(comp.strikethrough)) style.strikethrough = true
  if (asBoolean(comp.obfuscated)) style.obfuscated = true

  return style
}

function isTextComponentObject(value: unknown): value is McComponent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const comp = value as McComponent
  return (
    typeof comp.text === 'string'
    || typeof comp.translate === 'string'
    || Array.isArray(comp.extra)
    || Array.isArray(comp.with)
    || comp.score != null
    || typeof comp.selector === 'string'
    || typeof comp.keybind === 'string'
    || typeof comp.nbt === 'string'
  )
}

function isTextComponentRoot(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((entry) => isTextComponentObject(entry) || typeof entry === 'string')
  }
  return isTextComponentObject(value)
}

function wrapClickEvent(nodes: RichTextNode[], clickEvent: unknown): RichTextNode[] {
  if (nodes.length === 0) return nodes
  if (!clickEvent || typeof clickEvent !== 'object') return nodes

  const event = clickEvent as McComponent
  const action = event.action
  const value = event.value
  if (typeof action !== 'string' || typeof value !== 'string') return nodes

  if (action === 'change_page') {
    return [{
      type: 'questLink',
      questId: normalizeQuestObjectId(value),
      children: nodes,
    }]
  }

  if (action === 'open_url') {
    return [{
      type: 'link',
      href: value,
      children: nodes,
    }]
  }

  return nodes
}

function mergeTextNodes(nodes: RichTextNode[]): RichTextNode[] {
  if (nodes.length <= 1) return nodes
  const merged: RichTextNode[] = []
  for (const node of nodes) {
    const prev = merged[merged.length - 1]
    if (
      prev?.type === 'text'
      && node.type === 'text'
      && stylesEqual(prev.style, node.style)
    ) {
      prev.text += node.text
      continue
    }
    merged.push(node)
  }
  return merged
}

function stylesEqual(a: McTextStyle, b: McTextStyle): boolean {
  return a.mcColor === b.mcColor
    && a.hexColor === b.hexColor
    && !!a.bold === !!b.bold
    && !!a.italic === !!b.italic
    && !!a.underline === !!b.underline
    && !!a.strikethrough === !!b.strikethrough
    && !!a.obfuscated === !!b.obfuscated
}

function parseTranslate(
  key: string,
  withArgs: unknown,
  dict: Record<string, string>,
  style: McTextStyle,
): RichTextNode[] {
  let template = dict[key] ?? key
  if (Array.isArray(withArgs)) {
    withArgs.forEach((arg, index) => {
      const replacement = typeof arg === 'string'
        ? arg
        : (isTextComponentObject(arg) ? componentToPlain(arg, dict) : String(arg))
      template = template.split(`%${index + 1}`).join(replacement)
      template = template.split(`{${index}}`).join(replacement)
    })
  }
  return parseRichText(template, dict).map((node) => (
    node.type === 'text'
      ? { ...node, style: { ...style, ...node.style } }
      : node
  ))
}

function componentToPlain(comp: McComponent, dict: Record<string, string>): string {
  return richNodesToPlain(parseComponent(comp, dict, {}))
}

function parseComponent(
  comp: McComponent,
  dict: Record<string, string>,
  inheritedStyle: McTextStyle,
): RichTextNode[] {
  const style = applyComponentStyle(inheritedStyle, comp)
  const parts: RichTextNode[] = []

  if (typeof comp.text === 'string') {
    parts.push({ type: 'text', text: comp.text, style })
  }

  if (typeof comp.translate === 'string') {
    parts.push(...parseTranslate(comp.translate, comp.with, dict, style))
  }

  if (typeof comp.keybind === 'string') {
    parts.push({ type: 'text', text: comp.keybind, style })
  }

  if (typeof comp.selector === 'string') {
    parts.push({ type: 'text', text: comp.selector, style })
  }

  if (comp.score != null && typeof comp.score === 'object') {
    const score = comp.score as McComponent
    const name = typeof score.name === 'string' ? score.name : '?'
    parts.push({ type: 'text', text: name, style })
  }

  if (Array.isArray(comp.extra)) {
    for (const entry of comp.extra) {
      if (typeof entry === 'string') {
        parts.push({ type: 'text', text: entry, style })
      } else if (isTextComponentObject(entry)) {
        parts.push(...parseComponent(entry, dict, style))
      }
    }
  }

  const merged = mergeTextNodes(parts)
  return wrapClickEvent(merged, comp.clickEvent)
}

function parseRoot(value: unknown, dict: Record<string, string>): RichTextNode[] {
  if (Array.isArray(value)) {
    const nodes: RichTextNode[] = []
    for (const entry of value) {
      if (typeof entry === 'string') {
        nodes.push({ type: 'text', text: entry, style: {} })
      } else if (isTextComponentObject(entry)) {
        nodes.push(...parseComponent(entry, dict, {}))
      }
    }
    return nodes
  }
  return parseComponent(value as McComponent, dict, {})
}

/**
 * Parse a description line that is a Minecraft JSON text component (or array of components).
 * Returns {@code null} when the line is not valid JSON text component syntax.
 */
export function tryParseMinecraftTextComponentLine(
  line: string,
  dict: Record<string, string>,
): RichTextNode[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }

  if (!isTextComponentRoot(parsed)) {
    return null
  }

  return parseRoot(parsed, dict)
}

export function richNodesToPlain(nodes: RichTextNode[]): string {
  return nodes.map((node) => {
    switch (node.type) {
      case 'text': return node.text
      case 'error': return node.message
      case 'link': return richNodesToPlain(node.children)
      case 'questLink': return richNodesToPlain(node.children)
      case 'fragment': return richNodesToPlain(node.children)
      default: return ''
    }
  }).join('')
}
