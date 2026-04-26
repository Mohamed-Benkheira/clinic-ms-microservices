import { useState, useEffect } from 'react'
import { getAppointments, createAppointment, updateAppointment, deleteAppointment, getPatients, getDoctors } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
interface Appointment { id: number; patient_id: number; doctor_id: number; scheduled_at: string; status: string; reason: string }
interface Patient { id: number; full_name: string }
interface Doctor  { id: number; full_name: string; specialization: string }
const empty = { patient_id: '', doctor_id: '', scheduled_at: '', reason: '', status: 'scheduled' }
const statusVariant: Record<string, any> = { scheduled: 'default', completed: 'success', cancelled: 'destructive' }
export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients]         = useState<Patient[]>([])
  const [doctors, setDoctors]           = useState<Doctor[]>([])
  const [open, setOpen]                 = useState(false)
  const [editing, setEditing]           = useState<Appointment | null>(null)
  const [form, setForm]                 = useState<any>(empty)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const load = () => {
    getAppointments().then(r => setAppointments(r.data)).catch(() => {})
    getPatients().then(r => setPatients(r.data)).catch(() => {})
    getDoctors().then(r => setDoctors(r.data)).catch(() => {})
  }
  useEffect(() => { load() }, [])
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))
  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setOpen(true) }
  const openEdit = (a: Appointment) => { setEditing(a); setForm({ patient_id: a.patient_id, doctor_id: a.doctor_id, scheduled_at: a.scheduled_at.slice(0,16), reason: a.reason||'', status: a.status }); setError(''); setOpen(true) }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const payload = { ...form, patient_id: parseInt(form.patient_id), doctor_id: parseInt(form.doctor_id), scheduled_at: new Date(form.scheduled_at).toISOString() }
      editing ? await updateAppointment(editing.id, payload) : await createAppointment(payload)
      setOpen(false); load()
    } catch (err: any) { setError(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Error') }
    finally { setLoading(false) }
  }
  const handleDelete = async (id: number) => { if (!confirm('Delete this appointment?')) return; await deleteAppointment(id); load() }
  const pName = (id: number) => patients.find(p => p.id === id)?.full_name || `Patient #${id}`
  const dName = (id: number) => doctors.find(d => d.id === id)?.full_name  || `Doctor #${id}`
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Appointments</h1><p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{appointments.length} total</p></div>
        <Button onClick={openCreate}><Plus size={16} /> Book Appointment</Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader onClose={() => setOpen(false)}><DialogTitle>{editing ? 'Edit Appointment' : 'Book Appointment'}</DialogTitle></DialogHeader>
        <DialogBody>
          {error && <div className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>Patient</Label><Select required value={form.patient_id} onChange={e => set('patient_id', e.target.value)}><option value="">Select patient...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</Select></div>
            <div><Label>Doctor</Label><Select required value={form.doctor_id} onChange={e => set('doctor_id', e.target.value)}><option value="">Select doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name} — {d.specialization}</option>)}</Select></div>
            <div><Label>Date & Time</Label><Input required type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} /></div>
            <div><Label>Reason</Label><Input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason for visit..." /></div>
            <div><Label>Status</Label><Select value={form.status} onChange={e => set('status', e.target.value)}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Select></div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update' : 'Book')}</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogBody>
      </Dialog>
      <Card><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          {['Patient','Doctor','Date & Time','Reason','Status','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {appointments.length === 0 && <tr><td colSpan={6} className="text-center py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>No appointments yet</td></tr>}
          {appointments.map(a => (
            <tr key={a.id} className="border-b hover:bg-[hsl(var(--accent))] transition-colors" style={{ borderColor: 'hsl(var(--border))' }}>
              <td className="px-4 py-3 text-sm font-medium">{pName(a.patient_id)}</td>
              <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Dr. {dName(a.doctor_id)}</td>
              <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{new Date(a.scheduled_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{a.reason || '—'}</td>
              <td className="px-4 py-3"><Badge variant={statusVariant[a.status]}>{a.status}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil size={14} /></Button><Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button></div></td>
            </tr>
          ))}
        </tbody>
      </table></div></Card>
    </div>
  )
}
