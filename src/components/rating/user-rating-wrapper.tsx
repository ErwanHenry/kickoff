"use client";

import { useState } from "react";
import { RatingForm } from "@/components/rating/rating-form";
import { UserRatingSuccess } from "@/components/rating/user-rating-success";
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

interface UserRatingWrapperProps {
  matchId: string;
  userId: string;
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
 * Wrapper component for user rating flow
 * Handles the transition from rating form to success CTA
 * Per PLAN 07-02 Task 2 requirements
 */
export function UserRatingWrapper({
  matchId,
  userId,
  players,
  existingRatings,
  submitRatings,
  ratingProgress,
}: UserRatingWrapperProps) {
  const [ratedCount, setRatedCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRatingSuccess = (count: number) => {
    setRatedCount(count);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <UserRatingSuccess ratedCount={ratedCount} userId={userId} />;
  }

  return (
    <RatingForm
      matchId={matchId}
      players={players}
      existingRatings={existingRatings}
      isGuest={false}
      submitRatings={submitRatings}
      ratingProgress={ratingProgress}
      onRatingSuccess={handleRatingSuccess}
    />
  );
}
