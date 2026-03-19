import { Briefcase, Code2 } from 'lucide-react';
import { useFlowStore } from '@/stores/flowStore';

export default function ViewToggle() {
  const viewMode = useFlowStore((s) => s.viewMode);
  const setViewMode = useFlowStore((s) => s.setViewMode);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center bg-flow-surface/90 backdrop-blur-md border border-flow-border rounded-lg shadow-lg shadow-black/40 overflow-hidden">
        <button
          onClick={() => setViewMode('business')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-all ${
            viewMode === 'business'
              ? 'bg-flow-accent text-white'
              : 'text-flow-text-secondary hover:text-flow-text hover:bg-flow-hover'
          }`}
        >
          <Briefcase size={13} />
          Business
        </button>
        <div className="w-px h-5 bg-flow-border" />
        <button
          onClick={() => setViewMode('engineering')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-all ${
            viewMode === 'engineering'
              ? 'bg-flow-accent text-white'
              : 'text-flow-text-secondary hover:text-flow-text hover:bg-flow-hover'
          }`}
        >
          <Code2 size={13} />
          Engineering
        </button>
      </div>
    </div>
  );
}
