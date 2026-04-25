"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Briefcase } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const items = [
  { href: ROUTES.dashboard, label: "Home", icon: Home },
  { href: ROUTES.candidates, label: "Candidates", icon: Users },
  { href: ROUTES.jobs, label: "Jobs", icon: Briefcase },
  { href: ROUTES.messages, label: "Messages", icon: MessageSquare },
] as const;

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-card px-2 py-2 text-[11px] font-semibold transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:bg-bg hover:text-text-primary",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
