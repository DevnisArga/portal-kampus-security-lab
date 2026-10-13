import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { HiBookOpen, HiUser, HiCalendar, HiLocationMarker, HiUsers, HiAcademicCap } from 'react-icons/hi'

const COLORS = [
  'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
  'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  'from-rose-500/20 to-rose-600/20 border-rose-500/30',
  'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
]
const ICON_COLORS = ['text-blue-400', 'text-purple-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-cyan-400']

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses').then(r => {
      setCourses(r.data.courses || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400">Memuat...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Mata Kuliah</h2>
        <p className="section-subtitle">
          {user?.role === 'mahasiswa' ? `${courses.length} mata kuliah yang Anda ikuti` :
           user?.role === 'dosen' ? `${courses.length} mata kuliah yang Anda ampu` :
           `${courses.length} total mata kuliah`}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <HiBookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Tidak ada mata kuliah</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className={`card-glow p-5 cursor-pointer hover:border-slate-500/70 transition-all duration-200 ${selected?.id === c.id ? 'border-blue-500/50 shadow-blue-900/20' : ''}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} border flex items-center justify-center flex-shrink-0`}>
                  <HiBookOpen className={`w-5 h-5 ${ICON_COLORS[i % ICON_COLORS.length]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white text-sm leading-snug">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{c.code} · {c.credits} SKS · Sem {c.semester}</p>
                </div>
                <span className="text-xs font-bold text-slate-600 flex-shrink-0">{c.academic_year}</span>
              </div>

              {c.description && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{c.description}</p>
              )}

              <div className="space-y-1.5 text-xs text-slate-500">
                {c.lecturer && (
                  <div className="flex items-center gap-1.5">
                    <HiUser className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.lecturer.full_name}</span>
                  </div>
                )}
                {c.schedule && (
                  <div className="flex items-center gap-1.5">
                    <HiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.schedule}</span>
                  </div>
                )}
                {c.room && (
                  <div className="flex items-center gap-1.5">
                    <HiLocationMarker className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.room}</span>
                  </div>
                )}
                {c.enrollments && (
                  <div className="flex items-center gap-1.5">
                    <HiUsers className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{c.enrollments.length} mahasiswa terdaftar</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="card-glow p-6 border-blue-500/30 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕ Tutup</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Info label="Kode" value={selected.code} />
            <Info label="SKS" value={`${selected.credits} SKS`} />
            <Info label="Semester" value={`Semester ${selected.semester}`} />
            <Info label="Tahun Akademik" value={selected.academic_year} />
            <Info label="Dosen" value={selected.lecturer?.full_name || '-'} />
            <Info label="Ruangan" value={selected.room || '-'} />
            <Info label="Jadwal" value={selected.schedule || '-'} />
            <Info label="Kapasitas" value={`${selected.max_students || '-'} mahasiswa`} />
          </div>
          {selected.description && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Deskripsi</p>
              <p className="text-sm text-slate-300">{selected.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-700/30">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-slate-200 font-medium">{value}</p>
    </div>
  )
}
