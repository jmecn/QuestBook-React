import {
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react'
import {
  questNodeBorderToward,
  questNodeCenter,
} from '@/shared/lib/quest-dependency-handles'

/**
 * Straight dependency line clipped at each quest shape's border (not always a circle).
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
  const sourcePoint = questNodeBorderToward(sourceNode, targetCenter)
  const targetPoint = questNodeBorderToward(targetNode, sourceCenter)

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
