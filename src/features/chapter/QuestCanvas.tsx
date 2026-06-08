import '@xyflow/react/dist/style.css'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodeId,
  useNodesInitialized,
  useNodesState,
  useOnViewportChange,
  useReactFlow,
  useUpdateNodeInternals,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { QuestDependencyEdge } from '@/features/chapter/QuestDependencyEdge'
import { questExportTextureCandidates } from '@/shared/lib/quest-export-asset'
import { sidebarMapWidthDelta } from '@/shared/lib/viewport-inset'
import { questIconPx } from '@/shared/lib/quest-node-size'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import type { ChapterData, ChapterImage, QuestNode as QuestData } from '@/shared/types/quest'
import { gridStepPx, gridToPx, resolveQuestText } from '@/shared/lib/quest-text'
import '@/styles/quest-canvas.css'

const QUEST_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: 'questDependency',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
  },
  className: 'quest-flow-edge',
}

/** React Flow zoom treated as 100% in the quest map UI. */
const QUEST_ZOOM_BASE = 2

const FOCUS_ANIMATION_MS = 450

const ZOOM_PRESET_PERCENTS = [50, 75, 100, 125, 150, 175, 200] as const

type ZoomPresetPercent = (typeof ZOOM_PRESET_PERCENTS)[number]

function zoomToDisplayPercent(zoom: number): number {
  return Math.round((zoom / QUEST_ZOOM_BASE) * 100)
}

function displayPercentToZoom(percent: number): number {
  return (percent / 100) * QUEST_ZOOM_BASE
}

function nearestPresetPercent(percent: number): ZoomPresetPercent {
  let best: ZoomPresetPercent = ZOOM_PRESET_PERCENTS[0]
  let bestDelta = Math.abs(percent - best)
  for (const preset of ZOOM_PRESET_PERCENTS) {
    const delta = Math.abs(percent - preset)
    if (delta < bestDelta) {
      best = preset
      bestDelta = delta
    }
  }
  return best
}

export interface QuestNodeData extends Record<string, unknown> {
  label: string
  quest: QuestData
  locale: string
  gridScale: number
}

function isQuestNodeData(data: Record<string, unknown>): data is QuestNodeData {
  return typeof data.quest === 'object' && data.quest != null && 'id' in data.quest
}

function QuestNodeComponent({ data, selected }: NodeProps<Node<QuestNodeData>>) {
  const nodeId = useNodeId()
  const updateNodeInternals = useUpdateNodeInternals()
  const iconSize = questIconPx(data.quest.size, data.gridScale)

  useEffect(() => {
    if (nodeId) {
      updateNodeInternals(nodeId)
    }
  }, [iconSize, nodeId, updateNodeInternals])

  return (
    <div className="quest-flow-node" title={data.label}>
      <QuestIcon
        icon={data.quest.icon}
        size={iconSize}
        shape={data.quest.shape}
        selected={selected}
        locale={data.locale}
      />
    </div>
  )
}

export interface ChapterImageNodeData extends Record<string, unknown> {
  image: ChapterImage
  gridScale: number
}

function ChapterImageNode({ data }: NodeProps<Node<ChapterImageNodeData>>) {
  const { image, gridScale } = data
  const candidates = useMemo(() => questExportTextureCandidates(image.image), [image.image])
  const [index, setIndex] = useState(0)
  const width = gridToPx(image.width, gridScale)
  const height = gridToPx(image.height, gridScale)
  const src = candidates[index]

  if (!src) return null

  return (
    <img
      className="quest-chapter-image"
      src={src}
      alt=""
      draggable={false}
      style={{
        width,
        height,
        transform: `rotate(${image.rotation ?? 0}deg)`,
      }}
      onError={() => {
        if (index + 1 < candidates.length) {
          setIndex((value) => value + 1)
        }
      }}
    />
  )
}

const nodeTypes = { quest: QuestNodeComponent, chapterImage: ChapterImageNode }
const edgeTypes = { questDependency: QuestDependencyEdge }

function FitViewOnChapterChange({ depKey }: { depKey: string }) {
  const { fitView, getZoom, getViewport, setViewport } = useReactFlow()
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void fitView({ padding: 0.25, maxZoom: QUEST_ZOOM_BASE, minZoom: 0.5, duration: 0 }).then(() => {
        if (getZoom() < QUEST_ZOOM_BASE) {
          setViewport({ ...getViewport(), zoom: QUEST_ZOOM_BASE })
        }
      })
    })
    return () => cancelAnimationFrame(id)
  }, [depKey, fitView, getZoom, getViewport, setViewport])
  return null
}

function FocusSelectedQuest({
  focusNodeId,
  focusTarget,
  drawerInset,
  layoutEpoch,
}: {
  focusNodeId: string | null
  focusTarget: { x: number; y: number } | null
  drawerInset: number
  layoutEpoch: number
}) {
  const nodesInitialized = useNodesInitialized()
  const { setCenter, getZoom } = useReactFlow()

  useEffect(() => {
    if (!focusNodeId || !focusTarget || !nodesInitialized) return

    let cancelled = false
    const run = () => {
      if (cancelled) return
      const zoom = getZoom() || QUEST_ZOOM_BASE
      const centerX = focusTarget.x + drawerInset / (2 * zoom)
      void setCenter(centerX, focusTarget.y, {
        zoom,
        duration: FOCUS_ANIMATION_MS,
      })
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [drawerInset, focusNodeId, focusTarget, getZoom, layoutEpoch, nodesInitialized, setCenter])

  return null
}

function AdjustViewportOnDrawerClose({ drawerInset }: { drawerInset: number }) {
  const { getViewport, setViewport } = useReactFlow()
  const prevInsetRef = useRef(drawerInset)

  useEffect(() => {
    const prevInset = prevInsetRef.current
    prevInsetRef.current = drawerInset

    if (prevInset > 0 && drawerInset === 0) {
      const viewport = getViewport()
      void setViewport(
        { ...viewport, x: viewport.x + prevInset / 2 },
        { duration: FOCUS_ANIMATION_MS },
      )
    }
  }, [drawerInset, getViewport, setViewport])

  return null
}

function AdjustViewportOnSidebarChange({
  layoutEpoch,
  sidebarCollapsed,
  hasSelectedQuest,
}: {
  layoutEpoch: number
  sidebarCollapsed: boolean
  hasSelectedQuest: boolean
}) {
  const { getViewport, setViewport } = useReactFlow()
  const prevCollapsedRef = useRef(sidebarCollapsed)
  const seenLayoutEpochRef = useRef(false)

  useEffect(() => {
    if (!seenLayoutEpochRef.current) {
      seenLayoutEpochRef.current = true
      prevCollapsedRef.current = sidebarCollapsed
      return
    }

    const wasCollapsed = prevCollapsedRef.current
    prevCollapsedRef.current = sidebarCollapsed
    if (wasCollapsed === sidebarCollapsed) return
    if (hasSelectedQuest) return

    const mapDelta = sidebarMapWidthDelta(window.innerWidth, wasCollapsed, sidebarCollapsed)
    if (mapDelta === 0) return

    const viewport = getViewport()
    void setViewport(
      { ...viewport, x: viewport.x + mapDelta / 2 },
      { duration: FOCUS_ANIMATION_MS },
    )
  }, [hasSelectedQuest, layoutEpoch, sidebarCollapsed, getViewport, setViewport])

  return null
}

function ZoomControls() {
  const { getZoom, getViewport, setViewport } = useReactFlow()
  const [displayPercent, setDisplayPercent] = useState<ZoomPresetPercent>(() =>
    nearestPresetPercent(zoomToDisplayPercent(getZoom())),
  )

  useOnViewportChange({
    onChange: ({ zoom: nextZoom }) => {
      setDisplayPercent(nearestPresetPercent(zoomToDisplayPercent(nextZoom)))
    },
  })

  const applyPreset = useCallback(
    (percent: ZoomPresetPercent) => {
      setDisplayPercent(percent)
      const viewport = getViewport()
      setViewport({ ...viewport, zoom: displayPercentToZoom(percent) })
    },
    [getViewport, setViewport],
  )

  const stepPreset = useCallback(
    (direction: -1 | 1) => {
      const idx = ZOOM_PRESET_PERCENTS.indexOf(displayPercent)
      const currentIdx = idx >= 0 ? idx : ZOOM_PRESET_PERCENTS.indexOf(nearestPresetPercent(displayPercent))
      const nextIdx = Math.min(
        ZOOM_PRESET_PERCENTS.length - 1,
        Math.max(0, currentIdx + direction),
      )
      applyPreset(ZOOM_PRESET_PERCENTS[nextIdx])
    },
    [applyPreset, displayPercent],
  )

  return (
    <Panel position="bottom-center" className="quest-zoom-controls">
      <button
        type="button"
        className="quest-zoom-controls__btn"
        aria-label="Zoom out"
        disabled={displayPercent <= ZOOM_PRESET_PERCENTS[0]}
        onClick={() => stepPreset(-1)}
      >
        −
      </button>
      <select
        className="quest-zoom-controls__select"
        aria-label="Zoom level"
        value={displayPercent}
        onChange={(event) => applyPreset(Number(event.target.value) as ZoomPresetPercent)}
      >
        {ZOOM_PRESET_PERCENTS.map((percent) => (
          <option key={percent} value={percent}>
            {percent}%
          </option>
        ))}
      </select>
      <button
        type="button"
        className="quest-zoom-controls__btn"
        aria-label="Zoom in"
        disabled={displayPercent >= ZOOM_PRESET_PERCENTS[ZOOM_PRESET_PERCENTS.length - 1]}
        onClick={() => stepPreset(1)}
      >
        +
      </button>
    </Panel>
  )
}

function chapterToFlow(
  chapter: ChapterData,
  dict: Record<string, string>,
  selectedId: string | null,
  locale: string,
  gridScale: number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []

  for (const image of chapter.images ?? []) {
    nodes.push({
      id: `image:${image.image}:${image.x}:${image.y}`,
      type: 'chapterImage',
      position: { x: gridToPx(image.x, gridScale), y: gridToPx(image.y, gridScale) },
      data: { image, gridScale },
      selectable: false,
      draggable: false,
      focusable: false,
      zIndex: -100,
    })
  }

  for (const quest of chapter.quests) {
    const iconSize = questIconPx(quest.size, gridScale)
    nodes.push({
      id: quest.id,
      type: 'quest',
      position: { x: gridToPx(quest.x, gridScale), y: gridToPx(quest.y, gridScale) },
      data: {
        label: resolveQuestText(dict, quest.title) || quest.id,
        quest,
        locale,
        gridScale,
      },
      style: { width: iconSize, height: iconSize },
      selected: quest.id === selectedId,
      zIndex: 1,
    })
  }

  const questIds = new Set(chapter.quests.map((quest) => quest.id))

  const edges: Edge[] = []
  for (const quest of chapter.quests) {
    for (const dep of quest.dependencies ?? []) {
      if (quest.hideDependencyLines) continue
      if (!questIds.has(dep)) continue
      edges.push({
        id: `${dep}->${quest.id}`,
        source: dep,
        target: quest.id,
        type: 'questDependency',
        zIndex: 0,
      })
    }
  }

  for (const link of chapter.questLinks ?? []) {
    const iconSize = questIconPx(1, gridScale)
    nodes.push({
      id: link.id,
      type: 'quest',
      position: { x: gridToPx(link.x, gridScale), y: gridToPx(link.y, gridScale) },
      data: {
        label: '→',
        quest: {
          id: link.linkedQuest,
          x: link.x,
          y: link.y,
          title: link.linkedQuest,
        },
        locale,
        gridScale,
      },
      style: { width: iconSize, height: iconSize },
      selected: link.linkedQuest === selectedId,
      zIndex: 1,
    })
  }

  return { nodes, edges }
}

export interface QuestCanvasProps {
  chapter: ChapterData
  dict: Record<string, string>
  gridScale: number
  selectedId: string | null
  locale: string
  drawerInset?: number
  layoutEpoch?: number
  sidebarCollapsed?: boolean
  onSelectQuest: (id: string) => void
  onClearSelection?: () => void
}

function QuestCanvasInner({
  chapter,
  dict,
  gridScale,
  selectedId,
  locale,
  drawerInset = 0,
  layoutEpoch = 0,
  sidebarCollapsed = false,
  onSelectQuest,
  onClearSelection,
}: QuestCanvasProps) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => chapterToFlow(chapter, dict, selectedId, locale, gridScale),
    [chapter, dict, gridScale, locale, selectedId],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  useEffect(() => {
    setNodes(layoutNodes)
    setEdges(layoutEdges)
  }, [layoutEdges, layoutNodes, setEdges, setNodes])

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== 'quest' || !isQuestNodeData(node.data)) return
      onSelectQuest(node.data.quest.id)
    },
    [onSelectQuest],
  )

  const onPaneClick = useCallback(() => {
    onClearSelection?.()
  }, [onClearSelection])

  const gridStep = gridStepPx(gridScale)
  const backgroundDotGap = Math.max(12, Math.round(gridStep / 3))
  const layoutKey = `${chapter.id}:${gridScale}:${nodes.length}`

  const focusNodeId = useMemo(() => {
    if (!selectedId) return null
    if (chapter.quests.some((quest) => quest.id === selectedId)) {
      return selectedId
    }
    return nodes.find((node) => (
      node.type === 'quest'
      && isQuestNodeData(node.data)
      && node.data.quest.id === selectedId
    ))?.id ?? null
  }, [chapter.quests, nodes, selectedId])

  const focusTarget = useMemo(() => {
    if (!focusNodeId) return null
    const node = nodes.find((entry) => entry.id === focusNodeId)
    if (!node) return null
    return { x: node.position.x, y: node.position.y }
  }, [focusNodeId, nodes])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={QUEST_EDGE_OPTIONS}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeOrigin={[0.5, 0.5]}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      elevateEdgesOnSelect={false}
      defaultViewport={{ x: 0, y: 0, zoom: QUEST_ZOOM_BASE }}
      minZoom={displayPercentToZoom(ZOOM_PRESET_PERCENTS[0])}
      maxZoom={displayPercentToZoom(ZOOM_PRESET_PERCENTS[ZOOM_PRESET_PERCENTS.length - 1])}
      proOptions={{ hideAttribution: true }}
    >
      <AdjustViewportOnDrawerClose drawerInset={drawerInset} />
      <AdjustViewportOnSidebarChange
        layoutEpoch={layoutEpoch}
        sidebarCollapsed={sidebarCollapsed}
        hasSelectedQuest={focusNodeId != null}
      />
      <FitViewOnChapterChange depKey={layoutKey} />
      <FocusSelectedQuest
        focusNodeId={focusNodeId}
        focusTarget={focusTarget}
        drawerInset={drawerInset}
        layoutEpoch={layoutEpoch}
      />
      <ZoomControls />
      <Background gap={backgroundDotGap} size={1.25} color="var(--quest-grid-dot)" />
    </ReactFlow>
  )
}

export const QuestCanvas = memo(function QuestCanvas(props: QuestCanvasProps) {
  const { selectedId } = props

  useEffect(() => {
    if (!selectedId) return
    const hash = `#quest=${encodeURIComponent(selectedId)}`
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash)
    }
  }, [selectedId])

  return (
    <ReactFlowProvider>
      <QuestCanvasInner {...props} />
    </ReactFlowProvider>
  )
})
