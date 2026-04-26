import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LayoutDashboard, Users, Stethoscope, Calendar, LogOut, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
const nav = [
  { path: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/patients',     label: 'Patients',     icon: Users },
  { path: '/doctors',      label: 'Doctors',      icon: Stethoscope },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
]
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <aside className="w-60 flex flex-col border-r" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <div className="p-5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">ClinicOS</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Medical Platform</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", active ? "bg-[hsl(var(--primary))] text-white font-medium" : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]")}>
                <Icon size={16} />{label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-xs font-bold text-white">{user?.full_name?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logoutUser(); navigate('/login') }} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-8 max-w-7xl">{children}</div></main>
    </div>
  )
}
