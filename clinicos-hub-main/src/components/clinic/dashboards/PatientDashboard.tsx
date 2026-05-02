import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  Phone,
  Mail,
  Heart,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HeaderGreeting } from "../HeaderGreeting";
import { KpiCard } from "../KpiCard";
import { StatusBadge } from "../StatusBadge";
import { useAppData } from "@/lib/app-data";

const Panel = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const TIPS = [
  "Stay hydrated — aim for 8 glasses of water a day.",
  "A 30-minute walk a day can improve cardiovascular health.",
  "Aim for 7–9 hours of sleep to support immunity and focus.",
  "Small, frequent meals help stabilize blood sugar.",
];

export function PatientDashboard() {
  const navigate = useNavigate();
  const { appointments, doctors, removeAppointment } = useAppData();
  const patientId = "p1";
  const upcoming = appointments
    .filter(
      (a) =>
        a.patientId === patientId && a.status === "SCHEDULED" && dayjs(a.datetime).isAfter(dayjs()),
    )
    .sort((a, b) => +new Date(a.datetime) - +new Date(b.datetime));
  const past = appointments.filter((a) => a.patientId === patientId && a.status === "COMPLETED");
  const next = upcoming[0];
  const myDoctor = doctors.find((d) => d.id === "d1")!;
  const [tip, setTip] = useState(0);
  const [cancelId, setCancelId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Panel>
        <HeaderGreeting />
      </Panel>

      <Panel delay={0.05}>
        <Card className="relative overflow-hidden border-[oklch(0.85_0.08_240)] bg-[var(--clinic-blue-soft)] p-6 sm:p-8">
          <Calendar className="pointer-events-none absolute -right-4 -top-4 h-60 w-60 text-[var(--clinic-blue)] opacity-10" />
          <div className="relative">
            <Badge className="bg-[var(--clinic-blue)] text-white">UPCOMING APPOINTMENT</Badge>
            {next ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold text-[var(--clinic-blue-strong)] sm:text-3xl">
                  Your next appointment is {dayjs(next.datetime).format("MMM D")} at{" "}
                  {dayjs(next.datetime).format("HH:mm")}
                </h2>
                <p className="mt-2 text-[var(--clinic-blue-strong)]/80">
                  with {doctors.find((d) => d.id === next.doctorId)?.name} · {next.reason}
                </p>
              </>
            ) : (
              <h2 className="mt-4 text-2xl font-semibold text-[var(--clinic-blue-strong)]">
                You have no upcoming appointments
              </h2>
            )}
            <Button
              className="mt-6 bg-card text-foreground hover:bg-card/90"
              onClick={() => navigate({ to: "/appointments" })}
            >
              View my appointments
            </Button>
          </div>
        </Card>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel delay={0.1}>
          <KpiCard
            title="Upcoming Appointments"
            value={upcoming.length}
            icon={CalendarDays}
            storageKey="p-up"
          />
        </Panel>
        <Panel delay={0.15}>
          <KpiCard
            title="Past Appointments"
            value={past.length}
            icon={Clock}
            iconColor="var(--clinic-indigo)"
            iconBg="var(--clinic-indigo-soft)"
            storageKey="p-past"
          />
        </Panel>
        <Panel delay={0.2}>
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">My Primary Doctor</p>
                <p className="text-xl font-semibold tracking-tight">{myDoctor.name}</p>
                <p className="text-xs text-muted-foreground">{myDoctor.specialty}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--clinic-teal-soft)] text-[var(--clinic-teal)]">
                <Stethoscope className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel delay={0.25}>
          <Card className="p-5">
            <h3 className="text-base font-semibold">Upcoming visits</h3>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No upcoming visits.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        {dayjs(a.datetime).format("ddd, MMM D · HH:mm")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doctors.find((d) => d.id === a.doctorId)?.name} · {a.reason}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[var(--clinic-red)] text-[var(--clinic-red)] hover:bg-[var(--clinic-red-soft)] hover:text-[var(--clinic-red)]"
                      onClick={() => setCancelId(a.id)}
                    >
                      Cancel
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="sm" className="mt-3 w-full">
              Book a private consult
            </Button>
          </Card>
        </Panel>

        <Panel delay={0.3}>
          <Card className="flex flex-col items-center p-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-2xl font-semibold text-[var(--clinic-blue-strong)]">
              {myDoctor.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{myDoctor.name}</h3>
            <Badge className="mt-1 bg-[var(--clinic-green-soft)] text-[var(--clinic-green)]">
              Available now
            </Badge>
            <p className="mt-1 text-sm text-muted-foreground">{myDoctor.specialty}</p>
            <Separator className="my-4" />
            <div className="grid w-full grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {myDoctor.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {myDoctor.email}
              </div>
            </div>
            <Button disabled className="mt-4 w-full">
              Contact {myDoctor.name.split(" ").slice(0, 2).join(" ")}
            </Button>
          </Card>
        </Panel>
      </div>

      <Panel delay={0.35}>
        <Card className="p-5">
          <h3 className="text-base font-semibold">Medical history</h3>
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {past.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">
                    {dayjs(a.datetime).format("MMM D, YYYY")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {doctors.find((d) => d.id === a.doctorId)?.name}
                  </TableCell>
                  <TableCell className="text-sm">{a.reason}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="ghost" size="sm" className="mt-3 w-full">
            View full history
          </Button>
        </Card>
      </Panel>

      <Panel delay={0.4}>
        <Card className="border-2 border-dashed border-[oklch(0.85_0.08_240)] bg-[var(--clinic-blue-soft)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--clinic-blue)] text-white">
              <Heart className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--clinic-blue-strong)]">
                Health tip
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tip}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="mt-1 italic text-[var(--clinic-blue-strong)]"
                >
                  {TIPS[tip]}
                </motion.p>
              </AnimatePresence>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-[var(--clinic-blue-strong)]"
              onClick={() => setTip((t) => (t + 1) % TIPS.length)}
            >
              Next tip <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </Panel>

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              You can rebook another time from the Appointments page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90"
              onClick={() => {
                if (cancelId) {
                  removeAppointment(cancelId);
                  toast.success("Appointment cancelled");
                }
                setCancelId(null);
              }}
            >
              Yes, cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
