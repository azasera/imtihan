"use client"

import * as React from "react"
import Image from "next/image"
import { useMutation, useQuery } from "convex/react"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  Building2Icon,
  CheckCircle2Icon,
  ClockIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  LayersIcon,
  Loader2Icon,
  LockIcon,
  PlayIcon,
  SchoolIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
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
import { ExamWorksheet } from "./ExamWorksheet"

interface VerifiedSession {
  valid: boolean
  message?: string
  sessionId?: Id<"examSessions">
  title?: string
  durationMinutes?: number
  startTime?: string
  endTime?: string
  subjectCode?: string
  gradeLevel?: string
  totalQuestions?: number
  randomizeQuestions?: boolean
  randomizeOptions?: boolean
}

interface ParticipantSession {
  participantId: Id<"examParticipants">
  sessionId: Id<"examSessions">
  sessionTitle: string
  durationMinutes: number
  startedAt: number
  studentName: string
  nisn: string
  isResumed: boolean
}

type LembagaType = "SMPITA" | "SMAITA" | "MTA" | ""

export default function StudentExamEntryPage() {
  // 1. Nomor Induk Santri (NISN / NIS / ID Santri)
  const [nisn, setNisn] = React.useState("")
  // 2. Pilih Lembaga (SMPITA, SMAITA, MTA)
  const [institutionInput, setInstitutionInput] = React.useState<LembagaType>("")
  // 3. Pilih Kelas (Dinamis bergantung lembaga)
  const [classNameInput, setClassNameInput] = React.useState("")
  // 4. Nama Lengkap Santri
  const [studentNameInput, setStudentNameInput] = React.useState("")
  // 5. Token Ujian 6 Karakter
  const [token, setToken] = React.useState("")

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [enteredSession, setEnteredSession] = React.useState<ParticipantSession | null>(null)
  const [isExamStarted, setIsExamStarted] = React.useState(false)

  const enterSession = useMutation(api.examSession.public.mutations.enterExamSession)

  const cleanToken = token.trim().toUpperCase()

  // Auto-lookup master data santri berdasarkan nomor identitas (NISN, NIS, atau ID Santri SiPAKSa)
  const lookedUpStudent = useQuery(
    api.students.public.queries.lookupStudent,
    nisn.trim().length >= 3 ? { identifier: nisn.trim() } : "skip"
  )

  // Master data menang atas isian manual selama nomor induk cocok, jadi ketiga
  // fields ini diturunkan langsung tanpa efek sinkronisasi.
  const institution = lookedUpStudent?.jenjang || institutionInput
  const className = lookedUpStudent?.kelas || classNameInput
  const studentName = lookedUpStudent?.nama || studentNameInput

  // Mengambil daftar kelas resmi dari database yang sesuai dengan lembaga yang dipilih
  const availableClasses = useQuery(
    api.students.public.queries.getClassesByLembaga,
    institution ? { jenjang: institution as "SMPITA" | "SMAITA" | "MTA" } : "skip"
  )

  // Pergantian lembaga wajib mengosongkan pilihan kelas sebelumnya
  const handleInstitutionChange = (newVal: LembagaType | null) => {
    const nextInstitution = (newVal ?? "") as LembagaType
    setInstitutionInput(nextInstitution)
    setClassNameInput("") // Kosongkan pilihan kelas sebelumnya
  }

  // Verifikasi token 6 digit secara real-time via Convex query
  const sessionVerification = useQuery(
    api.examSession.public.queries.verifySessionToken,
    cleanToken.length === 6 ? { token: cleanToken } : "skip"
  ) as VerifiedSession | undefined

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Otomatis uppercase dan batasi maksimal 6 karakter alfanumerik
    const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
    setToken(upper)
  }

  const handleEnterExam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nisn.trim()) {
      toast.error("Nomor Induk Santri (NISN / NIS / ID Santri) wajib diisi.")
      return
    }

    if (!institution) {
      toast.error("Silakan pilih lembaga pendidikan (SMPITA, SMAITA, atau MTA).")
      return
    }

    if (!className.trim()) {
      toast.error("Silakan pilih kelas santri yang sesuai.")
      return
    }

    if (!studentName.trim()) {
      toast.error("Nama lengkap santri wajib diisi.")
      return
    }

    if (cleanToken.length !== 6) {
      toast.error("Token ujian harus terdiri dari 6 karakter alfanumerik.")
      return
    }

    if (sessionVerification && !sessionVerification.valid) {
      toast.error(sessionVerification.message || "Token ujian tidak valid.")
      return
    }

    setIsSubmitting(true)
    try {
      const result = await enterSession({
        token: cleanToken,
        nisn: nisn.trim(),
        studentName: studentName.trim(),
        institution: institution as "SMPITA" | "SMAITA" | "MTA",
        className: className.trim(),
      })

      setEnteredSession(result)
      if (result.isResumed) {
        toast.info("Melanjutkan kembali sesi ujian Anda yang sedang berlangsung.")
      } else {
        toast.success("Berhasil masuk ke ruang ujian! Silakan baca instruksi berikut.")
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal masuk ke sesi ujian.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gabungkan kelas dari database dengan kelas santri terverifikasi jika cocok.
  // Wajib berada di atas early return di bawah agar urutan hook konsisten tiap render.
  const combinedClasses: string[] = React.useMemo(() => {
    const list = availableClasses ? [...availableClasses] : []
    if (lookedUpStudent?.kelas && lookedUpStudent?.jenjang === institution) {
      if (!list.includes(lookedUpStudent.kelas)) {
        list.unshift(lookedUpStudent.kelas)
      }
    }
    return list
  }, [availableClasses, lookedUpStudent, institution])

  // Jika santri sudah menekan tombol mulai, tampilkan lembar pengerjaan soal langsung
  if (isExamStarted && enteredSession) {
    return (
      <ExamWorksheet
        participantId={enteredSession.participantId}
        onExit={() => {
          setEnteredSession(null)
          setIsExamStarted(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950/10 via-background to-muted/30 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Brand Header dengan Palet Hijau Zamrud & Sentuhan Aksen Emas */}
      <div className="flex flex-col items-center text-center mb-6 space-y-2">
        <div className="relative size-16 sm:size-20 mb-1 drop-shadow-sm flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo E-Imtihan At-Tauhid"
            width={80}
            height={80}
            className="object-contain w-16 h-16 sm:w-20 sm:h-20"
            priority
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          <SparklesIcon className="size-3 text-amber-500 fill-amber-500" />
          <span>Pesantren Islamic Centre At-Tauhid</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-emerald-950 dark:text-emerald-100">
          Ruang Ujian Santri
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Gerbang Ujian Berbasis Komputer (CBA) Pesantren At-Tauhid. Lengkapi nomor induk, lembaga, kelas resmi, dan token ujian Anda.
        </p>
      </div>

      {!enteredSession ? (
        /* Formulir Masuk Ujian Berurutan (A s.d. F) */
        <Card className="w-full max-w-lg border-emerald-600/20 shadow-md shadow-emerald-900/5 bg-card">
          <CardHeader className="pb-4 border-b border-emerald-950/10 dark:border-emerald-800/20 bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-amber-500/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <ShieldCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                Konfirmasi Identitas & Token
              </CardTitle>
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 font-medium">
                Pintu Ujian
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Isi data santri secara benar sesuai data resmi pesantren sebelum menekan konfirmasi.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleEnterExam} suppressHydrationWarning autoComplete="off">
            <CardContent className="space-y-4 pt-5">
              {/* 1. Nomor Induk Santri (NISN / NIS / ID Santri) */}
              <div className="space-y-1.5">
                <Label htmlFor="nisn" className="text-xs font-semibold flex items-center gap-1.5">
                  <UserIcon className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                  1. Nomor Induk Santri (NISN / NIS / ID Santri) *
                </Label>
                <Input
                  id="nisn"
                  name="nisn"
                  autoComplete="off"
                  data-1p-ignore="true"
                  placeholder="Contoh: 0123456789 atau 24.02.001..."
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  className="font-mono text-xs sm:text-sm border-emerald-600/30 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
                  required
                />
                {lookedUpStudent && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                    <CheckCircle2Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Santri Terverifikasi: <strong>{lookedUpStudent.nama}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Pilih Lembaga (SMPITA, SMAITA, MTA) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="institution-select" className="text-xs font-semibold flex items-center gap-1.5">
                    <SchoolIcon className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                    2. Pilih Lembaga *
                  </Label>
                  {lookedUpStudent && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <LockIcon className="size-3" />
                      Terkunci Otomatis (Master Santri)
                    </span>
                  )}
                </div>
                <Select
                  value={institution}
                  onValueChange={handleInstitutionChange}
                  disabled={!!lookedUpStudent}
                >
                  <SelectTrigger
                    id="institution-select"
                    className="w-full text-xs sm:text-sm border-emerald-600/30 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <SelectValue placeholder="Pilih lembaga pendidikan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMPITA">SMPITA (SMP Islam Terpadu At-Tauhid)</SelectItem>
                    <SelectItem value="SMAITA">SMAITA (SMA Islam Terpadu At-Tauhid)</SelectItem>
                    <SelectItem value="MTA">MTA (Madrasah Tarbiyatul Aimmah)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Pilih Kelas (Dinamis bergantung lembaga yang dipilih) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student-class" className="text-xs font-semibold flex items-center gap-1.5">
                    <LayersIcon className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                    3. Pilih Kelas *
                  </Label>
                  {lookedUpStudent ? (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <LockIcon className="size-3" />
                      Terkunci Otomatis (Master Santri)
                    </span>
                  ) : !institution ? (
                    <span className="text-[11px] text-muted-foreground italic">
                      Pilih lembaga terlebih dahulu
                    </span>
                  ) : null}
                </div>
                <Select
                  value={className}
                  onValueChange={(val) => setClassNameInput(val ?? "")}
                  disabled={!!lookedUpStudent || !institution}
                >
                  <SelectTrigger
                    id="student-class"
                    className="w-full text-xs sm:text-sm border-emerald-600/30 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <SelectValue
                      placeholder={
                        !institution
                          ? "Pilihan kelas dinonaktifkan hingga lembaga dipilih"
                          : availableClasses === undefined
                          ? "Memuat data kelas resmi..."
                          : combinedClasses.length === 0
                          ? "Kelas belum tersedia di database"
                          : "Pilih kelas santri..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {combinedClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls} ({institution})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Pesan informatif jika data kelas pada lembaga tersebut belum tersedia di database */}
                {institution && availableClasses !== undefined && combinedClasses.length === 0 && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-md text-xs text-amber-900 dark:text-amber-200 mt-1">
                    <AlertTriangleIcon className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Data kelas untuk lembaga <strong>{institution}</strong> belum tersedia di basis data. Hubungi pengawas ujian atau ustadz untuk melakukan sinkronisasi data santri terlebih dahulu.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Nama Lengkap Santri */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student-name" className="text-xs font-semibold flex items-center gap-1.5">
                    <GraduationCapIcon className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                    4. Nama Lengkap Santri *
                  </Label>
                  {lookedUpStudent && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <LockIcon className="size-3" />
                      Terkunci Otomatis (Master Santri)
                    </span>
                  )}
                </div>
                <Input
                  id="student-name"
                  name="studentName"
                  autoComplete="off"
                  data-1p-ignore="true"
                  placeholder="Nama lengkap sesuai daftar hadir ujian..."
                  value={studentName}
                  onChange={(e) => setStudentNameInput(e.target.value)}
                  readOnly={!!lookedUpStudent}
                  className={`text-xs sm:text-sm border-emerald-600/30 ${
                    lookedUpStudent ? "bg-muted/50 cursor-not-allowed font-medium" : ""
                  }`}
                  required
                />
              </div>

              {/* 5. Token Ujian 6 Karakter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="exam-token" className="text-xs font-semibold flex items-center gap-1.5">
                    <KeyRoundIcon className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                    5. Token Ujian 6 Karakter *
                  </Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {cleanToken.length}/6 Karakter
                  </span>
                </div>
                <Input
                  id="exam-token"
                  name="examToken"
                  autoComplete="off"
                  data-1p-ignore="true"
                  placeholder="MASUKKAN TOKEN (MISAL: 8K2M3P)"
                  value={token}
                  onChange={handleTokenChange}
                  maxLength={6}
                  className="font-mono text-center tracking-widest text-base sm:text-lg uppercase font-bold py-5 border-emerald-600/40 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20"
                  required
                />
              </div>

              {/* Kotak Pratinjau Status Verifikasi Token */}
              {cleanToken.length === 6 && (
                <div className="pt-1">
                  {sessionVerification === undefined ? (
                    <div className="p-3 rounded-lg border bg-muted/40 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2Icon className="size-4 animate-spin text-emerald-600" />
                      <span>Memverifikasi token sesi di server...</span>
                    </div>
                  ) : sessionVerification.valid ? (
                    <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                        <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
                        <span>Sesi Ujian Ditemukan & Siap Diakses</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200 dark:border-emerald-900/40">
                        <div>
                          <span className="text-muted-foreground">Judul Ujian:</span>
                          <div className="font-semibold text-foreground truncate">
                            {sessionVerification.title}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Mata Pelajaran:</span>
                          <div className="font-semibold text-foreground">
                            {sessionVerification.subjectCode}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Durasi Waktu:</span>
                          <div className="font-semibold text-foreground">
                            {sessionVerification.durationMinutes} Menit
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Jumlah Soal:</span>
                          <div className="font-semibold text-foreground">
                            {sessionVerification.totalQuestions} Butir
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-xs flex items-start gap-2 text-destructive">
                      <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Token Tidak Dapat Digunakan</div>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          {sessionVerification.message || "Token tidak valid atau sesi belum aktif."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* 6. Tombol Konfirmasi & Masuk Ruang Ujian */}
            <CardFooter className="pt-2 border-t flex flex-col gap-2">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !institution ||
                  !className ||
                  cleanToken.length !== 6 ||
                  (sessionVerification !== undefined && !sessionVerification.valid)
                }
                className="w-full gap-2 py-5 text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Memverifikasi & Menghubungkan...
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon className="size-4" />
                    Konfirmasi & Masuk Ruang Ujian
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Pastikan nomor induk, lembaga, dan kelas Anda telah sesuai dengan kartu peserta ujian.
              </p>
            </CardFooter>
          </form>
        </Card>
      ) : (
        /* Kartu Instruksi & Tata Tertib Ujian */
        <Card className="w-full max-w-xl border border-emerald-600/30 shadow-md">
          <CardHeader className="pb-3 border-b bg-emerald-500/10">
            <div className="flex items-center justify-between gap-2">
              <Badge className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] gap-1">
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                Terhubung ke Sesi Ujian
              </Badge>
              <Badge variant="outline" className="font-mono text-xs border-amber-500/40 text-amber-800 dark:text-amber-300">
                {enteredSession.durationMinutes} Menit
              </Badge>
            </div>
            <CardTitle className="text-lg font-heading mt-2 text-emerald-950 dark:text-emerald-100">
              {enteredSession.sessionTitle}
            </CardTitle>
            <CardDescription className="text-xs">
              Silakan baca petunjuk tata tertib pelaksanaan ujian dengan seksama sebelum menekan tombol mulai.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 text-xs">
            {/* Rincian Peserta */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border">
              <div>
                <span className="text-muted-foreground text-[11px]">Nama Santri:</span>
                <div className="font-semibold text-foreground text-sm">{enteredSession.studentName}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Nomor Induk (NISN/NIS):</span>
                <div className="font-mono font-semibold text-foreground text-sm">{enteredSession.nisn}</div>
              </div>
            </div>

            {/* Tata Tertib */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <BookOpenIcon className="size-4 text-emerald-700 dark:text-emerald-400" />
                Tata Tertib & Petunjuk Ujian CBA:
              </h4>
              <ul className="space-y-1.5 text-muted-foreground pl-5 list-decimal text-[11px] leading-relaxed">
                <li>Awali pengerjaan dengan membaca doa agar diberikan kemudahan dan pemahaman.</li>
                <li>Waktu pengerjaan akan mulai berjalan mundur segera setelah Anda menekan tombol mulai.</li>
                <li>Jawaban Anda tersimpan secara otomatis (auto-save) ke server setiap kali Anda memilih opsi.</li>
                <li>Dilarang membuka halaman atau aplikasi lain selama ujian berlangsung.</li>
                <li>Jika waktu habis, lembar jawaban Anda akan otomatis dikumpulkan oleh sistem.</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnteredSession(null)}
              className="w-full sm:w-auto text-xs"
            >
              Ganti Identitas / Token
            </Button>
            <Button
              size="default"
              className="w-full sm:w-auto gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => {
                setIsExamStarted(true)
                toast.success("Mempersiapkan lembar soal ujian...")
              }}
            >
              <PlayIcon className="size-3.5" />
              Mulai Mengerjakan Ujian
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
