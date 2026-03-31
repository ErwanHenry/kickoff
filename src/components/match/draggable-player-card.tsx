'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { FootballIcon } from '@/components/icons/football-icons';
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

  // Team colors from design system
  const teamColors = team === 'A'
    ? { bg: 'bg-team-a', text: 'text-team-a', border: 'border-l-team-a' }
    : { bg: 'bg-team-b', text: 'text-team-b', border: 'border-l-team-b' };

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
          'hover:shadow-card-hover transition-shadow',
          'border-l-4 rounded-card',
          teamColors.border
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
            teamColors.bg,
            teamColors.text
          )}>
            {initials}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">
              {player.name}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Score: {playerScore}
              {player.totalRatings === 0 && (
                <span className="ml-2 text-lime-dark bg-lime-glow px-1.5 py-0.5 rounded-badge text-xs">
                  Nouveau
                </span>
              )}
            </p>
          </div>

          {/* Drag handle indicator */}
          <div className="text-slate-400">
            <FootballIcon name="jersey" size={16} />
          </div>
        </div>
      </Card>
    </div>
  );
}
