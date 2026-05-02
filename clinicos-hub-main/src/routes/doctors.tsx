import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Phone, Mail, ShieldCheck, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/clinic/AppLayout";
import {
  useDoctors,
  useUpdateDoctor,
  useUpdateDoctorAvailability,
  useCreateDoctor,
} from "@/hooks/use-doctors";
import type { Doctor } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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

export const Route = createFileRoute("/doctors")({
  head: () => ({ meta: [{ title: "Doctors — ClinicOS" }] }),
  component: DoctorsRoute,
});

const SPECIALTIES = [
  "General Practice",
  "Cardiology",
  "Pediatrics",
  "Neurology",
  "Orthopedics",
  "Dermatology",
];
const EMPTY_FORM: Omit<Doctor, "id"> = {
  name: "",
  specialty: "General Practice",
  license: "",
  phone: "",
  email: "",
  status: "AVAILABLE",
};

function DoctorsRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: doctors = [], isLoading, isError } = useDoctors();
  const updateMutation = useUpdateDoctor();
  const availabilityMutation = useUpdateDoctorAvailability();
  const createMutation = useCreateDoctor();

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Doctor, "id">>(EMPTY_FORM);
  const [createForm, setCreateForm] = useState<Omit<Doctor, "id" | "status">>({
    name: "",
    specialty: "General Practice",
    license: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);
  if (!user) return null;

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      name: d.name,
      specialty: d.specialty,
      license: d.license,
      phone: d.phone,
      email: d.email,
      status: d.status,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!editing) return;
    if (form.name.length < 2 || form.license.length < 3) {
      toast.error("Please complete the required fields");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editing.id, ...form });
      toast.success("Doctor updated");
      setOpen(false);
    } catch {
      toast.error("Failed to update doctor");
    }
  };

  const submitCreate = async () => {
    if (createForm.name.length < 2 || createForm.license.length < 3) {
      toast.error("Please complete the required fields");
      return;
    }
    try {
      await createMutation.mutateAsync(createForm);
      toast.success("Doctor added successfully");
      setCreateOpen(false);
      setCreateForm({ name: "", specialty: "General Practice", license: "", phone: "", email: "" });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "Failed to add doctor")
          : "Failed to add doctor";
      toast.error(msg);
    }
  };

  // Availability toggle directly from the card (no dialog needed)
  const toggleAvailability = async (d: Doctor) => {
    try {
      await availabilityMutation.mutateAsync({ id: d.id, available: d.status !== "AVAILABLE" });
      toast.success(`${d.name} marked as ${d.status === "AVAILABLE" ? "busy" : "available"}`);
    } catch {
      toast.error("Failed to update availability");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Doctors</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${doctors.length} doctors on the platform`}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add doctor
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[250px]" />
            ))}
          </div>
        ) : isError ? (
          <Card className="py-16 text-center">
            <p className="text-sm text-destructive">Failed to load doctors. Please refresh.</p>
          </Card>
        ) : doctors.length === 0 ? (
          <Card className="py-16 text-center">
            <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No doctors in the directory</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-lg font-semibold text-[var(--clinic-blue-strong)]">
                      {d.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <button
                        className="text-base font-semibold hover:underline"
                        onClick={() => navigate({ to: "/doctors/$id", params: { id: d.id } })}
                      >
                        {d.name}
                      </button>
                      <p className="text-sm text-muted-foreground">{d.specialty}</p>
                      <Badge
                        className="mt-1"
                        style={{
                          backgroundColor:
                            d.status === "AVAILABLE"
                              ? "var(--clinic-green-soft)"
                              : "var(--clinic-red-soft)",
                          color:
                            d.status === "AVAILABLE" ? "var(--clinic-green)" : "var(--clinic-red)",
                        }}
                      >
                        {d.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {d.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {d.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> {d.license}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={d.status === "AVAILABLE"}
                        onCheckedChange={() => toggleAvailability(d)}
                        disabled={availabilityMutation.isPending}
                      />
                      Available
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--clinic-blue)]"
                      onClick={() => openEdit(d)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit modal — no create (doctors are created via auth seeding) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Select
                  value={form.specialty}
                  onValueChange={(v) => setForm({ ...form, specialty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>License *</Label>
                <Input
                  value={form.license}
                  onChange={(e) => setForm({ ...form, license: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Available for appointments</Label>
                <Switch
                  checked={form.status === "AVAILABLE"}
                  onCheckedChange={(c) => setForm({ ...form, status: c ? "AVAILABLE" : "BUSY" })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create doctor dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full name *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <Select
                  value={createForm.specialty}
                  onValueChange={(v) => setCreateForm({ ...createForm, specialty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>License number *</Label>
                <Input
                  value={createForm.license}
                  onChange={(e) => setCreateForm({ ...createForm, license: e.target.value })}
                  placeholder="MED-12345"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone *</Label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="doctor@clinic.med"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={submitCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add doctor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete dialog kept for UI completeness — backend delete not yet exposed */}
        <Dialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke access?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will remove the doctor from the platform.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDelId(null)}>
                Cancel
              </Button>
              <Button
                className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90"
                onClick={() => setDelId(null)}
              >
                Confirm removal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
