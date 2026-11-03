# Integrasi Data Santri SiPAKSa

## Tujuan

Mengintegrasikan data nyata santri dari sistem SiPAKSa iCentre Smart (Ponpes Islamic Centre At-Tauhid) ke dalam platform E-Imtihan untuk jenjang SMPITA, SMAITA, dan MTA (mengecualikan jenjang SD dan TK) guna memastikan validitas identitas santri, mencegah kesalahan ketik nama pada lembar penilaian, serta mendukung fleksibilitas autentikasi ujian menggunakan NISN, NIS, atau ID Santri.

## User stories

- Sebagai Pengajar / Administrator, saya ingin menyinkronkan data santri secara otomatis atau sekali klik dari sistem SiPAKSa sehingga saya tidak perlu mengimpor data santri secara manual.
- Sebagai Pengajar, saya ingin sistem hanya memuat santri jenjang SMPITA, SMAITA, dan MTA yang berstatus aktif, tanpa mencampuradukkan santri SDITA atau TK.
- Sebagai Santri (termasuk santri MTA yang belum memiliki NISN), saya ingin dapat masuk ke ruang ujian dengan memasukkan NISN, NIS, atau ID Santri saya, di mana sistem langsung mengenali nama dan kelas saya secara otomatis.
- Sebagai Pengawas Ujian, saya ingin memastikan santri hanya dapat mengikuti sesi ujian yang sesuai dengan tingkatan kelas atau lembaganya.

## Kebutuhan fungsional

- `SANTRI-FR-001` — Sistem harus dapat menarik dan memfilter data santri aktif dari endpoint SiPAKSa (`/api/setoran`) khusus untuk lembaga SMPITA, SMAITA, dan MTA, serta mengecualikan seluruh data SDITA dan TK.
- `SANTRI-FR-002` — Sistem harus menyimpan master data santri di basis data internal (Convex) mencakup ID Santri, Nama, NISN, NIS, Jenjang, Kelas, Jenis Kelamin, Asrama, dan Guru Halaqah dengan mekanisme upsert agar data selalu mutakhir tanpa duplikasi.
- `SANTRI-FR-003` — Sistem harus menyediakan antarmuka administrasi data santri untuk melihat daftar santri terdaftar per lembaga dan memicu sinkronisasi manual ke SiPAKSa.
- `SANTRI-FR-004` — Sistem pintu masuk ujian santri harus mendukung pencocokan identitas fleksibel: mengenali santri berdasarkan NISN, NIS, maupun ID Santri (`santriId`), serta melakukan auto-complete dan validasi nama, lembaga (SMPITA/SMAITA/MTA), dan kelas saat nomor identitas dimasukkan.

## Kriteria penerimaan

- `SANTRI-AC-001` — Proses sinkronisasi hanya memasukkan santri dengan jenjang `SMPITA`, `SMAITA`, atau `MTA` yang berstatus `Aktif`. Santri dengan jenjang `SDITA` atau rombel TK tidak ada yang tersimpan di master santri.
- `SANTRI-AC-002` — Santri MTA yang tidak memiliki NISN tetap dapat masuk ke ruang ujian menggunakan ID Santri uniknya (contoh format: `21.04.xxx`).
- `SANTRI-AC-003` — Saat nomor identitas santri yang valid diinput pada halaman pengerjaan ujian, lembaga, kelas, dan nama lengkap santri langsung terisi otomatis dan tervalidasi terhadap data master santri.
- `SANTRI-AC-004` — Jika server SiPAKSa eksternal tidak dapat diakses saat hari ujian berlangsung, santri tetap dapat mengikuti ujian secara normal menggunakan master data yang telah tersinkronisasi di database Convex.

## Edge cases

- Santri baru pindahan yang belum terdaftar di SiPAKSa dapat disinkronkan kapan saja sebelum ujian dimulai melalui tombol sinkronisasi di dashboard pengajar.
- Jika ada santri dengan nomor identitas ganda antar-jenjang, `santriId` digunakan sebagai kunci identitas utama yang 100% unik di seluruh lembaga pesantren.
