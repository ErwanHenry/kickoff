"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { matchCreateSchema, type MatchCreateInput } from "@/lib/validations/match";
import { createMatch } from "@/app/api/matches/actions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarDays, MapPin, Users, Settings } from "lucide-react";

/**
 * Match creation form component
 * Per CONTEXT.md D-01: Card sections layout (Quand ?, Où ?, Combien ?, Options)
 * Per 02-UI-SPEC.md: Mobile-first, 48px touch targets
 */
export function MatchForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MatchCreateInput>({
    resolver: zodResolver(matchCreateSchema) as any,
    defaultValues: {
      maxPlayers: 14,
      minPlayers: 10,
      recurrence: "none" as const,
    },
  });

  const watchDate = watch("date");

  // Calculate default deadline (2h before match)
  const getDefaultDeadline = () => {
    if (!watchDate) return "";
    const date = new Date(watchDate);
    date.setHours(date.getHours() - 2);
    return date.toISOString().slice(0, 16);
  };

  const onSubmit = async (data: MatchCreateInput, isDraft: boolean) => {
    setIsSubmitting(true);
    try {
      const result = await createMatch(data);

      if (!result) {
        toast.error("Erreur lors de la création du match");
        return;
      }

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      if ("id" in result) {
        if (isDraft) {
          toast.success("Brouillon enregistré");
          router.push(`/match/${result.id}`);
        } else {
          // Publish directly - this would need a publishMatch call
          // For now, redirect to match detail
          toast.success("Match créé avec succès");
          router.push(`/match/${result.id}`);
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la création du match");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (data: MatchCreateInput) => onSubmit(data, false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(handleFormSubmit)(e);
      }}
      className="space-y-4 max-w-md mx-auto w-full"
    >
      {/* Section: Quand ? */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Quand ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date et heure</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register("date")}
              className="h-12"
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">
              Deadline de confirmation
              <span className="text-muted-foreground font-normal ml-2">
                (2h avant le match par défaut)
              </span>
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              {...register("deadline")}
              className="h-12"
              aria-invalid={!!errors.deadline}
            />
            {errors.deadline && (
              <p className="text-sm text-destructive">
                {errors.deadline.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section: Où ? */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Où ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              placeholder="Ex: UrbanSoccer Nice"
              {...register("location")}
              className="h-12"
              aria-invalid={!!errors.location}
            />
            {errors.location && (
              <p className="text-sm text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre (optionnel)</Label>
            <Input
              id="title"
              placeholder="Ex: Foot du mardi"
              {...register("title")}
              className="h-12"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section: Combien ? */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Combien ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max joueurs</Label>
              <Input
                id="maxPlayers"
                type="number"
                min="6"
                max="22"
                {...register("maxPlayers", { valueAsNumber: true })}
                className="h-12"
                aria-invalid={!!errors.maxPlayers}
              />
              {errors.maxPlayers && (
                <p className="text-sm text-destructive">
                  {errors.maxPlayers.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPlayers">Min joueurs</Label>
              <Input
                id="minPlayers"
                type="number"
                min="4"
                max="20"
                {...register("minPlayers", { valueAsNumber: true })}
                className="h-12"
                aria-invalid={!!errors.minPlayers}
              />
              {errors.minPlayers && (
                <p className="text-sm text-destructive">
                  {errors.minPlayers.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recurrence">Récurrence</Label>
            <select
              id="recurrence"
              {...register("recurrence")}
              className="h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="none">One-shot</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
          </div>

          {/* Group select - deferred for future implementation */}
          <div className="space-y-2">
            <Label htmlFor="groupId">Groupe (optionnel)</Label>
            <Input
              id="groupId"
              type="text"
              placeholder="Non disponible pour le moment"
              disabled
              className="h-12 opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              L&apos;association de groupe sera disponible prochainement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={() => {
            handleSubmit((data) => onSubmit(data, true))();
          }}
          disabled={isSubmitting}
        >
          Enregistrer le brouillon
        </Button>
        <Button
          type="submit"
          variant="default"
          className="flex-1 h-12"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Création..." : "Publier"}
        </Button>
      </div>
    </form>
  );
}
