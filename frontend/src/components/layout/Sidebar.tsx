import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Briefcase,
  Settings,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { logoutUser } from "@/lib/api";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const overview = [
  { label: "Home", href: ROUTES.home, icon: Home },
  { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
] as const;

const pipeline = [
  { label: "New Job", href: ROUTES.newJob, icon: Briefcase, prefixMatch: "/dashboard/jobs" },
] as const;

const system = [{ label: "Settings", href: "/dashboard/settings", icon: Settings }] as const;

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 pt-6 first:pt-2">
      <div className="px-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-white/40">{title}</div>
      <ul className="mt-2 space-y-0.5">{children}</ul>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  badge,
  prefixMatch,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  pathname: string;
  badge?: number;
  prefixMatch?: string;
}) {
  const active =
    prefixMatch != null
      ? pathname === prefixMatch || pathname.startsWith(`${prefixMatch}/`)
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-accent text-white shadow-sm shadow-accent/20"
            : "text-white/70 hover:bg-black/20 hover:text-white",
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-white/50")} />
        <span className="flex-1">{label}</span>
        {badge !== undefined ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-success px-1.5 text-[11px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function Sidebar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();

  const handleSignOut = async () => {
    try {
      await logoutUser();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Unable to fully clear the session, but you’ve been redirected.");
    } finally {
      router.push(ROUTES.login);
    }
  };

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-primary md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5 py-3">
        <BrandLogo size="sm" tone="dark" subtitle="Recruiter workspace" />
      </div>

      <nav className="flex-1 overflow-y-auto pb-0">
        <NavSection title="Overview">
          {overview.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </NavSection>
        <NavSection title="Pipeline">
          {pipeline.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
        </NavSection>
        <NavSection title="System">
          {system.map((it) => (
            <NavLink key={it.href} {...it} pathname={pathname} />
          ))}
        </NavSection>
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-input bg-black/20 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-white">
            {currentUser?.name?.slice(0, 2).toUpperCase() || "RW"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {currentUser?.name || "WiseRank Workspace"}
            </div>
            <div className="truncate text-xs text-white/50">
              {currentUser?.email || "Connected recruitment workspace"}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 rounded-input bg-black/20 hover:bg-black/30 px-3 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
