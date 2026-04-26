import { useState, useEffect } from "react";
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from "../api";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";

interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  medical_notes: string;
}
const empty = {
  full_name: "",
  date_of_birth: "",
  gender: "male",
  phone: "",
  email: "",
  address: "",
  medical_notes: "",
};
const inputCls =
  "w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    getPatients()
      .then((r) => setPatients(r.data))
      .catch(() => {});
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
  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({
      full_name: p.full_name,
      date_of_birth: p.date_of_birth,
      gender: p.gender,
      phone: p.phone,
      email: p.email || "",
      address: p.address || "",
      medical_notes: p.medical_notes || "",
    });
    setError("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      editing
        ? await updatePatient(editing.id, form)
        : await createPatient(form);
      setOpen(false);
      load();
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this patient?")) return;
    await deletePatient(id);
    load();
  };
  const filtered = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patients</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {patients.length} registered
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {["Patient", "Gender", "Phone", "Medical Notes", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  No patients found
                </td>
              </tr>
            )}
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {p.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.email || "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.gender === "male" ? "bg-blue-500/10 text-blue-600" : "bg-pink-500/10 text-pink-600"}`}
                  >
                    {p.gender}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.phone}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                  {p.medical_notes || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => openEdit(p)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">
                {editing ? "Edit Patient" : "New Patient"}
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
                    <label className="text-xs font-medium">Date of Birth</label>
                    <input
                      required
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => set("date_of_birth", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      className={inputCls}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
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
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-medium">Medical Notes</label>
                    <textarea
                      value={form.medical_notes}
                      onChange={(e) => set("medical_notes", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
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
