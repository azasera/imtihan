"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FileCheckIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  Loader2Icon,
  LockIcon,
  SendIcon,
  ShieldAlertIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { formatSavedAnswerCount } from "@/lib/session-integrity"
import { playIntegrityAlert } from "@/lib/audio-alert"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface ExamWorksheetProps {
  participantId: Id<"examParticipants">
  onExit: () => void
}

interface StudentAnswerState {
  selectedOptionId?: string
  selectedOptionIds?: string[]
  essayAnswer?: string
  isDoubtful: boolean
}

export function ExamWorksheet({ participantId, onExit }: ExamWorksheetProps) {
  const sheet = useQuery(api.examSession.public.queries.getStudentExamSheet, {
    participantId,
  })

  const saveAnswer = useMutation(api.examSession.public.mutations.saveStudentAnswer)
  const submitExam = useMutation(api.examSession.public.mutations.submitStudentExam)
  const recordViolation = useMutation(api.examSession.public.mutations.recordTabViolation)

  // Indeks pertanyaan yang sedang aktif dilihat santri (0-based)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  // Jawaban yang sudah diketuk santri pada perangkat ini. Jawaban tersimpan dibaca
  // langsung dari query, jadi tidak perlu disalin ke state lewat efek.
  const [answerEdits, setAnswerEdits] = React.useState<Record<string, StudentAnswerState>>({})

  // Status sinkronisasi auto-save ("saved" | "saving" | "error")
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "error">("saved")
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false)
  const [isSubmittingFinal, setIsSubmittingFinal] = React.useState(false)
  const [hasSubmittedLocally, setHasSubmittedLocally] = React.useState(false)

  // Anti-cheat: modal dialog & jumlah pelanggaran hasil catatan lokal
  const [localViolationCount, setLocalViolationCount] = React.useState<number | null>(null)
  const [isViolationModalOpen, setIsViolationModalOpen] = React.useState(false)

  // Satu perpindahan hanya dihitung sekali sampai santri benar-benar kembali.
  const isAwayRef = React.useRef(false)

  // Mobile drawer/sheet state toggles
  const [mobileStimulusOpen, setMobileStimulusOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  // Sisa waktu pengerjaan dalam detik; hanya diisi dari callback waktu (lihat efek timer).
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null)

  // Simpan cache data peserta dan sesi agar tidak pernah kosong saat transisi refetch query
  const cachedParticipantRef = React.useRef(sheet?.participant)
  const cachedSessionRef = React.useRef(sheet?.session)

  if (sheet?.participant) {
    cachedParticipantRef.current = sheet.participant
  }
  if (sheet?.session) {
    cachedSessionRef.current = sheet.session
  }

  const completionParticipant = sheet?.participant ?? cachedParticipantRef.current
  const completionSession = sheet?.session ?? cachedSessionRef.current

  const isCompleted = hasSubmittedLocally || !!sheet?.isSubmitted

  // Lembar yang masih bisa dikerjakan (belum selesai dan sesi belum ditutup)
  const activeSheet =
    sheet && sheet.found && !sheet.isSubmitted && !sheet.isEnded ? sheet : null

  const isLocked = activeSheet?.isLocked === true

  const serverAnswers = React.useMemo(() => {
    const initialMap: Record<string, StudentAnswerState> = {}

    for (const ans of activeSheet?.answers ?? []) {
      initialMap[ans.questionId] = {
        selectedOptionId: ans.selectedOptionId,
        selectedOptionIds: ans.selectedOptionIds,
        essayAnswer: ans.essayAnswer,
        isDoubtful: ans.isDoubtful,
      }
    }

    return initialMap
  }, [activeSheet])

  const answersMap = React.useMemo(
    () => ({ ...serverAnswers, ...answerEdits }),
    [serverAnswers, answerEdits]
  )

  const violationsCount = localViolationCount ?? activeSheet?.participant?.tabViolations ?? 0

  // Proteksi Integritas Ujian (Deteksi Perpindahan Tab / Window Blur)
  React.useEffect(() => {
    if (isCompleted || sheet?.isSubmitted || !sheet?.found || isLocked) return

    isAwayRef.current = false

    const recordAwayOnce = () => {
      if (isAwayRef.current) return
      isAwayRef.current = true

      recordViolation({ participantId })
        .then((res) => {
          if (res.tabViolations !== undefined) {
            setLocalViolationCount(res.tabViolations)
          }
          if (res.locked) {
            setIsViolationModalOpen(false)
          }
        })
        .catch(() => {})
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordAwayOnce()
        return
      }

      isAwayRef.current = false
      setIsViolationModalOpen(true)
      playIntegrityAlert()
    }

    const handleWindowBlur = () => {
      recordAwayOnce()
    }

    const handleWindowFocus = () => {
      isAwayRef.current = false
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)
    window.addEventListener("focus", handleWindowFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
      window.removeEventListener("focus", handleWindowFocus)
    }
  }, [isCompleted, sheet?.isSubmitted, sheet?.found, isLocked, participantId, recordViolation])

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const pad = (n: number) => n.toString().padStart(2, "0")

    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`
    }
    return `${pad(mins)}:${pad(secs)}`
  }

  const currentQuestion = sheet?.questions ? sheet.questions[currentIndex] : null
  const currentAnswer = currentQuestion ? answersMap[currentQuestion.id] : undefined

  const warnLocked = () => {
    toast.warning("Lembar sedang dikunci. Hubungi pengajar untuk membuka kunci.")
  }

  // Handler memilih opsi pilihan ganda biasa
  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion) return
    if (isLocked) {
      warnLocked()
      return
    }

    const updated: StudentAnswerState = {
      ...currentAnswer,
      selectedOptionId: optionId,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
    }

    setAnswerEdits((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }))

    setSaveStatus("saving")
    try {
      await saveAnswer({
        participantId,
        questionId: currentQuestion.id as Id<"questions">,
        selectedOptionId: optionId,
        isDoubtful: updated.isDoubtful,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
      toast.error("Koneksi bermasalah: Gagal menyimpan jawaban. Sistem akan mencoba kembali.")
    }
  }

  // Handler toggle opsi pilihan ganda kompleks (multi-select)
  const handleToggleComplexOption = async (optionId: string) => {
    if (!currentQuestion) return
    if (isLocked) {
      warnLocked()
      return
    }

    const currentSelected = currentAnswer?.selectedOptionIds ?? []
    const isIncluded = currentSelected.includes(optionId)
    const updatedIds = isIncluded
      ? currentSelected.filter((id) => id !== optionId)
      : [...currentSelected, optionId]

    const updated: StudentAnswerState = {
      ...currentAnswer,
      selectedOptionIds: updatedIds,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
    }

    setAnswerEdits((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }))

    setSaveStatus("saving")
    try {
      await saveAnswer({
        participantId,
        questionId: currentQuestion.id as Id<"questions">,
        selectedOptionIds: updatedIds,
        isDoubtful: updated.isDoubtful,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
      toast.error("Koneksi bermasalah: Gagal menyimpan pilihan.")
    }
  }

  // Handler memilih benar/salah
  const handleSelectTrueFalse = async (value: "true" | "false") => {
    if (!currentQuestion) return
    if (isLocked) {
      warnLocked()
      return
    }

    const updated: StudentAnswerState = {
      ...currentAnswer,
      selectedOptionId: value,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
    }

    setAnswerEdits((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }))

    setSaveStatus("saving")
    try {
      await saveAnswer({
        participantId,
        questionId: currentQuestion.id as Id<"questions">,
        selectedOptionId: value,
        isDoubtful: updated.isDoubtful,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
      toast.error("Koneksi bermasalah: Gagal menyimpan jawaban.")
    }
  }

  // Handler perubahan teks essay
  const handleEssayChange = async (text: string) => {
    if (!currentQuestion) return
    if (isLocked) {
      warnLocked()
      return
    }

    const updated: StudentAnswerState = {
      ...currentAnswer,
      essayAnswer: text,
      isDoubtful: currentAnswer?.isDoubtful ?? false,
    }

    setAnswerEdits((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }))

    setSaveStatus("saving")
    try {
      await saveAnswer({
        participantId,
        questionId: currentQuestion.id as Id<"questions">,
        essayAnswer: text,
        isDoubtful: updated.isDoubtful,
      })
      setSaveStatus("saved")
    } catch {
      setSaveStatus("error")
    }
  }

  // Handler toggle ragu-ragu
  const handleToggleDoubtful = async () => {
    if (!currentQuestion) return
    if (isLocked) {
      warnLocked()
      return
    }

    const hasCurrentAnswer = Boolean(
      currentAnswer &&
        (Boolean(currentAnswer.selectedOptionId) ||
          Boolean(currentAnswer.selectedOptionIds && currentAnswer.selectedOptionIds.length > 0) ||
          Boolean(currentAnswer.essayAnswer && currentAnswer.essayAnswer.trim().length > 0))
    )

    const newDoubtful = !currentAnswer?.isDoubtful

    // Mencegah penandaan ragu-ragu jika butir soal belum memiliki jawaban
    if (newDoubtful && !hasCurrentAnswer) {
      toast.info("Pilih atau isi jawaban terlebih dahulu sebelum menandai ragu-ragu.")
      return
    }

    const updated: StudentAnswerState = {
      ...currentAnswer,
      isDoubtful: newDoubtful,
    }

    setAnswerEdits((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }))

    try {
      await saveAnswer({
        participantId,
        questionId: currentQuestion.id as Id<"questions">,
        selectedOptionId: currentAnswer?.selectedOptionId,
        selectedOptionIds: currentAnswer?.selectedOptionIds,
        essayAnswer: currentAnswer?.essayAnswer,
        isDoubtful: newDoubtful,
      })
    } catch {
      toast.error("Gagal memperbarui status ragu-ragu.")
    }
  }

  // Final Submit Handler
  const handleFinalSubmit = React.useCallback(
    async (auto = false) => {
      if (isLocked && !auto) {
        toast.warning("Lembar sedang dikunci. Minta pengajar membuka kunci sebelum mengumpulkan.")
        return
      }

      setIsSubmittingFinal(true)
      try {
        await submitExam({ participantId })
        setIsSubmitDialogOpen(false)
        setHasSubmittedLocally(true)
        if (auto) {
          toast.info("Lembar ujian berhasil dikumpulkan secara otomatis.")
        } else {
          toast.success("Alhamdulillah, lembar ujian Anda telah berhasil dikumpulkan!")
        }
      } catch (err: unknown) {
        const error = err as Error
        toast.error(error.message || "Gagal mengumpulkan ujian.")
      } finally {
        setIsSubmittingFinal(false)
      }
    },
    [participantId, submitExam, isLocked]
  )

  // Hitung mundur pengerjaan + pengumpulan otomatis saat waktu habis.
  // Sisa waktu bersumber dari server pada saat lembar soal dibaca, lalu berdetak
  // lokal. Semua setState terjadi di dalam callback waktu, tidak sinkron di badan efek.
  const hasAutoSubmitted = React.useRef(false)
  React.useEffect(() => {
    if (!activeSheet?.participant || isCompleted) return

    let secondsLeft = Math.max(0, Math.floor(activeSheet.participant.remainingMs / 1000))

    const autoSubmitIfExpired = () => {
      if (secondsLeft > 0 || hasAutoSubmitted.current) return
      hasAutoSubmitted.current = true
      toast.warning("Waktu pengerjaan ujian telah habis! Sistem mengumpulkan jawaban Anda secara otomatis.")
      handleFinalSubmit(true)
    }

    const seed = setTimeout(() => {
      setRemainingSeconds(secondsLeft)
      autoSubmitIfExpired()
    }, 0)

    const timer = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1)
      setRemainingSeconds(secondsLeft)
      autoSubmitIfExpired()
    }, 1000)

    return () => {
      clearTimeout(seed)
      clearInterval(timer)
    }
  }, [activeSheet, isCompleted, handleFinalSubmit])

  if (sheet === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Loader2Icon className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Mempersiapkan lembar soal ujian santri...</p>
      </div>
    )
  }

  if (!sheet.found) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertCircleIcon className="size-12 text-destructive" />
        <h2 className="text-lg font-bold">Data Ujian Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground">{sheet.message}</p>
        <Button onClick={onExit} variant="outline" size="sm">
          Kembali ke Pintu Masuk
        </Button>
      </div>
    )
  }

  // Tampilan Sukses / Ujian Selesai
  if (isCompleted || sheet.isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/20">
        <Card className="max-w-md w-full border shadow-sm text-center p-6 space-y-5">
          <div className="size-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
            <FileCheckIcon className="size-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-heading">Ujian Selesai & Terkumpul</h2>
            <p className="text-xs text-muted-foreground">
              Alhamdulillah, seluruh lembar jawaban Anda telah tersimpan dengan aman di server ujian pesantren.
            </p>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 border text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Santri:</span>
              <span className="font-semibold">{completionParticipant?.studentName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NISN:</span>
              <span className="font-mono">{completionParticipant?.nisn || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mata Pelajaran:</span>
              <span className="font-semibold">
                {completionSession?.subjectCode || completionSession?.title || "-"}
              </span>
            </div>
            {violationsCount > 0 && (
              <div className="flex justify-between pt-1 border-t text-amber-600 dark:text-amber-400">
                <span>Catatan Pelanggaran Layar:</span>
                <span className="font-semibold">{violationsCount} kali</span>
              </div>
            )}
          </div>

          <Button onClick={onExit} className="w-full text-xs">
            Selesai & Keluar dari Ruang Ujian
          </Button>
        </Card>
      </div>
    )
  }

  if (sheet.isEnded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangleIcon className="size-12 text-amber-500" />
        <h2 className="text-lg font-bold">Sesi Ujian Telah Ditutup</h2>
        <p className="text-xs text-muted-foreground">{sheet.message}</p>
        <Button onClick={onExit} variant="outline" size="sm">
          Kembali ke Pintu Masuk
        </Button>
      </div>
    )
  }

  const questions = sheet.questions ?? []
  const totalQuestions = questions.length

  // Hitung ringkasan status pengerjaan secara konsisten dan akurat (partisi eksklusif)
  let answeredSureCount = 0 // Sudah dijawab & pasti (tidak ragu-ragu)
  let doubtfulCount = 0     // Sudah dijawab & ragu-ragu
  let unansweredCount = 0   // Belum dijawab / kosong
  let totalAnswered = 0     // Total semua soal yang sudah terisi jawaban (pasti + ragu-ragu)

  questions.forEach((q) => {
    const ans = answersMap[q.id]
    const hasAnswer = Boolean(
      ans &&
        (Boolean(ans.selectedOptionId) ||
          Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
          Boolean(ans.essayAnswer && ans.essayAnswer.trim().length > 0))
    )

    if (hasAnswer) {
      totalAnswered++
      if (ans?.isDoubtful) {
        doubtfulCount++
      } else {
        answeredSureCount++
      }
    } else {
      unansweredCount++
    }
  })

  function getQuestionTypeLabel(type: string) {
    switch (type) {
      case "multiple_choice":
        return "Pilihan Ganda"
      case "pg_kompleks":
        return "PG Kompleks"
      case "true_false":
        return "Benar / Salah"
      case "essay":
        return "Essay / Uraian"
      default:
        return "Soal"
    }
  }

  const hasStimulus = Boolean(
    currentQuestion && (currentQuestion.stimulusText || currentQuestion.stimulusMediaUrl)
  )

  return (
    <div
      className="min-h-screen bg-muted/15 flex flex-col justify-between select-none"
      onContextMenu={(e) => {
        e.preventDefault()
        toast.warning("Klik kanan dinonaktifkan demi integritas ujian.")
      }}
      onCopy={(e) => {
        e.preventDefault()
        toast.warning("Penyalinan teks dinonaktifkan selama ujian.")
      }}
      onCut={(e) => e.preventDefault()}
    >
      {/* Top Navbar: Info Ujian, Status, dan Timer */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold font-heading line-clamp-1">
              {sheet.session?.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{sheet.session?.subjectCode}</span>
              <span>•</span>
              <span>Santri: {sheet.participant?.studentName}</span>
              {violationsCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">
                    {violationsCount}x Pelanggaran Layar
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="sm:hidden text-xs font-bold line-clamp-1">
            {sheet.session?.subjectCode}
          </div>
        </div>

        {/* Center / Right: Auto-save, Mobile Toggles & Timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Buttons */}
          <div className="flex items-center gap-1 lg:hidden">
            {hasStimulus && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 px-2.5 text-primary"
                onClick={() => setMobileStimulusOpen(true)}
              >
                <BookOpenIcon className="size-3.5" />
                <span className="hidden sm:inline">Wacana</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1 px-2.5"
              onClick={() => setMobileNavOpen(true)}
            >
              <LayoutGridIcon className="size-3.5" />
              <span>{currentIndex + 1}/{totalQuestions}</span>
            </Button>
          </div>

          {/* Indikator Status Simpan Otomatis */}
          <div className="hidden sm:flex items-center">
            {saveStatus === "saving" ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <Loader2Icon className="size-3 animate-spin text-amber-600" />
                <span className="hidden md:inline">Menyimpan...</span>
              </div>
            ) : saveStatus === "error" ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/30">
                <AlertCircleIcon className="size-3" />
                <span className="hidden md:inline">Koneksi Terganggu</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors">
                <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Tersimpan</span>
              </div>
            )}
          </div>

          {/* Timer Display dengan Status Peringatan Bertahap */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm tracking-wider transition-colors ${
              remainingSeconds !== null && remainingSeconds < 300
                ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/50 animate-pulse font-extrabold shadow-2xs"
                : remainingSeconds !== null && remainingSeconds < 600
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50 animate-pulse font-bold"
                  : "bg-card text-foreground"
            }`}
            title="Sisa Waktu Pengerjaan Ujian"
          >
            <ClockIcon className="size-3.5" />
            <span>{remainingSeconds !== null ? formatTimer(remainingSeconds) : "--:--"}</span>
          </div>

          {/* Tombol Kumpulkan Cepat di Header (Aksi Sekunder / Ringkas) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSubmitDialogOpen(true)}
            disabled={isLocked}
            title={isLocked ? "Lembar sedang dikunci" : undefined}
            className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-medium"
          >
            <SendIcon className="size-3.5" />
            <span className="hidden sm:inline">Kumpulkan</span>
          </Button>
        </div>
      </header>

      {/* Progress Bar Kemajuan Pengerjaan Real-time */}
      <div
        className="w-full bg-muted/50 h-1.5 overflow-hidden border-b border-border/40"
        role="progressbar"
        aria-valuenow={totalAnswered}
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        title={`Kemajuan Pengerjaan: ${totalAnswered} dari ${totalQuestions} soal terjawab (${Math.round((totalAnswered / (totalQuestions || 1)) * 100)}%)`}
      >
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{
            width: `${totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0}%`,
          }}
        />
      </div>

      {isLocked && (
        <div
          role="alert"
          aria-live="polite"
          className="border-b border-destructive/30 bg-destructive/5 px-4 sm:px-6 py-3.5"
        >
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <LockIcon className="size-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold font-heading text-destructive">
                  Lembar Anda dikunci
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sesi <span className="font-semibold text-foreground">{sheet.session?.title}</span>{" "}
                  dihentikan sementara karena Anda melewati ambang perpindahan tab. Hubungi pengajar
                  untuk membuka kunci; jawaban yang sudah tersimpan tidak akan hilang. Waktu tetap
                  berjalan dan lembar terkumpul otomatis saat waktu habis.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs lg:ml-auto shrink-0">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ClockIcon className="size-3.5" />
                Sisa waktu
                <span className="font-mono font-bold text-foreground">
                  {remainingSeconds !== null ? formatTimer(remainingSeconds) : "--:--"}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <FileCheckIcon className="size-3.5" />
                {formatSavedAnswerCount(activeSheet?.savedAnswerCount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container (Responsif & Proporsional Sesuai Keberadaan Wacana) */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL 1: Wacana / Stimulus (Hanya muncul jika soal memiliki wacana/media stimulus) */}
        {hasStimulus && (
          <div className="hidden lg:block lg:col-span-4 space-y-3">
            <Card className="border shadow-xs max-h-[calc(100vh-140px)] flex flex-col">
              <CardHeader className="p-3.5 pb-2 border-b bg-muted/20 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-heading text-xs font-semibold text-primary">
                    <BookOpenIcon className="size-4" />
                    Wacana / Stimulus
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Bacaan Pendukung
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
                {currentQuestion?.stimulusMediaUrl && (
                  <div className="rounded border overflow-hidden bg-background flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQuestion.stimulusMediaUrl}
                      alt="Media wacana stimulus"
                      referrerPolicy="no-referrer"
                      className="object-contain max-h-56 w-full rounded"
                    />
                  </div>
                )}
                {currentQuestion?.stimulusText && (
                  <p className="whitespace-pre-line text-foreground/90 font-sans leading-relaxed text-xs sm:text-[13px]">
                    {currentQuestion.stimulusText}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* PANEL 2: Soal & Opsi Jawaban (Adaptif: 5 cols jika ada wacana, 9 cols jika mandiri) */}
        <div className={`col-span-1 ${hasStimulus ? "lg:col-span-5" : "lg:col-span-9"} space-y-4`}>
          {currentQuestion && (
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    Nomor {currentQuestion.displayNumber}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {getQuestionTypeLabel(currentQuestion.type)}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  Bobot: {currentQuestion.points} Poin
                </span>
              </CardHeader>

              <CardContent className="pt-4 space-y-5 text-sm sm:text-base">
                {/* Petunjuk Ringkas untuk Soal Mandiri */}
                {!hasStimulus && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-dashed text-xs text-muted-foreground">
                    <BookOpenIcon className="size-3.5 text-primary shrink-0" />
                    <span>Soal nomor ini bersifat langsung tanpa teks wacana bacaan terpisah.</span>
                  </div>
                )}

                {/* Stimulus Gambar & Teks untuk Layar Mobile/Tablet (lg:hidden) */}
                {hasStimulus && (
                  <div className="lg:hidden rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 font-heading text-xs font-semibold text-primary">
                      <BookOpenIcon className="size-3.5" />
                      Wacana / Stimulus Soal
                    </div>
                    {currentQuestion?.stimulusMediaUrl && (
                      <div className="rounded border overflow-hidden bg-background flex items-center justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentQuestion.stimulusMediaUrl}
                          alt="Media wacana stimulus"
                          referrerPolicy="no-referrer"
                          className="object-contain max-h-64 w-full rounded"
                        />
                      </div>
                    )}
                    {currentQuestion?.stimulusText && (
                      <p className="whitespace-pre-line text-foreground/90 text-xs sm:text-[13px] leading-relaxed">
                        {currentQuestion.stimulusText}
                      </p>
                    )}
                  </div>
                )}

                {/* Teks Pertanyaan */}
                <div className="leading-relaxed whitespace-pre-line font-medium text-foreground text-sm sm:text-[15px]">
                  {currentQuestion.questionText}
                </div>

                <Separator />

                {/* 1. OPSI PILIHAN GANDA BIASA (Single Choice) */}
                {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-[11px] text-muted-foreground font-medium">
                      Pilih satu jawaban yang paling tepat:
                    </div>
                    {currentQuestion.options.map((opt) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          aria-disabled={isLocked}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            isLocked
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          } ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : isLocked
                                ? "bg-card"
                                : "bg-card hover:bg-muted/40 hover:border-primary/40"
                          }`}
                        >
                          <div
                            className={`size-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-muted-foreground/40 bg-muted/30"
                            }`}
                          >
                            {opt.label}
                          </div>
                          <div className="text-xs sm:text-sm pt-0.5 leading-snug flex-1">
                            {opt.text}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 2. OPSI PILIHAN GANDA KOMPLEKS (Multi Choice Checkbox) */}
                {currentQuestion.type === "pg_kompleks" && currentQuestion.options && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <span>Pilih semua pernyataan yang benar:</span>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        Multi-Pilihan
                      </Badge>
                    </div>
                    {currentQuestion.options.map((opt) => {
                      const isSelected = (currentAnswer?.selectedOptionIds ?? []).includes(opt.id)

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleToggleComplexOption(opt.id)}
                          aria-disabled={isLocked}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            isLocked
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          } ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : isLocked
                                ? "bg-card"
                                : "bg-card hover:bg-muted/40 hover:border-primary/40"
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            <Checkbox
                              checked={isSelected}
                              disabled={isLocked}
                              onCheckedChange={() => handleToggleComplexOption(opt.id)}
                              className="size-4"
                            />
                          </div>
                          <span className="font-bold text-xs pt-0.5 w-4">{opt.label}.</span>
                          <div className="text-xs sm:text-sm pt-0.5 leading-snug flex-1">
                            {opt.text}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 3. OPSI BENAR / SALAH (Warna Merah Tegas & Ikon Silang untuk Salah) */}
                {currentQuestion.type === "true_false" && (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs text-muted-foreground font-medium">
                      Tentukan apakah pernyataan di atas Benar atau Salah:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleSelectTrueFalse("true")}
                        className={`p-3.5 rounded-lg border-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentAnswer?.selectedOptionId === "true"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs font-bold"
                            : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2Icon className="size-4 text-emerald-600" />
                        <span>Pernyataan Benar</span>
                      </button>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleSelectTrueFalse("false")}
                        className={`p-3.5 rounded-lg border-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentAnswer?.selectedOptionId === "false"
                            ? "border-red-600 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-2 ring-red-500/30 shadow-xs font-bold"
                            : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <XCircleIcon className="size-4 text-red-600" />
                        <span>Pernyataan Salah</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. ESSAY / URAIAN */}
                {currentQuestion.type === "essay" && (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="essay-input" className="text-xs text-muted-foreground">
                      Tuliskan jawaban uraian Anda pada kotak di bawah ini:
                    </Label>
                    <Textarea
                      id="essay-input"
                      placeholder={
                        isLocked
                          ? "Lembar dikunci. Hubungi pengajar untuk melanjutkan."
                          : "Ketik jawaban essay Anda di sini..."
                      }
                      value={currentAnswer?.essayAnswer ?? ""}
                      onChange={(e) => handleEssayChange(e.target.value)}
                      disabled={isLocked}
                      rows={6}
                      className="text-xs sm:text-sm leading-relaxed"
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="gap-1.5 text-xs px-4 h-9 font-semibold"
                >
                  <ChevronLeftIcon className="size-4" />
                  Sebelumnya
                </Button>

                <Button
                  variant={currentAnswer?.isDoubtful ? "default" : "outline"}
                  size="sm"
                  disabled={isLocked}
                  onClick={handleToggleDoubtful}
                  className={`gap-1.5 text-xs px-4 h-9 font-semibold transition-all ${
                    currentAnswer?.isDoubtful
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                      : "border-2 border-amber-500/60 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40"
                  }`}
                >
                  <HelpCircleIcon className="size-4" />
                  {currentAnswer?.isDoubtful ? "Tandai Yakin" : "Ragu-ragu"}
                </Button>

                <Button
                  variant={currentIndex === totalQuestions - 1 ? "outline" : "default"}
                  size="sm"
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className={`gap-1.5 text-xs px-4 h-9 font-semibold transition-all ${
                    currentIndex === totalQuestions - 1
                      ? "opacity-50"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  }`}
                >
                  Berikutnya
                  <ChevronRightIcon className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* PANEL 3: Penjelajah Nomor Soal (Desktop 3 Cols) */}
        <div className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className="border shadow-xs">
            <CardHeader className="p-3.5 pb-2 border-b">
              <CardTitle className="text-xs font-heading flex items-center justify-between">
                <span>Peta Nomor Soal</span>
                <span className="text-xs font-mono text-muted-foreground font-normal">
                  {totalAnswered}/{totalQuestions} Terjawab
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3.5 space-y-4">
              {/* Grid Nomor */}
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const ans = answersMap[q.id]
                  const isCurrent = idx === currentIndex
                  const isAnswered = Boolean(
                    ans &&
                      (Boolean(ans.selectedOptionId) ||
                        Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                        Boolean(ans.essayAnswer && ans.essayAnswer.trim().length > 0))
                  )
                  const isDoubtful = Boolean(isAnswered && ans?.isDoubtful)

                  let stateClass = "bg-muted text-muted-foreground border-transparent"
                  if (isDoubtful) {
                    stateClass = "bg-amber-500 text-white font-bold border-amber-600"
                  } else if (isAnswered) {
                    stateClass = "bg-emerald-600 text-white font-bold border-emerald-700"
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-8 rounded border text-xs flex items-center justify-center font-mono transition-all ${stateClass} ${
                        isCurrent
                          ? "ring-2 ring-primary ring-offset-2 scale-105 font-black shadow-md z-10"
                          : "hover:opacity-90"
                      }`}
                      title={`Soal Nomor ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Keterangan Warna Grid (Konsisten & Tepat Matematika) */}
              <div className="pt-2.5 border-t space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-emerald-600 shrink-0" />
                  <span>Dijawab Pasti ({answeredSureCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-amber-500 shrink-0" />
                  <span>Ragu-ragu ({doubtfulCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-muted border shrink-0" />
                  <span>Belum Dijawab ({unansweredCount})</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-3.5 pt-0">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsSubmitDialogOpen(true)}
                disabled={isLocked}
                title={isLocked ? "Lembar sedang dikunci" : undefined}
                className="w-full text-xs gap-1.5 font-bold bg-primary shadow-xs"
              >
                <SendIcon className="size-3.5" />
                Selesaikan Ujian
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* MOBILE MODAL: Wacana / Stimulus */}
      <Dialog open={mobileStimulusOpen} onOpenChange={setMobileStimulusOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-heading flex items-center gap-2">
              <BookOpenIcon className="size-4 text-primary" />
              Wacana / Stimulus Soal #{currentIndex + 1}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-3 py-2 text-xs leading-relaxed">
            {currentQuestion?.stimulusMediaUrl && (
              <div className="rounded border overflow-hidden bg-background flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentQuestion.stimulusMediaUrl}
                  alt="Media wacana stimulus"
                  referrerPolicy="no-referrer"
                  className="object-contain max-h-56 w-full rounded"
                />
              </div>
            )}
            {currentQuestion?.stimulusText ? (
              <p className="whitespace-pre-line text-foreground font-sans leading-relaxed">
                {currentQuestion.stimulusText}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                Soal ini tidak memiliki teks wacana terpisah.
              </p>
            )}
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button size="sm" onClick={() => setMobileStimulusOpen(false)} className="text-xs w-full">
              Tutup Wacana
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOBILE MODAL: Peta Nomor Soal */}
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-heading flex items-center justify-between">
              <span>Peta Nomor Soal</span>
              <span className="text-xs font-mono text-muted-foreground font-normal">
                {totalAnswered}/{totalQuestions} Terjawab
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto py-2 space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = answersMap[q.id]
                const isCurrent = idx === currentIndex
                const isAnswered = Boolean(
                  ans &&
                    (Boolean(ans.selectedOptionId) ||
                      Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                      Boolean(ans.essayAnswer && ans.essayAnswer.trim().length > 0))
                )
                const isDoubtful = Boolean(isAnswered && ans?.isDoubtful)

                let stateClass = "bg-muted text-muted-foreground border-transparent"
                if (isDoubtful) {
                  stateClass = "bg-amber-500 text-white font-bold border-amber-600"
                } else if (isAnswered) {
                  stateClass = "bg-emerald-600 text-white font-bold border-emerald-700"
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setMobileNavOpen(false)
                    }}
                    className={`h-9 rounded border text-xs flex items-center justify-center font-mono transition-all ${stateClass} ${
                      isCurrent
                        ? "ring-2 ring-primary ring-offset-2 scale-105 font-black shadow-md z-10"
                        : "hover:opacity-90"
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="pt-2.5 border-t space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded bg-emerald-600 shrink-0" />
                <span>Dijawab Pasti ({answeredSureCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded bg-amber-500 shrink-0" />
                <span>Ragu-ragu ({doubtfulCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded bg-muted border shrink-0" />
                <span>Belum Dijawab ({unansweredCount})</span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2 border-t">
            <Button size="sm" onClick={() => setMobileNavOpen(false)} className="text-xs w-full">
              Tutup Peta Soal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG PERINGATAN PELANGGARAN TAB (ANTI-CURANG) */}
      {!isLocked && (
        <Dialog open={isViolationModalOpen} onOpenChange={setIsViolationModalOpen}>
          <DialogContent className="sm:max-w-md border-amber-500/40 bg-card">
            <DialogHeader>
              <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <ShieldAlertIcon className="size-6" />
              </div>
              <DialogTitle className="font-heading text-center text-amber-700 dark:text-amber-400">
                Peringatan Integritas Ujian
              </DialogTitle>
              <DialogDescription className="text-xs text-center">
                Terdeteksi bahwa Anda meninggalkan jendela atau tab ujian aktif.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-2 text-center">
              <p className="text-foreground leading-relaxed">
                Seluruh aktivitas keluar dari layar ujian telah dicatat secara otomatis oleh sistem pengawas.
              </p>
              <div className="font-semibold text-amber-700 dark:text-amber-400 font-mono">
                Total Pelanggaran Tercatat: {violationsCount} kali
              </div>
              <p className="text-[11px] text-muted-foreground">
                Harap tetap fokus pada halaman ujian ini dan tidak membuka tab lain demi menjaga kejujuran evaluasi.
              </p>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsViolationModalOpen(false)}
                className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Saya Mengerti & Kembali Mengerjakan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG KONFIRMASI SUBMIT UJIAN */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Konfirmasi Pengumpulan Ujian</DialogTitle>
            <DialogDescription className="text-xs">
              Pastikan Anda telah memeriksa kembali seluruh butir soal sebelum mengumpulkan lembar jawaban.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                <div className="text-lg font-bold font-mono text-emerald-600">{answeredSureCount}</div>
                <div className="text-[10px] text-muted-foreground">Dijawab Pasti</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20">
                <div className="text-lg font-bold font-mono text-amber-600">{doubtfulCount}</div>
                <div className="text-[10px] text-muted-foreground">Ragu-ragu</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/60 border">
                <div className="text-lg font-bold font-mono text-foreground">{unansweredCount}</div>
                <div className="text-[10px] text-muted-foreground">Belum Dijawab</div>
              </div>
            </div>

            {violationsCount > 0 && (
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-50/40 text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span className="text-[11px]">Catatan Pelanggaran Layar:</span>
                <Badge variant="outline" className="border-amber-600 font-mono text-xs">
                  {violationsCount} kali
                </Badge>
              </div>
            )}

            {(unansweredCount > 0 || doubtfulCount > 0) && (
              <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Perhatian: Masih terdapat{" "}
                  {unansweredCount > 0 && (
                    <>
                      <strong>{unansweredCount} soal belum dijawab</strong>
                      {doubtfulCount > 0 ? " dan " : "."}
                    </>
                  )}
                  {doubtfulCount > 0 && (
                    <>
                      <strong>{doubtfulCount} soal ragu-ragu</strong>.
                    </>
                  )}{" "}
                  Anda yakin ingin mengumpulkan sekarang?
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitDialogOpen(false)}
              disabled={isSubmittingFinal}
              className="text-xs"
            >
              Periksa Kembali
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleFinalSubmit(false)}
              disabled={isSubmittingFinal || isLocked}
              className="text-xs gap-1.5 bg-primary"
            >
              {isSubmittingFinal ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Mengumpulkan...
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-3.5" />
                  Ya, Kumpulkan Jawaban
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
