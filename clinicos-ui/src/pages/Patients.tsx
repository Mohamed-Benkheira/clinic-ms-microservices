import { useState, useEffect } from 'react'
import { getPatients, createPatient, updatePatient, deletePatient } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
interface Patient { id: number; full_name: string; date_of_birth: string; gender: string; phone: string; email: string; address: string; medical_notes: string }
const empty = { full_name:'', date_of_birth:'', gender:'male', phone:'', email:'', address:'', medical_notes:'' }
export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Patient | null>(null)
  const [form, setForm]         = useState<any>(empty)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const load = () => getPatients().then(r => setPatients(r.data)).catch(() => {})
  useEffect(() => { load() }, [])
  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }))
  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setOpen(true) }
  const openEdit = (p: Patient) => { setEditing(p); setForm({ full_name: p.full_name, date_of_birth: p.date_of_birth, gender: p.gender, phone: p.phone, email: p.email||'', address: p.address||'', medical_notes: p.medical_notes||'' }); setError(''); setOpen(true) }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { editing ? await updatePatient(editing.id, form) : await createPatient(form); setOpen(false); load() }
    catch (err: any) { setError(JSON.stringify(err.response?.data || 'Error')) }
    finally { setLoading(false) }
  }
  const handleDelete = async (id: number) => { if (!confirm('Delete this patient?')) return; await deletePatient(id); load() }
  const filtered = patients.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search))
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Patients</h1><p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{patients.length} registered</p></div>
        <Button onClick={openCreate}><Plus size={16} /> Add Patient</Button>
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
        <Input className="pl-9" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader onClose={() => setOpen(false)}><DialogTitle>{editing ? 'Edit Patient' : 'New Patient'}</DialogTitle></DialogHeader>
        <DialogBody>
          {error && <div className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Full Name</Label><Input required value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
              <div><Label>Date of Birth</Label><Input required type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
              <div><Label>Gender</Label><Select value={form.gender} onChange={e => set('gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></div>
              <div><Label>Phone</Label><Input required value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div className="col-span-2"><Label>Medical Notes</Label><Textarea value={form.medical_notes} onChange={e => set('medical_notes', e.target.value)} /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update' : 'Create')}</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogBody>
      </Dialog>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              {['Patient','Gender','Phone','Medical Notes','Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>No patients found</td></tr>}
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-[hsl(var(--accent))] transition-colors" style={{ borderColor: 'hsl(var(--border))' }}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">{p.full_name[0]}</div><div><p className="text-sm font-medium">{p.full_name}</p><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.email}</p></div></div></td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{p.gender}</Badge></td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.phone}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{p.medical_notes || '—'}</td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil size={14} /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
