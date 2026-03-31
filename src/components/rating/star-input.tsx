"use client";

import { FootballIcon } from "@/components/icons/football-icons";
import { cn } from "@/lib/utils";

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

/**
 * Star Input component for rating players
 * Per PLAN 06-01 requirements: 44x44px touch targets, keyboard navigation
 * Uses FootballIcon name="star" per CLAUDE.md design system
 */
export function StarInput({
  value,
  onChange,
  label,
  disabled = false,
}: StarInputProps) {
  // Generate star indices (1-5)
  const stars = [1, 2, 3, 4, 5];

  // Handle click on a star
  const handleClick = (starValue: number) => {
    if (!disabled) {
      onChange(starValue);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    starValue: number
  ) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        onChange(Math.min(5, value + 1));
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        onChange(Math.max(1, value - 1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        onChange(starValue);
        break;
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-col gap-2", disabled && "opacity-50 pointer-events-none")}
    >
      {/* Label */}
      <label className="font-sans text-sm text-muted-foreground">
        {label}
      </label>

      {/* Stars row */}
      <div className="flex items-center gap-1">
        {stars.map((starValue) => {
          const isFilled = starValue <= value;

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={isFilled}
              aria-label={`${label} ${starValue}/5`}
              onClick={() => handleClick(starValue)}
              onKeyDown={(e) => handleKeyDown(e, starValue)}
              disabled={disabled}
              className={cn(
                // Touch target: 44x44px minimum
                "w-11 h-11 flex items-center justify-center",
                "transition-all duration-150 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-pitch focus:ring-offset-2",
                "hover:scale-110 active:scale-95",
                // Color states
                isFilled
                  ? "text-yellow-card" // Filled stars: yellow
                  : "text-slate-light", // Empty stars: slate light
                disabled && "pointer-events-none"
              )}
              tabIndex={disabled ? -1 : 0}
            >
              <FootballIcon
                name="star"
                size={44}
                className={cn(
                  "transition-colors duration-150",
                  isFilled && "fill-current"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
