import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { HiAcademicCap, HiChevronDown, HiChevronRight, HiCheck, HiX } from 'react-icons/hi'

const LETTER_GRADES = { A: 4, B: 3, C: 2, D: 1, E: 0 }
const gradeColors = { A: 'badge-grade-A', B: 'badge-grade-B', C: 'badge-grade-C', D: 'badge-grade-D', E: 'badge-grade-E' }

export default function DosenGradesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [editRow, setEditRow] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/courses').then(r => {
      const c = r.data.courses || []
      setCourses(c)
      if (c.length > 0) setSelectedCourse(c[0])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedCourse) loadGrades(selectedCourse.id)
  }, [selectedCourse])

  const loadGrades = (courseId) => {
    api.get(`/grades/course/${courseId}`).then(r => setGrades(r.data.grades || []))
  }

  const startEdit = (g) => {
    setEditRow(g.id)
    setEditForm({ midterm: g.midterm || '', final: g.final || '', assignment_avg: g.assignment_avg || '', comment: g.comment || '' })
  }

  const calcScore = (f) => {
    const mid = parseFloat(f.midterm) || 0
    const fin = parseFloat(f.final) || 0
    const asgn = parseFloat(f.assignment_avg) || 0
    return (mid * 0.3 + fin * 0.4 + asgn * 0.3).toFixed(1)
  }

  const handleSave = async (g) => {
    setSaving(true)
    try {
      await api.post('/grades', {
        student_id: g.student_id,
        course_id: g.course_id,
        midterm: parseFloat(editForm.midterm) || 0,
        final: parseFloat(editForm.final) || 0,
        assignment_avg: parseFloat(editForm.assignment_avg) || 0,
        comment: editForm.comment,
      })
      toast.success('Nilai berhasil disimpan')
      setEditRow(null)
      loadGrades(selectedCourse.id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const classAvg = grades.length ? (grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length).toFixed(1) : '-'
  const gradeCount = grades.reduce((acc, g) => { acc[g.letter_grade] = (acc[g.letter_grade] || 0) + 1; return acc }, {})

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400">Memuat...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Kelola Nilai</h2>
        <p className="section-subtitle">Input dan edit nilai mahasiswa per mata kuliah</p>
      </div>

      {/* Course tabs */}
      <div className="flex gap-2 flex-wrap">
        {courses.map(c => (
          <button key={c.id} onClick={() => setSelectedCourse(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCourse?.id === c.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {c.code}
          </button>
        ))}
      </div>

      {selectedCourse && (
        <div className="card-glow p-4 flex flex-wrap gap-4 text-sm">
          <div><span className="text-slate-500">Mata Kuliah: </span><span className="text-white font-medium">{selectedCourse.name}</span></div>
          <div><span className="text-slate-500">Mahasiswa: </span><span className="text-white">{grades.length}</span></div>
          <div><span className="text-slate-500">Rata-rata Kelas: </span><span className="text-white font-bold">{classAvg}</span></div>
          <div className="flex gap-2">
            {['A', 'B', 'C', 'D', 'E'].map(l => gradeCount[l] && (
              <span key={l} className={`${gradeColors[l]} px-2 py-0.5 rounded-lg text-xs`}>{l}: {gradeCount[l]}</span>
            ))}
          </div>
        </div>
      )}

      {/* Grades table */}
      <div className="card-glow overflow-hidden">
        {grades.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <HiAcademicCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p>Belum ada nilai untuk mata kuliah ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Mahasiswa', 'NIM', 'UTS (30%)', 'UAS (40%)', 'Tugas (30%)', 'Nilai Akhir', 'Huruf', 'Komentar', 'Aksi'].map(h => (
                    <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades.map(g => {
                  const isEditing = editRow === g.id
                  const previewScore = isEditing ? calcScore(editForm) : g.score?.toFixed(1)
                  return (
                    <tr key={g.id} className={`table-row ${isEditing ? 'bg-blue-900/10' : ''}`}>
                      <td className="table-cell font-medium text-white whitespace-nowrap">{g.student?.full_name}</td>
                      <td className="table-cell font-mono text-xs">{g.student?.nim_nip}</td>
                      {['midterm', 'final', 'assignment_avg'].map(field => (
                        <td key={field} className="table-cell">
                          {isEditing ? (
                            <input type="number" min={0} max={100} value={editForm[field]}
                              onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                              className="input-field w-16 py-1.5 text-sm text-center px-2" />
                          ) : (
                            <span>{g[field] ?? '-'}</span>
                          )}
                        </td>
                      ))}
                      <td className="table-cell font-bold text-white">{previewScore}</td>
                      <td className="table-cell">
                        <span className={gradeColors[isEditing ? getLetter(parseFloat(previewScore)) : g.letter_grade] || ''}>
                          {isEditing ? getLetter(parseFloat(previewScore)) : g.letter_grade}
                        </span>
                      </td>
                      <td className="table-cell">
                        {isEditing ? (
                          <input value={editForm.comment} onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))}
                            className="input-field py-1.5 text-sm min-w-[120px]" placeholder="Komentar..." />
                        ) : (
                          <span className="text-xs text-slate-500 max-w-[120px] block truncate">{g.comment || '-'}</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleSave(g)} disabled={saving}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300"><HiCheck className="w-4 h-4" /></button>
                            <button onClick={() => setEditRow(null)} className="p-1.5 text-slate-500 hover:text-white"><HiX className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(g)} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-glow p-4 text-xs text-slate-500">
        <p><strong className="text-slate-400">Bobot nilai:</strong> UTS × 30% + UAS × 40% + Tugas × 30%</p>
        <p className="mt-1"><strong className="text-slate-400">Konversi huruf:</strong> A ≥ 85 · B ≥ 75 · C ≥ 65 · D ≥ 55 · E &lt; 55</p>
      </div>
    </div>
  )
}

function getLetter(score) {
  if (isNaN(score)) return '-'
  if (score >= 85) return 'A'
  if (score >= 75) return 'B'
  if (score >= 65) return 'C'
  if (score >= 55) return 'D'
  return 'E'
}
