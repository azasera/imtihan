# Spesifikasi: Pemisahan Menu "Buat Bank Soal" (Creation Studio) & "Bank Soal" (Direktori Asesmen)

## 1. Masalah & Perilaku yang Diharapkan
- **Latar Belakang & Masalah**:
  Pengguna mengamati bahwa tombol aksi sidebar "Buat Bank Soal" dan butir menu navigasi "Bank Soal" keduanya mengarahkan ke halaman yang sama (`/bank-soal`), hanya dibedakan oleh kemunculan modal sederhana ketika ada parameter `?action=new`. Ketika modal ditutup, pengguna mendapati tampilan yang identik. Pengguna menginginkan pemisahan yang fungsional, profesional, dan premium tanpa mengambil jalan pintas.
- **Perilaku yang Diharapkan**:
  1. **Tombol "Buat Bank Soal"**: Mengarahkan langsung ke halaman studio pembuatan mandiri yang terdedikasi di `/bank-soal/baru`.
     - Menyediakan antarmuka terfokus (Creation Studio) dengan kartu pilihan template evaluasi (Penilaian Harian, PTS, PAS, Kustom).
     - Formulir konfigurasi metadata: Judul Paket, Mata Pelajaran (terhubung ke daftar mata pelajaran aktif), Lembaga & Jenjang (Wustha/Ulya), Standar Kelulusan (KKM & Total Nilai).
     - Pemilihan strategi penyusunan butir soal awal (Input Manual di Editor, Bantuan AI Assistant, atau Impor Massal Lembar Kerja).
     - Menyimpan via mutasi `createQuestionBank` dan langsung mengarahkan pengguna ke editor soal `/bank-soal/[id]` sesuai alur kerja yang dipilih.
  2. **Menu "Bank Soal"**: Berfungsi sebagai Dasbor Direktori & Portofolio Asesmen di `/bank-soal`.
     - Menampilkan kartu ringkasan eksekutif (Total Paket Bank Soal, Paket Aktif Digunakan di Sesi Ujian, Paket Draf / Belum Terpakai).
     - Filter pencarian cepat berdasarkan judul dan mata pelajaran.
     - Grid kartu paket soal dengan status pemakaian yang jelas, tombol aksi edit, hapus paket yang belum terpakai, dan tombol "Buat Paket Bank Soal Baru" yang mengarahkan ke studio `/bank-soal/baru`.
  3. **Zero Regression Guarantee**:
     - Mempertahankan kompatibilitas pengujian unit `apps/tests/bank-soal-ui.test.ts` dan `apps/tests/sidebar-navigation.test.ts`.
     - Menjamin tidak ada kebocoran kode spesifikasi teknis dan tidak menggunakan emoji (menggunakan Lucide icons).

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/bank-soal/baru/page.tsx`: Halaman studio pembuatan paket bank soal baru dengan prasetel template madrasah dan pemilihan alur kerja.
  - `apps/app/(main)/bank-soal/page.tsx`: Dasbor direktori bank soal dengan kartu ringkasan metrik, filter, dan tautan ke studio baru.
  - `apps/components/nav-main.tsx`: Penautan tombol CTA sidebar "Buat Bank Soal" ke `/bank-soal/baru`.
  - `apps/tests/bank-soal-creation-studio.test.ts`: Pengujian unit untuk verifikasi fungsionalitas studio pembuatan baru dan kepatuhan anti-leak.
- **Out-of-Scope**:
  - Mengubah skema basis data Convex (`apps/convex/schema.ts`).
  - Mengubah rute halaman pengerjaan santri atau monitoring sesi ujian.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "2 menu masih sama tampilannya... bantu saya buat yg lebih premium. posisikan anda adalah ahli dalam bidang ini. jangan selalu ambil cara pintas dan mudah."
- Tangkapan layar dari pengguna: Tombol "Buat Bank Soal" dan menu "Bank Soal" membuka halaman yang sama.
- Berkas terkait:
  - `apps/app/(main)/bank-soal/baru/page.tsx` (baru)
  - `apps/app/(main)/bank-soal/page.tsx`
  - `apps/components/nav-main.tsx`
  - `apps/components/app-sidebar.tsx`
  - `apps/tests/bank-soal-ui.test.ts`
  - `apps/tests/bank-soal-creation-studio.test.ts` (baru)

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Buat halaman `apps/app/(main)/bank-soal/baru/page.tsx` dengan antarmuka Creation Studio yang intuitif, template prasetel evaluasi madrasah, validasi formulir, integrasi mutasi `createQuestionBank`, dan pengalihan ke `/bank-soal/[id]`.
2. **Langkah 2**: Perbarui `apps/components/nav-main.tsx` agar tombol utama "Buat Bank Soal" mengarahkan ke `/bank-soal/baru`.
3. **Langkah 3**: Perkaya `apps/app/(main)/bank-soal/page.tsx` dengan kartu metrik ringkasan portofolio asesmen madrasah dan perbarui tombol pemicu agar mengarah ke `/bank-soal/baru`. Tetap pertahankan elemen yang diverifikasi oleh tes otomatis eksisting.
4. **Langkah 4**: Tulis pengujian unit komprehensif `apps/tests/bank-soal-creation-studio.test.ts` untuk memvalidasi struktur, rute, dan kepatuhan kode.
5. **Langkah 5**: Jalankan `npm run typecheck`, `npm test`, dan `npm --prefix apps run test:ui-leak` untuk memastikan zero regression.

## 5. Kriteria Penerimaan yang Terukur
1. Tombol sidebar "Buat Bank Soal" menavigasikan pengguna ke rute `/bank-soal/baru`.
2. Menu navigasi "Bank Soal" menampilkan direktori portofolio asesmen di `/bank-soal` lengkap dengan ringkasan metrik.
3. Halaman `/bank-soal/baru` menyediakan template penilaian harian, tengah semester, dan akhir semester serta opsi alur kerja (Manual, AI, Impor).
4. Pembuatan paket melalui studio berhasil menyimpan data ke Convex dan langsung mengarahkan ke editor paket soal.
5. Seluruh rangkaian pengujian (389+ tes) lulus 100% dan tidak ada kebocoran kode spesifikasi teknis.
