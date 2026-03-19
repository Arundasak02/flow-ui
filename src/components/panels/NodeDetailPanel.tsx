import { X, ExternalLink, Clock, Activity, AlertTriangle, Edit3, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useFlowStore } from '@/stores/flowStore';
import type { FlowNodeData } from '@/types/graph';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const statusLabel: Record<string, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  error: 'Errors detected',
  inactive: 'Inactive',
};

const statusColor: Record<string, string> = {
  healthy: 'bg-flow-success',
  degraded: 'bg-flow-warning',
  error: 'bg-flow-error',
  inactive: 'bg-flow-text-muted',
};

export default function NodeDetailPanel() {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const selectNode = useFlowStore((s) => s.selectNode);
  const viewMode = useFlowStore((s) => s.viewMode);
  const nodeDataById = useFlowStore((s) => s.nodeDataById);
  const isReplaying = useFlowStore((s) => s.isReplaying);
  const activeTraceId = useFlowStore((s) => s.activeTraceId);
  const [techExpanded, setTechExpanded] = useState(false);

  const node = selectedNodeId ? nodeDataById[selectedNodeId] : null;
  if (!node) {
    return (
      <div className="border border-flow-border rounded-xl bg-flow-overlay/35 p-3">
        <h3 className="text-sm font-semibold text-flow-text mb-2">Inspector</h3>
        <p className="text-xs text-flow-text-muted">
          Select a node in the graph to inspect business meaning, runtime metrics, and technical details.
        </p>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  const d: FlowNodeData = node;

  return (
    <div data-testid="node-detail-panel" className="border border-flow-border rounded-xl bg-flow-surface overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-flow-surface border-b border-flow-border-subtle px-4 py-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {d.status && (
              <div className={`w-2 h-2 rounded-full ${statusColor[d.status]}`} />
            )}
            <Badge variant="neutral">{d.kind}</Badge>
            {d.status && (
              <span className="text-xs text-flow-text-muted uppercase tracking-wider">
                {statusLabel[d.status]}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-flow-text leading-tight">
            {viewMode === 'business' ? d.businessName : d.technicalName}
          </h2>
          <p className="text-xs text-flow-text-muted mt-0.5 font-mono truncate">
            {viewMode === 'business' ? d.technicalName : d.businessName}
          </p>
          {isReplaying && (
            <p className="text-[10px] text-flow-accent mt-1">
              Replaying {activeTraceId ?? 'trace'}
            </p>
          )}
        </div>
        <button onClick={() => selectNode(null)} className="p-1 rounded hover:bg-flow-hover text-flow-text-muted hover:text-flow-text transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Business Description */}
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-flow-text-secondary uppercase tracking-wider">
              Business Description
            </h3>
            <Button variant="ghost" size="sm" className="!h-6 !px-1.5 text-[10px]">
              <Edit3 size={10} />
              Edit
            </Button>
          </div>
          <p className="text-sm text-flow-text leading-relaxed">
            {d.businessDescription || 'No business description yet. Click Edit to add one.'}
          </p>
        </section>

        {/* Runtime Stats */}
        <section>
          <h3 className="text-xs font-semibold text-flow-text-secondary uppercase tracking-wider mb-2">
            Runtime
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-flow-overlay rounded-lg px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Clock size={10} className="text-flow-text-muted" />
                <span className="text-[10px] text-flow-text-muted">Avg</span>
              </div>
              <span className="text-sm font-semibold text-flow-text">{d.avgDurationMs ?? '—'}ms</span>
            </div>
            <div className="bg-flow-overlay rounded-lg px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Activity size={10} className="text-flow-text-muted" />
                <span className="text-[10px] text-flow-text-muted">Rate</span>
              </div>
              <span className="text-sm font-semibold text-flow-text">{d.callsPerHour?.toLocaleString() ?? '—'}/hr</span>
            </div>
            <div className="bg-flow-overlay rounded-lg px-3 py-2">
              <div className="flex items-center gap-1 mb-0.5">
                <AlertTriangle size={10} className="text-flow-text-muted" />
                <span className="text-[10px] text-flow-text-muted">Error</span>
              </div>
              <span className={`text-sm font-semibold ${(d.errorRate ?? 0) > 1 ? 'text-flow-error' : 'text-flow-text'}`}>
                {d.errorRate ?? 0}%
              </span>
            </div>
          </div>
          {d.lastExecuted && (
            <p className="text-[10px] text-flow-text-muted mt-1.5">Last executed: {d.lastExecuted}</p>
          )}
        </section>

        {/* Technical Detail (expandable) */}
        <section>
          <button
            onClick={() => setTechExpanded(!techExpanded)}
            className="flex items-center gap-1.5 w-full text-xs font-semibold text-flow-text-secondary uppercase tracking-wider hover:text-flow-text transition-colors"
          >
            {techExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Technical Detail
          </button>
          {techExpanded && (
            <div className="mt-2 space-y-2">
              {d.signature && (
                <div>
                  <span className="text-[10px] text-flow-text-muted">Signature</span>
                  <p className="text-xs font-mono text-flow-text bg-flow-overlay rounded px-2 py-1.5 mt-0.5 break-all">
                    {d.signature}
                  </p>
                </div>
              )}
              {d.path && (
                <div>
                  <span className="text-[10px] text-flow-text-muted">Path</span>
                  <p className="text-xs font-mono text-flow-text mt-0.5">
                    {d.httpMethod} {d.path}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Shared Across Flows */}
        {d.usedInFlows && d.usedInFlows.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-flow-text-secondary uppercase tracking-wider mb-2">
              Used In Flows
            </h3>
            <div className="space-y-1">
              {d.usedInFlows.map((flow) => (
                <button
                  key={flow}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-flow-hover transition-colors group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-flow-accent" />
                  <span className="text-xs text-flow-text-secondary group-hover:text-flow-text transition-colors">{flow}</span>
                  <ExternalLink size={10} className="ml-auto text-flow-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
