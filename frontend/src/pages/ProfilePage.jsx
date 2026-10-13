import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { HiUser, HiMail, HiPhone, HiLocationMarker, HiPencil, HiCheck, HiX, HiIdentification, HiCalendar } from 'react-icons/hi'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' }))
    }
  }, [user])

  const handleSave = async () => {
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error('Password baru tidak cocok')
    }
    setLoading(true)
    try {
      const payload = { full_name: form.full_name, email: form.email, phone: form.phone, address: form.address }
      if (form.password) payload.password = form.password
      const { data } = await api.put(`/users/${user.id}`, payload)
      if (data.success) {
        const updated = { ...user, full_name: data.user.full_name, email: data.user.email, phone: data.user.phone, address: data.user.address }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
        toast.success('Profil berhasil diperbarui')
        setEditing(false)
        setForm(f => ({ ...f, password: '', confirmPassword: '' }))
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = { mahasiswa: 'Mahasiswa', dosen: 'Dosen', admin: 'Administrator' }
  const roleColor = { mahasiswa: 'from-blue-500 to-cyan-500', dosen: 'from-purple-500 to-violet-500', admin: 'from-amber-500 to-orange-500' }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="section-title">Profil Saya</h2>
        <p className="section-subtitle">Informasi akun dan data diri</p>
      </div>

      {/* Avatar + basic info */}
      <div className="card-glow p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${roleColor[user?.role]} flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0`}>
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate">{user?.full_name}</h3>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`badge-role-${user?.role}`}>{roleLabel[user?.role]}</span>
              {user?.nim_nip && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                  <HiIdentification className="w-3 h-3" />
                  {user.nim_nip}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={editing ? 'btn-secondary flex items-center gap-2' : 'btn-primary flex items-center gap-2'}
          >
            {editing ? <><HiX className="w-4 h-4" /> Batal</> : <><HiPencil className="w-4 h-4" /> Edit Profil</>}
          </button>
        </div>
      </div>

      {/* Detail info */}
      <div className="card-glow p-6 space-y-5">
        <h3 className="font-semibold text-white flex items-center gap-2"><HiUser className="w-5 h-5 text-blue-400" /> Data Diri</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field icon={HiUser} label="Nama Lengkap" value={form.full_name} editing={editing}
            onChange={v => setForm(f => ({ ...f, full_name: v }))} />
          <Field icon={HiMail} label="Email" value={form.email} editing={editing}
            onChange={v => setForm(f => ({ ...f, email: v }))} type="email" />
          <Field icon={HiPhone} label="Nomor HP" value={form.phone} editing={editing}
            onChange={v => setForm(f => ({ ...f, phone: v }))} />
          <Field icon={HiIdentification} label="NIM / NIP" value={user?.nim_nip || '-'} editing={false} />
        </div>

        <Field icon={HiLocationMarker} label="Alamat" value={form.address} editing={editing}
          onChange={v => setForm(f => ({ ...f, address: v }))} />

        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-700/50">
            <div>
              <label className="label">Password Baru <span className="text-slate-600">(kosongkan jika tidak ganti)</span></label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input-field" placeholder="Password baru" />
            </div>
            <div>
              <label className="label">Konfirmasi Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="input-field" placeholder="Ulangi password baru" />
            </div>
          </div>
        )}

        {editing && (
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2">
              <HiX className="w-4 h-4" /> Batal
            </button>
            <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiCheck className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="card-glow p-6">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4"><HiCalendar className="w-5 h-5 text-blue-400" /> Info Akun</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-slate-700/30">
            <p className="text-slate-500 text-xs mb-1">Username</p>
            <p className="text-white font-mono">{user?.username}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-700/30">
            <p className="text-slate-500 text-xs mb-1">Role</p>
            <p className="text-white">{roleLabel[user?.role]}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-700/30">
            <p className="text-slate-500 text-xs mb-1">Status</p>
            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value, editing, onChange, type = 'text' }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5"><Icon className="w-4 h-4" />{label}</label>
      {editing && onChange ? (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input-field" />
      ) : (
        <p className="px-4 py-3 bg-slate-800/50 rounded-xl text-slate-300 text-sm border border-slate-700/50">{value || '-'}</p>
      )}
    </div>
  )
}
