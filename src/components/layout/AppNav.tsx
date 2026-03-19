import { Info, LogIn, Sparkles } from 'lucide-react';

export default function AppNav() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-flow-surface/90 backdrop-blur-md border border-flow-border rounded-lg shadow-lg shadow-black/40 px-2 py-1.5">
        <NavButton icon={<Sparkles size={13} />} label="About" />
        <NavButton icon={<Info size={13} />} label="Info" />
        <NavButton icon={<LogIn size={13} />} label="Login" />
      </div>
    </div>
  );
}

function NavButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-flow-text-secondary hover:text-flow-text hover:bg-flow-hover transition-colors">
      {icon}
      <span>{label}</span>
    </button>
  );
}

