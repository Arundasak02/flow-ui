import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useFlowStore } from '@/stores/flowStore';
import { sampleNodes } from '@/lib/sampleData';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectNode = useFlowStore((s) => s.selectNode);
  const viewMode = useFlowStore((s) => s.viewMode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = query.length > 0
    ? sampleNodes.filter((n) => {
        const d = n.data;
        const haystack = `${d.businessName} ${d.businessDescription} ${d.technicalName} ${d.path ?? ''}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : [];

  return (
    <div className="absolute top-4 left-4 z-50">
      {/* Search trigger */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-2 bg-flow-surface/90 backdrop-blur-md border border-flow-border rounded-lg
                   hover:bg-flow-elevated hover:border-flow-accent/40 transition-all shadow-lg shadow-black/40 cursor-text group"
        style={{ minWidth: 280 }}
      >
        <Search size={15} className="text-flow-text-muted group-hover:text-flow-accent transition-colors" />
        <span className="text-sm text-flow-text-muted">Search services, methods, flows...</span>
        <kbd className="ml-auto text-[10px] text-flow-text-muted bg-flow-overlay px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Search dropdown */}
      {open && (
        <div className="absolute top-0 left-0 w-[400px]">
          <div className="bg-flow-surface/95 backdrop-blur-xl border border-flow-border rounded-lg shadow-2xl shadow-black/60 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-flow-border-subtle">
              <Search size={15} className="text-flow-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services, methods, flows..."
                className="flex-1 bg-transparent text-sm text-flow-text placeholder:text-flow-text-muted outline-none"
              />
              <button onClick={() => { setOpen(false); setQuery(''); }}>
                <X size={14} className="text-flow-text-muted hover:text-flow-text" />
              </button>
            </div>

            {filtered.length > 0 && (
              <div className="max-h-[320px] overflow-y-auto py-1">
                {filtered.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => { selectNode(node.id); setOpen(false); setQuery(''); }}
                    className="w-full text-left px-3 py-2 hover:bg-flow-hover transition-colors"
                  >
                    <div className="text-sm font-medium text-flow-text">
                      {viewMode === 'business' ? node.data.businessName : node.data.technicalName}
                    </div>
                    <div className="text-xs text-flow-text-muted truncate">
                      {viewMode === 'business' ? node.data.technicalName : node.data.businessName}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {query.length > 0 && filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-flow-text-muted">
                No results for "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
