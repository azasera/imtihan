"use client"

import * as React from "react"
import Image from "next/image"
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  SchoolIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { siteConfig } from "@/lib/site-config"

export default function PrototypePage() {
  const [selectedPrototype, setSelectedPrototype] = React.useState<"wizard" | "bento" | "checklist">("wizard")

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Top Prototype Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/30">
              Prototipe Onboarding
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">3 Pilihan Desain</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 font-heading">
            Eksplorasi Layout Onboarding E-Imtihan
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pilih variasi di bawah untuk melihat tampilan live dengan warna, font, dan mode tema aplikasi.
          </p>
        </div>

        <Tabs
          value={selectedPrototype}
          onValueChange={(val) => setSelectedPrototype(val as "wizard" | "bento" | "checklist")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="wizard" className="text-xs sm:text-sm">
              1. Multi-Step Wizard
            </TabsTrigger>
            <TabsTrigger value="bento" className="text-xs sm:text-sm">
              2. Bento Hub
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs sm:text-sm">
              3. Setup Checklist
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Prototype Canvas Area */}
      <div className="rounded-xl border bg-card/40 p-4 sm:p-6 lg:p-8 min-h-[560px] flex items-center justify-center">
        {selectedPrototype === "wizard" && <WizardPrototype />}
        {selectedPrototype === "bento" && <BentoHubPrototype />}
        {selectedPrototype === "checklist" && <ChecklistPrototype />}
      </div>
    </div>
  )
}

/* =========================================================================
   PROTOTIPE 1: MULTI-STEP WIZARD (FOCUSED STEP-BY-STEP)
   ========================================================================= */
function WizardPrototype() {
  const [step, setStep] = React.useState(1)
  const [role, setRole] = React.useState<"ustadz" | "santri" | "admin">("ustadz")

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-1">
          <Image
            src="/logo.png"
            alt={siteConfig.name}
            width={28}
            height={28}
            className="size-7 object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold tracking-tight font-heading">
          Selamat Datang di {siteConfig.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          Mari lengkapi profil awal Anda untuk mempermudah pelaksanaan ujian.
        </p>

        {/* Stepper Indicator */}
        <div className="pt-4 max-w-sm mx-auto">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span className={step >= 1 ? "text-primary font-semibold" : ""}>1. Peran</span>
            <span className={step >= 2 ? "text-primary font-semibold" : ""}>2. Lembaga</span>
            <span className={step >= 3 ? "text-primary font-semibold" : ""}>3. Siap Mulai</span>
          </div>
          <Progress value={step === 1 ? 33 : step === 2 ? 66 : 100} className="h-1.5" />
        </div>
      </div>

      {/* Step Content */}
      <Card className="border shadow-sm">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg">Tentukan Peran Anda</CardTitle>
              <CardDescription>
                Pilih peran utama Anda dalam platform E-Imtihan ini:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onClick={() => setRole("ustadz")}
                className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  role === "ustadz"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                  <GraduationCapIcon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">Ustadz / Pengajar / Penguji</div>
                  <div className="text-xs text-muted-foreground">
                    Membuat bank soal, menyusun paket ujian, mengatur jadwal, dan memeriksa hasil evaluasi.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setRole("santri")}
                className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  role === "santri"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                  <BookOpenIcon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">Santri / Peserta Ujian</div>
                  <div className="text-xs text-muted-foreground">
                    Mengerjakan ujian menggunakan token resmi, melihat instruksi pengerjaan dan hasil penilaian.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setRole("admin")}
                className={`flex items-start gap-3.5 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  role === "admin"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                  <SchoolIcon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">Administrator Madrasah / Pesantren</div>
                  <div className="text-xs text-muted-foreground">
                    Mengelola data santri, mata pelajaran, kurikulum, serta rekapitulasi nilai berkala.
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)}>
                Lanjutkan
                <ChevronRightIcon className="size-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Lembaga / Madrasah</CardTitle>
              <CardDescription>
                Masukkan nama pesantren atau lembaga pendidikan tempat ujian diselenggarakan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Nama Pesantren / Madrasah</label>
                <Input defaultValue="Pesantren At-Tauhid" placeholder="Nama instansi..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Jenjang / Program Pendidikan</label>
                <Input defaultValue="Kulliyyatul Mu'allimin / Tahfidz" placeholder="Jenjang kelas..." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Kembali
              </Button>
              <Button onClick={() => setStep(3)}>
                Lanjutkan
                <ChevronRightIcon className="size-4 ml-1" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader className="text-center">
              <div className="size-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-1">
                <CheckCircle2Icon className="size-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Konfigurasi Awal Selesai!</CardTitle>
              <CardDescription>
                Akun Anda telah siap digunakan dengan peran{" "}
                <span className="font-semibold text-foreground capitalize">{role}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 border">
                <div className="font-semibold text-primary flex items-center gap-1.5">
                  <SparklesIcon className="size-4" />
                  Rekomendasi Langkah Pertama:
                </div>
                <div className="text-muted-foreground">
                  {role === "ustadz"
                    ? "Masuk ke menu Bank Soal untuk menambahkan soal pertama Anda."
                    : role === "santri"
                      ? "Minta token ujian dari pengawas/ustadz penguji untuk memulai ujian."
                      : "Daftarkan data santri dan kelompok kelas di menu pengaturan."}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Kembali
              </Button>
              <Button onClick={() => setStep(1)}>
                Masuk ke Dashboard
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}

/* =========================================================================
   PROTOTIPE 2: BENTO HUB (DIRECT ACTION & ROLE SELECTOR)
   ========================================================================= */
function BentoHubPrototype() {
  const [token, setToken] = React.useState("")

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Welcome Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
              Ahlan wa Sahlan
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Platform Asesmen Digital</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight font-heading">
            Pusat Aktivitas {siteConfig.name}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Sistem evaluasi berbasis komputer untuk ujian terstandar santri. Silakan pilih jalur aktivitas Anda hari ini:
          </p>
        </div>
        <div className="size-16 rounded-xl bg-card border shadow-xs flex items-center justify-center shrink-0">
          <Image
            src="/logo.png"
            alt={siteConfig.name}
            width={40}
            height={40}
            className="size-10 object-contain"
          />
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Guru / Ustadz */}
        <Card className="border hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
          <CardHeader>
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <GraduationCapIcon className="size-5" />
            </div>
            <CardTitle className="text-base font-heading">Jalur Pengajar / Ustadz</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Buat dan publikasikan lembar ujian, kelola bank soal materi pelajaran, dan pantau hasil koreksi otomatis.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button className="w-full text-xs" size="sm">
              <FileTextIcon className="size-3.5 mr-1.5" />
              Kelola Bank Soal
            </Button>
          </CardFooter>
        </Card>

        {/* Card 2: Santri / Siswa (Direct Token Input) */}
        <Card className="border border-primary/40 bg-primary/5 hover:border-primary transition-all flex flex-col justify-between shadow-xs">
          <CardHeader>
            <div className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-2">
              <KeyRoundIcon className="size-5" />
            </div>
            <CardTitle className="text-base font-heading">Jalur Peserta Ujian</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Sudah memiliki token ujian dari penguji? Masukkan kode token 6 digit untuk langsung masuk ruang ujian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder="CONTOH: IMT-789"
              maxLength={10}
              className="text-center tracking-widest font-mono text-xs uppercase bg-background"
            />
          </CardContent>
          <CardFooter className="pt-0">
            <Button className="w-full text-xs" size="sm" variant="default">
              <ShieldCheckIcon className="size-3.5 mr-1.5" />
              Mulai Ujian Sekarang
            </Button>
          </CardFooter>
        </Card>

        {/* Card 3: Administrasi Pesantren */}
        <Card className="border hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
          <CardHeader>
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <SchoolIcon className="size-5" />
            </div>
            <CardTitle className="text-base font-heading">Manajemen Madrasah</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Daftarkan santri baru, atur rombel/kelas halaqah, dan cetak lembar rekapitulasi ujian per semester.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0">
            <Button variant="outline" className="w-full text-xs" size="sm">
              <UsersIcon className="size-3.5 mr-1.5" />
              Data Santri & Kelas
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card/60 text-xs">
          <ClockIcon className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Pewaktu Otomatis & Anti-Kecurangan</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card/60 text-xs">
          <CheckCircle2Icon className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Koreksi Soal Pilihan Ganda Instan</span>
        </div>
        <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-card/60 text-xs">
          <LayoutDashboardIcon className="size-4 text-primary shrink-0" />
          <span className="text-muted-foreground">Laporan Rinci Perkembangan Santri</span>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   PROTOTIPE 3: CHECKLIST-BASED SETUP TOUR (EMBEDDED DISCOVERY)
   ========================================================================= */
function ChecklistPrototype() {
  const [tasks, setTasks] = React.useState([
    { id: "account", title: "Registrasi & Verifikasi Akun", completed: true, desc: "Sesi terhubung sebagai azasera digital." },
    { id: "madrasah", title: "Lengkapi Profil Madrasah & Pengajar", completed: false, desc: "Atur nama instansi, mata pelajaran, dan jenjang santri." },
    { id: "bank_soal", title: "Susun Paket Soal Pertama", completed: false, desc: "Tambahkan minimal 5 butir soal pilihan ganda atau essay." },
    { id: "jadwal", title: "Jadwalkan Sesi Ujian & Generate Token", completed: false, desc: "Tentukan durasi menit dan aktifkan token akses santri." },
  ])

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progressPercent = Math.round((completedCount / tasks.length) * 100)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Embedded Guide Card */}
      <Card className="border border-primary/30 shadow-xs bg-gradient-to-b from-card to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary text-xs">
                  Panduan Memulai
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {completedCount} dari {tasks.length} Langkah Selesai
                </span>
              </div>
              <CardTitle className="text-lg font-heading">
                Langkah Cepat Memulai {siteConfig.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Selesaikan langkah persiapan berikut agar sistem evaluasi Anda siap digunakan untuk santri.
              </CardDescription>
            </div>
            <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ListChecksIcon className="size-6 text-primary" />
            </div>
          </div>

          <div className="space-y-1.5 pt-3">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>Progress Setup</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4 space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                task.completed
                  ? "bg-card/40 border-muted text-muted-foreground"
                  : "bg-card border-border hover:border-primary/40 shadow-2xs"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {task.completed ? (
                  <CheckCircle2Icon className="size-4.5 text-primary" />
                ) : (
                  <div className="size-4.5 rounded-full border-2 border-muted-foreground/40 hover:border-primary" />
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className={`text-xs font-semibold ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug">
                  {task.desc}
                </div>
              </div>
              {!task.completed && (
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-primary shrink-0">
                  Kerjakan
                  <ChevronRightIcon className="size-3.5 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>

        <CardFooter className="pt-1 flex justify-between text-xs text-muted-foreground">
          <span>Panduan ini dapat disembunyikan kapan saja melalui menu pengaturan.</span>
          <Button size="sm" variant="outline">
            Sembunyikan Panduan
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
