import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HiShieldExclamation, HiLockClosed, HiUser, HiEye, HiEyeOff } from 'react-icons/hi'
import toast from 'react-hot-toast'

const demoAccounts = [
  { role: 'Admin', username: 'admin', password: 'Admin@2024', color: 'from-amber-500 to-orange-600' },
  { role: 'Dosen', username: 'budi_santoso', password: 'Dosen@123', color: 'from-purple-500 to-violet-600' },
  { role: 'Mahasiswa', username: 'andi_pratama', password: 'Mhs@2024', color: 'from-blue-500 to-cyan-600' },
  { role: 'Lab Demo', username: 'demo_mahasiswa', password: 'Demo@123', color: 'from-red-500 to-rose-600' },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) return toast.error('Username dan password wajib diisi')
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if (result?.success) {
      toast.success('Login berhasil!')
      navigate('/dashboard')
    } else {
      toast.error(result?.message || 'Login gagal')
    }
  }

  const fillDemo = (acc) => {
    setUsername(acc.username)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-900/40 mb-4">
            <HiShieldExclamation className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Portal Kampus</h1>
          <p className="text-blue-400 font-medium">Security Lab</p>
          <p className="text-sm text-slate-500 mt-2">Platform praktikum pengujian keamanan web</p>
        </div>

        {/* Login Card */}
        <div className="card-glow p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <HiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Masukkan username"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <HiLockClosed className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-6">
          <p className="text-center text-xs text-slate-500 mb-3 uppercase tracking-wider">Akun Demo — Klik untuk mengisi</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.username}
                onClick={() => fillDemo(acc)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r ${acc.color} bg-opacity-10 border border-slate-700/50 hover:border-slate-500/50 transition-all text-left group`}
                style={{ background: 'rgba(30,41,59,0.6)' }}
              >
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${acc.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {acc.role[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-300 group-hover:text-white truncate">{acc.role}</div>
                  <div className="text-[10px] text-slate-500 truncate">{acc.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          ⚠️ Portal ini hanya untuk keperluan praktikum keamanan web lokal.
        </p>
      </div>
    </div>
  )
}
