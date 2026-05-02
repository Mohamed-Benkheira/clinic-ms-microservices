import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Plus, Download, Edit, Trash2, Filter, Check, ChevronsUpDown, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/clinic/AppLayout";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointmentStatus,
  useCancelAppointment,
} from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { useDoctors } from "@/hooks/use-doctors";
import type {
  Appointment,
  AppointmentDuration,
  AppointmentStatus,
  AppointmentType,
  PaymentMethod,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "Appointments — ClinicOS" }] }),
  component: AppointmentsRoute,
  validateSearch: (s: Record<string, unknown>): { add?: boolean; patientId?: string } => ({
    add: typeof s.add === "boolean" ? s.add : undefined,
    patientId: typeof s.patientId === "string" ? s.patientId : undefined,
  }),
});

const TYPE_OPTIONS: AppointmentType[] = [
  "Consultation",
  "Follow-up",
  "Checkup",
  "Emergency",
  "Lab Test",
  "Imaging",
];
const DURATION_OPTIONS: AppointmentDuration[] = [
  "15 min",
  "30 min",
  "45 min",
  "1 hour",
  "1.5 hours",
  "2 hours",
];
const PAYMENT_OPTIONS: PaymentMethod[] = ["CNAS", "CASNOS", "Cash", "Private Insurance"];
const REASON_PRESETS = ["Follow-up", "Checkup", "Consultation", "Emergency", "Routine"];

export const TYPE_COLORS: Record<AppointmentType, { bg: string; fg: string }> = {
  Consultation: { bg: "var(--clinic-blue-soft)", fg: "var(--clinic-blue-strong)" },
  "Follow-up": { bg: "var(--clinic-indigo-soft)", fg: "var(--clinic-indigo)" },
  Emergency: { bg: "var(--clinic-red-soft)", fg: "var(--clinic-red)" },
  Checkup: { bg: "var(--clinic-green-soft)", fg: "var(--clinic-green)" },
  "Lab Test": { bg: "var(--clinic-yellow-soft)", fg: "var(--clinic-yellow)" },
  Imaging: { bg: "oklch(0.92 0.06 300)", fg: "oklch(0.45 0.2 300)" },
};

export function TypeBadge({ type }: { type: AppointmentType }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS["Consultation"];
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: c.bg, color: c.fg, borderColor: "transparent" }}
    >
      {type}
    </Badge>
  );
}

function newDraft(prefilledPatientId = ""): Omit<Appointment, "id"> {
  return {
    patientId: prefilledPatientId,
    doctorId: "",
    datetime: dayjs().add(1, "day").format("YYYY-MM-DDTHH:mm"),
    reason: "Checkup",
    status: "SCHEDULED",
    appointmentType: "Consultation",
    duration: "30 min",
    notes: "",
    notifyPatient: true,
    payment: "CNAS",
  };
}

function AppointmentsRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  // ── Real data ──────────────────────────────────────────────────────────────
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: patients = [] } = usePatients();
  const { data: doctors = [] } = useDoctors();

  const createMutation = useCreateAppointment();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const cancelMutation = useCancelAppointment();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<"ALL" | AppointmentStatus>("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [form, setForm] = useState<Omit<Appointment, "id">>(newDraft());
  const [reasonOpen, setReasonOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  // Open add modal if navigated with ?add=true
  useEffect(() => {
    if (search.add) {
      setEditing(null);
      setForm(newDraft(search.patientId));
      setOpen(true);
      navigate({
        to: "/appointments",
        search: { add: undefined, patientId: undefined },
        replace: true,
      });
    }
  }, [search.add, search.patientId, navigate]);

  if (!user) return null;
  const canEdit = user.role === "ADMIN" || user.role === "RECEPTIONIST";

  // Build lookup maps for names
  const patientMap = useMemo(
    () => Object.fromEntries(patients.map((p) => [p.id, p.name])),
    [patients],
  );
  const doctorMap = useMemo(
    () => Object.fromEntries(doctors.map((d) => [d.id, d.name])),
    [doctors],
  );

  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter !== "ALL") list = list.filter((a) => a.status === statusFilter);
    if (doctorFilter !== "ALL") list = list.filter((a) => a.doctorId === doctorFilter);
    return list.sort((a, b) => +new Date(b.datetime) - +new Date(a.datetime));
  }, [appointments, statusFilter, doctorFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(newDraft());
    setOpen(true);
  };

  const submit = async () => {
    if (!form.patientId || !form.doctorId || !form.datetime) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      const iso = new Date(form.datetime).toISOString();
      if (editing) {
        await updateStatusMutation.mutateAsync({ id: editing.id, status: form.status });
        toast.success("Appointment updated");
      } else {
        await createMutation.mutateAsync({ ...form, datetime: iso });
        toast.success("Appointment booked");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save appointment");
    }
  };

  const doCancel = async () => {
    if (!delId) return;
    try {
      await cancelMutation.mutateAsync(delId);
      toast.success("Appointment cancelled");
      setDelId(null);
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const markComplete = async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: "COMPLETED" });
      toast.success("Marked as completed");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const isMutating = createMutation.isPending || updateStatusMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">
              {user.role === "PATIENT" ? "My appointments" : "Appointments"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${filtered.length} appointments`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" /> Export
            </Button>
            {canEdit && (
              <Button size="sm" onClick={openAdd} className="gap-1.5">
                <Plus className="h-4 w-4" /> Book appointment
              </Button>
            )}
          </div>
        </div>

        {user.role !== "PATIENT" && (
          <Card className="flex flex-wrap items-center gap-3 p-3">
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "ALL" | AppointmentStatus)}
            >
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Scheduled</TabsTrigger>
                <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
                <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
            {user.role !== "DOCTOR" && (
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All doctors</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Card>
        )}

        <Card className="p-4">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Filter className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No appointments match your filters
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & time</TableHead>
                    {user.role !== "DOCTOR" && <TableHead>Doctor</TableHead>}
                    {user.role !== "PATIENT" && <TableHead>Patient</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {dayjs(a.datetime).format("MMM D, YYYY")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dayjs(a.datetime).format("HH:mm")}
                        </div>
                      </TableCell>
                      {user.role !== "DOCTOR" && (
                        <TableCell className="text-sm">{doctorMap[a.doctorId] ?? "—"}</TableCell>
                      )}
                      {user.role !== "PATIENT" && (
                        <TableCell className="text-sm">{patientMap[a.patientId] ?? "—"}</TableCell>
                      )}
                      <TableCell>
                        <TypeBadge type={a.appointmentType} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.duration}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.reason}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDetail(a)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--clinic-blue)]"
                              onClick={() => {
                                setEditing(a);
                                setForm({
                                  ...a,
                                  datetime: dayjs(a.datetime).format("YYYY-MM-DDTHH:mm"),
                                });
                                setOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--clinic-red)]"
                              onClick={() => setDelId(a.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : user.role === "DOCTOR" && a.status === "SCHEDULED" ? (
                          <Button
                            size="sm"
                            onClick={() => markComplete(a.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            Complete
                          </Button>
                        ) : user.role === "PATIENT" ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setDetail(a)}>
                              View
                            </Button>
                            {a.status === "SCHEDULED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[var(--clinic-red)] text-[var(--clinic-red)]"
                                onClick={() => setDelId(a.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Book / Edit modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit appointment" : "Book appointment"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Patient *</Label>
                  <Select
                    value={form.patientId}
                    onValueChange={(v) => setForm({ ...form, patientId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Doctor *</Label>
                  <Select
                    value={form.doctorId}
                    onValueChange={(v) => setForm({ ...form, doctorId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Date & time *</Label>
                  <Input
                    type="datetime-local"
                    value={form.datetime}
                    onChange={(e) => setForm({ ...form, datetime: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Select
                    value={form.duration}
                    onValueChange={(v) => setForm({ ...form, duration: v as AppointmentDuration })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Appointment type</Label>
                  <Select
                    value={form.appointmentType}
                    onValueChange={(v) =>
                      setForm({ ...form, appointmentType: v as AppointmentType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Insurance / Payment</Label>
                  <Select
                    value={form.payment ?? ""}
                    onValueChange={(v) => setForm({ ...form, payment: v as PaymentMethod })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Popover open={reasonOpen} onOpenChange={setReasonOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {form.reason || "Type or select…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Type a reason…"
                        value={form.reason}
                        onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}
                      />
                      <CommandList>
                        <CommandEmpty>Press enter to use this reason.</CommandEmpty>
                        <CommandGroup heading="Presets">
                          {REASON_PRESETS.map((r) => (
                            <CommandItem
                              key={r}
                              value={r}
                              onSelect={() => {
                                setForm((f) => ({ ...f, reason: r }));
                                setReasonOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.reason === r ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {r}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Notes for doctor</Label>
                <Textarea
                  rows={3}
                  placeholder="Clinical notes, symptoms, allergies…"
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex items-start justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Notify patient</div>
                  {form.notifyPatient && (
                    <div className="text-xs text-muted-foreground">
                      Patient will receive a confirmation.
                    </div>
                  )}
                </div>
                <Switch
                  checked={form.notifyPatient}
                  onCheckedChange={(v) => setForm({ ...form, notifyPatient: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isMutating}>
                {isMutating ? "Saving…" : editing ? "Update" : "Confirm booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail modal */}
        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Appointment details</DialogTitle>
            </DialogHeader>
            {detail && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patient</span>
                  <span className="font-medium">{patientMap[detail.patientId] ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium">{doctorMap[detail.doctorId] ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date & time</span>
                  <span className="font-medium">
                    {dayjs(detail.datetime).format("MMM D, YYYY · HH:mm")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <TypeBadge type={detail.appointmentType} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{detail.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium">{detail.payment ?? "—"}</span>
                </div>
                <div>
                  <div className="text-muted-foreground">Reason</div>
                  <div className="mt-1 font-medium">{detail.reason}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Notes</div>
                  <div className="mt-1 rounded-md bg-muted p-3 text-foreground">
                    {detail.notes || "No notes"}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetail(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel confirmation */}
        <Dialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel this appointment?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">This action can't be undone.</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDelId(null)}>
                Keep
              </Button>
              <Button
                className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90"
                onClick={doCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel it"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
