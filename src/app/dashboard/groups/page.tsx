import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUserGroups } from "@/lib/db/queries/groups";
import { GroupsDashboard } from "@/components/group/groups-dashboard";

export const metadata = {
  title: "Mes groupes - kickoff",
  description: "Gère tes groupes de foot",
};

/**
 * Groups dashboard page
 * Shows all user's groups with create/join actions
 * Protected route - redirects to /login if not authenticated
 *
 * Per 08-03-PLAN.md: Mobile-first, max-w-4xl, separated by role
 */
export default async function GroupsPage() {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user's groups
  const userGroups = await getUserGroups(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <GroupsDashboard userGroups={userGroups} />
    </div>
  );
}
