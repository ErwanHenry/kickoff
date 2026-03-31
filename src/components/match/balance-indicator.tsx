'use client';

import { Badge } from '@/components/ui/badge';
import { FootballIcon } from '@/components/icons/football-icons';
import { cn } from '@/lib/utils';

interface BalanceIndicatorProps {
  diff: number; // Absolute difference in total scores
  teamSize: number; // Number of players per team (for normalization)
  showDiff?: boolean; // Show numeric diff value
}

export function BalanceIndicator({ diff, teamSize, showDiff = true }: BalanceIndicatorProps) {
  // Normalize diff by team size (larger teams tolerate larger absolute diff)
  // Thresholds from plan: 0.15, 0.4
  const normalizedDiff = diff / teamSize;

  let label: string;
  let bgColor: string;
  let textColor: string;

  if (normalizedDiff < 0.15) {
    label = 'Équilibré ✓';
    bgColor = 'bg-lime-glow';
    textColor = 'text-lime-dark';
  } else if (normalizedDiff < 0.4) {
    label = 'Léger avantage';
    bgColor = 'bg-yellow-card';
    textColor = 'text-yellow-card';
  } else {
    label = 'Déséquilibré ⚠️';
    bgColor = 'bg-red-card';
    textColor = 'text-red-card';
  }

  return (
    <Badge
      className={cn(
        'text-sm font-medium px-3 py-1 rounded-badge flex items-center gap-1.5',
        bgColor,
        textColor
      )}
    >
      <FootballIcon name="ball" size={16} />
      {label}
      {showDiff && (
        <span className="ml-1 font-mono text-xs opacity-70">
          {diff.toFixed(1)}
        </span>
      )}
    </Badge>
  );
}
