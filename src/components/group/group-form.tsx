"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FootballIcon } from "@/components/icons/football-icons";
import { createGroup } from "@/lib/actions/groups";
import { cn } from "@/lib/utils";

/**
 * Group creation form component
 * Per 08-01-PLAN.md: Mobile-first, max-w-md, name input with slug preview
 * Per CLAUDE.md: FootballIcon name="cornerFlag" for group-related UI
 */
export function GroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate slug preview from name in real-time
  const slugPreview = useMemo(() => {
    if (!name.trim()) return "";
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens;
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom du groupe est requis");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createGroup({ name });

      if (!result) {
        setError("Erreur lors de la création du groupe");
        toast.error("Erreur lors de la création du groupe");
        return;
      }

      if ("error" in result && result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if ("success" in result && result.success && result.data) {
        toast.success("Groupe créé avec succès !");

        // Redirect to the new group page
        router.push(`/group/${result.data.slug}`);
      }
    } catch (err) {
      const errorMessage = "Erreur lors de la création du groupe";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto w-full"
    >
      <Card className="bg-chalk-pure shadow-card rounded-card p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="font-sans text-xl font-semibold text-pitch">
            Créer un groupe
          </h2>
          <p className="text-sm text-slate-mid mt-1">
            Crée un groupe pour organiser des matchs récurrents avec tes potes
          </p>
        </div>

        {/* Name Input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="name" className="text-pitch">
            Nom du groupe
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Ex: Foot du mardi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-12"
            aria-invalid={!!error}
          />
        </div>

        {/* Slug Preview */}
        {slugPreview && (
          <div className="mb-4">
            <div className="text-sm text-slate-mid">
              Slug:{" "}
              <span className="font-mono text-pitch">{slugPreview}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-card/10 border border-red-card/20 rounded-card">
            <p className="text-sm text-red-card">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting || !name.trim()}
          className="w-full h-12 bg-pitch text-white rounded-card hover:bg-pitch/90 transition-colors"
        >
          {isSubmitting ? (
            "Création..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              <FootballIcon name="cornerFlag" size={18} />
              Créer le groupe
            </span>
          )}
        </Button>
      </Card>
    </form>
  );
}
