import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Globe, Box, Code2, MessageSquare, Database, ExternalLink, Split, ServerCog,
  CheckCircle2, AlertTriangle, XCircle, Minus,
} from 'lucide-react';
import { useFlowStore } from '@/stores/flowStore';
import type { FlowNodeData, NodeKind } from '@/types/graph';

const kindMeta: Record<NodeKind, { icon: typeof Globe; color: string; label: string }> = {
  endpoint:  { icon: Globe,        color: 'var(--color-flow-node-endpoint)', label: 'Endpoint' },
  service:   { icon: Box,          color: 'var(--color-flow-node-service)',  label: 'Service' },
  method:    { icon: Code2,        color: 'var(--color-flow-node-method)',   label: 'Method' },
  private_method: { icon: Code2,   color: 'var(--color-flow-text-muted)',     label: 'Private' },
  decision: { icon: Split,         color: 'var(--color-flow-warning)',        label: 'Decision' },
  topic:     { icon: MessageSquare, color: 'var(--color-flow-node-topic)',   label: 'Topic' },
  database:  { icon: Database,     color: 'var(--color-flow-node-database)', label: 'Database' },
  redis:     { icon: ServerCog,    color: '#ef4444',                          label: 'Redis' },
  external:  { icon: ExternalLink, color: 'var(--color-flow-node-external)', label: 'External' },
};

const statusIcon = {
  healthy:  <CheckCircle2 size={12} className="text-flow-success" />,
  degraded: <AlertTriangle size={12} className="text-flow-warning" />,
  error:    <XCircle size={12} className="text-flow-error" />,
  inactive: <Minus size={12} className="text-flow-text-muted" />,
};

function FlowNodeComponent({ data, id, selected }: NodeProps & { data: FlowNodeData }) {
  const viewMode = useFlowStore((s) => s.viewMode);
  const selectNode = useFlowStore((s) => s.selectNode);
  const semanticLevel = useFlowStore((s) => s.semanticLevel);
  const meta = kindMeta[data.kind];
  const Icon = meta.icon;

  const isActive = data.isOnActivePath || data.isActiveNode;
  const isError = data.isErrorNode;
  const isDimmed = Boolean(data.isDimmed);

  const glowClass = isError
    ? 'animate-error-pulse'
    : isActive
    ? 'animate-node-glow'
    : '';

  const compact = semanticLevel <= 2;
  const showBusinessDescription = viewMode === 'business' && semanticLevel >= 3 && !compact;
  const showRuntimeStats = viewMode === 'engineering' && semanticLevel >= 4 && !compact;
  const showSharedFlows = semanticLevel >= 3 && !compact;
  const shapeClass =
    data.kind === 'endpoint'
      ? 'rounded-2xl'
      : data.kind === 'method'
      ? 'rounded-xl border-dashed'
      : data.kind === 'decision'
      ? 'rounded-2xl rotate-45'
      : data.kind === 'database'
      ? 'rounded-[16px]'
      : 'rounded-xl';

  const contentClass = data.kind === 'decision' ? '-rotate-45' : '';
  const isDatabase = data.kind === 'database';

  return (
    <div
      onClick={() => selectNode(id)}
      data-testid={`flow-node-${id}`}
      className={`
        group relative cursor-pointer
        border transition-all duration-200 ${shapeClass}
        ${selected
          ? 'border-flow-accent bg-flow-elevated shadow-lg shadow-flow-accent/20'
          : 'border-flow-border bg-flow-surface hover:border-flow-accent/50 hover:bg-flow-elevated'
        }
        ${isDimmed ? 'opacity-35 saturate-[0.75]' : 'opacity-100'}
        ${glowClass}
      `}
      style={{
        minWidth: compact ? 150 : viewMode === 'business' ? 220 : 260,
        maxWidth: compact ? 190 : viewMode === 'business' ? 280 : 320,
      }}
    >
      {/* Top accent bar */}
      <div
        className={`h-[3px] ${data.kind === 'decision' ? 'rounded-full mx-8 mt-2' : 'rounded-t-lg'}`}
        style={{ backgroundColor: meta.color }}
      />

      {isDatabase && (
        <div className="mx-3 mt-2 mb-1 h-2 rounded-full border border-flow-border-subtle bg-flow-node-database/20" />
      )}

      <div className={`${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} ${contentClass}`}>
        {/* Header: icon + kind badge + status */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Icon size={14} style={{ color: meta.color }} />
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            {data.httpMethod && (
              <span className="text-[10px] font-mono font-medium px-1 py-0.5 rounded bg-flow-overlay text-flow-text-secondary">
                {data.httpMethod}
              </span>
            )}
          </div>
          {data.status && statusIcon[data.status]}
        </div>

        {/* PRIMARY content — changes by viewMode */}
        {viewMode === 'business' ? (
          <>
            <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-flow-text leading-tight mb-1`}>
              {data.businessName}
            </h3>
            {showBusinessDescription && data.businessDescription && (
              <p className="text-xs text-flow-text-secondary leading-relaxed mb-2">
                {data.businessDescription}
              </p>
            )}
            {/* Subtle technical name */}
            <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-mono text-flow-text-muted truncate`}>
              {data.technicalName}
            </p>
          </>
        ) : (
          <>
            <h3 className={`${compact ? 'text-[10px]' : 'text-xs'} font-mono font-medium text-flow-text leading-tight mb-0.5 break-all`}>
              {data.technicalName}
            </h3>
            {data.businessName && (
              <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-flow-accent mb-1.5`}>
                {data.businessName}
              </p>
            )}
            {/* Runtime stats row */}
            {showRuntimeStats && (
              <div className="flex items-center gap-2 text-[10px] text-flow-text-muted">
              {data.avgDurationMs !== undefined && (
                <span>{data.avgDurationMs}ms</span>
              )}
              {data.callsPerHour !== undefined && (
                <span>{data.callsPerHour.toLocaleString()}/hr</span>
              )}
              {data.errorRate !== undefined && (
                <span className={data.errorRate > 1 ? 'text-flow-error' : ''}>
                  {data.errorRate}% err
                </span>
              )}
              </div>
            )}
          </>
        )}

        {/* Used-in flows indicator */}
        {showSharedFlows && data.usedInFlows && data.usedInFlows.length > 1 && (
          <div className="mt-2 pt-1.5 border-t border-flow-border-subtle">
            <span className="text-[10px] text-flow-text-muted">
              Shared across {data.usedInFlows.length} flows
            </span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="!bg-flow-border !border-flow-surface !w-2 !h-2 !rounded-md" />
      <Handle type="source" position={Position.Bottom} className="!bg-flow-border !border-flow-surface !w-2 !h-2 !rounded-md" />
    </div>
  );
}

export default memo(FlowNodeComponent);
