require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Course, Enrollment, Grade, Assignment, Submission, Discussion, LoginAttempt } = require('../models');

async function seed() {
  try {
    console.log('🌱 Menghubungkan ke database...');
    await sequelize.authenticate();
    console.log('✅ Koneksi berhasil');

    console.log('📋 Sinkronisasi tabel...');
    await sequelize.sync({ force: true });
    console.log('✅ Tabel berhasil dibuat');

    // ============================================================
    // USERS
    // ============================================================
    console.log('👤 Membuat akun pengguna...');
    const hash = (pw) => bcrypt.hash(pw, 12);

    const admin = await User.create({
      username: 'admin', email: 'admin@kampus.ac.id',
      password: await hash('Admin@2024'), full_name: 'Administrator Sistem',
      role: 'admin', nim_nip: 'ADM001', phone: '081234567890',
      address: 'Gedung Rektorat, Lantai 3',
    });

    const dosen1 = await User.create({
      username: 'budi_santoso', email: 'budi.santoso@kampus.ac.id',
      password: await hash('Dosen@123'), full_name: 'Dr. Budi Santoso, M.Kom',
      role: 'dosen', nim_nip: 'DSN001', phone: '082345678901',
      address: 'Jl. Kampus Raya No. 1, Gd. Dosen B204',
    });

    const dosen2 = await User.create({
      username: 'siti_rahayu', email: 'siti.rahayu@kampus.ac.id',
      password: await hash('Dosen@456'), full_name: 'Prof. Siti Rahayu, Ph.D',
      role: 'dosen', nim_nip: 'DSN002', phone: '083456789012',
      address: 'Jl. Kampus Raya No. 1, Gd. Dosen C310',
    });

    const dosen3 = await User.create({
      username: 'ahmad_fauzi', email: 'ahmad.fauzi@kampus.ac.id',
      password: await hash('Dosen@789'), full_name: 'Ir. Ahmad Fauzi, M.T',
      role: 'dosen', nim_nip: 'DSN003', phone: '084567890123',
      address: 'Jl. Kampus Raya No. 1, Gd. Dosen A101',
    });

    // Mahasiswa
    const mahasiswaData = [
      { username: 'andi_pratama', email: 'andi@student.kampus.ac.id', full_name: 'Andi Pratama', nim_nip: '22101001', pw: 'Mhs@2024' },
      { username: 'bela_wati', email: 'bela@student.kampus.ac.id', full_name: 'Bela Wati', nim_nip: '22101002', pw: 'Mhs@2024' },
      { username: 'candra_putra', email: 'candra@student.kampus.ac.id', full_name: 'Candra Putra', nim_nip: '22101003', pw: 'Mhs@2024' },
      { username: 'dewi_sari', email: 'dewi@student.kampus.ac.id', full_name: 'Dewi Sari', nim_nip: '22101004', pw: 'Mhs@2024' },
      { username: 'eko_budiman', email: 'eko@student.kampus.ac.id', full_name: 'Eko Budiman', nim_nip: '22101005', pw: 'Mhs@2024' },
      { username: 'fitri_handayani', email: 'fitri@student.kampus.ac.id', full_name: 'Fitri Handayani', nim_nip: '22101006', pw: 'Mhs@2024' },
      { username: 'galih_wicaksono', email: 'galih@student.kampus.ac.id', full_name: 'Galih Wicaksono', nim_nip: '22101007', pw: 'Mhs@2024' },
      { username: 'hana_pertiwi', email: 'hana@student.kampus.ac.id', full_name: 'Hana Pertiwi', nim_nip: '22101008', pw: 'Mhs@2024' },
    ];

    // Demo accounts for security lab
    const demoMahasiswa = await User.create({
      username: 'demo_mahasiswa', email: 'demo@student.kampus.ac.id',
      password: await hash('Demo@123'), password_plain: 'Demo@123',
      full_name: 'Demo Mahasiswa (Security Lab)', role: 'mahasiswa',
      nim_nip: '99900001', phone: '08000000001',
    });

    const demoDosen = await User.create({
      username: 'demo_dosen', email: 'demo@dosen.kampus.ac.id',
      password: await hash('Demo@456'), password_plain: 'Demo@456',
      full_name: 'Demo Dosen (Security Lab)', role: 'dosen',
      nim_nip: '99900002', phone: '08000000002',
    });

    const mahasiswaUsers = [];
    for (const m of mahasiswaData) {
      const u = await User.create({
        username: m.username, email: m.email, full_name: m.full_name,
        password: await hash(m.pw), password_plain: m.pw,
        role: 'mahasiswa', nim_nip: m.nim_nip,
        phone: '08' + Math.floor(1000000000 + Math.random() * 9000000000),
        address: `Jl. Mahasiswa No. ${Math.floor(Math.random() * 100) + 1}, Kota Kampus`,
      });
      mahasiswaUsers.push(u);
    }

    console.log(`✅ ${mahasiswaUsers.length + 5} akun dibuat`);

    // ============================================================
    // COURSES
    // ============================================================
    console.log('📚 Membuat mata kuliah...');
    const courses = await Course.bulkCreate([
      { code: 'IF101', name: 'Algoritma dan Pemrograman', description: 'Dasar algoritma, flowchart, dan pemrograman terstruktur dengan C++', credits: 4, semester: 1, academic_year: '2024/2025', lecturer_id: dosen1.id, schedule: 'Senin 08:00-10:30', room: 'Gd. A Lab 1', max_students: 40 },
      { code: 'IF201', name: 'Struktur Data', description: 'Array, linked list, stack, queue, tree, dan graph', credits: 3, semester: 2, academic_year: '2024/2025', lecturer_id: dosen1.id, schedule: 'Selasa 13:00-15:30', room: 'Gd. A Lab 2', max_students: 35 },
      { code: 'IF301', name: 'Basis Data', description: 'Desain database relasional, SQL, normalisasi, dan query kompleks', credits: 3, semester: 3, academic_year: '2024/2025', lecturer_id: dosen2.id, schedule: 'Rabu 08:00-10:30', room: 'Gd. B Lab 1', max_students: 40 },
      { code: 'IF401', name: 'Keamanan Sistem Informasi', description: 'Kriptografi, ancaman siber, SQL Injection, XSS, brute force, dan mitigasi', credits: 3, semester: 5, academic_year: '2024/2025', lecturer_id: dosen2.id, schedule: 'Kamis 13:00-15:30', room: 'Gd. C Lab Keamanan', max_students: 30 },
      { code: 'IF501', name: 'Pemrograman Web', description: 'HTML, CSS, JavaScript, React, Node.js, dan REST API', credits: 4, semester: 3, academic_year: '2024/2025', lecturer_id: dosen3.id, schedule: 'Jumat 08:00-11:30', room: 'Gd. B Lab Web', max_students: 35 },
      { code: 'IF601', name: 'Jaringan Komputer', description: 'Model OSI, TCP/IP, routing, switching, dan keamanan jaringan', credits: 3, semester: 4, academic_year: '2024/2025', lecturer_id: dosen3.id, schedule: 'Senin 13:00-15:30', room: 'Gd. A Lab Jaringan', max_students: 40 },
    ]);

    console.log(`✅ ${courses.length} mata kuliah dibuat`);

    // ============================================================
    // ENROLLMENTS
    // ============================================================
    console.log('📝 Mendaftarkan mahasiswa ke mata kuliah...');
    const allMhs = [...mahasiswaUsers, demoMahasiswa];
    for (const mhs of allMhs) {
      for (const course of courses) {
        await Enrollment.create({ student_id: mhs.id, course_id: course.id, status: 'aktif' });
      }
    }
    console.log(`✅ Enrollment selesai`);

    // ============================================================
    // ASSIGNMENTS
    // ============================================================
    console.log('📋 Membuat tugas...');
    const assignments = await Assignment.bulkCreate([
      { course_id: courses[0].id, lecturer_id: dosen1.id, title: 'Tugas 1: Flowchart Algoritma Pengurutan', description: 'Buat flowchart untuk algoritma bubble sort dan quick sort. Sertakan analisis kompleksitas waktu.', due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), max_score: 100 },
      { course_id: courses[0].id, lecturer_id: dosen1.id, title: 'Tugas 2: Implementasi Rekursi', description: 'Implementasikan fungsi rekursif untuk faktorial, fibonacci, dan menara Hanoi menggunakan C++.', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), max_score: 100 },
      { course_id: courses[2].id, lecturer_id: dosen2.id, title: 'Praktikum SQL: Query Lanjutan', description: 'Kerjakan 20 soal query SQL menggunakan database sakila. Gunakan JOIN, subquery, dan aggregate function.', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), max_score: 100 },
      { course_id: courses[3].id, lecturer_id: dosen2.id, title: 'Laporan Praktikum SQL Injection', description: 'Dokumentasikan percobaan SQL Injection pada aplikasi DVWA. Sertakan screenshot, payload yang digunakan, dan analisis kerentanan.', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), max_score: 100 },
      { course_id: courses[4].id, lecturer_id: dosen3.id, title: 'Project Mini: REST API', description: 'Bangun REST API sederhana menggunakan Express.js dan MySQL. Dokumentasikan dengan Postman.', due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), max_score: 100 },
      { course_id: courses[5].id, lecturer_id: dosen3.id, title: 'Tugas Konfigurasi VLAN', description: 'Konfigurasi VLAN pada switch Cisco menggunakan Packet Tracer. Sertakan file .pkt dan laporan.', due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), max_score: 100 }, // Overdue
    ]);

    console.log(`✅ ${assignments.length} tugas dibuat`);

    // ============================================================
    // GRADES
    // ============================================================
    console.log('📊 Membuat nilai mahasiswa...');
    const gradeData = [
      [82, 78, 85], [75, 80, 77], [90, 92, 88], [68, 72, 70], [85, 88, 82],
      [77, 75, 79], [92, 95, 90], [60, 65, 62],
    ];

    function getLetter(score) {
      if (score >= 85) return 'A';
      if (score >= 75) return 'B';
      if (score >= 65) return 'C';
      if (score >= 55) return 'D';
      return 'E';
    }

    for (let i = 0; i < mahasiswaUsers.length; i++) {
      const mhs = mahasiswaUsers[i];
      const [mid, fin, asgn] = gradeData[i];
      for (const course of courses) {
        const score = parseFloat((mid * 0.3 + fin * 0.4 + asgn * 0.3).toFixed(2));
        const lecId = course.lecturer_id;
        await Grade.create({
          student_id: mhs.id, course_id: course.id, lecturer_id: lecId,
          midterm: mid + Math.floor(Math.random() * 6 - 3),
          final: fin + Math.floor(Math.random() * 6 - 3),
          assignment_avg: asgn + Math.floor(Math.random() * 6 - 3),
          score, letter_grade: getLetter(score),
          comment: score >= 85 ? 'Sangat baik, pertahankan!' : score >= 75 ? 'Cukup baik, tingkatkan lagi' : 'Perlu lebih banyak latihan',
          graded_at: new Date(),
        });
      }
    }

    console.log('✅ Nilai berhasil dibuat');

    // ============================================================
    // DISCUSSIONS
    // ============================================================
    console.log('💬 Membuat diskusi forum...');
    const disc1 = await Discussion.create({
      course_id: courses[3].id, author_id: dosen2.id,
      title: '📌 Pengumuman: Jadwal Praktikum SQL Injection',
      content: 'Praktikum SQL Injection akan dilaksanakan pada pertemuan ke-6. Pastikan Anda sudah menginstal DVWA dan MySQL di laptop masing-masing. Baca modul praktikum terlebih dahulu.',
      is_pinned: true,
    });

    await Discussion.create({
      course_id: courses[3].id, author_id: mahasiswaUsers[0].id,
      parent_id: disc1.id,
      content: 'Bu Siti, apakah DVWA bisa diinstal di Windows? Saya menggunakan Windows 11.',
    });

    await Discussion.create({
      course_id: courses[3].id, author_id: dosen2.id,
      parent_id: disc1.id,
      content: 'Bisa, gunakan XAMPP sebagai web server. Panduan instalasi sudah ada di LMS. Jika ada kesulitan, tanyakan di Discord kelas.',
    });

    await Discussion.create({
      course_id: courses[3].id, author_id: mahasiswaUsers[1].id,
      title: 'Pertanyaan: Perbedaan SQL Injection dan XSS',
      content: 'Apa perbedaan mendasar antara SQL Injection dan Cross-Site Scripting (XSS)? Kapan masing-masing digunakan oleh attacker?',
    });

    await Discussion.create({
      course_id: courses[0].id, author_id: dosen1.id,
      title: '📌 Materi Algoritma Sorting',
      content: 'Silakan pelajari materi sorting algorithms di link berikut. Pahami perbedaan antara bubble sort (O(n²)) dan quick sort (O(n log n)).',
      is_pinned: true,
    });

    await Discussion.create({
      course_id: courses[4].id, author_id: mahasiswaUsers[2].id,
      title: 'Tanya: Error saat install Node.js',
      content: 'Saat menjalankan npm install, muncul error ENOENT. Sudah saya coba restart, tetap error. Ada yang pernah mengalami hal serupa?',
    });

    console.log('✅ Diskusi berhasil dibuat');

    // ============================================================
    // SAMPLE LOGIN ATTEMPTS (for Security Lab demo)
    // ============================================================
    console.log('🔐 Membuat contoh riwayat login...');
    const sampleAttempts = [
      { username: 'demo_mahasiswa', ip_address: '127.0.0.1', success: false, mode: 'vulnerable', attempted_at: new Date(Date.now() - 60000 * 5) },
      { username: 'demo_mahasiswa', ip_address: '127.0.0.1', success: false, mode: 'vulnerable', attempted_at: new Date(Date.now() - 60000 * 4) },
      { username: 'demo_mahasiswa', ip_address: '127.0.0.1', success: false, mode: 'vulnerable', attempted_at: new Date(Date.now() - 60000 * 3) },
      { username: 'demo_mahasiswa', ip_address: '127.0.0.1', success: true, mode: 'vulnerable', attempted_at: new Date(Date.now() - 60000 * 2) },
      { username: "' OR '1'='1", ip_address: '127.0.0.1', success: true, mode: 'vulnerable', attempted_at: new Date(Date.now() - 60000) },
      { username: 'demo_mahasiswa', ip_address: '127.0.0.1', success: false, mode: 'secure', attempted_at: new Date(Date.now() - 30000) },
      { username: 'demo_mahasiswa', ip_address: '127.0.0.1', success: true, mode: 'secure', attempted_at: new Date() },
    ];
    for (const a of sampleAttempts) {
      await LoginAttempt.create({ ...a, user_agent: 'Mozilla/5.0 (Security Lab Demo)' });
    }

    console.log('\n🎉 Seed selesai! Akun demo:');
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  Role       │ Username         │ Password        │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│  Admin      │ admin            │ Admin@2024      │');
    console.log('│  Dosen      │ budi_santoso     │ Dosen@123       │');
    console.log('│  Dosen      │ siti_rahayu      │ Dosen@456       │');
    console.log('│  Mahasiswa  │ andi_pratama     │ Mhs@2024        │');
    console.log('│  Lab Demo   │ demo_mahasiswa   │ Demo@123        │');
    console.log('│  Lab Demo   │ demo_dosen       │ Demo@456        │');
    console.log('└─────────────────────────────────────────────────┘');

  } catch (err) {
    console.error('❌ Seed gagal:', err.message);
    console.error(err);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seed();
