import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'
import {
  HiUsers, HiBookOpen, HiAcademicCap, HiClipboardList,
  HiChatAlt2, HiShieldExclamation, HiTrendingUp, HiCalendar,
  HiClock, HiCheckCircle
} from 'react-icons/hi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [grades, setGrades] = useState([])
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [coursesRes, assignRes] = await Promise.all([
        api.get('/courses'),
        api.get('/assignments'),
      ])
      setCourses(coursesRes.data.courses || [])
      setAssignments(assignRes.data.assignments || [])

      if (user.role === 'mahasiswa') {
        const gradeRes = await api.get('/grades/my')
        setGrades(gradeRes.data.grades || [])
      }
      if (user.role === 'admin') {
        const statRes = await api.get('/users/stats/summary')
        setStats(statRes.data.stats)
      }
    } catch (err) {
      console.error('Load data error:', err)
    }
  }

  const gradeDistribution = grades.reduce((acc, g) => {
    const l = g.letter_grade || '?'
    acc[l] = (acc[l] || 0) + 1
    return acc
  }, {})
  const gradeChartData = Object.entries(gradeDistribution).map(([name, value]) => ({ name, value }))

  const upcomingAssignments = assignments
    .filter(a => new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  const overdueAssignments = assignments.filter(a => {
    const isPast = new Date(a.due_date) < new Date()
    const hasSubmission = a.submissions && a.submissions.length > 0
    return isPast && !hasSubmission
  })

  // IPK
  const gpa = grades.length > 0
    ? (grades.reduce((sum, g) => {
        const pts = { A: 4, B: 3, C: 2, D: 1, E: 0 }
        return sum + (pts[g.letter_grade] || 0) * (g.course?.credits || 3)
      }, 0) / grades.reduce((sum, g) => sum + (g.course?.credits || 3), 0)).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card-glow p-6 bg-gradient-to-r from-blue-900/40 to-indigo-900/40">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Selamat Datang, {user?.full_name?.split(' ')[0]}! 👋</h2>
            <p className="text-slate-400 mt-1">
              {user?.role === 'admin' && 'Kelola portal kampus dan pantau aktivitas pengguna.'}
              {user?.role === 'dosen' && 'Kelola mata kuliah, tugas, dan nilai mahasiswa Anda.'}
              {user?.role === 'mahasiswa' && 'Pantau nilai, tugas, dan ikuti diskusi mata kuliah Anda.'}
            </p>
          </div>
          <div className={`badge-role-${user?.role} text-sm px-3 py-1`}>
            {user?.role === 'admin' ? 'Administrator' : user?.role === 'dosen' ? 'Dosen' : 'Mahasiswa'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin' && stats && (
          <>
            <StatCard icon={HiUsers} label="Total Pengguna" value={stats.totalUsers} color="blue" />
            <StatCard icon={HiAcademicCap} label="Mahasiswa" value={stats.totalStudents} color="emerald" />
            <StatCard icon={HiBookOpen} label="Dosen" value={stats.totalLecturers} color="purple" />
            <StatCard icon={HiBookOpen} label="Mata Kuliah" value={stats.totalCourses} color="amber" />
          </>
        )}
        {user?.role === 'mahasiswa' && (
          <>
            <StatCard icon={HiAcademicCap} label="IPK Sementara" value={gpa} color="emerald" />
            <StatCard icon={HiBookOpen} label="Mata Kuliah" value={courses.length} color="blue" />
            <StatCard icon={HiClipboardList} label="Tugas Aktif" value={upcomingAssignments.length} color="amber" />
            <StatCard icon={HiClock} label="Terlambat" value={overdueAssignments.length} color="red" />
          </>
        )}
        {user?.role === 'dosen' && (
          <>
            <StatCard icon={HiBookOpen} label="Mata Kuliah" value={courses.length} color="blue" />
            <StatCard icon={HiClipboardList} label="Tugas Dibuat" value={assignments.length} color="amber" />
            <StatCard icon={HiChatAlt2} label="Total Submission" value={assignments.reduce((s, a) => s + (a.submissions?.length || 0), 0)} color="purple" />
            <StatCard icon={HiCheckCircle} label="Sudah Dinilai" value={assignments.reduce((s, a) => s + (a.submissions?.filter(sub => sub.status === 'graded').length || 0), 0)} color="emerald" />
          </>
        )}
      </div>

      {/* Charts + Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: chart or upcoming assignments */}
        {user?.role === 'mahasiswa' && gradeChartData.length > 0 && (
          <div className="card-glow p-5">
            <h3 className="section-title mb-4">Distribusi Nilai</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={gradeChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {gradeChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {user?.role === 'admin' && stats && (
          <div className="card-glow p-5">
            <h3 className="section-title mb-4">Statistik Pengguna</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Mahasiswa', count: stats.totalStudents },
                { name: 'Dosen', count: stats.totalLecturers },
                { name: 'Admin', count: 1 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Right: upcoming assignments */}
        <div className="card-glow p-5">
          <h3 className="section-title mb-4">
            {user?.role === 'mahasiswa' ? 'Tugas Mendatang' : 'Tugas Terbaru'}
          </h3>
          {(user?.role === 'mahasiswa' ? upcomingAssignments : assignments.slice(0, 5)).length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">Tidak ada tugas saat ini</p>
          ) : (
            <div className="space-y-3">
              {(user?.role === 'mahasiswa' ? upcomingAssignments : assignments.slice(0, 5)).map(a => {
                const due = new Date(a.due_date)
                const daysLeft = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${daysLeft < 0 ? 'bg-red-900/50 text-red-400' : daysLeft < 3 ? 'bg-amber-900/50 text-amber-400' : 'bg-blue-900/50 text-blue-400'}`}>
                      <HiClipboardList className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.course?.name || a.course?.code}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-400' : daysLeft < 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {daysLeft < 0 ? 'Terlambat' : daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`}
                      </p>
                      <p className="text-[10px] text-slate-600">{due.toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Courses list */}
      <div className="card-glow p-5">
        <h3 className="section-title mb-4">Mata Kuliah {user?.role === 'dosen' ? 'yang Diampu' : user?.role === 'admin' ? 'Terdaftar' : 'Saya'}</h3>
        {courses.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Tidak ada mata kuliah</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.slice(0, 6).map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <HiBookOpen className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.code} · {c.credits || 3} SKS</p>
                    {c.schedule && <p className="text-xs text-slate-600 mt-1">{c.schedule}</p>}
                    {c.lecturer && <p className="text-xs text-blue-400 mt-0.5">{c.lecturer.full_name}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  }
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} border flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}
