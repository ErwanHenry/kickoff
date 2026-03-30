"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const magicLinkSchema = z.object({
  email: z.string().email("Email invalide"),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export function MagicLinkForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.magicLink({
        email: data.email,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        toast.error("Erreur", {
          description: result.error.message || "Impossible d'envoyer le lien",
        });
        return;
      }

      setEmailSent(true);
      toast.success("Lien envoye !", {
        description: "Verifie ta boite mail",
      });
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h3 className="font-semibold">Verifie ta boite mail</h3>
        <p className="text-sm text-muted-foreground">
          On a envoye un lien de connexion a{" "}
          <span className="font-medium">{getValues("email")}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Le lien expire dans 5 minutes
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="ton@email.com"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Envoi..." : "Recevoir un lien de connexion"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        On t'enverra un lien magique pour te connecter sans mot de passe
      </p>
    </form>
  );
}
