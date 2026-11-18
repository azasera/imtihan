"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BatteryChargingIcon,
  BookOpenCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HelpCircleIcon,
  KeyRoundIcon,
  LockIcon,
  MonitorIcon,
  PrinterIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UnlockIcon,
  UserCheck2Icon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface TroubleshootingCardData {
  id: string
  title: string
  category: "troubleshooting" | "token" | "pre-exam" | "post-exam"
  symptom: string
  cause: string
  steps: string[]
  badge: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  icon: React.ReactNode
}

const TROUBLESHOOTING_CARDS: TroubleshootingCardData[] = [
  {
    id: "santri-tidak-ditemukan",
    title: "Nomor Induk Santri Tidak Ditemukan",
    category: "troubleshooting",
    badge: "Identitas",
    badgeVariant: "destructive",
    icon: <UsersIcon className="size-4 text-destructive" />,
    symptom: "Muncul notifikasi merah: 'Nomor Induk Santri tidak ditemukan dalam basis data pesantren.'",
    cause: "Santri salah mengetik angka, atau data santri belum disinkronkan ulang dari SiPAKSa setelah ada pembaruan NISN/NIS.",
    steps: [
      "Periksa kartu peserta santri. Coba masukkan NIS lokal (misal: 2538053220) atau ID Santri SiPAKSa (misal: 26.02.032).",
      "Jika tetap tidak ditemukan, pengawas membuka menu Data Santri (/santri) di gawai pengawas.",
      "Klik tombol 'Sinkronkan Santri dari SiPAKSa' di pojok kanan atas dan tunggu sampai berhasil.",
      "Minta santri mengetik ulang nomor induknya di halaman gerbang ujian.",
    ],
  },
  {
    id: "token-digit-mismatch",
    title: "2 Angka Terakhir Token Tidak Cocok",
    category: "token",
    badge: "Format Token",
    badgeVariant: "outline",
    icon: <KeyRoundIcon className="size-4 text-amber-600 dark:text-amber-400" />,
    symptom: "Muncul notifikasi: '2 angka terakhir token tidak cocok dengan nomor induk santri Anda.'",
    cause: "Santri hanya mengetik 6 huruf sesi tanpa 2 angka santri, atau salah melihat 2 digit terakhir nomor induknya.",
    steps: [
      "Pastikan total karakter token yang diketik santri berjumlah tepat 8 karakter.",
      "6 karakter awal adalah huruf token sesi dari layar proyektor pengawas (contoh: 7K2M3P).",
      "2 karakter terakhir adalah 2 digit paling belakang nomor identitas santri (sistem mendukung 2 angka terakhir dari NISN, NIS, maupun ID Santri).",
      "Contoh: Token sesi 7K2M3P + akhiran santri 42 = 7K2M3P42.",
    ],
  },
  {
    id: "ujian-dua-kali",
    title: "Santri Tidak Sengaja Tertekan Kumpul / Mau Masuk Ulang",
    category: "troubleshooting",
    badge: "Status Selesai",
    badgeVariant: "secondary",
    icon: <ShieldAlertIcon className="size-4 text-primary" />,
    symptom: "Muncul notifikasi: 'Anda telah menyelesaikan dan mengumpulkan lembar ujian ini. Tidak diperbolehkan mengikuti ujian dua kali pada sesi yang sama.'",
    cause: "Santri sudah menekan tombol 'Kumpulkan Ujian' sehingga statusnya di sistem menjadi 'submitted'. Sistem mengunci demi integritas nilai.",
    steps: [
      "Jika santri memang sudah selesai: Jelaskan bahwa seluruh jawaban sudah tersimpan aman di server dan santri tidak perlu login lagi.",
      "Jika santri tidak sengaja tertekan kumpul & diizinkan pengawas mengulang: Buka menu Monitoring Sesi (/monitoring-sesi).",
      "Cari nama santri pada tabel peserta ujian.",
      "Klik tombol 'Hapus/Keluarkan' (ikon tempat sampah warna merah) pada baris santri tersebut untuk mereset partisipasinya.",
      "Setelah dihapus, santri dapat langsung login kembali di /ujian untuk mengerjakan lembar baru dari awal.",
    ],
  },
  {
    id: "layar-terkunci",
    title: "Layar Santri Terkunci Karena Pelanggaran Tab",
    category: "troubleshooting",
    badge: "Integritas",
    badgeVariant: "destructive",
    icon: <LockIcon className="size-4 text-destructive" />,
    symptom: "Lembar soal santri membeku/terkunci dengan keterangan pelanggaran integritas dan diminta menghubungi pengawas.",
    cause: "Sesi ujian menggunakan mode kunci (lock mode) dan santri berpindah jendela/aplikasi atau membuka tab lain melebihi batas toleransi.",
    steps: [
      "Tanyakan dan periksa alasan santri berpindah layar (apakah pop-up sistem atau membuka aplikasi lain).",
      "Buka menu Monitoring Sesi (/monitoring-sesi) pada gawai pengawas.",
      "Gunakan filter status 'Terkunci' untuk menemukan santri dengan cepat.",
      "Klik tombol 'Buka Kunci' (ikon gembok terbuka) di baris santri yang bersangkutan.",
      "Lembar ujian santri akan terbuka kembali tanpa menghapus jawaban yang telah diisi sebelumnya.",
    ],
  },
  {
    id: "baterai-mati-resume",
    title: "Gawai Mati, Baterai Habis, atau Peramban Tertutup",
    category: "troubleshooting",
    badge: "Kelangsungan",
    badgeVariant: "default",
    icon: <BatteryChargingIcon className="size-4 text-emerald-600 dark:text-emerald-400" />,
    symptom: "Layar ujian tertutup tiba-tiba di tengah ujian, santri cemas jawabannya hilang.",
    cause: "Baterai ponsel/laptop santri habis, peramban keluar tidak sengaja, atau koneksi jaringan terputus sementara.",
    steps: [
      "Sambungkan gawai ke pengisi daya atau gunakan gawai cadangan.",
      "Buka kembali alamat /ujian pada peramban.",
      "Minta santri mengetikkan nomor induk dan token ujian yang sama persis seperti sebelumnya.",
      "Sistem otomatis mengenali santri dan menampilkan notifikasi: 'Melanjutkan kembali sesi ujian Anda yang sedang berlangsung.'",
      "Semua jawaban tersimpan aman di cloud Convex dan sisa durasi pengerjaan dilanjutkan secara otomatis.",
    ],
  },
  {
    id: "token-kadaluarsa",
    title: "Token Sesi Berubah / 'Token Ujian Tidak Berlaku Lagi'",
    category: "token",
    badge: "Rotasi Token",
    badgeVariant: "outline",
    icon: <RotateCcwIcon className="size-4 text-blue-600 dark:text-blue-400" />,
    symptom: "Muncul notifikasi: 'Token ujian tidak berlaku lagi. Minta token terbaru kepada pengawas.'",
    cause: "Sesi ujian mengaktifkan fitur rotasi token otomatis berkala (misal: tiap 15 atau 30 menit) untuk mencegah kebocoran token ke luar ruangan.",
    steps: [
      "Buka kartu Token Sesi di menu Monitoring Sesi atau periksa layar proyektor pengawas.",
      "Berikan 6 huruf token sesi yang baru kepada santri yang baru akan masuk.",
      "Santri yang saat ini sudah berada di dalam lembar soal TIDAK AKAN terganggu oleh rotasi token.",
      "Rotasi token hanya berlaku sebagai kunci gerbang bagi santri yang baru membuka form login.",
    ],
  },
]

export default function ProctorGuidePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState<string>("all")

  const filteredCards = React.useMemo(() => {
    return TROUBLESHOOTING_CARDS.filter((card) => {
      const matchCategory = activeCategory === "all" || card.category === activeCategory
      if (!matchCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        card.title.toLowerCase().includes(q) ||
        card.symptom.toLowerCase().includes(q) ||
        card.cause.toLowerCase().includes(q) ||
        card.steps.some((step) => step.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, activeCategory])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full selection:bg-emerald-700 selection:text-white">
      {/* ============================================================== */}
      {/* HERO HEADER                                                    */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary text-xs font-semibold px-2.5 py-0.5">
                Panduan Operasional Resmi
              </Badge>
              <Badge variant="secondary" className="text-xs">
                CBT E-Imtihan At-Tauhid
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading text-foreground">
              Panduan Pengawas Ruang Ujian
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Panduan langkah demi langkah bagi Ustadz dan Pengawas Ruang: alur pra-ujian, rumus token santri, dan solusi cepat kendala teknis santri saat ujian berlangsung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <Link
              href="/monitoring-sesi"
              className={buttonVariants({
                variant: "default",
                size: "sm",
                className: "gap-1.5 text-xs font-medium bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs",
              })}
            >
              <MonitorIcon className="size-3.5" />
              <span>Buka Monitoring Sesi</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-medium"
              title="Cetak panduan ini untuk arsip fisik ruang ujian"
            >
              <PrinterIcon className="size-3.5" />
              <span>Cetak SOP</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* QUICK SUMMARY METRICS / ANCHORS                                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href="#pra-ujian"
          className="group p-4 rounded-lg border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex items-start gap-3.5 shadow-2xs"
        >
          <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <RefreshCwIcon className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Tahap 1</div>
            <div className="font-semibold text-sm text-foreground">Persiapan Pra-Ujian</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Sinkron SiPAKSa & status aktif</div>
          </div>
        </a>

        <a
          href="#format-token"
          className="group p-4 rounded-lg border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex items-start gap-3.5 shadow-2xs"
        >
          <div className="size-9 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <KeyRoundIcon className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Tahap 2</div>
            <div className="font-semibold text-sm text-foreground">Format Token 8 Karakter</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">6 huruf sesi + 2 digit santri</div>
          </div>
        </a>

        <a
          href="#troubleshooting"
          className="group p-4 rounded-lg border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex items-start gap-3.5 shadow-2xs"
        >
          <div className="size-9 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangleIcon className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Tahap 3</div>
            <div className="font-semibold text-sm text-foreground">Solusi Kendala Ruang</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Terkunci, gawai mati, kumpul</div>
          </div>
        </a>

        <a
          href="#pasca-ujian"
          className="group p-4 rounded-lg border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all flex items-start gap-3.5 shadow-2xs"
        >
          <div className="size-9 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2Icon className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Tahap 4</div>
            <div className="font-semibold text-sm text-foreground">Penutupan & Koreksi</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Cek submitted & nilai esai</div>
          </div>
        </a>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: PERSIAPAN PRA-UJIAN                                */}
      {/* ============================================================== */}
      <section id="pra-ujian" className="space-y-4 scroll-mt-20">
        <div className="flex items-center gap-2 pb-2 border-b">
          <RefreshCwIcon className="size-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight font-heading">
            1. SOP Persiapan Sebelum Ujian (Pra-Ujian)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[11px] mb-1">
                Langkah 1
              </Badge>
              <CardTitle className="text-sm font-semibold">Sinkronisasi Data Santri</CardTitle>
              <CardDescription className="text-xs">
                Pastikan NISN, NIS, dan kelas santri terbarui dari SiPAKSa.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Sebelum hari ujian dimulai, buka menu <strong className="text-foreground">Data Santri</strong> lalu tekan tombol <strong className="text-foreground">Sinkronkan Santri dari SiPAKSa</strong> di pojok kanan atas.
              </p>
              <p className="bg-muted/50 p-2.5 rounded border text-[11px]">
                Wajib dilakukan jika ada pembaruan nomor induk atau mutasi rombel agar tidak ada kendala santri tidak ditemukan.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[11px] mb-1">
                Langkah 2
              </Badge>
              <CardTitle className="text-sm font-semibold">Aktivasi Sesi Ujian</CardTitle>
              <CardDescription className="text-xs">
                Ubah status sesi dari Draft menjadi Aktif.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Buka menu <strong className="text-foreground">Sesi Ujian</strong>. Temukan sesi mata pelajaran yang sesuai jadwal, pastikan statusnya sudah diubah menjadi <strong className="text-foreground">Aktif</strong>.
              </p>
              <p className="bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-2.5 rounded border border-amber-200 dark:border-amber-900 text-[11px]">
                Santri tidak dapat memasukkan token jika sesi masih berstatus Draft atau sudah berstatus Selesai (Ended).
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="w-fit text-[11px] mb-1">
                Langkah 3
              </Badge>
              <CardTitle className="text-sm font-semibold">Buka Monitoring & Proyektor</CardTitle>
              <CardDescription className="text-xs">
                Tampilkan 6 huruf token sesi di layar depan kelas.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Klik tombol <strong className="text-foreground">Monitoring Sesi</strong>. Pada kartu token, klik <strong className="text-foreground">Layar Penuh</strong> untuk memproyeksikan token sesi di depan ruang kelas.
              </p>
              <p className="bg-muted/50 p-2.5 rounded border text-[11px]">
                Token sesi hanya memuat huruf dan angka yang mudah dibedakan (tanpa huruf O, I, L dan tanpa angka 0, 1).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 2: FORMAT LOGIN & RUMUS TOKEN 8 KARAKTER              */}
      {/* ============================================================== */}
      <section id="format-token" className="space-y-4 scroll-mt-20">
        <div className="flex items-center gap-2 pb-2 border-b">
          <KeyRoundIcon className="size-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-lg font-bold tracking-tight font-heading">
            2. Format Masuk Santri & Rumus Token 8 Karakter
          </h2>
        </div>

        <Card className="border shadow-2xs overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">Rumus Token Ujian Santri</CardTitle>
                <CardDescription className="text-xs">
                  Sistem E-Imtihan menerapkan proteksi tebakan token dengan format gabungan 8 karakter.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs w-fit">
                Total: 8 Karakter
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Visual Equation Formula */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg border bg-background flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Bagian 1 (Dari Pengawas)
                </span>
                <span className="font-mono text-2xl font-bold tracking-[0.2em] text-primary">
                  7K2M3P
                </span>
                <span className="text-xs text-muted-foreground mt-1">6 Huruf Token Sesi</span>
              </div>

              <div className="p-4 rounded-lg border bg-background flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Bagian 2 (Dari Santri)
                </span>
                <span className="font-mono text-2xl font-bold tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  42
                </span>
                <span className="text-xs text-muted-foreground mt-1">2 Angka Terakhir Nomor Induk</span>
              </div>

              <div className="p-4 rounded-lg border-2 border-emerald-600/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
                  Hasil yang Diketik Santri
                </span>
                <span className="font-mono text-2xl font-bold tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  7K2M3P42
                </span>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">Token Lengkap (8 Karakter)</span>
              </div>
            </div>

            <Separator />

            {/* Aturan Fleksibilitas Identitas Santri */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Ketentuan Nomor Induk yang Didukung:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded border bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">1. NISN Resmi (10 Digit)</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Contoh: <code className="font-mono">0137412142</code>. Dua angka terakhir adalah <strong className="text-foreground">42</strong>.
                  </p>
                </div>
                <div className="p-3 rounded border bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">2. NIS Lokal Pesantren</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Contoh: <code className="font-mono">2538053220</code>. Dua angka terakhir adalah <strong className="text-foreground">20</strong>.
                  </p>
                </div>
                <div className="p-3 rounded border bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">3. ID Santri SiPAKSa</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Contoh: <code className="font-mono">26.02.032</code>. Dua angka terakhir adalah <strong className="text-foreground">32</strong>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                *Sistem secara cerdas menerima 2 digit terakhir dari NISN, NIS, maupun ID Santri, sehingga santri tidak akan gagal hanya karena salah melihat nomor acuan pada kartu peserta.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ============================================================== */}
      {/* SECTION 3: SOLUSI CEPAT KENDALA RUANG UJIAN                   */}
      {/* ============================================================== */}
      <section id="troubleshooting" className="space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-bold tracking-tight font-heading">
              3. Solusi Cepat Kendala Ruang Ujian (Troubleshooting)
            </h2>
          </div>
          <Badge variant="outline" className="text-xs w-fit">
            {filteredCards.length} Kasus Kendala
          </Badge>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ketik kata kunci kendala (contoh: token, kumpul, terkunci, baterai, nomor induk)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className="text-xs h-9"
            >
              Semua
            </Button>
            <Button
              variant={activeCategory === "troubleshooting" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("troubleshooting")}
              className="text-xs h-9"
            >
              Kendala Santri
            </Button>
            <Button
              variant={activeCategory === "token" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("token")}
              className="text-xs h-9"
            >
              Masalah Token
            </Button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => (
            <Card key={card.id} className="border shadow-2xs flex flex-col justify-between">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded bg-muted flex items-center justify-center shrink-0">
                      {card.icon}
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {card.title}
                    </CardTitle>
                  </div>
                  <Badge variant={card.badgeVariant ?? "secondary"} className="text-[10px] shrink-0">
                    {card.badge}
                  </Badge>
                </div>

                <div className="text-xs bg-muted/40 p-2.5 rounded border space-y-1">
                  <div>
                    <span className="font-semibold text-foreground">Gejala: </span>
                    <span className="text-muted-foreground">{card.symptom}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Penyebab: </span>
                    <span className="text-muted-foreground">{card.cause}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 text-xs space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ArrowRightIcon className="size-3.5 text-primary" />
                  <span>Tindakan Pengawas:</span>
                </div>
                <ol className="list-decimal list-outside ml-4 space-y-1.5 text-muted-foreground leading-relaxed">
                  {card.steps.map((step, idx) => (
                    <li key={idx} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}

          {filteredCards.length === 0 && (
            <div className="col-span-full p-8 text-center border rounded-lg bg-card text-muted-foreground text-sm">
              Tidak ditemukan kendala yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba gunakan kata kunci umum seperti &quot;token&quot; atau &quot;kunci&quot;.
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION 4: PASCA UJIAN & PENUTUPAN SESI                       */}
      {/* ============================================================== */}
      <section id="pasca-ujian" className="space-y-4 scroll-mt-20">
        <div className="flex items-center gap-2 pb-2 border-b">
          <CheckCircle2Icon className="size-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-bold tracking-tight font-heading">
            4. Prosedur Setelah Ujian Selesai (Pasca Ujian)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCheck2Icon className="size-4 text-primary" />
                <span>1. Verifikasi Pengumpulan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Periksa ringkasan di bagian atas menu Monitoring Sesi. Pastikan jumlah santri pada kotak <strong className="text-foreground">Selesai</strong> telah sesuai dengan jumlah kehadiran fisik santri di ruang ujian.
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LockIcon className="size-4 text-amber-600 dark:text-amber-400" />
                <span>2. Menutup Sesi Ujian</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Setelah waktu ujian habis, ubah status sesi menjadi <strong className="text-foreground">Selesai (Ended)</strong> agar sesi ditutup secara resmi dan tidak ada lagi yang dapat mengakses lembar soal.
            </CardContent>
          </Card>

          <Card className="border shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileTextIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <span>3. Koreksi Esai & Rekap Nilai</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Nilai pilihan ganda dihitung otomatis seketika. Untuk butir esai, pengajar dapat langsung membuka tautan <strong className="text-foreground">Buka Koreksi</strong> di tabel monitoring atau melalui menu Rekap Nilai.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FOOTER CALLOUT                                                 */}
      {/* ============================================================== */}
      <div className="rounded-lg border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4 text-primary" />
            <span>Butuh bantuan lebih lanjut atau penanganan khusus?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Jika terdapat kendala server atau jaringan yang belum tercakup pada panduan ini, segera hubungi Tim Administrator CBT Pesantren.
          </p>
        </div>
        <Link
          href="/monitoring-sesi"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "text-xs gap-1.5 shrink-0",
          })}
        >
          <span>Kembali ke Monitoring</span>
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}
