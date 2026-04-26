import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { LayoutDashboard, Users, Stethoscope, Calendar, LogOut, HeartPulse, Settings } from 'lucide-react'
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-card border-r border-border shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <HeartPulse size={14} className="text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm tracking-tight">ClinicOS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">Navigation</p>
          {nav.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-border space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logoutUser(); navigate('/login') }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card shrink-0">
          <h1 className="text-sm font-semibold text-muted-foreground">
            {nav.find(n => n.path === location.pathname)?.label ?? 'Dashboard'}
          </h1>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors">
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
