# Spesifikasi Perbaikan UI: Tanda Visual Interaktif (Affordance) Menu & Tombol Buku Nilai Harian

## 1. Definisi Masalah & Perilaku yang Diharapkan
### Masalah Saat Ini
Sesuai tangkapan layar pengguna:
- Pada tabel lembar nilai rapor (`apps/app/(main)/rapor/page.tsx`), kolom `PH / Tugas` hanya memiliki teks biasa berdampingan dengan ikon buku kecil tanpa styling tombol yang jelas.
- Guru mengira kolom tersebut hanyalah label statis teks biasa dan tidak menyadari bahwa ikon atau judul tersebut dapat diklik untuk membuka modal buku nilai harian.
- Badge `PH` di samping input angka santri juga tampak seperti label statis kecil tanpa indikasi bahwa badge tersebut merupakan elemen interaktif (tidak ada border tombol yang jelas, tanda panah, atau ikon aksi).

### Perilaku yang Diharapkan
1. **Header Kolom `PH / Tugas` yang Jelas Berbentuk Tombol / Menu Interaktif:**
   - Mengubah tampilan header kolom menjadi tombol/chip interaktif dengan latar warna kontras lembut (`bg-emerald-50 dark:bg-emerald-950/60`), border halus (`border-emerald-300`), ikon buku (`BookOpenIcon`), teks jelas, dan indikator panah/modal (`SlidersHorizontalIcon` atau `ExternalLinkIcon`).
   - Menyertakan subteks instruksi kecil di bawah tombol header: `"Klik untuk rincian"` atau `"Buku Nilai PH"` agar guru 100% paham kolom ini membuka rincian nilai.
   - Memberikan efek hover yang responsif (`hover:bg-emerald-100 hover:scale-[1.02] cursor-pointer shadow-xs`).
2. **Badge Rincian Nilai per Santri (`PH` Chip) yang Interaktif:**
   - Mengubah badge `PH` menjadi tombol chip yang berkarakter interaktif (border, warna kontras, ikon kecil, dan tooltip jelas) sehingga terlihat dapat diklik untuk memeriksa atau mengisi rincian nilai santri tersebut.
3. **Bebas Emoji dan Kode Spesifikasi Teknis:**
   - Seluruh elemen grafis murni menggunakan ikon Lucide, tanpa emoji.

---

## 2. Ruang Lingkup (Scope)
- **In Scope:**
  - Penambahan visual affordance pada header kolom `PH / Tugas` di `apps/app/(main)/rapor/page.tsx`.
  - Peningkatan styling badge rincian PH pada baris tiap santri di `apps/app/(main)/rapor/page.tsx`.
  - Penambahan tooltip yang jelas dan informatif.
  - Pengujian unit untuk memastikan tidak ada regresi atau kebocoran kode.
- **Out of Scope:**
  - Perubahan logika kalkulasi dan backend.

---

## 3. Berkas Terkait
- `apps/app/(main)/rapor/page.tsx`: Komponen utama lembar penilaian rapor guru.
- `apps/tests/rapor-daily-assessments.test.ts`: Pengujian unit fitur rapor dan buku nilai harian.

---

## 4. Kriteria Penerimaan
1. Header kolom `PH / Tugas` memiliki visual tombol yang jelas (latar berwarna, border, ikon, kursor pointer, dan hover state).
2. Terdapat petunjuk visual `"Klik untuk rincian"` pada header kolom `PH / Tugas`.
3. Badge `PH` pada baris santri yang memiliki rincian nilai memiliki visual chip tombol yang dapat diklik.
4. Bebas dari emoji dan kebocoran kode teknis.
5. Seluruh test lolos tanpa kesalahan.
