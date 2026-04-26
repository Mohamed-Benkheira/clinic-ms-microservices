import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../AuthContext'
import { HeartPulse } from 'lucide-react'

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-3">
            <HeartPulse size={20} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">ClinicOS</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2.5 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-9 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            No account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
