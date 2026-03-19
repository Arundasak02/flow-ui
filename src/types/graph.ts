export type NodeKind =
  | 'endpoint'
  | 'service'
  | 'method'
  | 'private_method'
  | 'decision'
  | 'topic'
  | 'database'
  | 'redis'
  | 'external';
export type SemanticLevel = 1 | 2 | 3 | 4 | 5;

export interface FlowNodeData {
  [key: string]: unknown;
  kind: NodeKind;
  semanticLevel: SemanticLevel;
  businessName: string;
  businessDescription: string;
  technicalName: string;
  signature?: string;
  httpMethod?: string;
  path?: string;

  // runtime stats
  avgDurationMs?: number;
  callsPerHour?: number;
  errorRate?: number;
  lastExecuted?: string;
  status?: 'healthy' | 'degraded' | 'error' | 'inactive';

  // trace-related
  isOnActivePath?: boolean;
  isActiveNode?: boolean;
  isErrorNode?: boolean;

  // shared across flows
  usedInFlows?: string[];
  serviceGroup?: string;
}

export interface FlowEdgeData {
  [key: string]: unknown;
  animated?: boolean;
  isOnActivePath?: boolean;
  callCount?: number;
  semanticLevel?: SemanticLevel;
  edgeType?: 'sync' | 'async' | 'kafka' | 'db';
}

export type ViewMode = 'business' | 'engineering';
