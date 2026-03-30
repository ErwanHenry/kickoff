'use client';

import { useState, useTransition } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BalanceIndicator } from '@/components/match/balance-indicator';
import { DraggablePlayerCard } from '@/components/match/draggable-player-card';
import { reassignPlayer } from '@/lib/actions/teams';
import { toast } from 'sonner';
import type { Player } from '@/lib/team-balancer';
import type { BalanceResult } from '@/lib/team-balancer';

interface TeamRevealProps {
  matchId: string;
  initialTeams: BalanceResult;
  isLocked?: boolean;
}

export function TeamReveal({ matchId, initialTeams, isLocked = false }: TeamRevealProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Configure touch sensor for mobile (long press to drag)
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // Long press 250ms to drag
      tolerance: 8,
    },
  });

  const sensors = useSensors(touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Parse IDs: "A-playerId" or "B-playerId"
    const [fromTeam, playerId] = activeIdStr.split('-') as ['A' | 'B', string];
    const [toTeam] = overIdStr.split('-') as ['A' | 'B', string];

    if (fromTeam === toTeam) return; // Same team, no change

    // Optimistic UI update
    const player = fromTeam === 'A'
      ? teams.teamA.players.find(p => p.id === playerId)
      : teams.teamB.players.find(p => p.id === playerId);

    if (!player) return;

    const newTeamA = [...teams.teamA.players];
    const newTeamB = [...teams.teamB.players];

    // Remove from source team
    if (fromTeam === 'A') {
      const idx = newTeamA.findIndex(p => p.id === playerId);
      newTeamA.splice(idx, 1);
    } else {
      const idx = newTeamB.findIndex(p => p.id === playerId);
      newTeamB.splice(idx, 1);
    }

    // Add to target team
    if (toTeam === 'A') {
      newTeamA.push(player);
    } else {
      newTeamB.push(player);
    }

    // Recalculate scores
    const scoreA = newTeamA.reduce((sum, p) => sum + (Number(p.avgTechnique) || 3.0) * 0.4 + (Number(p.avgPhysique) || 3.0) * 0.3 + (Number(p.avgCollectif) || 3.0) * 0.3, 0);
    const scoreB = newTeamB.reduce((sum, p) => sum + (Number(p.avgTechnique) || 3.0) * 0.4 + (Number(p.avgPhysique) || 3.0) * 0.3 + (Number(p.avgCollectif) || 3.0) * 0.3, 0);

    setTeams({
      teamA: { players: newTeamA, totalScore: scoreA, playerCount: newTeamA.length },
      teamB: { players: newTeamB, totalScore: scoreB, playerCount: newTeamB.length },
      diff: Math.abs(scoreA - scoreB),
      algorithm: teams.algorithm,
    });

    // Persist change server-side
    startTransition(async () => {
      const result = await reassignPlayer({ matchId, playerId, fromTeam, toTeam });
      if (result.error) {
        toast.error(result.error);
        // Revert on error
        setTeams(teams);
      }
    });
  };

  const activePlayer = activeId
    ? [...teams.teamA.players, ...teams.teamB.players].find(
        p => `${activeId}`.includes(p.id)
      )
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Balance indicator */}
        <div className="flex justify-center">
          <BalanceIndicator
            diff={teams.diff}
            teamSize={Math.max(teams.teamA.playerCount, teams.teamB.playerCount)}
          />
        </div>

        {/* Teams grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-lg text-blue-700">Équipe A</h3>
              <p className="text-sm text-gray-500">
                Score: {teams.teamA.totalScore.toFixed(1)} • {teams.teamA.playerCount} joueurs
              </p>
            </div>
            <SortableContext
              id="team-a"
              items={teams.teamA.players.map(p => `A-${p.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {teams.teamA.players.map(player => (
                  <DraggablePlayerCard
                    key={`A-${player.id}`}
                    player={player}
                    team="A"
                  />
                ))}
              </div>
            </SortableContext>
          </Card>

          {/* Team B */}
          <Card className="p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-lg text-red-700">Équipe B</h3>
              <p className="text-sm text-gray-500">
                Score: {teams.teamB.totalScore.toFixed(1)} • {teams.teamB.playerCount} joueurs
              </p>
            </div>
            <SortableContext
              id="team-b"
              items={teams.teamB.players.map(p => `B-${p.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {teams.teamB.players.map(player => (
                  <DraggablePlayerCard
                    key={`B-${player.id}`}
                    player={player}
                    team="B"
                  />
                ))}
              </div>
            </SortableContext>
          </Card>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activePlayer && (
            <div className="rotate-3 scale-105 shadow-xl">
              <DraggablePlayerCard player={activePlayer} team="A" isDragging />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
