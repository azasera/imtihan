# E2E Specification: Filter Interaktif Melalui Kartu Ringkasan Santri

## Target and Source Requirement
- Target: Halaman Manajemen Santri (`/santri`)
- Source: Permintaan pengguna untuk filter interaktif kartu statistik santri (`specs/feat-santri-interactive-filter-cards.md`)
- Recommendation: Recommended (Interaksi UI browser-visible pada tabel santri)
- Status: Pending

## Environment & Prerequisites
- Deployment: Local development (`http://localhost:3000/santri`)
- Role: Pengajar / Administrator CBT
- Data Awal: Data santri SiPAKSa telah disinkronkan ke dalam sistem (memiliki data santri untuk SMPITA, SMAITA, dan MTA)

## Ordered Browser Scenarios

### Skenario 1: Filter Melalui Kartu SMPITA
1. Buka halaman `/santri`.
2. Verifikasi 4 kartu ringkasan ditampilkan di bagian atas (*Total Santri Aktif*, *SMPITA*, *SMAITA*, *MTA (Tahfidz)*).
3. Klik pada kartu **SMPITA**.
4. **Hasil yang Diharapkan**:
   - Kartu SMPITA mendapatkan indikator visual aktif (border/ring aksen emerald, badge aktif).
   - Tab "SMPITA" di toolbar bawah terpilih secara otomatis.
   - Tabel santri hanya menampilkan santri dari jenjang SMPITA (semua baris berbadge "SMPITA").
   - Keterangan di footer tabel menampilkan jumlah santri yang sesuai dengan jenjang SMPITA.

### Skenario 2: Filter Melalui Kartu SMAITA
1. Pada halaman yang sama, klik pada kartu **SMAITA**.
2. **Hasil yang Diharapkan**:
   - Kartu SMAITA mendapatkan indikator visual aktif (border/ring aksen biru, badge aktif).
   - Tab "SMAITA" di toolbar bawah terpilih secara otomatis.
   - Tabel santri hanya menampilkan santri dari jenjang SMAITA (semua baris berbadge "SMAITA").

### Skenario 3: Filter Melalui Kartu MTA (Tahfidz)
1. Pada halaman yang sama, klik pada kartu **MTA (Tahfidz)**.
2. **Hasil yang Diharapkan**:
   - Kartu MTA mendapatkan indikator visual aktif (border/ring aksen ungu, badge aktif).
   - Tab "MTA" di toolbar bawah terpilih secara otomatis.
   - Tabel santri hanya menampilkan santri dari jenjang MTA (semua baris berbadge "MTA").

### Skenario 4: Reset Filter ke Semua Santri
1. Klik pada kartu **Total Santri Aktif** ATAU klik ulang kartu yang sedang aktif (fitur toggle).
2. **Hasil yang Diharapkan**:
   - Filter kembali ke "Semua Lembaga" (`ALL`).
   - Kartu Total Santri Aktif ditandai sebagai aktif.
   - Tab "Semua Lembaga" terpilih.
   - Tabel santri menampilkan seluruh santri dari semua jenjang.

### Skenario 5: Aksesibilitas Keyboard
1. Gunakan tombol `Tab` pada keyboard untuk berpindah fokus ke kartu statistik.
2. Saat fokus berada di kartu SMPITA, tekan tombol `Enter` atau `Space`.
3. **Hasil yang Diharapkan**:
   - Filter beralih ke jenjang SMPITA.
   - Focus ring terlihat jelas tanpa terpotong.

## Evidence
*(Belum dijalankan — disiapkan untuk handoff `/e2e-tester`)*
