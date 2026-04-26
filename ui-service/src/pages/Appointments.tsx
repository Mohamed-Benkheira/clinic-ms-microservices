import { useState, useEffect } from "react";

import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getPatients,
  getDoctors,
} from "../api";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Calendar,
  User,
  Stethoscope,
} from "lucide-react";

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_at: string;
  status: string;
  reason: string;
}
interface Patient {
  id: number;
  full_name: string;
}
interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
}

const empty = {
  patient_id: "",
  doctor_id: "",
  scheduled_at: "",
  reason: "",
  status: "scheduled",
};
const inputCls =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const statusStyle: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-500",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    getAppointments()
      .then((r) => setAppointments(r.data))
      .catch(() => {});
    getPatients()
      .then((r) => setPatients(r.data))
      .catch(() => {});
    getDoctors()
      .then((r) => setDoctors(r.data))
      .catch(() => {});
  };
  useEffect(() => {
    load();
  }, []);
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setError("");
    setOpen(true);
  };
  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      scheduled_at: a.scheduled_at.slice(0, 16),
      reason: a.reason || "",
      status: a.status,
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        patient_id: parseInt(form.patient_id),
        doctor_id: parseInt(form.doctor_id),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      };
      editing
        ? await updateAppointment(editing.id, payload)
        : await createAppointment(payload);
      setOpen(false);
      load();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          JSON.stringify(err.response?.data) ||
          "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    await deleteAppointment(id);
    load();
  };
  const pName = (id: number) =>
    patients.find((p) => p.id === id)?.full_name || `Patient #${id}`;
  const dName = (id: number) =>
    doctors.find((d) => d.id === id)?.full_name || `Doctor #${id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {appointments.length} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Book Appointment
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Patient", "Doctor", "Date & Time", "Reason", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No appointments yet
                </td>
              </tr>
            )}
            {appointments.map((a, i) => (
              <tr
                key={a.id}
                className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="font-medium text-sm">
                      {pName(a.patient_id)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Stethoscope
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="text-sm">Dr. {dName(a.doctor_id)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar
                      size={13}
                      className="text-muted-foreground shrink-0"
                    />
                    <span className="text-sm text-muted-foreground">
                      {new Date(a.scheduled_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
                  {a.reason || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle[a.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openEdit(a)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">
                {editing ? "Edit Appointment" : "New Appointment"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-5">
              {error && (
                <div className="bg-destructive/10 text-destructive text-xs px-3 py-2 rounded-lg mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Patient</label>
                  <select
                    required
                    value={form.patient_id}
                    onChange={(e) => set("patient_id", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Doctor</label>
                  <select
                    required
                    value={form.doctor_id}
                    onChange={(e) => set("doctor_id", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => set("scheduled_at", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Reason</label>
                  <input
                    value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Follow-up consultation"
                  />
                </div>
                {editing && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      className={inputCls}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-9 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editing ? "Update" : "Book"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 h-9 border border-border text-sm rounded-md hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
