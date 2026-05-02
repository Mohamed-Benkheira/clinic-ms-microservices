import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useState } from "react";
import { CalendarDays, Users, CheckCircle2, Clock4, UserPlus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeaderGreeting } from "../HeaderGreeting";
import { KpiCard } from "../KpiCard";
import { RingProgress } from "../RingProgress";
import { StatusBadge } from "../StatusBadge";
import { MOCK_PATIENTS, MOCK_DOCTORS, MOCK_APPOINTMENTS } from "@/lib/mock-data";
import { useCreateDoctor } from "@/hooks/use-doctors";

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

export function DoctorDashboard() {
  const navigate = useNavigate();
  const doctorId = "d1";
  const initial = MOCK_APPOINTMENTS.filter(
    (a) =>
      a.doctorId === doctorId &&
      a.status === "SCHEDULED" &&
      dayjs(a.datetime).isSame(dayjs(), "day"),
  );
  const [today, setToday] = useState(initial);

  const tomorrow = MOCK_APPOINTMENTS.filter(
    (a) => a.doctorId === doctorId && dayjs(a.datetime).isSame(dayjs().add(1, "day"), "day"),
  );
  const next7 = MOCK_APPOINTMENTS.filter(
    (a) =>
      a.doctorId === doctorId &&
      dayjs(a.datetime).isAfter(dayjs().add(1, "day")) &&
      dayjs(a.datetime).isBefore(dayjs().add(8, "day")),
  );

  const myPatients = Array.from(
    new Set(MOCK_APPOINTMENTS.filter((a) => a.doctorId === doctorId).map((a) => a.patientId)),
  )
    .map((id) => MOCK_PATIENTS.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 5);

  const week = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => ({
    day: d,
    count: 2 + Math.round(Math.random() * 4) + (i === 1 ? 2 : 0),
  }));

  const markComplete = (id: string) => {
    setToday((t) => t.filter((x) => x.id !== id));
    toast.success("Appointment marked as completed");
  };
  const cancel = (id: string) => {
    setToday((t) => t.filter((x) => x.id !== id));
    toast("Appointment cancelled");
  };

  // Create doctor state
  const [createOpen, setCreateOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialty: "",
    license: "",
    phone: "",
    email: "",
  });
  const createDoctorMutation = useCreateDoctor();

  const submitDoctor = async () => {
    if (doctorForm.name.length < 2 || doctorForm.license.length < 3) {
      toast.error("Please complete the required fields");
      return;
    }
    if (!doctorForm.email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    try {
      await createDoctorMutation.mutateAsync(doctorForm);
      toast.success("Doctor added successfully");
      setCreateOpen(false);
      setDoctorForm({ name: "", specialty: "", license: "", phone: "", email: "" });
    } catch {
      toast.error("Failed to add doctor");
    }
  };

  return (
    <div className="space-y-6">
      <Panel>
        <HeaderGreeting />
      </Panel>

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel delay={0.05}>
          <KpiCard
            title="Appointments Today"
            value={today.length}
            icon={CalendarDays}
            trend={{ value: 5, direction: "up" }}
            storageKey="dr-today"
          />
        </Panel>
        <Panel delay={0.1}>
          <KpiCard
            title="Total Patients"
            value={23}
            icon={Users}
            iconColor="var(--clinic-indigo)"
            iconBg="var(--clinic-indigo-soft)"
            trend={{ value: 8, direction: "up" }}
            storageKey="dr-pat"
          />
        </Panel>
        <Panel delay={0.15}>
          <KpiCard
            title="Completed This Week"
            value={11}
            icon={CheckCircle2}
            iconColor="var(--clinic-green)"
            iconBg="var(--clinic-green-soft)"
            trend={{ value: 12, direction: "up" }}
            storageKey="dr-cw"
          />
        </Panel>
        <Panel delay={0.2}>
          <KpiCard
            title="Pending This Week"
            value={6}
            icon={Clock4}
            iconColor="var(--clinic-yellow)"
            iconBg="var(--clinic-yellow-soft)"
            trend={{ value: -2, direction: "down" }}
            storageKey="dr-pw"
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.25} className="lg:col-span-8">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Today's schedule</h3>
            <p className="text-sm text-muted-foreground">{today.length} appointments remaining</p>
            {today.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-base text-muted-foreground">
                  No appointments scheduled for today 🎉
                </p>
              </div>
            ) : (
              <ol className="relative mt-4 space-y-4 border-l-2 border-[var(--clinic-border-subtle)] pl-6">
                {today.map((a, i) => {
                  const p = MOCK_PATIENTS.find((x) => x.id === a.patientId);
                  return (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[31px] mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--clinic-blue)] ring-4 ring-card" />
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-mono font-semibold text-[var(--clinic-blue-strong)]">
                            {dayjs(a.datetime).format("HH:mm")}
                          </div>
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">
                            {p?.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{p?.name}</div>
                            <div className="text-xs text-muted-foreground">{a.reason}</div>
                          </div>
                          {i === 0 && (
                            <Badge className="bg-[var(--clinic-blue)] text-white">NEXT</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => markComplete(a.id)}>
                            Mark Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[var(--clinic-red)] hover:text-[var(--clinic-red)]"
                            onClick={() => cancel(a.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </Panel>

        <Panel delay={0.3} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Upcoming appointments</h3>
            <div className="mt-3 space-y-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tomorrow
                </div>
                <ul className="mt-2 space-y-2">
                  {tomorrow.length === 0 && (
                    <li className="text-sm text-muted-foreground">Nothing scheduled.</li>
                  )}
                  {tomorrow.map((a) => {
                    const p = MOCK_PATIENTS.find((x) => x.id === a.patientId);
                    return (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{p?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {dayjs(a.datetime).format("HH:mm")} · {a.reason}
                          </div>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-[var(--clinic-blue)]" />
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Next 7 days
                </div>
                <ul className="mt-2 space-y-2">
                  {next7.slice(0, 3).map((a) => {
                    const p = MOCK_PATIENTS.find((x) => x.id === a.patientId);
                    return (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{p?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {dayjs(a.datetime).format("ddd MMM D · HH:mm")}
                          </div>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-[var(--clinic-blue)]" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Card>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.35} className="lg:col-span-8">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">My patients</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/patients" })}>
                View all my patients
              </Button>
            </div>
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Last visit</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myPatients.map((p, i) => (
                  <TableRow key={p!.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">
                          {p!.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{p!.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {i === 0 ? "1 week ago" : `${i + 1} weeks ago`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {p!.notes ? p!.notes.split(".")[0] : "Stable"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Panel>

        <Panel delay={0.4} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Quick stats</h3>
            <div className="mt-3 h-32">
              <ResponsiveContainer>
                <BarChart data={week}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--clinic-border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--clinic-blue)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-around">
              <RingProgress
                value={78}
                size={120}
                thickness={10}
                color="var(--clinic-blue)"
                label={
                  <>
                    <span className="text-lg font-semibold">78%</span>
                    <span className="text-[10px] text-muted-foreground">completion</span>
                  </>
                }
              />
            </div>
          </Card>
        </Panel>
      </div>

      <Panel delay={0.45}>
        <Card className="p-5">
          <h3 className="text-base font-semibold">Performance overview</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: "Appointments / day",
                value: "3.2",
                icon: CalendarDays,
                color: "var(--clinic-blue)",
                bg: "var(--clinic-blue-soft)",
              },
              {
                label: "Cancellation rate",
                value: "8%",
                icon: Clock4,
                color: "var(--clinic-red)",
                bg: "var(--clinic-red-soft)",
              },
              {
                label: "Patient satisfaction",
                value: "4.8/5",
                icon: CheckCircle2,
                color: "var(--clinic-green)",
                bg: "var(--clinic-green-soft)",
              },
              {
                label: "Busiest day",
                value: "Tuesday",
                icon: Users,
                color: "var(--clinic-indigo)",
                bg: "var(--clinic-indigo-soft)",
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: m.bg, color: m.color }}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-lg font-semibold">{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Panel>

      {/* Create Doctor Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add new doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                placeholder="Dr. John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Specialty *</Label>
              <Input
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                placeholder="Cardiology"
              />
            </div>
            <div className="space-y-1.5">
              <Label>License number *</Label>
              <Input
                value={doctorForm.license}
                onChange={(e) => setDoctorForm({ ...doctorForm, license: e.target.value })}
                placeholder="MED-12345"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                placeholder="doctor@clinicos.med"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateOpen(false)}
              disabled={createDoctorMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={submitDoctor} disabled={createDoctorMutation.isPending}>
              {createDoctorMutation.isPending ? "Adding..." : "Add doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
