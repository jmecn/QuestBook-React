import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'

/** Dependency line between quest nodes; uses coordinates from React Flow's layout engine. */
export function QuestDependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  if (
    sourceX == null ||
    sourceY == null ||
    targetX == null ||
    targetY == null
  ) {
    return null
  }

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: 'var(--quest-edge-stroke, #6a6258)',
        strokeWidth: 2.5,
        ...style,
      }}
    />
  )
}
