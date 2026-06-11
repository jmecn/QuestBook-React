import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQuestRichTextNavigation } from '@/app/context/QuestRichTextNavigationContext'
import { questExportTextureCandidates } from '@/shared/lib/quest-export-asset'
import type { McTextStyle, RichTextNode } from '@/shared/lib/quest-rich-text-parser'

function mcStyleClasses(style: McTextStyle): string {
  const classes: string[] = []
  if (style.mcColor) classes.push(`quest-rich-text__mc-${style.mcColor}`)
  if (style.bold) classes.push('quest-rich-text__bold')
  if (style.italic) classes.push('quest-rich-text__italic')
  if (style.underline) classes.push('quest-rich-text__underline')
  if (style.strikethrough) classes.push('quest-rich-text__strike')
  if (style.obfuscated) classes.push('quest-rich-text__obf')
  return classes.join(' ')
}

function styleToCss(style: McTextStyle): CSSProperties {
  const css: CSSProperties = {}
  if (style.hexColor) css.color = style.hexColor
  if (style.obfuscated) css.filter = 'blur(2px)'
  return css
}

function QuestLinkNode({
  questId,
  children,
}: {
  questId: string
  children: ReactNode
}) {
  const { navigateToQuest } = useQuestRichTextNavigation()

  return (
    <button
      type="button"
      className="quest-rich-text__link quest-rich-text__quest-link"
      onClick={() => navigateToQuest(questId)}
      title={questId}
    >
      {children}
    </button>
  )
}

function renderNode(node: RichTextNode, key: string | number): ReactNode {
  switch (node.type) {
    case 'text':
      if (!node.text) return null
      return (
        <span
          key={key}
          className={['quest-rich-text__span', mcStyleClasses(node.style)].filter(Boolean).join(' ')}
          style={styleToCss(node.style)}
        >
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
    case 'questLink':
      return (
        <QuestLinkNode key={key} questId={node.questId}>
          {node.children.map((child, index) => renderNode(child, `${key}-${index}`))}
        </QuestLinkNode>
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

const QUEST_DESCRIPTION_IMAGE_SCALE = 2

export function QuestDescriptionImage({
  imageRef,
  width,
  height,
  align,
  fit,
  src,
}: QuestDescriptionImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const url = src ?? questExportTextureCandidates(imageRef)[0] ?? null
  const scaledWidth = width * QUEST_DESCRIPTION_IMAGE_SCALE
  const scaledHeight = height * QUEST_DESCRIPTION_IMAGE_SCALE
  const displayWidth = fit ? undefined : scaledWidth
  const displayHeight = fit ? undefined : scaledHeight
  const fitFigureStyle: CSSProperties | undefined = fit
    ? { width: `min(100%, ${scaledWidth}px)` }
    : undefined

  useEffect(() => {
    if (!lightboxOpen) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen])

  useEffect(() => {
    if (!lightboxOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [lightboxOpen])

  if (!url) {
    return (
      <figure
        className={`quest-rich-text__figure quest-rich-text__figure--missing quest-rich-text__figure--${align}`}
        style={fit ? { width: '100%' } : { width: displayWidth, height: displayHeight }}
      >
        <figcaption className="quest-rich-text__missing">{imageRef}</figcaption>
      </figure>
    )
  }

  const figureClass = [
    'quest-rich-text__figure',
    `quest-rich-text__figure--${align}`,
    fit ? 'quest-rich-text__figure--fit' : '',
  ].filter(Boolean).join(' ')

  const imageSizeStyle: CSSProperties | undefined = fit
    ? undefined
    : { width: displayWidth, height: displayHeight }

  return (
    <>
      <figure
        className={figureClass}
        style={fit ? fitFigureStyle : { width: displayWidth, height: displayHeight }}
      >
        <button
          type="button"
          className="quest-rich-text__image-button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Enlarge image"
        >
          <img
            className="quest-rich-text__image"
            src={url}
            alt=""
            decoding="async"
            draggable={false}
            style={imageSizeStyle}
          />
        </button>
      </figure>
      {lightboxOpen && createPortal(
        <div
          className="quest-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged quest image"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="quest-image-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <img
            className="quest-image-lightbox__img"
            src={url}
            alt=""
            decoding="async"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
