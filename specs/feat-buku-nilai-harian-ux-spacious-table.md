# Spesifikasi Perbaikan UI/UX: Pelebaran Modal dan Ergonomi Tabel Buku Nilai Harian Santri

## 1. Definisi Masalah & Perilaku yang Diharapkan
### Masalah Saat Ini
Sesuai tangkapan layar pengguna:
1. Modal `DailyAssessmentsModal` terpasung pada lebar sempit (`sm:max-w-sm` default bawaan `DialogContent` menimpa `max-w-6xl` pada breakpoint layar `>= 640px`), sehingga dialog tampil hanya selebar ~384px.
2. Akibat ruang yang sangat sempit:
   - Nama santri terpotong secara parah (misal hanya terlihat "fiq Al Baraja").
   - Kolom nilai PH dan Tugas saling berdesakan dengan *double scrollbar* (vertikal dan horizontal berjarak sangat dekat).
   - Teks penjelasan rumus di bagian bawah patah menjadi banyak baris sempit.
   - Kolom identitas santri (No, NISN, Nama) tidak *sticky*, sehingga saat menggeser tabel ke kanan untuk mengisi PH 3, PH 4, atau Tugas, nama santri menghilang dari pandangan guru.
   - Label kolom singkat "N" dan "R" serta tombol *spinbox* bawaan browser pada input numerik membuat tampilan tampak berantakan dan rawan salah input.

### Perilaku yang Diharapkan
1. **Modal Luas & Responsif (Spacious Studio Dialog):**
   - Menggunakan kelas responsif yang tegas seperti `sm:max-w-[96vw] md:max-w-[95vw] lg:max-w-[92vw] xl:max-w-[1360px] w-full max-h-[92vh] h-[90vh]` untuk menimpa `sm:max-w-sm` dari primitif dialog.
   - Memberikan ruang kerja seluas spreadsheet profesional di desktop/laptop, dan tetap adaptif di tablet/ponsel.
2. **Kolom Identitas Santri Tetap Terlihat (Sticky Headers & Columns):**
   - Kolom No dan Nama Santri diposisikan `sticky left-0` (dengan background solid dan pemisah border/bayangan halus), sehingga ketika guru menggulir kolom nilai ke PH 3, PH 4, atau Tugas, nama santri tetap selalu terlihat di sisi kiri.
3. **Penyajian Header Kolom yang Jelas & Bersih (Tidak Membingungkan):**
   - Pengelompokan warna yang tegas namun teduh:
     - Kelompok Penilaian Harian (PH 1 - 4): Header biru bernuansa lembut dengan sub-header jelas: "Murni" dan "Remedial (R)".
     - Kelompok Tugas (T-1 s/d T-4): Header ungu lembut dengan label "Tugas 1", "Tugas 2", dst.
     - Kelompok Rata-rata & Nilai Akhir: Header hijau/emerald dengan visual pembeda yang menonjol.
   - Keterangan ringkas (Legend) yang rapi di bagian atas: "Murni", "Remedial (R - maks KKM)", "Tugas", dan "Nilai Harian Otomatis".
4. **Ergonomi Input Nilai (Clean Number Inputs):**
   - Menghilangkan *spin buttons* (tanda panah atas-bawah default browser) menggunakan utility class agar kotak input rapi dan angka terlihat jelas di tengah.
   - Kotak input memiliki padding dan ukuran yang nyaman diklik/sentuh (`h-8 w-14 sm:w-16 text-center font-semibold`).
   - Dukungan navigasi keyboard: saat menekan Enter atau Tab, fokus berpindah secara natural ke sel berikutnya.
5. **Footer yang Bersih & Lega:**
   - Teks kalkulasi bobot (60% PH + 40% Tugas) tersusun horizontal dengan ikon penjelas tanpa terhimpit tombol aksi.
   - Tombol "Batal" dan "Terapkan ke Lembar Nilai" proporsional dan mudah dijangkau.

---

## 2. Ruang Lingkup (Scope)
### In Scope
- Refaktor styling dan struktur layout pada `apps/components/rapor/DailyAssessmentsModal.tsx`.
- Penerapan sticky freeze panes untuk kolom identitas santri (No, Nama Santri).
- Penghapusan spin buttons pada input skor numerik.
- Penataan ulang bar filter fokus kolom dan badge status/keterangan.
- Pengujian unit dan validasi bebas dari kebocoran kode spesifikasi teknis dan emoji.

### Out of Scope
- Perubahan skema basis data Convex (tetap menggunakan struktur yang sudah ada).
- Perubahan rumus kalkulasi di `apps/lib/rapor-utils.ts` (sudah teruji dan berfungsi baik).

---

## 3. Berkas Terkait (Relevant Files)
1. `apps/components/rapor/DailyAssessmentsModal.tsx`: Komponen modal dialog utama untuk pengisian buku nilai harian santri.
2. `apps/components/ui/dialog.tsx`: Komponen primitif dialog (untuk memahami selector `sm:max-w-sm` yang perlu dioverride).
3. `apps/tests/rapor-daily-assessments.test.ts`: Pengujian unit untuk komponen modal dan kalkulasi.

---

## 4. Persyaratan Implementasi Berurutan
1. **Perbaikan Dialog Sizing:**
   Ganti kelas `max-w-6xl` dengan `sm:max-w-[96vw] md:max-w-[94vw] lg:max-w-[92vw] xl:max-w-[1360px] w-[96vw]` dan pastikan tinggi fleksibel `h-[90vh] max-h-[92vh] flex flex-col`.
2. **Implementasi Sticky Panes:**
   - Header `thead` dibuat `sticky top-0 z-30`.
   - Kolom `No` dibuat `sticky left-0 z-20 bg-background`.
   - Kolom `Nama Santri` dibuat `sticky left-10 z-20 bg-background shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]`.
   - Sudut perpotongan header (`No`, `NISN`, `Nama`) diberi `z-40` agar tidak tertumpuk saat *scroll* vertikal maupun horizontal.
3. **Penyempurnaan Input & Typography:**
   - Tambahkan CSS utility `[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none` pada input numerik.
   - Lebarkan kolom nama santri (`min-w-[200px] max-w-[260px] truncate`) dengan NISN ditampilkan sebagai subteks halus di bawah nama santri agar menghemat lebar horizontal namun tetap informatif.
4. **Penyempurnaan Sub-Header & Keterangan:**
   - Header PH: "PH 1", "PH 2", "PH 3", "PH 4" dengan sub-kolom "Murni" dan "Remedial".
   - Header Tugas: "Tugas 1", "Tugas 2", "Tugas 3", "Tugas 4".
   - Indikator KKM ditampilkan di header info.

---

## 5. Kriteria Penerimaan Terukur (Acceptance Criteria)
1. Modal terbuka dengan lebar penuh/lapang pada layar desktop/tablet (tidak lagi sempit 384px).
2. Nama santri terlihat utuh dan tidak terpotong.
3. Kolom nama santri tetap diam di tempat (*sticky left*) saat tabel digeser ke kanan untuk mengisi nilai PH lanjutan atau Tugas.
4. Tidak ada panah *spin button* browser yang menutupi angka di dalam input nilai.
5. Header PH dan Tugas memiliki label yang jelas, tidak ada singkatan membingungkan tanpa keterangan.
6. Bebas dari emoji di antarmuka pengguna.
7. Bebas dari kebocoran kode spesifikasi teknis.
8. Seluruh 526 unit tests yang ada tetap lulus 100%.

---

## 6. Perintah Validasi
- `npm --prefix apps run test`: Memverifikasi seluruh pengujian lolos tanpa regresi.
- `npm --prefix apps run typecheck`: Memverifikasi kepatuhan TypeScript.
