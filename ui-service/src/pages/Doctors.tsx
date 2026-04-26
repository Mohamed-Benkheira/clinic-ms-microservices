import { useState, useEffect } from "react";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "../api";
import { Plus, Pencil, Trash2, Phone, Mail, CreditCard, X } from "lucide-react";

interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
  phone: string;
  email: string;
  license_number: string;
  available: boolean;
}
const SPECS = [
  "general",
  "cardiology",
  "neurology",
  "pediatrics",
  "orthopedics",
  "dermatology",
  "other",
];
const empty = {
  full_name: "",
  specialization: "general",
  phone: "",
  email: "",
  license_number: "",
  available: true,
};
const inputCls =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    getDoctors()
      .then((r) => setDoctors(r.data))
      .catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setError("");
    setOpen(true);
  };
  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      full_name: d.full_name,
      specialization: d.specialization,
      phone: d.phone,
      email: d.email,
      license_number: d.license_number,
      available: d.available,
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      editing ? await updateDoctor(editing.id, form) : await createDoctor(form);
      setOpen(false);
      load();
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Error"));
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this doctor?")) return;
    await deleteDoctor(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Doctors</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {doctors.length} registered
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {doctors.length === 0 && (
          <p className="col-span-3 text-center py-12 text-muted-foreground text-sm">
            No doctors registered yet
          </p>
        )}
        {doctors.map((d) => (
          <div
            key={d.id}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {d.full_name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">Dr. {d.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {d.specialization}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.available ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}
              >
                {d.available ? "Available" : "Busy"}
              </span>
            </div>

            <div className="space-y-1.5 mb-4">
              {[
                { icon: Phone, text: d.phone },
                { icon: Mail, text: d.email },
                { icon: CreditCard, text: d.license_number },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Icon size={12} className="shrink-0" />
                  <span className="truncate">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1 border-t border-border">
              <button
                onClick={() => openEdit(d)}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 text-xs font-medium rounded-md border border-border hover:bg-accent transition-colors mt-3"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={() => handleDelete(d.id)}
                className="h-8 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-3"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">
                {editing ? "Edit Doctor" : "New Doctor"}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-medium">Full Name</label>
                    <input
                      required
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">
                      Specialization
                    </label>
                    <select
                      value={form.specialization}
                      onChange={(e) => set("specialization", e.target.value)}
                      className={inputCls}
                    >
                      {SPECS.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">License #</label>
                    <input
                      required
                      value={form.license_number}
                      onChange={(e) => set("license_number", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Phone</label>
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="avail"
                      checked={form.available}
                      onChange={(e) => set("available", e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                    <label htmlFor="avail" className="text-sm">
                      Available for appointments
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-9 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editing ? "Update" : "Create"}
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
