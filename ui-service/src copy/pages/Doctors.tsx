import { useState, useEffect } from 'react'
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Phone, Mail, IdCard } from 'lucide-react'
interface Doctor { id: number; full_name: string; specialization: string; phone: string; email: string; license_number: string; available: boolean }
const SPECS = ['general','cardiology','neurology','pediatrics','orthopedics','dermatology','other']
const empty = { full_name:'', specialization:'general', phone:'', email:'', license_number:'', available: true }
export default function Doctors() {
  const [doctors, setDoctors]   = useState<Doctor[]>([])
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Doctor | null>(null)
  const [form, setForm]         = useState<any>(empty)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const load = () => getDoctors().then(r => setDoctors(r.data)).catch(() => {})
  useEffect(() => { load() }, [])
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setOpen(true) }
  const openEdit = (d: Doctor) => { setEditing(d); setForm({ full_name: d.full_name, specialization: d.specialization, phone: d.phone, email: d.email, license_number: d.license_number, available: d.available }); setError(''); setOpen(true) }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { editing ? await updateDoctor(editing.id, form) : await createDoctor(form); setOpen(false); load() }
    catch (err: any) { setError(JSON.stringify(err.response?.data || 'Error')) }
    finally { setLoading(false) }
  }
  const handleDelete = async (id: number) => { if (!confirm('Delete this doctor?')) return; await deleteDoctor(id); load() }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">Doctors</h1><p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{doctors.length} registered</p></div>
        <Button onClick={openCreate}><Plus size={16} /> Add Doctor</Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader onClose={() => setOpen(false)}><DialogTitle>{editing ? 'Edit Doctor' : 'New Doctor'}</DialogTitle></DialogHeader>
        <DialogBody>
          {error && <div className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Full Name</Label><Input required value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
              <div><Label>Specialization</Label><Select value={form.specialization} onChange={e => set('specialization', e.target.value)}>{SPECS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}</Select></div>
              <div><Label>License Number</Label><Input required value={form.license_number} onChange={e => set('license_number', e.target.value)} /></div>
              <div><Label>Phone</Label><Input required value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
              <div className="col-span-2 flex items-center gap-2"><input type="checkbox" id="avail" checked={form.available} onChange={e => set('available', e.target.checked)} className="w-4 h-4 accent-blue-500" /><label htmlFor="avail" className="text-sm">Available for appointments</label></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Saving...' : (editing ? 'Update' : 'Create')}</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogBody>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.length === 0 && <p className="col-span-3 text-center py-10" style={{ color: 'hsl(var(--muted-foreground))' }}>No doctors registered yet</p>}
        {doctors.map(d => (
          <Card key={d.id} className="hover:border-[hsl(var(--primary))] transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold">{d.full_name[0]}</div>
                  <div><p className="font-medium text-sm">Dr. {d.full_name}</p><p className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{d.specialization}</p></div>
                </div>
                <Badge variant={d.available ? 'success' : 'destructive'}>{d.available ? 'Available' : 'Busy'}</Badge>
              </div>
              <div className="space-y-1.5 mb-4">
                {[{ icon: Phone, text: d.phone }, { icon: Mail, text: d.email }, { icon: IdCard, text: d.license_number }].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}><Icon size={12} />{text}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(d)}><Pencil size={13} /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(d.id)}><Trash2 size={13} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
