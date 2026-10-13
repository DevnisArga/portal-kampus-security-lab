import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { HiBookOpen, HiPlusCircle, HiPencil, HiTrash, HiX, HiCheck } from 'react-icons/hi'

const emptyForm = { code: '', name: '', description: '', credits: 3, semester: 1, academic_year: '2024/2025', lecturer_id: '', max_students: 40, schedule: '', room: '' }

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/users'),
    ]).then(([cr, ur]) => {
      setCourses(cr.data.courses || [])
      setLecturers((ur.data.users || []).filter(u => u.role === 'dosen'))
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false))
  }, [])

  const load = () => {
    api.get('/courses').then(r => setCourses(r.data.courses || []))
  }

  const openCreate = () => { setForm(emptyForm); setModal('create') }
  const openEdit = (c) => {
    setForm({ ...c, lecturer_id: c.lecturer_id || '' })
    setModal(c)
  }

  const handleSave = async () => {
    if (!form.code || !form.name || !form.semester || !form.academic_year) return toast.error('Field wajib belum lengkap')
    setSaving(true)
    try {
      if (modal === 'create') {
        await api.post('/courses', form)
        toast.success('Mata kuliah berhasil dibuat')
      } else {
        await api.put(`/courses/${modal.id}`, form)
        toast.success('Mata kuliah berhasil diperbarui')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Hapus mata kuliah ${c.name}?`)) return
    try {
      await api.delete(`/courses/${c.id}`)
      toast.success('Mata kuliah dihapus')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus')
    }
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="section-title">Kelola Mata Kuliah</h2>
          <p className="section-subtitle">{courses.length} mata kuliah terdaftar</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <HiPlusCircle className="w-5 h-5" />Tambah Mata Kuliah
        </button>
      </div>

      <div className="card-glow overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Kode', 'Nama', 'SKS', 'Sem', 'Dosen', 'Jadwal', 'Ruangan', 'Mahasiswa', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell font-mono text-xs font-bold text-blue-400">{c.code}</td>
                    <td className="table-cell font-medium text-white whitespace-nowrap max-w-[200px] truncate">{c.name}</td>
                    <td className="table-cell text-center">{c.credits}</td>
                    <td className="table-cell text-center">{c.semester}</td>
                    <td className="table-cell text-xs whitespace-nowrap">{c.lecturer?.full_name || '-'}</td>
                    <td className="table-cell text-xs whitespace-nowrap">{c.schedule || '-'}</td>
                    <td className="table-cell text-xs">{c.room || '-'}</td>
                    <td className="table-cell text-center">{c.enrollments?.length || 0}/{c.max_students}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {c.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-slate-500 hover:text-blue-400"><HiPencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-500 hover:text-red-400"><HiTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {courses.length === 0 && <p className="text-center py-8 text-slate-500">Belum ada mata kuliah</p>}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="card-glow p-6 w-full max-w-2xl animate-fade-in my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">{modal === 'create' ? 'Tambah Mata Kuliah' : 'Edit Mata Kuliah'}</h3>
              <button onClick={() => setModal(null)}><HiX className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Kode *</label>
                <input value={form.code} onChange={e => f('code', e.target.value)} className="input-field" disabled={modal !== 'create'} />
              </div>
              <div>
                <label className="label">Nama Mata Kuliah *</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">SKS</label>
                <input type="number" min={1} max={6} value={form.credits} onChange={e => f('credits', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Semester *</label>
                <input type="number" min={1} max={8} value={form.semester} onChange={e => f('semester', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Tahun Akademik *</label>
                <input value={form.academic_year} onChange={e => f('academic_year', e.target.value)} className="input-field" placeholder="2024/2025" />
              </div>
              <div>
                <label className="label">Kapasitas Mahasiswa</label>
                <input type="number" min={1} value={form.max_students} onChange={e => f('max_students', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Dosen Pengampu</label>
                <select value={form.lecturer_id || ''} onChange={e => f('lecturer_id', e.target.value)} className="input-field">
                  <option value="">-- Pilih Dosen --</option>
                  {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Jadwal</label>
                <input value={form.schedule || ''} onChange={e => f('schedule', e.target.value)} className="input-field" placeholder="Senin 08:00-10:30" />
              </div>
              <div>
                <label className="label">Ruangan</label>
                <input value={form.room || ''} onChange={e => f('room', e.target.value)} className="input-field" placeholder="Gd. A Lab 1" />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Deskripsi</label>
              <textarea value={form.description || ''} onChange={e => f('description', e.target.value)} className="input-field resize-none h-20" />
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
