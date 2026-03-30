'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/team-balancer';

interface DraggablePlayerCardProps {
  player: Player;
  team: 'A' | 'B';
  isDragging?: boolean;
}

export function DraggablePlayerCard({ player, team, isDragging }: DraggablePlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `${team}-${player.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate player score for display
  const playerScore = ((Number(player.avgTechnique) || 3.0) * 0.4 +
                       (Number(player.avgPhysique) || 3.0) * 0.3 +
                       (Number(player.avgCollectif) || 3.0) * 0.3).toFixed(1);

  // Get initials for avatar
  const initials = player.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-manipulation', // Prevents scroll on drag
        isSortableDragging && 'opacity-50'
      )}
    >
      <Card
        className={cn(
          'p-3 cursor-grab active:cursor-grabbing',
          'hover:shadow-md transition-shadow',
          'border-l-4',
          team === 'A' ? 'border-l-blue-500' : 'border-l-red-500'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
            team === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
          )}>
            {initials}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {player.name}
            </p>
            <p className="text-xs text-gray-500">
              Score: {playerScore}
              {player.totalRatings === 0 && ' • Nouveau'}
            </p>
          </div>

          {/* Drag handle indicator */}
          <div className="text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
}
