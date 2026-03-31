"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FootballIcon } from "@/components/icons/football-icons";

/**
 * Mobile navigation component
 * Fixed bottom navigation bar for mobile devices
 * Per 08-03-PLAN.md: Add Groups link with cornerFlag icon
 *
 * Nav items: Accueil, Matchs, Groupes, Profil
 */
export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Accueil", icon: "pitch" },
    { href: "/dashboard/matches", label: "Matchs", icon: "centerCircle" },
    { href: "/dashboard/groups", label: "Groupes", icon: "cornerFlag" },
    { href: "/profile", label: "Profil", icon: "star" },
  ] as const;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-chalk-pure border-t border-slate-light md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <FootballIcon
              name={item.icon}
              size={20}
              className={isActive(item.href) ? "text-pitch" : "text-slate-mid"}
            />
            <span
              className={`text-xs font-medium ${
                isActive(item.href) ? "text-pitch" : "text-slate-mid"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
