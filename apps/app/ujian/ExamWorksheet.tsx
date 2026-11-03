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
  SendIcon,
  ShieldAlertIcon,
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

  // Mobile drawer/sheet state toggles
  const [mobileStimulusOpen, setMobileStimulusOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  // Sisa waktu pengerjaan dalam detik; hanya diisi dari callback waktu (lihat efek timer).
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null)

  const isCompleted = hasSubmittedLocally || !!sheet?.isSubmitted

  // Lembar yang masih bisa dikerjakan (belum selesai dan sesi belum ditutup)
  const activeSheet =
    sheet && sheet.found && !sheet.isSubmitted && !sheet.isEnded ? sheet : null

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
    if (isCompleted || sheet?.isSubmitted || !sheet?.found) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation({ participantId })
          .then((res) => {
            if (res.tabViolations !== undefined) {
              setLocalViolationCount(res.tabViolations)
            }
          })
          .catch(() => {})
      } else {
        setIsViolationModalOpen(true)
      }
    }

    const handleWindowBlur = () => {
      recordViolation({ participantId })
        .then((res) => {
          if (res.tabViolations !== undefined) {
            setLocalViolationCount(res.tabViolations)
          }
        })
        .catch(() => {})
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleWindowBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleWindowBlur)
    }
  }, [isCompleted, sheet?.isSubmitted, sheet?.found, participantId, recordViolation])

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

  // Handler memilih opsi pilihan ganda biasa
  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion) return

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

    const newDoubtful = !currentAnswer?.isDoubtful
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
    [participantId, submitExam]
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
              <span className="font-semibold">{sheet.participant?.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NISN:</span>
              <span className="font-mono">{sheet.participant?.nisn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mata Pelajaran:</span>
              <span className="font-semibold">{sheet.session?.subjectCode}</span>
            </div>
            {violationsCount > 0 && (
              <div className="flex justify-between pt-1 border-t text-amber-600 dark:text-amber-400">
                <span>Catatan Pelanggaran Tab:</span>
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

  // Hitung ringkasan status pengerjaan
  let answeredCount = 0
  let doubtfulCount = 0
  questions.forEach((q) => {
    const ans = answersMap[q.id]
    if (ans) {
      if (ans.isDoubtful) doubtfulCount++
      const hasAnswer =
        Boolean(ans.selectedOptionId) ||
        Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
        Boolean(ans.essayAnswer && ans.essayAnswer.trim().length > 0)
      if (hasAnswer) {
        answeredCount++
      }
    }
  })
  const unansweredCount = totalQuestions - answeredCount

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

          <div className="text-[11px] hidden sm:flex items-center gap-1.5 text-muted-foreground">
            {saveStatus === "saving" ? (
              <>
                <Loader2Icon className="size-3 animate-spin text-primary" />
                <span className="hidden md:inline">Menyimpan...</span>
              </>
            ) : saveStatus === "error" ? (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircleIcon className="size-3" />
                Koneksi lambat
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2Icon className="size-3" />
                <span className="hidden md:inline">Tersimpan</span>
              </span>
            )}
          </div>

          {/* Timer Display */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs sm:text-sm tracking-wider ${
              remainingSeconds !== null && remainingSeconds < 300
                ? "bg-destructive/10 text-destructive border-destructive/40 animate-pulse"
                : "bg-card text-foreground"
            }`}
          >
            <ClockIcon className="size-3.5" />
            <span>{remainingSeconds !== null ? formatTimer(remainingSeconds) : "--:--"}</span>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsSubmitDialogOpen(true)}
            className="text-xs gap-1.5 bg-primary"
          >
            <SendIcon className="size-3.5" />
            <span className="hidden sm:inline">Selesaikan Ujian</span>
          </Button>
        </div>
      </header>

      {/* Main 3-Panel Layout Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL 1: Wacana / Stimulus (Desktop 4 Cols, Scrollable Independen) */}
        <div className="hidden lg:block lg:col-span-4 space-y-3">
          <Card className="border shadow-xs max-h-[calc(100vh-140px)] flex flex-col">
            <CardHeader className="p-3.5 pb-2 border-b bg-muted/20 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-heading text-xs font-semibold text-primary">
                  <BookOpenIcon className="size-4" />
                  Wacana / Stimulus
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Bacaan Mandiri
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
              {hasStimulus ? (
                <>
                  {currentQuestion?.stimulusMediaUrl && (
                    <div className="rounded border overflow-hidden bg-background flex items-center justify-center p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentQuestion.stimulusMediaUrl}
                        alt="Media wacana stimulus"
                        className="object-contain max-h-56 w-full rounded"
                      />
                    </div>
                  )}
                  {currentQuestion?.stimulusText && (
                    <p className="whitespace-pre-line text-foreground/90 font-sans leading-relaxed text-xs sm:text-[13px]">
                      {currentQuestion.stimulusText}
                    </p>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground space-y-2 my-auto">
                  <FileTextIcon className="size-7 mx-auto text-muted-foreground/50" />
                  <p className="text-xs">
                    Soal nomor ini bersifat langsung tanpa teks wacana bacaan terpisah.
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Silakan baca butir pertanyaan pada panel di samping dengan saksama.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PANEL 2: Soal & Opsi Jawaban (Desktop 5 Cols / Mobile Full) */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
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
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
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
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                              : "bg-card hover:bg-muted/40 hover:border-primary/40"
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            <Checkbox
                              checked={isSelected}
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

                {/* 3. OPSI BENAR / SALAH */}
                {currentQuestion.type === "true_false" && (
                  <div className="space-y-3 pt-1">
                    <div className="text-[11px] text-muted-foreground font-medium">
                      Tentukan apakah pernyataan di atas Benar atau Salah:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectTrueFalse("true")}
                        className={`p-3.5 rounded-lg border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          currentAnswer?.selectedOptionId === "true"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-2 ring-emerald-500/40 shadow-xs"
                            : "bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2Icon className="size-4" />
                        Pernyataan Benar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTrueFalse("false")}
                        className={`p-3.5 rounded-lg border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          currentAnswer?.selectedOptionId === "false"
                            ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-2 ring-rose-500/40 shadow-xs"
                            : "bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <HelpCircleIcon className="size-4" />
                        Pernyataan Salah
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
                      placeholder="Ketik jawaban essay Anda di sini..."
                      value={currentAnswer?.essayAnswer ?? ""}
                      onChange={(e) => handleEssayChange(e.target.value)}
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
                  className="gap-1 text-xs"
                >
                  <ChevronLeftIcon className="size-4" />
                  Sebelumnya
                </Button>

                <Button
                  variant={currentAnswer?.isDoubtful ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleDoubtful}
                  className={`gap-1.5 text-xs ${
                    currentAnswer?.isDoubtful
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  }`}
                >
                  <HelpCircleIcon className="size-4" />
                  {currentAnswer?.isDoubtful ? "Tandai Yakin" : "Ragu-ragu"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="gap-1 text-xs"
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
                  {answeredCount}/{totalQuestions} Terjawab
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3.5 space-y-4">
              {/* Grid Nomor */}
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const ans = answersMap[q.id]
                  const isCurrent = idx === currentIndex
                  const isAnswered =
                    ans &&
                    (Boolean(ans.selectedOptionId) ||
                      Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                      Boolean(ans.essayAnswer && ans.essayAnswer.trim().length > 0))
                  const isDoubtful = ans?.isDoubtful

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
                        isCurrent ? "ring-2 ring-primary ring-offset-2" : "hover:opacity-90"
                      }`}
                      title={`Soal Nomor ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Keterangan Warna Grid */}
              <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded bg-emerald-600 shrink-0" />
                  <span>Sudah Dijawab ({answeredCount})</span>
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
                className="w-full text-xs gap-1.5"
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
                {answeredCount}/{totalQuestions} Terjawab
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto py-2 space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = answersMap[q.id]
                const isCurrent = idx === currentIndex
                const isAnswered =
                  ans &&
                  (Boolean(ans.selectedOptionId) ||
                    Boolean(ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
                    Boolean(ans.essayAnswer && ans.essayAnswer.trim().length > 0))
                const isDoubtful = ans?.isDoubtful

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
                      isCurrent ? "ring-2 ring-primary ring-offset-2" : "hover:opacity-90"
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded bg-emerald-600 shrink-0" />
                <span>Sudah Dijawab ({answeredCount})</span>
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
                <div className="text-lg font-bold font-mono text-emerald-600">{answeredCount}</div>
                <div className="text-[10px] text-muted-foreground">Terjawab</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20">
                <div className="text-lg font-bold font-mono text-amber-600">{doubtfulCount}</div>
                <div className="text-[10px] text-muted-foreground">Ragu-ragu</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/60 border">
                <div className="text-lg font-bold font-mono text-foreground">{unansweredCount}</div>
                <div className="text-[10px] text-muted-foreground">Kosong</div>
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
                  Perhatian: Masih terdapat <strong>{unansweredCount} soal belum dijawab</strong> dan{" "}
                  <strong>{doubtfulCount} soal ragu-ragu</strong>. Anda yakin ingin mengumpulkan sekarang?
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
              disabled={isSubmittingFinal}
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
