import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  BellRing,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/app-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Array<"ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT">;
}

const NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"],
  },
  { to: "/patients", label: "Patients", icon: Users, roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { to: "/doctors", label: "Doctors", icon: Stethoscope, roles: ["ADMIN", "RECEPTIONIST"] },
  {
    to: "/appointments",
    label: "Appointments",
    icon: CalendarDays,
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"],
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: BellRing,
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"],
  },
  {
    to: "/messages",
    label: "Messages",
    icon: MessageSquare,
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
  },
];

function currentStaffIdFor(role: "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT"): string | null {
  if (role === "ADMIN") return "admin";
  if (role === "DOCTOR") return "d1";
  if (role === "RECEPTIONIST") return "r1";
  return null;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { conversations, messages } = useAppData();

  if (!user) return <>{children}</>;

  const items = NAV.filter((n) => n.roles.includes(user.role));
  const staffId = currentStaffIdFor(user.role);
  const myConvos = staffId ? conversations.filter((c) => c.participantIds.includes(staffId)) : [];
  const totalUnread = staffId
    ? messages.filter(
        (m) =>
          myConvos.some((c) => c.id === m.conversationId) &&
          m.senderId !== staffId &&
          !m.readBy.includes(staffId),
      ).length
    : 0;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full bg-[var(--clinic-surface-bg)]">
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--clinic-border-subtle)] bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </div>
          <span className="font-semibold">ClinicOS</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[var(--clinic-border-subtle)] bg-sidebar transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "pt-14 md:pt-0",
        )}
      >
        <div className="hidden h-16 items-center gap-3 border-b border-[var(--clinic-border-subtle)] px-5 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none text-foreground">ClinicOS</div>
            <div className="mt-1 text-xs text-muted-foreground">Medical Platform</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            const showBadge = item.to === "/messages" && totalUnread > 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--clinic-blue-soft)] text-[var(--clinic-blue-strong)]"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--clinic-blue)] px-1.5 text-[11px] font-semibold text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--clinic-border-subtle)] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-sm font-semibold text-[var(--clinic-blue-strong)]">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground capitalize">
                {user.role.toLowerCase()}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 pt-14 md:ml-64 md:pt-0">
        <div className="mx-auto max-w-[1400px] p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
