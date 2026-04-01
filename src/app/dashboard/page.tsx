import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Temporary simplified version to fix Vercel build
  redirect("/matches/new");
}
