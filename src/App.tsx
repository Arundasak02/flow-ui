import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  type Edge,
  type Node,
  type OnConnect,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Activity,
  AlertTriangle,
  Command,
  GitBranch,
  MonitorCog,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  User,
} from 'lucide-react';

import FlowNodeComponent from '@/components/graph/FlowNode';
import FlowEdgeComponent from '@/components/graph/FlowEdge';
import BottomBar from '@/components/layout/BottomBar';
import NodeDetailPanel from '@/components/panels/NodeDetailPanel';
import LegendPanel from '@/components/layout/LegendPanel';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { getGraphForSemanticLevel } from '@/lib/sampleData';
import { deriveRuntimeSnapshot, getFlowGraph, getGraphs, getRuntimeSnapshot, type RuntimeSnapshot } from '@/lib/fcsApi';
import { useFlowStore } from '@/stores/flowStore';
import type { FlowEdgeData, FlowNodeData, SemanticLevel } from '@/types/graph';

const nodeTypes = { flowNode: FlowNodeComponent };
const edgeTypes = { flowEdge: FlowEdgeComponent };

const defaultEdgeOptions = {
  type: 'flowEdge',
  animated: false,
};

type FlowGraph = {
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
};

function normalizeGraphPositions<T extends { nodes: Array<{ position: { x: number; y: number } }> }>(graph: T): T {
  if (graph.nodes.length === 0) return graph;
  const xs = graph.nodes.map((n) => n.position.x);
  const ys = graph.nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: {
        x: (node.position.x - minX) * 0.78 + 80,
        y: (node.position.y - minY) * 0.78 + 40,
      },
    })),
  };
}

function resolveNodeOverlap(nodes: Node<FlowNodeData>[], level: SemanticLevel): Node<FlowNodeData>[] {
  if (nodes.length <= 1) return nodes;

  const minDistanceX = level >= 4 ? 210 : 240;
  const minDistanceY = level >= 4 ? 120 : 140;
  const updated = nodes.map((node) => ({ ...node, position: { ...node.position } }));

  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < updated.length; i += 1) {
      for (let j = i + 1; j < updated.length; j += 1) {
        const a = updated[i];
        const b = updated[j];
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const overlapX = minDistanceX - Math.abs(dx);
        const overlapY = minDistanceY - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        const shiftX = overlapX * 0.5 * (dx === 0 ? (j % 2 === 0 ? 1 : -1) : Math.sign(dx));
        const shiftY = overlapY * 0.5 * (dy === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dy));

        a.position.x -= shiftX;
        b.position.x += shiftX;
        a.position.y -= shiftY;
        b.position.y += shiftY;
      }
    }
  }

  return updated;
}

function getFocusNeighborhood(graph: FlowGraph, focusNodeId: string | null): Set<string> | null {
  if (!focusNodeId) return null;
  const focusNode = graph.nodes.find((node) => node.id === focusNodeId);
  if (!focusNode) return null;

  const neighbors = new Set<string>([focusNodeId]);
  for (const edge of graph.edges) {
    if (edge.source === focusNodeId || edge.target === focusNodeId) {
      neighbors.add(edge.source);
      neighbors.add(edge.target);
    }
  }

  if (focusNode.data.serviceGroup) {
    for (const node of graph.nodes) {
      if (node.data.serviceGroup === focusNode.data.serviceGroup) {
        neighbors.add(node.id);
      }
    }
  }
  return neighbors;
}

function annotateReadability(graph: FlowGraph, semanticLevel: SemanticLevel, focusNodeId: string | null): FlowGraph {
  const focusNeighborhood = getFocusNeighborhood(graph, focusNodeId);
  const shouldDimByFocus = semanticLevel >= 3 && Boolean(focusNeighborhood && focusNeighborhood.size > 0);

  const nodes = graph.nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      isDimmed: shouldDimByFocus ? !focusNeighborhood?.has(node.id) : false,
    },
  }));

  const edges = graph.edges.map((edge) => {
    const shouldDimEdge =
      shouldDimByFocus &&
      !(focusNeighborhood?.has(edge.source) && focusNeighborhood?.has(edge.target));
    return {
      ...edge,
      data: {
        ...edge.data,
        isDimmed: shouldDimEdge,
      },
    };
  });

  return { nodes, edges };
}

function prepareGraph(graph: FlowGraph, semanticLevel: SemanticLevel, focusNodeId: string | null): FlowGraph {
  const normalized = normalizeGraphPositions(graph);
  const deOverlapped = {
    ...normalized,
    nodes: resolveNodeOverlap(normalized.nodes, semanticLevel),
  };
  return annotateReadability(deOverlapped, semanticLevel, focusNodeId);
}

export default function App() {
  const viewMode = useFlowStore((s) => s.viewMode);
  const setViewMode = useFlowStore((s) => s.setViewMode);
  const semanticLevel = useFlowStore((s) => s.semanticLevel);
  const setSemanticLevel = useFlowStore((s) => s.setSemanticLevel);
  const focusNodeId = useFlowStore((s) => s.focusNodeId);
  const setFocusNodeId = useFlowStore((s) => s.setFocusNodeId);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const selectNode = useFlowStore((s) => s.selectNode);
  const graphId = useFlowStore((s) => s.graphId);
  const setGraphId = useFlowStore((s) => s.setGraphId);
  const useLiveData = useFlowStore((s) => s.useLiveData);
  const setUseLiveData = useFlowStore((s) => s.setUseLiveData);
  const setNodeDataById = useFlowStore((s) => s.setNodeDataById);
  const sidebarCollapsed = useFlowStore((s) => s.sidebarCollapsed);
  const sidebarPinned = useFlowStore((s) => s.sidebarPinned);
  const toggleSidebarCollapsed = useFlowStore((s) => s.toggleSidebarCollapsed);
  const setSidebarPinned = useFlowStore((s) => s.setSidebarPinned);
  const inspectorWidth = useFlowStore((s) => s.inspectorWidth);
  const setInspectorWidth = useFlowStore((s) => s.setInspectorWidth);
  const commandPaletteOpen = useFlowStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useFlowStore((s) => s.setCommandPaletteOpen);
  const replaySpeed = useFlowStore((s) => s.replaySpeed);
  const isReplaying = useFlowStore((s) => s.isReplaying);
  const setReplaying = useFlowStore((s) => s.setReplaying);
  const activeTraceId = useFlowStore((s) => s.activeTraceId);
  const setActiveTrace = useFlowStore((s) => s.setActiveTrace);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const [graph, setGraph] = useState(() => getGraphForSemanticLevel(semanticLevel));
  const [runtime, setRuntime] = useState<RuntimeSnapshot>(() =>
    deriveRuntimeSnapshot(getGraphForSemanticLevel(semanticLevel).nodes, getGraphForSemanticLevel(semanticLevel).edges)
  );
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [replayFrame, setReplayFrame] = useState(0);

  const onConnect: OnConnect = useCallback(() => {}, []);

  const runAutoFit = useCallback(
    (preferSelected = true) => {
      if (!rf) return;
      if (graph.nodes.length === 0) return;

      if (preferSelected && selectedNodeId) {
        const targetIds = new Set<string>([selectedNodeId]);
        for (const edge of graph.edges) {
          if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
            targetIds.add(edge.source);
            targetIds.add(edge.target);
          }
        }
        const targetNodes = graph.nodes.filter((node) => targetIds.has(node.id));
        if (targetNodes.length > 0) {
          const xs = targetNodes.map((node) => node.position.x);
          const ys = targetNodes.map((node) => node.position.y);
          const minX = Math.min(...xs) - 180;
          const maxX = Math.max(...xs) + 280;
          const minY = Math.min(...ys) - 120;
          const maxY = Math.max(...ys) + 160;
          rf.fitBounds(
            {
              x: minX,
              y: minY,
              width: Math.max(360, maxX - minX),
              height: Math.max(240, maxY - minY),
            },
            { duration: 350, padding: 0.2 }
          );
          return;
        }
      }

      rf.fitView({ padding: 0.28, duration: 350 });
    },
    [graph.edges, graph.nodes, rf, selectedNodeId]
  );

  useEffect(() => {
    let active = true;
    async function loadGraph() {
      setIsLoadingGraph(true);
      setGraphError(null);
      if (!useLiveData) {
        const base = getGraphForSemanticLevel(semanticLevel);
        if (!active) return;
        const focused = prepareGraph(base, semanticLevel, focusNodeId);
        setGraph(focused as unknown as typeof graph);
          setRuntime(deriveRuntimeSnapshot(focused.nodes, focused.edges));
        setNodeDataById(
          Object.fromEntries(focused.nodes.map((n) => [n.id, n.data]))
        );
        setIsLoadingGraph(false);
        return;
      }

      try {
        let nextGraphId = graphId;
        if (!nextGraphId) {
          const graphs = await getGraphs();
          nextGraphId = graphs[0]?.graphId ?? null;
          setGraphId(nextGraphId);
        }
        if (!nextGraphId) throw new Error('No graphs found in FCS');

        const liveGraph = await getFlowGraph(nextGraphId, semanticLevel);
        if (!active) return;
        const focused = prepareGraph(liveGraph, semanticLevel, focusNodeId);
        setGraph(focused as unknown as typeof graph);
        const liveRuntime = await getRuntimeSnapshot(nextGraphId).catch(() =>
          deriveRuntimeSnapshot(focused.nodes, focused.edges)
        );
        if (!active) return;
        setRuntime(liveRuntime);
        setNodeDataById(Object.fromEntries(focused.nodes.map((n) => [n.id, n.data])));
      } catch (err) {
        if (!active) return;
        const base = getGraphForSemanticLevel(semanticLevel);
        const focused = prepareGraph(base, semanticLevel, focusNodeId);
        setGraph(focused as unknown as typeof graph);
        setRuntime(deriveRuntimeSnapshot(focused.nodes, focused.edges));
        setNodeDataById(Object.fromEntries(focused.nodes.map((n) => [n.id, n.data])));
        setGraphError((err as Error).message);
      } finally {
        if (active) setIsLoadingGraph(false);
      }
    }

    void loadGraph();
    return () => {
      active = false;
    };
  }, [focusNodeId, graphId, semanticLevel, setGraphId, setNodeDataById, useLiveData]);

  const onPaneClick = useCallback((event: { detail?: number }) => {
    if (event?.detail === 2) {
      if (focusNodeId) {
        setFocusNodeId(null);
        runAutoFit(false);
      } else {
        const next = Math.max(1, semanticLevel - 1) as SemanticLevel;
        setSemanticLevel(next);
        runAutoFit(false);
      }
      return;
    }
    selectNode(null);
  }, [focusNodeId, runAutoFit, selectNode, semanticLevel, setFocusNodeId, setSemanticLevel]);

  const onNodeDoubleClick = useCallback((_event: unknown, node: { id: string; position: { x: number; y: number } }) => {
    const next = Math.min(5, semanticLevel + 1) as SemanticLevel;
    setFocusNodeId(node.id);
    setSemanticLevel(next);
    if (rf) {
      rf.setCenter(node.position.x + 120, node.position.y + 40, { zoom: 1, duration: 350 });
    }
  }, [rf, semanticLevel, setFocusNodeId, setSemanticLevel]);

  const zoomInLevel = useCallback(() => {
    setSemanticLevel(Math.min(5, semanticLevel + 1) as SemanticLevel);
  }, [semanticLevel, setSemanticLevel]);

  const zoomOutLevel = useCallback(() => {
    if (focusNodeId) setFocusNodeId(null);
    setSemanticLevel(Math.max(1, semanticLevel - 1) as SemanticLevel);
  }, [focusNodeId, semanticLevel, setFocusNodeId, setSemanticLevel]);

  const displayNodes = useMemo(
    () => {
      const edgeCount = graph.edges.length;
      const activeEdge = edgeCount ? graph.edges[replayFrame % edgeCount] : null;
      const activeNodes = new Set<string>();
      if (activeEdge) {
        activeNodes.add(activeEdge.source);
        activeNodes.add(activeEdge.target);
      }

      return graph.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
        data: {
          ...node.data,
          isActiveNode: isReplaying && activeNodes.has(node.id),
          isOnActivePath: isReplaying && activeNodes.has(node.id),
          isErrorNode:
            isReplaying &&
            activeNodes.has(node.id) &&
            typeof node.data.errorRate === 'number' &&
            node.data.errorRate > 2,
        },
      }));
    },
    [graph.edges, graph.nodes, isReplaying, replayFrame, selectedNodeId]
  );

  const displayEdges = useMemo(() => {
    const edgeCount = graph.edges.length;
    const activeEdge = edgeCount ? graph.edges[replayFrame % edgeCount] : null;
    return graph.edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isOnActivePath: isReplaying && edge.id === activeEdge?.id,
      },
    }));
  }, [graph.edges, isReplaying, replayFrame]);

  useEffect(() => {
    if (!rf || graph.nodes.length === 0) return;
    runAutoFit(Boolean(selectedNodeId));
  }, [graph, rf, runAutoFit, selectedNodeId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        Boolean(target?.closest('[contenteditable="true"]'));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((value) => !value);
        setSearchOpen(false);
        return;
      }

      if (isTypingTarget) return;
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        runAutoFit(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [runAutoFit, setCommandPaletteOpen]);

  useEffect(() => {
    if (!isReplaying || graph.edges.length === 0) return;
    const intervalMs = Math.max(280, Math.round(1200 / replaySpeed));
    const timer = window.setInterval(() => {
      setReplayFrame((prev) => prev + 1);
    }, intervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [graph.edges.length, isReplaying, replaySpeed]);

  useEffect(() => {
    if (!activeTraceId && graph.edges.length > 0) {
      setActiveTrace(`trace-${graph.edges[0].id}`);
    }
  }, [activeTraceId, graph.edges, setActiveTrace]);

  useEffect(() => {
    if (!useLiveData || !graphId) return;
    const timer = window.setInterval(() => {
      void getRuntimeSnapshot(graphId)
        .then((snapshot) => setRuntime(snapshot))
        .catch(() => {
          // Retain last-known runtime values when polling fails.
        });
    }, 8000);
    return () => {
      window.clearInterval(timer);
    };
  }, [graphId, useLiveData]);

  const quickNavItems = [
    'Graph Workspace',
    'Replay Timeline',
    'Service Topology',
    'Incidents',
    'Settings',
  ];

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return graph.nodes
      .filter((n) =>
        `${n.data.businessName} ${n.data.technicalName} ${n.data.businessDescription}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [graph.nodes, searchQuery]);

  const commandResults = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return graph.nodes.slice(0, 8);
    return graph.nodes
      .filter((n) =>
        `${n.data.businessName} ${n.data.technicalName} ${n.data.businessDescription}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [commandQuery, graph.nodes]);

  useEffect(() => {
    if (!isResizingInspector) return;

    const onMouseMove = (event: MouseEvent) => {
      const nextWidth = window.innerWidth - event.clientX - 8;
      setInspectorWidth(nextWidth);
    };
    const onMouseUp = () => {
      setIsResizingInspector(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizingInspector, setInspectorWidth]);

  return (
    <div
      className="h-full w-full p-2 grid grid-rows-[64px_minmax(0,_1fr)] gap-2"
      style={{
        gridTemplateColumns: sidebarCollapsed
          ? `64px minmax(0,1fr) 6px minmax(0, ${inspectorWidth}px)`
          : `260px minmax(0,1fr) 6px minmax(0, ${inspectorWidth}px)`,
      }}
    >
      <aside className="flow-panel rounded-xl p-3 row-span-2 overflow-y-auto">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-flow-accent to-flow-node-service" />
          {!sidebarCollapsed && (
            <div>
              <div className="text-lg leading-tight font-semibold text-flow-text">Flow Visual OS</div>
              <div className="text-xs text-flow-text-muted">Execution flow workspace</div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="!h-7 !w-7 !px-0"
              onClick={() => setSidebarPinned(!sidebarPinned)}
              aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            >
              {sidebarPinned ? <Pin size={13} /> : <PinOff size={13} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="!h-7 !w-7 !px-0"
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </Button>
          </div>
        </div>

        {!sidebarCollapsed && <div className="mt-4 text-[11px] uppercase tracking-wider text-flow-text-muted">Navigation</div>}
        <div className={`mt-2 rounded-xl border border-flow-border bg-flow-overlay/35 p-2 space-y-1.5 ${sidebarCollapsed ? 'px-1.5' : ''}`}>
          {quickNavItems.map((item, idx) => (
            <button
              key={item}
              className={`w-full h-9 rounded-lg border text-sm px-3 flex items-center gap-2 transition-colors ${
                idx === 0
                  ? 'border-flow-border bg-flow-hover text-flow-text'
                  : 'border-transparent text-flow-text-secondary hover:border-flow-border hover:bg-flow-hover hover:text-flow-text'
              }`}
            >
              <span className="w-4 h-4 shrink-0 rounded-md border border-flow-border-subtle bg-flow-surface/60" />
              {!sidebarCollapsed && item}
            </button>
          ))}
        </div>

        {!sidebarCollapsed && <div className="mt-4 text-[11px] uppercase tracking-wider text-flow-text-muted">Data Source</div>}
        <div className="mt-2 rounded-xl border border-flow-border bg-flow-overlay/35 p-2">
          <button
            className={`w-full h-9 rounded-lg border text-sm px-3 flex items-center justify-between transition-colors ${
              useLiveData
                ? 'border-flow-node-service/50 bg-flow-node-service/10 text-flow-text'
                : 'border-flow-node-method/50 bg-flow-node-method/10 text-flow-text'
            }`}
            onClick={() => setUseLiveData(!useLiveData)}
          >
            <span className="flex items-center gap-2"><Sparkles size={14} /> {!sidebarCollapsed && (useLiveData ? 'FCS Live Data' : 'Sample Data')}</span>
            {!sidebarCollapsed && <span className="text-[11px]">ON</span>}
          </button>
          {!sidebarCollapsed && (
            <>
              <p className="text-[11px] text-flow-text-muted mt-2">
                {graphId ? `Graph: ${graphId}` : 'No graph selected yet'}
              </p>
              {graphError && <p className="text-[11px] text-flow-error mt-1">Fallback active: {graphError}</p>}
            </>
          )}
        </div>
      </aside>

      <header className="flow-panel rounded-xl px-3 py-2 flex items-center justify-between col-start-2 col-span-3 min-w-0">
        <div className="relative flex items-center gap-2">
          <div className="h-10 w-[420px] border border-flow-border rounded-[var(--radius-md)] bg-flow-overlay/40 px-3 flex items-center gap-2">
            <Search size={14} className="text-flow-text-muted" />
            <Input
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, methods, traces..."
              className="!h-8 !border-transparent !bg-transparent !px-0 !text-sm focus:!ring-0 focus:!border-transparent"
            />
            <div className="flex items-center gap-1 text-[10px] text-flow-text-muted border border-flow-border-subtle rounded px-1.5 py-0.5">
              <Command size={10} />
              K
            </div>
          </div>
          {searchOpen && searchQuery && (
            <div className="absolute top-12 left-0 w-[460px] border border-flow-border rounded-xl bg-flow-surface shadow-xl shadow-black/40 p-2 z-20">
              {searchResults.length === 0 && <div className="text-sm text-flow-text-muted px-2 py-1">No matching nodes.</div>}
              {searchResults.map((node) => (
                <button
                  key={node.id}
                  className="w-full text-left px-2 py-2 rounded-lg hover:bg-flow-hover transition-colors"
                  onClick={() => {
                    selectNode(node.id);
                    setFocusNodeId(node.id);
                    setSearchOpen(false);
                    setSearchQuery('');
                    runAutoFit(true);
                  }}
                >
                  <div className="text-sm text-flow-text">{node.data.businessName}</div>
                  <div className="text-xs text-flow-text-muted">{node.data.technicalName}</div>
                </button>
              ))}
            </div>
          )}
          <Button
            onClick={() => setViewMode('business')}
            variant={viewMode === 'business' ? 'primary' : 'secondary'}
          >
            Business
          </Button>
          <Button
            onClick={() => setViewMode('engineering')}
            variant={viewMode === 'engineering' ? 'primary' : 'secondary'}
          >
            Engineering
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="hidden md:inline-flex">
            <MonitorCog size={10} className="mr-1" />
            {import.meta.env.MODE}
          </Badge>
          <Button
            onClick={() => runAutoFit(true)}
            variant="secondary"
            aria-label="Auto Fit Graph"
          >
            <SlidersHorizontal size={14} /> Auto Fit Graph
          </Button>
          <Button variant="secondary" className="hidden md:inline-flex" onClick={() => setCommandPaletteOpen(true)}>
            <RefreshCw size={14} /> Quick Actions
          </Button>
          <Button variant="secondary" className="!w-10 !px-0">
            <User size={15} className="mx-auto" />
          </Button>
        </div>
      </header>

      <main className="flow-panel rounded-xl p-2 min-h-0 flex flex-col gap-2 min-w-0 col-start-2">
        <div
          data-testid="semantic-level-indicator"
          className="shrink-0 border border-flow-border rounded-lg bg-flow-overlay/50 px-3 py-1.5 text-xs text-flow-text-secondary"
        >
          Zoom Level {semanticLevel} / 5 · Double-click node to drill in · Double-click canvas to drill out · Press F to auto-fit
          <Badge variant="info" className="ml-2">semantic</Badge>
          {isLoadingGraph && <span className="ml-2 text-flow-text-muted">· Loading graph...</span>}
        </div>
        <div className="relative min-h-0 flex-1 border border-flow-border rounded-xl overflow-hidden">
          <ReactFlow
            nodes={displayNodes as never[]}
            edges={displayEdges as never[]}
            onInit={setRf}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onNodeDoubleClick={onNodeDoubleClick}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnDrag
            elementsSelectable
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            proOptions={{ hideAttribution: true }}
            className="!bg-flow-base"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-flow-border-subtle)" />
            <MiniMap
              nodeColor={(n) => {
                const kind = (n.data as { kind?: string })?.kind;
                const colors: Record<string, string> = {
                  endpoint: 'var(--color-flow-node-endpoint)',
                  service: 'var(--color-flow-node-service)',
                  method: 'var(--color-flow-node-method)',
                  topic: 'var(--color-flow-node-topic)',
                  database: 'var(--color-flow-node-database)',
                  external: 'var(--color-flow-node-external)',
                };
                return colors[kind ?? ''] ?? 'var(--color-flow-border)';
              }}
              maskColor="rgba(6, 7, 11, 0.8)"
              style={{ background: 'var(--color-flow-surface)' }}
              position="bottom-right"
            />
          </ReactFlow>
          <div className="absolute right-3 bottom-24 z-20 flex flex-col gap-2">
            <button
              onClick={zoomInLevel}
              className="w-9 h-9 rounded-md bg-flow-surface/90 border border-flow-border text-flow-text text-lg leading-none hover:bg-flow-hover"
              aria-label="Zoom in level"
            >
              <Plus size={14} className="mx-auto" />
            </button>
            <button
              onClick={zoomOutLevel}
              className="w-9 h-9 rounded-md bg-flow-surface/90 border border-flow-border text-flow-text text-lg leading-none hover:bg-flow-hover"
              aria-label="Zoom out level"
            >
              <Minus size={14} className="mx-auto" />
            </button>
          </div>
        </div>
        <BottomBar runtime={runtime} isReplaying={isReplaying} onToggleReplay={() => setReplaying(!isReplaying)} />
      </main>

      <div
        className="w-[6px] cursor-col-resize bg-flow-border-subtle hover:bg-flow-border transition-colors col-start-3 row-start-2 rounded"
        onMouseDown={() => setIsResizingInspector(true)}
        aria-label="Resize inspector"
      />
      <aside className="flow-panel rounded-xl p-2 min-h-0 overflow-y-auto col-start-4 row-start-2">
        <NodeDetailPanel />
        <div className="mt-2">
          <LegendPanel />
        </div>
        <div className="mt-2 border border-flow-border rounded-xl bg-flow-overlay/35 p-3">
          <div className="text-xs font-semibold text-flow-text-secondary uppercase tracking-wide mb-2">Observability Snapshot</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1 flex items-center gap-1"><Activity size={12} /> Requests</div>
              <div className="text-base font-semibold text-flow-text">{runtime.requestsPerHour.toLocaleString()}/hr</div>
            </div>
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Errors</div>
              <div className="text-base font-semibold text-flow-error">{runtime.errorsPerHour.toLocaleString()}/hr</div>
            </div>
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1 flex items-center gap-1"><GitBranch size={12} /> Active Flows</div>
              <div className="text-base font-semibold text-flow-text">{runtime.activeFlows}</div>
            </div>
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1">Avg Latency</div>
              <div className="text-base font-semibold text-flow-text">{runtime.avgLatencyMs}ms</div>
            </div>
          </div>
        </div>
      </aside>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-start justify-center pt-24">
          <div className="w-[560px] border border-flow-border rounded-xl bg-flow-surface shadow-2xl shadow-black/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-flow-border-subtle text-xs text-flow-text-muted">
              Command palette · quick actions
            </div>
            <div className="p-2 space-y-2">
              <Input
                placeholder="Jump to service, method, flow..."
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
              />
              <div className="max-h-56 overflow-y-auto border border-flow-border-subtle rounded-[var(--radius-md)] p-1 space-y-1">
                {commandResults.map((node) => (
                  <button
                    key={node.id}
                    className="w-full text-left px-2 py-1.5 rounded-md text-sm text-flow-text hover:bg-flow-hover"
                    onClick={() => {
                      selectNode(node.id);
                      setFocusNodeId(node.id);
                      runAutoFit(true);
                      setCommandPaletteOpen(false);
                    }}
                  >
                    <div>{node.data.businessName}</div>
                    <div className="text-[11px] text-flow-text-muted">{node.data.technicalName}</div>
                  </button>
                ))}
              </div>
              <button
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-flow-text hover:bg-flow-hover"
                onClick={() => {
                  runAutoFit(true);
                  setCommandPaletteOpen(false);
                }}
              >
                Auto Fit Graph
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-flow-text hover:bg-flow-hover"
                onClick={() => {
                  setViewMode(viewMode === 'business' ? 'engineering' : 'business');
                  setCommandPaletteOpen(false);
                }}
              >
                Toggle Business / Engineering
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-flow-text hover:bg-flow-hover"
                onClick={() => {
                  setFocusNodeId(null);
                  setCommandPaletteOpen(false);
                }}
              >
                Clear Focus
              </button>
            </div>
          </div>
          <button className="absolute inset-0 -z-10" onClick={() => setCommandPaletteOpen(false)} aria-label="Close command palette" />
        </div>
      )}
      <div onClick={() => setSearchOpen(false)} className="hidden" />
      <div className="sr-only">
        keyboard search behavior · inspector synchronization · overlap checks
      </div>
    </div>
  );
}
