export default function FlowLogo() {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2.5 bg-flow-surface/90 backdrop-blur-md border border-flow-border rounded-lg shadow-lg shadow-black/40 px-3 py-2">
      {/* Logo mark */}
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path
            d="M12 3L12 9M12 9L7 14M12 9L17 14M7 14L7 21M17 14L17 21"
            stroke="var(--color-flow-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="3" r="2" fill="var(--color-flow-accent)" />
          <circle cx="7" cy="14" r="2" fill="var(--color-flow-node-service)" />
          <circle cx="17" cy="14" r="2" fill="var(--color-flow-node-service)" />
          <circle cx="7" cy="21" r="1.5" fill="var(--color-flow-node-database)" />
          <circle cx="17" cy="21" r="1.5" fill="var(--color-flow-node-topic)" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-bold text-flow-text tracking-tight">Flow</div>
        <div className="text-[9px] text-flow-text-muted tracking-wider uppercase">order-service</div>
      </div>
    </div>
  );
}
