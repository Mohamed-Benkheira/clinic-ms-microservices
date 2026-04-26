import { useState, useEffect } from 'react'
import { getPatients, getDoctors, getAppointments } from '../api'
import { useAuth } from '../AuthContext'
import { Link } from 'react-router-dom'
import { Users, Stethoscope, Calendar, Clock, TrendingUp, ArrowRight } from 'lucide-react'

interface Stats { patients: number; doctors: number; appointments: number; scheduled: number }

const statCards = (s: Stats) => [
  { label: 'Total Patients',     value: s.patients,     icon: Users,        color: 'text-blue-500',   bg: 'bg-blue-500/10',   to: '/patients' },
  { label: 'Total Doctors',      value: s.doctors,      icon: Stethoscope,  color: 'text-green-500',  bg: 'bg-green-500/10',  to: '/doctors' },
  { label: 'Total Appointments', value: s.appointments, icon: Calendar,     color: 'text-violet-500', bg: 'bg-violet-500/10', to: '/appointments' },
  { label: 'Scheduled Today',    value: s.scheduled,    icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-500/10', to: '/appointments' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ patients: 0, doctors: 0, appointments: 0, scheduled: 0 })

  useEffect(() => {
    Promise.all([getPatients(), getDoctors(), getAppointments()]).then(([p, d, a]) => {
      setStats({
        patients: p.data.length,
        doctors: d.data.length,
        appointments: a.data.length,
        scheduled: a.data.filter((x: any) => x.status === 'scheduled').length
      })
    }).catch(() => {})
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{greeting}, {user?.full_name?.split(' ')[0]} 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">Here's your clinic overview for today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards(stats).map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
              <TrendingUp size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { to: '/patients',     icon: Users,       label: 'Add Patient',       desc: 'Register a new patient',       color: 'text-blue-500',   bg: 'bg-blue-500/10' },
            { to: '/doctors',      icon: Stethoscope, label: 'Add Doctor',         desc: 'Register a new doctor',        color: 'text-green-500',  bg: 'bg-green-500/10' },
            { to: '/appointments', icon: Calendar,    label: 'Book Appointment',   desc: 'Schedule a new appointment',   color: 'text-violet-500', bg: 'bg-violet-500/10' },
          ].map(({ to, icon: Icon, label, desc, color, bg }) => (
            <Link key={to} to={to} className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent transition-all group">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
