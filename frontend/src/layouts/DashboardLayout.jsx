import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HiHome, HiUser, HiBookOpen, HiAcademicCap, HiClipboardList,
  HiChatAlt2, HiShieldExclamation, HiUsers, HiCog, HiLogout,
  HiChevronLeft, HiChevronRight, HiCollection, HiClipboardCheck,
  HiBell, HiMenuAlt2
} from 'react-icons/hi'

const roleNav = {
  mahasiswa: [
    { to: '/dashboard', icon: HiHome, label: 'Beranda', end: true },
    { to: '/dashboard/profil', icon: HiUser, label: 'Profil Saya' },
    { to: '/dashboard/mata-kuliah', icon: HiBookOpen, label: 'Mata Kuliah' },
    { to: '/dashboard/nilai', icon: HiAcademicCap, label: 'Nilai & IPK' },
    { to: '/dashboard/tugas', icon: HiClipboardList, label: 'Tugas' },
    { to: '/dashboard/diskusi', icon: HiChatAlt2, label: 'Diskusi' },
    { to: '/dashboard/security-lab', icon: HiShieldExclamation, label: 'Security Lab' },
  ],
  dosen: [
    { to: '/dashboard', icon: HiHome, label: 'Beranda', end: true },
    { to: '/dashboard/profil', icon: HiUser, label: 'Profil Saya' },
    { to: '/dashboard/mata-kuliah', icon: HiBookOpen, label: 'Mata Kuliah' },
    { to: '/dashboard/tugas', icon: HiClipboardList, label: 'Tugas Mahasiswa' },
    { to: '/dashboard/kelola-nilai', icon: HiClipboardCheck, label: 'Kelola Nilai' },
    { to: '/dashboard/diskusi', icon: HiChatAlt2, label: 'Diskusi' },
    { to: '/dashboard/security-lab', icon: HiShieldExclamation, label: 'Security Lab' },
  ],
  admin: [
    { to: '/dashboard', icon: HiHome, label: 'Beranda', end: true },
    { to: '/dashboard/profil', icon: HiUser, label: 'Profil Saya' },
    { to: '/dashboard/pengguna', icon: HiUsers, label: 'Kelola Pengguna' },
    { to: '/dashboard/mata-kuliah', icon: HiBookOpen, label: 'Mata Kuliah' },
    { to: '/dashboard/kelola-matkul', icon: HiCollection, label: 'Kelola Matkul' },
    { to: '/dashboard/kelola-nilai', icon: HiClipboardCheck, label: 'Kelola Nilai' },
    { to: '/dashboard/tugas', icon: HiClipboardList, label: 'Tugas' },
    { to: '/dashboard/diskusi', icon: HiChatAlt2, label: 'Diskusi' },
    { to: '/dashboard/security-lab', icon: HiShieldExclamation, label: 'Security Lab' },
  ],
}

const roleBadge = {
  mahasiswa: 'badge-role-mahasiswa',
  dosen: 'badge-role-dosen',
  admin: 'badge-role-admin',
}
const roleLabel = { mahasiswa: 'Mahasiswa', dosen: 'Dosen', admin: 'Admin' }

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = roleNav[user?.role] || roleNav.mahasiswa

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-900/50 flex-shrink-0">
            KS
          </div>
          {!collapsed && (
            <div className="animate-fade-in min-w-0">
              <div className="font-bold text-white text-sm truncate">Kampus Security</div>
              <div className="text-xs text-blue-400">Security Lab Portal</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-slate-700/40">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user?.full_name}</div>
              <span className={`text-xs ${roleBadge[user?.role]}`}>{roleLabel[user?.role]}</span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          title={collapsed ? 'Logout' : undefined}
        >
          <HiLogout className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gradient-campus overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-gradient-sidebar border-r border-slate-700/50 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-all z-10"
          style={{ left: collapsed ? '52px' : '228px' }}
        >
          {collapsed ? <HiChevronRight className="w-3 h-3" /> : <HiChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-700/50 z-30 lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setMobileOpen(true)}>
              <HiMenuAlt2 className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-white">Portal Kampus Security Lab</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Selamat datang, {user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-all">
              <HiBell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer"
              onClick={() => navigate('/dashboard/profil')}>
              {user?.full_name?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
