"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClockIcon,
  FileEditIcon,
  GraduationCapIcon,
  HelpCircleIcon,
  SaveIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { thinkingLevelLabel } from "@/convex/model/thinkingLevels"
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
import { Textarea } from "@/components/ui/textarea"

export default function KoreksiEssayPage() {
  const params = useParams()
  const participantId = params?.id as Id<"examParticipants">

  const gradingData = useQuery(
    api.examSession.public.queries.getParticipantAnswersForGrading,
    participantId ? { participantId } : "skip"
  )

  const gradeEssay = useMutation(api.examSession.public.mutations.gradeEssayAnswer)

  // Koreksi yang belum disimpan pengajar. Nilai tersimpan dibaca langsung dari
  // query, sehingga tidak perlu disalin ke state lewat efek.
  const [scoreEdits, setScoreEdits] = React.useState<Record<string, number>>({})
  const [feedbackEdits, setFeedbackEdits] = React.useState<Record<string, string>>({})
  const [savingQuestionId, setSavingQuestionId] = React.useState<string | null>(null)

  const essayScores = React.useMemo(() => {
    const saved: Record<string, number> = {}
    for (const q of gradingData?.questions ?? []) {
      if (q.type === "essay" && q.studentAnswer?.scoreAwarded !== undefined) {
        saved[q.id] = q.studentAnswer.scoreAwarded
      }
    }
    return { ...saved, ...scoreEdits }
  }, [gradingData, scoreEdits])

  const essayFeedbacks = React.useMemo(() => {
    const saved: Record<string, string> = {}
    for (const q of gradingData?.questions ?? []) {
      if (q.type === "essay" && q.studentAnswer?.teacherFeedback) {
        saved[q.id] = q.studentAnswer.teacherFeedback
      }
    }
    return { ...saved, ...feedbackEdits }
  }, [gradingData, feedbackEdits])

  const handleSaveScore = async (questionId: string, maxPoints: number) => {
    const rawScore = essayScores[questionId]
    if (rawScore === undefined || rawScore === null) {
      toast.error("Silakan masukkan nilai skor untuk butir essay ini.")
      return
    }

    if (rawScore < 0 || rawScore > maxPoints) {
      toast.error(`Nilai harus di antara 0 dan ${maxPoints} poin.`)
      return
    }

    setSavingQuestionId(questionId)
    try {
      await gradeEssay({
        participantId,
        questionId: questionId as Id<"questions">,
        scoreAwarded: Number(rawScore),
        teacherFeedback: essayFeedbacks[questionId] || "",
      })
      toast.success("Nilai butir essay berhasil disimpan dan total nilai diperbarui!")
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal menyimpan nilai butir essay.")
    } finally {
      setSavingQuestionId(null)
    }
  }

  if (gradingData === undefined) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
        Memuat lembar koreksi ujian santri...
      </div>
    )
  }

  if (gradingData === null) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-sm text-destructive">Data peserta ujian tidak ditemukan atau Anda tidak memiliki akses.</p>
        <Link href="/rekap-nilai" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kembali ke Rekap Nilai
        </Link>
      </div>
    )
  }

  const { participant, session, bank, questions } = gradingData

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <Link
            href="/rekap-nilai"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 mb-1 gap-1 text-xs" })}
          >
            <ArrowLeftIcon className="size-3.5" />
            Kembali ke Rekap Nilai
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs font-mono">
              {bank?.subjectCode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {participant.className || bank?.gradeLevel}
            </Badge>
            {participant.gradingStatus === "graded" ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1">
                <CheckCircle2Icon className="size-3" />
                Selesai Dinilai
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px]">
                Perlu Koreksi Essay
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 font-heading">
            Lembar Koreksi: {participant.studentName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            NISN: <span className="font-mono font-semibold text-foreground">{participant.nisn}</span> • Sesi: {session?.title}
          </p>
        </div>

        {/* Skor Summary Card */}
        <div className="flex items-center gap-3 bg-card border rounded-lg p-3 shrink-0 shadow-2xs">
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Nilai Pilihan Ganda</div>
            <div className="text-sm font-bold font-mono text-emerald-600">
              {participant.multipleChoiceScore ?? 0} Poin
            </div>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Nilai Essay</div>
            <div className="text-sm font-bold font-mono text-amber-600">
              {participant.essayScore ?? 0} Poin
            </div>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Total Nilai Akhir</div>
            <div className="text-base font-bold font-mono text-primary">
              {participant.totalScore ?? participant.multipleChoiceScore ?? 0} Poin
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Butir Soal & Koreksi */}
      <div className="space-y-6">
        {questions.map((q) => {
          const isEssay = q.type === "essay"
          const studentAns = q.studentAnswer
          const isSaving = savingQuestionId === q.id

          return (
            <Card key={q.id} id={`butir-${q.orderNumber}`} className="border shadow-xs scroll-mt-24">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    Soal #{q.orderNumber}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {isEssay ? "Essay / Uraian" : "Pilihan Ganda"}
                  </Badge>
                </div>
                <span className="text-xs font-mono font-semibold text-primary">
                  Bobot: {q.points} Poin
                </span>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs sm:text-sm">
                {/* Wacana / Stimulus Soal jika ada */}
                {(q.stimulusMediaUrl || q.stimulusText) && (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-2 text-xs">
                    <div className="font-semibold text-primary flex items-center gap-1.5 text-[11px]">
                      <BookOpenIcon className="size-3.5" />
                      Wacana / Stimulus Soal:
                    </div>
                    {q.stimulusMediaUrl && (
                      <div className="rounded border overflow-hidden bg-background flex items-center justify-center p-1 max-w-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.stimulusMediaUrl}
                          alt="Media stimulus soal"
                          referrerPolicy="no-referrer"
                          className="object-contain max-h-56 w-full rounded"
                        />
                      </div>
                    )}
                    {q.stimulusText && (
                      <p className="whitespace-pre-line text-muted-foreground leading-relaxed text-[11px]">
                        {q.stimulusText}
                      </p>
                    )}
                  </div>
                )}

                {/* Teks Pertanyaan */}
                <div className="leading-relaxed whitespace-pre-line font-medium text-foreground">
                  {q.questionText}
                </div>

                {/* Penanda pengajar: pembahasan, tingkat berpikir, dan rujukan capaian */}
                {(q.explanation || q.thinkingLevel || q.achievementRef) && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-[11px]">
                    {q.explanation && (
                      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                        <span className="font-semibold text-foreground">Pembahasan: </span>
                        {q.explanation}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      Tingkat berpikir:{" "}
                      <span className="font-medium text-foreground">{thinkingLevelLabel(q.thinkingLevel)}</span>
                    </p>
                    {q.achievementRef && (
                      <p className="text-muted-foreground">
                        Rujukan capaian: <span className="font-medium text-foreground">{q.achievementRef}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Koreksi Otomatis Pilihan Ganda */}
                {!isEssay && q.options && (
                  <div className="space-y-2 pt-1 border-t">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      Pilihan Jawaban & Hasil Pemeriksaan Otomatis:
                    </div>
                    <div className="space-y-1.5">
                      {q.options.map((opt) => {
                        const isStudentChoice = studentAns?.selectedOptionId === opt.id
                        const isKey = opt.isCorrect

                        let stateStyle = "bg-card border"
                        if (isKey) {
                          stateStyle = "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium"
                        } else if (isStudentChoice && !isKey) {
                          stateStyle = "border-destructive bg-destructive/10 text-destructive font-medium"
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${stateStyle}`}
                          >
                            <div className="flex items-center gap-2">
                              {q.type !== "true_false" && (
                                <span className="min-w-5 shrink-0 font-bold font-mono">{opt.label}.</span>
                              )}
                              <span>{opt.text || opt.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isStudentChoice && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  Dipilih Santri
                                </Badge>
                              )}
                              {isKey && (
                                <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                  <CheckIcon className="size-3" />
                                  Kunci Jawaban
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Poin Butir Ini:</span>
                      <span className="font-mono font-bold text-foreground">
                        {studentAns?.scoreAwarded ?? 0} / {q.points} Poin
                      </span>
                    </div>
                  </div>
                )}

                {/* Koreksi Manual Essay */}
                {isEssay && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* Rubrik Pengajar */}
                    {q.rubric && (
                      <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                          <BookOpenIcon className="size-3.5 text-primary" />
                          Pedoman Rubrik Penilaian:
                        </div>
                        <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-[11px]">
                          {q.rubric}
                        </p>
                      </div>
                    )}

                    {/* Jawaban Santri */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FileEditIcon className="size-3.5 text-primary" />
                        Jawaban Tertulis Santri:
                      </div>
                      <div className="p-3 rounded-lg border bg-background text-xs whitespace-pre-line leading-relaxed font-normal min-h-[70px]">
                        {studentAns?.essayAnswer ? (
                          studentAns.essayAnswer
                        ) : (
                          <span className="text-muted-foreground italic">
                            (Santri tidak mengisi jawaban untuk butir soal ini)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Input Skor & Catatan Evaluasi Pengajar */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20 items-end">
                      <div className="sm:col-span-3 space-y-1">
                        <Label htmlFor={`score-${q.id}`} className="text-xs font-semibold">
                          Beri Nilai (Maks: {q.points}) *
                        </Label>
                        <Input
                          id={`score-${q.id}`}
                          type="number"
                          min={0}
                          max={q.points}
                          placeholder={`0 - ${q.points}`}
                          value={essayScores[q.id] !== undefined ? essayScores[q.id] : ""}
                          onChange={(e) =>
                            setScoreEdits((prev) => ({
                              ...prev,
                              [q.id]: Number(e.target.value),
                            }))
                          }
                          className="font-mono text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-6 space-y-1">
                        <Label htmlFor={`feedback-${q.id}`} className="text-xs font-semibold">
                          Catatan Evaluasi / Masukan Pengajar
                        </Label>
                        <Input
                          id={`feedback-${q.id}`}
                          placeholder="Catatan untuk santri (opsional)..."
                          value={essayFeedbacks[q.id] ?? ""}
                          onChange={(e) =>
                            setFeedbackEdits((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          className="text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Button
                          size="sm"
                          disabled={isSaving}
                          onClick={() => handleSaveScore(q.id, q.points)}
                          className="w-full text-xs gap-1.5"
                        >
                          <SaveIcon className="size-3.5" />
                          {isSaving ? "Menyimpan..." : "Simpan Nilai"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
