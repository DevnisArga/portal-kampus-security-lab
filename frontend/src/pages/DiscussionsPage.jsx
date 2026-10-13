import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { HiChatAlt2, HiReply, HiThumbUp, HiBookmark, HiTrash, HiPlusCircle, HiBookOpen } from 'react-icons/hi'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const roleBadge = {
  mahasiswa: 'badge-role-mahasiswa',
  dosen: 'badge-role-dosen',
  admin: 'badge-role-admin',
}

export default function DiscussionsPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    api.get('/courses').then(r => {
      const c = r.data.courses || []
      setCourses(c)
      if (c.length > 0) setSelectedCourse(c[0])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedCourse) loadDiscussions(selectedCourse.id)
  }, [selectedCourse])

  const loadDiscussions = (courseId) => {
    setLoading(true)
    api.get(`/discussions/course/${courseId}`).then(r => {
      setDiscussions(r.data.discussions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const postNew = async () => {
    if (!newContent.trim()) return toast.error('Konten diskusi wajib diisi')
    setPosting(true)
    try {
      await api.post('/discussions', { course_id: selectedCourse.id, title: newTitle, content: newContent })
      setNewTitle('')
      setNewContent('')
      toast.success('Diskusi berhasil diposting')
      loadDiscussions(selectedCourse.id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal posting diskusi')
    } finally {
      setPosting(false)
    }
  }

  const postReply = async (parentId) => {
    if (!replyContent.trim()) return toast.error('Balasan tidak boleh kosong')
    setPosting(true)
    try {
      await api.post('/discussions', { course_id: selectedCourse.id, content: replyContent, parent_id: parentId })
      setReplyTarget(null)
      setReplyContent('')
      toast.success('Balasan berhasil dikirim')
      loadDiscussions(selectedCourse.id)
    } catch (err) {
      toast.error('Gagal mengirim balasan')
    } finally {
      setPosting(false)
    }
  }

  const togglePin = async (discId) => {
    try {
      await api.put(`/discussions/${discId}/pin`)
      loadDiscussions(selectedCourse.id)
    } catch {}
  }

  const deleteDisc = async (discId) => {
    if (!confirm('Hapus diskusi ini?')) return
    try {
      await api.delete(`/discussions/${discId}`)
      loadDiscussions(selectedCourse.id)
      toast.success('Diskusi dihapus')
    } catch {}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Forum Diskusi</h2>
        <p className="section-subtitle">Diskusi per mata kuliah</p>
      </div>

      {/* Course selector */}
      <div className="flex gap-2 flex-wrap">
        {courses.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCourse?.id === c.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {selectedCourse && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <HiBookOpen className="w-4 h-4" />
          <span>{selectedCourse.name}</span>
        </div>
      )}

      {/* New post form */}
      {selectedCourse && (
        <div className="card-glow p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><HiPlusCircle className="w-5 h-5 text-blue-400" />Buat Diskusi Baru</h3>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Judul diskusi (opsional)"
            className="input-field mb-3"
          />
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Tulis pertanyaan atau diskusi Anda..."
            className="input-field resize-none h-24 mb-3"
          />
          <button onClick={postNew} disabled={posting} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
            {posting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiChatAlt2 className="w-4 h-4" />}
            Posting
          </button>
        </div>
      )}

      {/* Discussions list */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat diskusi...</div>
      ) : discussions.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <HiChatAlt2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Belum ada diskusi di mata kuliah ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map(d => (
            <div key={d.id} className={`card-glow p-5 ${d.is_pinned ? 'border-amber-500/30' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {d.author?.full_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    {d.is_pinned && <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium mb-1"><HiBookmark className="w-3 h-3" />Disematkan</span>}
                    {d.title && <h4 className="font-semibold text-white text-sm">{d.title}</h4>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{d.author?.full_name}</span>
                      <span className={`${roleBadge[d.author?.role]} text-[10px]`}>{d.author?.role}</span>
                      <span className="text-xs text-slate-600">{format(new Date(d.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {['dosen', 'admin'].includes(user?.role) && (
                    <button onClick={() => togglePin(d.id)} title="Pin" className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors">
                      <HiBookmark className="w-4 h-4" />
                    </button>
                  )}
                  {(d.author?.id === user?.id || ['dosen', 'admin'].includes(user?.role)) && (
                    <button onClick={() => deleteDisc(d.id)} title="Hapus" className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{d.content}</p>

              {/* Replies */}
              {d.replies?.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-slate-700/70 space-y-3">
                  {d.replies.map(r => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {r.author?.full_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-300">{r.author?.full_name}</span>
                          <span className={`${roleBadge[r.author?.role]} text-[10px]`}>{r.author?.role}</span>
                          <span className="text-xs text-slate-600">{format(new Date(r.createdAt), 'dd MMM HH:mm', { locale: id })}</span>
                        </div>
                        <p className="text-sm text-slate-400">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply form */}
              <div className="mt-3">
                {replyTarget === d.id ? (
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Tulis balasan..."
                      className="input-field resize-none h-16 text-sm flex-1"
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => postReply(d.id)} disabled={posting} className="btn-primary text-xs px-3 py-2">Kirim</button>
                      <button onClick={() => { setReplyTarget(null); setReplyContent('') }} className="btn-secondary text-xs px-3 py-2">Batal</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setReplyTarget(d.id); setReplyContent('') }} className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors mt-2">
                    <HiReply className="w-3.5 h-3.5" />Balas
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
