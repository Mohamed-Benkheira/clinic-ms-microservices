import { useState, useEffect } from 'react'
import { getPatients, getDoctors, getAppointments } from '../api'
import { useAuth } from '../AuthContext'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Stethoscope, Calendar, CheckCircle, ArrowRight } from 'lucide-react'
interface Stats { patients: number; doctors: number; appointments: number; scheduled: number }
function StatCard({ label, value, icon: Icon, color, to }: { label: string; value: number; icon: any; color: string; to: string }) {
  return (
    <Link to={to}><Card className="hover:border-[hsl(var(--primary))] transition-colors cursor-pointer"><CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} className="text-white" /></div>
        <ArrowRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
    </CardContent></Card></Link>
  )
}
export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ patients: 0, doctors: 0, appointments: 0, scheduled: 0 })
  useEffect(() => {
    Promise.all([getPatients(), getDoctors(), getAppointments()]).then(([p, d, a]) => {
      setStats({ patients: p.data.length, doctors: d.data.length, appointments: a.data.length, scheduled: a.data.filter((x: any) => x.status === 'scheduled').length })
    }).catch(() => {})
  }, [])
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Good morning, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Here's your clinic overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Patients"   value={stats.patients}     icon={Users}       color="bg-blue-500"   to="/patients" />
        <StatCard label="Total Doctors"    value={stats.doctors}      icon={Stethoscope} color="bg-green-500"  to="/doctors" />
        <StatCard label="Appointments"     value={stats.appointments} icon={Calendar}    color="bg-purple-500" to="/appointments" />
        <StatCard label="Scheduled Today"  value={stats.scheduled}    icon={CheckCircle} color="bg-orange-500" to="/appointments" />
      </div>
      <Card><CardContent className="p-6">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[{ to: '/patients', icon: Users, label: 'New Patient', desc: 'Register a patient' }, { to: '/doctors', icon: Stethoscope, label: 'New Doctor', desc: 'Add a doctor' }, { to: '/appointments', icon: Calendar, label: 'Book Appointment', desc: 'Schedule a visit' }].map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to} className="flex items-center gap-3 p-4 rounded-lg border hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center"><Icon size={16} className="text-blue-400" /></div>
              <div><p className="text-sm font-medium">{label}</p><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p></div>
            </Link>
          ))}
        </div>
      </CardContent></Card>
    </div>
  )
}
