import { Activity, AlertTriangle, GitBranch, Clock, Pause, Play } from 'lucide-react';
import { useFlowStore } from '@/stores/flowStore';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { RuntimeSnapshot } from '@/lib/fcsApi';

interface BottomBarProps {
  runtime: RuntimeSnapshot;
  isReplaying: boolean;
  onToggleReplay: () => void;
}

export default function BottomBar({ runtime, isReplaying, onToggleReplay }: BottomBarProps) {
  const replaySpeed = useFlowStore((s) => s.replaySpeed);
  const setReplaySpeed = useFlowStore((s) => s.setReplaySpeed);

  const speeds: Array<0.5 | 1 | 2> = [0.5, 1, 2];

  return (
    <div className="shrink-0">
      <div className="flex items-center gap-3 bg-flow-surface/90 border border-flow-border rounded-lg px-2 py-1.5">
        <StatCard icon={<Activity size={13} />} value={runtime.requestsPerHour.toLocaleString()} label="requests/hr" color="text-flow-success" />
        <Divider />
        <StatCard icon={<AlertTriangle size={13} />} value={runtime.errorsPerHour.toLocaleString()} label="errors/hr" color="text-flow-error" />
        <Divider />
        <StatCard icon={<GitBranch size={13} />} value={runtime.activeFlows.toLocaleString()} label="flows" color="text-flow-accent" />
        <Divider />
        <StatCard icon={<Clock size={13} />} value={`${runtime.avgLatencyMs}ms`} label="avg latency" color="text-flow-text-secondary" />
        <Divider />
        <div className="flex items-center gap-2 px-2">
          <Badge variant="neutral">Replay</Badge>
          <Select
            aria-label="Replay speed"
            value={replaySpeed}
            onChange={(event) => setReplaySpeed(Number(event.target.value) as 0.5 | 1 | 2)}
          >
            {speeds.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </Select>
          <Button variant={isReplaying ? 'primary' : 'secondary'} size="sm" onClick={onToggleReplay}>
            {isReplaying ? <Pause size={12} /> : <Play size={12} />}
            {isReplaying ? 'Pause' : 'Play'}
          </Button>
          <Badge variant={runtime.source === 'live' ? 'success' : 'info'}>
            {runtime.source === 'live' ? 'live' : 'derived'}
          </Badge>
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
