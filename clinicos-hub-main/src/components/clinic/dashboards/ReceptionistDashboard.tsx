import { motion } from "framer-motion";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Activity,
  CheckCircle2,
  UserPlus,
  Search,
  Send,
  ChevronRight,
  CalendarPlus,
  CalendarSearch,
  Eye,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  MOCK_PATIENTS,
  MOCK_DOCTORS,
  MOCK_APPOINTMENTS,
  MOCK_NOTIFICATIONS,
} from "@/lib/mock-data";

type QueueStatus = "WAITING" | "CHECKED_IN" | "WITH_DOCTOR" | "DONE";

const queueColor: Record<QueueStatus, { bg: string; fg: string }> = {
  WAITING: { bg: "var(--clinic-gray-soft)", fg: "var(--clinic-text-secondary)" },
  CHECKED_IN: { bg: "var(--clinic-blue-soft)", fg: "var(--clinic-blue-strong)" },
  WITH_DOCTOR: { bg: "var(--clinic-indigo-soft)", fg: "var(--clinic-indigo)" },
  DONE: { bg: "var(--clinic-green-soft)", fg: "var(--clinic-green)" },
};

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

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const todays = useMemo(
    () => MOCK_APPOINTMENTS.filter((a) => dayjs(a.datetime).isSame(dayjs(), "day")),
    [],
  );
  const [queue, setQueue] = useState<Record<string, QueueStatus>>(() => {
    const o: Record<string, QueueStatus> = {};
    todays.forEach((a, i) => {
      o[a.id] = i === 0 ? "WITH_DOCTOR" : i === 1 ? "CHECKED_IN" : i === 2 ? "DONE" : "WAITING";
    });
    return o;
  });
  const [search, setSearch] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkIn, setWalkIn] = useState({ name: "", phone: "", doctorId: "", reason: "" });

  const counts = {
    today: todays.length,
    checkedIn: Object.values(queue).filter((s) => s === "CHECKED_IN").length,
    withDoctor: Object.values(queue).filter((s) => s === "WITH_DOCTOR").length,
    done: Object.values(queue).filter((s) => s === "DONE").length,
  };

  const filteredPatients = MOCK_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const advance = (id: string, next: QueueStatus, msg: string) => {
    setQueue((q) => ({ ...q, [id]: next }));
    toast.success(msg);
  };

  const submitWalkIn = () => {
    if (!walkIn.name || !walkIn.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setWalkInOpen(false);
    setWalkIn({ name: "", phone: "", doctorId: "", reason: "" });
    toast.success("Walk-in patient added to queue");
  };

  const tomorrow = MOCK_APPOINTMENTS.filter((a) =>
    dayjs(a.datetime).isSame(dayjs().add(1, "day"), "day"),
  );
  const next2 = MOCK_APPOINTMENTS.filter((a) =>
    dayjs(a.datetime).isSame(dayjs().add(2, "day"), "day"),
  );

  return (
    <div className="space-y-6">
      <Panel>
        <HeaderGreeting />
      </Panel>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel delay={0.05}>
          <KpiCard
            title="Today's Appointments"
            value={counts.today}
            icon={CalendarDays}
            storageKey="r-today"
          />
        </Panel>
        <Panel delay={0.1}>
          <KpiCard
            title="Checked In"
            value={counts.checkedIn}
            icon={ClipboardCheck}
            iconColor="var(--clinic-blue)"
            iconBg="var(--clinic-blue-soft)"
            storageKey="r-cin"
          />
        </Panel>
        <Panel delay={0.15}>
          <KpiCard
            title="With Doctor"
            value={counts.withDoctor}
            icon={Activity}
            iconColor="var(--clinic-indigo)"
            iconBg="var(--clinic-indigo-soft)"
            storageKey="r-wd"
          />
        </Panel>
        <Panel delay={0.2}>
          <KpiCard
            title="Done Today"
            value={counts.done}
            icon={CheckCircle2}
            iconColor="var(--clinic-green)"
            iconBg="var(--clinic-green-soft)"
            storageKey="r-done"
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.25} className="lg:col-span-8">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Today's check-in queue</h3>
                <p className="text-sm text-muted-foreground">Manage patient flow in real time</p>
              </div>
              <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <UserPlus className="h-4 w-4" /> Add walk-in
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add walk-in patient</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Patient name *</Label>
                      <Input
                        value={walkIn.name}
                        onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone *</Label>
                      <Input
                        value={walkIn.phone}
                        onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Assign doctor</Label>
                      <Select
                        value={walkIn.doctorId}
                        onValueChange={(v) => setWalkIn({ ...walkIn, doctorId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOCK_DOCTORS.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Reason</Label>
                      <Input
                        value={walkIn.reason}
                        onChange={(e) => setWalkIn({ ...walkIn, reason: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setWalkInOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={submitWalkIn}>Add to queue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todays.map((a) => {
                  const p = MOCK_PATIENTS.find((x) => x.id === a.patientId);
                  const d = MOCK_DOCTORS.find((x) => x.id === a.doctorId);
                  const status = queue[a.id] ?? "WAITING";
                  const c = queueColor[status];
                  return (
                    <TableRow
                      key={a.id}
                      className={status === "WITH_DOCTOR" ? "bg-[var(--clinic-blue-soft)]/40" : ""}
                    >
                      <TableCell className="font-mono text-sm">
                        {dayjs(a.datetime).format("HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">
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
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{d?.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{ backgroundColor: c.bg, color: c.fg, borderColor: c.bg }}
                        >
                          {status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {status === "WAITING" && (
                          <Button
                            size="sm"
                            onClick={() => advance(a.id, "CHECKED_IN", "Patient checked in")}
                          >
                            Check In
                          </Button>
                        )}
                        {status === "CHECKED_IN" && (
                          <Button
                            size="sm"
                            className="bg-[var(--clinic-indigo)] hover:bg-[var(--clinic-indigo)]/90"
                            onClick={() => advance(a.id, "WITH_DOCTOR", "Doctor notified")}
                          >
                            Notify Doctor
                          </Button>
                        )}
                        {status === "WITH_DOCTOR" && (
                          <Button size="sm" onClick={() => advance(a.id, "DONE", "Marked done")}>
                            Mark Done
                          </Button>
                        )}
                        {status === "DONE" && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-[var(--clinic-green)]" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </Panel>

        <Panel delay={0.3} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Search patients</h3>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="mt-3 h-[350px] pr-3">
              <ul className="space-y-2">
                {filteredPatients.map((p) => (
                  <li key={p.id}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-colors hover:bg-accent">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">
                            {p.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{p.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{p.phone}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="w-72">
                        <div className="space-y-2">
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ID {p.id} · {p.gender === "F" ? "Female" : "Male"}
                          </div>
                          <div className="text-sm">{p.phone}</div>
                          <div className="text-sm text-muted-foreground">{p.email}</div>
                          <div className="rounded-md bg-muted p-2 text-xs">
                            {p.notes || "No notes"}
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => navigate({ to: "/patients/$id", params: { id: p.id } })}
                          >
                            Open record
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel delay={0.35} className="lg:col-span-8">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Schedule overview</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { label: "Today", items: todays },
                { label: "Tomorrow", items: tomorrow },
                { label: dayjs().add(2, "day").format("ddd"), items: next2 },
              ].map((col) => (
                <div key={col.label} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{col.label}</div>
                    <Badge variant="secondary">{col.items.length}</Badge>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {col.items.slice(0, 4).map((a) => {
                      const p = MOCK_PATIENTS.find((x) => x.id === a.patientId);
                      const d = MOCK_DOCTORS.find((x) => x.id === a.doctorId);
                      return (
                        <li key={a.id} className="rounded-md bg-muted/40 p-2">
                          <div className="text-xs font-mono font-semibold text-[var(--clinic-blue-strong)]">
                            {dayjs(a.datetime).format("HH:mm")}
                          </div>
                          <div className="text-sm font-medium">{p?.name}</div>
                          <div className="text-xs text-muted-foreground">{d?.name}</div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </Panel>

        <Panel delay={0.4} className="lg:col-span-4">
          <Card className="p-5">
            <h3 className="text-base font-semibold">Notification center</h3>
            <ul className="mt-3 space-y-2">
              {MOCK_NOTIFICATIONS.slice(0, 5).map((n) => {
                const p = MOCK_PATIENTS.find((x) => x.id === n.patientId);
                const dot =
                  n.status === "SENT"
                    ? "var(--clinic-teal)"
                    : n.status === "FAILED"
                      ? "var(--clinic-red)"
                      : "var(--clinic-yellow)";
                return (
                  <li key={n.id} className="flex items-center gap-3 rounded-md border p-2">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {dayjs(n.timestamp).format("HH:mm")}
                      </div>
                    </div>
                    {n.status === "FAILED" && (
                      <Button size="sm" variant="outline">
                        Resend
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            <Button variant="outline" className="mt-3 w-full gap-1.5">
              <Send className="h-4 w-4" /> Send manual notification
            </Button>
          </Card>
        </Panel>
      </div>

      <Panel delay={0.45}>
        <Card className="p-5">
          <h3 className="text-base font-semibold">Quick actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {[
              {
                label: "Book Visit",
                icon: CalendarPlus,
                click: () => navigate({ to: "/appointments", search: { add: true } as never }),
              },
              {
                label: "Add Patient",
                icon: UserPlus,
                click: () => navigate({ to: "/patients", search: { add: true } as never }),
              },
              { label: "Send Notif", icon: Send, click: () => navigate({ to: "/notifications" }) },
              {
                label: "Search Appt",
                icon: CalendarSearch,
                click: () => navigate({ to: "/appointments" }),
              },
              { label: "View Schedule", icon: Eye, click: () => navigate({ to: "/appointments" }) },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.click}
                className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--clinic-blue-soft)] text-[var(--clinic-blue-strong)]">
                  <a.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </Panel>
    </div>
  );
}
