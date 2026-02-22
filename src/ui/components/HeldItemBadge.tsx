import { ITEM_DEFS } from '../../data/items';
import { HeldItemMotif } from './HeldItemMotif';

/**
 * HeldItemBadge — renders the held-item SVG motif directly, no wrapper.
 */

interface Props {
  itemId: string;
  size?: number;
}

export function HeldItemBadge({ itemId, size = 56 }: Props) {
  const def = ITEM_DEFS[itemId];
  if (!def) return null;

  return <HeldItemMotif itemId={itemId} size={size} />;
}
