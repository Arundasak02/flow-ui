import { Activity, AlertTriangle, GitBranch, Clock } from 'lucide-react';
import { useFlowStore } from '@/stores/flowStore';

export default function BottomBar() {
  const replaySpeed = useFlowStore((s) => s.replaySpeed);
  const setReplaySpeed = useFlowStore((s) => s.setReplaySpeed);

  const speeds: Array<0.5 | 1 | 2> = [0.5, 1, 2];

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-3 bg-flow-surface/90 border border-flow-border rounded-lg px-2 py-1.5">
        <StatCard icon={<Activity size={13} />} value="12,847" label="requests/hr" color="text-flow-success" />
        <Divider />
        <StatCard icon={<AlertTriangle size={13} />} value="3" label="errors/hr" color="text-flow-error" />
        <Divider />
        <StatCard icon={<GitBranch size={13} />} value="16" label="flows" color="text-flow-accent" />
        <Divider />
        <StatCard icon={<Clock size={13} />} value="22ms" label="avg latency" color="text-flow-text-secondary" />
        <Divider />
        <div className="flex items-center gap-1 px-2">
          <span className="text-[10px] text-flow-text-muted">Speed</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setReplaySpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                replaySpeed === s
                  ? 'border-flow-accent bg-flow-accent/20 text-flow-text'
                  : 'border-flow-border text-flow-text-secondary hover:text-flow-text hover:border-flow-accent/50'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-flow-hover rounded transition-colors">
      <div className={color}>{icon}</div>
      <div>
        <div className={`text-sm font-semibold ${color}`}>{value}</div>
        <div className="text-[10px] text-flow-text-muted">{label}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-flow-border" />;
}
