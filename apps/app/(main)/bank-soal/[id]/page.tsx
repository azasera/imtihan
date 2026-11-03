"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  EyeIcon,
  FileTextIcon,
  HelpCircleIcon,
  ImageIcon,
  LayersIcon,
  ListChecksIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type QuestionType = "multiple_choice" | "pg_kompleks" | "true_false" | "essay"

export default function BankSoalEditorPage() {
  const params = useParams()
  const bankId = params.id as Id<"questionBanks">

  const bank = useQuery(api.bank.public.queries.getQuestionBank, { bankId })
  const createQuestion = useMutation(api.bank.public.mutations.createQuestion)
  const deleteQuestion = useMutation(api.bank.public.mutations.deleteQuestion)

  // Form states for new question
  const [questionType, setQuestionType] = React.useState<QuestionType>("multiple_choice")
  const [stimulusText, setStimulusText] = React.useState("")
  const [stimulusMediaUrl, setStimulusMediaUrl] = React.useState("")
  const [showStimulus, setShowStimulus] = React.useState(false)
  const [questionText, setQuestionText] = React.useState("")
  const [points, setPoints] = React.useState(5)
  const [rubric, setRubric] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Multiple choice & PG Kompleks options: A, B, C, D
  const [mcOptions, setMcOptions] = React.useState([
    { id: "a", label: "A", text: "", isCorrect: true },
    { id: "b", label: "B", text: "", isCorrect: false },
    { id: "c", label: "C", text: "", isCorrect: false },
    { id: "d", label: "D", text: "", isCorrect: false },
  ])

  // True/False options
  const [tfAnswer, setTfAnswer] = React.useState<"true" | "false">("true")

  // Right column view toggle: "preview" vs "list"
  const [rightView, setRightView] = React.useState<"preview" | "list">("preview")

  function handleOptionTextChange(index: number, text: string) {
    setMcOptions((prev) => {
      const copy = [...prev]
      copy[index].text = text
      return copy
    })
  }

  function handleSetSingleCorrectOption(index: number) {
    setMcOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    )
  }

  function handleToggleComplexOption(index: number) {
    setMcOptions((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], isCorrect: !copy[index].isCorrect }
      return copy
    })
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!questionText.trim()) {
      toast.error("Teks soal pertanyaan wajib diisi.")
      return
    }

    if (questionType === "multiple_choice") {
      const filledOptions = mcOptions.filter((o) => o.text.trim().length > 0)
      if (filledOptions.length < 2) {
        toast.error("Soal pilihan ganda harus memiliki minimal 2 opsi jawaban yang terisi.")
        return
      }
      const correctCount = filledOptions.filter((o) => o.isCorrect).length
      if (correctCount !== 1) {
        toast.error("Soal pilihan ganda harus memiliki tepat satu kunci jawaban yang benar.")
        return
      }
    }

    if (questionType === "pg_kompleks") {
      const filledOptions = mcOptions.filter((o) => o.text.trim().length > 0)
      if (filledOptions.length < 3) {
        toast.error("Soal pilihan ganda kompleks harus memiliki minimal 3 opsi jawaban yang terisi.")
        return
      }
      const correctCount = filledOptions.filter((o) => o.isCorrect).length
      if (correctCount < 2) {
        toast.error("Soal pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban yang benar.")
        return
      }
    }

    let preparedOptions: Array<{ id: string; label: string; text: string; isCorrect: boolean }> | undefined

    if (questionType === "multiple_choice" || questionType === "pg_kompleks") {
      preparedOptions = mcOptions.map((o) => ({
        id: o.id,
        label: o.label,
        text: o.text.trim(),
        isCorrect: o.isCorrect,
      }))
    } else if (questionType === "true_false") {
      preparedOptions = [
        {
          id: "true",
          label: "Benar",
          text: "Pernyataan Benar",
          isCorrect: tfAnswer === "true",
        },
        {
          id: "false",
          label: "Salah",
          text: "Pernyataan Salah",
          isCorrect: tfAnswer === "false",
        },
      ]
    }

    try {
      setIsSubmitting(true)
      await createQuestion({
        bankId,
        type: questionType,
        stimulusText: stimulusText.trim() || undefined,
        stimulusMediaUrl: stimulusMediaUrl.trim() || undefined,
        questionText: questionText.trim(),
        points: Number(points),
        options: preparedOptions,
        rubric: questionType === "essay" ? rubric.trim() || undefined : undefined,
      })

      toast.success("Butir soal berhasil ditambahkan!")
      // Reset form
      setQuestionText("")
      setStimulusText("")
      setStimulusMediaUrl("")
      setShowStimulus(false)
      setRubric("")
      setMcOptions([
        { id: "a", label: "A", text: "", isCorrect: true },
        { id: "b", label: "B", text: "", isCorrect: false },
        { id: "c", label: "C", text: "", isCorrect: false },
        { id: "d", label: "D", text: "", isCorrect: false },
      ])
      setTfAnswer("true")
      setRightView("list")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan butir soal."
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteQuestion(questionId: Id<"questions">, orderNumber: number) {
    if (!confirm(`Hapus butir soal nomor ${orderNumber}?`)) {
      return
    }

    try {
      await deleteQuestion({ questionId })
      toast.success("Butir soal berhasil dihapus.")
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

  const questionsList = bank.questions ?? []

  function getQuestionTypeLabel(type: QuestionType) {
    switch (type) {
      case "multiple_choice":
        return "Pilihan Ganda"
      case "pg_kompleks":
        return "PG Kompleks"
      case "true_false":
        return "Benar / Salah"
      case "essay":
        return "Essay"
    }
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
            <Badge variant="outline" className="border-primary/30 text-primary font-mono text-xs">
              {bank.subjectCode}
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

        <div className="flex items-center gap-3 bg-card border rounded-lg p-3 shrink-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Input Butir Soal & Stimulus (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base font-heading">Tambah Butir Soal Baru</CardTitle>
                <Tabs
                  value={questionType}
                  onValueChange={(val) => setQuestionType(val as QuestionType)}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="multiple_choice" className="text-xs px-2.5">
                      Pilihan Ganda
                    </TabsTrigger>
                    <TabsTrigger value="pg_kompleks" className="text-xs px-2.5">
                      PG Kompleks
                    </TabsTrigger>
                    <TabsTrigger value="true_false" className="text-xs px-2.5">
                      Benar / Salah
                    </TabsTrigger>
                    <TabsTrigger value="essay" className="text-xs px-2.5">
                      Essay
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription className="text-xs">
                {questionType === "multiple_choice" && "Pilihan ganda standar: tentukan tepat satu kunci jawaban yang benar."}
                {questionType === "pg_kompleks" && "Pilihan ganda kompleks: tandai minimal dua opsi sebagai kunci jawaban benar."}
                {questionType === "true_false" && "Tentukan apakah pernyataan bernilai Benar atau Salah."}
                {questionType === "essay" && "Tuliskan pertanyaan uraian dan cantumkan pedoman rubrik penilaian."}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAddQuestion}>
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

                      <div className="space-y-1">
                        <Label htmlFor="stimulus-media" className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="size-3" />
                          URL Gambar / Grafik Stimulus (Opsional)
                        </Label>
                        <Input
                          id="stimulus-media"
                          placeholder="https://example.com/gambar-infografis.png"
                          value={stimulusMediaUrl}
                          onChange={(e) => setStimulusMediaUrl(e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
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
                      Nomor Urut: #{questionsList.length + 1}
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

                {/* Pilihan Ganda (Single Choice) */}
                {questionType === "multiple_choice" && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Pilihan Opsi Jawaban & Kunci</Label>
                      <span className="text-[11px] text-muted-foreground">Pilih radio untuk 1 kunci jawaban</span>
                    </div>

                    <div className="space-y-2">
                      {mcOptions.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            opt.isCorrect ? "border-primary/60 bg-primary/5" : "bg-card"
                          }`}
                        >
                          <input
                            type="radio"
                            name="correct-option"
                            id={`opt-radio-${opt.id}`}
                            checked={opt.isCorrect}
                            onChange={() => handleSetSingleCorrectOption(idx)}
                            className="size-4 text-primary accent-primary cursor-pointer shrink-0"
                            title="Tandai sebagai kunci jawaban"
                          />
                          <Label
                            htmlFor={`opt-radio-${opt.id}`}
                            className="w-5 text-center font-bold text-xs shrink-0 cursor-pointer"
                          >
                            {opt.label}.
                          </Label>
                          <Input
                            placeholder={`Teks pilihan jawaban ${opt.label}...`}
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            className="h-8 text-xs bg-background"
                          />
                          {opt.isCorrect && (
                            <Badge variant="default" className="text-[10px] bg-primary h-6 px-2 shrink-0">
                              Kunci
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pilihan Ganda Kompleks (Multi Choice) */}
                {questionType === "pg_kompleks" && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Pilihan Opsi Jawaban & Kunci Majemuk</Label>
                      <span className="text-[11px] text-muted-foreground">Centang minimal 2 kunci jawaban</span>
                    </div>

                    <div className="space-y-2">
                      {mcOptions.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                            opt.isCorrect ? "border-primary/60 bg-primary/5" : "bg-card"
                          }`}
                        >
                          <Checkbox
                            id={`opt-check-${opt.id}`}
                            checked={opt.isCorrect}
                            onCheckedChange={() => handleToggleComplexOption(idx)}
                            className="size-4 shrink-0 cursor-pointer"
                          />
                          <Label
                            htmlFor={`opt-check-${opt.id}`}
                            className="w-5 text-center font-bold text-xs shrink-0 cursor-pointer"
                          >
                            {opt.label}.
                          </Label>
                          <Input
                            placeholder={`Teks pilihan jawaban ${opt.label}...`}
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                            className="h-8 text-xs bg-background"
                          />
                          {opt.isCorrect && (
                            <Badge variant="default" className="text-[10px] bg-primary h-6 px-2 shrink-0">
                              Kunci
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benar / Salah */}
                {questionType === "true_false" && (
                  <div className="space-y-2.5 pt-1">
                    <Label className="text-xs font-semibold">Tentukan Kunci Status Pernyataan</Label>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setTfAnswer("true")}
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          tfAnswer === "true"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-2 ring-emerald-500/30"
                            : "bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2Icon className="size-4" />
                        Pernyataan Benar
                      </button>
                      <button
                        type="button"
                        onClick={() => setTfAnswer("false")}
                        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          tfAnswer === "false"
                            ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 ring-2 ring-rose-500/30"
                            : "bg-card hover:bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <HelpCircleIcon className="size-4" />
                        Pernyataan Salah
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

              <CardFooter className="pt-2 border-t flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="gap-1.5 text-xs">
                  <PlusIcon className="size-4" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Butir Soal"}
                </Button>
              </CardFooter>
            </form>
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
                        #{questionsList.length + 1}
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

                  {/* Opsi Jawaban Preview */}
                  {questionType === "multiple_choice" && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Pilih satu jawaban yang paling tepat:
                      </div>
                      {mcOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                            opt.isCorrect
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="size-4 rounded-full border border-primary flex items-center justify-center shrink-0">
                            {opt.isCorrect && <div className="size-2 rounded-full bg-primary" />}
                          </div>
                          <span className="font-bold text-xs">{opt.label}.</span>
                          <span className="flex-1 text-xs">
                            {opt.text.trim() || <span className="text-muted-foreground/50 italic">(Opsi kosong)</span>}
                          </span>
                          {opt.isCorrect && (
                            <Badge variant="outline" className="text-[9px] text-primary border-primary/40 h-5 px-1.5">
                              Kunci
                            </Badge>
                          )}
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
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                            opt.isCorrect
                              ? "border-primary/50 bg-primary/5"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="size-4 rounded-xs border border-primary flex items-center justify-center shrink-0">
                            {opt.isCorrect && <CheckCircle2Icon className="size-3 text-primary" />}
                          </div>
                          <span className="font-bold text-xs">{opt.label}.</span>
                          <span className="flex-1 text-xs">
                            {opt.text.trim() || <span className="text-muted-foreground/50 italic">(Opsi kosong)</span>}
                          </span>
                          {opt.isCorrect && (
                            <Badge variant="outline" className="text-[9px] text-primary border-primary/40 h-5 px-1.5">
                              Kunci
                            </Badge>
                          )}
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
                        <div
                          className={`p-2.5 rounded-lg border text-center font-semibold text-xs transition-all ${
                            tfAnswer === "true"
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          Benar {tfAnswer === "true" && "(Kunci)"}
                        </div>
                        <div
                          className={`p-2.5 rounded-lg border text-center font-semibold text-xs transition-all ${
                            tfAnswer === "false"
                              ? "border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                              : "bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          Salah {tfAnswer === "false" && "(Kunci)"}
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
                      {rubric.trim() && (
                        <div className="p-2.5 bg-muted/40 rounded text-[11px] text-muted-foreground border">
                          <span className="font-semibold text-foreground">Rubrik Penguji:</span> {rubric.trim()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* VIEW 2: DAFTAR SOAL TERSIMPAN */}
          {rightView === "list" && (
            <div className="space-y-3">
              {questionsList.length === 0 ? (
                <Card className="border-dashed p-8 text-center text-xs text-muted-foreground space-y-2">
                  <LayersIcon className="size-8 mx-auto text-muted-foreground/60" />
                  <p>Belum ada butir soal dalam paket ini. Gunakan formulir di sebelah kiri untuk mulai menambahkan soal.</p>
                </Card>
              ) : (
                <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                  {questionsList.map((q) => (
                    <Card key={q._id} className="border shadow-2xs">
                      <CardHeader className="p-3.5 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              #{q.orderNumber}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {getQuestionTypeLabel(q.type as QuestionType)}
                            </Badge>
                            {(q.stimulusText || q.stimulusMediaUrl) && (
                              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                                Stimulus
                              </Badge>
                            )}
                            <span className="text-xs font-semibold text-primary font-mono ml-1">
                              {q.points} Poin
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteQuestion(q._id, q.orderNumber)}
                            title="Hapus butir soal ini"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
                        {/* Wacana stimulus jika ada */}
                        {q.stimulusText && (
                          <div className="p-2 rounded bg-muted/40 border text-[11px] text-muted-foreground italic line-clamp-2">
                            {q.stimulusText}
                          </div>
                        )}

                        <p className="whitespace-pre-line leading-relaxed font-medium">
                          {q.questionText}
                        </p>

                        {/* Tampilan opsi pilihan ganda / PG kompleks / Benar-Salah */}
                        {q.options && (
                          <div className="space-y-1 pt-1 border-t text-[11px]">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`flex items-center gap-1.5 p-1 px-1.5 rounded ${
                                  opt.isCorrect
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <span className="w-5 font-mono">{opt.label}.</span>
                                <span className="flex-1">{opt.text}</span>
                                {opt.isCorrect && (
                                  <CheckCircle2Icon className="size-3 text-primary shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Jika Essay, tampilkan info rubrik */}
                        {q.type === "essay" && q.rubric && (
                          <div className="p-2 bg-muted/40 rounded text-[11px] text-muted-foreground border">
                            <span className="font-semibold text-foreground">Rubrik:</span> {q.rubric}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
