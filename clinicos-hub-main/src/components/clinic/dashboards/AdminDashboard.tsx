import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  Users,
  Stethoscope,
  CalendarDays,
  Clock,
  UserPlus,
  UserCog,
  CalendarPlus,
  BellPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HeaderGreeting } from "../HeaderGreeting";
import { KpiCard } from "../KpiCard";
import { StatusBadge } from "../StatusBadge";
import { useAppData } from "@/lib/app-data";
import { toast } from "sonner";

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
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const trendData = (days: number) =>
  Array.from({ length: days }, (_, i) => ({
    day: dayjs()
      .subtract(days - 1 - i, "day")
      .format("MMM D"),
    Scheduled: Math.round(8 + Math.random() * 6),
    Completed: Math.round(5 + Math.random() * 5),
    Cancelled: Math.round(1 + Math.random() * 2),
  }));

export function AdminDashboard() {
  const navigate = useNavigate();
  const { patients, doctors, appointments, notifications, updateAppointment, removeAppointment } =
    useAppData();
  const [range, setRange] = useState<7 | 14 | 30>(14);
  const trends = useMemo(() => trendData(range), [range]);

  const todayCount = appointments.filter((a) => dayjs(a.datetime).isSame(dayjs(), "day")).length;
  const totalAppts = appointments.length;
  const statusCounts = {
    SCHEDULED: appointments.filter((a) => a.status === "SCHEDULED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter((a) => a.status === "CANCELLED").length,
  };
  const total = statusCounts.SCHEDULED + statusCounts.COMPLETED + statusCounts.CANCELLED;
  const statusPie = [
    { name: "Scheduled", value: statusCounts.SCHEDULED, color: "var(--clinic-blue)" },
    { name: "Completed", value: statusCounts.COMPLETED, color: "var(--clinic-green)" },
    { name: "Cancelled", value: statusCounts.CANCELLED, color: "var(--clinic-red)" },
  ];

  const males = patients.filter((p) => p.gender === "M").length;
  const females = patients.filter((p) => p.gender === "F").length;
  const malePct = Math.round((males / Math.max(patients.length, 1)) * 100);
  const femalePct = 100 - malePct;

  const available = doctors.filter((d) => d.status === "AVAILABLE").length;
  const busy = doctors.filter((d) => d.status === "BUSY").length;
  const docPie = [
    { name: "Available", value: available, color: "var(--clinic-blue)" },
    { name: "Busy", value: busy, color: "var(--clinic-red)" },
  ];

  const specs = doctors.reduce<Record<string, number>>((acc, d) => {
    acc[d.specialty] = (acc[d.specialty] ?? 0) + 1;
    return acc;
  }, {});
  const specData = Object.entries(specs)
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }));

  const recent = useMemo(
    () =>
      [...appointments].sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime)).slice(0, 8),
    [appointments],
  );

  const todayNotifs = useMemo(
    () => notifications.filter((n) => dayjs(n.timestamp).isSame(dayjs(), "day")),
    [notifications],
  );
  const todayNotifCounts = {
    sent: todayNotifs.filter((n) => n.status === "SENT").length,
    failed: todayNotifs.filter((n) => n.status === "FAILED").length,
    pending: todayNotifs.filter((n) => n.status === "PENDING").length,
  };

  const activity = [
    {
      id: 1,
      type: "booked",
      text: "Sarah Johnson booked a follow-up with Dr. Benali",
      time: "2m ago",
      color: "var(--clinic-blue)",
    },
    {
      id: 2,
      type: "completed",
      text: "Dr. Park marked appointment with Aisha Patel as completed",
      time: "12m ago",
      color: "var(--clinic-green)",
    },
    {
      id: 3,
      type: "cancelled",
      text: "Emily Davis cancelled tomorrow's consultation",
      time: "27m ago",
      color: "var(--clinic-red)",
    },
    {
      id: 4,
      type: "system",
      text: "Daily backup completed successfully",
      time: "1h ago",
      color: "var(--clinic-yellow)",
    },
    {
      id: 5,
      type: "booked",
      text: "Walk-in patient added by Jamie",
      time: "2h ago",
      color: "var(--clinic-blue)",
    },
    {
      id: 6,
      type: "completed",
      text: "Lab results uploaded for Michael Chen",
      time: "3h ago",
      color: "var(--clinic-green)",
    },
  ];
  const [feed, setFeed] = useState(activity);

  const apptDays = [12, 15, 20, 25];

  return (
    <div className="space-y-6">
      <Panel>
        <HeaderGreeting />
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel delay={0.05}>
          <KpiCard
            title="Total Patients"
            value={patients.length}
            icon={Users}
            iconColor="var(--clinic-blue)"
            iconBg="var(--clinic-blue-soft)"
            trend={{ value: 12, direction: "up" }}
            spark={[3, 4, 5, 4, 6, 7, 8, 9, 10]}
            storageKey="kpi-patients"
          />
        </Panel>
        <Panel delay={0.13}>
          <KpiCard
            title="Total Doctors"
            value={doctors.length}
            icon={Stethoscope}
            iconColor="var(--clinic-indigo)"
            iconBg="var(--clinic-indigo-soft)"
            trend={{ value: 0, direction: "neutral" }}
            spark={[6, 6, 6, 6, 6, 6, 6]}
            storageKey="kpi-doctors"
          />
        </Panel>
        <Panel delay={0.21}>
          <KpiCard
            title="Total Appointments"
            value={totalAppts}
            icon={CalendarDays}
            iconColor="var(--clinic-cyan)"
            iconBg="var(--clinic-cyan-soft)"
            trend={{ value: 8, direction: "up" }}
            spark={[10, 12, 11, 13, 15, 14, 16, 18, 20]}
            storageKey="kpi-appts"
          />
        </Panel>
        <Panel delay={0.29}>
          <KpiCard
            title="Scheduled Today"
            value={todayCount}
            icon={Clock}
            iconColor="var(--clinic-teal)"
            iconBg="var(--clinic-teal-soft)"
            trend={{ value: -3, direction: "down" }}
            spark={[5, 6, 4, 7, 8, 6, 7]}
            storageKey="kpi-today"
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.35} className="lg:col-span-8">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Appointment trends</h3>
                <p className="text-sm text-muted-foreground">Scheduled vs completed vs cancelled</p>
              </div>
              <div className="flex gap-1 rounded-lg border bg-muted p-1">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d as 7 | 14 | 30)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      range === d
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer>
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-sched" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--clinic-blue)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--clinic-blue)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-comp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--clinic-blue-strong)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--clinic-blue-strong)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-canc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--clinic-red)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--clinic-red)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--clinic-border-subtle)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="Scheduled"
                    stroke="var(--clinic-blue)"
                    fill="url(#g-sched)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Completed"
                    stroke="var(--clinic-blue-strong)"
                    fill="url(#g-comp)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Cancelled"
                    stroke="var(--clinic-red)"
                    fill="url(#g-canc)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Panel>

        <Panel delay={0.43} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Status breakdown</h3>
            <p className="text-sm text-muted-foreground">All appointments</p>
            <div className="relative mx-auto mt-2 h-44 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {statusPie.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-semibold text-foreground">{total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {statusPie.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-medium">
                    {s.value}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((s.value / total) * 100)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.5} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Patient demographics</h3>
            <div className="mt-3 h-40">
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { name: "Male", value: males },
                    { name: "Female", value: females },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--clinic-border-subtle)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <Cell fill="var(--clinic-blue)" />
                    <Cell fill="var(--clinic-pink)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-around text-sm">
              <span style={{ color: "var(--clinic-blue)" }} className="font-medium">
                {malePct}% Male
              </span>
              <span style={{ color: "var(--clinic-pink)" }} className="font-medium">
                {femalePct}% Female
              </span>
            </div>
          </Card>
        </Panel>

        <Panel delay={0.55} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Doctor status</h3>
            <div className="relative mx-auto mt-2 h-36">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={docPie}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={62}
                    paddingAngle={2}
                  >
                    {docPie.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-semibold">{doctors.length}</div>
                <div className="text-xs text-muted-foreground">Doctors</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Busy:</span>{" "}
              {doctors
                .filter((d) => d.status === "BUSY")
                .map((d) => d.name)
                .join(", ")}
            </div>
          </Card>
        </Panel>

        <Panel delay={0.6} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">By specialization</h3>
            <div className="mt-3 h-40">
              <ResponsiveContainer>
                <BarChart data={specData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--clinic-border-subtle)"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Bar dataKey="value" fill="var(--clinic-indigo)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.65} className="lg:col-span-8">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Recent appointments</h3>
                <p className="text-sm text-muted-foreground">Latest activity</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/appointments" })}>
                View all
              </Button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((a) => {
                    const p = patients.find((x) => x.id === a.patientId);
                    const d = doctors.find((x) => x.id === a.doctorId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">
                              {p?.name
                                .split(" ")
                                .map((s) => s[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{p?.name}</div>
                              <div className="text-xs text-muted-foreground">{a.reason}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{d?.name}</TableCell>
                        <TableCell className="text-sm">
                          <div>{dayjs(a.datetime).format("MMM D")}</div>
                          <div className="text-xs text-muted-foreground">
                            {dayjs(a.datetime).format("HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  updateAppointment(a.id, { status: "COMPLETED" });
                                  toast.success("Marked complete");
                                }}
                              >
                                Mark complete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-[var(--clinic-red)]"
                                onClick={() => {
                                  removeAppointment(a.id);
                                  toast("Appointment cancelled");
                                }}
                              >
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </Panel>

        <Panel delay={0.7} className="lg:col-span-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Recent activity</h3>
              <Button variant="ghost" size="sm" onClick={() => setFeed([])}>
                Clear
              </Button>
            </div>
            <ScrollArea className="mt-3 h-[400px] pr-3">
              {feed.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No activity</p>
              ) : (
                <ul className="space-y-3">
                  {feed.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 text-sm"
                    >
                      <span
                        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="leading-snug text-foreground">{item.text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </Card>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.75} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-[100px] flex-col gap-2 border-[var(--clinic-blue-soft)] bg-[var(--clinic-blue-soft)] text-[var(--clinic-blue-strong)] hover:bg-[var(--clinic-blue-soft)]/70"
                onClick={() => navigate({ to: "/patients", search: { add: true } as never })}
              >
                <UserPlus className="h-5 w-5" />
                <span className="text-xs font-medium">Add Patient</span>
              </Button>
              <Button
                variant="outline"
                className="h-[100px] flex-col gap-2 border-[var(--clinic-indigo-soft)] bg-[var(--clinic-indigo-soft)] text-[var(--clinic-indigo)] hover:bg-[var(--clinic-indigo-soft)]/70"
                onClick={() => navigate({ to: "/doctors" })}
              >
                <UserCog className="h-5 w-5" />
                <span className="text-xs font-medium">Add Doctor</span>
              </Button>
              <Button
                className="h-[100px] flex-col gap-2"
                onClick={() => navigate({ to: "/appointments", search: { add: true } as never })}
              >
                <CalendarPlus className="h-5 w-5" />
                <span className="text-xs font-medium">Book Visit</span>
              </Button>
              <Button
                className="h-[100px] flex-col gap-2 bg-[var(--clinic-indigo)] hover:bg-[var(--clinic-indigo)]/90"
                onClick={() => navigate({ to: "/notifications" })}
              >
                <BellPlus className="h-5 w-5" />
                <span className="text-xs font-medium">Send Notif</span>
              </Button>
            </div>
          </Card>
        </Panel>

        <Panel delay={0.8} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Notifications today</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-4 w-4 text-[var(--clinic-green)]" />
                <div className="mt-1 text-xs text-muted-foreground">Sent</div>
                <div className="font-semibold text-[var(--clinic-green)]">
                  {todayNotifCounts.sent}
                </div>
              </div>
              <div>
                <XCircle className="mx-auto h-4 w-4 text-[var(--clinic-red)]" />
                <div className="mt-1 text-xs text-muted-foreground">Failed</div>
                <div className="font-semibold text-[var(--clinic-red)]">
                  {todayNotifCounts.failed}
                </div>
              </div>
              <div>
                <AlertCircle className="mx-auto h-4 w-4 text-[var(--clinic-yellow)]" />
                <div className="mt-1 text-xs text-muted-foreground">Pending</div>
                <div className="font-semibold text-[var(--clinic-yellow)]">
                  {todayNotifCounts.pending}
                </div>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {todayNotifs.slice(0, 3).map((n) => {
                const p = patients.find((x) => x.id === n.patientId);
                const dot =
                  n.status === "SENT"
                    ? "var(--clinic-green)"
                    : n.status === "FAILED"
                      ? "var(--clinic-red)"
                      : "var(--clinic-yellow)";
                return (
                  <li key={n.id} className="flex gap-3 rounded-md border p-2 text-sm">
                    <span
                      className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium">{p?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{n.message}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              onClick={() => navigate({ to: "/notifications" })}
            >
              View all
            </Button>
          </Card>
        </Panel>

        <Panel delay={0.85} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Appointment calendar</h3>
            <div className="mt-2 flex justify-center">
              <Calendar
                mode="single"
                modifiers={{ booked: (d) => apptDays.includes(d.getDate()) }}
                modifiersClassNames={{
                  booked:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-[var(--clinic-blue)]",
                }}
                className="rounded-md"
              />
            </div>
          </Card>
        </Panel>
      </div>
    </div>
  );
}
