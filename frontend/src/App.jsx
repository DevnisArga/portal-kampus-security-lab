import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import ProfilePage from './pages/ProfilePage'
import CoursesPage from './pages/CoursesPage'
import GradesPage from './pages/GradesPage'
import AssignmentsPage from './pages/AssignmentsPage'
import DiscussionsPage from './pages/DiscussionsPage'
import SecurityLabPage from './pages/SecurityLabPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminCoursesPage from './pages/AdminCoursesPage'
import DosenGradesPage from './pages/DosenGradesPage'

function PrivateRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="mata-kuliah" element={<CoursesPage />} />
          <Route path="nilai" element={<PrivateRoute roles={['mahasiswa']}><GradesPage /></PrivateRoute>} />
          <Route path="tugas" element={<AssignmentsPage />} />
          <Route path="diskusi" element={<DiscussionsPage />} />
          <Route path="security-lab" element={<SecurityLabPage />} />
          {/* Admin routes */}
          <Route path="pengguna" element={<PrivateRoute roles={['admin']}><AdminUsersPage /></PrivateRoute>} />
          <Route path="kelola-matkul" element={<PrivateRoute roles={['admin']}><AdminCoursesPage /></PrivateRoute>} />
          {/* Dosen routes */}
          <Route path="kelola-nilai" element={<PrivateRoute roles={['dosen', 'admin']}><DosenGradesPage /></PrivateRoute>} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
