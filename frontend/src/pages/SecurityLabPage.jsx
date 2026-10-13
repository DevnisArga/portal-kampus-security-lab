import { useState, useEffect } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { HiShieldExclamation, HiShieldCheck, HiTerminal, HiPlay, HiRefresh, HiExclamation, HiInformationCircle, HiDatabase, HiLockClosed, HiLockOpen } from 'react-icons/hi'

const SQL_PAYLOADS = [
  { label: "Bypass Login (OR true)", value: "' OR '1'='1" },
  { label: "Comment Sisa Query", value: "admin'--" },
  { label: "Always True", value: "' OR 1=1--" },
  { label: "UNION Dump Users", value: "' UNION SELECT 1,username,password_plain,role FROM users LIMIT 5--" },
]

const BF_PASSWORDS = ['wrongpass', '123456', 'password', 'admin', 'qwerty', 'Demo@123']

export default function SecurityLabPage() {
  const [activeTab, setActiveTab] = useState('sqli')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <HiShieldExclamation className="w-7 h-7 text-red-400" />
          Security Lab
        </h2>
        <p className="section-subtitle">Panel praktikum pengujian keamanan web — hanya untuk lingkungan lokal</p>
        <div className="mt-2 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30 flex items-start gap-2">
          <HiExclamation className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">
            <strong>Peringatan:</strong> Semua pengujian di halaman ini HANYA ditujukan untuk praktikum keamanan web di lingkungan lokal/lab yang terisolasi. Jangan gunakan terhadap sistem produksi atau situs eksternal.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('sqli')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'sqli' ? 'bg-red-600/20 text-red-300 border border-red-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <HiDatabase className="w-4 h-4" />SQL Injection
        </button>
        <button
          onClick={() => setActiveTab('bruteforce')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'bruteforce' ? 'bg-red-600/20 text-red-300 border border-red-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <HiLockOpen className="w-4 h-4" />Brute Force
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'log' ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          <HiTerminal className="w-4 h-4" />Log Percobaan
        </button>
      </div>

      {activeTab === 'sqli' && <SQLInjectionLab />}
      {activeTab === 'bruteforce' && <BruteForceLab />}
      {activeTab === 'log' && <LoginLog />}
    </div>
  )
}

function SQLInjectionLab() {
  const [mode, setMode] = useState('vulnerable')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loginResult, setLoginResult] = useState(null)
  const [searchResult, setSearchResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setLoginResult(null)
    try {
      const endpoint = mode === 'vulnerable' ? '/auth/login-vulnerable' : '/auth/login-secure'
      const { data } = await api.post(endpoint, { username, password })
      setLoginResult({ success: true, data })
    } catch (err) {
      setLoginResult({ success: false, data: err.response?.data || { message: err.message } })
    } finally {
      setLoading(false)
    }
  }

  const testSearch = async () => {
    if (!searchQuery.trim()) return toast.error('Isi query pencarian')
    setLoading(true)
    setSearchResult(null)
    try {
      const endpoint = mode === 'vulnerable' ? '/security/search-vulnerable' : '/security/search-secure'
      const { data } = await api.post(endpoint, { query: searchQuery })
      setSearchResult({ success: true, data })
    } catch (err) {
      setSearchResult({ success: false, data: err.response?.data || { message: err.message } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Teori */}
      <div className="card-glow p-5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><HiInformationCircle className="w-5 h-5 text-blue-400" />Apa itu SQL Injection?</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <p><strong className="text-white">Penyebab:</strong> Input pengguna digabungkan langsung ke query SQL tanpa sanitasi, sehingga attacker bisa memodifikasi logika query.</p>
          <p><strong className="text-white">Dampak:</strong> Bypass autentikasi, eksfiltrasi data, modifikasi/penghapusan data, bahkan eksekusi perintah sistem.</p>
          <p><strong className="text-white">Perbaikan:</strong> Gunakan <em>prepared statements</em> / <em>parameterized queries</em> — input tidak pernah diinterpretasikan sebagai SQL.</p>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="terminal">
            <p className="terminal-red mb-1">-- MODE RENTAN (string concatenation)</p>
            <p className="text-slate-400">{"SELECT * FROM users WHERE"}</p>
            <p className="text-slate-400">{"  username = '" + "<input>" + "'"}</p>
            <p className="text-slate-400">{"  AND password = '" + "<input>" + "'"}</p>
            <br />
            <p className="terminal-red">Payload: ' OR '1'='1</p>
            <p className="terminal-yellow">{"→ WHERE username = '' OR '1'='1'"}</p>
            <p className="terminal-yellow">{"→ Selalu TRUE = bypass login!"}</p>
          </div>
          <div className="terminal">
            <p className="terminal-green mb-1">-- MODE AMAN (parameterized)</p>
            <p className="text-slate-400">{"SELECT * FROM users WHERE"}</p>
            <p className="text-slate-400">{"  username = ? AND password = ?"}</p>
            <p className="text-slate-400">-- replacements: [username, pw]</p>
            <br />
            <p className="terminal-green">Payload: ' OR '1'='1</p>
            <p className="terminal-green">{"→ Diperlakukan sebagai teks literal"}</p>
            <p className="terminal-green">{"→ Login gagal (benar!)"}</p>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-slate-400">Mode Pengujian:</span>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setMode('vulnerable'); setLoginResult(null); setSearchResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'vulnerable' ? 'bg-red-600/30 text-red-300 border border-red-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            ⚠️ Rentan
          </button>
          <button
            onClick={() => { setMode('secure'); setLoginResult(null); setSearchResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'secure' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            ✅ Aman
          </button>
        </div>
        {mode === 'vulnerable' ? <span className="vuln-badge">RENTAN</span> : <span className="secure-badge">AMAN</span>}
      </div>

      {/* Quick payloads */}
      {mode === 'vulnerable' && (
        <div className="card-glow p-4">
          <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Payload SQL Injection — Klik untuk isi di username</p>
          <div className="flex flex-wrap gap-2">
            {SQL_PAYLOADS.map(p => (
              <button key={p.value} onClick={() => { setUsername(p.value); setPassword('anything') }}
                className="px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-700/30 text-red-300 text-xs hover:bg-red-900/40 transition-colors font-mono">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Login test */}
      <div className="card-glow p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <HiTerminal className="w-5 h-5 text-amber-400" />
          Uji Login {mode === 'vulnerable' ? 'Rentan' : 'Aman'}
          <span className="text-xs text-slate-500 font-normal ml-2">
            Endpoint: {mode === 'vulnerable' ? '/api/auth/login-vulnerable' : '/api/auth/login-secure'}
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="input-field font-mono text-sm" placeholder="Username atau SQL payload" />
          </div>
          <div>
            <label className="label">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} className="input-field font-mono text-sm" placeholder="Password atau anything" />
          </div>
        </div>
        <div className="flex gap-3 flex-wrap mb-4">
          <button onClick={testLogin} disabled={loading} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiPlay className="w-4 h-4" />}
            Jalankan
          </button>
          <button onClick={() => { setUsername('demo_mahasiswa'); setPassword('Demo@123') }} className="btn-secondary text-sm">Isi Akun Demo</button>
        </div>

        {loginResult && (
          <div className={`terminal text-xs space-y-1 ${loginResult.success ? '' : ''}`}>
            <p className={loginResult.success ? 'terminal-green' : 'terminal-red'}>
              {loginResult.success ? '✅ LOGIN BERHASIL' : '❌ LOGIN GAGAL'}
            </p>
            {loginResult.data?.executedQuery && (
              <>
                <p className="terminal-yellow mt-2">Query yang dieksekusi:</p>
                <p className="text-slate-300 break-all">{loginResult.data.executedQuery}</p>
              </>
            )}
            {loginResult.data?.user && (
              <p className="terminal-blue">User: {loginResult.data.user.username} | Role: {loginResult.data.user.role}</p>
            )}
            {loginResult.data?.message && <p className="text-slate-400">{loginResult.data.message}</p>}
            {loginResult.data?.rateLimited && <p className="terminal-yellow">⚠️ Rate limited!</p>}
          </div>
        )}
      </div>

      {/* Search test */}
      <div className="card-glow p-5">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <HiDatabase className="w-5 h-5 text-purple-400" />
          Uji Pencarian Data {mode === 'vulnerable' ? 'Rentan' : 'Aman'}
        </h3>
        <div className="flex gap-3 mb-3 flex-wrap">
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field font-mono text-sm flex-1 min-w-[200px]"
            placeholder={mode === 'vulnerable' ? "Coba: %' UNION SELECT 1,username,password_plain,role FROM users-- " : "Cari nama mahasiswa..."} />
          <button onClick={testSearch} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
            <HiPlay className="w-4 h-4" />Cari
          </button>
        </div>
        {mode === 'vulnerable' && (
          <p className="text-xs text-red-400 mb-3">💡 Coba payload: <code className="bg-slate-800 px-1 rounded">%' UNION SELECT 1,username,password_plain,role FROM users--</code></p>
        )}
        {searchResult && (
          <div className="terminal text-xs">
            {searchResult.data?.executedQuery && (
              <>
                <p className="terminal-yellow">Query:</p>
                <p className="text-slate-300 break-all mb-2">{searchResult.data.executedQuery}</p>
              </>
            )}
            {searchResult.data?.query && (
              <>
                <p className="terminal-green">Query (parameterized):</p>
                <p className="text-slate-300 mb-2">{searchResult.data.query}</p>
              </>
            )}
            <p className={searchResult.success ? 'terminal-green' : 'terminal-red'}>
              {searchResult.success ? `✅ ${searchResult.data?.results?.length || 0} hasil ditemukan` : `❌ Error: ${searchResult.data?.sqlError || searchResult.data?.message}`}
            </p>
            {searchResult.data?.results?.map((r, i) => (
              <p key={i} className="text-slate-400">{JSON.stringify(r)}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BruteForceLab() {
  const [mode, setMode] = useState('vulnerable')
  const [username, setUsername] = useState('demo_mahasiswa')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState([])
  const [currentPw, setCurrentPw] = useState('')

  const runBruteForce = async () => {
    setRunning(true)
    setResults([])
    const endpoint = mode === 'vulnerable' ? '/auth/login-bruteforce' : '/auth/login-secure'
    for (let i = 0; i < BF_PASSWORDS.length; i++) {
      const pw = BF_PASSWORDS[i]
      setCurrentPw(pw)
      const start = Date.now()
      try {
        const { data } = await api.post(endpoint, { username, password: pw })
        const elapsed = Date.now() - start
        setResults(r => [...r, { pw, success: data.success, message: data.message || 'Login berhasil!', elapsed, rateLimited: false }])
        if (data.success) break
      } catch (err) {
        const elapsed = Date.now() - start
        const msg = err.response?.data?.message || err.message
        const rateLimited = err.response?.data?.rateLimited || err.response?.status === 429
        setResults(r => [...r, { pw, success: false, message: msg, elapsed, rateLimited }])
      }
      await new Promise(res => setTimeout(res, mode === 'vulnerable' ? 200 : 800))
    }
    setCurrentPw('')
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      {/* Teori */}
      <div className="card-glow p-5">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2"><HiInformationCircle className="w-5 h-5 text-blue-400" />Apa itu Brute Force?</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <p><strong className="text-white">Penyebab:</strong> Tidak ada pembatasan jumlah percobaan login, sehingga attacker bisa mencoba ribuan password secara otomatis.</p>
          <p><strong className="text-white">Dampak:</strong> Akun bisa dibobol jika password lemah. Error message yang detail juga membantu attacker memverifikasi username yang valid.</p>
          <p><strong className="text-white">Perbaikan:</strong> Rate limiting, jeda progresif, generic error message, captcha, dan notifikasi login mencurigakan.</p>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="terminal">
            <p className="terminal-red mb-1">-- MODE RENTAN</p>
            <p className="text-slate-400">• Tidak ada batas percobaan</p>
            <p className="text-slate-400">• Error detail (bocorkan username valid)</p>
            <p className="text-slate-400">• Tidak ada delay antar percobaan</p>
            <p className="terminal-red mt-2">→ 1000 percobaan/menit = mudah dibobol</p>
          </div>
          <div className="terminal">
            <p className="terminal-green mb-1">-- MODE AMAN</p>
            <p className="text-slate-400">• Rate limit: 10 req/15 menit</p>
            <p className="text-slate-400">• Jeda progresif (2s→5s→10s)</p>
            <p className="text-slate-400">• Error generik (tidak bocorkan info)</p>
            <p className="terminal-green mt-2">→ Percobaan ke-4+ kena delay/blokir</p>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-slate-400">Mode Pengujian:</span>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          <button onClick={() => { setMode('vulnerable'); setResults([]) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'vulnerable' ? 'bg-red-600/30 text-red-300 border border-red-600/30' : 'text-slate-400 hover:text-white'}`}>
            ⚠️ Rentan (Tanpa Proteksi)
          </button>
          <button onClick={() => { setMode('secure'); setResults([]) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'secure' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-600/30' : 'text-slate-400 hover:text-white'}`}>
            ✅ Aman (Rate Limited)
          </button>
        </div>
      </div>

      {/* Sim panel */}
      <div className="card-glow p-5">
        <h3 className="font-semibold text-white mb-4">Simulasi Brute Force ({mode === 'vulnerable' ? 'tanpa proteksi' : 'dengan rate limit'})</h3>
        <div className="mb-3">
          <label className="label">Target Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="input-field font-mono text-sm max-w-xs" />
        </div>
        <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">Password yang akan dicoba ({BF_PASSWORDS.length} password):</p>
          <div className="flex flex-wrap gap-2">
            {BF_PASSWORDS.map(pw => (
              <code key={pw} className={`text-xs px-2 py-0.5 rounded bg-slate-700 ${currentPw === pw && running ? 'text-amber-300 bg-amber-900/30' : 'text-slate-400'}`}>{pw}</code>
            ))}
          </div>
        </div>
        <button onClick={runBruteForce} disabled={running} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {running ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Mencoba: {currentPw}...</> : <><HiPlay className="w-4 h-4" />Mulai Simulasi</>}
        </button>

        {results.length > 0 && (
          <div className="mt-4 terminal text-xs space-y-1">
            <p className="text-slate-500 mb-2">=== HASIL PERCOBAAN ({mode === 'vulnerable' ? 'RENTAN' : 'AMAN'}) ===</p>
            {results.map((r, i) => (
              <div key={i} className={`flex gap-3 ${r.rateLimited ? 'terminal-yellow' : r.success ? 'terminal-green' : 'text-slate-400'}`}>
                <span className="flex-shrink-0">[{i + 1}]</span>
                <span className="font-mono flex-shrink-0">{r.pw.padEnd(12)}</span>
                <span>{r.rateLimited ? '⛔ RATE LIMITED' : r.success ? '✅ BERHASIL' : '❌ Gagal'}</span>
                <span className="text-slate-600 flex-shrink-0">{r.elapsed}ms</span>
                {(mode === 'vulnerable' && !r.success && !r.rateLimited) && <span className="text-red-400 text-[10px]">{r.message}</span>}
              </div>
            ))}
            {!running && (
              <p className={`mt-2 font-bold ${results.some(r => r.success) ? 'terminal-red' : 'terminal-green'}`}>
                {results.some(r => r.success) ? '⚠️ Password berhasil ditemukan!' : results.some(r => r.rateLimited) ? '✅ Blokir rate limit bekerja!' : '✅ Semua percobaan gagal'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LoginLog() {
  const [attempts, setAttempts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { load() }, [])

  const load = () => {
    setLoading(true)
    api.get('/security/attempts').then(r => {
      setAttempts(r.data.attempts || [])
      setStats(r.data.stats)
    }).catch(() => toast.error('Akses ditolak — hanya admin'))
      .finally(() => setLoading(false))
  }

  const filtered = filter ? attempts.filter(a => a.mode === filter) : attempts

  if (loading) return <div className="text-center py-12 text-slate-400">Memuat log...</div>

  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Berhasil', value: stats.success, color: 'text-emerald-400' },
            { label: 'Gagal', value: stats.failed, color: 'text-red-400' },
            { label: 'Mode Rentan', value: stats.vulnerable, color: 'text-amber-400' },
            { label: 'Mode Aman', value: stats.secure, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="card-glow p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-slate-400">Filter:</span>
        {['', 'vulnerable', 'secure'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-blue-600/30 text-blue-300 border border-blue-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {f === '' ? 'Semua' : f === 'vulnerable' ? 'Rentan' : 'Aman'}
          </button>
        ))}
        <button onClick={load} className="ml-auto btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"><HiRefresh className="w-3.5 h-3.5" />Refresh</button>
      </div>

      <div className="card-glow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                {['Waktu', 'Username', 'IP', 'Mode', 'Status', 'User Agent'].map(h => (
                  <th key={h} className="table-header text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(a => (
                <tr key={a.id} className="table-row">
                  <td className="table-cell text-xs whitespace-nowrap">{new Date(a.attempted_at).toLocaleString('id-ID')}</td>
                  <td className="table-cell font-mono text-xs max-w-[140px] truncate">{a.username}</td>
                  <td className="table-cell font-mono text-xs">{a.ip_address}</td>
                  <td className="table-cell">
                    {a.mode === 'vulnerable'
                      ? <span className="vuln-badge">Rentan</span>
                      : <span className="secure-badge">Aman</span>}
                  </td>
                  <td className="table-cell">
                    {a.success
                      ? <span className="text-emerald-400 text-xs font-medium">✅ Berhasil</span>
                      : <span className="text-red-400 text-xs font-medium">❌ Gagal</span>}
                  </td>
                  <td className="table-cell text-xs text-slate-600 max-w-[160px] truncate">{a.user_agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-slate-500">Belum ada log</p>}
        </div>
      </div>
    </div>
  )
}
