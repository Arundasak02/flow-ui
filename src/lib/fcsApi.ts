import type { Edge, Node } from '@xyflow/react';
import type { FlowEdgeData, FlowNodeData, SemanticLevel } from '@/types/graph';

type FcsNodeType =
  | 'ENDPOINT'
  | 'SERVICE'
  | 'METHOD'
  | 'PRIVATE_METHOD'
  | 'DECISION'
  | 'TOPIC'
  | 'DATABASE'
  | 'REDIS'
  | 'EXTERNAL';

interface FcsNode {
  nodeId: string;
  type: FcsNodeType;
  name: string;
  label?: string;
  attributes?: Record<string, unknown>;
}

interface FcsEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type?: string;
  attributes?: Record<string, unknown>;
}

interface FcsGraphSummary {
  graphId: string;
}

interface FcsApiResponse<T> {
  success: boolean;
  data: T;
}

interface FcsRuntimeShape {
  requestsPerHour?: number;
  requests?: number;
  errorsPerHour?: number;
  errors?: number;
  activeFlows?: number;
  flows?: number;
  avgLatencyMs?: number;
  latencyMs?: number;
  updatedAt?: string;
}

const BASE_URL = import.meta.env.VITE_FCS_BASE_URL ?? '/api';

const nodeKindMap: Record<FcsNodeType, FlowNodeData['kind']> = {
  ENDPOINT: 'endpoint',
  SERVICE: 'service',
  METHOD: 'method',
  PRIVATE_METHOD: 'private_method',
  DECISION: 'decision',
  TOPIC: 'topic',
  DATABASE: 'database',
  REDIS: 'redis',
  EXTERNAL: 'external',
};

function zoomToFcs(level: SemanticLevel): number {
  return Math.max(0, Math.min(5, level - 1));
}

function inferEdgeType(value?: string): FlowEdgeData['edgeType'] {
  const v = (value ?? '').toLowerCase();
  if (v.includes('kafka') || v.includes('event')) return 'kafka';
  if (v.includes('db') || v.includes('database')) return 'db';
  if (v.includes('async')) return 'async';
  return 'sync';
}

function gridPosition(index: number, columns = 4) {
  const x = 180 + (index % columns) * 300;
  const y = 80 + Math.floor(index / columns) * 190;
  return { x, y };
}

function mapNode(node: FcsNode, index: number, level: SemanticLevel): Node<FlowNodeData> {
  const attrs = node.attributes ?? {};
  const businessName = String(attrs.businessName ?? node.label ?? node.name);
  const businessDescription = String(attrs.businessDescription ?? attrs.description ?? `Flow node: ${node.name}`);
  const technicalName = String(attrs.technicalName ?? node.name);
  const status = String(attrs.status ?? 'healthy') as FlowNodeData['status'];

  return {
    id: node.nodeId,
    type: 'flowNode',
    position: gridPosition(index),
    data: {
      kind: nodeKindMap[node.type] ?? 'method',
      semanticLevel: level,
      businessName,
      businessDescription,
      technicalName,
      signature: attrs.signature as string | undefined,
      httpMethod: attrs.httpMethod as string | undefined,
      path: attrs.path as string | undefined,
      avgDurationMs: Number(attrs.avgDurationMs ?? attrs.durationMs ?? 0) || undefined,
      callsPerHour: Number(attrs.callsPerHour ?? attrs.callCount ?? 0) || undefined,
      errorRate: Number(attrs.errorRate ?? 0) || undefined,
      status: ['healthy', 'degraded', 'error', 'inactive'].includes(status ?? '') ? status : 'healthy',
      usedInFlows: Array.isArray(attrs.usedInFlows) ? (attrs.usedInFlows as string[]) : undefined,
      serviceGroup: (attrs.serviceGroup as string | undefined) ?? (attrs.application as string | undefined),
    },
  };
}

function mapEdge(edge: FcsEdge, level: SemanticLevel): Edge<FlowEdgeData> {
  return {
    id: edge.edgeId,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    type: 'flowEdge',
    data: {
      semanticLevel: level,
      edgeType: inferEdgeType(edge.type),
      callCount: Number(edge.attributes?.callCount ?? 0) || undefined,
    },
  };
}

export async function getGraphs(): Promise<FcsGraphSummary[]> {
  const res = await fetch(`${BASE_URL}/graphs`);
  if (!res.ok) throw new Error(`FCS /graphs failed with ${res.status}`);
  const body = (await res.json()) as FcsApiResponse<FcsGraphSummary[]>;
  return body.data ?? [];
}

export async function getFlowGraph(graphId: string, level: SemanticLevel) {
  const zoom = zoomToFcs(level);
  const res = await fetch(`${BASE_URL}/flow/${encodeURIComponent(graphId)}?zoom=${zoom}`);
  if (!res.ok) throw new Error(`FCS /flow failed with ${res.status}`);
  const body = (await res.json()) as FcsApiResponse<{ nodes: FcsNode[]; edges: FcsEdge[] }>;
  const raw = body.data ?? { nodes: [], edges: [] };
  const nodes = raw.nodes.map((n, i) => mapNode(n, i, level));
  const edges = raw.edges.map((e) => mapEdge(e, level));
  return { nodes, edges };
}

export interface RuntimeSnapshot {
  requestsPerHour: number;
  errorsPerHour: number;
  activeFlows: number;
  avgLatencyMs: number;
  updatedAt?: string;
  source: 'live' | 'derived';
}

function mapRuntimePayload(payload: FcsRuntimeShape): RuntimeSnapshot {
  return {
    requestsPerHour: Number(payload.requestsPerHour ?? payload.requests ?? 0),
    errorsPerHour: Number(payload.errorsPerHour ?? payload.errors ?? 0),
    activeFlows: Number(payload.activeFlows ?? payload.flows ?? 0),
    avgLatencyMs: Number(payload.avgLatencyMs ?? payload.latencyMs ?? 0),
    updatedAt: payload.updatedAt,
    source: 'live',
  };
}

export async function getRuntimeSnapshot(graphId: string): Promise<RuntimeSnapshot> {
  const endpoints = [
    `${BASE_URL}/graphs/${encodeURIComponent(graphId)}/runtime-summary`,
    `${BASE_URL}/graphs/${encodeURIComponent(graphId)}/runtime`,
  ];

  for (const endpoint of endpoints) {
    const res = await fetch(endpoint);
    if (!res.ok) continue;
    const body = (await res.json()) as FcsApiResponse<FcsRuntimeShape> | FcsRuntimeShape;
    const payload = 'data' in body ? body.data : body;
    return mapRuntimePayload(payload ?? {});
  }

  throw new Error('FCS runtime snapshot unavailable');
}

export function deriveRuntimeSnapshot(
  nodes: Node<FlowNodeData>[],
  edges: Edge<FlowEdgeData>[]
): RuntimeSnapshot {
  const requestsPerHour = nodes.reduce((sum, node) => sum + (node.data.callsPerHour ?? 0), 0);
  const errorsWeighted = nodes.reduce((sum, node) => {
    const calls = node.data.callsPerHour ?? 0;
    const errorRate = node.data.errorRate ?? 0;
    return sum + calls * (errorRate / 100);
  }, 0);
  const avgLatencyBase = nodes
    .map((node) => node.data.avgDurationMs)
    .filter((value): value is number => typeof value === 'number');
  const avgLatencyMs = avgLatencyBase.length
    ? Math.round(avgLatencyBase.reduce((sum, value) => sum + value, 0) / avgLatencyBase.length)
    : 0;

  return {
    requestsPerHour: Math.round(requestsPerHour),
    errorsPerHour: Math.round(errorsWeighted),
    activeFlows: Math.max(1, Math.min(99, edges.length)),
    avgLatencyMs,
    source: 'derived',
  };
}
