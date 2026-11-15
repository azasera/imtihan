"use client"

import * as React from "react"
import {
  BookOpenIcon,
  CheckCircle2Icon,
  CalculatorIcon,
  SlidersHorizontalIcon,
  HelpCircleIcon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  calculateEffectivePhScore,
  calculateAveragePh,
  calculateAverageTasks,
  calculateCompositeDailyScore,
  type DailyAssessments,
  type DailyAssessmentPh,
} from "@/lib/rapor-utils"

export interface StudentAssessmentRow {
  santriId: string
  nisn: string
  studentName: string
  dailyAssessments?: DailyAssessments
  currentDailyScore: number
}

interface DailyAssessmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName: string
  subjectCode: string
  className: string
  kkm?: number
  students: StudentAssessmentRow[]
  onSave: (
    updatedRows: Array<{
      santriId: string
      dailyScore: number
      dailyAssessments: DailyAssessments
    }>
  ) => void
}

type ViewColumnFilter = "all" | "ph1" | "ph2" | "ph3" | "ph4" | "tasks"

export function DailyAssessmentsModal({
  open,
  onOpenChange,
  subjectName,
  subjectCode,
  className,
  kkm = 70,
  students,
  onSave,
}: DailyAssessmentsModalProps) {
  const [viewFilter, setViewFilter] = React.useState<ViewColumnFilter>("all")

  // State lokal rincian per santri: Map<santriId, DailyAssessments>
  const [assessmentsMap, setAssessmentsMap] = React.useState<Record<string, DailyAssessments>>({})

  // Inisialisasi data saat modal dibuka
  React.useEffect(() => {
    if (open) {
      const initial: Record<string, DailyAssessments> = {}
      for (const s of students) {
        const phs: DailyAssessmentPh[] = [
          { score: s.dailyAssessments?.ph?.[0]?.score, remedial: s.dailyAssessments?.ph?.[0]?.remedial },
          { score: s.dailyAssessments?.ph?.[1]?.score, remedial: s.dailyAssessments?.ph?.[1]?.remedial },
          { score: s.dailyAssessments?.ph?.[2]?.score, remedial: s.dailyAssessments?.ph?.[2]?.remedial },
          { score: s.dailyAssessments?.ph?.[3]?.score, remedial: s.dailyAssessments?.ph?.[3]?.remedial },
        ]

        const tasks: Array<number | undefined> = [
          s.dailyAssessments?.tasks?.[0],
          s.dailyAssessments?.tasks?.[1],
          s.dailyAssessments?.tasks?.[2],
          s.dailyAssessments?.tasks?.[3],
        ]

        initial[s.santriId] = {
          ph: phs,
          tasks,
        }
      }
      setAssessmentsMap(initial)
    }
  }, [open, students])

  const handlePhChange = (
    santriId: string,
    phIndex: number,
    field: "score" | "remedial",
    rawVal: string
  ) => {
    const val = rawVal === "" ? undefined : parseFloat(rawVal)

    setAssessmentsMap((prev) => {
      const current = prev[santriId] || { ph: [], tasks: [] }
      const newPh: DailyAssessmentPh[] = [...(current.ph || [])]

      while (newPh.length <= phIndex) {
        newPh.push({})
      }

      newPh[phIndex] = {
        ...newPh[phIndex],
        [field]: val,
      }

      return {
        ...prev,
        [santriId]: {
          ...current,
          ph: newPh,
        },
      }
    })
  }

  const handleTaskChange = (
    santriId: string,
    taskIndex: number,
    rawVal: string
  ) => {
    const val = rawVal === "" ? undefined : parseFloat(rawVal)

    setAssessmentsMap((prev) => {
      const current = prev[santriId] || { ph: [], tasks: [] }
      const newTasks = [...(current.tasks || [])]

      while (newTasks.length <= taskIndex) {
        newTasks.push(undefined)
      }

      newTasks[taskIndex] = val

      return {
        ...prev,
        [santriId]: {
          ...current,
          tasks: newTasks,
        },
      }
    })
  }

  // Navigasi keyboard antar baris (Enter / ArrowDown / ArrowUp)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIdx: number, fieldKey: string) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault()
      const nextInput = document.querySelector<HTMLInputElement>(
        `input[data-nav="${fieldKey}-${currentIdx + 1}"]`
      )
      if (nextInput) {
        nextInput.focus()
        nextInput.select()
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prevInput = document.querySelector<HTMLInputElement>(
        `input[data-nav="${fieldKey}-${currentIdx - 1}"]`
      )
      if (prevInput) {
        prevInput.focus()
        prevInput.select()
      }
    }
  }

  const handleReset = () => {
    const initial: Record<string, DailyAssessments> = {}
    for (const s of students) {
      initial[s.santriId] = {
        ph: [{}, {}, {}, {}],
        tasks: [undefined, undefined, undefined, undefined],
      }
    }
    setAssessmentsMap(initial)
    toast.info("Isian buku nilai harian telah direset.")
  }

  const handleSave = () => {
    const results = students.map((s) => {
      const assess = assessmentsMap[s.santriId] || { ph: [], tasks: [] }
      const calculatedDaily = calculateCompositeDailyScore(assess.ph, assess.tasks, kkm)

      // Membersihkan tasks agar sesuai validasi array of numbers di Convex
      const cleanedTasks = (assess.tasks || []).filter((t): t is number => typeof t === "number" && !isNaN(t))

      return {
        santriId: s.santriId,
        dailyScore: calculatedDaily > 0 ? calculatedDaily : s.currentDailyScore,
        dailyAssessments: {
          ph: assess.ph,
          tasks: cleanedTasks,
        },
      }
    })

    onSave(results)
    toast.success("Rincian penilaian harian berhasil diterapkan ke lembar nilai!")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-[96vw] md:max-w-[95vw] lg:max-w-[92vw] xl:max-w-[1380px] h-[92vh] max-h-[94vh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-xl">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  <BookOpenIcon className="size-5" />
                </div>
                <DialogTitle className="text-base sm:text-xl font-bold tracking-tight">
                  Buku Nilai Harian Guru: {subjectName} ({subjectCode})
                </DialogTitle>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="font-semibold text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                    Kelas {className}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                    KKM: {kkm}
                  </Badge>
                </div>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Catat penilaian berkala sepanjang semester (PH 1-4 dan Tugas 1-4). Kolom <span className="font-semibold text-foreground">Murni</span> adalah nilai asli ulangan, <span className="font-semibold text-amber-700 dark:text-amber-400">Remedial</span> otomatis menggantikan nilai murni (maks. KKM).
              </DialogDescription>
            </div>
          </div>

          {/* Bar Filter Fokus Kolom & Panduan Warna */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3">
            <Tabs
              value={viewFilter}
              onValueChange={(v) => setViewFilter(v as ViewColumnFilter)}
              className="w-auto"
            >
              <TabsList className="h-9 p-1 bg-muted/80 text-xs">
                <TabsTrigger value="all" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold">
                  Semua Kolom
                </TabsTrigger>
                <TabsTrigger value="ph1" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold">
                  Fokus PH 1
                </TabsTrigger>
                <TabsTrigger value="ph2" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold">
                  Fokus PH 2
                </TabsTrigger>
                <TabsTrigger value="ph3" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold">
                  Fokus PH 3
                </TabsTrigger>
                <TabsTrigger value="ph4" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold">
                  Fokus PH 4
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold">
                  Fokus Tugas
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/20 font-medium">
                <span className="size-2 rounded-full bg-blue-600" />
                Nilai Murni
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/20 font-medium">
                <span className="size-2 rounded-full bg-amber-500" />
                Remedial (Maks {kkm})
              </span>
              <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-md border border-purple-500/20 font-medium">
                <span className="size-2 rounded-full bg-purple-600" />
                Tugas Berkala
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-500/20 font-medium">
                <span className="size-2 rounded-full bg-emerald-600" />
                Nilai Harian Otomatis
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Tabel Spreadsheet Luas & Bersih */}
        <div className="flex-1 overflow-auto border rounded-xl mt-3 bg-card shadow-xs relative">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md text-left font-semibold border-b">
              <tr className="divide-x divide-border">
                {/* Kolom Sticky No */}
                <th
                  rowSpan={2}
                  className="sticky left-0 z-40 bg-muted/95 backdrop-blur-md p-2.5 w-12 text-center text-muted-foreground border-r border-border"
                >
                  No
                </th>

                {/* Kolom Sticky Identitas Santri */}
                <th
                  rowSpan={2}
                  className="sticky left-12 z-40 bg-muted/95 backdrop-blur-md p-2.5 min-w-[210px] max-w-[280px] border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]"
                >
                  Daftar Santri
                </th>

                {/* Kolom PH 1 */}
                {(viewFilter === "all" || viewFilter === "ph1") && (
                  <th colSpan={2} className="p-2 text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 border-b border-blue-500/20">
                    Penilaian Harian 1 (PH 1)
                  </th>
                )}

                {/* Kolom PH 2 */}
                {(viewFilter === "all" || viewFilter === "ph2") && (
                  <th colSpan={2} className="p-2 text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 border-b border-blue-500/20">
                    Penilaian Harian 2 (PH 2)
                  </th>
                )}

                {/* Kolom PH 3 */}
                {(viewFilter === "all" || viewFilter === "ph3") && (
                  <th colSpan={2} className="p-2 text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 border-b border-blue-500/20">
                    Penilaian Harian 3 (PH 3)
                  </th>
                )}

                {/* Kolom PH 4 */}
                {(viewFilter === "all" || viewFilter === "ph4") && (
                  <th colSpan={2} className="p-2 text-center bg-blue-500/10 text-blue-900 dark:text-blue-200 border-b border-blue-500/20">
                    Penilaian Harian 4 (PH 4)
                  </th>
                )}

                {/* Kolom Tugas 1 - 4 */}
                {(viewFilter === "all" || viewFilter === "tasks") && (
                  <th colSpan={4} className="p-2 text-center bg-purple-500/10 text-purple-900 dark:text-purple-200 border-b border-purple-500/20">
                    Tugas & PR Berkala
                  </th>
                )}

                {/* Kolom Kalkulasi Realtime */}
                <th colSpan={3} className="p-2 text-center bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-b border-emerald-500/20">
                  Hasil Rata-rata & Nilai Harian
                </th>
              </tr>

              {/* Baris Sub-header Kolom */}
              <tr className="divide-x divide-border text-[11px] text-center text-muted-foreground border-b">
                {(viewFilter === "all" || viewFilter === "ph1") && (
                  <>
                    <th className="p-1.5 w-16 bg-blue-500/5 text-blue-800 dark:text-blue-300 font-semibold">Murni</th>
                    <th className="p-1.5 w-16 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold">Remedial</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "ph2") && (
                  <>
                    <th className="p-1.5 w-16 bg-blue-500/5 text-blue-800 dark:text-blue-300 font-semibold">Murni</th>
                    <th className="p-1.5 w-16 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold">Remedial</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "ph3") && (
                  <>
                    <th className="p-1.5 w-16 bg-blue-500/5 text-blue-800 dark:text-blue-300 font-semibold">Murni</th>
                    <th className="p-1.5 w-16 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold">Remedial</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "ph4") && (
                  <>
                    <th className="p-1.5 w-16 bg-blue-500/5 text-blue-800 dark:text-blue-300 font-semibold">Murni</th>
                    <th className="p-1.5 w-16 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold">Remedial</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "tasks") && (
                  <>
                    <th className="p-1.5 w-16 bg-purple-500/5 text-purple-800 dark:text-purple-300 font-semibold">Tugas 1</th>
                    <th className="p-1.5 w-16 bg-purple-500/5 text-purple-800 dark:text-purple-300 font-semibold">Tugas 2</th>
                    <th className="p-1.5 w-16 bg-purple-500/5 text-purple-800 dark:text-purple-300 font-semibold">Tugas 3</th>
                    <th className="p-1.5 w-16 bg-purple-500/5 text-purple-800 dark:text-purple-300 font-semibold">Tugas 4</th>
                  </>
                )}
                <th className="p-1.5 w-20 text-center bg-blue-500/5 text-blue-800 dark:text-blue-300 font-semibold">
                  Av. PH
                </th>
                <th className="p-1.5 w-20 text-center bg-purple-500/5 text-purple-800 dark:text-purple-300 font-semibold">
                  Av. Tugas
                </th>
                <th className="p-1.5 w-24 text-center bg-emerald-600 text-white dark:bg-emerald-700 font-bold tracking-wide">
                  Nilai Akhir
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {students.map((s, idx) => {
                const assess = assessmentsMap[s.santriId] || { ph: [], tasks: [] }
                const avgPh = calculateAveragePh(assess.ph, kkm)
                const avgTasks = calculateAverageTasks(assess.tasks)
                const composite = calculateCompositeDailyScore(assess.ph, assess.tasks, kkm)

                return (
                  <tr key={s.santriId} className="group hover:bg-muted/40 divide-x divide-border transition-colors">
                    {/* No Sticky */}
                    <td className="sticky left-0 z-20 bg-card group-hover:bg-muted/50 p-2 text-center text-muted-foreground font-mono border-r border-border">
                      {idx + 1}
                    </td>

                    {/* Nama Santri & NISN Sticky */}
                    <td className="sticky left-12 z-20 bg-card group-hover:bg-muted/50 p-2.5 min-w-[210px] max-w-[280px] border-r border-border shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                      <div className="font-semibold text-foreground text-xs leading-snug truncate" title={s.studentName}>
                        {s.studentName}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        NISN: {s.nisn || "-"}
                      </div>
                    </td>

                    {/* PH 1 */}
                    {(viewFilter === "all" || viewFilter === "ph1") && (
                      <>
                        <td className="p-1.5 text-center bg-blue-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[0]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 0, "score", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph1-score")}
                            data-nav={`ph1-score-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-amber-500/[0.03]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[0]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 0, "remedial", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph1-rem")}
                            data-nav={`ph1-rem-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                      </>
                    )}

                    {/* PH 2 */}
                    {(viewFilter === "all" || viewFilter === "ph2") && (
                      <>
                        <td className="p-1.5 text-center bg-blue-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[1]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 1, "score", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph2-score")}
                            data-nav={`ph2-score-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-amber-500/[0.03]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[1]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 1, "remedial", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph2-rem")}
                            data-nav={`ph2-rem-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                      </>
                    )}

                    {/* PH 3 */}
                    {(viewFilter === "all" || viewFilter === "ph3") && (
                      <>
                        <td className="p-1.5 text-center bg-blue-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[2]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 2, "score", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph3-score")}
                            data-nav={`ph3-score-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-amber-500/[0.03]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[2]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 2, "remedial", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph3-rem")}
                            data-nav={`ph3-rem-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                      </>
                    )}

                    {/* PH 4 */}
                    {(viewFilter === "all" || viewFilter === "ph4") && (
                      <>
                        <td className="p-1.5 text-center bg-blue-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[3]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 3, "score", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph4-score")}
                            data-nav={`ph4-score-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-amber-500/[0.03]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[3]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 3, "remedial", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "ph4-rem")}
                            data-nav={`ph4-rem-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                      </>
                    )}

                    {/* Tugas 1 - 4 */}
                    {(viewFilter === "all" || viewFilter === "tasks") && (
                      <>
                        <td className="p-1.5 text-center bg-purple-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[0] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 0, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "tgs-0")}
                            data-nav={`tgs-0-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-purple-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[1] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 1, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "tgs-1")}
                            data-nav={`tgs-1-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-purple-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[2] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 2, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "tgs-2")}
                            data-nav={`tgs-2-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                        <td className="p-1.5 text-center bg-purple-500/[0.02]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[3] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 3, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, "tgs-3")}
                            data-nav={`tgs-3-${idx}`}
                            placeholder="-"
                            className="h-8 w-14 sm:w-16 mx-auto text-center text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-md"
                          />
                        </td>
                      </>
                    )}

                    {/* Ringkasan Realtime */}
                    <td className="p-2 text-center font-bold text-blue-700 dark:text-blue-300 font-mono text-xs">
                      {avgPh > 0 ? avgPh : "-"}
                    </td>
                    <td className="p-2 text-center font-bold text-purple-700 dark:text-purple-300 font-mono text-xs">
                      {avgTasks > 0 ? avgTasks : "-"}
                    </td>
                    <td className="p-2 text-center bg-emerald-500/10">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs text-emerald-800 dark:text-emerald-200">
                        {composite > 0 ? composite : s.currentDailyScore || "-"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Dialog Footer Bersih & Lega */}
        <DialogFooter className="pt-3.5 border-t shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <CalculatorIcon className="size-4 text-emerald-600 shrink-0" />
            <span>
              Nilai harian akhir dihitung dari proporsi <strong className="text-foreground font-semibold">60% Rata-rata PH</strong> + <strong className="text-foreground font-semibold">40% Rata-rata Tugas</strong> (atau 100% PH jika belum ada tugas).
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              title="Reset seluruh isian di modal ini"
            >
              <RotateCcwIcon className="size-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="gap-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <SaveIcon className="size-3.5" />
              Terapkan ke Lembar Nilai
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
