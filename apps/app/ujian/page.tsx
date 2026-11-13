"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  PlayIcon,
  ShieldCheckIcon,
  UserCheck2Icon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { AT_TAUHID_WATERMARK_BASE64 } from "@/lib/watermark-asset"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cleanStudentName } from "@/lib/rapor-utils"
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

const BAD_CHARS = /[^ABCDEFGHJKMNPQRSTUVWXYZ234567890-9]/g

/**
 * Membersihkan pesan error internal dari server/Convex agar user-friendly
 * dan tidak membocorkan prefix teknis seperti [CONVEX ...], Server Error, dsb.
 */
function cleanErrorMessage(error: unknown, fallback = "Terjadi kesalahan saat memproses data."): string {
  if (!error) return fallback
  const raw = typeof error === "string" ? error : (error as Error).message || fallback

  // Ekstrak pesan murni setelah 'Uncaught Error:' jika ada
  const uncaughtMatch = raw.match(/Uncaught Error:\s*([^\n\r]+)/i)
  if (uncaughtMatch && uncaughtMatch[1]) {
    return uncaughtMatch[1].replace(/\.?\s*Called by client.*$/i, ".").trim()
  }

  // Bersihkan prefix umum Convex & Server Error
  return (
    raw
      .replace(/^\[CONVEX[^\]]*\]\s*/i, "")
      .replace(/^\[Request ID:[^\]]*\]\s*/i, "")
      .replace(/^Server Error\s*/i, "")
      .replace(/^Error:\s*/i, "")
      .replace(/\.?\s*Called by client.*$/i, ".")
      .trim() || fallback
  )
}



export default function StudentExamEntryPage() {
  const { data: session } = authClient.useSession()

  // State tampilan bertahap:
  // step = 1 -> Form login (Nomor Induk + Token)
  // step = 2 -> Konfirmasi Data Santri (Benar vs Bukan Data Saya)
  // step = 3 -> Siap Memulai (Instruksi & Mulai Ujian)
  const [step, setStep] = React.useState<1 | 2 | 3>(1)

  // Input formulir
  const [nisn, setNisn] = React.useState("")
  const [token, setToken] = React.useState("")

  // Proteksi percobaan salah (rate limiting lokal)
  const [failedAttempts, setFailedAttempts] = React.useState(0)
  const [isLocked, setIsLocked] = React.useState(false)

  // Status submisi & sesi
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [enteredSession, setEnteredSession] = React.useState<ParticipantSession | null>(null)
  const [isExamStarted, setIsExamStarted] = React.useState(false)

  // Jam perangkat di bilah atas
  const [currentTime, setCurrentTime] = React.useState<string>("")
  React.useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date()
        setCurrentTime(
          now.toLocaleString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        )
      } catch {
        // Fallback jika locale id-ID belum siap
        setCurrentTime(new Date().toLocaleTimeString())
      }
    }
    updateTime()
    const interval = setInterval(updateTime, 20000)
    return () => clearInterval(interval)
  }, [])

  const enterSession = useMutation(api.examSession.public.mutations.enterExamSession)

  const cleanToken = token.trim().toUpperCase()
  const cleanNisn = nisn.trim()

  // Auto-lookup master data santri berdasarkan nomor identitas (NISN, NIS, atau ID Santri SiPAKSa)
  const lookedUpStudent = useQuery(
    api.students.public.queries.lookupStudent,
    cleanNisn.length >= 3 ? { identifier: cleanNisn } : "skip"
  )

  // Ambil 2 angka terakhir nomor identitas santri untuk validasi token
  const expectedStudentDigits = React.useMemo(() => {
    if (lookedUpStudent && "twoDigits" in lookedUpStudent && typeof lookedUpStudent.twoDigits === "string") {
      return lookedUpStudent.twoDigits
    }
    const digits = cleanNisn.replace(/\D/g, "")
    return digits.length >= 2 ? digits.slice(-2) : ""
  }, [lookedUpStudent, cleanNisn])

  // Verifikasi token sesi (hanya 6 karakter awal token sesi yang dikirim ke query)
  const sessionVerification = useQuery(
    api.examSession.public.queries.verifySessionToken,
    cleanToken.length >= 6 ? { token: cleanToken.slice(0, 6) } : "skip"
  ) as VerifiedSession | undefined

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Batasi maksimal 8 karakter (6 token sesi + 2 digit santri)
    const upper = e.target.value.toUpperCase().replace(BAD_CHARS, "").slice(0, 8)
    setToken(upper)
    if (submitError) setSubmitError(null)
  }

  // Langkah 1 -> Langkah 2 (Validasi Form & Periksa Data)
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault()

    if (isLocked) {
      toast.error("Akses dikunci sementara karena terlalu banyak percobaan. Hubungi pengawas.")
      return
    }

    if (!cleanNisn) {
      toast.error("Nomor Induk Santri (NISN / NIS / ID Santri) belum diisi.")
      return
    }

    if (cleanNisn.length >= 3 && lookedUpStudent === undefined) {
      toast.info("Sedang memeriksa nomor induk santri, mohon tunggu sebentar.")
      return
    }

    if (lookedUpStudent === null) {
      const nextFailed = failedAttempts + 1
      setFailedAttempts(nextFailed)
      if (nextFailed >= 5) {
        setIsLocked(true)
        setSubmitError("Terlalu banyak percobaan. Akses Anda dikunci sementara, hubungi pengawas ruang.")
      } else {
        setSubmitError(
          `Nomor Induk Santri tidak ditemukan dalam basis data pesantren. Pastikan nomor induk Anda benar atau hubungi pengawas. (Sisa percobaan: ${5 - nextFailed})`
        )
      }
      toast.error("Nomor Induk Santri tidak ditemukan dalam basis data pesantren.")
      return
    }

    if (cleanToken.length < 8) {
      toast.error("Token ujian belum lengkap (harus 8 karakter: 6 huruf token sesi + 2 angka nomor induk).")
      setSubmitError(
        "Token ujian belum lengkap. Masukkan 6 huruf token sesi diikuti 2 angka terakhir nomor induk Anda."
      )
      return
    }

    // Validasi kecocokan 2 digit terakhir token dengan nomor induk santri
    if (expectedStudentDigits && cleanToken.length === 8) {
      const suppliedDigits = cleanToken.slice(6, 8)
      if (suppliedDigits !== expectedStudentDigits) {
        const nextFailed = failedAttempts + 1
        setFailedAttempts(nextFailed)
        const msg =
          "2 angka terakhir token tidak cocok dengan nomor induk santri Anda. Pastikan memasukkan 6 huruf token sesi diikuti 2 angka terakhir nomor identitas Anda."
        if (nextFailed >= 5) {
          setIsLocked(true)
          setSubmitError("Terlalu banyak percobaan yang gagal. Akses dikunci sementara, hubungi pengawas ruang.")
        } else {
          setSubmitError(`${msg} (Sisa percobaan: ${5 - nextFailed})`)
        }
        toast.error(msg)
        return
      }
    }

    if (sessionVerification === undefined) {
      toast.info("Sedang memverifikasi token sesi, mohon tunggu beberapa saat.")
      return
    }

    if (sessionVerification && !sessionVerification.valid) {
      const nextFailed = failedAttempts + 1
      setFailedAttempts(nextFailed)
      const cleanMsg = cleanErrorMessage(sessionVerification.message, "Token ujian tidak valid.")
      if (nextFailed >= 5) {
        setIsLocked(true)
        setSubmitError("Terlalu banyak percobaan. Akses Anda dikunci sementara, hubungi pengawas ruang.")
      } else {
        setSubmitError(`${cleanMsg} (Sisa percobaan: ${5 - nextFailed})`)
      }
      toast.error(cleanMsg)
      return
    }

    setSubmitError(null)
    setStep(2)
  }

  // Langkah 2 -> Langkah 3 (Santri Konfirmasi "Benar, masuk ruang ujian")
  const handleConfirmAndEnter = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = await enterSession({
        token: cleanToken,
        nisn: cleanNisn,
        studentName: cleanStudentName(lookedUpStudent?.nama || cleanNisn),
        institution: lookedUpStudent?.jenjang as "SMPITA" | "SMAITA" | "MTA" | undefined,
        className: lookedUpStudent?.kelas,
      })

      setEnteredSession(result)
      setFailedAttempts(0)
      if (result.isResumed) {
        toast.info("Melanjutkan kembali sesi ujian Anda yang sedang berlangsung.")
      } else {
        toast.success("Identitas terkonfirmasi! Silakan bersiap memulai ujian.")
      }
      setStep(3)
    } catch (err: unknown) {
      const msg = cleanErrorMessage(err, "Gagal masuk ke sesi ujian.")
      const nextFailed = failedAttempts + 1
      setFailedAttempts(nextFailed)
      if (nextFailed >= 5) {
        setIsLocked(true)
        setSubmitError("Terlalu banyak percobaan yang gagal. Akses dikunci sementara, hubungi pengawas ruang.")
      } else {
        setSubmitError(`${msg} (Sisa percobaan: ${5 - nextFailed})`)
      }
      toast.error(msg)
      setStep(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Langkah 2: Santri menekan "Bukan data saya"
  const handleRejectData = () => {
    setToken("")
    setSubmitError("Jika data tadi bukan milik Anda, pastikan nomor induk yang Anda ketik sudah benar atau tanyakan kepada pengawas ruang.")
    setStep(1)
  }

  // Keterangan alasan tombol disabled di langkah 1
  const disabledReason = React.useMemo(() => {
    if (isLocked) return "Akses dikunci sementara. Hubungi pengawas."
    if (!cleanNisn) return "Nomor induk belum diisi."
    if (cleanNisn.length >= 3 && lookedUpStudent === undefined) return "Memeriksa identitas santri..."
    if (cleanNisn.length >= 3 && lookedUpStudent === null) return "Nomor induk tidak ditemukan."
    if (cleanToken.length < 8) {
      return `Token belum lengkap (${cleanToken.length}/8 karakter)`
    }
    if (
      expectedStudentDigits &&
      cleanToken.length === 8 &&
      cleanToken.slice(6, 8) !== expectedStudentDigits
    ) {
      return "2 angka terakhir token tidak cocok dengan nomor induk Anda."
    }
    if (sessionVerification && !sessionVerification.valid) {
      return cleanErrorMessage(sessionVerification.message, "Token ujian tidak valid.")
    }
    return null
  }, [isLocked, cleanNisn, lookedUpStudent, cleanToken, sessionVerification, expectedStudentDigits])

  // Jika santri sudah menekan tombol "Mulai ujian" di langkah 3, buka lembar soal
  if (isExamStarted && enteredSession) {
    return (
      <ExamWorksheet
        participantId={enteredSession.participantId}
        onExit={() => {
          setEnteredSession(null)
          setIsExamStarted(false)
          setStep(1)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f3f1] dark:bg-[#101412] text-[#1b1f1c] dark:text-[#e6ebe7] flex flex-col justify-between font-sans selection:bg-emerald-700 selection:text-white relative overflow-x-hidden">
      {/* Pola Latar Belakang Watermark Resmi (Sesuai Referensi HTML) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none dark:invert dark:opacity-[0.1]"
        style={{
          position: "fixed",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          zIndex: 0,
          backgroundImage: `url("${AT_TAUHID_WATERMARK_BASE64}")`,
          backgroundPosition: "0 0",
          backgroundSize: "120px 120px",
          backgroundRepeat: "repeat",
          opacity: 0.08,
          transform: "rotate(-18deg)",
        }}
      />

      {/* Header Bar Resmi */}
      <header className="relative z-10 bg-white dark:bg-[#181d1a] border-b border-[#cfd5cf] dark:border-[#323a34]">
        <div className="max-w-[920px] mx-auto px-5 py-3 flex items-center gap-3.5">
          <div className="relative size-11 shrink-0 drop-shadow-sm flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo e-IMTIHAN At-Tauhid"
              width={44}
              height={44}
              className="object-contain size-11"
              priority
            />
          </div>
          <div className="leading-tight">
            <b className="block text-base tracking-tight font-bold text-[#1b1f1c] dark:text-[#e6ebe7]">
              e-IMTIHAN
            </b>
            <span className="text-[13px] text-[#5f675f] dark:text-[#9aa49c]">
              Pesantren Islamic Centre At-Tauhid
            </span>
          </div>

          {/* Jam Waktu Perangkat */}
          {currentTime && (
            <time className="ml-auto text-[13px] text-[#5f675f] dark:text-[#9aa49c] hidden sm:block tabular-nums font-medium">
              {currentTime}
            </time>
          )}

          {/* Akses Cepat Guru jika sedang login */}
          {session?.user && (
            <div className="ml-auto sm:ml-4 flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-medium border-emerald-700/40 text-emerald-800 dark:text-emerald-300">
                Mode Pengajar
              </Badge>
              <Link
                href="/sesi-ujian"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-emerald-700/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                <ArrowLeftIcon className="size-3" />
                <span>Kembali ke Dashboard</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Kontainer Utama 2 Kolom (Sesuai Referensi HTML) */}
      <div className="max-w-[920px] w-full mx-auto my-6 sm:my-8 px-5 grid grid-cols-1 md:grid-cols-[1fr_380px] gap-8 md:gap-10 items-start relative z-10">
        {/* Panel Kiri: Form & Wizard */}
        <main className="bg-white dark:bg-[#181d1a] border border-[#cfd5cf] dark:border-[#323a34] rounded p-6 sm:p-7 shadow-xs">
          {/* Banner Peringatan Error / Gagal */}
          {submitError && (
            <div
              className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg text-sm flex items-start gap-2.5 shadow-2xs"
              role="alert"
            >
              <AlertCircleIcon className="size-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="leading-relaxed text-[13px] font-medium">{submitError}</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAHAP 1: INPUT NOMOR INDUK & TOKEN UJIAN                        */}
          {/* ============================================================== */}
          {step === 1 && (
            <section id="v1">
              <h1 className="text-xl sm:text-[22px] font-bold text-[#1b1f1c] dark:text-[#e6ebe7] mb-1">
                Masuk ujian
              </h1>
              <p className="text-sm text-[#5f675f] dark:text-[#9aa49c] mb-5">
                Masukkan nomor induk dan token dari pengawas.
              </p>

              <form onSubmit={handleProceedToConfirm} suppressHydrationWarning autoComplete="off">
                {/* 1. Nomor Induk Santri */}
                <div className="mb-4">
                  <label htmlFor="nisn" className="block font-semibold text-sm mb-1.5">
                    Nomor induk santri
                  </label>
                  <Input
                    id="nisn"
                    name="nisn"
                    autoComplete="off"
                    data-1p-ignore="true"
                    placeholder="Contoh: 24.02.001 atau NISN"
                    value={nisn}
                    onChange={(e) => {
                      setNisn(e.target.value)
                      if (submitError) setSubmitError(null)
                    }}
                    disabled={isLocked}
                    className="w-full text-sm font-mono px-3 py-2 border border-[#8d978f] dark:border-[#4a554c] rounded focus-visible:outline-2 focus-visible:outline-emerald-800"
                    required
                  />
                  <div className="text-xs text-[#5f675f] dark:text-[#9aa49c] mt-1">
                    NISN, NIS, atau ID santri pada kartu peserta.
                  </div>
                  {lookedUpStudent && (
                    <div className="mt-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2Icon className="size-3.5 shrink-0 text-emerald-700" />
                        <span>
                          Santri Terverifikasi: <strong>{cleanStudentName(lookedUpStudent.nama)}</strong> ({lookedUpStudent.jenjang} - {lookedUpStudent.kelas})
                        </span>
                      </div>
                      <div className="text-[11.5px] text-emerald-900/80 dark:text-emerald-200/80 pl-5">
                        Gunakan 2 angka terakhir NISN Anda pada 2 karakter terakhir token ujian.
                      </div>
                    </div>
                  )}
                  {cleanNisn.length >= 3 && lookedUpStudent === undefined && (
                    <div className="mt-2 text-xs text-[#5f675f] dark:text-[#9aa49c] flex items-center gap-1.5">
                      <Loader2Icon className="size-3.5 shrink-0 animate-spin text-emerald-700" />
                      <span>Memeriksa nomor induk di basis data...</span>
                    </div>
                  )}
                  {cleanNisn.length >= 3 && lookedUpStudent === null && (
                    <div className="mt-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-2 rounded flex items-center gap-1.5">
                      <AlertCircleIcon className="size-3.5 shrink-0 text-amber-600" />
                      <span>
                        Nomor induk tidak ditemukan dalam data santri pesantren.
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Token Ujian */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="token" className="block font-semibold text-sm">
                      Token ujian
                    </label>
                    <span className="text-xs font-mono text-[#5f675f] dark:text-[#9aa49c]">
                      {cleanToken.length}/8 karakter
                    </span>
                  </div>
                  <Input
                    id="token"
                    name="token"
                    maxLength={8}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    data-1p-ignore="true"
                    placeholder="Misal: 7K2M3P"
                    value={token}
                    onChange={handleTokenChange}
                    disabled={isLocked}
                    className="w-full font-mono text-lg tracking-[0.25em] text-center uppercase py-5 border border-[#8d978f] dark:border-[#4a554c] rounded placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/35 focus-visible:outline-2 focus-visible:outline-emerald-800"
                    required
                  />
                  <div className="text-xs text-[#5f675f] dark:text-[#9aa49c] mt-1.5 leading-relaxed">
                    6 huruf token dari pengawas + 2 angka terakhir nomor induk Anda. Huruf O, I, L dan angka 0, 1 tidak dipakai pada token sesi.
                  </div>
                </div>

                {/* Tombol Lanjut */}
                <Button
                  type="submit"
                  disabled={
                    isLocked ||
                    cleanNisn.length < 3 ||
                    cleanToken.length < 8 ||
                    lookedUpStudent === undefined ||
                    lookedUpStudent === null ||
                    (sessionVerification !== undefined && !sessionVerification.valid) ||
                    Boolean(
                      expectedStudentDigits &&
                        cleanToken.length === 8 &&
                        cleanToken.slice(6, 8) !== expectedStudentDigits
                    )
                  }
                  className="w-full font-semibold py-2.5 px-3.5 bg-[#0b4a2a] hover:bg-[#093a21] disabled:bg-[#0b4a2a]/40 text-white rounded transition-colors text-sm"
                >
                  Lanjut
                </Button>

                {disabledReason && (
                  <div className="text-xs text-[#5f675f] dark:text-[#9aa49c] mt-2.5 text-center">
                    {disabledReason}
                  </div>
                )}
              </form>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAHAP 2: PERIKSA DATA ANDA (BENAR vs BUKAN DATA SAYA)           */}
          {/* ============================================================== */}
          {step === 2 && (
            <section id="v2">
              <h1 className="text-xl sm:text-[22px] font-bold text-[#1b1f1c] dark:text-[#e6ebe7] mb-1">
                Periksa data Anda
              </h1>
              <p className="text-sm text-[#5f675f] dark:text-[#9aa49c] mb-5">
                Apakah data berikut sesuai dengan kartu peserta ujian Anda?
              </p>

              <dl className="mb-5 border-t border-[#cfd5cf] dark:border-[#323a34]">
                <div className="grid grid-cols-[110px_1fr] py-2.5 border-b border-[#cfd5cf] dark:border-[#323a34] text-sm">
                  <dt className="text-[#5f675f] dark:text-[#9aa49c]">Nama</dt>
                  <dd className="m-0 font-semibold text-[#1b1f1c] dark:text-[#e6ebe7]">
                    {lookedUpStudent?.nama ? cleanStudentName(lookedUpStudent.nama) : "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-[110px_1fr] py-2.5 border-b border-[#cfd5cf] dark:border-[#323a34] text-sm">
                  <dt className="text-[#5f675f] dark:text-[#9aa49c]">Nomor induk</dt>
                  <dd className="m-0 font-semibold font-mono text-[#1b1f1c] dark:text-[#e6ebe7]">
                    {cleanNisn}
                  </dd>
                </div>
                <div className="grid grid-cols-[110px_1fr] py-2.5 border-b border-[#cfd5cf] dark:border-[#323a34] text-sm">
                  <dt className="text-[#5f675f] dark:text-[#9aa49c]">Lembaga</dt>
                  <dd className="m-0 font-semibold text-[#1b1f1c] dark:text-[#e6ebe7]">
                    {lookedUpStudent?.jenjang || "-"}
                  </dd>
                </div>
                <div className="grid grid-cols-[110px_1fr] py-2.5 border-b border-[#cfd5cf] dark:border-[#323a34] text-sm">
                  <dt className="text-[#5f675f] dark:text-[#9aa49c]">Kelas</dt>
                  <dd className="m-0 font-semibold text-[#1b1f1c] dark:text-[#e6ebe7]">
                    {lookedUpStudent?.kelas || "-"}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleConfirmAndEnter}
                  disabled={isSubmitting}
                  className="w-full font-semibold py-2.5 px-3.5 bg-[#0b4a2a] hover:bg-[#093a21] text-white rounded transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Memvalidasi Sesi...
                    </>
                  ) : (
                    <>
                      <UserCheck2Icon className="size-4" />
                      Benar, masuk ruang ujian
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRejectData}
                  disabled={isSubmitting}
                  className="w-full font-semibold py-2.5 px-3.5 bg-transparent border border-[#cfd5cf] dark:border-[#323a34] text-[#1b1f1c] dark:text-[#e6ebe7] hover:bg-[#f2f3f1] dark:hover:bg-[#323a34]/40 rounded transition-colors text-sm flex items-center justify-center gap-1.5"
                >
                  <XCircleIcon className="size-4 text-[#a8261d]" />
                  Bukan data saya
                </Button>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* TAHAP 3: SIAP MEMULAI                                           */}
          {/* ============================================================== */}
          {step === 3 && enteredSession && (
            <section id="v3">
              <h1 className="text-xl sm:text-[22px] font-bold text-[#1b1f1c] dark:text-[#e6ebe7] mb-1">
                Siap memulai
              </h1>
              <div className="bg-[#e8f1ea] dark:bg-[#17291e] text-[#0b4a2a] dark:text-[#8fd9ad] p-3 border-l-4 border-[#0b4a2a] dark:border-[#8fd9ad] mb-4 text-sm rounded-r flex items-center gap-2 font-medium">
                <CheckCircle2Icon className="size-4 shrink-0" />
                <span>
                  {enteredSession.studentName} · Identitas terkonfirmasi.
                </span>
              </div>

              <dl className="mb-4 border-t border-[#cfd5cf] dark:border-[#323a34]">
                <div className="grid grid-cols-[110px_1fr] py-2.5 border-b border-[#cfd5cf] dark:border-[#323a34] text-sm">
                  <dt className="text-[#5f675f] dark:text-[#9aa49c]">Ujian</dt>
                  <dd className="m-0 font-semibold text-[#1b1f1c] dark:text-[#e6ebe7]">
                    {enteredSession.sessionTitle}
                  </dd>
                </div>
                <div className="grid grid-cols-[110px_1fr] py-2.5 border-b border-[#cfd5cf] dark:border-[#323a34] text-sm">
                  <dt className="text-[#5f675f] dark:text-[#9aa49c]">Durasi</dt>
                  <dd className="m-0 font-semibold text-[#1b1f1c] dark:text-[#e6ebe7]">
                    {enteredSession.durationMinutes} menit
                  </dd>
                </div>
              </dl>

              <p className="text-xs sm:text-sm text-[#5f675f] dark:text-[#9aa49c] mb-5 leading-relaxed">
                Waktu pengerjaan akan mulai berjalan mundur sejak tombol ditekan. Seluruh jawaban Anda tersimpan otomatis di server.
              </p>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={() => {
                    setIsExamStarted(true)
                    toast.success("Mempersiapkan lembar soal ujian...")
                  }}
                  className="w-full font-semibold py-2.5 px-3.5 bg-[#0b4a2a] hover:bg-[#093a21] text-white rounded transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <PlayIcon className="size-4" />
                  Mulai ujian
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEnteredSession(null)
                    setStep(1)
                  }}
                  className="w-full font-normal py-2 text-xs border border-transparent text-[#5f675f] dark:text-[#9aa49c] hover:underline"
                >
                  Ganti identitas atau token
                </Button>
              </div>
            </section>
          )}
        </main>

        {/* Panel Kanan: Petunjuk & Cara Masuk (Sesuai Referensi HTML <aside>) */}
        <aside className="pt-1.5 order-last text-sm leading-relaxed text-[#1b1f1c] dark:text-[#e6ebe7]">
          <h2 className="text-[15px] font-bold mb-2.5 text-[#1b1f1c] dark:text-[#e6ebe7]">
            Cara masuk
          </h2>
          <ol className="mb-5 pl-5 list-decimal space-y-1.5 text-[13.5px] text-[#5f675f] dark:text-[#9aa49c]">
            <li>Isi nomor induk santri dan token dari pengawas ruang.</li>
            <li>Token ujian terdiri dari 6 huruf sesi + 2 angka terakhir identitas Anda.</li>
            <li>Periksa nama, lembaga, dan kelas yang tampil di layar.</li>
            <li>Tekan tombol mulai ujian setelah pengawas memberi aba-aba.</li>
          </ol>

          <h2 className="text-[15px] font-bold mb-2.5 text-[#1b1f1c] dark:text-[#e6ebe7]">
            Selama ujian
          </h2>
          <ul className="mb-5 pl-5 list-disc space-y-1.5 text-[13.5px] text-[#5f675f] dark:text-[#9aa49c]">
            <li>Gunakan satu perangkat komputer atau tablet saja.</li>
            <li>Token bersifat pribadi dan tidak dapat digunakan santri lain.</li>
            <li>Dilarang berpindah jendela atau menutup halaman ujian.</li>
          </ul>

          <div className="p-3 bg-white/70 dark:bg-[#181d1a]/70 border border-[#cfd5cf] dark:border-[#323a34] rounded text-xs text-[#5f675f] dark:text-[#9aa49c] leading-relaxed">
            Tidak bisa masuk atau salah nomor induk? Segera beri tahu pengawas ruang. Akses masuk dikunci sementara setelah 5 kali salah memasukkan token.
          </div>
        </aside>
      </div>

      {/* Footer Bersih */}
      <footer className="max-w-[920px] w-full mx-auto px-5 py-4 text-xs text-[#5f675f] dark:text-[#9aa49c] relative z-10 text-center sm:text-left border-t border-[#cfd5cf]/60 dark:border-[#323a34]/60 mt-auto">
        Pesantren Islamic Centre At-Tauhid · Ujian Berbasis Komputer (CBA)
      </footer>
    </div>
  )
}
