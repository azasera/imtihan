import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const planoraDir = path.join(root, '.planora');

function write(relPath, content) {
  const fullPath = path.join(planoraDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

const files = {};

// 1. Root README
files['README.md'] = `# Paket produk E-Imtihan At-Tauhid

Paket perencanaan produk E-Imtihan At-Tauhid yang dibuat dengan Planora Product Kit.

## Artefak

- [Kebutuhan produk](PRD/README.md)
- [UI panduan pengalaman](UI/README.md)
- [Rencana eksekusi](EXECUTION/README.md)

## Status

Versi 0.1 — draft. Validasi manusia dan technical design tetap diperlukan sebelum implementasi.

## Perintah agent

- \`/planora-next\` — implementasikan dan verifikasi tepat satu TODO yang dependensinya sudah siap.
- \`/planora-change\` — revisi perilaku produk dan sinkronkan paket perencanaan sebelum implementasi.
- \`/feature\` — implementasikan fitur dengan scope eksplisit di luar urutan Planora Next.
- \`/bug\` — analisis dan perbaiki defect.
- \`/chore\` — lakukan maintenance tanpa mengubah perilaku produk.
- \`/e2e-tester <path-spec>\` — jalankan spec pengujian E2E melalui browser.

## Konteks kritis

E-Imtihan At-Tauhid adalah sistem Computer-Based Assessment (CBA) modern yang dirancang khusus untuk lingkungan pesantren dan madrasah. Fokus utama adalah integritas evaluasi santri, kemudahan pembuatan bank soal oleh asatidzah, serta antarmuka pengerjaan ujian santri yang ringan dan bebas distraksi tanpa mewajibkan registrasi akun email pribadi bagi santri.`;

// 2. PRD/README.md
files['PRD/README.md'] = `# Kebutuhan produk E-Imtihan At-Tauhid

Dokumentasi spesifikasi kebutuhan produk (PRD) untuk E-Imtihan At-Tauhid.

## Daftar Dokumen PRD

- [Dokumen PRD Utama](PRD.md)
- [Asumsi dan Pertanyaan Terbuka](asumsi-dan-pertanyaan.md)
- [Metrik Keberhasilan](metrik-keberhasilan.md)
- [Model Data Konseptual](model-data.md)
- [Non-Functional Requirements](non-functional-requirements.md)
- [Roadmap Produk](roadmap.md)

## Modul Fitur Spesifik

- [Fitur: Manajemen Bank Soal](fitur/bank-soal.md)
- [Fitur: Sesi dan Jadwal Ujian](fitur/sesi-ujian.md)
- [Fitur: Ruang Ujian Santri](fitur/ruang-ujian-santri.md)
- [Fitur: Penilaian dan Rekap Nilai](fitur/penilaian-dan-rekap.md)`;

// 3. PRD/PRD.md
files['PRD/PRD.md'] = `# Product Requirements Document — E-Imtihan At-Tauhid

## Ringkasan

E-Imtihan At-Tauhid adalah platform evaluasi dan Computer-Based Assessment (CBA) berbasis web untuk madrasah dan pondok pesantren. Platform ini memungkinkan para pengajar (asatidzah) membuat bank soal, menjadwalkan sesi ujian berwaktu dengan token acak, serta memungkinkan santri mengikuti ujian secara tertib dan transparan tanpa birokrasi pendaftaran email yang rumit.

## Latar belakang dan masalah

Pelaksanaan ujian konvensional berbasis kertas (paper-based test) di pesantren seringkali menghadapi kendala biaya penggandaan kertas, proses perakitan soal yang memakan waktu, risiko kebocoran soal, serta lamanya proses koreksi manual ratusan lembar jawaban santri. Sementara itu, sistem ujian online umum sering kali mensyaratkan akun email pribadi yang tidak selalu dimiliki santri di lingkungan asrama pesantren.

## Tujuan

1. Menyediakan platform ujian berbasis komputer yang efisien, hemat biaya operasional, dan ramah lingkungan (paperless).
2. Memudahkan santri mengikuti ujian cukup dengan nomor induk santri (NISN) dan token sesi ujian.
3. Menyediakan koreksi instan otomatis untuk soal pilihan ganda serta memudahkan pengoreksian soal essay.
4. Menjaga integritas dan kejujuran ujian melalui mekanisme pengacakan soal, pengacakan opsi, dan deteksi fokus layar.

## Non-goals

1. Bukan Learning Management System (LMS) menyeluruh untuk penugasan harian atau forum diskusi materi belajar.
2. Tidak mencakup sistem pembayaran SPP atau administrasi keuangan pesantren.
3. Tidak mendukung proctoring berbasis rekaman video kecerdasan buatan (AI) pada rilis versi awal.

## Target pengguna

- **Ustadz / Pengajar / Penguji**: Menyusun butir soal, mengatur paket ujian, mengaktifkan token sesi, dan mengoreksi jawaban essay santri.
- **Santri / Peserta Ujian**: Mengerjakan soal ujian melalui antarmuka bersih, responsif, dan mudah dipahami.
- **Admin Madrasah / Panitia Ujian**: Mengatur data mata pelajaran, kelompok kelas, kalender ujian semester, dan mengekspor rekap nilai.

## Scope

### In-scope (Fase 1)
- Autentikasi pengajar dan admin menggunakan kredensial terverifikasi.
- Manajemen Bank Soal (Mata Pelajaran, Pilihan Ganda, Essay).
- Manajemen Sesi Ujian (Jadwal, Durasi menit, Token Akses 6 karakter, Pengacakan).
- Ruang Pengerjaan Ujian Santri (Login via NISN + Token, Auto-save jawaban, Timer hitung mundur, Navigasi nomor soal).
- Penilaian instan untuk pilihan ganda dan koreksi manual untuk essay.
- Rekapitulasi nilai dan ekspor data nilai per kelas.

### Out-of-scope (Fase mendatang)
- Ujian lisan / setoran hafalan audio.
- Integrasi otomatis dengan scanner lembar jawaban komputer fisik.

## Risiko

- **Konektivitas Jaringan**: Fluktuasi koneksi internet lokal di area pesantren dapat mengganggu transmisi jawaban santri.
  - *Mitigasi*: Mekanisme penyimpanan lokal sementara di browser dan auto-sync berkala saat koneksi pulih.
- **Kecurangan Peserta**: Santri membuka tab lain atau aplikasi lain saat ujian berlangsung.
  - *Mitigasi*: Peringatan perpindahan tab (blur detection) dan pengacakan urutan soal serta pilihan jawaban.

## Definition of done

1. Seluruh kebutuhan fungsional inti (FR) dan kriteria penerimaan (AC) pada setiap modul fitur terimplementasi dan lolos verifikasi.
2. Antarmuka web memenuhi standar aksesibilitas dan responsif di perangkat desktop, laptop, maupun tablet.
3. Pengujian unit dan validasi bebas kebocoran kode spesifikasi teknis lolos 100%.
4. Dokumentasi teknis dan alur pengguna lengkap dan terverifikasi.`;

// 4. PRD/asumsi-dan-pertanyaan.md
files['PRD/asumsi-dan-pertanyaan.md'] = `# Asumsi, keputusan, dan pertanyaan terbuka

## Keputusan yang disepakati

1. **Akses Santri**: Santri tidak wajib mendaftarkan email pribadi. Santri masuk ruang ujian menggunakan NISN/Nomor Peserta dan Token Sesi yang dibagikan pengawas.
2. **Tipe Soal Fase 1**: Kombinasi Pilihan Ganda (koreksi nilai otomatis) dan Essay sederhana (koreksi penilaian oleh guru).
3. **Bahasa Antarmuka**: Bahasa Indonesia sebagai bahasa utama sistem, dengan dukungan teks Arab untuk soal-soal diniyyah dan bahasa Arab.
4. **Identitas Visual**: Menggunakan warna hijau zamrud (Islamic Pine/Teal) sesuai brand E-Imtihan At-Tauhid.

## Asumsi

1. Santri mengerjakan ujian menggunakan laboratorium komputer madrasah atau gawai tablet/laptop yang disediakan sekolah.
2. Pengawas ruangan hadir secara fisik saat ujian berlangsung untuk memverifikasi kehadiran santri dan mengumumkan token ujian.
3. Perangkat memiliki browser modern berbasis Chromium, Safari, atau Firefox dengan JavaScript aktif.

## Pertanyaan terbuka

1. Apakah perlu batas maksimal perpindahan tab (misal 3 kali peringatan sebelum lembar ujian terkunci otomatis)?
2. Apakah bobot nilai pilihan ganda dan essay ditentukan per butir soal atau per persentase total ujian?`;

// 5. PRD/metrik-keberhasilan.md
files['PRD/metrik-keberhasilan.md'] = `# Metrik keberhasilan

## Metrik Utama

1. **Tingkat Keberhasilan Pengumpulan Ujian (Submission Success Rate)**:
   - Definisi: Persentase santri yang berhasil menyelesaikan dan mengumpulkan lembar jawaban tanpa kehilangan data akibat kendala teknis.
   - Target: Minimal 99.5% dari seluruh sesi ujian yang dimulai.

2. **Waktu Rata-rata Koreksi Nilai (Time to Results)**:
   - Definisi: Waktu yang dibutuhkan sejak sesi ujian berakhir hingga rekap nilai santri selesai dihitung.
   - Target: Instan (< 5 detik) untuk ujian pilihan ganda penuh, dan < 24 jam untuk ujian dengan komponen essay.

3. **Keandalan Auto-Save Jawaban (Data Durability)**:
   - Definisi: Frekuensi jawaban santri berhasil tersimpan ke sistem saat terjadi gangguan jaringan lokal.
   - Target: 100% jawaban tersimpan lokal di browser dan otomatis tersinkronisasi kembali dalam waktu < 3 detik setelah internet pulih.

4. **Tingkat Adopsi Pengajar**:
   - Definisi: Persentase pengajar yang dapat membuat paket ujian secara mandiri tanpa bantuan teknis langsung.
   - Target: Minimal 90% pengajar aktif.`;

// 6. PRD/model-data.md
files['PRD/model-data.md'] = `# Model data konseptual

Dokumen ini mendefinisikan entitas data konseptual untuk E-Imtihan At-Tauhid tanpa mengikat ke implementasi database fisik tertentu.

## Entitas Utama

1. **PENGGUNA (User)**
   - Atribut: user_id, nama_lengkap, email, peran (admin/pengajar), status_aktif.
2. **MATA_PELAJARAN (Subject)**
   - Atribut: mapel_id, kode_mapel, nama_mapel, deskripsi.
3. **BANK_SOAL (QuestionBank)**
   - Atribut: bank_id, mapel_id, judul_paket, tingkat_kelas, pembuat_id, tanggal_dibuat.
4. **BUTIR_SOAL (QuestionItem)**
   - Atribut: soal_id, bank_id, nomor_urut, tipe_soal (pilihan_ganda/essay), teks_soal, media_lampiran, bobot_nilai.
5. **OPSI_JAWABAN (AnswerOption)**
   - Atribut: opsi_id, soal_id, label_opsi (A/B/C/D), teks_opsi, is_kunci_jawaban.
6. **SESI_UJIAN (ExamSession)**
   - Atribut: sesi_id, bank_id, nama_sesi, token_akses, waktu_mulai, waktu_selesai, durasi_menit, acak_soal, status (draft/aktif/selesai).
7. **PESERTA_SESI (ExamParticipant)**
   - Atribut: peserta_id, sesi_id, nisn, nama_santri, kelas, waktu_masuk, waktu_selesai, status_pengerjaan.
8. **LEMBAR_JAWABAN & NILAI (AnswerSheet)**
   - Atribut: lembar_id, peserta_id, total_skor, nilai_pg, nilai_essay, status_koreksi.`;

// 7. PRD/non-functional-requirements.md
files['PRD/non-functional-requirements.md'] = `# Non-functional requirements

## Performa
- NFR-PERF-001: Waktu muat halaman awal dan halaman soal ujian santri harus di bawah 1.5 detik pada koneksi internet standar (10 Mbps).
- NFR-PERF-002: Operasi penyimpanan jawaban otomatis (auto-save) harus tuntas dalam waktu kurang dari 300 ms tanpa memblokir interaksi pengguna.
- NFR-PERF-003: Sistem harus mampu menangani setidaknya 200 santri yang mengerjakan ujian secara simultan dalam satu jaringan lokal madrasah.

## Keamanan
- NFR-SEC-001: Kunci jawaban tidak boleh dikirimkan ke browser santri sebelum santri resmi mengumpulkan lembar ujian.
- NFR-SEC-002: Token ujian dienkripsi dan diverifikasi di sisi server untuk mencegah injeksi akses ilegal.
- NFR-SEC-003: Seluruh data transmisi wajib menggunakan protokol HTTPS terenkripsi.

## Keandalan & Ketahanan
- NFR-REL-001: Jika koneksi internet santri terputus sementara, browser tetap mempertahankan jawaban yang telah dipilih pada penyimpanan lokal perangkat.
- NFR-REL-002: Sesi ujian santri dapat dipulihkan kembali ke nomor soal terakhir tanpa kehilangan akumulasi jawaban sebelumnya.

## Kompatibilitas
- NFR-COMP-001: Antarmuka ujian santri harus kompatibel dengan browser desktop (Chrome, Edge, Firefox) dan browser gawai tablet/smartphone (Safari, Chrome Mobile).`;

// 8. PRD/roadmap.md
files['PRD/roadmap.md'] = `# Roadmap produk

## Fase 1 — Pondasi Asesmen & Ujian Mandiri (Versi 0.1 - 1.0)
- Autentikasi Pengajar dan Administrator.
- Manajemen Bank Soal (Pilihan Ganda & Essay).
- Pembuatan Jadwal Sesi Ujian & Generator Token.
- Ruang Pengerjaan Ujian Santri berbasis NISN + Token (Auto-save & Timer).
- Koreksi otomatis pilihan ganda dan lembar rekap nilai kelas.

## Fase 2 — Peningkatan Integritas & Fitur Khusus Diniyyah (Versi 1.1 - 1.5)
- Pengamanan ujian tingkat lanjut (deteksi blur window / perpindahan tab browser).
- Modul dukungan teks Arab dan harakat yang dioptimalkan untuk materi Fiqih, Nahwu, dan Hadits.
- Pencetakan kartu peserta ujian dan daftar hadir fisik.
- Fitur impor dan ekspor soal melalui format spreadsheet (Excel/CSV).

## Fase 3 — Penilaian Tahfidz & Analitik Pembelajaran (Versi 2.0)
- Modul ujian lisan dan lembar penilaian setoran hafalan Al-Qur'an (Tahfidz).
- Analitik butir soal (tingkat kesukaran dan daya pembeda butir soal).
- Portal nilai santri yang dapat diakses oleh wali santri.`;

// 9. PRD/fitur/bank-soal.md
files['PRD/fitur/bank-soal.md'] = `# Manajemen Bank Soal

## Tujuan

Menyediakan sarana bagi pengajar (asatidzah) untuk menyusun, mengelola, dan mengelompokkan butir-butir soal ujian (pilihan ganda dan essay) berdasarkan mata pelajaran dan tingkat kelas secara terstruktur dan aman.

## User stories

- Sebagai Pengajar, saya ingin membuat paket bank soal per mata pelajaran agar kumpulan soal tersusun rapi untuk ujian semester.
- Sebagai Pengajar, saya ingin menambahkan butir soal pilihan ganda dengan 4 atau 5 opsi jawaban dan menandai satu kunci jawaban yang benar agar sistem dapat mengoreksi otomatis.
- Sebagai Pengajar, saya ingin menuliskan soal essay beserta panduan rubrik penilaian agar saya memiliki pedoman penilaian yang adil.

## Kebutuhan fungsional

- \`BANK-FR-001\` — Sistem harus menyediakan formulir pembuatan paket bank soal baru yang mencakup nama paket, mata pelajaran, tingkat kelas, dan alokasi bobot nilai.
- \`BANK-FR-002\` — Sistem harus mendukung input butir soal pilihan ganda dengan opsi jawaban A, B, C, D (dan opsional E), teks pembahasan, dan pemilihan kunci jawaban.
- \`BANK-FR-003\` — Sistem harus mendukung input butir soal essay dengan kolom teks soal, rubrik pedoman penilaian, dan batas nilai maksimal.
- \`BANK-FR-004\` — Sistem harus menyediakan pratinjau (preview) tampilan soal seperti yang akan dilihat oleh santri.

## Kriteria penerimaan

- \`BANK-AC-001\` — Saat butir soal pilihan ganda disimpan, sistem memvalidasi bahwa minimal ada 2 opsi terisi dan tepat satu opsi dipilih sebagai kunci jawaban.
- \`BANK-AC-002\` — Kunci jawaban pilihan ganda tersimpan di basis data terproteksi dan tidak diekspos ke antarmuka publik.
- \`BANK-AC-003\` — Pengajar dapat mengedit atau menghapus butir soal selama paket bank soal belum digunakan dalam sesi ujian yang sedang berjalan aktif.

## Edge cases

- Soal yang memuat teks Arab berharakat panjang atau tanda kutip kutipan ayat Al-Qur'an harus dirender secara akurat tanpa terpotong atau rusak enkodingnya.
- Upaya menghapus bank soal yang sedang terikat pada sesi ujian aktif harus ditolak oleh sistem dengan pemberitahuan yang jelas.`;

// 10. PRD/fitur/sesi-ujian.md
files['PRD/fitur/sesi-ujian.md'] = `# Sesi dan Jadwal Ujian

## Tujuan

Memungkinkan panitia ujian dan pengajar untuk menjadwalkan pelaksanaan ujian, menentukan durasi waktu pengerjaan, mengontrol token akses santri, serta mengatur opsi keamanan seperti pengacakan urutan soal.

## User stories

- Sebagai Pengajar/Panitia, saya ingin membuat sesi ujian dengan menentukan waktu mulai, waktu selesai, dan batas durasi (misal 60 menit) agar santri tertib waktu.
- Sebagai Pengajar, saya ingin menghasilkan token akses unik (misal 6 karakter alfanumerik) yang dapat diaktifkan menjelang ujian dimulai dan dinonaktifkan setelahnya.
- Sebagai Pengajar, saya ingin mengaktifkan fitur acak urutan soal agar setiap santri yang bersebelahan menerima urutan soal yang berbeda.

## Kebutuhan fungsional

- \`SESI-FR-001\` — Sistem harus menyediakan manajemen sesi ujian dengan parameter: judul sesi, bank soal rujukan, tanggal/jam mulai, tanggal/jam selesai, dan durasi menit pengerjaan.
- \`SESI-FR-002\` — Sistem harus menyediakan generator token akses acak 6 digit alfanumerik yang dapat di-generate ulang kapan saja oleh pengawas.
- \`SESI-FR-003\` — Sistem harus menyediakan toggle untuk mengaktifkan pengacakan urutan nomor butir soal dan pengacakan urutan opsi pilihan ganda.
- \`SESI-FR-004\` — Sistem harus menyediakan monitoring langsung (live monitor) status kehadiran peserta (belum mulai, sedang mengerjakan, telah selesai).

## Kriteria penerimaan

- \`SESI-AC-001\` — Token sesi ujian hanya dapat digunakan oleh santri selama rentang waktu sesi berstatus aktif.
- \`SESI-AC-002\` — Ketika pengawas menonaktifkan status sesi, seluruh santri yang sedang mengerjakan tidak dapat lagi mengubah jawaban.
- \`SESI-AC-003\` — Urutan soal yang diacak tetap konsisten untuk satu santri tertentu selama sesi ujian berlangsung meskipun halaman di-refresh.

## Edge cases

- Santri yang terlambat masuk ujian hanya mendapatkan sisa waktu sesi yang tersedia jika batas akhir sesi telah ditentukan.`;

// 11. PRD/fitur/ruang-ujian-santri.md
files['PRD/fitur/ruang-ujian-santri.md'] = `# Ruang Ujian Santri

## Tujuan

Menyediakan antarmuka pengerjaan ujian berbasis komputer (CBA) yang mudah digunakan, bersih, bebas distraksi, dan tahan terhadap gangguan koneksi internet lokal bagi para santri.

## User stories

- Sebagai Santri, saya ingin masuk ke ujian cukup dengan memasukkan NISN/Nama saya dan Token Ujian yang diberikan ustadz tanpa harus registrasi email.
- Sebagai Santri, saya ingin melihat sisa waktu ujian yang berjalan mundur di layar agar saya dapat mengatur ritme pengerjaan soal.
- Sebagai Santri, saya ingin jawaban yang saya pilih langsung tersimpan otomatis agar tidak hilang jika komputer mati atau jaringan internet lambat.
- Sebagai Santri, saya ingin memiliki peta nomor soal untuk melompat ke nomor tertentu atau menandai soal yang masih ragu-ragu.

## Kebutuhan fungsional

- \`UJIAN-FR-001\` — Sistem harus menyediakan pintu gerbang login santri berbasis input NISN/Nomor Ujian dan Token Sesi yang valid.
- \`UJIAN-FR-002\` — Sistem harus menampilkan lembar soal dengan navigasi nomor (Grid Nomor Soal) yang membedakan status soal: belum dijawab, sudah dijawab, dan ragu-ragu.
- \`UJIAN-FR-003\` — Sistem harus menyimpan jawaban secara otomatis (auto-save) seketika santri memilih opsi atau mengetik jawaban essay.
- \`UJIAN-FR-004\` — Sistem harus menyediakan timer hitung mundur yang otomatis mengumpulkan lembar ujian saat waktu durasi habis.
- \`UJIAN-FR-005\` — Sistem harus menyediakan dialog konfirmasi pengumpulan sebelum santri menyelesaikan ujian secara sukarela.

## Kriteria penerimaan

- \`UJIAN-AC-001\` — Santri yang me-refresh browser atau mengalami putus koneksi jaringan dapat melanjutkan kembali pengerjaan dengan jawaban yang tetap utuh.
- \`UJIAN-AC-002\` — Pengumpulan lembar ujian hanya dapat dilakukan jika santri mengonfirmasi dialog peringatan pengumpulan akhir.
- \`UJIAN-AC-003\` — Setelah status ujian santri menjadi 'selesai', santri tidak dapat lagi mengakses atau mengubah jawaban pada sesi tersebut.

## Edge cases

- Jika waktu pengerjaan habis tepat saat santri sedang memilih jawaban, sistem secara otomatis mengunci seluruh pilihan dan mengirimkan seluruh jawaban terakhir yang tersimpan.`;

// 12. PRD/fitur/penilaian-dan-rekap.md
files['PRD/fitur/penilaian-dan-rekap.md'] = `# Penilaian dan Rekap Nilai

## Tujuan

Mempercepat proses pengolahan hasil ujian santri melalui koreksi otomatis butir pilihan ganda, antarmuka periksa cepat untuk soal essay, dan lembar rekapitulasi nilai yang rapi dan mudah diunduh.

## User stories

- Sebagai Pengajar, saya ingin nilai soal pilihan ganda dihitung secara otomatis seketika santri mengumpulkan ujian agar saya tidak perlu mengoreksi manual satu per satu.
- Sebagai Pengajar, saya ingin membuka lembar periksa essay santri dan memberikan skor nilai per butir soal dengan cepat.
- Sebagai Panitia/Admin, saya ingin mengunduh rekapitulasi daftar nilai seluruh santri dalam satu kelas untuk dicetak atau dilaporkan kepada pimpinan pesantren.

## Kebutuhan fungsional

- \`NILAI-FR-001\` — Sistem harus secara instan menghitung skor nilai pilihan ganda berdasarkan kunci jawaban dan bobot masing-masing butir soal.
- \`NILAI-FR-002\` — Sistem harus menyediakan antarmuka khusus koreksi essay bagi pengajar untuk memasukkan skor penilaian dan catatan evaluasi.
- \`NILAI-FR-003\` — Sistem harus menghitung akumulasi skor total akhir santri (Pilihan Ganda + Essay) secara otomatis.
- \`NILAI-FR-004\` — Sistem harus menyediakan tabel rekap nilai kelas lengkap dengan statistik nilai tertinggi, terendah, dan rata-rata kelas.

## Kriteria penerimaan

- \`NILAI-AC-001\` — Skor pilihan ganda santri langsung tampil di dashboard pengajar dalam waktu maksimal 2 detik setelah santri melakukan submit ujian.
- \`NILAI-AC-002\` — Nilai akhir santri diperbarui secara otomatis setelah pengajar selesai mengisi skor nilai butir essay.
- \`NILAI-AC-003\` — Data rekap nilai dapat diekspor ke format tabel CSV/Excel yang rapi dan siap cetak.

## Edge cases

- Santri yang tidak menjawab satu pun soal pilihan ganda mendapatkan skor 0 untuk bagian pilihan ganda secara valid tanpa menyebabkan pembagian dengan nol.`;

// 13. UI/README.md
files['UI/README.md'] = `# UI Design Guide E-Imtihan At-Tauhid

Panduan desain antarmuka pengguna (UI/UX) untuk platform evaluasi E-Imtihan At-Tauhid.

## Dokumen Panduan Desain

- [Arah Desain (Design Direction)](design-direction.md)
- [Aksesibilitas (Accessibility)](accessibility.md)
- [Panduan Konten (Content Guidelines)](content-guidelines.md)
- [Fondasi Desain (Design Foundations)](foundations/README.md)
- [Standar Komponen (Component Standards)](components/README.md)
- [Pola Interaksi (Interaction Patterns)](patterns/README.md)
- [Inventaris Screen (Screen Inventory)](screens/screen-inventory.md)`;

// 14. UI/design-direction.md
files['UI/design-direction.md'] = `# Arah desain

## Filosofi Desain

Desain E-Imtihan At-Tauhid mengusung prinsip **Tenang, Bersih, Berwibawa, dan Bebas Distraksi**. Karena platform ini digunakan untuk asesmen santri, antarmuka tidak boleh membingungkan atau membebani visual santri yang sedang berkonsentrasi.

## Karakter Visual

1. **Warna Dominan (Islamic Pine / Emerald Teal)**:
   - Warna aksen utama menggunakan hijau zamrud dalam yang memberikan kesan sejuk, bernuansa edukasi Islam terstandar, dan berwibawa.
   - Dipadukan dengan latar netral bersih (putih bersih pada tema terang, dan dark slate pada tema gelap).
2. **Tipografi Berjenjang**:
   - Judul & Heading: Menggunakan font dengan ketegasan struktural (JetBrains Mono / Heading Sans).
   - Teks Bacaan Soal: Menggunakan font sans-serif berdaya baca tinggi (Inter) dengan ukuran font nyaman dibaca santri.
   - Angka & Timer: Menggunakan font mono (Geist Mono) agar digit timer detik tidak bergeser saat berjalan.
3. **Komponen Antarmuka**:
   - Seluruh komponen dibangun berbasis Shadcn UI dengan radius terstandar (0.625rem).
   - Menggunakan ikon Lucide yang intuitif dan profesional tanpa menggunakan emoji.`;

// 15. UI/accessibility.md
files['UI/accessibility.md'] = `# Aksesibilitas

## Standar Aksesibilitas

Platform E-Imtihan At-Tauhid menerapkan standar aksesibilitas WCAG 2.1 Level AA:

1. **Kontras Warna**:
   - Seluruh teks soal dan tombol navigasi memiliki rasio kontras minimal 4.5:1 terhadap warna latar belakang.
   - Mode gelap (dark mode) menggunakan kontras yang ramah mata tanpa menyilaukan saat ujian malam hari.
2. **Navigasi Keyboard**:
   - Santri dapat beralih antar nomor soal dan memilih opsi jawaban menggunakan tombol keyboard (misal tombol 1-4 atau A-D, dan tombol panah).
3. **Dukungan Ukuran Teks**:
   - Tersedia tombol pengatur ukuran font soal (Kecil, Sedang, Besar) di ruang ujian santri agar santri dengan kendala penglihatan dapat membaca teks soal dengan jelas.`;

// 16. UI/content-guidelines.md
files['UI/content-guidelines.md'] = `# Panduan konten

## Nada dan Suara (Tone of Voice)

- **Santun dan Jelas**: Menggunakan Bahasa Indonesia baku yang lugas dan mudah dipahami oleh santri berbagai jenjang pendidikan.
- **Memberdayakan**: Pesan instruksi dan peringatan ditulis dengan kalimat positif dan informatif.
- **Nuansa Pesantren yang Rapi**: Menggunakan istilah yang akrab di lingkungan madrasah seperti Ustadz, Santri, Mata Pelajaran, Sesi Ujian, dan Halaqah.

## Aturan Higienitas Salinan UI (Zero Technical Leaks)

- Dilarang keras memunculkan kode pengenal teknis seperti \`SCR-*\`, \`*-FR-*\`, \`TASK-*\`, nomor fase, atau path berkas dokumen internal ke dalam label tombol, teks antarmuka, judul kartu, atau deskripsi pengguna.`;

// 17. UI/foundations/README.md
files['UI/foundations/README.md'] = `# Fondasi desain

## Palet Warna

- **Primary**: \`oklch(0.511 0.096 186.391)\` (Deep Teal / Pine Green) — digunakan untuk tombol utama, indikator aktif, dan aksen brand.
- **Primary Foreground**: \`oklch(0.984 0.014 180.72)\` (Putih sejuk).
- **Secondary**: \`oklch(0.967 0.001 286.375)\` (Abu-abu lembut untuk latar kartu sekunder).
- **Destructive**: \`oklch(0.577 0.245 27.325)\` (Merah peringatan untuk tombol batalkan atau keluar ujian).
- **Border / Divider**: Garis pembatas tipis yang tegas dan tidak mengganggu fokus baca.

## Tipografi

- Font Heading: \`var(--font-heading)\` (JetBrains Mono)
- Font Utama (Body): \`var(--font-sans)\` (Inter)
- Font Monospace (Timer & Token): \`var(--font-mono)\` (Geist Mono)

## Tata Letak & Spasi

- Grid sistem 12 kolom untuk dashboard manajemen pengajar.
- Layout terfokus 1 kolom dengan sidebar nomor soal untuk ruang ujian santri.`;

// 18. UI/components/README.md
files['UI/components/README.md'] = `# Standar komponen

## Komponen Utama

1. **Tombol (Button)**:
   - Variant default: Primary green background untuk aksi utama.
   - Variant outline / ghost: Untuk aksi sekunder seperti navigasi kembali.
2. **Kartu Nomor Soal (Question Number Grid)**:
   - Kotak nomor ukuran 40x40 px dengan status warna:
     - Hijau (Primary): Sudah dijawab.
     - Kuning/Amber: Ragu-ragu.
     - Abu-abu/Outline: Belum dijawab.
     - Ring Tebal: Nomor soal yang sedang aktif dibuka.
3. **Timer Display**:
   - Card kompak di sudut atas ruang ujian dengan ikon jam dan angka monospace hitung mundur. Peringatan visual warna oranye ketika sisa waktu < 10 menit.
4. **Pilihan Jawaban (Radio Option Card)**:
   - Kartu opsi jawaban pilihan ganda berukuran penuh yang dapat diklik pada seluruh area baris (bukan hanya lingkaran radio).`;

// 19. UI/patterns/README.md
files['UI/patterns/README.md'] = `# Pola interaksi

## Pola Alur Pengerjaan Ujian

1. **Masuk Ujian**:
   - Santri memasukkan NISN dan Token di layar pembuka -> Klik tombol Masuk Ujian -> Menampilkan konfirmasi identitas santri & mata pelajaran -> Klik Mulai Mengerjakan.
2. **Pengerjaan Soal**:
   - Memilih opsi jawaban langsung memicu status penyimpanan (Tersimpan) tanpa jeda halaman.
   - Tombol Ragu-ragu memberi tanda warna pada grid nomor soal untuk ditinjau ulang nanti.
3. **Pengumpulan Ujian**:
   - Tombol Kumpulkan Ujian membuka modal rekapitulasi: jumlah soal terjawab, belum terjawab, dan ragu-ragu.
   - Memerlukan konfirmasi centang pernyataan kesiapan sebelum tombol submit akhir aktif.`;

// 20. UI/screens/screen-inventory.md
files['UI/screens/screen-inventory.md'] = `# Inventaris screen

Daftar seluruh layar antarmuka pengguna pada platform E-Imtihan At-Tauhid.

## 1. Antarmuka Manajemen (Pengajar & Panitia)

- **Layar Beranda / Dashboard**: Ringkasan jumlah bank soal aktif, jadwal ujian mendatang, dan daftar ujian yang perlu dikoreksi.
- **Layar Bank Soal**: Tabel paket bank soal, filter mata pelajaran, dan tombol tambah paket soal baru.
- **Layar Editor Soal**: Formulir pembuatan soal pilihan ganda, opsi jawaban, upload gambar/audio, dan rubrik essay.
- **Layar Jadwal & Sesi Ujian**: Pengaturan tanggal ujian, batas durasi, tombol generate token, dan kontrol acak soal.
- **Layar Monitoring Sesi Ujian**: Pemantauan real-time status santri yang sedang terhubung dan mengerjakan ujian.
- **Layar Koreksi & Rekap Nilai**: Formulir penilaian essay santri dan tabel rekapitulasi nilai akhir kelas.

## 2. Antarmuka Santri (Ruang Ujian CBA)

- **Layar Masuk Ujian (Gate)**: Input NISN/Nama dan Token 6 karakter.
- **Layar Instruksi Ujian**: Petunjuk tata tertib pengerjaan ujian, durasi waktu, dan tombol mulai.
- **Layar Lembar Pengerjaan Ujian**: Area teks soal, opsi jawaban A-D/E, kotak nomor navigasi, dan timer hitung mundur.
- **Layar Konfirmasi Selesai**: Dialog rekap status pengerjaan soal dan tombol pengumpulan final.
- **Layar Penutup**: Ucapan terima kasih dan konfirmasi bahwa lembar jawaban santri telah berhasil terekam aman di sistem.`;

// 21. EXECUTION/README.md
files['EXECUTION/README.md'] = `# Paket eksekusi E-Imtihan At-Tauhid

Dokumen perencanaan dan panduan eksekusi teknis untuk implementasi bertahap E-Imtihan At-Tauhid.

## Dokumen Rencana Eksekusi

- [TODO Eksekusi Utama](TODO.md)
- [Urutan Fitur dan Dependensi](feature-order.md)
- [Kesiapan Rilis](release-readiness.md)

## Daftar Fase Eksekusi

- [Fase 00 — Keputusan Produk dan Pondasi Arsitektur](phases/phase-00-decisions.md)
- [Fase 01 — Manajemen Bank Soal dan Butir Soal](phases/phase-01-bank-soal.md)
- [Fase 02 — Sesi Ujian dan Generator Token](phases/phase-02-sesi-ujian.md)
- [Fase 03 — Ruang Ujian Santri dan Auto-Save](phases/phase-03-ruang-ujian.md)
- [Fase 04 — Penilaian Otomatis dan Rekap Nilai](phases/phase-04-penilaian-rekap.md)`;

// 22. EXECUTION/TODO.md
files['EXECUTION/TODO.md'] = `# TODO Eksekusi — E-Imtihan At-Tauhid

Dokumen ini adalah ledger hidup untuk pelaksanaan bertahap. Perbarui pada saat pekerjaan dimulai, diblokir, dan selesai.

## Legenda status

- \`pending\` — belum dimulai
- \`in_progress\` — sedang dikerjakan
- \`blocked\` — tidak dapat dilanjutkan sampai blocker terselesaikan
- \`done\` — selesai dan telah diverifikasi
- \`skipped\` — sengaja tidak dikerjakan dengan alasan tercatat

## Checklist eksekusi

- [ ] \`TASK-001\` — Persiapan skema data Convex untuk Bank Soal dan Butir Soal
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-01\`
  - Requirements: \`BANK-FR-001\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: none
  - Validasi: Skema Convex tervalidasi via npx convex dev --once
  - Bukti: pending

- [ ] \`TASK-002\` — Implementasi antarmuka pembuatan paket Bank Soal dan input butir soal
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-01\`
  - Requirements: \`BANK-FR-002\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-001\`
  - Validasi: Pengajar dapat membuat paket soal dan menambahkan butir pilihan ganda
  - Bukti: pending

- [ ] \`TASK-003\` — Skema Convex dan backend logic Sesi Ujian serta Generator Token
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-02\`
  - Requirements: \`SESI-FR-001\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-001\`
  - Validasi: Mutasi pembuatan sesi dan token acak 6 digit berhasil dibuat
  - Bukti: pending

- [ ] \`TASK-004\` — Antarmuka penjadwalan sesi ujian dan aktivasi token pengawas
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-02\`
  - Requirements: \`SESI-FR-002\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-003\`
  - Validasi: Pengajar dapat menjadwalkan ujian dan membagikan token aktif
  - Bukti: pending

- [ ] \`TASK-005\` — Pintu masuk ujian santri via NISN dan verifikasi Token
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-03\`
  - Requirements: \`UJIAN-FR-001\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-003\`
  - Validasi: Santri dapat masuk sesi ujian dengan token valid tanpa registrasi email
  - Bukti: pending

- [ ] \`TASK-006\` — Lembar pengerjaan ujian santri dengan navigasi nomor dan auto-save
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-03\`
  - Requirements: \`UJIAN-FR-002\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-005\`
  - Validasi: Pilihan jawaban tersimpan otomatis dan timer hitung mundur aktif
  - Bukti: pending

- [ ] \`TASK-007\` — Logika penilaian instan pilihan ganda dan antarmuka koreksi essay
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-04\`
  - Requirements: \`NILAI-FR-001\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-006\`
  - Validasi: Nilai pilihan ganda otomatis terakumulasi seketika ujian selesai
  - Bukti: pending

- [ ] \`TASK-008\` — Dashboard rekapitulasi nilai kelas dan ekspor data laporan
  - Status: \`pending\`
  - Workflow: \`feature\`
  - Skill pendukung: none
  - Fase: \`phase-04\`
  - Requirements: \`NILAI-FR-003\`
  - Pengalaman: \`UI/screens/screen-inventory.md\`
  - Dependensi: \`TASK-007\`
  - Validasi: Daftar nilai seluruh santri tampil lengkap dengan statistik rata-rata
  - Bukti: pending

## Blocker aktif

Tidak ada blocker aktif saat ini. Seluruh pondasi autentikasi dan basis data telah siap.

## Catatan keputusan

- Keputusan: Santri mengakses ujian menggunakan NISN dan Token Sesi tanpa kewajiban registrasi email.
- Keputusan: Menggunakan warna tema identitas hijau zamrud terstandar (Islamic Pine/Teal).`;

// 23. EXECUTION/feature-order.md
files['EXECUTION/feature-order.md'] = `# Urutan fitur

Rencana tahapan implementasi fitur berdasarkan dependensi teknis:

1. **Pondasi Manajemen Bank Soal**:
   - Menjadi dependensi mutlak karena sesi ujian memerlukan paket butir soal yang telah tersedia.
2. **Sesi Ujian dan Token Akses**:
   - Mengatur parameter jadwal, durasi pengerjaan, dan generator token dari paket bank soal yang telah dibuat.
3. **Ruang Ujian Santri (CBA Interface)**:
   - Menggunakan token ujian untuk memberikan akses pengerjaan soal dan perekaman jawaban santri.
4. **Penilaian dan Rekapitulasi Nilai**:
   - Menghitung lembar jawaban santri yang telah terkumpul dan menyajikan laporan nilai bagi pengajar.`;

// 24. EXECUTION/release-readiness.md
files['EXECUTION/release-readiness.md'] = `# Kesiapan rilis

Daftar periksa kesiapan rilis produk E-Imtihan At-Tauhid:

- [ ] Seluruh skema database tervalidasi dan terindeks dengan baik di Convex.
- [ ] Fitur penyimpanan otomatis (auto-save) teruji tahan banting terhadap simulasi internet offline.
- [ ] Koreksi otomatis pilihan ganda memiliki akurasi 100% terhadap kunci jawaban.
- [ ] Tampilan responsif diuji pada resolusi desktop (1920x1080), laptop (1366x768), dan tablet (768x1024).
- [ ] Pengujian regresi unit test dan pengecekan kebocoran kode spesifikasi teknis lulus tanpa error.`;

// 25. EXECUTION/phases/
files['EXECUTION/phases/phase-00-decisions.md'] = `# Fase 00 — Keputusan produk

Dokumen keputusan arsitektur dan kesepakatan cakupan sebelum implementasi kode.

## Dependensi

Tidak ada. Fase ini mendahului seluruh implementasi fungsional.

## Workflow eksekusi

- Analisis kebutuhan santri dan ustadz.
- Penentuan mekanisme masuk ujian santri via NISN + Token.
- Pemilihan palet warna hijau zamrud (Islamic Teal) dan tipografi terstandar.

## Kriteria keluar

- Paket perencanaan .planora lengkap dan tervalidasi tanpa error.
- Cakupan MVP disetujui untuk melanjutkan ke implementasi Fase 01.`;

files['EXECUTION/phases/phase-01-bank-soal.md'] = `# Fase 01 — Manajemen Bank Soal

Implementasi modul manajemen mata pelajaran, paket bank soal, dan butir soal pilihan ganda serta essay.

## Dependensi

Fase 00 (Pondasi arsitektur dan skema database).

## Workflow eksekusi

- \`feature\` — Implementasi skema tabel Bank Soal dan Butir Soal di Convex.
- \`feature\` — Pembuatan antarmuka editor soal pengajar berbasis Shadcn UI.

## Kriteria keluar

- Pengajar dapat membuat dan mengedit paket bank soal.
- Butir soal pilihan ganda dan essay tersimpan dengan validasi kunci jawaban yang benar.`;

files['EXECUTION/phases/phase-02-sesi-ujian.md'] = `# Fase 02 — Sesi Ujian dan Token

Implementasi modul penjadwalan ujian, alokasi durasi waktu, dan generator token akses.

## Dependensi

Fase 01 (Paket bank soal telah tersedia).

## Workflow eksekusi

- \`feature\` — Backend generator token 6 digit alfanumerik.
- \`feature\` — Antarmuka penjadwalan dan kontrol sesi ujian aktif bagi pengawas.

## Kriteria keluar

- Sesi ujian dapat dijadwalkan dengan durasi menit yang akurat.
- Token ujian aktif dapat diverifikasi oleh sistem.`;

files['EXECUTION/phases/phase-03-ruang-ujian.md'] = `# Fase 03 — Ruang Ujian Santri

Implementasi antarmuka pengerjaan ujian santri dengan navigasi nomor dan penyimpanan jawaban otomatis.

## Dependensi

Fase 02 (Sesi ujian dan token telah siap).

## Workflow eksekusi

- \`feature\` — Pintu masuk login santri berbasis NISN + Token.
- \`feature\` — Lembar ujian santri dengan timer hitung mundur dan auto-save real-time.

## Kriteria keluar

- Santri dapat menyelesaikan ujian dari nomor pertama hingga akhir tanpa kendala data hilang.
- Lembar jawaban terkumpul otomatis saat durasi waktu berakhir.`;

files['EXECUTION/phases/phase-04-penilaian-rekap.md'] = `# Fase 04 — Penilaian dan Rekap Nilai

Implementasi koreksi otomatis pilihan ganda, modul periksa essay pengajar, dan rekapitulasi nilai kelas.

## Dependensi

Fase 03 (Lembar jawaban santri telah terekam).

## Workflow eksekusi

- \`feature\` — Algoritma kalkulasi nilai otomatis pilihan ganda.
- \`feature\` — Antarmuka koreksi essay pengajar dan ekspor rekap nilai.

## Kriteria keluar

- Nilai santri terhitung lengkap dan akurat.
- Laporan nilai dapat diekspor dan dicetak dengan rapi.`;

// Write all documents
for (const [relPath, content] of Object.entries(files)) {
  write(relPath, content);
}

// Write manifest.json
function getAllFiles(dir, baseDir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath).replaceAll('\\', '/'));
    }
  }
  return results;
}

const allDiscoveredFiles = ['manifest.json'].concat(getAllFiles(planoraDir, planoraDir)).sort();
const uniqueFiles = Array.from(new Set(allDiscoveredFiles)).sort();

const manifest = {
  formatVersion: "1.0",
  packageDirectory: ".planora",
  project: {
    id: "e-imtihan-at-tauhid",
    name: "E-Imtihan At-Tauhid",
    locale: "id-ID"
  },
  generatedDate: new Date().toISOString().split('T')[0],
  guideType: "ui",
  status: "draft",
  sourceVersions: {
    prd: "0.1",
    uiGuide: "0.1",
    executionPlan: "0.1"
  },
  artifacts: {
    prd: {
      directory: "PRD",
      entry: "PRD/PRD.md",
      sourceVersion: "0.1",
      status: "draft"
    },
    uiGuide: {
      directory: "UI",
      entry: "UI/README.md",
      sourceVersion: "0.1",
      status: "draft"
    },
    executionPlan: {
      directory: "EXECUTION",
      entry: "EXECUTION/README.md",
      sourceVersion: "0.1",
      status: "draft"
    }
  },
  files: uniqueFiles,
  openBlockers: []
};

write('manifest.json', JSON.stringify(manifest, null, 2));
console.log('Successfully written', uniqueFiles.length, 'files to .planora package!');
