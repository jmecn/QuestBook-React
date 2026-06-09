/**
 * FTB Quests rich text — ports {@code TextComponentParser} + {@code ClientTextComponentUtils}.
 * Supports {@code &}/{@code §} color codes, {@code {lang.key}}, {@code {image:...}}, {@code {@pagebreak}}.
 */

export interface McTextStyle {
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  obfuscated?: boolean
}

export type RichTextNode =
  | { type: 'text'; text: string; style: McTextStyle }
  | { type: 'error'; message: string }
  | { type: 'link'; href: string; children: RichTextNode[] }
  | { type: 'fragment'; children: RichTextNode[] }

export type QuestDescriptionBlock =
  | { type: 'paragraph'; nodes: RichTextNode[] }
  | { type: 'image'; src: string | null; imageRef: string; width: number; height: number; align: 'left' | 'center' | 'right'; fit: boolean }
  | { type: 'break' }

export class QuestRichTextFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuestRichTextFormatError'
  }
}

const MC_COLORS: Record<string, string> = {
  '0': '#000000',
  '1': '#0000AA',
  '2': '#00AA00',
  '3': '#00AAAA',
  '4': '#AA0000',
  '5': '#AA00AA',
  '6': '#FFAA00',
  '7': '#AAAAAA',
  '8': '#555555',
  '9': '#5555FF',
  a: '#55FF55',
  b: '#55FFFF',
  c: '#FF5555',
  d: '#FF55FF',
  e: '#FFFF55',
  f: '#FFFFFF',
}

const EMPTY_STYLE: McTextStyle = {}

export function splitProperties(input: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const token of input.split(' ')) {
    if (!token) continue
    const colon = token.indexOf(':')
    if (colon === -1) {
      map[token] = ''
    } else {
      const key = token.slice(0, colon)
      const value = token.slice(colon + 1).replace(/%20/g, ' ')
      map[key] = value
    }
  }
  return map
}

function cloneStyle(style: McTextStyle): McTextStyle {
  return { ...style }
}

function applyFormattingCode(style: McTextStyle, code: string): McTextStyle {
  if (code === 'r') return {}
  const color = MC_COLORS[code]
  if (color) return { ...style, color }
  switch (code) {
    case 'k': return { ...style, obfuscated: true }
    case 'l': return { ...style, bold: true }
    case 'm': return { ...style, strikethrough: true }
    case 'n': return { ...style, underline: true }
    case 'o': return { ...style, italic: true }
    default:
      throw new QuestRichTextFormatError(`Invalid formatting! Unknown formatting symbol after &: '${code}'!`)
  }
}

function parseImageFromMap(map: Record<string, string>): QuestDescriptionBlock {
  const widthRaw = map.width ?? '100'
  const heightRaw = map.height ?? '100'
  const width = Number.parseInt(widthRaw, 10)
  const height = Number.parseInt(heightRaw, 10)
  if (Number.isNaN(width) || Number.isNaN(height)) {
    throw new QuestRichTextFormatError(`Invalid image dimensions: width=${widthRaw} height=${heightRaw}`)
  }
  const alignName = (map.align ?? 'center').toLowerCase()
  const align = alignName === 'left' || alignName === 'right' ? alignName : 'center'
  return {
    type: 'image',
    src: null,
    imageRef: map.image,
    width,
    height,
    align,
    fit: map.fit === 'true',
  }
}

function resolveSubstitute(
  key: string,
  dict: Record<string, string>,
): RichTextNode[] {
  if (key === '@pagebreak') {
    return [{ type: 'error', message: '{@pagebreak} must be on its own line' }]
  }

  if (key.includes(':')) {
    const map = splitProperties(key)
    if (map.image) {
      throw new QuestRichTextFormatError('Inline {image:...} must be on its own line')
    }
    if (map.open_url && map.text) {
      return [{
        type: 'link',
        href: map.open_url,
        children: parseRichText(map.text, dict),
      }]
    }
  }

  const lang = dict[key]
  if (lang != null) {
    return parseRichText(lang, dict)
  }

  throw new QuestRichTextFormatError(`Invalid formatting! Unknown substitute: ${key}`)
}

/** Parse inline rich text (color codes + {@code {substitutes}}). */
export function parseRichText(
  text: string,
  dict: Record<string, string>,
): RichTextNode[] {
  if (!text) return []

  try {
    return parseRichTextInner(text.replace(/\\n/g, '\n'), dict)
  } catch (error) {
    if (error instanceof QuestRichTextFormatError) {
      return [{ type: 'error', message: error.message }]
    }
    return [{ type: 'error', message: String(error) }]
  }
}

function parseRichTextInner(text: string, dict: Record<string, string>): RichTextNode[] {
  const chars = [...text]
  const nodes: RichTextNode[] = []
  let style: McTextStyle = cloneStyle(EMPTY_STYLE)
  let builder = ''
  let substituting = false

  const finishPart = () => {
    const chunk = builder
    builder = ''
    if (!chunk) return

    if (chunk.startsWith('{')) {
      const inner = chunk.slice(1)
      if (!inner) {
        throw new QuestRichTextFormatError("Invalid formatting! Unknown substitute: ")
      }
      const resolved = resolveSubstitute(inner, dict)
      for (const node of resolved) {
        if (node.type === 'text') {
          nodes.push({ ...node, style: { ...style, ...node.style } })
        } else {
          nodes.push(node)
        }
      }
      return
    }

    nodes.push({ type: 'text', text: chunk, style: cloneStyle(style) })
  }

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    const escaped = i > 0 && chars[i - 1] === '\\'
    const atEnd = i === chars.length - 1

    if (substituting && (atEnd || ch === '{' || ch === '}')) {
      if (ch === '{') {
        throw new QuestRichTextFormatError("Invalid formatting! Can't nest multiple substitutes!")
      }
      finishPart()
      substituting = false
      continue
    }

    if (!escaped && (ch === '&' || ch === '§')) {
      finishPart()
      if (atEnd) {
        throw new QuestRichTextFormatError("Invalid formatting! Can't end string with &!")
      }
      i++
      const code = chars[i]
      if (code === '#') {
        const hex = `#${chars.slice(i + 1, i + 7).join('')}`
        if (hex.length !== 7 || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
          throw new QuestRichTextFormatError('Invalid formatting! Expected &#RRGGBB hex color!')
        }
        style = { ...style, color: hex }
        i += 6
        continue
      }
      if (code === ' ') {
        throw new QuestRichTextFormatError('Invalid formatting! You must escape whitespace after & with \\&!')
      }
      style = applyFormattingCode(style, code)
      continue
    }

    if (!escaped && ch === '{') {
      finishPart()
      if (atEnd) {
        throw new QuestRichTextFormatError("Invalid formatting! Can't end string with {!")
      }
      substituting = true
      builder = '{'
      continue
    }

    if (ch !== '\\' || escaped) {
      builder += ch
    }
  }

  finishPart()
  return collapseRichText(nodes)
}

function collapseRichText(nodes: RichTextNode[]): RichTextNode[] {
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
  return a.color === b.color
    && !!a.bold === !!b.bold
    && !!a.italic === !!b.italic
    && !!a.underline === !!b.underline
    && !!a.strikethrough === !!b.strikethrough
    && !!a.obfuscated === !!b.obfuscated
}

function isWholeLangReference(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null
  const key = trimmed.slice(1, -1)
  if (!key || key.includes('{') || key.includes('}')) return null
  return key
}

function parseDescriptionLine(
  line: string,
  dict: Record<string, string>,
): QuestDescriptionBlock[] {
  const trimmed = line.trim()

  if (trimmed === '{@pagebreak}') {
    return [{ type: 'break' }]
  }

  if (trimmed.startsWith('{image:') && trimmed.endsWith('}')) {
    const map = splitProperties(trimmed.slice(1, -1))
    if (map.image) {
      return [parseImageFromMap(map)]
    }
  }

  const langKey = isWholeLangReference(line)
  if (langKey && dict[langKey] != null) {
    return parseDescriptionText(dict[langKey], dict)
  }

  const nodes = parseRichText(line, dict)
  if (nodes.length === 0) {
    return []
  }
  return [{ type: 'paragraph', nodes }]
}

/** Parse quest description lines (array or SNBT-style string). */
export function parseQuestDescription(
  dict: Record<string, string>,
  raw: string | string[] | undefined | null,
): QuestDescriptionBlock[] {
  if (!raw) return []

  const lines = normalizeDescriptionLines(raw)
  const blocks: QuestDescriptionBlock[] = []

  for (const line of lines) {
    blocks.push(...parseDescriptionLine(line, dict))
  }

  return blocks
}

function normalizeDescriptionLines(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim()
    if (!inner) return []
    return inner
      .split('", "')
      .map((part) => part.replace(/^"|"$/g, ''))
  }
  return [raw]
}

function parseDescriptionText(text: string, dict: Record<string, string>): QuestDescriptionBlock[] {
  return text.split('\n').flatMap((line) => parseDescriptionLine(line, dict))
}

export function richTextToPlain(nodes: RichTextNode[]): string {
  return nodes.map((node) => {
    switch (node.type) {
      case 'text': return node.text
      case 'error': return node.message
      case 'link': return richTextToPlain(node.children)
      case 'fragment': return richTextToPlain(node.children)
      default: return ''
    }
  }).join('')
}

/** Plain text for tooltips / titles; strips formatting and resolves lang keys. */
export function plainQuestText(
  dict: Record<string, string>,
  raw: string | undefined | null,
): string {
  if (!raw) return ''
  const langKey = isWholeLangReference(raw)
  if (langKey && dict[langKey] != null) {
    return plainQuestText(dict, dict[langKey])
  }
  return richTextToPlain(parseRichText(raw, dict))
}
