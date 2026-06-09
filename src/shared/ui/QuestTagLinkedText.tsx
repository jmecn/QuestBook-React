import { useEffect, useState, type ReactNode } from 'react'
import { extractHashTagIds } from '@/shared/lib/quest-task-items'
import { recipeBookSiteBase, recipeBookTagUrl } from '@/shared/lib/recipe-book-links'

const HASH_TAG_SPLIT = /(#[a-z0-9_.\-/]+:[a-z0-9_.\-/]+)/gi

export interface QuestTagLinkedTextProps {
  text: string
  locale: string
  /** Tags from {@code filterRaw} when not already present as {@code #id} in {@code text}. */
  extraTagIds?: string[]
}

/** Inline task label with {@code #tag} links to the recipe book tag page when configured. */
export function QuestTagLinkedText({
  text,
  locale,
  extraTagIds = [],
}: QuestTagLinkedTextProps) {
  const [recipeBase, setRecipeBase] = useState('')

  useEffect(() => {
    let cancelled = false
    void recipeBookSiteBase().then((base) => {
      if (!cancelled) setRecipeBase(base)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!recipeBase) {
    return <>{text}</>
  }

  const linkedInText = extractHashTagIds(text)
  const nodes: ReactNode[] = []
  let key = 0
  let lastIndex = 0

  for (const match of text.matchAll(HASH_TAG_SPLIT)) {
    const token = match[0]
    const index = match.index ?? 0
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index))
    }
    const tagId = token.startsWith('#') ? token.slice(1) : token
    nodes.push(
      <a
        key={`tag-${key++}`}
        className="quest-detail__tag-link"
        href={recipeBookTagUrl(locale, tagId, recipeBase)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {token}
      </a>,
    )
    lastIndex = index + token.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  for (const tagId of extraTagIds) {
    if (linkedInText.includes(tagId)) continue
    if (nodes.length > 0) {
      nodes.push(' ')
    }
    nodes.push(
      <a
        key={`tag-extra-${key++}`}
        className="quest-detail__tag-link"
        href={recipeBookTagUrl(locale, tagId, recipeBase)}
        target="_blank"
        rel="noopener noreferrer"
      >
        #{tagId}
      </a>,
    )
  }

  if (nodes.length === 0) {
    return <>{text}</>
  }

  return <>{nodes}</>
}
