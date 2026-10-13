# Portal Kampus Security Lab

Platform praktikum pengujian keamanan web berbasis kampus fiktif. Dibangun dengan React + Vite + Tailwind CSS (frontend) dan Node.js + Express + Sequelize + MySQL (backend).

---

## Prasyarat

- Node.js v18+
- MySQL 8.0+
- npm

---

## Instalasi & Konfigurasi

### 1. Clone / buka project

```
portal dummy/
├── backend/
└── frontend/
```

### 2. Konfigurasi Database

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=portal_kampus
DB_USER=root
DB_PASS=<password_mysql_anda>
JWT_SECRET=portal_kampus_secret_key_2024_very_secure
SESSION_SECRET=portal_kampus_session_2024
NODE_ENV=development
UPLOAD_DIR=uploads
```

Buat database di MySQL:

```sql
CREATE DATABASE IF NOT EXISTS portal_kampus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Install Dependensi Backend

```bash
cd backend
npm install
```

### 4. Seed Database (data sintetis)

```bash
npm run seed
```

Output berhasil:
```
✅ Tabel berhasil dibuat
✅ 13 akun dibuat
✅ 6 mata kuliah dibuat
✅ Enrollment selesai
✅ 6 tugas dibuat
✅ Nilai berhasil dibuat
✅ Diskusi berhasil dibuat
```

### 5. Install Dependensi Frontend

```bash
cd frontend
npm install
```

---

## Menjalankan Aplikasi

### Terminal 1 — Backend

```bash
cd backend
npm run dev
# Server berjalan di http://localhost:5000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
# App berjalan di http://localhost:5173
```

Buka browser: **http://localhost:5173**

---

## Akun Demo

| Role        | Username         | Password    | Keterangan               |
|-------------|------------------|-------------|--------------------------|
| Admin       | `admin`          | `Admin@2024`| Akses penuh              |
| Dosen       | `budi_santoso`   | `Dosen@123` | Dosen Algoritma & Strukdat|
| Dosen       | `siti_rahayu`    | `Dosen@456` | Dosen Basis Data & KSI   |
| Dosen       | `ahmad_fauzi`    | `Dosen@789` | Dosen Pemweb & Jaringan  |
| Mahasiswa   | `andi_pratama`   | `Mhs@2024`  | Mahasiswa reguler        |
| Mahasiswa   | `bela_wati`      | `Mhs@2024`  | Mahasiswa reguler        |
| Lab Demo    | `demo_mahasiswa` | `Demo@123`  | Akun khusus Security Lab |
| Lab Demo    | `demo_dosen`     | `Demo@456`  | Akun khusus Security Lab |

---

## Fitur Per Role

### Mahasiswa
- Dashboard dengan IPK, tugas aktif, nilai
- Profil diri (edit nama, email, hp, alamat, password)
- Melihat dan menfilter mata kuliah
- Melihat nilai & IPK dengan distribusi
- Mengumpulkan tugas (upload file + catatan)
- Forum diskusi (posting, balas, per mata kuliah)
- Security Lab (praktikum SQL Injection & Brute Force)

### Dosen
- Dashboard dengan statistik mata kuliah
- Melihat semua submission mahasiswa
- Memberi nilai dan feedback per submission
- Kelola nilai (input UTS, UAS, tugas)
- Forum diskusi (pin, hapus, balas)
- Security Lab

### Admin
- Dashboard statistik pengguna
- Kelola Pengguna (CRUD akun mahasiswa/dosen/admin)
- Kelola Mata Kuliah (CRUD, assign dosen, jadwal)
- Kelola Nilai (akses semua mata kuliah)
- Melihat log percobaan login Security Lab
- Security Lab

---

## Pengujian Skenario Keamanan

### Skenario 1: SQL Injection

**Tujuan:** Memperlihatkan risiko string concatenation pada query SQL.

#### Langkah Pengujian (Mode Rentan)

1. Login sebagai mahasiswa mana saja → buka **Security Lab** → tab **SQL Injection**
2. Pilih mode **⚠️ Rentan**
3. Klik payload **"Bypass Login (OR true)"** → username terisi `' OR '1'='1`
4. Klik **Jalankan**
5. Amati: login berhasil meskipun password salah
6. Amati query yang dieksekusi di terminal output:
   ```sql
   SELECT * FROM users WHERE username = '' OR '1'='1' AND password_plain = 'anything' LIMIT 1
   ```

#### Langkah Pengujian (Mode Aman)

1. Pilih mode **✅ Aman**
2. Masukkan payload yang sama
3. Amati: login gagal — input diperlakukan sebagai string literal
4. Lihat bahwa tidak ada query mentah yang diekspos

#### Uji Pencarian Data

1. Pilih mode Rentan → masukkan payload di kolom Pencarian:
   ```
   %' UNION SELECT 1,username,password_plain,role FROM users--
   ```
2. Klik Cari → data seluruh user ter-dump
3. Mode Aman dengan payload sama → hanya mengembalikan hasil yang sesuai parameter

#### Endpoint

| Mode    | Login                         | Pencarian                     |
|---------|-------------------------------|-------------------------------|
| Rentan  | `POST /api/auth/login-vulnerable` | `POST /api/security/search-vulnerable` |
| Aman    | `POST /api/auth/login-secure`     | `POST /api/security/search-secure`     |

---

### Skenario 2: Brute Force

**Tujuan:** Memperlihatkan risiko tidak adanya rate limiting pada login.

#### Langkah Pengujian (Mode Rentan)

1. Buka **Security Lab** → tab **Brute Force**
2. Pilih mode **⚠️ Rentan (Tanpa Proteksi)**
3. Target username: `demo_mahasiswa`
4. Klik **Mulai Simulasi**
5. Amati:
   - Semua percobaan diproses tanpa hambatan
   - Error message detail: `"Password untuk 'demo_mahasiswa' salah."` (bocorkan bahwa username valid)
   - Ketika password `Demo@123` dicoba → login berhasil
   - Tidak ada blocking, tidak ada delay

#### Langkah Pengujian (Mode Aman)

1. Pilih mode **✅ Aman (Rate Limited)**
2. Klik **Mulai Simulasi**
3. Amati:
   - Setelah percobaan ke-4: jeda progresif 2 detik
   - Setelah percobaan ke-6: jeda 5 detik
   - Setelah 10 percobaan: rate limit (HTTP 429)
   - Error message generik: `"Username atau password salah."` (tidak bocorkan info)

#### Endpoint

| Mode    | Endpoint                          | Proteksi                          |
|---------|-----------------------------------|-----------------------------------|
| Rentan  | `POST /api/auth/login-bruteforce` | Tidak ada                         |
| Aman    | `POST /api/auth/login-secure`     | Rate limit 10/15 menit + progressive delay |

---

### Melihat Log Percobaan

1. Login sebagai **admin**
2. Buka **Security Lab** → tab **Log Percobaan**
3. Lihat riwayat semua percobaan login (timestamp, IP, mode, status)
4. Filter per mode (rentan/aman)

---

## Perbandingan: Rentan vs Aman

### SQL Injection

| Aspek             | Mode Rentan                     | Mode Aman                        |
|-------------------|---------------------------------|----------------------------------|
| Query             | String concatenation            | Parameterized query (?)          |
| Payload OR true   | Login bypass berhasil           | Login gagal (treated as literal) |
| UNION injection   | Data user ter-eksfiltrasi       | Query aman, tidak ada UNION      |
| Error SQL         | Diekspos ke client              | Disembunyikan                    |

### Brute Force

| Aspek             | Mode Rentan                     | Mode Aman                        |
|-------------------|---------------------------------|----------------------------------|
| Rate limiting     | Tidak ada                       | 10 request / 15 menit            |
| Progressive delay | Tidak ada                       | 2s → 5s → 10s setelah gagal      |
| Error message     | Detail (bocorkan username valid) | Generik                         |
| Log percobaan     | Minimal                         | Dicatat ke database              |

---

## Rekomendasi Perbaikan (Produksi)

1. **SQL Injection**: Selalu gunakan ORM (Sequelize) atau parameterized queries. Jangan gunakan string concatenation untuk query.
2. **Brute Force**: Implementasikan rate limiting (`express-rate-limit`), progressive delay, CAPTCHA untuk login publik.
3. **Password**: Gunakan bcrypt (minimum cost factor 12). Jangan simpan plaintext.
4. **JWT**: Set expiry pendek (1-8 jam). Implementasikan refresh token.
5. **HTTPS**: Aktifkan HTTPS di production dengan TLS/SSL.
6. **Input Validation**: Validasi semua input di server-side (tidak hanya client-side).
7. **Security Headers**: Tambahkan helmet.js untuk HTTP security headers.
8. **File Upload**: Validasi tipe file, ukuran, dan scan malware di production.

---

## Struktur Project

```
portal dummy/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── middleware/auth.js
│   │   ├── models/          (User, Course, Enrollment, Grade, Assignment, Submission, Discussion, LoginAttempt)
│   │   ├── routes/          (auth, users, courses, grades, assignments, discussions, security)
│   │   └── seeders/seed.js
│   ├── uploads/
│   ├── server.js
│   └── .env
└── frontend/
    ├── src/
    │   ├── contexts/AuthContext.jsx
    │   ├── layouts/DashboardLayout.jsx
    │   ├── lib/api.js
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── DashboardHome.jsx
    │       ├── ProfilePage.jsx
    │       ├── CoursesPage.jsx
    │       ├── GradesPage.jsx
    │       ├── AssignmentsPage.jsx
    │       ├── DiscussionsPage.jsx
    │       ├── SecurityLabPage.jsx
    │       ├── AdminUsersPage.jsx
    │       ├── AdminCoursesPage.jsx
    │       └── DosenGradesPage.jsx
    └── vite.config.js
```

---

## Catatan Keamanan

> Portal ini **hanya** untuk keperluan praktikum keamanan web di lingkungan lokal/laboratorium yang terisolasi. Jangan deploy ke production atau jalankan pengujian terhadap sistem eksternal.
>
> Mode rentan (vulnerable) menggunakan database lokal dengan data sintetis. Tidak ada data pengguna sungguhan yang digunakan.
