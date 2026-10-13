import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { HiUsers, HiPlusCircle, HiPencil, HiTrash, HiX, HiCheck, HiSearch } from 'react-icons/hi'

const ROLES = ['mahasiswa', 'dosen', 'admin']
const roleBadge = { mahasiswa: 'badge-role-mahasiswa', dosen: 'badge-role-dosen', admin: 'badge-role-admin' }

const emptyForm = { username: '', email: '', password: '', full_name: '', role: 'mahasiswa', nim_nip: '', phone: '', address: '' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | user obj (edit)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    api.get('/users').then(r => setUsers(r.data.users || [])).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false))
  }

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit = (u) => { setForm({ ...u, password: '' }); setModal(u) }

  const handleSave = async () => {
    if (!form.username || !form.email || !form.full_name || !form.role) return toast.error('Field wajib belum lengkap')
    if (modal === 'create' && !form.password) return toast.error('Password wajib diisi untuk akun baru')
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/users', form)
        toast.success('Akun berhasil dibuat')
      } else {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await api.put(`/users/${modal.id}`, payload)
        toast.success('Akun berhasil diperbarui')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!confirm(`Hapus akun ${u.full_name}?`)) return
    try {
      await api.delete(`/users/${u.id}`)
      toast.success('Akun dihapus')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus')
    }
  }

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active })
      toast.success(u.is_active ? 'Akun dinonaktifkan' : 'Akun diaktifkan')
      load()
    } catch { toast.error('Gagal mengubah status') }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.nim_nip?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="section-title">Kelola Pengguna</h2>
          <p className="section-subtitle">{users.length} akun terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <HiPlusCircle className="w-5 h-5" />Tambah Pengguna
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, username, NIM/NIP..."
          className="input-field pl-11" />
      </div>

      {/* Table */}
      <div className="card-glow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Nama Lengkap', 'Username', 'Email', 'NIM/NIP', 'Role', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.full_name?.[0]}
                        </div>
                        <span className="font-medium text-white whitespace-nowrap">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{u.username}</td>
                    <td className="table-cell text-xs">{u.email}</td>
                    <td className="table-cell font-mono text-xs">{u.nim_nip || '-'}</td>
                    <td className="table-cell"><span className={roleBadge[u.role]}>{u.role}</span></td>
                    <td className="table-cell">
                      <button onClick={() => toggleActive(u)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"><HiPencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(u)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><HiTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center py-8 text-slate-500">Tidak ada hasil</p>}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="card-glow p-6 w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">{modal === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}</h3>
              <button onClick={() => setModal(null)}><HiX className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nama Lengkap *</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Username *</label>
                  <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="input-field" disabled={modal !== 'create'} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">NIM / NIP</label>
                  <input value={form.nim_nip || ''} onChange={e => setForm(f => ({ ...f, nim_nip: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-field">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nomor HP</label>
                  <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">{modal === 'create' ? 'Password *' : 'Password Baru (kosongkan jika tidak ganti)'}</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Alamat</label>
                <input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex items-center gap-2"><HiX className="w-4 h-4" />Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiCheck className="w-4 h-4" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
