# Spesifikasi Fitur: Editor Narasi Capaian Kompetensi Hybrid (Multi-baris di Tabel + Dialog Editor Lega)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Latar Belakang / Masalah**:
  Kolom "Narasi Capaian Kompetensi" pada lembar nilai rapor (`apps/app/(main)/rapor/page.tsx`) sebelumnya menggunakan komponen `<Input className="h-7 text-xs" />`. Kotak teks satu baris setinggi 28px ini sangat sempit, menyebabkan narasi capaian pembelajaran yang panjang (1–3 kalimat) terpotong secara horizontal (`...`). Guru kesulitan membaca, menyunting, dan memastikan kelengkapan kalimat narasi santri.
- **Perilaku yang Diharapkan (Opsi 3: Pendekatan Hybrid)**:
  1. **Tampilan Tabel Multi-baris yang Rapi**:
     - Mengganti input satu baris dengan `Textarea` kompak multi-baris (`min-h-[46px]`, `text-xs`, `leading-relaxed`) sehingga kalimat narasi langsung terbaca utuh tanpa terpotong.
     - Menyediakan tombol ikon "Perbesar Editor" (`Maximize2Icon`) di samping textarea pada setiap baris santri.
  2. **Dialog / Modal Editor Lega**:
     - Membuka modal "Sunting Narasi Capaian Kompetensi" saat tombol perbesar diklik.
     - Menampilkan identitas santri yang sedang diedit: Nama Santri, NISN, Kelas, Nilai Akhir, dan Predikat (A/B/C/D).
     - Menyediakan area ketik `Textarea` luas (5 baris, `min-h-[140px]`) yang sangat lega dan nyaman untuk mengetik atau memperbaiki narasi.
     - Menyediakan opsi **Template Cepat** berdasarkan predikat:
       - Predikat A: "Sangat baik dalam..."
       - Predikat B: "Baik dalam..."
       - Predikat C: "Cukup dalam..."
       - Predikat D: "Perlu bimbingan dalam..."
     - Menyediakan tombol **"Salin ke Santri Berpredikat Sama"** agar guru tidak perlu mengulang ketikan yang sama untuk seluruh santri dengan capaian setara.
     - Menyediakan tombol navigasi **"Santri Sebelumnya"** dan **"Santri Selanjutnya"** di dalam modal agar guru dapat menyunting narasi seluruh santri secara berurutan tanpa bolak-balik menutup dialog.
  3. **Nihil Emoji & Bebas Kebocoran Kode Spesifikasi Teknis**:
     - Seluruh UI menggunakan ikon Lucide dan bebas dari emoji serta kode spesifikasi teknis.

---

## 2. Ruang Lingkup (Scope)
- **In-Scope**:
  - `apps/app/(main)/rapor/page.tsx`:
    - Mengintegrasikan `Textarea` multi-baris pada kolom tabel nilai santri.
    - Menambahkan state modal `editingNarrativeSantriId` dan teks narasi aktif.
    - Menambahkan komponen `Dialog` khusus editor narasi santri dengan tombol navigasi, template cepat, dan salin per predikat.
  - `apps/tests/rapor-components.test.ts`:
    - Menambahkan pengujian untuk memastikan textarea multi-baris dan dialog editor narasi terpasang dengan benar, bebas emoji, dan bebas kebocoran teknis.
  - `specs/e2e/feat-editor-narasi-capaian-kompetensi-hybrid.md`:
    - Membuat berkas spesifikasi E2E (Recommended).
- **Out-of-Scope**:
  - Mengubah logika rumus NAR atau skema database Convex.

---

## 3. Berkas Terkait
- `apps/app/(main)/rapor/page.tsx`
- `apps/components/ui/textarea.tsx`
- `apps/tests/rapor-components.test.ts`
- `specs/e2e/feat-editor-narasi-capaian-kompetensi-hybrid.md`
- `specs/feat-editor-narasi-capaian-kompetensi-hybrid.md`

---

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `apps/app/(main)/rapor/page.tsx` untuk mengimpor `Textarea`, `Maximize2Icon`, `ChevronLeftIcon`, `ChevronRightIcon`, `CopyCheckIcon`.
2. **Langkah 2**: Tambahkan state untuk editor modal narasi (`narrativeModalSantriId`, teks sementara jika diperlukan, penanganan navigasi next/prev, dan fungsi salin ke predikat sama).
3. **Langkah 3**: Ganti kolom input narasi di tabel menjadi kombinasi `Textarea` kompak + tombol perbesar modal.
4. **Langkah 4**: Tambahkan komponen modal `Dialog` "Sunting Narasi Capaian Kompetensi" dengan textarea luas, template kalimat cepat, tombol salin ke predikat sama, dan navigasi santri.
5. **Langkah 5**: Tambahkan pengujian di `apps/tests/rapor-components.test.ts` dan jalankan validasi `node --test apps/tests/rapor-components.test.ts`.
6. **Langkah 6**: Buat spesifikasi E2E di `specs/e2e/feat-editor-narasi-capaian-kompetensi-hybrid.md`.
7. **Langkah 7**: Jalankan verifikasi linting, typecheck, dan tes kebocoran teknis.

---

## 5. Kriteria Penerimaan yang Terukur
1. Kolom "Narasi Capaian Kompetensi" di tabel menampilkan textarea multi-baris yang nyaman dibaca dan diedit langsung.
2. Setiap baris memiliki tombol perbesar (`Maximize2Icon`) yang jika diklik membuka dialog modal editor narasi santri tersebut.
3. Modal editor menampilkan nama santri, NISN, nilai akhir, predikat, dan textarea besar.
4. Terdapat tombol navigasi "Sebelumnya" dan "Selanjutnya" di dalam modal untuk berpindah antar santri di kelas tersebut.
5. Terdapat tombol template cepat sesuai predikat dan tombol salin ke santri dengan predikat sama.
6. Perubahan narasi tersimpan ke state `editableGrades` / `gradeOverrides` dan tersimpan permanen saat guru menekan "Simpan Perubahan".
7. Seluruh teks antarmuka bebas emoji dan bebas kebocoran kode spesifikasi teknis.

---

## 6. Perintah Validasi
- `node --test apps/tests/rapor-components.test.ts`
- `npm --prefix apps run typecheck`
- `npm --prefix apps run test:ui-leak`
