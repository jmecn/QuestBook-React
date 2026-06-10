import {
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react'
import {
  circleBorderToward,
  questNodeCenter,
  questNodeRadius,
} from '@/shared/lib/quest-dependency-handles'

/**
 * Straight dependency line from center to center, clipped at circular node bounds.
 * Rendered as a dual-stroke marching-ants animation (PS-style selection marquee).
 */
export function QuestDependencyEdge({
  id,
  source,
  target,
  data,
}: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const highlight = data?.highlight as 'incoming' | 'outgoing' | undefined

  if (!sourceNode?.internals.positionAbsolute || !targetNode?.internals.positionAbsolute) {
    return null
  }

  const sourceCenter = questNodeCenter(sourceNode)
  const targetCenter = questNodeCenter(targetNode)
  const sourcePoint = circleBorderToward(
    sourceCenter,
    targetCenter,
    questNodeRadius(sourceNode),
  )
  const targetPoint = circleBorderToward(
    targetCenter,
    sourceCenter,
    questNodeRadius(targetNode),
  )

  const [edgePath] = getStraightPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
  })

  return (
    <g
      className={[
        'quest-dependency-edge',
        highlight === 'incoming' ? 'quest-dependency-edge--incoming' : '',
        highlight === 'outgoing' ? 'quest-dependency-edge--outgoing' : '',
      ].filter(Boolean).join(' ')}
    >
      <path
        id={id}
        className="quest-dependency-edge__stroke quest-dependency-edge__stroke--alt"
        d={edgePath}
      />
      <path
        className="quest-dependency-edge__stroke quest-dependency-edge__stroke--main"
        d={edgePath}
        aria-hidden="true"
      />
    </g>
  )
}
