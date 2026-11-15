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
      <DialogContent className="max-w-6xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpenIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Buku Nilai Harian Guru: {subjectName} ({subjectCode})
                </DialogTitle>
                <Badge variant="outline" className="text-xs">
                  Kelas {className}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Catat penilaian berkala (PH 1-4 dan Tugas 1-4). Kolom N adalah Nilai Murni, R adalah Nilai Remedial.
                Sistem otomatis menghitung nilai rata-rata secara proporsional.
              </DialogDescription>
            </div>
          </div>

          {/* Bar Filter Fokus Kolom */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
            <Tabs
              value={viewFilter}
              onValueChange={(v) => setViewFilter(v as ViewColumnFilter)}
              className="w-auto"
            >
              <TabsList className="h-8 text-xs">
                <TabsTrigger value="all" className="text-xs px-2.5 py-1">Semua Kolom</TabsTrigger>
                <TabsTrigger value="ph1" className="text-xs px-2.5 py-1">Fokus PH 1</TabsTrigger>
                <TabsTrigger value="ph2" className="text-xs px-2.5 py-1">Fokus PH 2</TabsTrigger>
                <TabsTrigger value="ph3" className="text-xs px-2.5 py-1">Fokus PH 3</TabsTrigger>
                <TabsTrigger value="ph4" className="text-xs px-2.5 py-1">Fokus PH 4</TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs px-2.5 py-1">Fokus Tugas</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded border">
                <span className="font-semibold text-foreground">N</span> = Nilai Murni
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                <span className="font-semibold">R</span> = Remedial
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Tabel Spreadsheet Mikro */}
        <div className="flex-1 overflow-auto border rounded-lg mt-2 bg-background">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm shadow-sm text-left font-semibold">
              <tr className="border-b divide-x">
                <th rowSpan={2} className="p-2 w-10 text-center bg-muted/90">No</th>
                <th rowSpan={2} className="p-2 w-28 bg-muted/90">NISN</th>
                <th rowSpan={2} className="p-2 min-w-44 bg-muted/90">Nama Santri</th>

                {/* Kolom PH 1 */}
                {(viewFilter === "all" || viewFilter === "ph1") && (
                  <th colSpan={2} className="p-1.5 text-center bg-blue-500/10 text-blue-800 dark:text-blue-300">
                    PH 1
                  </th>
                )}

                {/* Kolom PH 2 */}
                {(viewFilter === "all" || viewFilter === "ph2") && (
                  <th colSpan={2} className="p-1.5 text-center bg-blue-500/10 text-blue-800 dark:text-blue-300">
                    PH 2
                  </th>
                )}

                {/* Kolom PH 3 */}
                {(viewFilter === "all" || viewFilter === "ph3") && (
                  <th colSpan={2} className="p-1.5 text-center bg-blue-500/10 text-blue-800 dark:text-blue-300">
                    PH 3
                  </th>
                )}

                {/* Kolom PH 4 */}
                {(viewFilter === "all" || viewFilter === "ph4") && (
                  <th colSpan={2} className="p-1.5 text-center bg-blue-500/10 text-blue-800 dark:text-blue-300">
                    PH 4
                  </th>
                )}

                {/* Kolom Tugas 1 - 4 */}
                {(viewFilter === "all" || viewFilter === "tasks") && (
                  <>
                    <th className="p-1.5 w-14 text-center bg-purple-500/10 text-purple-800 dark:text-purple-300">T-1</th>
                    <th className="p-1.5 w-14 text-center bg-purple-500/10 text-purple-800 dark:text-purple-300">T-2</th>
                    <th className="p-1.5 w-14 text-center bg-purple-500/10 text-purple-800 dark:text-purple-300">T-3</th>
                    <th className="p-1.5 w-14 text-center bg-purple-500/10 text-purple-800 dark:text-purple-300">T-4</th>
                  </>
                )}

                {/* Kolom Rata-rata */}
                <th rowSpan={2} className="p-2 w-16 text-center bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                  Av. PH
                </th>
                <th rowSpan={2} className="p-2 w-16 text-center bg-purple-500/10 text-purple-800 dark:text-purple-300">
                  Av. TGS
                </th>
                <th rowSpan={2} className="p-2 w-20 text-center bg-emerald-600 text-white dark:bg-emerald-700">
                  Nilai Harian
                </th>
              </tr>

              {/* Sub-header N & R */}
              <tr className="border-b divide-x text-[10px] text-center text-muted-foreground">
                {(viewFilter === "all" || viewFilter === "ph1") && (
                  <>
                    <th className="p-1 w-12 bg-blue-500/5">N</th>
                    <th className="p-1 w-12 bg-amber-500/10 text-amber-700 dark:text-amber-400">R</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "ph2") && (
                  <>
                    <th className="p-1 w-12 bg-blue-500/5">N</th>
                    <th className="p-1 w-12 bg-amber-500/10 text-amber-700 dark:text-amber-400">R</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "ph3") && (
                  <>
                    <th className="p-1 w-12 bg-blue-500/5">N</th>
                    <th className="p-1 w-12 bg-amber-500/10 text-amber-700 dark:text-amber-400">R</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "ph4") && (
                  <>
                    <th className="p-1 w-12 bg-blue-500/5">N</th>
                    <th className="p-1 w-12 bg-amber-500/10 text-amber-700 dark:text-amber-400">R</th>
                  </>
                )}
                {(viewFilter === "all" || viewFilter === "tasks") && (
                  <>
                    <th className="p-1 bg-purple-500/5">KD</th>
                    <th className="p-1 bg-purple-500/5">KD</th>
                    <th className="p-1 bg-purple-500/5">KD</th>
                    <th className="p-1 bg-purple-500/5">KD</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y">
              {students.map((s, idx) => {
                const assess = assessmentsMap[s.santriId] || { ph: [], tasks: [] }
                const avgPh = calculateAveragePh(assess.ph, kkm)
                const avgTasks = calculateAverageTasks(assess.tasks)
                const composite = calculateCompositeDailyScore(assess.ph, assess.tasks, kkm)

                return (
                  <tr key={s.santriId} className="hover:bg-muted/30 divide-x transition-colors">
                    <td className="p-1.5 text-center text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="p-1.5 font-mono text-[11px] text-muted-foreground">{s.nisn}</td>
                    <td className="p-1.5 font-medium whitespace-nowrap">{s.studentName}</td>

                    {/* PH 1 */}
                    {(viewFilter === "all" || viewFilter === "ph1") && (
                      <>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[0]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 0, "score", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1 bg-amber-500/5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[0]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 0, "remedial", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold text-amber-700 dark:text-amber-400 border-amber-500/30"
                          />
                        </td>
                      </>
                    )}

                    {/* PH 2 */}
                    {(viewFilter === "all" || viewFilter === "ph2") && (
                      <>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[1]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 1, "score", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1 bg-amber-500/5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[1]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 1, "remedial", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold text-amber-700 dark:text-amber-400 border-amber-500/30"
                          />
                        </td>
                      </>
                    )}

                    {/* PH 3 */}
                    {(viewFilter === "all" || viewFilter === "ph3") && (
                      <>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[2]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 2, "score", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1 bg-amber-500/5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[2]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 2, "remedial", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold text-amber-700 dark:text-amber-400 border-amber-500/30"
                          />
                        </td>
                      </>
                    )}

                    {/* PH 4 */}
                    {(viewFilter === "all" || viewFilter === "ph4") && (
                      <>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[3]?.score ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 3, "score", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1 bg-amber-500/5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.ph?.[3]?.remedial ?? ""}
                            onChange={(e) => handlePhChange(s.santriId, 3, "remedial", e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold text-amber-700 dark:text-amber-400 border-amber-500/30"
                          />
                        </td>
                      </>
                    )}

                    {/* Tugas 1 - 4 */}
                    {(viewFilter === "all" || viewFilter === "tasks") && (
                      <>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[0] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 0, e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[1] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 1, e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[2] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 2, e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                        <td className="p-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={assess.tasks?.[3] ?? ""}
                            onChange={(e) => handleTaskChange(s.santriId, 3, e.target.value)}
                            placeholder="-"
                            className="h-7 w-12 text-center text-xs p-1 font-semibold"
                          />
                        </td>
                      </>
                    )}

                    {/* Ringkasan Realtime */}
                    <td className="p-1.5 text-center font-bold text-blue-700 dark:text-blue-400">
                      {avgPh > 0 ? avgPh : "-"}
                    </td>
                    <td className="p-1.5 text-center font-bold text-purple-700 dark:text-purple-400">
                      {avgTasks > 0 ? avgTasks : "-"}
                    </td>
                    <td className="p-1.5 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/5">
                      {composite > 0 ? composite : s.currentDailyScore || "-"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <CalculatorIcon className="size-3.5 text-emerald-600" />
            <span>
              Nilai harian akhir dihitung dari kombinasi Av. PH (60%) dan Av. Tugas (40%), atau 100% PH jika belum ada tugas.
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
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
