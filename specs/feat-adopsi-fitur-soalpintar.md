# Spesifikasi: Fitur Adopsi Nilai Unggulan SoalPintar ke E-Imtihan At-Tauhid

## 1. Deskripsi Masalah & Perilaku yang Diharapkan
- **Latar Belakang**:
  Hasil telaah terhadap platform referensi *SoalPintar* (Guru Era Digital) menunjukkan tiga keunggulan praktis yang sangat diminati pengajar:
  1. Kemudahan menghasilkan butir soal otomatis dengan bantuan kecerdasan buatan (AI Quiz Generator) berdasarkan topik dan level kognitif (LOTS/HOTS).
  2. Fleksibilitas ekspor naskah soal (format cetak fisik sebagai rencana cadangan pemadaman/kendala teknis serta format terstruktur untuk Google Form).
  3. Peringatan tegas terhadap integritas ujian ketika siswa berpindah aplikasi atau tab.
- **Tantangan & Batasan Utama**:
  Pengembangan fitur ini **wajib tanpa mengubah atau merusak fungsi Imtihan yang sudah tersusun** (Zero-Regression Guarantee). Seluruh skema basis data inti, relasi sesi ujian, sistem token, serta lembar jawaban santri harus tetap utuh dan kompatibel 100%.
- **Perilaku yang Diharapkan**:
  1. **Ekspor Naskah Soal & Kompatibilitas Cadangan (`/bank-soal/[id]`)**:
     - Pengajar dapat mencetak langsung (*print preview*) naskah soal dalam tata letak ujian kertas resmi madrasah (lengkap dengan kop, petunjuk, stimulus, dan kunci jawaban terpisah untuk pengawas).
     - Pengajar dapat menyalin format naskah terstruktur untuk Google Form (atau file skrip siap impor) sebagai mitigasi darurat jika jaringan pesantren mengalami kendala.
  2. **Generator Butir Soal AI Non-Destruktif (AI Assisted Drafting)**:
     - Disediakan tab/panel "Bantuan AI" di samping tab manual dan tempelan lembar kerja yang sudah ada.
     - Pengajar memasukkan topik pelajaran, target jenjang (SMP/SMA/MTA), perkiraan jumlah butir, dan pilihan tingkat kognitif (LOTS / HOTS / C1–C6).
     - Hasil keluaran AI dialirkan langsung ke komponen pratinjau yang sudah teruji (`QuestionImportPreview`). Pengajar dapat memeriksa, menyunting, memilah butir yang layak, lalu menyimpan melalui mutasi aman `importQuestions` yang sudah ada tanpa risiko modifikasi skema.
  3. **Penyempurnaan Umpan Balik Integritas Ujian (`ExamWorksheet`)**:
     - Saat santri melanggar fokus layar (berpindah tab / aplikasi), selain dialog peringatan visual yang sudah ada, sistem membunyikan peringatan audio lembut (*synthesized web audio chime/beep*) tanpa bergantung pada unduhan berkas audio eksternal yang rentan diblokir jaringan pesantren.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/lib/exam-export.ts`: Modul pembantu untuk menyusun tata letak naskah cetak ramah kertas (*print layout*) dan naskah teks terstruktur Google Form dari butir-butir soal yang ada.
  - `apps/components/bank-soal/question-export-dialog.tsx`: Komponen dialog ekspor di halaman detail bank soal.
  - `apps/components/bank-soal/ai-question-generator-panel.tsx`: Antarmuka formulir pembuatan draf soal berbasis AI yang menghasilkan teks terstandar sesuai parser `parseQuestionImport`.
  - `apps/lib/audio-alert.ts`: Utilitas nada peringatan audio lokal berbasis Web Audio API browser (aman dari blokir CORS/jaringan).
  - `apps/app/ujian/ExamWorksheet.tsx`: Integrasi nada peringatan audio saat dialog pelanggaran fokus layar muncul.
  - `apps/app/(main)/bank-soal/[id]/page.tsx`: Penambahan tombol dialog ekspor dan tab generator AI tanpa mengubah alur pembuatan manual atau tempelan spreadsheet yang sudah ada.
  - `apps/tests/exam-export.test.ts` & `apps/tests/audio-alert.test.ts`: Pengujian unit untuk memverifikasi logika transformasi ekspor dan ketahanan peringatan audio.
- **Out-of-Scope**:
  - Mengubah skema Convex (`apps/convex/schema.ts`).
  - Mengubah tabel pengerjaan santri (`examAnswers`, `examParticipants`).
  - Menggantikan alur impor teks/spreadsheet yang sudah berjalan stabil.

## 3. Bukti & Berkas Terkait
- Permintaan pengguna: "periksa link ini : apa yg bisa kita adopsi... kita terapkan ya. tanpa merubah atau merusak fungsi di imtihan yg sdh disusun"
- Berkas terkait:
  - `apps/app/(main)/bank-soal/[id]/page.tsx`
  - `apps/components/bank-soal/question-import-panel.tsx`
  - `apps/components/bank-soal/question-import-preview.tsx`
  - `apps/lib/question-import.ts`
  - `apps/app/ujian/ExamWorksheet.tsx`
  - `apps/convex/bank/public/mutations.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1: Modul Ekspor Naskah Cetak & Teks Terstruktur Google Form**
   - Buat `apps/lib/exam-export.ts` yang mentransformasikan butir soal paket menjadi:
     a. Teks format kuis Google Form (judul, opsi, kunci, dan pembahasan).
     b. Dokumen HTML siap cetak rapi (*print-ready layout*) dengan opsi sembunyikan/tampilkan kunci jawaban.
   - Buat pengujian unit `apps/tests/exam-export.test.ts`.
2. **Langkah 2: Dialog Ekspor di Detail Bank Soal**
   - Buat `apps/components/bank-soal/question-export-dialog.tsx`.
   - Tambahkan tombol "Ekspor / Cetak" di bilah atas `apps/app/(main)/bank-soal/[id]/page.tsx` di samping tombol yang sudah ada.
3. **Langkah 3: Utilitas Nada Peringatan Integritas**
   - Buat `apps/lib/audio-alert.ts` menggunakan API bawaan `window.AudioContext` (frekuensi peringatan 440Hz -> 880Hz pulsa 200ms).
   - Sambungkan pemanggilan audio saat `handleVisibilityChange` mendeteksi santri kembali ke tab ujian di `apps/app/ujian/ExamWorksheet.tsx`.
   - Buat pengujian ketahanan `apps/tests/audio-alert.test.ts`.
4. **Langkah 4: Panel Generator Draf Soal AI**
   - Buat `apps/components/bank-soal/ai-question-generator-panel.tsx` yang memungkinkan ustadz membuat prompt/kisi-kisi, atau menyusun draf secara terstruktur yang langsung diumpankan ke penafsir `parseQuestionImport`.
   - Integrasikan ke dalam tab aksi pembuatan soal pada `apps/app/(main)/bank-soal/[id]/page.tsx`.
5. **Langkah 5: Validasi & Uji Regresi Menyeluruh**
   - Jalankan `npm run typecheck`.
   - Jalankan seluruh rangkaian tes (`npm test`).
   - Jalankan audit kebocoran kode spesifikasi teknis (`npm --prefix apps run test:ui-leak`).

## 6. Kriteria Penerimaan yang Terukur
1. **Zero Regression**: Semua 377+ pengujian unit yang ada tetap lulus 100%.
2. **Ekspor Naskah Berfungsi Penuh**: Pengajar dapat mencetak naskah soal dan menyalin teks format Google Form dengan satu klik.
3. **Peringatan Integritas Santri Aktif**: Audio alert berbunyi saat dialog pelanggaran layar muncul pada browser yang mendukung Web Audio API tanpa menimbulkan galat pada browser yang membatasinya (*graceful fallback*).
4. **Alur Draf Soal AI Terisolasi & Aman**: Keluaran draf soal AI dapat ditinjau terlebih dahulu di tabel pratinjau sebelum disimpan ke basis data Convex.
5. **Kepatuhan UI & Etika**: Tidak ada kode teknis internal (`SCR-*`, `TASK-*`, dll.) atau emoji pada UI; identitas tetap murni E-Imtihan At-Tauhid.

## 7. Risiko, Kompatibilitas, & Keamanan
- **Risiko Audio Autoplay**: Beberapa browser membatasi Web Audio API jika belum ada interaksi pengguna (*user gesture*). Mitigasi: audio hanya dipicu setelah santri berinteraksi di ruang ujian, dan fungsi dibungkus dalam blok `try/catch` tanpa melempar *unhandled exception*.
- **Risiko Kerapuhan Skema**: Tidak ada mutasi baru ke schema basis data. Seluruh butir soal yang dihasilkan tetap disimpan melalui mutasi `importQuestions` yang sudah terverifikasi.

## 8. Perintah Validasi Repositori
- `npm run typecheck`
- `npm test`
- `npm --prefix apps run test:ui-leak`

## 9. Penilaian E2E
- **Rekomendasi**: `Recommended`
- **Alasan**: Fitur menambahkan interaksi dialog ekspor baru di detail bank soal dan umpan balik modal pelanggaran di ruang ujian santri.
