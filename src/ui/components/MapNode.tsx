import type { CampaignNode } from '../../config/campaign';

interface MapNodeProps {
  node: CampaignNode;
  isCurrent: boolean;
  isAvailable: boolean;
  isCompleted: boolean;
  onClick?: () => void;
}

export function MapNode({ node, isCurrent, isAvailable, isCompleted, onClick }: MapNodeProps) {
  const getNodeColor = () => {
    if (isCurrent) return '#fbbf24';
    if (isCompleted) return '#4ade80';
    if (isAvailable) return '#3b82f6';
    return '#6b7280';
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'boss':
        return '👑';
      case 'battle':
        return '⚔️';
      case 'evolution':
        return '✨';
      case 'event':
        return '📋';
      default:
        return '•';
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: getNodeColor(),
        borderRadius: '8px',
        cursor: isAvailable && onClick ? 'pointer' : 'default',
        border: isCurrent ? '3px solid #f59e0b' : '2px solid #1f2937',
        opacity: isAvailable || isCurrent || isCompleted ? 1 : 0.5,
        transition: 'all 0.2s',
        minWidth: '120px',
        textAlign: 'center',
      }}
      onClick={isAvailable ? onClick : undefined}
    >
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{getNodeIcon()}</div>
      <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{node.name}</div>
    </div>
  );
}
