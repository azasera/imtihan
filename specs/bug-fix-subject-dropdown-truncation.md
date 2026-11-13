# Spesifikasi: Perbaikan Pemotongan Teks pada Dropdown Mata Pelajaran

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada formulir pembuatan bank soal baru (`apps/app/(main)/bank-soal/baru/page.tsx`), dropdown **Mata Pelajaran \*** mengalami pemotongan teks secara horizontal (*text overflow & truncation*):
  1. Menu popup `SelectContent` terkunci pada lebar trigger (`w-(--anchor-width)`). Karena trigger berada di kolom grid sempit (~260px–300px), popup tidak memiliki ruang yang cukup.
  2. Nama mata pelajaran madrasah yang panjang (seperti *"Tahfidz & Tahsin Al-Qur'an"*, *"Tarikh Islam & Siroh Nabawiyah"*, *"Adab dan Akhlaq Penuntut Ilmu"*) beserta kode singkatnya `(FIQIH)`, `(B_ARAB)`, `(TARIKH)` terpotong di tepi kanan karena `SelectItemText` menggunakan `whitespace-nowrap` dan `overflow-x-hidden`.
  3. Bagian kanan item memiliki padding `pr-8` untuk ikon centang penanda terpilih, yang semakin menekan teks ke kiri dan menyebabkan kata-kata terpotong.
  4. Root `<Select>` belum dipasangi prop `items` yang memetakan `value` ke `label`, berbeda dengan standar Base UI pada formulir lain di repositori.

- **Perilaku yang Diharapkan**:
  1. Popup `SelectContent` untuk mata pelajaran dapat melebar secara adaptif (`w-[var(--anchor-width)] min-w-[340px] sm:min-w-[420px] max-w-[90vw]`) dengan sudut membulat (`rounded-md`) dan bayangan yang halus.
  2. Setiap item mata pelajaran ditata dengan layout *two-column justify-between*:
     - Sisi kiri: Nama mata pelajaran lengkap yang jelas terbaca tanpa terpotong.
     - Sisi kanan: Kode mapel ditampilkan dalam badge monospace kecil (`bg-muted px-1.5 py-0.5 rounded font-mono text-[11px] border border-border/50 shrink-0`).
  3. Root `<Select>` dipasangi prop `items` dengan pemetaan lengkap `{ value: s.code, label: `${s.name} (${s.code})` }`.
  4. Dropdown Lembaga Naungan dan Tingkat Kelas di sebelahnya juga dipasangkan prop `items` dan styling yang selaras.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/bank-soal/baru/page.tsx`: Perbaikan `SelectContent`, `SelectItem`, dan prop `items` pada dropdown Mata Pelajaran, Lembaga, dan Tingkat Kelas.
  - Verifikasi seluruh rangkaian pengujian unit repositori (`apps/tests/`).
- **Out-of-Scope**:
  - Mengubah logika backend `listSubjects` atau `createQuestionBank`.
  - Mengubah tabel basis data Convex.

## 3. Bukti & Berkas Terkait
- Tangkapan layar dari pengguna (`media_1794006155630_b34e62fb.png`) memperlihatkan teks nama mata pelajaran dan kodenya terpotong di tepi kanan menu dropdown.
- Berkas terkait:
  - `apps/app/(main)/bank-soal/baru/page.tsx`
  - `apps/tests/bank-soal-creation-studio.test.ts`
  - `apps/tests/select-labels.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui elemen `<Select>` Mata Pelajaran di `apps/app/(main)/bank-soal/baru/page.tsx`:
   - Tambahkan prop `items`.
   - Tambahkan kelas lebar adaptif pada `<SelectContent>`.
   - Tata ulang `<SelectItem>` dengan badge kode mapel rata kanan.
2. **Langkah 2**: Lengkapi prop `items` pada `<Select>` Lembaga Naungan dan Tingkat Kelas di berkas yang sama.
3. **Langkah 3**: Jalankan `node --test apps/tests/bank-soal-creation-studio.test.ts` dan `node --test apps/tests/select-labels.test.ts`.
4. **Langkah 4**: Jalankan `npm test --prefix apps` dan `npm run typecheck --prefix apps`.

## 5. Kriteria Penerimaan yang Terukur
1. Menu dropdown Mata Pelajaran terbuka dengan lebar memadai (minimal 340px–420px) sehingga nama dan kode mapel tidak terpotong.
2. Kode mapel tampil rapi dalam badge monospace di sisi kanan setiap baris.
3. Seluruh 408 pengujian unit lulus 100%.
4. TypeScript check `tsc --noEmit` bersih tanpa kesalahan.
5. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: Base UI Select memerlukan prop `items` dengan bentuk `{ value: string, label: string }`.
- **Mitigasi**: Pastikan setiap entri `items` memiliki nilai `value` dan `label` bertipe string yang valid.

## 7. Pertimbangan Kompatibilitas, Keamanan, & Migrasi
- Kompatibel dengan mode terang dan gelap.
- Responsif di perangkat seluler (`max-w-[90vw]`).
- Tidak ada migrasi basis data.

## 8. Perintah Validasi Repositori
- `node --test apps/tests/bank-soal-creation-studio.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`

## 9. Ekspektasi Dokumentasi
- Spesifikasi disimpan di `specs/bug-fix-subject-dropdown-truncation.md`.
