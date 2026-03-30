"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, AlertTriangle } from "lucide-react";

interface Player {
  id: string;
  name: string;
  team: "A" | "B" | null;
}

interface AttendanceFormProps {
  players: Player[];
  matchId: string;
  closeMatchAction: (formData: FormData) => Promise<{ error?: string; success?: boolean; matchId?: string }>;
}

export function AttendanceForm({ players, matchId, closeMatchAction }: AttendanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  // State management (per CONTEXT.md D-02: all present by default)
  const [attendance, setAttendance] = useState<Map<string, boolean>>(
    new Map(players.map((p) => [p.id, true]))
  );
  const [scoreTeamA, setScoreTeamA] = useState(0);
  const [scoreTeamB, setScoreTeamB] = useState(0);
  const [matchSummary, setMatchSummary] = useState("");

  // Validation state
  const isScoreValid = scoreTeamA >= 0 && scoreTeamB >= 0;
  const isAttendanceComplete = attendance.size === players.length;
  const canSubmit = isScoreValid && isAttendanceComplete && !isPending;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
      .padEnd(2, "?");
  };

  // Toggle player attendance
  const togglePlayer = (playerId: string) => {
    setAttendance((prev) => {
      const next = new Map(prev);
      next.set(playerId, !next.get(playerId));
      return next;
    });
  };

  // Mark all players as present (quick action per UI-SPEC.md)
  const markAllPresent = () => {
    setAttendance(new Map(players.map((p) => [p.id, true])));
  };

  // Get marked count for progress indicator
  const markedCount = attendance.size;
  const presentCount = Array.from(attendance.values()).filter(Boolean).length;
  const absentCount = markedCount - presentCount;

  // Group players by team
  const teamAPlayers = players.filter((p) => p.team === "A");
  const teamBPlayers = players.filter((p) => p.team === "B");
  const noTeamPlayers = players.filter((p) => !p.team);

  // Render player row
  const PlayerRow = ({ player }: { player: Player }) => {
    const isPresent = attendance.get(player.id) ?? true;

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        <Avatar className="h-10 w-10 shrink-0">
          <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
            {getInitials(player.name)}
          </div>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              !isPresent ? "line-through text-muted-foreground" : ""
            }`}
          >
            {player.name}
          </p>
          {player.team && (
            <Badge variant="outline" className="text-xs mt-0.5">
              Équipe {player.team}
            </Badge>
          )}
        </div>

        <Switch
          checked={isPresent}
          onCheckedChange={() => togglePlayer(player.id)}
          disabled={isPending}
          className="shrink-0"
          aria-label={`Marquer ${player.name} comme présent ou absent`}
        />

        {!isPresent && (
          <div className="flex items-center gap-1 text-xs text-destructive shrink-0">
            <AlertTriangle className="h-3 w-3" />
            <span className="hidden sm:inline">no_show</span>
          </div>
        )}
      </div>
    );
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  // Confirm and submit
  const confirmSubmit = () => {
    const formData = new FormData();
    formData.append("matchId", matchId);
    formData.append("scoreTeamA", scoreTeamA.toString());
    formData.append("scoreTeamB", scoreTeamB.toString());
    if (matchSummary.trim()) {
      formData.append("matchSummary", matchSummary.trim());
    }
    formData.append(
      "attendance",
      JSON.stringify(
        Array.from(attendance.entries()).map(([playerId, present]) => ({
          playerId,
          present,
        }))
      )
    );

    startTransition(async () => {
      const result = await closeMatchAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Match clôturé ! Les joueurs peuvent maintenant noter leurs coéquipiers.");
        router.push(`/match/${matchId}`);
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Score section (per UI-SPEC.md) */}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <h2 className="text-lg font-semibold mb-3">Score du match</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <label htmlFor="scoreTeamA" className="text-sm font-medium">
                Équipe A
              </label>
              <Input
                id="scoreTeamA"
                type="number"
                min={0}
                max={99}
                step={1}
                value={scoreTeamA}
                onChange={(e) => setScoreTeamA(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                disabled={isPending}
                className="w-16 text-center text-lg"
                aria-label="Score de l'équipe A"
              />
            </div>

            <span className="text-2xl font-bold text-muted-foreground">-</span>

            <div className="flex flex-col items-center gap-1">
              <label htmlFor="scoreTeamB" className="text-sm font-medium">
                Équipe B
              </label>
              <Input
                id="scoreTeamB"
                type="number"
                min={0}
                max={99}
                step={1}
                value={scoreTeamB}
                onChange={(e) => setScoreTeamB(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                disabled={isPending}
                className="w-16 text-center text-lg"
                aria-label="Score de l'équipe B"
              />
            </div>
          </div>
        </Card>

        {/* Attendance list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Présence</h3>
              <p className="text-sm text-muted-foreground">
                {markedCount}/{players.length} joueurs marqués • {presentCount} présents • {absentCount} absents
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllPresent}
              disabled={isPending}
            >
              Tous présents
            </Button>
          </div>

          <div className="space-y-3">
            {/* Team A */}
            {teamAPlayers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Équipe A</h4>
                {teamAPlayers.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </div>
            )}

            {/* Team B */}
            {teamBPlayers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Équipe B</h4>
                {teamBPlayers.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </div>
            )}

            {/* No team */}
            {noTeamPlayers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Sans équipe</h4>
                {noTeamPlayers.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Match summary (per UI-SPEC.md) */}
        <div className="space-y-2">
          <label htmlFor="matchSummary" className="text-sm font-medium">
            Résumé du match <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <Textarea
            id="matchSummary"
            placeholder="Moments forts, MVP, remarques..."
            value={matchSummary}
            onChange={(e) => setMatchSummary(e.target.value)}
            disabled={isPending}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {matchSummary.length}/500
          </p>
        </div>
      </div>

      {/* Sticky submit button (per D-18) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom z-10">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isPending ? "Clôture en cours..." : "Clôturer le match"}
        </Button>
      </div>

      {/* Confirmation dialog (per D-14) */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer le match</DialogTitle>
            <DialogDescription>
              Tu vas clôturer ce match. Les joueurs absents recevront le statut &apos;no_show&apos;. Continuer ?
            </DialogDescription>
          </DialogHeader>

          {absentCount > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{absentCount} joueur(s) absent(s)</p>
                <p className="text-xs opacity-90">
                  Ils recevront le statut &apos;no_show&apos; qui affectera leur taux de présence.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmSubmit}
              disabled={isPending}
            >
              Oui, clôturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
