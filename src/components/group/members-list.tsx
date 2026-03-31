import { FootballIcon } from "@/components/icons/football-icons";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GroupMemberEntry } from "@/lib/db/queries/groups";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MembersListProps {
  members: GroupMemberEntry[];
}

/**
 * MembersList component - Server Component
 * Displays all group members with roles and join dates
 *
 * Mobile-first layout with avatars, role badges, and profile links
 */
export function MembersList({ members }: MembersListProps) {
  // Get role badge styling
  const getRoleBadge = (role: 'captain' | 'manager' | 'player') => {
    switch (role) {
      case 'captain':
        return { bg: 'bg-lime-glow', text: 'text-lime-dark', label: 'Capitaine' };
      case 'manager':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Manager' };
      case 'player':
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Joueur' };
    }
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-chalk-pure shadow-card rounded-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FootballIcon name="cornerFlag" size={20} className="text-pitch" />
        <h2 className="text-lg font-semibold font-sans">
          Membres ({members.length})
        </h2>
      </div>

      {/* Empty state */}
      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-mid">Aucun membre</p>
        </div>
      )}

      {/* Members list */}
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((member) => {
            const roleBadge = getRoleBadge(member.role);
            const initials = getInitials(member.name);
            const joinedDate = format(new Date(member.joinedAt), 'MMM yyyy', { locale: fr });

            return (
              <Link
                key={member.id}
                href={`/player/${member.id}`}
                className="block hover:bg-chalk rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 py-2 px-3">
                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-pitch text-lime font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium truncate text-pitch">
                      {member.name}
                    </p>
                  </div>

                  {/* Role badge */}
                  <Badge className={`${roleBadge.bg} ${roleBadge.text} gap-1`}>
                    <FootballIcon name="jersey" size={12} />
                    {roleBadge.label}
                  </Badge>

                  {/* Joined date */}
                  <div className="w-24 font-mono text-xs text-slate-mid text-right">
                    depuis {joinedDate}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      {members.length > 0 && (
        <p className="text-xs text-slate-mid mt-4 text-center">
          {members.length} membre{members.length > 1 ? "s" : ""} dans le groupe
        </p>
      )}
    </div>
  );
}
