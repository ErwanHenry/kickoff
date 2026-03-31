"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JoinGroupForm } from "@/components/group/join-group-form";
import { GroupCard } from "@/components/group/group-card";
import { FootballIcon } from "@/components/icons/football-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UserGroup } from "@/lib/db/queries/groups";
import { Plus } from "lucide-react";

interface GroupsDashboardProps {
  userGroups: UserGroup[];
}

/**
 * Groups dashboard component
 * Per 08-03-PLAN.md: Mobile-first, create/join actions, group cards display
 * Shows user's groups separated by role (captain vs others)
 */
export function GroupsDashboard({ userGroups }: GroupsDashboardProps) {
  const router = useRouter();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  // Separate groups by role
  const captainGroups = userGroups.filter((g) => g.role === "captain");
  const otherGroups = userGroups.filter((g) => g.role !== "captain");

  const handleJoinSuccess = (group: { slug: string; name: string }) => {
    setIsJoinDialogOpen(false);
    router.push(`/group/${group.slug}`);
  };

  const hasGroups = userGroups.length > 0;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="font-sans text-2xl font-semibold text-pitch">
          Mes groupes
        </h1>
        <p className="text-sm text-slate-mid mt-1">
          Crée et rejoins des groupes pour organiser des matchs
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            asChild
            className="bg-pitch text-white hover:bg-pitch/90"
          >
            <Link href="/dashboard/groups/new">
              <FootballIcon name="cornerFlag" size={16} className="mr-2" />
              Créer un groupe
            </Link>
          </Button>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-pitch text-pitch hover:bg-pitch/5">
                <FootballIcon name="boot" size={16} className="mr-2" />
                Rejoindre un groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Rejoindre un groupe</DialogTitle>
                <DialogDescription>
                  Entre le code d'invitation à 6 caractères pour rejoindre un groupe
                </DialogDescription>
              </DialogHeader>
              <JoinGroupForm onSuccess={handleJoinSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Groups section */}
      {!hasGroups ? (
        /* Empty state */
        <Card className="bg-chalk-pure shadow-card rounded-card">
          <CardContent className="p-8 text-center">
            <FootballIcon name="cornerFlag" size={48} className="mx-auto mb-4 text-slate-light" />
            <h3 className="font-sans text-lg font-semibold text-pitch mb-2">
              Aucun groupe
            </h3>
            <p className="text-sm text-slate-mid mb-6">
              Crée ton premier groupe ou rejoins-en un pour commencer à organiser des matchs
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-pitch text-white hover:bg-pitch/90"
              >
                <Link href="/dashboard/groups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un groupe
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsJoinDialogOpen(true)}
                className="border-pitch text-pitch hover:bg-pitch/5"
              >
                Rejoindre un groupe
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Captain groups section */}
          {captainGroups.length > 0 && (
            <section>
              <h2 className="font-sans text-lg font-semibold text-pitch mt-6 mb-4">
                Mes groupes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {captainGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </section>
          )}

          {/* Other groups section */}
          {otherGroups.length > 0 && (
            <section>
              <h2 className="font-sans text-lg font-semibold text-pitch mt-6 mb-4">
                Autres groupes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// Import Link at the bottom for client component
import { Link } from "next/link";
