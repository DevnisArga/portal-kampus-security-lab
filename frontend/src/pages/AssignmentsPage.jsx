import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { HiClipboardList, HiUpload, HiClock, HiCheckCircle, HiExclamation, HiEye } from 'react-icons/hi'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

function statusBadge(due, submission) {
  const isLate = new Date(due) < new Date()
  if (submission?.status === 'graded') return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400"><HiCheckCircle className="w-3.5 h-3.5" />Dinilai</span>
  if (submission?.status === 'submitted' || submission?.status === 'late') return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400"><HiCheckCircle className="w-3.5 h-3.5" />{submission.status === 'late' ? 'Terlambat' : 'Terkirim'}</span>
  if (isLate) return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400"><HiExclamation className="w-3.5 h-3.5" />Terlambat</span>
  const days = Math.ceil((new Date(due) - new Date()) / 86400000)
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${days < 3 ? 'text-amber-400' : 'text-slate-400'}`}><HiClock className="w-3.5 h-3.5" />{days === 0 ? 'Hari ini' : `${days} hari lagi`}</span>
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null)
  const [notes, setNotes] = useState({})
  const [selected, setSelected] = useState(null)
  const fileRefs = useRef({})

  useEffect(() => {
    load()
  }, [])

  const load = () => {
    setLoading(true)
    api.get('/assignments').then(r => setAssignments(r.data.assignments || [])).catch(() => {}).finally(() => setLoading(false))
  }

  const handleSubmit = async (assignmentId) => {
    const file = fileRefs.current[assignmentId]?.files[0]
    if (!file && !notes[assignmentId]) return toast.error('Upload file atau isi catatan terlebih dahulu')
    setSubmitting(assignmentId)
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (notes[assignmentId]) formData.append('notes', notes[assignmentId])
    try {
      await api.post(`/assignments/${assignmentId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Tugas berhasil dikumpulkan!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengumpulkan tugas')
    } finally {
      setSubmitting(null)
    }
  }

  const handleGrade = async (submissionId, score, feedback) => {
    try {
      await api.post(`/assignments/submission/${submissionId}/grade`, { score: parseFloat(score), feedback })
      toast.success('Nilai berhasil disimpan')
      load()
    } catch (err) {
      toast.error('Gagal menyimpan nilai')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400">Memuat...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Tugas</h2>
        <p className="section-subtitle">{user?.role === 'mahasiswa' ? 'Daftar tugas dari mata kuliah Anda' : 'Tugas yang Anda buat'}</p>
      </div>

      {assignments.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <HiClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Tidak ada tugas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => {
            const mySubmission = user?.role === 'mahasiswa' ? a.submissions?.[0] : null
            const daysLeft = Math.ceil((new Date(a.due_date) - new Date()) / 86400000)
            const isExpanded = selected === a.id

            return (
              <div key={a.id} className="card-glow overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-slate-700/20 transition-colors"
                  onClick={() => setSelected(isExpanded ? null : a.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${daysLeft < 0 ? 'bg-red-900/50' : daysLeft < 3 ? 'bg-amber-900/50' : 'bg-blue-900/50'}`}>
                      <HiClipboardList className={`w-5 h-5 ${daysLeft < 0 ? 'text-red-400' : daysLeft < 3 ? 'text-amber-400' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm">{a.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{a.course?.name} ({a.course?.code})</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Deadline: {format(new Date(a.due_date), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge(a.due_date, mySubmission)}
                      {user?.role !== 'mahasiswa' && (
                        <span className="text-xs text-slate-500">{a.submissions?.length || 0} pengumpulan</span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-700/50 p-5 space-y-4 animate-fade-in">
                    <p className="text-sm text-slate-300">{a.description}</p>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>Nilai maks: {a.max_score}</span>
                    </div>

                    {/* Mahasiswa: upload form */}
                    {user?.role === 'mahasiswa' && (
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-white mb-3">
                          {mySubmission ? 'Perbarui Pengumpulan' : 'Kumpulkan Tugas'}
                        </h4>
                        {mySubmission && (
                          <div className="mb-3 text-xs text-slate-400 p-2 bg-slate-700/30 rounded-lg">
                            File terkumpul: <span className="text-blue-400">{mySubmission.file_name || '-'}</span>
                            {mySubmission.score != null && <span className="ml-3 text-emerald-400">Nilai: {mySubmission.score}/{a.max_score}</span>}
                            {mySubmission.feedback && <p className="mt-1 text-slate-500">Feedback: {mySubmission.feedback}</p>}
                          </div>
                        )}
                        <input
                          ref={el => fileRefs.current[a.id] = el}
                          type="file"
                          accept=".pdf,.doc,.docx,.zip,.rar,.txt,.py,.cpp,.c,.js"
                          className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 mb-3"
                        />
                        <textarea
                          value={notes[a.id] || ''}
                          onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                          placeholder="Catatan pengumpulan (opsional)"
                          className="input-field text-sm resize-none h-20 mb-3"
                        />
                        <button
                          onClick={() => handleSubmit(a.id)}
                          disabled={submitting === a.id}
                          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60"
                        >
                          {submitting === a.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiUpload className="w-4 h-4" />}
                          {mySubmission ? 'Perbarui' : 'Kumpulkan'}
                        </button>
                      </div>
                    )}

                    {/* Dosen/admin: list submissions */}
                    {(user?.role === 'dosen' || user?.role === 'admin') && a.submissions?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Pengumpulan Mahasiswa ({a.submissions.length})</h4>
                        <div className="space-y-2">
                          {a.submissions.map(sub => (
                            <GradeRow key={sub.id} sub={sub} maxScore={a.max_score} onGrade={handleGrade} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GradeRow({ sub, maxScore, onGrade }) {
  const [score, setScore] = useState(sub.score ?? '')
  const [feedback, setFeedback] = useState(sub.feedback || '')
  const [editing, setEditing] = useState(false)

  return (
    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-white">{sub.student?.full_name}</p>
          <p className="text-xs text-slate-500">{sub.student?.nim_nip} · {sub.status}</p>
          {sub.file_name && <p className="text-xs text-blue-400 mt-0.5">📎 {sub.file_name}</p>}
        </div>
        <div className="flex items-center gap-2">
          {sub.score != null && !editing && (
            <span className="text-emerald-400 text-sm font-bold">{sub.score}/{maxScore}</span>
          )}
          <button onClick={() => setEditing(!editing)} className="btn-secondary text-xs px-3 py-1.5">
            {editing ? 'Batal' : sub.score != null ? 'Edit Nilai' : 'Beri Nilai'}
          </button>
        </div>
      </div>
      {editing && (
        <div className="mt-3 flex gap-2 items-end flex-wrap">
          <div>
            <label className="label text-xs">Nilai (0-{maxScore})</label>
            <input type="number" value={score} onChange={e => setScore(e.target.value)} min={0} max={maxScore}
              className="input-field w-24 py-2 text-sm" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="label text-xs">Feedback</label>
            <input value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Komentar nilai..."
              className="input-field py-2 text-sm" />
          </div>
          <button onClick={() => { onGrade(sub.id, score, feedback); setEditing(false) }} className="btn-success text-sm px-3 py-2">Simpan</button>
        </div>
      )}
    </div>
  )
}
