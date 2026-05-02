import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Stethoscope, ShieldCheck, UserCog, User, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { DEMO_USERS } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — ClinicOS" },
      {
        name: "description",
        content: "Sign in to ClinicOS — the premium medical SaaS platform for modern clinics.",
      },
    ],
  }),
  component: LoginPage,
});

const ROLE_CARDS: Array<{
  role: Role;
  label: string;
  icon: typeof ShieldCheck;
  iconBg: string;
  iconColor: string;
}> = [
  {
    role: "ADMIN",
    label: "Administrator",
    icon: ShieldCheck,
    iconBg: "var(--clinic-indigo-soft)",
    iconColor: "var(--clinic-indigo)",
  },
  {
    role: "DOCTOR",
    label: "Doctor",
    icon: Stethoscope,
    iconBg: "var(--clinic-blue-soft)",
    iconColor: "var(--clinic-blue)",
  },
  {
    role: "RECEPTIONIST",
    label: "Receptionist",
    icon: UserCog,
    iconBg: "var(--clinic-cyan-soft)",
    iconColor: "var(--clinic-cyan)",
  },
  {
    role: "PATIENT",
    label: "Patient",
    icon: User,
    iconBg: "var(--clinic-gray-soft)",
    iconColor: "var(--clinic-text-secondary)",
  },
];

// Demo credentials that must exist in the backend
// Run: docker exec clinicos_auth python3 manage.py shell -c "..."  to seed these
const DEMO_PASSWORDS: Record<Role, string> = {
  ADMIN: "Admin1234!",
  DOCTOR: "Doctor1234!",
  RECEPTIONIST: "Reception1234!",
  PATIENT: "Patient1234!",
};

function LoginPage() {
  const { user, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const doLogin = async (e_mail: string, pwd: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(e_mail, pwd);
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { non_field_errors?: string[]; detail?: string } } })
          ?.response?.data?.non_field_errors?.[0] ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Invalid email or password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    doLogin(email, password);
  };

  // Prefill the form with demo credentials and submit immediately
  const pickRole = (role: Role) => {
    const demoEmail = DEMO_USERS[role].email;
    const demoPass = DEMO_PASSWORDS[role];
    setEmail(demoEmail);
    setPassword(demoPass);
    doLogin(demoEmail, demoPass);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* Left: brand panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "var(--gradient-login)" }}
      >
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[oklch(0.55_0.18_240/0.18)] blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-[oklch(0.7_0.13_200/0.15)] blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium tracking-wide text-white/80">CLINICOS</span>
          </div>
        </div>
        <div className="relative max-w-md">
          <Stethoscope className="mb-6 h-12 w-12 text-white/90" />
          <h1 className="text-5xl font-bold leading-tight tracking-tight">ClinicOS</h1>
          <p className="mt-3 text-lg text-white/80">Premium Medical SaaS Platform</p>
          <p className="mt-6 text-sm leading-relaxed text-white/60">
            Streamline clinic operations — manage patients, doctors, appointments, and notifications
            from a single, intuitive workspace built for modern healthcare teams.
          </p>
        </div>
        <div className="relative text-xs text-white/50">
          © {new Date().getFullYear()} ClinicOS. All rights reserved.
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-card px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">ClinicOS</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Welcome back. Enter your credentials to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@clinicos.med"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Or continue as a demo user
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ROLE_CARDS.map(({ role, label, icon: Icon, iconBg, iconColor }) => (
              <Card
                key={role}
                onClick={() => !loading && pickRole(role)}
                className="group cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-card)]"
                style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: iconBg, color: iconColor }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">{label}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {DEMO_USERS[role].email}
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Continue <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
