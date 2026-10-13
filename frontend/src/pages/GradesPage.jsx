import { useState, useEffect } from 'react'
import api from '../lib/api'
import { HiAcademicCap, HiTrendingUp } from 'react-icons/hi'

const gradeColors = {
  A: 'badge-grade-A', B: 'badge-grade-B', C: 'badge-grade-C', D: 'badge-grade-D', E: 'badge-grade-E'
}

export default function GradesPage() {
  const [grades, setGrades] = useState([])
  const [gpa, setGpa] = useState('0.00')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/grades/my').then(r => {
      setGrades(r.data.grades || [])
      setGpa(r.data.gpa || '0.00')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalSKS = grades.reduce((s, g) => s + (g.course?.credits || 0), 0)
  const gradeCount = grades.reduce((acc, g) => {
    acc[g.letter_grade] = (acc[g.letter_grade] || 0) + 1
    return acc
  }, {})

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400">Memuat...</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title">Nilai & IPK</h2>
        <p className="section-subtitle">Rekap nilai akademik Anda</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-glow p-5 text-center">
          <p className="text-3xl font-extrabold text-emerald-400">{gpa}</p>
          <p className="text-xs text-slate-400 mt-1">IPK</p>
        </div>
        <div className="card-glow p-5 text-center">
          <p className="text-3xl font-extrabold text-blue-400">{grades.length}</p>
          <p className="text-xs text-slate-400 mt-1">Mata Kuliah</p>
        </div>
        <div className="card-glow p-5 text-center">
          <p className="text-3xl font-extrabold text-purple-400">{totalSKS}</p>
          <p className="text-xs text-slate-400 mt-1">Total SKS</p>
        </div>
        <div className="card-glow p-5 text-center">
          <p className="text-3xl font-extrabold text-amber-400">{gradeCount['A'] || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Nilai A</p>
        </div>
      </div>

      {/* Table */}
      <div className="card-glow overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 flex items-center gap-2">
          <HiAcademicCap className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Rekap Nilai Per Mata Kuliah</h3>
        </div>
        {grades.length === 0 ? (
          <p className="text-slate-500 text-center py-12">Belum ada nilai</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  {['Mata Kuliah', 'Kode', 'SKS', 'Sem', 'UTS', 'UAS', 'Tugas', 'Nilai Akhir', 'Huruf', 'Komentar'].map(h => (
                    <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g.id} className="table-row">
                    <td className="table-cell font-medium text-white whitespace-nowrap">{g.course?.name}</td>
                    <td className="table-cell font-mono text-xs">{g.course?.code}</td>
                    <td className="table-cell text-center">{g.course?.credits}</td>
                    <td className="table-cell text-center">{g.course?.semester}</td>
                    <td className="table-cell text-center">{g.midterm ?? '-'}</td>
                    <td className="table-cell text-center">{g.final ?? '-'}</td>
                    <td className="table-cell text-center">{g.assignment_avg ?? '-'}</td>
                    <td className="table-cell text-center font-semibold text-white">{g.score?.toFixed(1)}</td>
                    <td className="table-cell text-center">
                      <span className={gradeColors[g.letter_grade] || 'text-slate-400'}>{g.letter_grade}</span>
                    </td>
                    <td className="table-cell text-xs text-slate-500 max-w-[160px] truncate">{g.comment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade distribution */}
      {Object.keys(gradeCount).length > 0 && (
        <div className="card-glow p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><HiTrendingUp className="w-5 h-5 text-blue-400" />Distribusi Nilai</h3>
          <div className="flex gap-3 flex-wrap">
            {['A', 'B', 'C', 'D', 'E'].map(l => (
              <div key={l} className="flex flex-col items-center p-4 rounded-xl bg-slate-700/30 min-w-[70px]">
                <span className={`text-2xl font-bold ${gradeColors[l]?.includes('emerald') ? 'text-emerald-400' : gradeColors[l]?.includes('blue') ? 'text-blue-400' : gradeColors[l]?.includes('amber') ? 'text-amber-400' : gradeColors[l]?.includes('orange') ? 'text-orange-400' : 'text-red-400'}`}>
                  {gradeCount[l] || 0}
                </span>
                <span className="text-xs text-slate-500 mt-1">Nilai {l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
