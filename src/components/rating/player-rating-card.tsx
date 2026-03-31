"use client";

import { StarInput } from "./star-input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerRatingCardProps {
  player: {
    id: string;
    name: string;
    avatar?: string; // Initials
  };
  ratings: {
    technique: number;
    physique: number;
    collectif: number;
  };
  comment?: string;
  onChange: (axis: "technique" | "physique" | "collectif", value: number) => void;
  onCommentChange: (comment: string) => void;
  disabled?: boolean;
}

/**
 * Player Rating Card component
 * Per PLAN 06-01 requirements: mobile-first, 280 char limit, character counter
 * Composes StarInput for 3-axis rating (technique, physique, collectif)
 */
export function PlayerRatingCard({
  player,
  ratings,
  comment,
  onChange,
  onCommentChange,
  disabled = false,
}: PlayerRatingCardProps) {
  // Generate avatar initials from name
  const initials = player.avatar || player.name.slice(0, 2).toUpperCase();

  // Check if any rating is present (for visual feedback)
  const hasRating =
    ratings.technique > 0 || ratings.physique > 0 || ratings.collectif > 0;

  return (
    <Card
      className={cn(
        "bg-chalk-pure shadow-card rounded-card overflow-hidden",
        "transition-all duration-200",
        hasRating && "border-l-4 border-l-green-500"
      )}
    >
      <CardContent className="p-4">
        {/* Header: Avatar + Name */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar circle */}
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-pitch text-chalk-pure font-sans font-semibold text-sm"
            )}
          >
            {initials}
          </div>

          {/* Player name */}
          <h3 className="font-sans font-semibold text-slate-DEFAULT">{player.name}</h3>
        </div>

        {/* Rating axes */}
        <div className="flex flex-col gap-3">
          {/* Technique */}
          <StarInput
            label="TECHNIQUE"
            value={ratings.technique}
            onChange={(value) => onChange("technique", value)}
            disabled={disabled}
          />

          {/* Physique */}
          <StarInput
            label="PHYSIQUE"
            value={ratings.physique}
            onChange={(value) => onChange("physique", value)}
            disabled={disabled}
          />

          {/* Collectif */}
          <StarInput
            label="COLLECTIF"
            value={ratings.collectif}
            onChange={(value) => onChange("collectif", value)}
            disabled={disabled}
          />
        </div>

        {/* Comment section */}
        <div className="mt-4">
          <textarea
            value={comment || ""}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Un mot sur son match..."
            disabled={disabled}
            maxLength={280}
            rows={2}
            className={cn(
              "w-full resize-none font-sans text-sm",
              "bg-chalk rounded-lg border border-slate-light",
              "px-3 py-2",
              "focus:outline-none focus:ring-2 focus:ring-pitch",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "placeholder:text-slate-mid"
            )}
          />

          {/* Character counter */}
          <div className="flex justify-end mt-1">
            <span
              className={cn(
                "font-mono text-xs",
                (comment?.length ?? 0) >= 260
                  ? "text-red-card"
                  : "text-slate-mid"
              )}
            >
              {comment?.length ?? 0}/280
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
