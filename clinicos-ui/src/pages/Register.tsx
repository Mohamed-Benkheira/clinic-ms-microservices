import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Activity } from 'lucide-react'
export default function Register() {
  const [form, setForm] = useState({ email: '', full_name: '', role: 'patient', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser }         = useAuth()
  const navigate              = useNavigate()
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { const res = await register(form); loginUser(res.data.access, res.data.user); navigate('/') }
    catch (err: any) { setError(err.response?.data?.email?.[0] || 'Registration failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-4"><Activity size={24} className="text-white" /></div>
          <h1 className="text-2xl font-bold">Create account</h1>
        </div>
        <div className="rounded-xl border p-6" style={{ backgroundColor: 'hsl(var(--card))' }}>
          {error && <div className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            <div><Label>Role</Label><Select value={form.role} onChange={e => set('role', e.target.value)}><option value="patient">Patient</option><option value="doctor">Doctor</option><option value="receptionist">Receptionist</option><option value="admin">Admin</option></Select></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
          </form>
          <p className="text-center text-sm mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Have an account? <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
