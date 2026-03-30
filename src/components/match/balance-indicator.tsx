'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BalanceIndicatorProps {
  diff: number; // Absolute difference in total scores
  teamSize: number; // Number of players per team (for normalization)
  showDiff?: boolean; // Show numeric diff value
}

export function BalanceIndicator({ diff, teamSize, showDiff = true }: BalanceIndicatorProps) {
  // Normalize diff by team size (larger teams tolerate larger absolute diff)
  // Thresholds from RESEARCH.md "Code Examples" section
  const normalizedDiff = diff / teamSize;

  let label: string;
  let variant: 'default' | 'secondary' | 'destructive';
  let bgColor: string;

  if (normalizedDiff < 0.15) {
    label = 'Équilibré ✓';
    variant = 'default'; // Green in shadcn/ui
    bgColor = 'bg-green-100 text-green-800 border-green-200';
  } else if (normalizedDiff < 0.4) {
    label = 'Léger avantage';
    variant = 'secondary'; // Gray/yellow in shadcn/ui
    bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else {
    label = 'Déséquilibré ⚠️';
    variant = 'destructive'; // Red in shadcn/ui
    bgColor = 'bg-red-100 text-red-800 border-red-200';
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        'text-sm font-medium px-3 py-1',
        bgColor
      )}
    >
      {label}
      {showDiff && (
        <span className="ml-2 text-xs opacity-70">
          (diff: {diff.toFixed(1)})
        </span>
      )}
    </Badge>
  );
}
