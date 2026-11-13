"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  GraduationCapIcon,
  LayersIcon,
  PenLineIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import {
  INSTITUTION_LABELS,
  INSTITUTION_LEVELS,
  INSTITUTION_NAMES,
  INSTITUTIONS,
  type Institution,
} from "@/convex/model/institutions"
import { authClient } from "@/lib/auth-client"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type EvaluationTemplate = "ph" | "pts" | "pas" | "custom"
type NextWorkflow = "editor" | "ai" | "import"

interface TemplatePreset {
  id: EvaluationTemplate
  title: string
  subtitle: string
  tag: string
  defaultPoints: number
  defaultPassing: number
  descriptionHint: string
}

const TEMPLATES: TemplatePreset[] = [
  {
    id: "ph",
    title: "Penilaian Harian (PH)",
    subtitle: "Uji pemahaman topik berkala (10–15 butir)",
    tag: "Format Ringkas",
    defaultPoints: 100,
    defaultPassing: 75,
    descriptionHint: "Penilaian harian untuk mengukur capaian kompetensi dasar pokok bahasan.",
  },
  {
    id: "pts",
    title: "Penilaian Tengah Semester (PTS)",
    subtitle: "Evaluasi paruh semester terstruktur (25–30 butir)",
    tag: "Asesmen Tengah",
    defaultPoints: 100,
    defaultPassing: 75,
    descriptionHint: "Evaluasi terpadu untuk mengukur ketuntasan belajar paruh pertama semester.",
  },
  {
    id: "pas",
    title: "Penilaian Akhir Semester (PAS)",
    subtitle: "Asesmen sumatif semester komprehensif (40–50 butir)",
    tag: "Sumatif Utama",
    defaultPoints: 100,
    defaultPassing: 75,
    descriptionHint: "Asesmen capaian kompetensi akhir semester terstandar bagi seluruh santri.",
  },
  {
    id: "custom",
    title: "Format Bebas / Kustom",
    subtitle: "Konfigurasi mandiri tanpa batasan prasetel",
    tag: "Fleksibel",
    defaultPoints: 100,
    defaultPassing: 70,
    descriptionHint: "Paket soal latihan, pengayaan, atau ujian khusus madrasah.",
  },
]

export default function BankSoalBaruPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const subjects = useQuery(api.bank.public.queries.listSubjects, {})
  const createBank = useMutation(api.bank.public.mutations.createQuestionBank)

  const [selectedTemplate, setSelectedTemplate] = React.useState<EvaluationTemplate>("ph")
  const [selectedWorkflow, setSelectedWorkflow] = React.useState<NextWorkflow>("editor")

  // Form states
  const [title, setTitle] = React.useState("")
  const [subjectCode, setSubjectCode] = React.useState("")
  const [institution, setInstitution] = React.useState<Institution>("SMPITA")
  const [gradeLevel, setGradeLevel] = React.useState("Kelas 7")
  const [description, setDescription] = React.useState("")
  const [totalPoints, setTotalPoints] = React.useState(100)
  const [passingScore, setPassingScore] = React.useState(75)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Hanya mata pelajaran aktif yang dapat dipilih
  const selectableSubjects = React.useMemo(
    () => (subjects ?? []).filter((s) => s.isActive !== false),
    [subjects]
  )

  const handleSelectTemplate = (template: TemplatePreset) => {
    setSelectedTemplate(template.id)
    setTotalPoints(template.defaultPoints)
    setPassingScore(template.defaultPassing)
    if (!description || TEMPLATES.some((t) => t.descriptionHint === description)) {
      setDescription(template.descriptionHint)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user && !isSessionPending) {
      toast.error("Silakan masuk terlebih dahulu sebagai pengajar untuk membuat paket bank soal.")
      router.push("/login")
      return
    }

    if (!title.trim()) {
      toast.error("Judul paket soal wajib diisi.")
      return
    }

    if (!subjectCode) {
      toast.error("Pilih mata pelajaran terlebih dahulu.")
      return
    }

    setIsSubmitting(true)
    try {
      const bankId = await createBank({
        title: title.trim(),
        subjectCode,
        institution,
        gradeLevel: gradeLevel.trim(),
        description: description.trim() || undefined,
        totalPoints: Number(totalPoints) || 100,
        passingScore: Number(passingScore) || 75,
      })

      toast.success("Paket bank soal berhasil dibuat!")

      // Alihkan ke editor soal sesuai alur kerja yang dipilih pengguna
      if (selectedWorkflow === "ai") {
        router.push(`/bank-soal/${bankId}?mode=ai`)
      } else if (selectedWorkflow === "import") {
        router.push(`/bank-soal/${bankId}?mode=bulk`)
      } else {
        router.push(`/bank-soal/${bankId}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat paket bank soal.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6 lg:p-8">
      {/* Tombol Kembali & Header Halaman */}
      <div className="space-y-3">
        <Link
          href="/bank-soal"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Kembali ke Direktori Bank Soal
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Creation Studio
              </Badge>
              <span className="text-xs text-muted-foreground">Penyusunan Paket Terstandar</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Buat Paket Bank Soal Baru
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Konfigurasikan sasaran kurikulum, jenjang santri, standar kelulusan KKM, dan tentukan metode pengisian butir soal.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning autoComplete="off">
        {/* Tahap 1: Pilihan Prasetel Template Evaluasi Madrasah */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">1. Pilih Format & Template Asesmen</Label>
            <p className="text-xs text-muted-foreground">
              Pilih pola evaluasi untuk memuat rekomendasi bobot nilai dan batas kelulusan secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id
              return (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  suppressHydrationWarning
                  data-1p-ignore="true"
                  className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                      : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {tpl.tag}
                      </span>
                      {isSelected && (
                        <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="font-semibold text-foreground">{tpl.title}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tpl.subtitle}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <span>KKM: <strong className="text-foreground">{tpl.defaultPassing}</strong></span>
                    <span>•</span>
                    <span>Bobot: <strong className="text-foreground">{tpl.defaultPoints}</strong></span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tahap 2: Informasi Paket & Kurikulum */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">2. Informasi Paket & Kurikulum</CardTitle>
            <CardDescription>
              Identitas naskah ujian yang akan dicantumkan pada kop lembar soal dan gerbang santri.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Judul Paket Bank Soal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Contoh: Penilaian Harian Fiqih Bab Thaharah & Shalat"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Mata Pelajaran <span className="text-destructive">*</span>
                </Label>
                <Select
                  items={selectableSubjects.map((s) => ({
                    value: s.code,
                    label: `${s.name} (${s.code})`,
                  }))}
                  value={subjectCode}
                  onValueChange={(val) => setSubjectCode(val ?? "")}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Pilih mata pelajaran aktif..." />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--anchor-width)] min-w-[340px] sm:min-w-[420px] max-w-[90vw] rounded-md shadow-lg border">
                    {selectableSubjects.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        Belum ada mata pelajaran aktif. Tambahkan di menu Mata Pelajaran.
                      </div>
                    ) : (
                      selectableSubjects.map((s) => (
                        <SelectItem key={s.code} value={s.code} className="py-2">
                          <div className="flex items-center justify-between gap-3 w-full pr-1">
                            <span className="font-medium text-foreground">{s.name}</span>
                            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 shrink-0">
                              {s.code}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="institution" className="text-sm font-medium">
                    Lembaga Naungan
                  </Label>
                  {institution && (
                    <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                      {INSTITUTION_NAMES[institution]}
                    </span>
                  )}
                </div>
                <Select
                  items={INSTITUTIONS.map((inst) => ({
                    value: inst,
                    label: `${inst} — ${INSTITUTION_NAMES[inst]}`,
                  }))}
                  value={institution}
                  onValueChange={(val) => {
                    const inst = (val ?? "SMPITA") as Institution
                    setInstitution(inst)
                    setGradeLevel(INSTITUTION_LEVELS[inst]?.[0] ?? "")
                  }}
                >
                  <SelectTrigger id="institution">
                    <SelectValue placeholder="Pilih lembaga..." />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--anchor-width)] min-w-[300px] sm:min-w-[360px] rounded-md shadow-lg border">
                    {INSTITUTIONS.map((inst) => (
                      <SelectItem key={inst} value={inst} className="py-2">
                        <div className="flex items-center justify-between gap-3 w-full pr-1">
                          <span className="font-medium text-foreground">{inst}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0 truncate max-w-[200px]">
                            {INSTITUTION_NAMES[inst]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeLevel" className="text-sm font-medium">
                  Target Jenjang / Tingkat Kelas
                </Label>
                <Select
                  items={(INSTITUTION_LEVELS[institution] ?? []).map((lvl) => ({
                    value: lvl,
                    label: lvl,
                  }))}
                  value={gradeLevel}
                  onValueChange={(val) => setGradeLevel(val ?? "")}
                >
                  <SelectTrigger id="gradeLevel">
                    <SelectValue placeholder="Pilih tingkat kelas..." />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--anchor-width)] min-w-[240px] rounded-md shadow-lg border">
                    {INSTITUTION_LEVELS[institution]?.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Dipakai untuk memvalidasi kepesertaan santri saat sesi ujian berlangsung.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="totalPoints" className="text-sm font-medium">
                    Total Bobot Nilai
                  </Label>
                  <Input
                    id="totalPoints"
                    type="number"
                    min={1}
                    max={1000}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingScore" className="text-sm font-medium">
                    Batas Kelulusan (KKM)
                  </Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min={0}
                    max={totalPoints}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Deskripsi & Petunjuk Naskah (Opsional)
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Tuliskan petunjuk pengerjaan bagi santri atau catatan khusus pengajar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tahap 3: Pemilihan Alur Kerja Awal Pembuatan Soal */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-semibold">3. Tentukan Alur Kerja Setelah Paket Dibuat</Label>
            <p className="text-xs text-muted-foreground">
              Pilih metode penyusunan butir soal yang paling efektif untuk Anda saat ini.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedWorkflow("editor")}
              suppressHydrationWarning
              data-1p-ignore="true"
              className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                selectedWorkflow === "editor"
                  ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  <PenLineIcon className="h-5 w-5" />
                </div>
                {selectedWorkflow === "editor" && (
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="font-semibold text-foreground">Studio Penulisan Manual</div>
              <p className="text-xs text-muted-foreground">
                Tulis butir soal satu per satu langsung di editor (pilihan ganda, PG kompleks, benar/salah, essay).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWorkflow("ai")}
              suppressHydrationWarning
              data-1p-ignore="true"
              className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                selectedWorkflow === "ai"
                  ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                {selectedWorkflow === "ai" && (
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="font-semibold text-foreground">Bantuan AI Asisten</div>
              <p className="text-xs text-muted-foreground">
                Langsung buka asisten kecerdasan buatan untuk menyusun draf kisi-kisi dan butir soal HOTS/LOTS.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWorkflow("import")}
              suppressHydrationWarning
              data-1p-ignore="true"
              className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                selectedWorkflow === "import"
                  ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                  <FileSpreadsheetIcon className="h-5 w-5" />
                </div>
                {selectedWorkflow === "import" && (
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="font-semibold text-foreground">Impor Naskah Massal (Word & Excel)</div>
              <p className="text-xs text-muted-foreground">
                Mendukung dokumen teks Word bernomor maupun Impor Lembar Kerja Massal (Excel / TSV) untuk puluhan butir sekaligus.
              </p>
            </button>
          </div>
        </div>

        {/* Tombol Aksi Akhir */}
        <div className="flex flex-col-reverse gap-3 pt-4 border-t sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/bank-soal")}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !subjectCode}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            {isSubmitting ? "Menyimpan Paket..." : "Buat Paket & Lanjutkan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
