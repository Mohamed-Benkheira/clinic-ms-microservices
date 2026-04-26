import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getMe } from './api'
interface User { id: number; email: string; full_name: string; role: string }
interface AuthCtx { user: User | null; loading: boolean; loginUser: (token: string, user: User) => void; logoutUser: () => void }
const AuthContext = createContext<AuthCtx | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) { getMe().then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false)) }
    else { setLoading(false) }
  }, [])
  const loginUser  = (t: string, u: User) => { localStorage.setItem('token', t); setUser(u) }
  const logoutUser = () => { localStorage.removeItem('token'); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)!
