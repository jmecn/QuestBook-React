import '@xyflow/react/dist/style.css'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Handle,
  Panel,
  Position,
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
import {
  chapterImageLayout,
  chapterImagePaint,
  chapterImageSpriteVars,
  chapterImageTransformOrigin,
  sortedChapterImages,
} from '@/shared/lib/chapter-image-style'
import {
  questExportAssetUrl,
  questExportTextureCandidates,
} from '@/shared/lib/quest-export-asset'
import { sidebarMapWidthDelta } from '@/shared/lib/viewport-inset'
import {
  getSavedQuestCanvasZoom,
  QUEST_ZOOM_BASE,
  rememberQuestCanvasZoom,
} from '@/shared/lib/quest-canvas-viewport'
import { DEFAULT_QUEST_NODE_SIZE, questIconPx } from '@/shared/lib/quest-node-size'
import type { QuestCatalogEntry } from '@/shared/lib/quest-catalog'
import { resolveQuestIcon, useQuestDisplayTitle } from '@/shared/lib/quest-display'
import { isQuestLinkVisibleOnMap, isQuestVisibleOnMap } from '@/shared/lib/quest-visibility'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import type { ChapterData, ChapterImage, QuestNode as QuestData } from '@/shared/types/quest'
import { gridStepPx, gridToPx } from '@/shared/lib/quest-text'
import '@/styles/quest-canvas.css'

/** Minimal handles so React Flow can mount edges; geometry uses node centers. */
const QUEST_EDGE_HANDLE_ID = 'edge'

const QUEST_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: 'questDependency',
  className: 'quest-flow-edge',
}

const FOCUS_ANIMATION_MS = 450

const ZOOM_PRESET_PERCENTS = [25, 50, 75, 100, 125, 150, 175, 200] as const

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
  quest: QuestData
  dict: Record<string, string>
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
  const label = useQuestDisplayTitle(data.quest, data.dict, data.locale)
  const icon = resolveQuestIcon(data.quest)

  useEffect(() => {
    if (nodeId) {
      updateNodeInternals(nodeId)
    }
  }, [iconSize, nodeId, updateNodeInternals])

  return (
    <div className="quest-flow-node" data-label={label || undefined}>
      <Handle
        type="source"
        id={QUEST_EDGE_HANDLE_ID}
        position={Position.Top}
        className="quest-flow-handle"
      />
      <Handle
        type="target"
        id={QUEST_EDGE_HANDLE_ID}
        position={Position.Top}
        className="quest-flow-handle"
      />
      <QuestIcon
        icon={icon}
        iconItems={data.quest.iconItems}
        size={iconSize}
        shape={data.quest.shape}
        selected={selected}
        tooltip=""
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
  const bakedSrc = image.baked ? questExportAssetUrl(image.baked) : undefined
  const candidates = useMemo(
    () => (bakedSrc ? [bakedSrc] : questExportTextureCandidates(image.image)),
    [bakedSrc, image.image],
  )
  const [index, setIndex] = useState(0)
  const { widthPx, heightPx } = useMemo(
    () => chapterImageLayout(image, gridScale),
    [gridScale, image],
  )
  const src = candidates[index]
  const paint = bakedSrc ? undefined : chapterImagePaint(image)
  const spriteVars = chapterImageSpriteVars(image)
  const animated = spriteVars != null
  const mediaStyle = paint?.mediaOpacity != null ? { opacity: paint.mediaOpacity } : undefined

  useEffect(() => {
    setIndex(0)
  }, [image.image, image.baked])

  if (!src) return null

  const rotation = image.rotation ?? 0
  const transformOrigin = chapterImageTransformOrigin(image.alignToCorner)

  return (
    <div
      className="quest-chapter-image-wrap"
      style={{
        width: widthPx,
        height: heightPx,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin,
      }}
    >
      {animated ? (
        <div
          className="quest-chapter-image__sprite"
          style={{ ...spriteVars, backgroundImage: `url("${src}")`, ...mediaStyle }}
          role="img"
          aria-hidden="true"
        />
      ) : (
        <img
          className="quest-chapter-image quest-chapter-image--fill"
          src={src}
          alt=""
          draggable={false}
          style={mediaStyle}
          onError={() => {
            if (index + 1 < candidates.length) {
              setIndex((value) => value + 1)
            }
          }}
        />
      )}
      {paint?.tintRgb ? (
        <div
          className="quest-chapter-image__tint"
          style={{
            backgroundColor: paint.tintRgb,
            opacity: paint.tintOpacity ?? 1,
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}

const nodeTypes = { quest: QuestNodeComponent, chapterImage: ChapterImageNode }
const edgeTypes = { questDependency: QuestDependencyEdge }

function CenterChapterAtSavedZoom({ depKey }: { depKey: string }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const zoom = getSavedQuestCanvasZoom()
    const id = requestAnimationFrame(() => {
      void fitView({
        padding: 0.25,
        minZoom: zoom,
        maxZoom: zoom,
        duration: 0,
      })
    })
    return () => cancelAnimationFrame(id)
  }, [depKey, fitView])
  return null
}

function FocusSelectedQuest({
  focusNodeId,
  focusTarget,
  drawerInset,
  layoutEpoch,
  chapterKey,
}: {
  focusNodeId: string | null
  focusTarget: { x: number; y: number } | null
  drawerInset: number
  layoutEpoch: number
  chapterKey: string
}) {
  const nodesInitialized = useNodesInitialized()
  const { setCenter, getZoom } = useReactFlow()
  const prevFocusRef = useRef<{ chapterKey: string; focusNodeId: string | null }>({
    chapterKey: '',
    focusNodeId: null,
  })

  useEffect(() => {
    if (!focusNodeId || !focusTarget || !nodesInitialized) return

    const prev = prevFocusRef.current
    const chapterChanged = prev.chapterKey !== chapterKey
    const focusChanged = prev.focusNodeId !== focusNodeId
    prevFocusRef.current = { chapterKey, focusNodeId }

    const duration =
      !chapterChanged && focusChanged ? FOCUS_ANIMATION_MS : 0

    let cancelled = false
    const run = () => {
      if (cancelled) return
      const zoom = getZoom() || QUEST_ZOOM_BASE
      const centerX = focusTarget.x + drawerInset / (2 * zoom)
      void setCenter(centerX, focusTarget.y, {
        zoom,
        duration,
      })
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [
    chapterKey,
    drawerInset,
    focusNodeId,
    focusTarget,
    getZoom,
    layoutEpoch,
    nodesInitialized,
    setCenter,
  ])

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
      rememberQuestCanvasZoom(nextZoom)
      setDisplayPercent(nearestPresetPercent(zoomToDisplayPercent(nextZoom)))
    },
  })

  const applyPreset = useCallback(
    (percent: ZoomPresetPercent) => {
      setDisplayPercent(percent)
      const zoom = displayPercentToZoom(percent)
      rememberQuestCanvasZoom(zoom)
      const viewport = getViewport()
      setViewport({ ...viewport, zoom })
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
  catalog: Map<string, QuestCatalogEntry>,
  dict: Record<string, string>,
  selectedId: string | null,
  locale: string,
  gridScale: number,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const visibleQuestIds = new Set(
    chapter.quests.filter(isQuestVisibleOnMap).map((quest) => quest.id),
  )

  for (const image of sortedChapterImages(chapter.images)) {
    const layout = chapterImageLayout(image, gridScale)
    nodes.push({
      id: `image:${image.image}:${image.x}:${image.y}:${image.order ?? 0}`,
      type: 'chapterImage',
      position: { x: layout.x, y: layout.y },
      data: { image, gridScale },
      selectable: false,
      draggable: false,
      focusable: false,
      style: {
        pointerEvents: 'none',
        width: layout.widthPx,
        height: layout.heightPx,
      },
      zIndex: -100 + (image.order ?? 0),
    })
  }

  for (const quest of chapter.quests) {
    if (!visibleQuestIds.has(quest.id)) continue
    const iconSize = questIconPx(quest.size, gridScale)
    nodes.push({
      id: quest.id,
      type: 'quest',
      position: { x: gridToPx(quest.x, gridScale), y: gridToPx(quest.y, gridScale) },
      data: {
        quest,
        dict,
        locale,
        gridScale,
      },
      width: iconSize,
      height: iconSize,
      style: { width: iconSize, height: iconSize },
      selected: quest.id === selectedId,
      zIndex: 1,
    })
  }

  const edges: Edge[] = []
  for (const quest of chapter.quests) {
    if (!visibleQuestIds.has(quest.id)) continue
    for (const dep of quest.dependencies ?? []) {
      if (quest.hideDependencyLines) continue
      if (!visibleQuestIds.has(dep)) continue
      edges.push({
        id: `${dep}->${quest.id}`,
        source: dep,
        target: quest.id,
        sourceHandle: QUEST_EDGE_HANDLE_ID,
        targetHandle: QUEST_EDGE_HANDLE_ID,
        type: 'questDependency',
        zIndex: 0,
      })
    }
  }

  const nodeIds = new Set(nodes.map((node) => node.id))

  for (const link of chapter.questLinks ?? []) {
    const linkedEntry = catalog.get(link.linkedQuest)
    if (!linkedEntry || !isQuestLinkVisibleOnMap(linkedEntry.quest)) continue
    // Dependency edges use linked quest ids; node id must match (not link:${link.id}).
    if (nodeIds.has(link.linkedQuest)) continue

    const linkedQuest = linkedEntry.quest
    // Link placement uses link width (default 1); do not inherit the source chapter quest size.
    const linkSize = link.size ?? DEFAULT_QUEST_NODE_SIZE
    const iconSize = questIconPx(linkSize, gridScale)
    nodes.push({
      id: link.linkedQuest,
      type: 'quest',
      position: { x: gridToPx(link.x, gridScale), y: gridToPx(link.y, gridScale) },
      data: {
        quest: {
          ...linkedQuest,
          x: link.x,
          y: link.y,
          size: linkSize,
          shape: link.shape ?? linkedQuest.shape,
        },
        dict,
        locale,
        gridScale,
      },
      width: iconSize,
      height: iconSize,
      style: { width: iconSize, height: iconSize },
      selected: link.linkedQuest === selectedId,
      zIndex: 1,
    })
    nodeIds.add(link.linkedQuest)
  }

  return { nodes, edges }
}

export interface QuestCanvasProps {
  chapter: ChapterData
  catalog: Map<string, QuestCatalogEntry>
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
  catalog,
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
    () => chapterToFlow(chapter, catalog, dict, selectedId, locale, gridScale),
    [catalog, chapter, dict, gridScale, locale, selectedId],
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
      defaultViewport={{ x: 0, y: 0, zoom: getSavedQuestCanvasZoom() }}
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
      {focusNodeId == null ? (
        <CenterChapterAtSavedZoom depKey={layoutKey} />
      ) : null}
      <FocusSelectedQuest
        focusNodeId={focusNodeId}
        focusTarget={focusTarget}
        drawerInset={drawerInset}
        layoutEpoch={layoutEpoch}
        chapterKey={chapter.id}
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
