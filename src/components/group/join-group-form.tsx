"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FootballIcon } from "@/components/icons/football-icons";
import { joinGroup } from "@/lib/actions/groups";

/**
 * Join group form component
 * Per 08-03-PLAN.md: 6-char uppercase input, validation, error handling
 * Mobile-first with prominent input field
 */
interface JoinGroupFormProps {
  onSuccess?: (group: { slug: string; name: string }) => void;
}

export function JoinGroupForm({ onSuccess }: JoinGroupFormProps) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useState<HTMLInputElement | null>(null)[0];

  // Auto-focus input on mount
  useEffect(() => {
    inputRef?.focus();
  }, [inputRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate format: 6 chars, alphanumeric
    if (inviteCode.length !== 6 || !/^[A-Z0-9]+$/i.test(inviteCode)) {
      setError("Le code doit contenir 6 caractères alphanumériques");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await joinGroup({ inviteCode: inviteCode.toUpperCase() });

      if (!result) {
        setError("Erreur lors de la recherche du groupe");
        toast.error("Erreur lors de la recherche du groupe");
        return;
      }

      if ("error" in result && result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if ("success" in result && result.success && result.data) {
        toast.success(`Bienvenue dans ${result.data.name} !`);

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          // Redirect to the group page
          router.push(`/group/${result.data.slug}`);
        }
      }
    } catch (err) {
      const errorMessage = "Erreur lors de la recherche du groupe";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Transform to uppercase automatically
    const value = e.target.value.toUpperCase();
    setInviteCode(value);
    if (error) setError(null);
  };

  return (
    <Card className="bg-chalk-pure shadow-card rounded-card p-6 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-sans text-xl font-semibold text-pitch">
          Rejoindre un groupe
        </h2>
        <p className="text-sm text-slate-mid mt-1">
          Entre le code d'invitation à 6 caractères
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invite code input */}
        <div className="space-y-2">
          <Label htmlFor="inviteCode" className="text-pitch">
            Code d'invitation
          </Label>
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id="inviteCode"
            name="inviteCode"
            type="text"
            placeholder="ABC123"
            value={inviteCode}
            onChange={handleInputChange}
            disabled={isSubmitting}
            required
            maxLength={6}
            className="h-14 text-center font-mono text-lg tracking-widest uppercase"
            aria-invalid={!!error}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-card/10 border border-red-card/20 rounded-card">
            <p className="text-sm text-red-card">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting || inviteCode.length !== 6}
          className="w-full h-12 bg-pitch text-white rounded-card hover:bg-pitch/90 transition-colors"
        >
          {isSubmitting ? (
            "Recherche..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              <FootballIcon name="boot" size={18} />
              Rejoindre
            </span>
          )}
        </Button>
      </form>
    </Card>
  );
}
