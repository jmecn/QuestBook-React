import { useMemo } from 'react'
import {
  parseQuestDescription,
  type QuestDescriptionBlock,
} from '@/shared/lib/quest-rich-text-parser'
import { QuestDescriptionImage, QuestRichText } from '@/shared/ui/QuestRichText'

export interface QuestDescriptionProps {
  dict: Record<string, string>
  description: string | string[] | undefined | null
  className?: string
}

function renderBlock(block: QuestDescriptionBlock, index: number) {
  switch (block.type) {
    case 'break':
      return <div key={`break-${index}`} className="quest-rich-text__break" aria-hidden="true" />
    case 'image':
      return (
        <QuestDescriptionImage
          key={`image-${index}-${block.imageRef}`}
          imageRef={block.imageRef}
          width={block.width}
          height={block.height}
          align={block.align}
          fit={block.fit}
          src={block.src}
        />
      )
    case 'paragraph':
      return (
        <QuestRichText
          key={`p-${index}`}
          as="p"
          className="quest-rich-text__paragraph"
          nodes={block.nodes}
        />
      )
    default:
      return null
  }
}

export function QuestDescription({ dict, description, className = '' }: QuestDescriptionProps) {
  const blocks = useMemo(
    () => parseQuestDescription(dict, description),
    [description, dict],
  )

  if (blocks.length === 0) return null

  const classes = ['quest-detail__description', 'quest-rich-text-root', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  )
}
