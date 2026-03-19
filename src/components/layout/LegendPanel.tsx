export default function LegendPanel() {
  return (
    <div className="w-full border border-flow-border rounded-xl bg-flow-overlay/35 p-3">
      <div className="text-xs font-semibold text-flow-text mb-2">Visual Legend</div>

      <div className="space-y-1.5 text-[11px] text-flow-text-secondary">
        <LegendDot color="var(--color-flow-node-endpoint)" label="Endpoint Entry" />
        <LegendDot color="var(--color-flow-node-service)" label="Service" />
        <LegendDot color="var(--color-flow-node-method)" label="Public Method" />
        <LegendDot color="var(--color-flow-text-muted)" label="Private Method" />
        <LegendDot color="var(--color-flow-warning)" label="Decision Block" />
        <LegendDot color="var(--color-flow-node-database)" label="Database" />
        <LegendDot color="#ef4444" label="Redis/Cache" />
        <LegendDot color="var(--color-flow-node-topic)" label="Kafka Topic" />
      </div>

      <div className="mt-3 pt-2 border-t border-flow-border-subtle text-[11px] text-flow-text-secondary">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-8 h-px bg-flow-text-secondary" />
          Sync Call
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-8 h-px border-t border-dashed border-flow-text-secondary" />
          Async Call
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-px border-t border-dotted border-flow-text-secondary" />
          Kafka/Event
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

