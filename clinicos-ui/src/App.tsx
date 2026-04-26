import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</div>
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />
}
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" /> : <>{children}</>
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"     element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/patients"     element={<PrivateRoute><Patients /></PrivateRoute>} />
          <Route path="/doctors"      element={<PrivateRoute><Doctors /></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
