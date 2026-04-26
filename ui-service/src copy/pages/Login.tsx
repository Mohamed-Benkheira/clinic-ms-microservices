import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Activity } from 'lucide-react'
export default function Login() {
  const [email, setEmail]       = useState('admin@clinicos.com')
  const [password, setPassword] = useState('admin1234')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { loginUser }           = useAuth()
  const navigate                = useNavigate()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try { const res = await login({ email, password }); loginUser(res.data.access, res.data.user); navigate('/') }
    catch { setError('Invalid email or password') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center mx-auto mb-4"><Activity size={24} className="text-white" /></div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Sign in to ClinicOS</p>
        </div>
        <div className="rounded-xl border p-6" style={{ backgroundColor: 'hsl(var(--card))' }}>
          {error && <div className="bg-red-500/10 text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
          </form>
          <p className="text-center text-sm mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No account? <Link to="/register" className="text-[hsl(var(--primary))] hover:underline">Register</Link></p>
        </div>
      </div>
    </div>
  )
}
