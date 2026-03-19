import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import type { FlowEdgeData } from '@/types/graph';

function FlowEdgeComponent({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  markerEnd,
}: EdgeProps & { data?: FlowEdgeData }) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const isActive = data?.isOnActivePath;
  const isDimmed = data?.isDimmed;
  const edgeType = data?.edgeType ?? 'sync';

  const edgeStyleByType = {
    sync: {
      strokeDasharray: undefined,
      opacity: 1,
    },
    async: {
      strokeDasharray: '6 4',
      opacity: 0.9,
    },
    kafka: {
      strokeDasharray: '2 3',
      opacity: 1,
    },
    db: {
      strokeDasharray: undefined,
      opacity: 0.9,
    },
  }[edgeType];

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isActive ? 'var(--color-flow-accent)' : 'var(--color-flow-border)',
          strokeWidth: isActive ? 2.5 : 1.5,
          filter: isActive ? 'drop-shadow(0 0 6px var(--color-flow-glow))' : 'none',
          transition: 'stroke 0.3s, stroke-width 0.3s, filter 0.3s',
          strokeDasharray: edgeStyleByType.strokeDasharray,
          opacity: isDimmed ? 0.2 : edgeStyleByType.opacity,
        }}
      />
      {/* Animated packet dot on active edges */}
      {isActive && (
        <circle r="4" fill="var(--color-flow-packet)" className="animate-packet">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

export default memo(FlowEdgeComponent);
