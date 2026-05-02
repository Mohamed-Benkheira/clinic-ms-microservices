import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Edit, Trash2, Download, FileText } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/clinic/AppLayout";
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "@/hooks/use-patients";
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/patients")({
  head: () => ({ meta: [{ title: "Patients — ClinicOS" }] }),
  component: PatientsRoute,
});

function PatientsRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Patient>({
    id: "",
    name: "",
    email: "",
    phone: "",
    gender: "M",
    dob: "",
    notes: "",
  });

  // ── Real data ──────────────────────────────────────────────────────────────
  const { data: patients = [], isLoading } = usePatients();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  const canEdit = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";
  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [patients, search],
  );

  if (!user) return null;
  if (user.role === "PATIENT") {
    navigate({ to: "/dashboard" });
    return null;
  }

  const openAdd = () => {
    setEditing(null);
    setForm({ id: "", name: "", email: "", phone: "", gender: "M", dob: "", notes: "" });
    setModalOpen(true);
  };
  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm(p);
    setModalOpen(true);
  };
  const submit = async () => {
    if (form.name.length < 2 || !form.email.includes("@")) {
      toast.error("Please complete the required fields");
      return;
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ ...form, id: editing.id });
        toast.success("Patient updated");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Patient added");
      }
      setModalOpen(false);
    } catch {
      toast.error(editing ? "Failed to update patient" : "Failed to add patient");
    }
  };
  const doDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Patient deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete patient");
    }
  };
  const exportCsv = () => {
    const rows = [
      ["ID", "Name", "Email", "Gender", "Phone", "Notes"],
      ...patients.map((p) => [p.id, p.name, p.email, p.gender, p.phone, p.notes]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinicos-patients-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Patients directory</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading…" : `${patients.length} patients in your clinic`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportCsv}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && (
              <Button size="sm" onClick={openAdd} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add patient
              </Button>
            )}
          </div>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No patients found</p>
                {canEdit && (
                  <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
                    Add your first patient
                  </Button>
                )}
              </div>
            ) : (
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canEdit && <TableHead className="w-8"></TableHead>}
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        {canEdit && (
                          <TableCell>
                            <Checkbox
                              checked={selected.includes(p.id)}
                              onCheckedChange={(c) =>
                                setSelected((s) => (c ? [...s, p.id] : s.filter((x) => x !== p.id)))
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">
                              {p.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <button
                              className="text-sm font-medium hover:underline"
                              onClick={() =>
                                navigate({ to: "/patients/$id", params: { id: p.id } })
                              }
                            >
                              {p.name}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor:
                                p.gender === "F"
                                  ? "var(--clinic-pink-soft)"
                                  : "var(--clinic-blue-soft)",
                              color:
                                p.gender === "F"
                                  ? "var(--clinic-pink)"
                                  : "var(--clinic-blue-strong)",
                            }}
                          >
                            {p.gender}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{p.phone}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate text-sm text-muted-foreground">
                                {p.notes || "—"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {p.notes || "No notes"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[var(--clinic-blue)]"
                                onClick={() => openEdit(p)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[var(--clinic-red)]"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                navigate({ to: "/patients/$id", params: { id: p.id } })
                              }
                            >
                              <FileText className="h-3 w-3" /> View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            )}
          </div>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit patient" : "Add patient"}</DialogTitle>
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
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date of birth</Label>
                  <Input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v as "M" | "F" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Medical notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isMutating}>
                {isMutating ? "Saving…" : editing ? "Save changes" : "Add patient"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete patient?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">This action can't be undone.</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={isMutating}>
                Cancel
              </Button>
              <Button
                className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90"
                onClick={doDelete}
                disabled={isMutating}
              >
                {isMutating ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
