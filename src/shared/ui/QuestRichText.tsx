import type { CSSProperties, ReactNode } from 'react'
import { questExportTextureCandidates } from '@/shared/lib/quest-export-asset'
import type { McTextStyle, RichTextNode } from '@/shared/lib/quest-rich-text-parser'

function styleToCss(style: McTextStyle): CSSProperties {
  const css: CSSProperties = {}
  if (style.color) css.color = style.color
  if (style.bold) css.fontWeight = 700
  if (style.italic) css.fontStyle = 'italic'
  if (style.underline) css.textDecoration = 'underline'
  if (style.strikethrough) {
    css.textDecoration = style.underline ? 'underline line-through' : 'line-through'
  }
  if (style.obfuscated) css.filter = 'blur(2px)'
  return css
}

function renderNode(node: RichTextNode, key: string | number): ReactNode {
  switch (node.type) {
    case 'text':
      if (!node.text) return null
      return (
        <span key={key} className="quest-rich-text__span" style={styleToCss(node.style)}>
          {node.text}
        </span>
      )
    case 'error':
      return (
        <span key={key} className="quest-rich-text__error">
          {node.message}
        </span>
      )
    case 'link':
      return (
        <a
          key={key}
          className="quest-rich-text__link"
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {node.children.map((child, index) => renderNode(child, `${key}-${index}`))}
        </a>
      )
    case 'fragment':
      return node.children.map((child, index) => renderNode(child, `${key}-${index}`))
    default:
      return null
  }
}

export interface QuestRichTextProps {
  nodes: RichTextNode[]
  className?: string
  as?: 'span' | 'p' | 'div' | 'h3'
}

export function QuestRichText({
  nodes,
  className = '',
  as: Tag = 'span',
}: QuestRichTextProps) {
  if (nodes.length === 0) return null
  const classes = ['quest-rich-text', className].filter(Boolean).join(' ')
  return (
    <Tag className={classes}>
      {nodes.map((node, index) => renderNode(node, index))}
    </Tag>
  )
}

export interface QuestDescriptionImageProps {
  imageRef: string
  width: number
  height: number
  align: 'left' | 'center' | 'right'
  fit: boolean
  src?: string | null
}

export function QuestDescriptionImage({
  imageRef,
  width,
  height,
  align,
  fit,
  src,
}: QuestDescriptionImageProps) {
  const url = src ?? questExportTextureCandidates(imageRef)[0] ?? null
  const alignClass = `quest-rich-text__figure--${align}`

  if (!url) {
    return (
      <figure
        className={`quest-rich-text__figure quest-rich-text__figure--missing ${alignClass}`}
        style={fit ? { width: '100%' } : { width, height }}
      >
        <figcaption className="quest-rich-text__missing">{imageRef}</figcaption>
      </figure>
    )
  }

  return (
    <figure
      className={`quest-rich-text__figure ${alignClass}${fit ? ' quest-rich-text__figure--fit' : ''}`}
      style={fit ? undefined : { width, height }}
    >
      <img
        className="quest-rich-text__image"
        src={url}
        alt=""
        decoding="async"
        draggable={false}
        style={fit ? undefined : { width, height }}
      />
    </figure>
  )
}
