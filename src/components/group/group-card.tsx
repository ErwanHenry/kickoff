import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FootballIcon } from "@/components/icons/football-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

/**
 * Group card component data structure
 */
export type GroupCardData = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  role: "captain" | "manager" | "player";
  createdAt: Date;
  inviteCode: string;
};

/**
 * GroupCard component
 * Displays group summary in a compact card format
 * Per 08-03-PLAN.md: Mobile-first, hover effect, role badge
 */
export function GroupCard({ group }: { group: GroupCardData }) {
  // Format date: "depuis janv. 2024"
  const formattedDate = format(new Date(group.createdAt), "MMM yyyy", {
    locale: fr,
  });

  // Role badge styling
  const roleBadge = {
    captain: {
      bg: "bg-lime-glow",
      text: "text-lime-dark",
      label: "Capitaine",
    },
    manager: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Manager",
    },
    player: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      label: "Joueur",
    },
  }[group.role];

  return (
    <Link href={`/group/${group.slug}`}>
      <Card className="group hover:scale-[1.02] hover:shadow-card-hover transition-all duration-200 cursor-pointer shadow-card rounded-card bg-chalk-pure">
        <CardContent className="p-4">
          {/* Header row: name + role badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-sans font-semibold text-lg text-pitch truncate flex-1">
              {group.name}
            </h3>
            <Badge className={`${roleBadge.bg} ${roleBadge.text} flex-shrink-0 text-xs`}>
              {roleBadge.label}
            </Badge>
          </div>

          {/* Meta row: member count + created date */}
          <div className="flex items-center gap-4 mt-2 mb-3">
            {/* Member count */}
            <div className="flex items-center gap-1.5 text-sm text-slate-mid">
              <FootballIcon name="boot" size={14} className="flex-shrink-0" />
              <span className="font-mono">
                {group.memberCount} membre{group.memberCount > 1 ? "s" : ""}
              </span>
            </div>

            {/* Created date */}
            <div className="flex items-center text-xs text-slate-light font-mono">
              <span>depuis {formattedDate}</span>
            </div>
          </div>

          {/* Action row: link to group */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-lighter">
            <span className="text-whistle-blue text-sm font-medium group-hover:underline">
              Voir le groupe
            </span>
            <FootballIcon name="cornerFlag" size={16} className="text-slate-light group-hover:text-whistle-blue transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
