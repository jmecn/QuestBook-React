import '@xyflow/react/dist/style.css'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodeId,
  useNodesInitialized,
  useOnViewportChange,
  useReactFlow,
  useUpdateNodeInternals,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import {
  buildChapterDecorationsNode,
  ChapterDecorationsNode,
} from '@/features/chapter/ChapterDecorationsNode'
import { QuestDependencyEdge } from '@/features/chapter/QuestDependencyEdge'
import {
  QuestCanvasHoverProvider,
  useQuestCanvasHover,
} from '@/features/chapter/QuestCanvasHoverContext'
import {
  chapterImageLayout,
  chapterImagePaint,
  chapterImageTransformOrigin,
  sortedChapterImages,
} from '@/shared/lib/chapter-image-style'
import { useChapterSpriteStyle } from '@/shared/hooks/useChapterSpriteStyle'
import { chapterImageClickHref, isChapterImageClickable } from '@/shared/lib/chapter-image-click'
import {
  questExportAssetUrl,
  questExportTextureCandidates,
} from '@/shared/lib/quest-export-asset'
import { sidebarMapWidthDelta } from '@/shared/lib/viewport-inset'
import {
  flowToGridPoint,
  getDefaultChapterViewCenter,
  gridToFlowPoint,
  resolveAutofocusGridPoint,
} from '@/shared/lib/quest-chapter-bounds'
import {
  getRememberedChapterCenter,
  getSavedQuestCanvasZoom,
  QUEST_LAYOUT_TRANSITION_MS,
  rememberChapterCenter,
  rememberQuestCanvasZoom,
  runProgrammaticViewportMove,
  shouldRememberViewportOnSettle,
  QUEST_ZOOM_BASE,
} from '@/shared/lib/quest-canvas-viewport'
import { DEFAULT_QUEST_NODE_SIZE, questIconPx, resolveQuestLinkIconDisplay } from '@/shared/lib/quest-node-size'
import type { QuestCatalogEntry } from '@/shared/lib/quest-catalog'
import type { ChapterAtlasContext, GlobalAtlasContext } from '@/shared/lib/quest-atlas/types'
import { useQuestDisplayTitle } from '@/shared/lib/quest-display'
import { resolveQuestText } from '@/shared/lib/quest-text'
import { isQuestLinkVisibleOnMap, isQuestVisibleOnMap } from '@/shared/lib/quest-visibility'
import { QuestHoverLabel } from '@/shared/ui/QuestHoverLabel'
import { QuestIcon } from '@/shared/ui/QuestIcon'
import type { ChapterData, ChapterImage, QuestNode as QuestData } from '@/shared/types/quest'
import { gridStepPx, gridToPx } from '@/shared/lib/quest-text'
import '@/styles/quest-canvas.css'

const QUEST_EDGE_HANDLE_ID = 'edge'

const QUEST_EDGE_OPTIONS: DefaultEdgeOptions = {
  type: 'questDependency',
  className: 'quest-flow-edge',
}

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
  globalAtlas: GlobalAtlasContext | null
  chapterAtlas: ChapterAtlasContext | null
}

function questNodeOuterPx(quest: QuestData, gridScale: number): number {
  return quest.iconDisplay?.nodeOuterPx ?? questIconPx(quest.size, gridScale)
}

function isQuestNodeData(data: Record<string, unknown>): data is QuestNodeData {
  return typeof data.quest === 'object' && data.quest != null && 'id' in data.quest
}

function QuestNodeComponent({ data, selected }: NodeProps<Node<QuestNodeData>>) {
  const nodeId = useNodeId()
  const updateNodeInternals = useUpdateNodeInternals()
  const { setHoveredQuestId } = useQuestCanvasHover()
  const iconSize = questNodeOuterPx(data.quest, data.gridScale)
  const label = useQuestDisplayTitle(data.quest, data.dict, data.locale)
  const subtitle = resolveQuestText(data.dict, data.quest.subtitle)
  const tooltipLabel = label || subtitle

  useEffect(() => {
    if (nodeId) {
      updateNodeInternals(nodeId)
    }
  }, [iconSize, nodeId, updateNodeInternals])

  const nodeBody = (
    <>
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
        display={data.quest.iconDisplay}
        icon={data.quest.icon}
        globalAtlas={data.globalAtlas}
        chapterAtlas={data.chapterAtlas}
        size={iconSize}
        shape={data.quest.shape}
        selected={selected}
        tooltip=""
      />
    </>
  )

  return (
    <div
      className="quest-flow-node"
      onMouseEnter={() => setHoveredQuestId(data.quest.id)}
      onMouseLeave={() => setHoveredQuestId(null)}
    >
      {tooltipLabel ? (
        <QuestHoverLabel
          className="quest-flow-node__hover"
          label={label || subtitle}
          subtitle={label && subtitle ? subtitle : undefined}
        >
          {nodeBody}
        </QuestHoverLabel>
      ) : (
        nodeBody
      )}
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
  const spriteStyle = useChapterSpriteStyle(image)
  const animated = spriteStyle != null
  const mediaStyle = paint?.mediaOpacity != null ? { opacity: paint.mediaOpacity } : undefined

  useEffect(() => {
    setIndex(0)
  }, [image.image, image.baked])

  if (!src) return null

  const rotation = image.rotation ?? 0
  const transformOrigin = chapterImageTransformOrigin(image.alignToCorner)
  const clickHref = chapterImageClickHref(image.click)
  const clickable = clickHref != null

  const media = animated ? (
    <div
      className="quest-chapter-image__sprite"
      style={{ ...spriteStyle, backgroundImage: `url("${src}")`, ...mediaStyle }}
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
  )

  const wrapClass = clickable
    ? 'quest-chapter-image-wrap quest-chapter-image-wrap--clickable'
    : 'quest-chapter-image-wrap'

  const wrapStyle = {
    width: widthPx,
    height: heightPx,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin,
  } as const

  return (
    <div className={wrapClass} style={wrapStyle}>
      {clickable ? (
        <a
          className="quest-chapter-image-link"
          href={clickHref}
          target="_blank"
          rel="noopener noreferrer"
          title={clickHref}
          onClick={(event) => event.stopPropagation()}
        >
          {media}
        </a>
      ) : (
        media
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

const nodeTypes = {
  quest: QuestNodeComponent,
  chapterImage: ChapterImageNode,
  chapterDecorations: ChapterDecorationsNode,
}
const edgeTypes = { questDependency: QuestDependencyEdge }

function centerFlowPointInVisibleViewport(
  setCenter: ReturnType<typeof useReactFlow>['setCenter'],
  flowPoint: { x: number; y: number },
  drawerInset: number,
  zoom: number,
  duration: number,
): Promise<boolean> {
  const centerX = flowPoint.x + drawerInset / (2 * zoom)
  return new Promise((resolve) => {
    runProgrammaticViewportMove(() => {
      void setCenter(centerX, flowPoint.y, { zoom, duration }).then(resolve)
    })
  })
}

function captureVisibleMapCenter(
  screenToFlowPosition: ReturnType<typeof useReactFlow>['screenToFlowPosition'],
  drawerInset: number,
): { x: number; y: number } | null {
  const pane = document.querySelector('.chapter-map .react-flow')
  if (!(pane instanceof HTMLElement)) return null
  const rect = pane.getBoundingClientRect()
  const centerX = rect.left + (rect.width - drawerInset) / 2
  const centerY = rect.top + rect.height / 2
  return screenToFlowPosition({ x: centerX, y: centerY })
}

function QuestViewportController({
  chapter,
  catalog,
  gridScale,
  chapterLayoutReady,
  focusNodeId,
  focusTarget,
  drawerInset,
  layoutEpoch,
}: {
  chapter: ChapterData
  catalog: Map<string, QuestCatalogEntry>
  gridScale: number
  chapterLayoutReady: boolean
  focusNodeId: string | null
  focusTarget: { x: number; y: number } | null
  drawerInset: number
  layoutEpoch: number
}) {
  const nodesInitialized = useNodesInitialized()
  const { setCenter, getZoom, viewportInitialized } = useReactFlow()
  const chapterEnteredRef = useRef<string | null>(null)

  useEffect(() => {
    chapterEnteredRef.current = null
  }, [chapter.id])

  useEffect(() => {
    if (!chapterLayoutReady || !nodesInitialized || !viewportInitialized) return

    let cancelled = false
    const apply = () => {
      if (cancelled) return
      const zoom = getZoom() || getSavedQuestCanvasZoom()

      if (focusNodeId && focusTarget) {
        void centerFlowPointInVisibleViewport(
          setCenter,
          focusTarget,
          drawerInset,
          zoom,
          QUEST_LAYOUT_TRANSITION_MS,
        )
        chapterEnteredRef.current = chapter.id
        return
      }

      if (chapterEnteredRef.current === chapter.id) return

      let target = getDefaultChapterViewCenter(chapter, catalog)
      if (chapter.autofocusId) {
        const autofocus = resolveAutofocusGridPoint(chapter, catalog, chapter.autofocusId)
        if (autofocus) {
          target = autofocus
        }
      } else {
        const remembered = getRememberedChapterCenter(chapter.id)
        if (remembered) {
          target = remembered
        }
      }

      const flow = gridToFlowPoint(target, gridScale)
      void centerFlowPointInVisibleViewport(setCenter, flow, 0, zoom, 0).then((ok) => {
        if (!cancelled && ok) {
          chapterEnteredRef.current = chapter.id
        }
      })
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(apply)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [
    catalog,
    chapter,
    chapterLayoutReady,
    drawerInset,
    focusNodeId,
    focusTarget,
    getZoom,
    gridScale,
    layoutEpoch,
    nodesInitialized,
    setCenter,
    viewportInitialized,
  ])

  return null
}

function RememberChapterViewportOnSettle({
  chapterId,
  gridScale,
  drawerInset,
  skip,
}: {
  chapterId: string
  gridScale: number
  drawerInset: number
  skip: boolean
}) {
  const { screenToFlowPosition } = useReactFlow()

  useOnViewportChange({
    onEnd: () => {
      if (skip || !shouldRememberViewportOnSettle()) return
      const flow = captureVisibleMapCenter(screenToFlowPosition, drawerInset)
      if (flow) {
        rememberChapterCenter(chapterId, flowToGridPoint(flow.x, flow.y, gridScale))
      }
    },
  })

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
    runProgrammaticViewportMove(() => {
      void setViewport(
        { ...viewport, x: viewport.x + mapDelta / 2 },
        { duration: QUEST_LAYOUT_TRANSITION_MS },
      )
    })
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

function withQuestSelection(nodes: Node[], selectedId: string | null): Node[] {
  let changed = false
  const next = nodes.map((node) => {
    if (node.type !== 'quest') return node
    const selected = selectedId != null && node.id === selectedId
    if (node.selected === selected) return node
    changed = true
    return { ...node, selected }
  })
  return changed ? next : nodes
}

function chapterToFlow(
  chapter: ChapterData,
  catalog: Map<string, QuestCatalogEntry>,
  dict: Record<string, string>,
  locale: string,
  gridScale: number,
  globalAtlas: GlobalAtlasContext | null,
  chapterAtlas: ChapterAtlasContext | null,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const visibleQuestIds = new Set(
    chapter.quests.filter(isQuestVisibleOnMap).map((quest) => quest.id),
  )

  const chapterImages = sortedChapterImages(chapter.images)
  const decorationsNode = buildChapterDecorationsNode(chapter.id, chapterImages, gridScale)
  if (decorationsNode) {
    nodes.push(decorationsNode)
  }

  for (const image of chapterImages) {
    if (!isChapterImageClickable(image.click)) continue
    const layout = chapterImageLayout(image, gridScale)
    nodes.push({
      id: `image:${image.image}:${image.x}:${image.y}:${image.order ?? 0}`,
      type: 'chapterImage',
      position: { x: layout.x, y: layout.y },
      data: { image, gridScale },
      selectable: false,
      draggable: false,
      focusable: false,
      measured: { width: layout.widthPx, height: layout.heightPx },
      style: {
        pointerEvents: 'auto',
        width: layout.widthPx,
        height: layout.heightPx,
      },
      zIndex: 2 + (image.order ?? 0),
    })
  }

  for (const quest of chapter.quests) {
    if (!visibleQuestIds.has(quest.id)) continue
    const iconSize = questNodeOuterPx(quest, gridScale)
    nodes.push({
      id: quest.id,
      type: 'quest',
      position: { x: gridToPx(quest.x, gridScale), y: gridToPx(quest.y, gridScale) },
      data: {
        quest,
        dict,
        locale,
        gridScale,
        globalAtlas,
        chapterAtlas,
      },
      width: iconSize,
      height: iconSize,
      measured: { width: iconSize, height: iconSize },
      style: { width: iconSize, height: iconSize },
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

    if (nodeIds.has(link.linkedQuest)) continue

    const linkedQuest = linkedEntry.quest

    const linkSize = link.size ?? DEFAULT_QUEST_NODE_SIZE
    const iconDisplay = resolveQuestLinkIconDisplay(link, linkedQuest.iconDisplay, gridScale)
    const linkedQuestData: QuestData = {
      ...linkedQuest,
      x: link.x,
      y: link.y,
      size: linkSize,
      shape: link.shape ?? linkedQuest.shape,
      iconDisplay,
    }
    const iconSize = iconDisplay?.nodeOuterPx ?? questIconPx(linkSize, gridScale)
    nodes.push({
      id: link.linkedQuest,
      type: 'quest',
      position: { x: gridToPx(link.x, gridScale), y: gridToPx(link.y, gridScale) },
      data: {
        quest: linkedQuestData,
        dict,
        locale,
        gridScale,
        globalAtlas,
        chapterAtlas,
      },
      width: iconSize,
      height: iconSize,
      measured: { width: iconSize, height: iconSize },
      style: { width: iconSize, height: iconSize },
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
  globalAtlas?: GlobalAtlasContext | null
  chapterAtlas?: ChapterAtlasContext | null
  onSelectQuest: (id: string) => void
  onClearSelection?: () => void
}

function QuestCanvasInner(props: QuestCanvasProps) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => chapterToFlow(
      props.chapter,
      props.catalog,
      props.dict,
      props.locale,
      props.gridScale,
      props.globalAtlas ?? null,
      props.chapterAtlas ?? null,
    ),
    [
      props.catalog,
      props.chapter,
      props.chapterAtlas,
      props.dict,
      props.globalAtlas,
      props.gridScale,
      props.locale,
    ],
  )
  const nodes = useMemo(
    () => withQuestSelection(layoutNodes, props.selectedId),
    [layoutNodes, props.selectedId],
  )

  return (
    <QuestCanvasHoverProvider selectedId={props.selectedId}>
      <QuestCanvasFlow
        {...props}
        layoutNodes={layoutNodes}
        layoutEdges={layoutEdges}
        nodes={nodes}
      />
    </QuestCanvasHoverProvider>
  )
}

function QuestCanvasFlow({
  chapter,
  catalog,
  gridScale,
  selectedId,
  drawerInset = 0,
  layoutEpoch = 0,
  sidebarCollapsed = false,
  onSelectQuest,
  onClearSelection,
  layoutNodes,
  layoutEdges,
  nodes,
}: QuestCanvasProps & { layoutNodes: Node[]; layoutEdges: Edge[]; nodes: Node[] }) {
  const { highlightQuestId } = useQuestCanvasHover()

  const flowEdges = useMemo(
    () => layoutEdges.map((edge) => {
      const outgoing = highlightQuestId != null && edge.source === highlightQuestId
      const incoming = highlightQuestId != null && edge.target === highlightQuestId
      return {
        ...edge,

        zIndex: 0,
        data: {
          ...(edge.data ?? {}),
          highlight: outgoing ? 'outgoing' as const : incoming ? 'incoming' as const : undefined,
        },
      }
    }),
    [highlightQuestId, layoutEdges],
  )

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

  const chapterLayoutReady = nodes.length > 0

  const focusNodeId = useMemo(() => {
    if (!selectedId) return null
    if (chapter.quests.some((quest) => quest.id === selectedId)) {
      return selectedId
    }
    return layoutNodes.find((node) => (
      node.type === 'quest'
      && isQuestNodeData(node.data)
      && node.data.quest.id === selectedId
    ))?.id ?? null
  }, [chapter.quests, layoutNodes, selectedId])

  const focusTarget = useMemo(() => {
    if (!focusNodeId) return null
    const node = layoutNodes.find((entry) => entry.id === focusNodeId)
    if (!node) return null
    return { x: node.position.x, y: node.position.y }
  }, [focusNodeId, layoutNodes])

  return (
    <ReactFlow
      nodes={nodes}
      edges={flowEdges}
      onNodesChange={() => {}}
      onEdgesChange={() => {}}
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
      <AdjustViewportOnSidebarChange
        layoutEpoch={layoutEpoch}
        sidebarCollapsed={sidebarCollapsed}
        hasSelectedQuest={focusNodeId != null}
      />
      <QuestViewportController
        chapter={chapter}
        catalog={catalog}
        gridScale={gridScale}
        chapterLayoutReady={chapterLayoutReady}
        focusNodeId={focusNodeId}
        focusTarget={focusTarget}
        drawerInset={drawerInset}
        layoutEpoch={layoutEpoch}
      />
      <RememberChapterViewportOnSettle
        chapterId={chapter.id}
        gridScale={gridScale}
        drawerInset={drawerInset}
        skip={focusNodeId != null}
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
    <ReactFlowProvider key={props.chapter.id}>
      <QuestCanvasInner {...props} />
    </ReactFlowProvider>
  )
})
