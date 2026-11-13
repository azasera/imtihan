# Spesifikasi: Perbaikan Kunci Gandar Sibling pada Monitoring Sesi (Duplicate React Key)

## 1. Definisi Masalah & Perilaku yang Diharapkan
- **Masalah**:
  Pada halaman monitoring sesi (`apps/app/(main)/monitoring-sesi/page.tsx`), konsol peramban menghasilkan peringatan runtime React:
  ```
  Encountered two children with the same key, `jh7177my09awgzjjnv91d618b18hgdsm`. Keys should be unique so that components maintain their identity across updates.
    at MonitoringSesiPage (app/(main)/monitoring-sesi/page.tsx:639:9)
  ```
  Penyebabnya adalah dua komponen anak (*sibling children*) di dalam kontainer utama `<div className="space-y-6">` menggunakan nilai `key` yang identik tanpa prefix:
  1. `<SessionTokenCard key={selectedSession._id} session={selectedSession} />` (baris 394).
  2. `<SessionContinuationDialog key={continuationSource._id} source={continuationSource} ... />` (baris 640).
  Ketika pengajar menekan tombol "Buat Remedial / Susulan" dari sesi yang sedang aktif dipantau, `continuationSource` diisi dengan `selectedSession`. Karena keduanya adalah saudara kandung langsung (*direct siblings*) dalam JSX yang sama, React mendeteksi dua elemen dengan key yang sama persis (`selectedSession._id`), memicu peringatan konsol dan risiko instabilitas rekonsiliasi DOM.

- **Perilaku yang Diharapkan**:
  Setiap elemen anak langsung (*direct sibling*) di dalam kontainer induk harus memiliki `key` yang unik dan terisolasi secara namespace.
  - Untuk `SessionTokenCard`: menggunakan `key={`session-token-${selectedSession._id}`}`.
  - Untuk `SessionContinuationDialog`: menggunakan `key={`continuation-dialog-${continuationSource._id}`}`.
  Dengan namespace prefix ini, key dijamin unik bahkan ketika kedua komponen merujuk pada `_id` sesi yang sama secara bersamaan.

## 2. In / Out of Scope
- **In-Scope**:
  - `apps/app/(main)/monitoring-sesi/page.tsx`: Memberikan namespace prefix unik pada `key` prop `SessionTokenCard` dan `SessionContinuationDialog`.
  - Verifikasi bahwa seluruh tes terkait (khususnya `apps/tests/session-continuation.test.ts` dan `apps/tests/exam-monitoring.test.ts`) tetap lulus.
- **Out-of-Scope**:
  - Mengubah logika internal `SessionTokenCard` atau `SessionContinuationDialog`.
  - Mengubah Convex mutations atau queries backend.

## 3. Bukti & Berkas Terkait
- Log error konsol: `Encountered two children with the same key, 'jh7177my09awgzjjnv91d618b18hgdsm' at MonitoringSesiPage (app/(main)/monitoring-sesi/page.tsx:639:9)`.
- Berkas terkait:
  - `apps/app/(main)/monitoring-sesi/page.tsx`
  - `apps/tests/session-continuation.test.ts`
  - `apps/tests/exam-monitoring.test.ts`

## 4. Kebutuhan Implementasi Terurut Dependensi
1. **Langkah 1**: Perbarui `key` pada `SessionTokenCard` di `apps/app/(main)/monitoring-sesi/page.tsx` menjadi `key={`session-token-${selectedSession._id}`}`.
2. **Langkah 2**: Perbarui `key` pada `SessionContinuationDialog` di `apps/app/(main)/monitoring-sesi/page.tsx` menjadi `key={`session-continuation-${continuationSource._id}`}`.
3. **Langkah 3**: Jalankan `node --test apps/tests/session-continuation.test.ts` dan `node --test apps/tests/exam-monitoring.test.ts`.
4. **Langkah 4**: Jalankan `npm test --prefix apps` dan `npm run typecheck --prefix apps`.

## 5. Kriteria Penerimaan yang Terukur
1. Tidak ada lagi konflik kunci ganda antar anak sibling di dalam JSX `MonitoringSesiPage`.
2. Kedua komponen tetap me-reset state internalnya dengan tepat saat `_id` sesi berganti.
3. Seluruh 408 pengujian unit lulus 100%.
4. TypeScript compiler `tsc --noEmit` bersih tanpa kesalahan.
5. Nihil kebocoran kode spesifikasi teknis dan nihil emoji.

## 6. Risiko & Mitigasi
- **Risiko**: Ada tes string yang mengecek `<SessionContinuationDialog` secara literal.
- **Mitigasi**: Pemeriksaan pada `session-continuation.test.ts` hanya memeriksa `page.includes("<SessionContinuationDialog")`, sehingga penambahan prefix pada atribut `key` tidak membatalkan tes tersebut.

## 7. Pertimbangan Kompatibilitas, Keamanan, & Migrasi
- Perubahan ini 100% murni sisi klien React dan aman terhadap rekonsiliasi Virtual DOM.
- Tidak ada dampak migrasi atau perubahan data.

## 8. Perintah Validasi Repositori
- `node --test apps/tests/session-continuation.test.ts`
- `node --test apps/tests/exam-monitoring.test.ts`
- `npm test --prefix apps`
- `npm run typecheck --prefix apps`

## 9. Ekspektasi Dokumentasi
- Spesifikasi disimpan di `specs/bug-duplicate-key-monitoring-sesi.md`.
