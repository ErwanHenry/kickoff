"use client";

import { useState } from "react";
import { RatingForm } from "@/components/rating/rating-form";
import { GuestRatingSuccess } from "@/components/rating/guest-rating-success";
import { FootballIcon } from "@/components/icons/football-icons";
import { Card } from "@/components/ui/card";

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface ExistingRating {
  ratedId: string;
  technique: number;
  physique: number;
  collectif: number;
  comment?: string;
}

interface GuestRatingWrapperProps {
  matchId: string;
  shareToken: string;
  players: Player[];
  existingRatings: ExistingRating[];
  submitRatings: (formData: FormData) => Promise<{
    error?: string;
    success?: boolean;
    matchId?: string;
    ratingsCount?: number;
  }>;
  ratingProgress?: {
    raters: number;
    confirmed: number;
    percentage: number;
    isRated: boolean;
  };
}

/**
 * Wrapper component for guest rating flow
 * Handles the transition from rating form to success CTA
 * Per PLAN 07-02 Task 1 requirements
 */
export function GuestRatingWrapper({
  matchId,
  shareToken,
  players,
  existingRatings,
  submitRatings,
  ratingProgress,
}: GuestRatingWrapperProps) {
  const [ratedCount, setRatedCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingSuccess = (count: number) => {
    setRatedCount(count);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <GuestRatingSuccess ratedCount={ratedCount} />;
  }

  return (
    <RatingForm
      matchId={matchId}
      shareToken={shareToken}
      players={players}
      existingRatings={existingRatings}
      isGuest={true}
      submitRatings={submitRatings}
      ratingProgress={ratingProgress}
      onRatingSuccess={handleRatingSuccess}
    />
  );
}
