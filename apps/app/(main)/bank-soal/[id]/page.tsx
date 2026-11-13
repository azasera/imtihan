"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CheckCheckIcon,
  CircleDotIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HelpCircleIcon,
  ImageIcon,
  LinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
  UploadCloudIcon,
  ListChecksIcon,
  LockIcon,
  CheckIcon,
  PenLineIcon,
  PlusIcon,
  PrinterIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import {
  THINKING_LEVELS,
  THINKING_LEVEL_LABELS,
  UNTAGGED_THINKING_LEVEL_LABEL,
  type ThinkingLevel,
} from "@/convex/model/thinkingLevels"
import { QuestionOptionsEditor } from "@/components/bank-soal/question-options-editor"
import { QuestionImportPanel } from "@/components/bank-soal/question-import-panel"
import { QuestionExportDialog } from "@/components/bank-soal/question-export-dialog"
import { AiQuestionGeneratorDialog } from "@/components/bank-soal/ai-question-generator-dialog"
import { QuestionListEmpty, QuestionRow } from "@/components/bank-soal/question-row"
import type { ExportableQuestion } from "@/lib/exam-export"
import {
  defaultChoiceOptions,
  normalizeSingleKey,
  resolveChoiceOptions,
  resolveTrueFalseAnswer,
  toStoredOptions,
  type QuestionOptionDraft,
} from "@/lib/question-options"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type QuestionType = "multiple_choice" | "pg_kompleks" | "true_false" | "essay"

const QUESTION_TYPE_HINTS: Record<QuestionType, string> = {
  multiple_choice: "Pilihan ganda standar: tentukan tepat satu kunci jawaban yang benar.",
  pg_kompleks: "Pilihan ganda kompleks: tandai minimal dua opsi sebagai kunci jawaban benar.",
  true_false: "Tentukan apakah pernyataan bernilai Benar atau Salah.",
  essay: "Tuliskan pertanyaan uraian dan cantumkan pedoman rubrik penilaian.",
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Pilihan Ganda",
  pg_kompleks: "PG Kompleks",
  true_false: "Benar / Salah",
  essay: "Essay",
}

/** Nomor urut berikutnya = nomor terakhir paket ditambah satu, bukan jumlah butir. */
function nextOrderNumber(questions: Array<{ orderNumber: number }>): number {
  return questions.reduce((max, q) => Math.max(max, q.orderNumber), 0) + 1
}

export default function BankSoalEditorPage() {
  const params = useParams()
  const bankId = params.id as Id<"questionBanks">

  const bank = useQuery(api.bank.public.queries.getQuestionBank, { bankId })
  const lock = useQuery(api.bank.public.queries.getBankActiveLock, { bankId })
  const achievementLabels = useQuery(api.bank.public.queries.listAchievementLabels, { bankId })
  const createQuestion = useMutation(api.bank.public.mutations.createQuestion)
  const updateQuestion = useMutation(api.bank.public.mutations.updateQuestion)
  const duplicateQuestion = useMutation(api.bank.public.mutations.duplicateQuestion)
  const deleteQuestion = useMutation(api.bank.public.mutations.deleteQuestion)
  const generateUploadUrl = useMutation(api.bank.public.mutations.generateUploadUrl)
  const getStorageMediaUrl = useMutation(api.bank.public.mutations.getStorageMediaUrl)

  // Form states — dipakai bersama oleh mode tambah dan mode sunting
  const [editingId, setEditingId] = React.useState<Id<"questions"> | null>(null)
  const [questionType, setQuestionType] = React.useState<QuestionType>("multiple_choice")
  const [stimulusText, setStimulusText] = React.useState("")
  const [stimulusMediaUrl, setStimulusMediaUrl] = React.useState("")
  const [stimulusMediaStorageId, setStimulusMediaStorageId] = React.useState<Id<"_storage"> | undefined>(undefined)
  const [stimulusImageSource, setStimulusImageSource] = React.useState<"upload" | "url">("upload")
  const [isUploadingImage, setIsUploadingImage] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [showStimulus, setShowStimulus] = React.useState(false)
  const [questionText, setQuestionText] = React.useState("")
  const [points, setPoints] = React.useState(5)
  const [rubric, setRubric] = React.useState("")
  const [explanation, setExplanation] = React.useState("")
  const [thinkingLevel, setThinkingLevel] = React.useState<ThinkingLevel | "untagged">("untagged")
  const [achievementRef, setAchievementRef] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mcOptions, setMcOptions] = React.useState<QuestionOptionDraft[]>(() => defaultChoiceOptions())
  const [tfAnswer, setTfAnswer] = React.useState<"true" | "false">("true")

  // Right column view toggle: "preview" vs "list"
  const [rightView, setRightView] = React.useState<"preview" | "list">("preview")

  // Cara menambah butir: satu per satu lewat formulir, atau banyak sekaligus lewat tempelan naskah
  const [writeMode, setWriteMode] = React.useState<"single" | "bulk">("single")
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false)
  const [isAiDialogOpen, setIsAiDialogOpen] = React.useState(false)

  // Tangani parameter rute dari studio pembuatan baru (mode=ai atau mode=bulk)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const mode = new URLSearchParams(window.location.search).get("mode")
      if (mode === "bulk") {
        setWriteMode("bulk")
      } else if (mode === "ai") {
        setIsAiDialogOpen(true)
      }
    }
  }, [])

  const cardTitleRef = React.useRef<HTMLSpanElement>(null)

  const questionsList = bank?.questions ?? []
  const exportableQuestions = React.useMemo<ExportableQuestion[]>(() => {
    return questionsList.map((q) => ({
      id: q._id,
      number: q.orderNumber,
      type: q.type,
      questionText: q.questionText,
      stimulusText: q.stimulusText,
      options: q.options,
      correctOptionId: q.options?.find((o) => o.isCorrect)?.id,
      points: q.points,
      rubric: q.rubric,
      explanation: q.explanation,
      thinkingLevel: q.thinkingLevel,
      achievementRef: q.achievementRef,
    }))
  }, [questionsList])
  const upcomingOrderNumber = nextOrderNumber(questionsList)
  const editingQuestion = editingId
    ? questionsList.find((q) => q._id === editingId) ?? null
    : null
  const displayOrderNumber = editingQuestion ? editingQuestion.orderNumber : upcomingOrderNumber
  const showSingleForm = writeMode === "single" || editingId !== null
  const isLocked = Boolean(lock)
  const lockedReason = lock
    ? `Paket ini sedang dipakai pada sesi "${lock.title}" yang masih berjalan, jadi butir soal belum dapat diubah.`
    : ""

  function resetForm() {
    setEditingId(null)
    setQuestionType("multiple_choice")
    setQuestionText("")
    setPoints(5)
    setRubric("")
    setExplanation("")
    setThinkingLevel("untagged")
    setAchievementRef("")
    setStimulusText("")
    setStimulusMediaUrl("")
    setStimulusMediaStorageId(undefined)
    setStimulusImageSource("upload")
    setShowStimulus(false)
    setMcOptions(defaultChoiceOptions())
    setTfAnswer("true")
  }

  /** Mengisi ulang formulir dengan isi butir terpilih tanpa menyentuh nomor urutnya. */
  function startEdit(question: Doc<"questions">) {
    setEditingId(question._id)
    setQuestionType(question.type)
    setQuestionText(question.questionText)
    setPoints(question.points)
    setRubric(question.rubric ?? "")
    setExplanation(question.explanation ?? "")
    setThinkingLevel(question.thinkingLevel ?? "untagged")
    setAchievementRef(question.achievementRef ?? "")
    setStimulusText(question.stimulusText ?? "")
    setStimulusMediaUrl(question.stimulusMediaUrl ?? "")
    setStimulusMediaStorageId(question.stimulusMediaStorageId)
    if (question.stimulusMediaStorageId) {
      setStimulusImageSource("upload")
    } else if (question.stimulusMediaUrl) {
      setStimulusImageSource("url")
    } else {
      setStimulusImageSource("upload")
    }
    setShowStimulus(Boolean(question.stimulusText || question.stimulusMediaUrl))
    setMcOptions(resolveChoiceOptions(question.options))
    setTfAnswer(resolveTrueFalseAnswer(question.options))
    cardTitleRef.current?.focus()
  }

  function buildBody() {
    if (questionType === "true_false") {
      return {
        type: questionType,
        options: [
          { id: "true", label: "Benar", text: "Pernyataan Benar", isCorrect: tfAnswer === "true" },
          { id: "false", label: "Salah", text: "Pernyataan Salah", isCorrect: tfAnswer === "false" },
        ],
      }
    }
    if (questionType === "multiple_choice") {
      return { type: questionType, options: normalizeSingleKey(mcOptions) }
    }
    if (questionType === "pg_kompleks") {
      return { type: questionType, options: toStoredOptions(mcOptions) }
    }
    return { type: questionType, options: undefined }
  }

  function validateBeforeSave(): string | null {
    if (!questionText.trim()) return "Teks soal pertanyaan wajib diisi."

    if (questionType === "multiple_choice") {
      const filled = mcOptions.filter((o) => o.text.trim().length > 0)
      if (filled.length < 2) {
        return "Soal pilihan ganda harus memiliki minimal 2 opsi jawaban yang terisi."
      }
      if (!filled.some((o) => o.isCorrect)) {
        return "Soal pilihan ganda harus memiliki tepat satu kunci jawaban yang benar."
      }
    }

    if (questionType === "pg_kompleks") {
      const filled = mcOptions.filter((o) => o.text.trim().length > 0)
      if (filled.length < 3) {
        return "Soal pilihan ganda kompleks harus memiliki minimal 3 opsi jawaban yang terisi."
      }
      if (filled.filter((o) => o.isCorrect).length < 2) {
        return "Soal pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban yang benar."
      }
    }

    return null
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      toast.error("Format berkas tidak didukung. Harap pilih gambar PNG, JPG, WebP, atau SVG.")
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Ukuran berkas terlalu besar. Maksimal ukuran gambar adalah 5 MB.")
      return
    }

    try {
      setIsUploadingImage(true)
      const postUrl = await generateUploadUrl()
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!result.ok) {
        throw new Error("Gagal mengunggah berkas ke server penyimpanan.")
      }
      const { storageId } = await result.json()
      setStimulusMediaStorageId(storageId)

      const { url } = await getStorageMediaUrl({ storageId })
      if (url) {
        setStimulusMediaUrl(url)
      }
      toast.success("Gambar berhasil diunggah!")
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Terjadi kesalahan saat mengunggah gambar.")
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = () => {
    setStimulusMediaUrl("")
    setStimulusMediaStorageId(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault()

    const problem = validateBeforeSave()
    if (problem) {
      toast.error(problem)
      return
    }

    const body = {
      ...buildBody(),
      stimulusText: stimulusText.trim() || undefined,
      stimulusMediaUrl: stimulusMediaUrl.trim() || undefined,
      stimulusMediaStorageId,
      questionText: questionText.trim(),
      points: Number(points),
      rubric: questionType === "essay" ? rubric.trim() || undefined : undefined,
      explanation: explanation.trim() || undefined,
      thinkingLevel: thinkingLevel === "untagged" ? undefined : thinkingLevel,
      achievementRef: achievementRef.trim() || undefined,
    }

    try {
      setIsSubmitting(true)

      if (editingId) {
        await updateQuestion({ questionId: editingId, ...body })
        toast.success(`Butir soal nomor ${displayOrderNumber} tersimpan. Nomor urut tidak berubah.`)
        resetForm()
      } else {
        await createQuestion({ bankId, ...body })
        toast.success("Butir soal berhasil ditambahkan!")
        resetForm()
      }

      setRightView("list")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan butir soal."
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Setelah seluruh tahap masuk, pengajar dibawa ke daftar yang sudah terisi. */
  function handleImportSaved(count: number) {
    toast.success(`${count} butir soal tersimpan dan sudah tampil di daftar.`)
    setRightView("list")
  }

  async function handleDuplicateQuestion(question: Doc<"questions">) {
    try {
      await duplicateQuestion({ questionId: question._id })
      toast.success(
        `Salinan butir nomor ${question.orderNumber} dibuat di urutan akhir daftar. Silakan sunting isinya.`
      )
      setRightView("list")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menggandakan butir soal."
      toast.error(msg)
    }
  }

  async function handleDeleteQuestion(question: Doc<"questions">) {
    if (!confirm(`Hapus butir soal nomor ${question.orderNumber}?`)) {
      return
    }

    try {
      await deleteQuestion({ questionId: question._id })
      toast.success("Butir soal berhasil dihapus.")
      if (editingId === question._id) resetForm()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus butir soal."
      toast.error(msg)
    }
  }

  if (bank === undefined) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
        Memuat detail bank soal...
      </div>
    )
  }

  if (bank === null) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-sm text-destructive">Paket bank soal tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Link href="/bank-soal" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kembali ke Bank Soal
        </Link>
      </div>
    )
  }

  function getQuestionTypeLabel(type: QuestionType) {
    return QUESTION_TYPE_LABELS[type]
  }

  async function handleApplyAiDraft(generatedText: string) {
    try {
      await navigator.clipboard.writeText(generatedText)
    } catch {
      // fallback jika clipboard dibatasi browser
    }
    setWriteMode("bulk")
    toast.success("Draf naskah AI siap. Tempelkan (Ctrl+V) pada kotak naskah lalu klik Periksa Tulisan.")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <Link
            href="/bank-soal"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 mb-1 gap-1 text-xs" })}
          >
            <ArrowLeftIcon className="size-3.5" />
            Kembali ke Daftar Bank Soal
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              {bank.subjectName}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {bank.gradeLevel}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 font-heading">
            {bank.title}
          </h1>
          {bank.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{bank.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAiDialogOpen(true)}
            className="gap-2 text-xs h-9 font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-sm shadow-emerald-950/20 active:scale-[0.99] border-0"
          >
            <SparklesIcon className="size-4 text-emerald-200" />
            <span>Asisten AI</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Pintar
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="gap-1.5 text-xs h-9"
          >
            <PrinterIcon className="size-3.5" />
            Ekspor & Cetak
          </Button>

          <div className="flex items-center gap-3 bg-card border rounded-lg p-2.5 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total Soal</div>
              <div className="text-base font-bold font-mono">{questionsList.length} Butir</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Target Nilai</div>
              <div className="text-base font-bold font-mono text-primary">{bank.totalPoints} Poin</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Input Butir Soal & Stimulus (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Banner Ajakan Asisten AI saat Paket Masih Kosong */}
          {questionsList.length === 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/20 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <SparklesIcon className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-100">
                    Mulai Lebih Cepat dengan Asisten AI
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Belum ada butir soal pada paket ini. Gunakan Asisten AI untuk merumuskan draf kisi-kisi dan butir soal HOTS / LOTS secara otomatis berdasarkan topik materi Anda.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAiDialogOpen(true)}
                className="shrink-0 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              >
                <SparklesIcon className="size-3.5" />
                Buka Asisten AI
              </Button>
            </div>
          )}

          <Card className="border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-heading">
                  <span
                    ref={cardTitleRef}
                    tabIndex={-1}
                    className="rounded-sm outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2"
                  >
                    {editingId
                      ? "Sunting Butir Soal"
                      : showSingleForm
                        ? "Tambah Butir Soal Baru"
                        : "Tempel Banyak Butir Sekaligus"}
                  </span>
                </CardTitle>
                {!editingId && (
                  <Tabs
                    value={writeMode}
                    onValueChange={(val) => setWriteMode(val as "single" | "bulk")}
                    className="w-full sm:w-auto"
                  >
                    <TabsList className="h-9 rounded-lg bg-muted/80 p-1 border border-border/60 shadow-inner gap-1">
                      <TabsTrigger
                        value="single"
                        className="rounded-md px-3 py-1 text-xs font-medium transition-all duration-150 data-active:bg-background data-active:text-emerald-800 dark:data-active:text-emerald-300 data-active:shadow-xs data-active:font-semibold border border-transparent data-active:border-border/60 gap-1.5"
                      >
                        <PenLineIcon className="size-3.5" />
                        <span>Tulis satu per satu</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="bulk"
                        className="rounded-md px-3 py-1 text-xs font-medium transition-all duration-150 data-active:bg-background data-active:text-emerald-800 dark:data-active:text-emerald-300 data-active:shadow-xs data-active:font-semibold border border-transparent data-active:border-border/60 gap-1.5"
                      >
                        <FileSpreadsheetIcon className="size-3.5" />
                        <span>Tempel banyak sekaligus</span>
                      </TabsTrigger>
                      <button
                        type="button"
                        onClick={() => setIsAiDialogOpen(true)}
                        className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-100/80 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 border border-emerald-300/80 dark:border-emerald-700/60 transition-all gap-1.5 shadow-xs"
                      >
                        <SparklesIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Bantuan AI</span>
                      </button>
                    </TabsList>
                  </Tabs>
                )}
              </div>

              {showSingleForm && (
                <div className="flex flex-col gap-2.5 pt-2">
                  <Tabs
                    value={questionType}
                    onValueChange={(val) => setQuestionType(val as QuestionType)}
                    className="w-full"
                  >
                    <TabsList className="h-10 w-full sm:w-fit rounded-lg bg-muted/80 p-1 border border-border/60 shadow-inner grid grid-cols-2 sm:flex sm:flex-wrap gap-1">
                      <TabsTrigger
                        value="multiple_choice"
                        className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 data-active:bg-background data-active:text-emerald-800 dark:data-active:text-emerald-300 data-active:shadow-sm data-active:font-semibold border border-transparent data-active:border-emerald-500/30 dark:data-active:border-emerald-600/40 gap-1.5 justify-start sm:justify-center"
                      >
                        <CircleDotIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Pilihan Ganda</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="pg_kompleks"
                        className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 data-active:bg-background data-active:text-emerald-800 dark:data-active:text-emerald-300 data-active:shadow-sm data-active:font-semibold border border-transparent data-active:border-emerald-500/30 dark:data-active:border-emerald-600/40 gap-1.5 justify-start sm:justify-center"
                      >
                        <ListChecksIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>PG Kompleks</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="true_false"
                        className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 data-active:bg-background data-active:text-emerald-800 dark:data-active:text-emerald-300 data-active:shadow-sm data-active:font-semibold border border-transparent data-active:border-emerald-500/30 dark:data-active:border-emerald-600/40 gap-1.5 justify-start sm:justify-center"
                      >
                        <CheckCheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Benar / Salah</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="essay"
                        className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 data-active:bg-background data-active:text-emerald-800 dark:data-active:text-emerald-300 data-active:shadow-sm data-active:font-semibold border border-transparent data-active:border-emerald-500/30 dark:data-active:border-emerald-600/40 gap-1.5 justify-start sm:justify-center"
                      >
                        <FileTextIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Essay</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Dynamic Contextual Guidance Banner */}
                  <div className="flex items-center gap-2 rounded-md bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200 transition-colors">
                    <span className="font-semibold shrink-0">
                      Format {QUESTION_TYPE_LABELS[questionType]}:
                    </span>
                    <span className="text-muted-foreground dark:text-emerald-300/80">
                      {QUESTION_TYPE_HINTS[questionType]}
                    </span>
                  </div>
                </div>
              )}

              {!showSingleForm && (
                <CardDescription className="text-xs pt-1">
                  Tempel naskah yang sudah ada, telusuri hasil tafsirannya per butir, lalu simpan sekaligus.
                </CardDescription>
              )}
            </CardHeader>

            {showSingleForm && (
            <form onSubmit={handleSaveQuestion}>
              <CardContent className="space-y-4">
                {/* Accordion / Toggle Konten Stimulus */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileTextIcon className="size-4 text-primary" />
                      <Label htmlFor="toggle-stimulus" className="text-xs font-semibold cursor-pointer">
                        Konten Wacana / Stimulus Soal
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-primary"
                      onClick={() => setShowStimulus(!showStimulus)}
                    >
                      {showStimulus ? "Sembunyikan Wacana" : "+ Tambah Wacana / Stimulus"}
                    </Button>
                  </div>

                  {showStimulus && (
                    <div className="space-y-3 pt-1 border-t">
                      <div className="space-y-1">
                        <Label htmlFor="stimulus-text" className="text-[11px] font-medium text-muted-foreground">
                          Teks Stimulus (Wacana, Paragraf Bacaan, Kutipan Hadits/Ayat)
                        </Label>
                        <Textarea
                          id="stimulus-text"
                          placeholder="Masukkan teks stimulus atau wacana bacaan yang menjadi rujukan soal..."
                          value={stimulusText}
                          onChange={(e) => setStimulusText(e.target.value)}
                          rows={3}
                          className="text-xs bg-background"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <ImageIcon className="size-3.5 text-primary" />
                            Gambar / Grafik Stimulus (Opsional)
                          </Label>

                          {/* Toggle Mode: Unggah Berkas vs Tautan URL */}
                          <div className="inline-flex items-center rounded-md border bg-muted/40 p-0.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setStimulusImageSource("upload")}
                              className={`px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1 ${
                                stimulusImageSource === "upload"
                                  ? "bg-background text-foreground shadow-2xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <UploadCloudIcon className="size-3" />
                              Unggah Berkas
                            </button>
                            <button
                              type="button"
                              onClick={() => setStimulusImageSource("url")}
                              className={`px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1 ${
                                stimulusImageSource === "url"
                                  ? "bg-background text-foreground shadow-2xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <LinkIcon className="size-3" />
                              Tautan URL
                            </button>
                          </div>
                        </div>

                        {stimulusImageSource === "upload" ? (
                          <div className="space-y-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={handleFileChange}
                              className="hidden"
                              id="stimulus-file-input"
                            />

                            {stimulusMediaUrl ? (
                              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  <div className="size-9 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                                    <img
                                      src={stimulusMediaUrl}
                                      alt="Pratinjau gambar stimulus"
                                      className="size-full object-cover"
                                    />
                                  </div>
                                  <div className="truncate">
                                    <div className="font-medium text-foreground text-[11px]">Gambar Berhasil Terpasang</div>
                                    <div className="text-[10px] text-muted-foreground truncate font-mono">
                                      {stimulusMediaStorageId ? "Tersimpan di Cloud Pesantren" : stimulusMediaUrl}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs px-2 gap-1"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingImage}
                                  >
                                    <RefreshCwIcon className="size-3" />
                                    Ganti
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2 text-destructive hover:text-destructive gap-1"
                                    onClick={handleRemoveImage}
                                  >
                                    <Trash2Icon className="size-3" />
                                    Hapus
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                                className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors bg-background hover:bg-muted/40 flex flex-col items-center justify-center gap-1.5 ${
                                  isUploadingImage ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              >
                                {isUploadingImage ? (
                                  <>
                                    <Loader2Icon className="size-5 animate-spin text-primary" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Mengunggah berkas gambar...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <UploadCloudIcon className="size-5 text-muted-foreground" />
                                    <div className="text-xs font-semibold text-foreground">
                                      Pilih Berkas Gambar
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      Format PNG, JPG, WebP, atau SVG (Maksimal 5 MB)
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Input
                              id="stimulus-media"
                              placeholder="https://example.com/gambar-infografis.png"
                              value={stimulusMediaUrl}
                              onChange={(e) => {
                                setStimulusMediaUrl(e.target.value)
                                setStimulusMediaStorageId(undefined)
                              }}
                              className="h-8 text-xs bg-background"
                            />
                            {stimulusMediaUrl && (
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[11px] text-destructive hover:text-destructive px-1.5 gap-1"
                                  onClick={handleRemoveImage}
                                >
                                  <Trash2Icon className="size-3" />
                                  Hapus Tautan
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Teks Pertanyaan Utama */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="q-text" className="text-xs font-semibold">
                      Teks Pertanyaan *
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Nomor Urut: #{displayOrderNumber}
                    </span>
                  </div>
                  <Textarea
                    id="q-text"
                    placeholder="Tuliskan butir soal di sini (mendukung teks Arab & harakat)..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-1.5 max-w-[160px]">
                  <Label htmlFor="q-points" className="text-xs font-semibold">
                    Bobot Poin Soal *
                  </Label>
                  <Input
                    id="q-points"
                    type="number"
                    min={1}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Kolom sisi pengajar: pembahasan, tingkat berpikir, dan rujukan capaian */}
                <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  <div className="space-y-1">
                    <Label htmlFor="q-explanation" className="text-xs font-semibold">
                      Pembahasan (tidak dilihat santri)
                    </Label>
                    <Textarea
                      id="q-explanation"
                      placeholder="Alasan jawaban benar, dalil, atau catatan koreksi untuk pengajar..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      rows={3}
                      className="text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="q-thinking-level" className="text-xs font-semibold">
                        Tingkat berpikir
                      </Label>
                      <Select
                        items={{
                          untagged: UNTAGGED_THINKING_LEVEL_LABEL,
                          ...THINKING_LEVEL_LABELS,
                        }}
                        value={thinkingLevel}
                        onValueChange={(val) =>
                          setThinkingLevel((val ?? "untagged") as ThinkingLevel | "untagged")
                        }
                      >
                        <SelectTrigger id="q-thinking-level" className="w-full h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="untagged">{UNTAGGED_THINKING_LEVEL_LABEL}</SelectItem>
                          {THINKING_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {THINKING_LEVEL_LABELS[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="q-achievement" className="text-xs font-semibold">
                        Rujukan capaian materi
                      </Label>
                      <Input
                        id="q-achievement"
                        list="q-achievement-suggestions"
                        placeholder="mis. Thaharah — rukun wudhu"
                        value={achievementRef}
                        onChange={(e) => setAchievementRef(e.target.value)}
                        maxLength={80}
                        className="h-8 text-xs bg-background"
                      />
                      <datalist id="q-achievement-suggestions">
                        {achievementLabels?.map((label) => (
                          <option key={label} value={label} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Ketiganya hanya terbaca pengajar. Saran capaian diambil dari label yang sudah dipakai
                    mata pelajaran paket ini.
                  </p>
                </div>

                {/* Jumlah opsi jawaban dapat diatur dua sampai lima (A sampai E) */}
                {(questionType === "multiple_choice" || questionType === "pg_kompleks") && (
                  <QuestionOptionsEditor
                    options={mcOptions}
                    keyMode={questionType === "multiple_choice" ? "single" : "multiple"}
                    onChange={setMcOptions}
                  />
                )}

                {/* Benar / Salah */}
                {questionType === "true_false" && (
                  <div className="space-y-2.5 pt-1">
                    <Label className="text-xs font-semibold">Tentukan Kunci Status Pernyataan</Label>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setTfAnswer("true")}
                        suppressHydrationWarning
                        data-1p-ignore="true"
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          tfAnswer === "true"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs"
                            : "bg-card hover:bg-muted/50 text-muted-foreground border-border"
                        }`}
                      >
                        <CheckCircle2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Pernyataan Benar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTfAnswer("false")}
                        suppressHydrationWarning
                        data-1p-ignore="true"
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          tfAnswer === "false"
                            ? "border-rose-600 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 ring-2 ring-rose-500/30 shadow-xs"
                            : "bg-card hover:bg-muted/50 text-muted-foreground border-border"
                        }`}
                      >
                        <XIcon className="size-4 text-rose-600 dark:text-rose-400" />
                        <span>Pernyataan Salah</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Essay */}
                {questionType === "essay" && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="q-rubric" className="text-xs font-semibold">
                      Pedoman Rubrik Penilaian (Opsional)
                    </Label>
                    <Textarea
                      id="q-rubric"
                      placeholder="Panduan bagi penguji: poin-poin jawaban yang diharapkan dari santri..."
                      value={rubric}
                      onChange={(e) => setRubric(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t flex flex-wrap items-center justify-end gap-2">
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={resetForm}
                  >
                    <XIcon className="size-4" />
                    Batal sunting
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="gap-1.5 text-xs">
                  {editingId ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                  {isSubmitting ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Simpan Butir Soal"}
                </Button>
              </CardFooter>
            </form>
            )}

            {!showSingleForm && (
              <QuestionImportPanel
                bankId={bankId}
                startOrderNumber={upcomingOrderNumber}
                onSaved={handleImportSaved}
              />
            )}
          </Card>
        </div>

        {/* Right Column: Split Tab [Live Preview] and [Daftar Soal Tersimpan] (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-1">
              <Button
                variant={rightView === "preview" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5 font-heading"
                onClick={() => setRightView("preview")}
              >
                <EyeIcon className="size-3.5 text-primary" />
                Live Preview
              </Button>
              <Button
                variant={rightView === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5 font-heading"
                onClick={() => setRightView("list")}
              >
                <ListChecksIcon className="size-3.5" />
                Daftar Soal ({questionsList.length})
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              {rightView === "preview" ? "Simulasi Siswa" : "Urut Sesuai Nomor"}
            </span>
          </div>

          {/* VIEW 1: LIVE PREVIEW SISWA */}
          {rightView === "preview" && (
            <div className="space-y-3">
              <Card className="border shadow-xs bg-card">
                <CardHeader className="p-4 pb-3 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{displayOrderNumber}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {getQuestionTypeLabel(questionType)}
                      </Badge>
                      <span className="text-xs font-semibold text-primary font-mono">
                        {points} Poin
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                      Pratinjau Siswa
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Stimulus Preview */}
                  {(stimulusText.trim() || stimulusMediaUrl.trim()) && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-primary font-semibold text-[11px]">
                        <FileTextIcon className="size-3.5" />
                        Wacana / Stimulus Soal
                      </div>
                      {stimulusMediaUrl.trim() && (
                        <div className="rounded border overflow-hidden max-h-48 bg-muted flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={stimulusMediaUrl.trim()}
                            alt="Media stimulus preview"
                            className="object-contain max-h-48 w-full"
                          />
                        </div>
                      )}
                      {stimulusText.trim() && (
                        <p className="whitespace-pre-line text-muted-foreground leading-relaxed italic">
                          {stimulusText.trim()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pertanyaan Preview */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Pertanyaan:
                    </div>
                    <p className="whitespace-pre-line leading-relaxed font-medium text-sm text-foreground">
                      {questionText.trim() || (
                        <span className="text-muted-foreground/60 italic">
                          Teks pertanyaan akan tampil di sini secara real-time saat Anda mengetik...
                        </span>
                      )}
                    </p>
                  </div>

                  <Separator />

                  {/* Opsi Jawaban Preview. Panel ini mensimulasikan tampilan santri; payload
                      santri dari server tidak membawa jawaban benar maupun pedoman penilaian,
                      jadi penanda jawaban benar tidak boleh dirender di sini. */}
                  {questionType === "multiple_choice" && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Pilih satu jawaban yang paling tepat:
                      </div>
                      {mcOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card"
                        >
                          <div className="size-4 rounded-full border border-primary shrink-0" />
                          <span className="font-bold text-xs">{opt.label}.</span>
                          <span className="flex-1 text-xs">
                            {opt.text.trim() || <span className="text-muted-foreground/50 italic">(Opsi kosong)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionType === "pg_kompleks" && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Pilih semua pernyataan yang benar (dapat lebih dari satu):
                      </div>
                      {mcOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card"
                        >
                          <div className="size-4 rounded-xs border border-primary shrink-0" />
                          <span className="font-bold text-xs">{opt.label}.</span>
                          <span className="flex-1 text-xs">
                            {opt.text.trim() || <span className="text-muted-foreground/50 italic">(Opsi kosong)</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionType === "true_false" && (
                    <div className="space-y-2.5">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Simulasi tombol pilihan santri:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg border bg-muted/40 text-muted-foreground text-center font-semibold text-xs">
                          Benar
                        </div>
                        <div className="p-2.5 rounded-lg border bg-muted/40 text-muted-foreground text-center font-semibold text-xs">
                          Salah
                        </div>
                      </div>
                    </div>
                  )}

                  {questionType === "essay" && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Simulasi area lembar jawaban santri:
                      </div>
                      <div className="p-3 rounded-lg border border-dashed bg-muted/20 text-muted-foreground text-xs italic">
                        Santri akan mengetik jawaban uraian mereka pada area ini saat sesi ujian berlangsung.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* VIEW 2: DAFTAR SOAL TERSIMPAN */}
          {rightView === "list" && (
            <div className="space-y-3">
              {isLocked && (
                <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-2.5 text-[11px] text-amber-900 dark:text-amber-300">
                  <LockIcon className="size-3.5 shrink-0 mt-0.5" />
                  <span>{lockedReason}</span>
                </p>
              )}

              {questionsList.length === 0 ? (
                <QuestionListEmpty />
              ) : (
                <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                  {questionsList.map((q) => (
                    <QuestionRow
                      key={q._id}
                      question={q}
                      typeLabel={getQuestionTypeLabel(q.type as QuestionType)}
                      locked={isLocked}
                      lockedReason={lockedReason}
                      isEditing={editingId === q._id}
                      onEdit={startEdit}
                      onDuplicate={handleDuplicateQuestion}
                      onDelete={handleDeleteQuestion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <QuestionExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        questions={exportableQuestions}
        header={{
          title: bank.title,
          subjectName: bank.subjectName,
          gradeLevel: bank.gradeLevel,
          institutionName: "Pesantren At-Tauhid",
        }}
      />

      <AiQuestionGeneratorDialog
        open={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        subjectName={bank.subjectName}
        gradeLevel={bank.gradeLevel}
        onApplyDraft={handleApplyAiDraft}
      />
    </div>
  )
}
