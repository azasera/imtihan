# Spesifikasi Fitur: Penentuan Bobot & Komposisi Soal Cerdas (Smart Auto-Balance)

## 1. Masalah & Tujuan
### Masalah:
Saat pengajar membuat sesi ujian dengan fitur komposisi & pembobotan soal (sampling acak), input bobot soal Objektif (PG/Benar-Salah) dan Esai saat ini beroperasi secara terpisah tanpa sinkronisasi reaktif:
1. Ketika pengajar menolkan jumlah butir esai (0 butir) atau bobot esai (0%), bobot soal objektif tidak otomatis naik menjadi 100%. Total bobot menjadi 70% dan muncul badge merah penolakan `70% (Harus 100%)`.
2. Pengajar harus mengedit kedua kolom bobot secara manual untuk mencapai total 100%.
3. Ketika bank soal yang dipilih tidak memiliki soal esai sama sekali (`availableEssay === 0`), formulir tetap menawarkan komposisi esai default (5 butir, 30%), memaksa pengajar melakukan penyesuaian manual.

### Tujuan & Solusi:
Meningkatkan kepraktisan dan kecerdasan formulir komposisi soal dengan:
1. **Auto-Complement Reactive Weights**: Mengubah bobot satu model soal otomatis menyesuaikan model pasangannya menjadi `100 - X`.
2. **Auto-Zero Rule**: Jika jumlah butir salah satu model diubah ke `0`, bobotnya otomatis `0%` dan pasangannya otomatis `100%`.
3. **Smart Bank Detection**: Jika bank soal hanya berisi soal Objektif (Esai = 0 di bank), komposisi otomatis terkunci ke `100% Objektif` tanpa esai.
4. **Quick Presets**: Tombol preset 1-klik (`Hanya Objektif 100%`, `Standar 70:30`, `Seimbang 50:50`, `Hanya Esai 100%`).
5. **Auto-Normalize Button**: Tombol interaktif "Genapkan ke 100%" pada badge status bobot untuk mengoreksi selisih bobot secara instan.

---

## 2. Ruang Lingkup
### Di dalam Lingkup (In Scope):
- Utilitas murni `rebalanceWeights` dan preset helper di `apps/lib/exam-sampling.ts`.
- Antarmuka form sesi ujian di `apps/app/(main)/sesi-ujian/page.tsx`:
  - Penanganan reaktif saat input jumlah butir berubah (jika 0 -> bobot 0, pasangan 100).
  - Penanganan reaktif saat input bobot berubah (auto-complement ke 100%).
  - Tombol preset proporsi 1-klik.
  - Tombol "Genapkan ke 100%" pada badge status total bobot.
  - Disable input esai dan set default 100% objektif bila bank soal tidak memuat esai.
- Pengujian unit di `apps/tests/exam-sampling.test.ts`.

### Di luar Lingkup (Out of Scope):
- Perubahan skema basis data Convex (skema `questionComposition` tetap sama).
- Perubahan alur ujian siswa dan perhitungan penilaian akhir (sudah tuntas dan teruji).

---

## 3. Berkas yang Terlibat
1. `apps/lib/exam-sampling.ts`: Logika rebalance murni dan preset komposisi.
2. `apps/app/(main)/sesi-ujian/page.tsx`: Reaktivitas formulir sesi ujian modal.
3. `apps/tests/exam-sampling.test.ts`: Uji unit untuk `rebalanceWeights` dan skenario interaksi.
4. `specs/e2e/smart-weight-auto-balance.md`: Spesifikasi pengujian E2E perjalanan pengguna.

---

## 4. Kriteria Keberterimaan (Acceptance Criteria)
1. **Auto-Zero Esai**: Ketika `essayCount` diset ke `0`, `essayWeight` otomatis berubah menjadi `0` dan `pgWeight` otomatis berubah menjadi `100`.
2. **Auto-Zero Objektif**: Ketika `pgCount` diset ke `0`, `pgWeight` otomatis menjadi `0` dan `essayWeight` otomatis menjadi `100`.
3. **Auto-Complement**: Ketika `pgWeight` diubah ke `X` (misal 80), `essayWeight` otomatis terisi `100 - X` (20), selama kedua model memiliki jumlah butir > 0.
4. **Tombol Preset 1-Klik**: Menekan tombol preset (misal "Hanya Objektif 100%") langsung mengisi nilai jumlah butir dan bobot yang sesuai.
5. **Tombol "Genapkan ke 100%"**: Jika total bobot belum 100%, tombol aksi cepat langsung melengkapi selisihnya ke model soal yang aktif.
6. **Zero Leaks & No Emojis**: Teks antarmuka bebas kode spesifikasi dan tanpa emoji (menggunakan Lucide icons).
7. **Pengujian**: Semua uji unit di `apps/tests/exam-sampling.test.ts` dan seluruh test suite lulus 100%.
