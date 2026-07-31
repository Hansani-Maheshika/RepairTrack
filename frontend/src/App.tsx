import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RoleDashboard } from './pages/dashboard/RoleDashboard'
import { HomePage } from './pages/public/HomePage'
import { MessagePage } from './pages/shared/MessagePage'
import { ProtectedRoute } from './routes/ProtectedRoute'

export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/track" element={<MessagePage title="Track a repair" message="Public tracking will be connected in a later step." />} />
    <Route path="/unauthorized" element={<MessagePage title="Access denied" message="Your account is not allowed to open that page." />} />

    <Route element={<ProtectedRoute />}><Route element={<DashboardLayout />}>
      <Route element={<ProtectedRoute roles={['ADMIN']} />}><Route path="/admin/dashboard" element={<RoleDashboard />} /></Route>
      <Route element={<ProtectedRoute roles={['RECEPTIONIST']} />}><Route path="/receptionist/dashboard" element={<RoleDashboard />} /></Route>
      <Route element={<ProtectedRoute roles={['TECHNICIAN']} />}><Route path="/technician/dashboard" element={<RoleDashboard />} /></Route>
      <Route element={<ProtectedRoute roles={['ADMIN', 'RECEPTIONIST']} />}><Route path="/customers" element={<MessagePage title="Customers" message="Customer management is the next frontend step." />} /></Route>
      <Route path="/repairs" element={<MessagePage title="Repairs" message="Repair management will be connected after customers and devices." />} />
    </Route></Route>
    <Route path="*" element={<MessagePage title="Page not found" message="The requested page does not exist." />} />
    <Route path="/dashboard" element={<Navigate to="/login" replace />} />
  </Routes>
}
