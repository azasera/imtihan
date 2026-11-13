# Spesifikasi Penyempurnaan UX & Keamanan Gerbang Ujian Santri (/ujian)

## 1. Definisi Masalah & Perilaku yang Diharapkan
Berdasarkan hasil analisis terhadap tangkapan layar form masuk santri (`/ujian`) dan evaluasi umpan balik penguji, ditemukan sejumlah kelemahan UX, kejelasan, serta potensi risiko operasional di hari H ujian:

1. **Placeholder Token Menyerupai Nilai yang Sudah Terisi:**
   - *Masalah:* Placeholder `"MASUKKAN TOKEN (MISAL: 8K2M3P)"` ditulis dengan huruf kapital tebal (`font-bold`, font monospace) sehingga santri mengira kolom tersebut sudah otomatis terisi dan bingung ketika tombol tidak aktif.
   - *Perilaku Baru:* Placeholder menggunakan teks yang lebih redup dan tidak tebal (`placeholder:text-muted-foreground/40 font-normal tracking-normal placeholder:tracking-normal`), dengan contoh placeholder yang bersih seperti `"Misal: 7K2M3P"`. Keterangan instruksi diletakkan pada helper text di bawah kolom: *"Minta 6 digit token kepada pengawas ujian di ruangan Anda"*.

2. **Karakter Ambigu pada Generator Token:**
   - *Masalah:* Meskipun `0, 1, O, I` sudah dibuang, `TOKEN_CHARACTERS` di backend masih menyertakan huruf `L`, serta angka `8` dan huruf `B`. Di proyektor kelas atau layar beresolusi rendah, santri kerap keliru membedakan `L` dengan `1`/`I`, serta `8` dengan `B`, memicu kegagalan input token palsu.
   - *Perilaku Baru:* Menghilangkan karakter ambigu `L`, `8`, dan `B` dari daftar `TOKEN_CHARACTERS` pada `apps/convex/examSession/private/helpers.ts`. Menggunakan set karakter bersih: `"2345679ACDEFGHJKMNPQRSTUVWXYZ"`. Input token di klien juga secara otomatis mengubah huruf kecil menjadi kapital dan membuang spasi/karakter non-alfanumerik.

3. **Tombol "Konfirmasi & Masuk" Pucat & Tanpa Indikasi Alasan Nonaktif:**
   - *Masalah:* Tombol disabled memiliki kontras rendah dan tidak memberikan informasi mengapa tombol belum bisa diklik, memicu kebingungan dan klik berulang (*rage-click*).
   - *Perilaku Baru:* Tombol memiliki status visual yang tegas. Tepat di atas/bawah tombol disediakan pesan status interaktif yang menerangkan kondisi form (misal: *"Lengkapi: Masukkan Nomor Induk Santri"* atau *"Lengkapi: Token harus 6 karakter"*). Saat semua data valid dan terverifikasi, tombol berubah menjadi hijau tegas dengan ikon siap masuk.

4. **Ornamen & Teks Dekoratif yang Membebani Tampilan:**
   - *Masalah:* Lencana `"Pintu Ujian"` di pojok kartu adalah artefak internal yang tidak memiliki fungsi interaktif. Lencana instansi dan logo bertumpuk di header.
   - *Perilaku Baru:* Menghapus badge `"Pintu Ujian"`. Mengintegrasikan identitas pesantren secara ringkas dan harmonis di header kartu.

5. **Paragraf Pembuka Terlalu Panjang:**
   - *Masalah:* Dua kalimat deskripsi panjang di header dan kartu tidak dibaca santri yang sedang tegang menghadapi ujian.
   - *Perilaku Baru:* Diringkas menjadi 1 kalimat instruksi direktif: *"Masukkan Nomor Induk Santri dan Token Ujian dari pengawas untuk memulai."*

6. **Redundansi Dropdown Lembaga & Kelas (Alur Masuk 2 Kolom Utama):**
   - *Masalah:* Form meminta 5 isian berurutan (NISN, Lembaga, Kelas, Nama, Token), padahal nomor induk santri sudah unik dan terhubung ke data lembaga dan kelas di database.
   - *Perilaku Baru:*
     - Alur Utama: Santri hanya mengisi **2 input utama**: **Nomor Induk Santri (NISN/NIS/ID)** dan **Token Ujian (6 Karakter)**.
     - Begitu nomor induk diketik dan ditemukan via `lookupStudent`, sistem langsung menampilkan **Kartu Identitas Terverifikasi** ringkas (Nama Lengkap, Lembaga, Kelas) secara otomatis.
     - Mode Fallback Cadangan: Jika database santri lokal belum tersinkronisasi, disediakan accordion / pemicu *"Data santri belum tersinkronisasi? Isi lembaga & kelas manual"* agar ujian darurat tetap dapat berjalan tanpa memblokir santri.

7. **Tampilan Pesan Error Spesifik & Persisten:**
   - *Masalah:* Error hanya mengandalkan Toast kilat (Sonner) yang sering terlewatkan jika santri panik atau layar tertutup keyboard virtual.
   - *Perilaku Baru:* Sediakan **Persistent Error Alert Banner** statis di dalam kartu ujian dengan teks masalah spesifik dan aksi pemecahan:
     - Token salah / kadaluarsa: *"Token tidak ditemukan atau telah berganti. Minta token terbaru kepada pengawas."*
     - Sesi belum aktif: *"Sesi ujian ini belum dibuka oleh pengawas. Mohon menunggu instruksi."*
     - Sesi berakhir: *"Sesi ujian ini telah berakhir dan ditutup."*
     - Sudah mengumpulkan: *"Anda telah menyelesaikan dan mengumpulkan ujian ini sebelumnya."*
     - NISN tidak terdaftar: *"Nomor Induk tidak terdaftar dalam basis data santri. Periksa kembali atau laporkan ke pengawas."*

---

## 2. Ruang Lingkup
- **In Scope:**
  - `apps/convex/examSession/private/helpers.ts`: Memperbarui `TOKEN_CHARACTERS` untuk mengeliminasi karakter ambigu (`L`, `8`, `B`).
  - `apps/app/ujian/page.tsx`: Refactoring antarmuka gerbang masuk santri:
    - 2 kolom input utama (Nomor Induk & Token).
    - Kartu identitas santri terverifikasi otomatis.
    - Fallback manual collapsible (jika NISN belum tersinkronisasi).
    - Placeholder token lembut, helper text, dan input sanitization.
    - Status tombol konfirmasi dengan penjelas alasan disabled.
    - Persistent error banner di dalam formulir.
    - Penghapusan badge dekorasi `"Pintu Ujian"` dan penyederhanaan teks pembuka.
  - `apps/tests/student-login-ux.test.ts`: Uji unit otomatis untuk validasi set karakter token, bebas kebocoran kode spesifikasi teknis, dan verifikasi struktur UI gerbang santri.
- **Out of Scope:**
  - Perubahan skema tabel Convex (`schema.ts`).
  - Perubahan logika evaluasi lembar pengerjaan soal (`ExamWorksheet.tsx`).

---

## 3. Bukti & Dasar Masalah
- Tangkapan layar `media_1794042866101_c0cc1f51.png` menunjukkan:
  - Input token dengan placeholder tebal `MASUKKAN TOKEN (MISAL: 8K2M3P)` menyerupai input terisi.
  - Badge kuning `"Pintu Ujian"`.
  - Tombol submit pudar tanpa keterangan field mana yang belum lengkap.
  - Form berjenjang 5 nomor isian yang membebani santri.

---

## 4. Berkas yang Terkait
- `apps/convex/examSession/private/helpers.ts`
- `apps/app/ujian/page.tsx`
- `apps/tests/student-login-ux.test.ts`

---

## 5. Persyaratan Implementasi Berurutan
1. **Pembaruan Generator Token di Backend:**
   - Edit `apps/convex/examSession/private/helpers.ts` untuk memastikan `TOKEN_CHARACTERS` hanya berisi karakter alfanumerik non-ambigu (tanpa 0, 1, 8, O, I, L, B).
2. **Refactoring Antarmuka Gerbang Santri (`/ujian`):**
   - Perbarui header kartu: hapus badge "Pintu Ujian", persingkat teks instruksi menjadi 1 kalimat.
   - Restrukturisasi form: jadikan Nomor Induk dan Token sebagai 2 input utama yang paling mencolok.
   - Tampilkan kartu ringkasan identitas santri otomatis saat NISN terdeteksi.
   - Sediakan accordion fallback jika santri tidak ditemukan di master data.
   - Ganti styling input token: placeholder `Misal: 7K2M3P` dengan `font-normal` dan helper text informatif.
   - Buat Alert Banner statis untuk pesan error sesi / token / nomor induk.
   - Tambahkan status helper pada tombol "Konfirmasi & Masuk" yang menyebutkan alasan jika masih disabled.
3. **Pembuatan Pengujian Unit (`apps/tests/student-login-ux.test.ts`):**
   - Verifikasi karakter `TOKEN_CHARACTERS` tidak mengandung `0, 1, 8, O, I, L, B`.
   - Verifikasi tidak ada kebocoran kode spesifikasi teknis (`SCR-*`, `TASK-*`, dll.).
   - Verifikasi keberadaan komponen 2-input utama, kartu santri otomatis, dan alert error statis.
4. **Verifikasi Repository:**
   - Jalankan `npm test` untuk memastikan semua pengujian lulus tanpa regresi.

---

## 6. Kriteria Keberhasilan Terukur
- [ ] `TOKEN_CHARACTERS` tidak memuat karakter ambigu: `assert.equal(/[018OILB]/.test(TOKEN_CHARACTERS), false)`.
- [ ] Placeholder token tidak berhuruf tebal (`font-bold`) dan tidak membingungkan santri.
- [ ] Santri terdaftar hanya perlu mengisi Nomor Induk dan Token (nama, lembaga, dan kelas terisi otomatis).
- [ ] Tombol nonaktif menampilkan keterangan jelas mengenai field yang masih harus dilengkapi.
- [ ] Seluruh pesan error kegagalan masuk (token salah, sesi belum aktif, nomor induk tak terdaftar) tampil dalam banner alert persisten di form.
- [ ] Halaman bebas dari kebocoran kode spesifikasi teknis (`SCR-*`, `*-FR-*`, `*-AC-*`, dsb.).
- [ ] `npm test` lulus 100%.

---

## 7. Pertimbangan Risiko & Kompatibilitas
- **Kompatibilitas Token Lama:** Sesi ujian lama yang sudah berjalan dengan token yang mengandung karakter lama tetap dapat dicari dengan `withIndex("by_token")` karena fungsi pencarian menerima string apa pun. Hanya token baru yang di-generate dengan set karakter bersih.
- **Kesiapan Master Data:** Jika data santri belum sempat diimpor oleh admin, accordion manual fallback tetap mengizinkan santri memilih Lembaga dan Kelas secara manual sehingga tidak menghambat ujian darurat.

---

## 8. Perintah Validasi Repository
```bash
npm test
```
