import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  type OnConnect,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Activity,
  AlertTriangle,
  GitBranch,
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
import {
  applyFocusToGraph,
  sampleNodes,
  getGraphForSemanticLevel,
} from '@/lib/sampleData';
import { getFlowGraph, getGraphs } from '@/lib/fcsApi';
import { useFlowStore } from '@/stores/flowStore';
import type { SemanticLevel } from '@/types/graph';

const nodeTypes = { flowNode: FlowNodeComponent };
const edgeTypes = { flowEdge: FlowEdgeComponent };

const defaultEdgeOptions = {
  type: 'flowEdge',
  animated: false,
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
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const [graph, setGraph] = useState(() => getGraphForSemanticLevel(semanticLevel));
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const onConnect: OnConnect = useCallback(() => {}, []);

  useEffect(() => {
    let active = true;
    async function loadGraph() {
      setIsLoadingGraph(true);
      setGraphError(null);
      if (!useLiveData) {
        const base = getGraphForSemanticLevel(semanticLevel);
        if (!active) return;
        const focused = normalizeGraphPositions(applyFocusToGraph(base, focusNodeId));
        setGraph(focused);
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
        const focused = normalizeGraphPositions(applyFocusToGraph(liveGraph, focusNodeId));
        setGraph(focused);
        setNodeDataById(Object.fromEntries(focused.nodes.map((n) => [n.id, n.data])));
      } catch (err) {
        if (!active) return;
        const base = getGraphForSemanticLevel(semanticLevel);
        const focused = normalizeGraphPositions(applyFocusToGraph(base, focusNodeId));
        setGraph(focused);
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
        if (rf) rf.fitView({ padding: 0.3, duration: 350 });
      } else {
        const next = Math.max(1, semanticLevel - 1) as SemanticLevel;
        setSemanticLevel(next);
        if (rf) rf.fitView({ padding: 0.3, duration: 350 });
      }
      return;
    }
    selectNode(null);
  }, [focusNodeId, rf, selectNode, semanticLevel, setFocusNodeId, setSemanticLevel]);

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
    () => graph.nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
    [graph.nodes, selectedNodeId]
  );

  useEffect(() => {
    if (!rf || graph.nodes.length === 0) return;
    rf.fitView({ padding: 0.3, duration: 280 });
  }, [graph, rf]);

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
    return sampleNodes
      .filter((n) =>
        `${n.data.businessName} ${n.data.technicalName} ${n.data.businessDescription}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery]);

  return (
    <div className="h-full w-full p-2 grid grid-rows-[64px_minmax(0,_1fr)] grid-cols-[250px_minmax(0,_1fr)] xl:grid-cols-[260px_minmax(0,_1fr)_360px] gap-2">
      <aside className="flow-panel rounded-xl p-3 row-span-2 overflow-y-auto">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-flow-accent to-flow-node-service" />
          <div>
            <div className="text-lg leading-tight font-semibold text-flow-text">Flow Visual OS</div>
            <div className="text-xs text-flow-text-muted">Execution flow workspace</div>
          </div>
        </div>

        <div className="mt-4 text-[11px] uppercase tracking-wider text-flow-text-muted">Navigation</div>
        <div className="mt-2 rounded-xl border border-flow-border bg-flow-overlay/35 p-2 space-y-1.5">
          {quickNavItems.map((item, idx) => (
            <button
              key={item}
              className={`w-full h-9 rounded-lg border text-sm px-3 flex items-center gap-2 transition-colors ${
                idx === 0
                  ? 'border-flow-border bg-flow-hover text-flow-text'
                  : 'border-transparent text-flow-text-secondary hover:border-flow-border hover:bg-flow-hover hover:text-flow-text'
              }`}
            >
              <span className="w-4 h-4 rounded-md border border-flow-border-subtle bg-flow-surface/60" />
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 text-[11px] uppercase tracking-wider text-flow-text-muted">Data Source</div>
        <div className="mt-2 rounded-xl border border-flow-border bg-flow-overlay/35 p-2">
          <button
            className={`w-full h-9 rounded-lg border text-sm px-3 flex items-center justify-between transition-colors ${
              useLiveData
                ? 'border-flow-node-service/50 bg-flow-node-service/10 text-flow-text'
                : 'border-flow-node-method/50 bg-flow-node-method/10 text-flow-text'
            }`}
            onClick={() => setUseLiveData(!useLiveData)}
          >
            <span className="flex items-center gap-2"><Sparkles size={14} /> {useLiveData ? 'FCS Live Data' : 'Sample Data'}</span>
            <span className="text-[11px]">ON</span>
          </button>
          <p className="text-[11px] text-flow-text-muted mt-2">
            {graphId ? `Graph: ${graphId}` : 'No graph selected yet'}
          </p>
          {graphError && <p className="text-[11px] text-flow-error mt-1">Fallback active: {graphError}</p>}
        </div>
      </aside>

      <header className="flow-panel rounded-xl px-3 py-2 flex items-center justify-between col-span-1 xl:col-span-2 min-w-0">
        <div className="relative flex items-center gap-2">
          <div className="h-10 w-[420px] border border-flow-border rounded-xl bg-flow-overlay/40 px-3 flex items-center gap-2">
            <Search size={14} className="text-flow-text-muted" />
            <input
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, methods, traces..."
              className="w-full bg-transparent outline-none text-sm text-flow-text placeholder:text-flow-text-muted"
            />
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
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="text-sm text-flow-text">{node.data.businessName}</div>
                  <div className="text-xs text-flow-text-muted">{node.data.technicalName}</div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setViewMode('business')}
            className={`h-10 px-3 rounded-xl border text-sm ${viewMode === 'business' ? 'border-flow-accent bg-flow-accent/20 text-flow-text' : 'border-flow-border text-flow-text-secondary'}`}
          >
            Business
          </button>
          <button
            onClick={() => setViewMode('engineering')}
            className={`h-10 px-3 rounded-xl border text-sm ${viewMode === 'engineering' ? 'border-flow-accent bg-flow-accent/20 text-flow-text' : 'border-flow-border text-flow-text-secondary'}`}
          >
            Engineering
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => rf?.fitView({ padding: 0.28, duration: 350 })}
            className="h-10 px-3 rounded-xl border border-flow-border text-flow-text-secondary hover:text-flow-text hover:bg-flow-hover transition-colors flex items-center gap-2 text-sm"
          >
            <SlidersHorizontal size={14} /> Auto Fit Graph
          </button>
          <button className="h-10 w-10 rounded-xl border border-flow-border text-flow-text-secondary hover:text-flow-text hover:bg-flow-hover transition-colors">
            <User size={15} className="mx-auto" />
          </button>
        </div>
      </header>

      <main className="flow-panel rounded-xl p-2 min-h-0 flex flex-col gap-2 min-w-0">
        <div
          data-testid="semantic-level-indicator"
          className="shrink-0 border border-flow-border rounded-lg bg-flow-overlay/50 px-3 py-1.5 text-xs text-flow-text-secondary"
        >
          Zoom Level {semanticLevel} / 5 · Double-click node to drill in · Double-click canvas to drill out
          {isLoadingGraph && <span className="ml-2 text-flow-text-muted">· Loading graph...</span>}
        </div>
        <div className="relative min-h-0 flex-1 border border-flow-border rounded-xl overflow-hidden">
          <ReactFlow
            nodes={displayNodes as never[]}
            edges={graph.edges as never[]}
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
              +
            </button>
            <button
              onClick={zoomOutLevel}
              className="w-9 h-9 rounded-md bg-flow-surface/90 border border-flow-border text-flow-text text-lg leading-none hover:bg-flow-hover"
              aria-label="Zoom out level"
            >
              -
            </button>
          </div>
        </div>
        <BottomBar />
      </main>

      <aside className="flow-panel rounded-xl p-2 min-h-0 overflow-y-auto hidden xl:block">
        <NodeDetailPanel />
        <div className="mt-2">
          <LegendPanel />
        </div>
        <div className="mt-2 border border-flow-border rounded-xl bg-flow-overlay/35 p-3">
          <div className="text-xs font-semibold text-flow-text-secondary uppercase tracking-wide mb-2">Observability Snapshot</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1 flex items-center gap-1"><Activity size={12} /> Requests</div>
              <div className="text-base font-semibold text-flow-text">12,847/hr</div>
            </div>
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Errors</div>
              <div className="text-base font-semibold text-flow-error">3/hr</div>
            </div>
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1 flex items-center gap-1"><GitBranch size={12} /> Active Flows</div>
              <div className="text-base font-semibold text-flow-text">16</div>
            </div>
            <div className="border border-flow-border rounded-lg p-2 bg-flow-surface">
              <div className="text-flow-text-muted mb-1">Avg Latency</div>
              <div className="text-base font-semibold text-flow-text">22ms</div>
            </div>
          </div>
        </div>
      </aside>
      <div onClick={() => setSearchOpen(false)} className="hidden" />
      <div className="sr-only">
        keyboard search behavior · inspector synchronization · overlap checks
      </div>
    </div>
  );
}
