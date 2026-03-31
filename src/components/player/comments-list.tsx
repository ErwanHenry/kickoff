import { FootballIcon } from "@/components/icons/football-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CommentEntry } from "@/lib/db/queries/players";

interface CommentsListProps {
  comments: CommentEntry[];
  className?: string;
}

export function CommentsList({ comments, className }: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <div className={`bg-chalk-pure shadow-card rounded-card p-4 ${className || ""}`}>
        <h3 className="font-semibold">Commentaires reçus</h3>
        <p className="text-sm text-muted-foreground mb-4">10 derniers</p>
        <p className="text-center text-muted-foreground py-8">
          Aucun commentaire pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-chalk-pure shadow-card rounded-card p-4 ${className || ""}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold">Commentaires reçus</h3>
        <FootballIcon name="ball" size={16} className="text-lime" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">10 derniers</p>

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-chalk rounded-card p-3 space-y-2"
          >
            {/* Match context */}
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>
                {comment.matchTitle || "Match sans nom"}
              </span>
              <span>•</span>
              <span className="font-mono">
                {format(comment.matchDate, "d MMM yyyy", { locale: fr })}
              </span>
            </div>

            {/* Comment text */}
            <p className="text-sm text-foreground leading-relaxed">
              {comment.comment}
            </p>

            {/* Anonymous indicator icon */}
            <div className="flex items-center gap-1">
              <FootballIcon name="star" size={12} className="text-yellow-card" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
