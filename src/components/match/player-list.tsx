import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Player {
  id: string;
  name: string;
  status: string;
  confirmedAt: Date | null;
}

interface PlayerListProps {
  players: Player[];
  confirmed: number;
  max: number;
  waitlistCount: number;
}

/**
 * Player list component for public match page
 * Displays confirmed players with avatars, progress ring, and status badge
 * Per 02-UI-SPEC.md "Player List" section
 */
export function PlayerList({ players, confirmed, max, waitlistCount }: PlayerListProps) {
  const isFull = confirmed >= max;
  const progress = (confirmed / max) * 100;
  const circumference = 2 * Math.PI * 16; // radius=16
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {confirmed}/{max} confirmés
          </CardTitle>

          {/* Status badge */}
          <Badge variant={isFull ? "destructive" : "default"} className="shrink-0">
            {isFull ? "Complet" : "Ouvert"}
          </Badge>
        </div>

        {/* Circular progress ring */}
        <div className="relative flex items-center gap-3 mt-2">
          <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            {/* Progress circle - accent color #4ADE80 */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#4ADE80"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </CardHeader>

      <CardContent>
        {players.length === 0 ? (
          // Empty state (per CONTEXT.md D-13)
          <div className="text-center py-8">
            <p className="text-muted-foreground">Soyez le premier à confirmer !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Confirmed players list (per CONTEXT.md D-11) */}
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10">
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{player.name}</p>
                  {player.confirmedAt && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(player.confirmedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Waitlist count (per CONTEXT.md D-12 - count only, no individual names) */}
        {waitlistCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              {waitlistCount} en liste d'attente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
