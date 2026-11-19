"use client"

import * as React from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import {
  GraduationCapIcon,
  DownloadIcon,
  PrinterIcon,
  SparklesIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  FileTextIcon,
  FileArchiveIcon,
  UsersIcon,
  ArrowRightIcon,
  SaveIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  FileSpreadsheetIcon,
  SlidersHorizontal,
  AwardIcon,
  PlusIcon,
  Trash2Icon,
  Maximize2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyCheckIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  type ExtracurricularItem,
  EXTRACURRICULAR_PREDICATES,
  OFFICIAL_EXTRACURRICULARS,
  getExtracurricularNarrative,
  normalizeEkskulName,
} from "@/lib/extracurricular-constants"
import { EKSKUL_ROSTER_DATA } from "@/lib/extracurricular-roster"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { GradeImportModal } from "@/components/rapor/GradeImportModal"
import type { ImportMatchResult } from "@/lib/excel-grade-import"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReportCardPrintView, DEFAULT_KOKURIKULER_NOTE } from "@/components/rapor/ReportCardPrintView"
import { ClassSettingsModal } from "@/components/rapor/ClassSettingsModal"
import { DailyAssessmentsModal } from "@/components/rapor/DailyAssessmentsModal"
import {
  exportSingleReportPdf,
  exportSeparatedReportsZip,
  exportCombinedReportsPdf,
} from "@/lib/rapor-pdf"
import {
  calculateNAR,
  getGradePredicate,
  generateCompetencyNarrative,
  getDefaultCpForSubject,
  cleanStudentName,
  isDiniyahSubject,
  isUmumSubject,
  OFFICIAL_SUBJECTS,
  type Institution,
  type DailyAssessments,
} from "@/lib/rapor-utils"

interface GradeOverride {
  dailyScore?: number
  dailyAssessments?: DailyAssessments
  midtermScore?: number
  finalExamScore?: number
  finalScore?: number
  isManualFinalScore?: boolean
  competencyNarrative?: string
}

export default function RaporPage() {
  const { data: session } = authClient.useSession()
  const isLoggedIn = !!session?.user
  const [selectedInstitution, setSelectedInstitution] = React.useState<Institution>("SMPITA")
  const [selectedClass, setSelectedClass] = React.useState("7A")
  const [selectedSubject, setSelectedSubject] = React.useState("PAI")
  const isCurrentSubjectDiniyah = isDiniyahSubject(selectedSubject)
  const [subjectCategoryFilter, setSubjectCategoryFilter] = React.useState<"all" | "umum" | "diniyah">("all")
  const [currentCp, setCurrentCp] = React.useState(() => getDefaultCpForSubject("PAI"))
  const [isSyncingSubjects, setIsSyncingSubjects] = React.useState(false)
  const [legerFilter, setLegerFilter] = React.useState<"all" | "umum" | "diniyah">("all")
  const [academicYear, setAcademicYear] = React.useState("2026/2027")
  const [semester, setSemester] = React.useState<1 | 2>(1)
  const [activeTab, setActiveTab] = React.useState("nilai-mapel")

  // Dynamic classes dari database
  const dbClasses = useQuery(api.students.public.queries.getClassesByLembaga, {
    jenjang: selectedInstitution,
  })

  const classOptions = React.useMemo(() => {
    if (dbClasses && dbClasses.length > 0) {
      return dbClasses
    }
    const fallbackMap: Record<Institution, string[]> = {
      SMPITA: ["7A", "7B", "8A", "8B", "9A", "9B", "VII A", "VII B", "VIII A", "VIII B", "IX A", "IX B"],
      SMAITA: ["10A", "10B", "11A", "11B", "12A", "12B", "X A", "X B", "XI A", "XI B", "XII A", "XII B"],
      MTA: ["MTA 1", "MTA 2", "MTA 3", "MTA 4"],
    }
    return fallbackMap[selectedInstitution] || fallbackMap.SMPITA
  }, [dbClasses, selectedInstitution])

  // Sinkronkan selectedClass jika tidak ada di classOptions saat ini
  React.useEffect(() => {
    if (classOptions.length > 0 && !classOptions.includes(selectedClass)) {
      setSelectedClass(classOptions[0])
    }
  }, [classOptions, selectedClass])

  // Sinkronisasi data santri dari SiPAKSa
  const syncStudentsAction = useAction(api.students.public.actions.syncStudentsFromSipaksa)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const handleSyncStudents = async () => {
    setIsSyncing(true)
    try {
      const res = await syncStudentsAction({})
      const prunedNote = res.totalPruned ? `, ${res.totalPruned} data lama dibersihkan` : ""
      toast.success(
        `Sinkronisasi berhasil! ${res.totalFiltered} santri aktif (SMP: ${res.byJenjang.SMPITA}, SMA: ${res.byJenjang.SMAITA}, MTA: ${res.byJenjang.MTA}) berhasil dihubungkan${prunedNote}.`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi gangguan saat menghubungkan ke SiPAKSa"
      if (msg.includes("login") || msg.includes("Akses ditolak") || msg.includes("Server Error")) {
        toast.error("Silakan masuk dengan akun pengajar terlebih dahulu untuk sinkronisasi santri.")
      } else {
        toast.error(msg)
      }
    } finally {
      setIsSyncing(false)
    }
  }

  // Modal Tarik Nilai CBT
  const [isPullModalOpen, setIsPullModalOpen] = React.useState(false)
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>("")
  const [pullTargetColumn, setPullTargetColumn] = React.useState<"midterm" | "finalExam">("midterm")
  const [cpDescriptionForPull, setCpDescriptionForPull] = React.useState("")
  const [isPulling, setIsPulling] = React.useState(false)

  // Modal Import dari Excel
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [isClassSettingsModalOpen, setIsClassSettingsModalOpen] = React.useState(false)
  const [isDailyAssessmentsModalOpen, setIsDailyAssessmentsModalOpen] = React.useState(false)
  const [narrativeModalSantriId, setNarrativeModalSantriId] = React.useState<string | null>(null)

  // Santri terpilih untuk cetak rapor & opsi periode asesmen
  const [selectedSantriId, setSelectedSantriId] = React.useState<string>("")
  const [reportType, setReportType] = React.useState<"umum" | "diniyah">("umum")
  const [assessmentPeriod, setAssessmentPeriod] = React.useState<"STS" | "SAS">("SAS")
  const [showKop, setShowKop] = React.useState<boolean>(true)
  const [printMode, setPrintMode] = React.useState<"single" | "class">("single")
  const [isExportingPdf, setIsExportingPdf] = React.useState(false)
  const [exportProgress, setExportProgress] = React.useState<string | null>(null)

  // Asesmen Wali Kelas State
  const [sickDays, setSickDays] = React.useState<number>(0)
  const [permissionDays, setPermissionDays] = React.useState<number>(0)
  const [absentDays, setAbsentDays] = React.useState<number>(0)
  const [haditsTarget, setHaditsTarget] = React.useState("3 Hadits Arba'in")
  const [haditsAchievement, setHaditsAchievement] = React.useState("3 Hadits Tuntas")
  const [homeroomNotes, setHomeroomNotes] = React.useState(
    "Alhamdulillah, semangat belajar dan tingkatkan terus prestasimu. Ta'at kepada guru dan orangtua serta istiqomah muraja'ah Al-Qur'an dan Hadits setiap hari."
  )
  const [kokurikulerNotes, setKokurikulerNotes] = React.useState(DEFAULT_KOKURIKULER_NOTE)
  const [promotionDecision, setPromotionDecision] = React.useState("NAIK KE KELAS : VIII (DELAPAN)")
  const [extracurriculars, setExtracurriculars] = React.useState<ExtracurricularItem[]>([
    {
      name: "Rohis",
      score: "A",
      description: getExtracurricularNarrative("Rohis", "A"),
    },
  ])
  const [isSyncingEkskul, setIsSyncingEkskul] = React.useState(false)

  // Local overrides untuk nilai yang sedang diedit pengguna
  const [gradeOverrides, setGradeOverrides] = React.useState<Record<string, GradeOverride>>({})

  // Queries
  const subjects = useQuery(api.bank.public.queries.listSubjects) ?? []

  const availableSubjectsList = React.useMemo(() => {
    const rawList = subjects.length > 0 ? subjects.filter((s) => s.isActive !== false) : OFFICIAL_SUBJECTS
    const officialFiltered = rawList.filter((s) =>
      OFFICIAL_SUBJECTS.some((o) => o.code.toUpperCase() === s.code.toUpperCase())
    )
    const list = officialFiltered.length > 0 ? officialFiltered : OFFICIAL_SUBJECTS
    const sorted = [...list].sort((a, b) => {
      const idxA = OFFICIAL_SUBJECTS.findIndex((o) => o.code.toUpperCase() === a.code.toUpperCase())
      const idxB = OFFICIAL_SUBJECTS.findIndex((o) => o.code.toUpperCase() === b.code.toUpperCase())
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
    })
    const umumList = sorted.filter((s) => isUmumSubject(s.code))
    const diniyahList = sorted.filter((s) => isDiniyahSubject(s.code))
    return {
      all: sorted,
      umum: umumList,
      diniyah: diniyahList,
    }
  }, [subjects])

  const displayedSubjects = React.useMemo(() => {
    if (subjectCategoryFilter === "umum") return availableSubjectsList.umum
    if (subjectCategoryFilter === "diniyah") return availableSubjectsList.diniyah
    return availableSubjectsList.all
  }, [availableSubjectsList, subjectCategoryFilter])
  const availableSessions = useQuery(
    api.rapor.public.queries.listAvailableExamSessionsForPull,
    isLoggedIn ? { subjectCode: selectedSubject } : "skip"
  ) ?? []

  const gradesData = useQuery(
    api.rapor.public.queries.getSubjectGradesForClass,
    isLoggedIn
      ? {
          subjectCode: selectedSubject,
          className: selectedClass,
          academicYear,
          semester,
        }
      : "skip"
  )

  const classLeger = useQuery(
    api.rapor.public.queries.getClassLeger,
    isLoggedIn
      ? {
          className: selectedClass,
          academicYear,
          semester,
        }
      : "skip"
  )

  const legerSubjects = React.useMemo(() => {
    const dbSubjects = (classLeger?.subjects ?? []).filter((s) =>
      OFFICIAL_SUBJECTS.some((o) => o.code.toUpperCase() === s.code.toUpperCase())
    )
    const baseList =
      dbSubjects.length === 16
        ? dbSubjects
        : OFFICIAL_SUBJECTS.map((s) => ({ code: s.code, name: s.name }))
    return baseList.filter((s) => {
      if (legerFilter === "umum") return isUmumSubject(s.code)
      if (legerFilter === "diniyah") return isDiniyahSubject(s.code)
      return true
    })
  }, [classLeger?.subjects, legerFilter])

  // Nilai turunan murni (React 19, tanpa setState di dalam useEffect)
  const editableGrades = React.useMemo(() => {
    if (!gradesData) return []
    return gradesData.map((g) => {
      const ov = gradeOverrides[g.santriId]
      const dailyScore = ov?.dailyScore !== undefined ? ov.dailyScore : g.dailyScore
      const dailyAssessments =
        ov?.dailyAssessments !== undefined ? ov.dailyAssessments : (g as any).dailyAssessments
      const midtermScore = ov?.midtermScore !== undefined ? ov.midtermScore : g.midtermScore
      const finalExamScore = ov?.finalExamScore !== undefined ? ov.finalExamScore : g.finalExamScore
      const calculatedNar = calculateNAR(dailyScore, midtermScore, finalExamScore)
      const hasComponentOverride =
        ov?.dailyScore !== undefined ||
        ov?.midtermScore !== undefined ||
        ov?.finalExamScore !== undefined

      let finalScore: number
      let isManualFinalScore: boolean

      if (!isCurrentSubjectDiniyah) {
        // Rapot Umum: Kunci nilai akhir, selalu gunakan kalkulasi rumus otomatis murni
        isManualFinalScore = false
        finalScore = calculatedNar
      } else {
        // Rapot Diniyah: Fleksibel / hybrid (bisa override manual atau kalkulasi rumus)
        if (ov?.isManualFinalScore !== undefined) {
          isManualFinalScore = ov.isManualFinalScore
          finalScore = ov.finalScore ?? calculatedNar
        } else if (ov?.finalScore !== undefined) {
          isManualFinalScore = ov.finalScore !== calculatedNar
          finalScore = ov.finalScore
        } else if (hasComponentOverride) {
          isManualFinalScore = false
          finalScore = calculatedNar
        } else if (typeof g.finalScore === "number" && g.finalScore > 0 && g.finalScore !== calculatedNar) {
          isManualFinalScore = true
          finalScore = g.finalScore
        } else {
          isManualFinalScore = false
          finalScore = calculatedNar
        }
      }

      const predicate = getGradePredicate(finalScore)
      const competencyNarrative =
        ov?.competencyNarrative !== undefined ? ov.competencyNarrative : g.competencyNarrative

      return {
        santriId: g.santriId,
        nisn: g.nisn,
        studentName: cleanStudentName(g.studentName),
        institution: g.institution as Institution,
        dailyScore,
        dailyAssessments,
        midtermScore,
        finalExamScore,
        finalScore,
        calculatedNar,
        isManualFinalScore,
        predicate,
        competencyNarrative,
      }
    })
  }, [gradesData, gradeOverrides, isCurrentSubjectDiniyah])

  const effectiveSantriId = selectedSantriId || editableGrades[0]?.santriId || ""

  // Single report card query for print view
  const singleReport = useQuery(
    api.rapor.public.queries.getStudentReportCard,
    isLoggedIn && effectiveSantriId
      ? {
          santriId: effectiveSantriId,
          academicYear,
          semester,
        }
      : "skip"
  )

  // Batch class report cards query for batch print and download
  const classReports = useQuery(
    api.rapor.public.queries.getClassReportCards,
    isLoggedIn && selectedClass
      ? {
          className: selectedClass,
          academicYear,
          semester,
        }
      : "skip"
  )

  // Mutations
  const saveGradesMutation = useMutation(api.rapor.public.mutations.saveSubjectGrades)
  const pullGradesMutation = useMutation(api.rapor.public.mutations.pullGradesFromExamSession)
  const saveHomeroomMutation = useMutation(api.rapor.public.mutations.saveHomeroomAssessment)
  const batchUpsertEkskulMutation = useMutation(api.rapor.public.mutations.batchUpsertExtracurriculars)
  const seedSubjectsMutation = useMutation(api.bank.public.mutations.seedDefaultSubjects)

  // Sinkronisasi data asesmen wali kelas & ekskul saat santri aktif atau data kueri berubah
  React.useEffect(() => {
    if (singleReport?.homeroom) {
      setSickDays(singleReport.homeroom.sickDays ?? 0)
      setPermissionDays(singleReport.homeroom.permissionDays ?? 0)
      setAbsentDays(singleReport.homeroom.absentDays ?? 0)
      if (singleReport.homeroom.haditsTarget) setHaditsTarget(singleReport.homeroom.haditsTarget)
      if (singleReport.homeroom.haditsAchievement) setHaditsAchievement(singleReport.homeroom.haditsAchievement)
      if (singleReport.homeroom.homeroomNotes) setHomeroomNotes(singleReport.homeroom.homeroomNotes)
      if (singleReport.homeroom.kokurikulerNotes !== undefined) {
        setKokurikulerNotes(singleReport.homeroom.kokurikulerNotes || DEFAULT_KOKURIKULER_NOTE)
      } else {
        setKokurikulerNotes(DEFAULT_KOKURIKULER_NOTE)
      }
      if (singleReport.homeroom.promotionDecision) setPromotionDecision(singleReport.homeroom.promotionDecision)

      if (singleReport.homeroom.extracurriculars && singleReport.homeroom.extracurriculars.length > 0) {
        setExtracurriculars(
          singleReport.homeroom.extracurriculars.map((e) => ({
            name: e.name,
            score: (e.score as "A" | "B" | "C") || "A",
            description: e.description || getExtracurricularNarrative(e.name, e.score || "A"),
          }))
        )
      } else {
        // Fallback cerdas: cari ekskul pilihan dari roster Excel bila ada
        const currentSantri = editableGrades.find((g) => g.santriId === effectiveSantriId)
        const matchedRoster = currentSantri
          ? EKSKUL_ROSTER_DATA.find((r) => {
              const rName = r.studentName.toLowerCase().trim()
              const sName = currentSantri.studentName.toLowerCase().trim()
              return rName === sName || (sName.includes(rName) && rName.length > 5)
            })
          : null

        const items: ExtracurricularItem[] = [
          {
            name: "Rohis",
            score: "A",
            description: getExtracurricularNarrative("Rohis", "A"),
          },
        ]
        if (matchedRoster) {
          const optName = normalizeEkskulName(matchedRoster.ekskul)
          items.push({
            name: optName,
            score: "A",
            description: getExtracurricularNarrative(optName, "A"),
          })
        }
        setExtracurriculars(items)
      }
    }
  }, [singleReport?.homeroom, effectiveSantriId, editableGrades])

  const handleSubjectChange = (newSubjectCode: string) => {
    setSelectedSubject(newSubjectCode)
    const defCp = getDefaultCpForSubject(newSubjectCode)
    setCurrentCp(defCp)
    setCpDescriptionForPull(defCp)
  }

  const handleSyncSubjects = async () => {
    try {
      setIsSyncingSubjects(true)
      await seedSubjectsMutation({})
      toast.success("16 Mata Pelajaran resmi berhasil disinkronkan dari berkas Excel!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyinkronkan mata pelajaran")
    } finally {
      setIsSyncingSubjects(false)
    }
  }

  const handleApplyAutoNarrativeToAll = () => {
    const cp = currentCp.trim() || getDefaultCpForSubject(selectedSubject)
    const newOverrides: Record<string, GradeOverride> = { ...gradeOverrides }
    editableGrades.forEach((g) => {
      const narrative = generateCompetencyNarrative(g.finalScore, cp)
      newOverrides[g.santriId] = {
        ...newOverrides[g.santriId],
        competencyNarrative: narrative,
      }
    })
    setGradeOverrides(newOverrides)
    toast.success("Narasi capaian otomatis berhasil diterapkan untuk seluruh santri!")
  }

  const handleScoreChange = (
    santriId: string,
    field: "dailyScore" | "midtermScore" | "finalExamScore" | "finalScore",
    value: number
  ) => {
    // Rapot Umum: Kunci nilai akhir, abaikan perubahan manual
    if (field === "finalScore" && !isCurrentSubjectDiniyah) {
      return
    }

    const rawVal = isNaN(value) ? 0 : value
    const numericVal = Math.max(0, Math.min(100, Math.round(rawVal)))
    const currentGrade = editableGrades.find((g) => g.santriId === santriId)
    const daily = field === "dailyScore" ? numericVal : (gradeOverrides[santriId]?.dailyScore ?? currentGrade?.dailyScore ?? 0)
    const midterm = field === "midtermScore" ? numericVal : (gradeOverrides[santriId]?.midtermScore ?? currentGrade?.midtermScore ?? 0)
    const finalExam = field === "finalExamScore" ? numericVal : (gradeOverrides[santriId]?.finalExamScore ?? currentGrade?.finalExamScore ?? 0)
    const calculatedNar = calculateNAR(daily, midterm, finalExam)

    const isManualFinal = field === "finalScore"
    const effectiveFinal = isManualFinal ? numericVal : calculatedNar

    const cp = currentCp.trim() || getDefaultCpForSubject(selectedSubject)
    const autoNarrative = generateCompetencyNarrative(effectiveFinal, cp)

    setGradeOverrides((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        [field]: numericVal,
        ...(isManualFinal
          ? { finalScore: numericVal, isManualFinalScore: true }
          : { finalScore: calculatedNar, isManualFinalScore: false }),
        competencyNarrative: autoNarrative,
      },
    }))
  }

  const handleResetFinalScore = (santriId: string) => {
    const currentGrade = editableGrades.find((g) => g.santriId === santriId)
    if (!currentGrade) return
    const calculated = currentGrade.calculatedNar
    const cp = currentCp.trim() || getDefaultCpForSubject(selectedSubject)
    const autoNarrative = generateCompetencyNarrative(calculated, cp)

    setGradeOverrides((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        finalScore: calculated,
        isManualFinalScore: false,
        competencyNarrative: autoNarrative,
      },
    }))
    toast.success(`Nilai akhir ${currentGrade.studentName} dikembalikan ke kalkulasi rumus otomatis (${calculated})`)
  }

  const handleNarrativeChange = (santriId: string, text: string) => {
    setGradeOverrides((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        competencyNarrative: text,
      },
    }))
  }

  const activeNarrativeIndex = narrativeModalSantriId
    ? editableGrades.findIndex((g) => g.santriId === narrativeModalSantriId)
    : -1
  const activeNarrativeStudent =
    activeNarrativeIndex >= 0 ? editableGrades[activeNarrativeIndex] : null
  const canPrevNarrative = activeNarrativeIndex > 0
  const canNextNarrative =
    activeNarrativeIndex >= 0 && activeNarrativeIndex < editableGrades.length - 1

  const handlePrevNarrative = () => {
    if (canPrevNarrative) {
      setNarrativeModalSantriId(editableGrades[activeNarrativeIndex - 1].santriId)
    }
  }

  const handleNextNarrative = () => {
    if (canNextNarrative) {
      setNarrativeModalSantriId(editableGrades[activeNarrativeIndex + 1].santriId)
    }
  }

  const handleApplyNarrativeToSamePredicate = (
    predicate: string,
    narrativeText: string
  ) => {
    if (!predicate || !narrativeText.trim()) return
    const matchingSantri = editableGrades.filter((g) => g.predicate === predicate)
    if (matchingSantri.length === 0) return

    setGradeOverrides((prev) => {
      const next = { ...prev }
      matchingSantri.forEach((s) => {
        next[s.santriId] = {
          ...next[s.santriId],
          competencyNarrative: narrativeText,
        }
      })
      return next
    })
    toast.success(
      `Narasi disalin ke ${matchingSantri.length} santri berpredikat ${predicate}`
    )
  }

  const handleSaveGrades = async () => {
    try {
      const sanitizedGrades = editableGrades.map((g) => ({
        santriId: g.santriId,
        nisn: g.nisn || "-",
        studentName: g.studentName,
        institution: g.institution || "SMPITA",
        dailyScore: typeof g.dailyScore === "number" && !isNaN(g.dailyScore) ? g.dailyScore : 0,
        dailyAssessments: g.dailyAssessments,
        midtermScore: typeof g.midtermScore === "number" && !isNaN(g.midtermScore) ? g.midtermScore : 0,
        finalExamScore: typeof g.finalExamScore === "number" && !isNaN(g.finalExamScore) ? g.finalExamScore : 0,
        finalScore: g.finalScore,
        predicate: g.predicate,
        competencyNarrative: g.competencyNarrative || "",
      }))

      await saveGradesMutation({
        subjectCode: selectedSubject,
        className: selectedClass,
        academicYear,
        semester,
        grades: sanitizedGrades,
      })
      setGradeOverrides({})
      toast.success("Nilai rapor mata pelajaran berhasil disimpan!")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan nilai")
    }
  }

  const handlePullGrades = async () => {
    if (!selectedSessionId) {
      toast.error("Pilih sesi ujian CBT terlebih dahulu")
      return
    }

    try {
      setIsPulling(true)
      const res = await pullGradesMutation({
        subjectCode: selectedSubject,
        className: selectedClass,
        academicYear,
        semester,
        sessionId: selectedSessionId as Id<"examSessions">,
        targetColumn: pullTargetColumn,
        cpDescription: cpDescriptionForPull || undefined,
      })
      setIsPullModalOpen(false)
      setGradeOverrides({})
      toast.success(
        `Berhasil menarik ${res.matchedCount} nilai santri dari sesi CBT ke kolom ${
          pullTargetColumn === "midterm" ? "STS / PTS" : "SAS / PAS"
        }!`
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menarik nilai dari sesi CBT")
    } finally {
      setIsPulling(false)
    }
  }

  const handleSaveDailyAssessments = (
    updatedRows: Array<{
      santriId: string
      dailyScore: number
      dailyAssessments: DailyAssessments
    }>
  ) => {
    setGradeOverrides((prev) => {
      const next = { ...prev }
      for (const row of updatedRows) {
        next[row.santriId] = {
          ...next[row.santriId],
          dailyScore: row.dailyScore,
          dailyAssessments: row.dailyAssessments,
        }
      }
      return next
    })
  }

  const handleImportConfirm = async (
    results: ImportMatchResult[],
    targetColumn: "PH" | "STS" | "SAS" = "STS"
  ) => {
    const gradesToSave = editableGrades.map((g) => {
      const importedRow = results.find((r) => r.santriId === g.santriId)
      if (!importedRow) return g

      let newDaily = g.dailyScore
      let newMidterm = g.midtermScore
      let newFinal = g.finalExamScore

      // Jika format 3-in-1 (ph, sts, sas ada di importedRow)
      if (importedRow.ph !== null && importedRow.ph !== undefined) {
        newDaily = importedRow.ph
      } else if (targetColumn === "PH" && importedRow.value !== null && importedRow.value !== undefined) {
        newDaily = importedRow.value
      }

      if (importedRow.sts !== null && importedRow.sts !== undefined) {
        newMidterm = importedRow.sts
      } else if (targetColumn === "STS" && importedRow.value !== null && importedRow.value !== undefined) {
        newMidterm = importedRow.value
      }

      if (importedRow.sas !== null && importedRow.sas !== undefined) {
        newFinal = importedRow.sas
      } else if (targetColumn === "SAS" && importedRow.value !== null && importedRow.value !== undefined) {
        newFinal = importedRow.value
      }

      return {
        santriId: g.santriId,
        nisn: g.nisn,
        studentName: g.studentName,
        institution: g.institution,
        dailyScore: newDaily,
        midtermScore: newMidterm,
        finalExamScore: newFinal,
        competencyNarrative: g.competencyNarrative,
      }
    })

    await saveGradesMutation({
      subjectCode: selectedSubject,
      className: selectedClass,
      academicYear,
      semester,
      grades: gradesToSave,
    })

    setGradeOverrides({})
    const matched = results.filter(
      (r) =>
        (r.status === "matched_nisn" || r.status === "matched_name") &&
        (r.ph !== null || r.sts !== null || r.sas !== null || r.value !== null)
    ).length
    toast.success(`Berhasil import nilai dari Excel untuk ${matched} santri!`)
  }

  const handleSaveHomeroom = async () => {
    if (!effectiveSantriId) {
      toast.error("Pilih santri terlebih dahulu")
      return
    }

    const currentSantri = editableGrades.find((g) => g.santriId === effectiveSantriId)
    if (!currentSantri) return

    try {
      await saveHomeroomMutation({
        academicYear,
        semester,
        santriId: currentSantri.santriId,
        nisn: currentSantri.nisn,
        studentName: currentSantri.studentName,
        className: selectedClass,
        institution: currentSantri.institution,
        sickDays,
        permissionDays,
        absentDays,
        extracurriculars,
        haditsTarget,
        haditsAchievement,
        homeroomNotes,
        kokurikulerNotes,
        promotionDecision,
      })
      toast.success(`Asesmen wali kelas untuk ${currentSantri.studentName} berhasil disimpan!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan asesmen wali kelas")
    }
  }

  const handleSyncAllExtracurricularsFromExcel = async () => {
    if (editableGrades.length === 0) {
      toast.error(`Belum ada data santri pada kelas ${selectedClass} untuk disinkronkan.`)
      return
    }

    try {
      setIsSyncingEkskul(true)
      const batchItems = editableGrades.map((g) => {
        const cleanedGName = g.studentName.toLowerCase().trim()
        const matched = EKSKUL_ROSTER_DATA.find((r) => {
          const cleanedRName = r.studentName.toLowerCase().trim()
          return cleanedRName === cleanedGName || (cleanedGName.includes(cleanedRName) && cleanedRName.length > 5)
        })

        const items: ExtracurricularItem[] = [
          {
            name: "Rohis",
            score: "A",
            description: getExtracurricularNarrative("Rohis", "A"),
          },
        ]

        if (matched) {
          const optName = normalizeEkskulName(matched.ekskul)
          items.push({
            name: optName,
            score: "A",
            description: getExtracurricularNarrative(optName, "A"),
          })
        }

        return {
          santriId: g.santriId,
          studentName: g.studentName,
          className: selectedClass,
          nisn: g.nisn,
          institution: g.institution,
          extracurriculars: items,
        }
      })

      const res = await batchUpsertEkskulMutation({
        academicYear,
        semester,
        items: batchItems,
      })

      const currentSantriItems = batchItems.find((b) => b.santriId === effectiveSantriId)
      if (currentSantriItems) {
        setExtracurriculars(currentSantriItems.extracurriculars)
      }

      toast.success(`Berhasil menyinkronkan nilai & narasi ekskul untuk ${res.count} santri di kelas ${selectedClass}!`)
    } catch (err: unknown) {
      console.error("[rapor] Gagal sinkronisasi ekskul:", err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(
        msg.includes("Server Error")
          ? "Gagal memproses sinkronisasi di server. Pastikan akun pengajar aktif dan coba lagi."
          : msg
      )
    } finally {
      setIsSyncingEkskul(false)
    }
  }

  const handleEkskulScoreChange = (index: number, newScore: "A" | "B" | "C") => {
    const updated = [...extracurriculars]
    const current = updated[index]
    if (!current) return
    updated[index] = {
      ...current,
      score: newScore,
      description: getExtracurricularNarrative(current.name, newScore),
    }
    setExtracurriculars(updated)
  }

  const handleEkskulDescChange = (index: number, newDesc: string) => {
    const updated = [...extracurriculars]
    if (!updated[index]) return
    updated[index] = {
      ...updated[index],
      description: newDesc,
    }
    setExtracurriculars(updated)
  }

  const handleAddOptionalEkskul = (ekskulName: string) => {
    if (extracurriculars.some((e) => e.name.toLowerCase() === ekskulName.toLowerCase())) {
      toast.error(`Ekskul ${ekskulName} sudah terdaftar untuk santri ini.`)
      return
    }
    const newItem: ExtracurricularItem = {
      name: ekskulName,
      score: "A",
      description: getExtracurricularNarrative(ekskulName, "A"),
    }
    setExtracurriculars([...extracurriculars, newItem])
    toast.success(`Berhasil menambahkan ekskul ${ekskulName}`)
  }

  const handleRemoveEkskul = (index: number) => {
    if (extracurriculars[index]?.name.toLowerCase() === "rohis") {
      toast.error("Ekskul Rohis adalah ekskul wajib dan tidak dapat dihapus.")
      return
    }
    const updated = extracurriculars.filter((_, idx) => idx !== index)
    setExtracurriculars(updated)
    toast.success("Ekskul berhasil dihapus dari santri ini.")
  }

  const handlePrintSingle = () => {
    setPrintMode("single")
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handlePrintClass = () => {
    if (!classReports || classReports.length === 0) {
      toast.error(`Belum ada data nilai santri untuk kelas ${selectedClass}`)
      return
    }
    setPrintMode("class")
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleDownloadSinglePdf = async () => {
    const el = document.getElementById("single-report-card-view")
    if (!el || !singleReport) {
      toast.error("Lembar rapor santri belum siap untuk diunduh")
      return
    }
    try {
      setIsExportingPdf(true)
      const filename = `Rapor_${assessmentPeriod}_${reportType === "umum" ? "Umum" : "Diniyah"}_${selectedClass}_${cleanStudentName(singleReport.student.nama)}`
      await exportSingleReportPdf(el, filename)
      toast.success(`Berhasil mengunduh PDF rapor ${cleanStudentName(singleReport.student.nama)}!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh file PDF rapor")
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleDownloadZip = async () => {
    if (!classReports || classReports.length === 0) {
      toast.error(`Belum ada data nilai santri untuk kelas ${selectedClass}`)
      return
    }
    try {
      setIsExportingPdf(true)
      const container = document.getElementById("batch-reports-render-container")
      if (!container) {
        toast.error("Wadah dokumen kelas tidak ditemukan")
        return
      }
      const childCards = Array.from(container.children) as HTMLElement[]
      const reports = classReports.map((cr, idx) => ({
        studentName: `${cr.student.nama}_${cr.student.nisn}`,
        element: childCards[idx] || (container as HTMLElement),
      }))

      const zipFilename = `Rapor_${assessmentPeriod}_${reportType === "umum" ? "Umum" : "Diniyah"}_Kelas_${selectedClass}_ZIP`
      await exportSeparatedReportsZip(reports, zipFilename, (current, total) => {
        setExportProgress(`Mengemas PDF ${current}/${total} santri ke ZIP...`)
      })
      toast.success(`Berhasil mengunduh arsip ZIP seluruh rapor kelas ${selectedClass}!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh arsip ZIP")
    } finally {
      setIsExportingPdf(false)
      setExportProgress(null)
    }
  }

  const handleDownloadClassCombinedPdf = async () => {
    if (!classReports || classReports.length === 0) {
      toast.error(`Belum ada data nilai santri untuk kelas ${selectedClass}`)
      return
    }
    try {
      setIsExportingPdf(true)
      const container = document.getElementById("batch-reports-render-container")
      if (!container) {
        toast.error("Wadah dokumen kelas tidak ditemukan")
        return
      }
      const childCards = Array.from(container.children) as HTMLElement[]
      const filename = `Rapor_${assessmentPeriod}_${reportType === "umum" ? "Umum" : "Diniyah"}_1Kelas_${selectedClass}_Lengkap`
      await exportCombinedReportsPdf(childCards, filename, (current, total) => {
        setExportProgress(`Menggabungkan PDF ${current}/${total} santri...`)
      })
      toast.success(`Berhasil mengunduh 1 PDF gabungan untuk kelas ${selectedClass}!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh PDF gabungan")
    } finally {
      setIsExportingPdf(false)
      setExportProgress(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
      {/* Header Halaman (Sembunyi saat Cetak) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <GraduationCapIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight font-heading">
                E-Rapor Kurikulum Merdeka &amp; Diniyah
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Pengolahan nilai rapor terintegrasi CBT, asesmen karakter, leger nilai kelas, dan cetak rapor santri.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSubjects}
            disabled={isSyncingSubjects}
            className="gap-2 text-xs border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <BookOpenIcon className={cn("size-3.5", isSyncingSubjects && "animate-spin")} />
            <span>{isSyncingSubjects ? "Menyinkronkan..." : "Sinkronkan 16 Mapel Excel"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncStudents}
            disabled={isSyncing}
            className="gap-2 text-xs border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <RefreshCwIcon className={cn("size-3.5", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Menghubungkan..." : "Sinkronkan Santri SiPAKSa"}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintSingle} className="gap-2">
            <PrinterIcon className="size-4" />
            Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Filter Global Bar (Sembunyi saat Cetak) */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Filter Rumpun Mapel:</span>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border">
                <Button
                  type="button"
                  size="sm"
                  variant={subjectCategoryFilter === "all" ? "default" : "ghost"}
                  onClick={() => setSubjectCategoryFilter("all")}
                  className="h-6 text-xs px-2.5 rounded"
                >
                  Semua Mapel (16)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={subjectCategoryFilter === "umum" ? "default" : "ghost"}
                  onClick={() => {
                    setSubjectCategoryFilter("umum")
                    if (isDiniyahSubject(selectedSubject)) {
                      handleSubjectChange("PAI")
                    }
                  }}
                  className="h-6 text-xs px-2.5 rounded"
                >
                  Umum / Kurmer (10)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={subjectCategoryFilter === "diniyah" ? "default" : "ghost"}
                  onClick={() => {
                    setSubjectCategoryFilter("diniyah")
                    if (!isDiniyahSubject(selectedSubject)) {
                      handleSubjectChange("AQIDAH")
                    }
                  }}
                  className="h-6 text-xs px-2.5 rounded"
                >
                  Diniyah / Pesantren (6)
                </Button>
              </div>
            </div>
            {isDiniyahSubject(selectedSubject) && (
              <Badge variant="outline" className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                Mata Pelajaran Diniyah (KKM: 70)
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">Lembaga Resmi</label>
              <select
                aria-label="Pilih Lembaga"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value as Institution)}
                className="w-full h-8 px-2 border rounded bg-background text-foreground text-xs"
              >
                <option value="SMPITA">SMPITA (SMP Islam Tahfidz At-Tauhid)</option>
                <option value="SMAITA">SMAITA (SMA Islam Tahfidz At-Tauhid)</option>
                <option value="MTA">MTA (Manzhumah Takhoshush Al-Qur&apos;an)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">Rombel / Kelas</label>
              <select
                aria-label="Pilih Kelas"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-8 px-2 border rounded bg-background text-foreground text-xs font-medium"
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c.startsWith("MTA") || c.startsWith("Kelas") ? c : `Kelas ${c}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-muted-foreground flex items-center justify-between">
                <span>Mata Pelajaran</span>
                {isDiniyahSubject(selectedSubject) && (
                  <span className="text-[10px] text-emerald-600 font-bold">KKM 70</span>
                )}
              </label>
              <select
                aria-label="Pilih Mata Pelajaran"
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full h-8 px-2 border rounded bg-background text-foreground text-xs font-medium"
              >
                {subjectCategoryFilter !== "diniyah" && availableSubjectsList.umum.length > 0 && (
                  <optgroup label="Mata Pelajaran Umum (Kurikulum Merdeka)">
                    {availableSubjectsList.umum.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                )}
                {subjectCategoryFilter !== "umum" && availableSubjectsList.diniyah.length > 0 && (
                  <optgroup label="Mata Pelajaran Diniyah (Kepesantrenan - KKM 70)">
                    {availableSubjectsList.diniyah.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">Tahun Ajaran</label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="h-8 text-xs"
                placeholder="2026/2027"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">Semester</label>
              <select
                aria-label="Pilih Semester"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                className="w-full h-8 px-2 border rounded bg-background text-foreground text-xs"
              >
                <option value={1}>Semester 1 (Ganjil)</option>
                <option value={2}>Semester 2 (Genap)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Menu Utama E-Rapor */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full print:hidden">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full group-data-horizontal/tabs:h-auto h-auto p-1.5 bg-muted/80 dark:bg-muted/40 border border-border/80 rounded-xl shadow-xs gap-1.5">
          <TabsTrigger
            value="nilai-mapel"
            className={cn(
              "gap-2 text-xs md:text-sm py-2.5 px-3 rounded-lg font-medium transition-all duration-200 border border-transparent h-auto after:hidden cursor-pointer",
              "data-active:bg-emerald-700 data-active:text-white data-active:font-semibold data-active:shadow-sm data-active:border-emerald-800",
              "dark:data-active:bg-emerald-600 dark:data-active:text-white dark:data-active:border-emerald-500",
              activeTab === "nilai-mapel"
                ? "bg-emerald-700 text-white font-semibold shadow-sm border-emerald-800 dark:bg-emerald-600 dark:border-emerald-500 hover:bg-emerald-800 dark:hover:bg-emerald-500"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            <BookOpenIcon className={cn("size-4 shrink-0", activeTab === "nilai-mapel" ? "text-white" : "text-muted-foreground")} />
            <span>Nilai Mata Pelajaran</span>
          </TabsTrigger>
          <TabsTrigger
            value="wali-kelas"
            className={cn(
              "gap-2 text-xs md:text-sm py-2.5 px-3 rounded-lg font-medium transition-all duration-200 border border-transparent h-auto after:hidden cursor-pointer",
              "data-active:bg-emerald-700 data-active:text-white data-active:font-semibold data-active:shadow-sm data-active:border-emerald-800",
              "dark:data-active:bg-emerald-600 dark:data-active:text-white dark:data-active:border-emerald-500",
              activeTab === "wali-kelas"
                ? "bg-emerald-700 text-white font-semibold shadow-sm border-emerald-800 dark:bg-emerald-600 dark:border-emerald-500 hover:bg-emerald-800 dark:hover:bg-emerald-500"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            <UsersIcon className={cn("size-4 shrink-0", activeTab === "wali-kelas" ? "text-white" : "text-muted-foreground")} />
            <span>Asesmen Wali Kelas</span>
          </TabsTrigger>
          <TabsTrigger
            value="leger-nilai"
            className={cn(
              "gap-2 text-xs md:text-sm py-2.5 px-3 rounded-lg font-medium transition-all duration-200 border border-transparent h-auto after:hidden cursor-pointer",
              "data-active:bg-emerald-700 data-active:text-white data-active:font-semibold data-active:shadow-sm data-active:border-emerald-800",
              "dark:data-active:bg-emerald-600 dark:data-active:text-white dark:data-active:border-emerald-500",
              activeTab === "leger-nilai"
                ? "bg-emerald-700 text-white font-semibold shadow-sm border-emerald-800 dark:bg-emerald-600 dark:border-emerald-500 hover:bg-emerald-800 dark:hover:bg-emerald-500"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            <FileTextIcon className={cn("size-4 shrink-0", activeTab === "leger-nilai" ? "text-white" : "text-muted-foreground")} />
            <span>Buku Leger Nilai</span>
          </TabsTrigger>
          <TabsTrigger
            value="cetak-rapor"
            className={cn(
              "gap-2 text-xs md:text-sm py-2.5 px-3 rounded-lg font-medium transition-all duration-200 border border-transparent h-auto after:hidden cursor-pointer",
              "data-active:bg-emerald-700 data-active:text-white data-active:font-semibold data-active:shadow-sm data-active:border-emerald-800",
              "dark:data-active:bg-emerald-600 dark:data-active:text-white dark:data-active:border-emerald-500",
              activeTab === "cetak-rapor"
                ? "bg-emerald-700 text-white font-semibold shadow-sm border-emerald-800 dark:bg-emerald-600 dark:border-emerald-500 hover:bg-emerald-800 dark:hover:bg-emerald-500"
                : "text-muted-foreground hover:text-foreground hover:bg-background/80"
            )}
          >
            <PrinterIcon className={cn("size-4 shrink-0", activeTab === "cetak-rapor" ? "text-white" : "text-muted-foreground")} />
            <span>Cetak Rapor Santri</span>
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: NILAI MATA PELAJARAN (GURU MAPEL) */}
        {/* ======================================================== */}
        <TabsContent value="nilai-mapel" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">
                  Lembar Nilai: {selectedSubject} ({selectedClass})
                </h3>
                {isDiniyahSubject(selectedSubject) ? (
                  <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-500/40">
                    Diniyah (KKM: 70)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-blue-700 dark:text-blue-300 border-blue-500/40">
                    Kurikulum Merdeka
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formula NAR: (2 x PH + STS + SAS) / 4. Nilai STS dan SAS dapat ditarik langsung dari sesi CBT.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDailyAssessmentsModalOpen(true)}
                className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <BookOpenIcon className="size-3.5" />
                Buku Nilai Harian (PH & Tugas)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-1.5 text-xs text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                <FileSpreadsheetIcon className="size-3.5" />
                Import dari Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPullModalOpen(true)}
                className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <SparklesIcon className="size-3.5" />
                Tarik Nilai dari Sesi CBT
              </Button>
              <Button size="sm" onClick={handleSaveGrades} className="gap-1.5 text-xs">
                <SaveIcon className="size-3.5" />
                Simpan Perubahan
              </Button>
            </div>
          </div>

          {/* Kotak Pengaturan Capaian Pembelajaran (CP) Otomatis */}
          <div className="bg-muted/30 p-3 rounded-lg border border-border/80 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold block text-foreground">
                  Capaian Pembelajaran (CP / KD) Semester: {selectedSubject}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Materi pokok ini otomatis menyusun deskripsi narasi rapor (Sangat baik / Baik / Cukup / Perlu ditingkatkan).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyAutoNarrativeToAll}
                className="text-xs h-7 gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0"
              >
                <SparklesIcon className="size-3.5" />
                Terapkan Narasi Otomatis ke Semua Santri
              </Button>
            </div>
            <Input
              value={currentCp}
              onChange={(e) => setCurrentCp(e.target.value)}
              placeholder="Deskripsi materi pokok capaian pembelajaran semester ini..."
              className="h-8 text-xs font-medium bg-background"
            />
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 border-b text-left font-semibold">
                  <th className="p-2 w-10 text-center">No</th>
                  <th className="p-2 w-28">NISN</th>
                  <th className="p-2 min-w-40">Nama Santri</th>
                  <th className="p-2 w-36 text-center bg-emerald-500/[0.04] border-x border-emerald-500/20">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setIsDailyAssessmentsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-xs group active:scale-95"
                        title="Klik untuk membuka Buku Nilai Harian (Input PH 1-4 & Tugas)"
                      >
                        <BookOpenIcon className="size-3.5 text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="font-bold text-xs tracking-tight">PH / Tugas</span>
                      </button>
                      <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                        Klik untuk rincian
                      </span>
                    </div>
                  </th>
                  <th className="p-2 w-20 text-center">STS (PTS)</th>
                  <th className="p-2 w-20 text-center">SAS (PAS)</th>
                  <th className="p-2 w-28 text-center">Nilai Akhir</th>
                  <th className="p-2 w-16 text-center">Predikat</th>
                  <th className="p-2 min-w-80">Narasi Capaian Kompetensi</th>
                </tr>
              </thead>
              <tbody>
                {editableGrades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                        <UsersIcon className="size-8 text-muted-foreground/60" />
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground text-sm">
                            Tidak Ada Data Santri untuk Kelas {selectedClass}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Data santri belum tersinkron atau belum ada santri yang terdaftar di kelas ini.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSyncStudents}
                          disabled={isSyncing}
                          className="gap-2 text-xs mt-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          <RefreshCwIcon className={cn("size-3.5", isSyncing && "animate-spin")} />
                          <span>{isSyncing ? "Menghubungkan ke SiPAKSa..." : "Tarik Data Santri dari SiPAKSa"}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  editableGrades.map((g, idx) => (
                    <tr key={g.santriId} className="border-b hover:bg-muted/30">
                      <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 font-mono text-[11px]">{g.nisn}</td>
                      <td className="p-2 font-medium">{g.studentName}</td>
                      <td className="p-1.5 text-center bg-emerald-500/[0.02] border-x border-emerald-500/10">
                        <div className="flex items-center justify-center gap-1.5">
                          <Input
                            type="number"
                            value={g.dailyScore || ""}
                            onChange={(e) => handleScoreChange(g.santriId, "dailyScore", parseFloat(e.target.value))}
                            className="h-7 text-center text-xs font-semibold p-1 w-16"
                          />
                          {g.dailyAssessments?.ph && g.dailyAssessments.ph.length > 0 ? (
                            <button
                              type="button"
                              title="Buka Buku Nilai Harian untuk mengedit rincian nilai santri ini"
                              onClick={() => setIsDailyAssessmentsModalOpen(true)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 px-1.5 py-0.5 rounded shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
                            >
                              <span>PH</span>
                              <BookOpenIcon className="size-2.5 opacity-80" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Buka Buku Nilai Harian untuk mengisi rincian PH 1-4 & Tugas"
                              onClick={() => setIsDailyAssessmentsModalOpen(true)}
                              className="inline-flex items-center justify-center size-6 rounded text-[11px] font-medium text-muted-foreground/60 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dashed border-border hover:border-emerald-400 transition-all cursor-pointer"
                            >
                              <BookOpenIcon className="size-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-1.5 text-center">
                        <Input
                          type="number"
                          value={g.midtermScore || ""}
                          onChange={(e) => handleScoreChange(g.santriId, "midtermScore", parseFloat(e.target.value))}
                          className="h-7 text-center text-xs font-semibold p-1"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <Input
                          type="number"
                          value={g.finalExamScore || ""}
                          onChange={(e) => handleScoreChange(g.santriId, "finalExamScore", parseFloat(e.target.value))}
                          className="h-7 text-center text-xs font-semibold p-1"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        {isCurrentSubjectDiniyah ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={g.finalScore || ""}
                              onChange={(e) => handleScoreChange(g.santriId, "finalScore", parseFloat(e.target.value))}
                              className={cn(
                                "h-7 w-16 text-center text-xs font-bold p-1 transition-colors",
                                g.isManualFinalScore
                                  ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                                  : "text-foreground font-bold"
                              )}
                              title={
                                g.isManualFinalScore
                                  ? `Nilai manual override (Kalkulasi rumus: ${g.calculatedNar}). Klik tombol reset di samping untuk kembali ke otomatis.`
                                  : "Kalkulasi otomatis (2*PH + STS + SAS) / 4. Anda juga bisa mengetik langsung nilai manual."
                              }
                            />
                            {g.isManualFinalScore && (
                              <button
                                type="button"
                                suppressHydrationWarning
                                onClick={() => handleResetFinalScore(g.santriId)}
                                className="size-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                                title={`Kembalikan ke kalkulasi rumus otomatis (${g.calculatedNar})`}
                              >
                                <RotateCcwIcon className="size-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="font-bold text-sm text-foreground">
                            {g.finalScore}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Badge
                          variant={
                            g.predicate === "A"
                              ? "default"
                              : g.predicate === "B"
                                ? "secondary"
                                : g.predicate === "C"
                                  ? "outline"
                                  : "destructive"
                          }
                          className="font-bold text-[11px]"
                        >
                          {g.predicate}
                        </Badge>
                      </td>
                      <td className="p-1.5">
                        <div className="flex items-start gap-1">
                          <Textarea
                            value={g.competencyNarrative || ""}
                            onChange={(e) => handleNarrativeChange(g.santriId, e.target.value)}
                            placeholder="Deskripsi capaian pembelajaran..."
                            className="min-h-[46px] text-xs leading-relaxed py-1.5 px-2 resize-y rounded-md"
                            rows={2}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setNarrativeModalSantriId(g.santriId)}
                            className="size-7 shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
                            title="Perbesar ruang ketik narasi"
                          >
                            <Maximize2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: WALI KELAS & ASESMEN KARAKTER / ABSENSI / EKSKUL */}
        {/* ======================================================== */}
        <TabsContent value="wali-kelas" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm md:text-base">
                    Asesmen Karakter, Ekstrakurikuler, dan Ketidakhadiran Santri
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pilih santri di kelas {selectedClass} untuk mengisi rekap kehadiran, capaian Hadits Arba&apos;in, ekstrakurikuler, dan catatan wali kelas.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  suppressHydrationWarning
                  variant="outline"
                  size="sm"
                  onClick={handleSyncAllExtracurricularsFromExcel}
                  disabled={isSyncingEkskul || editableGrades.length === 0}
                  className="gap-2 text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <RefreshCwIcon className={cn("size-3.5", isSyncingEkskul && "animate-spin")} />
                  Sinkronkan Ekskul dari Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableGrades.length === 0 && (
                <div className="rounded-lg border border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                    <UsersIcon className="size-4" />
                    <span>Data Santri Kelas {selectedClass} Belum Terhubung</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Daftar santri untuk kelas {selectedClass} belum tersedia di database. Anda dapat menarik data seluruh santri aktif langsung dari server SiPAKSa iCentre dengan tombol di bawah.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSyncStudents}
                    disabled={isSyncing}
                    className="gap-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    <RefreshCwIcon className={cn("size-3.5", isSyncing && "animate-spin")} />
                    <span>{isSyncing ? "Menghubungkan ke SiPAKSa..." : "Tarik Data Santri dari SiPAKSa Sekarang"}</span>
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1 text-muted-foreground">Pilih Santri</label>
                  <select
                    aria-label="Pilih Santri"
                    value={effectiveSantriId}
                    onChange={(e) => setSelectedSantriId(e.target.value)}
                    className="w-full h-8 px-2 border rounded bg-background text-foreground text-xs"
                  >
                    {editableGrades.length === 0 ? (
                      <option value="">-- Belum ada santri di kelas ini --</option>
                    ) : (
                      editableGrades.map((g) => (
                        <option key={g.santriId} value={g.santriId}>
                          {cleanStudentName(g.studentName)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1 text-muted-foreground">Keputusan Kenaikan / Kelulusan</label>
                  <Input
                    value={promotionDecision}
                    onChange={(e) => setPromotionDecision(e.target.value)}
                    placeholder="Contoh: NAIK KE KELAS : VIII (DELAPAN)"
                    className="h-8 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Rekap Absensi */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide">Rekapitulasi Ketidakhadiran (Semester {semester})</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Sakit (Hari)</label>
                    <Input
                      type="number"
                      value={sickDays}
                      onChange={(e) => setSickDays(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Izin (Hari)</label>
                    <Input
                      type="number"
                      value={permissionDays}
                      onChange={(e) => setPermissionDays(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Tanpa Keterangan / Alpa (Hari)</label>
                    <Input
                      type="number"
                      value={absentDays}
                      onChange={(e) => setAbsentDays(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Capaian Hadits Arba'in & Tahfidz */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide">Capaian Hadits Arba&apos;in &amp; Tahfidz Al-Qur&apos;an</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Target Hafalan Semester</label>
                    <Input
                      value={haditsTarget}
                      onChange={(e) => setHaditsTarget(e.target.value)}
                      placeholder="3 Hadits Arba'in"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Realisasi Capaian Santri</label>
                    <Input
                      value={haditsAchievement}
                      onChange={(e) => setHaditsAchievement(e.target.value)}
                      placeholder="3 Hadits Tuntas"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Penilaian Ekstrakurikuler (Wajib: Rohis, Pilihan: Sesuai Minat/Bakat) */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <AwardIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Penilaian Ekstrakurikuler (Wajib &amp; Pilihan)</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Pilihan predikat A (Sangat Baik), B (Baik), C (Cukup). Mengubah predikat otomatis memperbarui deskripsi capaian baku.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      suppressHydrationWarning
                      aria-label="Tambah Ekskul Pilihan"
                      className="h-7 px-2 border rounded bg-background text-foreground text-[11px]"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddOptionalEkskul(e.target.value)
                          e.target.value = ""
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        + Tambah Ekskul Pilihan
                      </option>
                      {Object.keys(OFFICIAL_EXTRACURRICULARS)
                        .filter((k) => k !== "Rohis")
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  {extracurriculars.map((ekskul, idx) => {
                    const isRohis = ekskul.name.toLowerCase() === "rohis"
                    return (
                      <div
                        key={`${ekskul.name}-${idx}`}
                        className="p-2.5 rounded-md border bg-background/80 dark:bg-background/40 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{ekskul.name}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4.5 font-medium",
                                isRohis
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                                  : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                              )}
                            >
                              {isRohis ? "Ekskul Wajib" : "Ekskul Pilihan"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-[11px] text-muted-foreground font-medium">Predikat:</label>
                            <select
                              suppressHydrationWarning
                              aria-label={`Predikat ${ekskul.name}`}
                              value={ekskul.score}
                              onChange={(e) =>
                                handleEkskulScoreChange(idx, e.target.value as "A" | "B" | "C")
                              }
                              className="h-7 w-32 px-2 border rounded font-semibold bg-background text-foreground text-xs"
                            >
                              {EXTRACURRICULAR_PREDICATES.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            {!isRohis && (
                              <Button
                                type="button"
                                suppressHydrationWarning
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveEkskul(idx)}
                                title="Hapus ekskul ini dari santri"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">
                            Deskripsi Capaian Rapor ({ekskul.name}):
                          </label>
                          <textarea
                            suppressHydrationWarning
                            rows={2}
                            value={ekskul.description}
                            onChange={(e) => handleEkskulDescChange(idx, e.target.value)}
                            className="w-full p-1.5 border rounded text-xs bg-background text-foreground resize-none leading-relaxed"
                            placeholder={`Tulis deskripsi capaian ${ekskul.name}...`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Catatan Kokurikuler (Penguatan Karakter & P5) */}
              <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <SparklesIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Catatan Kokurikuler (Penguatan Karakter &amp; P5)</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Ditampilkan pada kotak Kokurikuler di lembar Rapor Umum SAS (Kurikulum Merdeka).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setKokurikulerNotes(DEFAULT_KOKURIKULER_NOTE)}
                    className="h-7 text-[11px] gap-1.5 self-start sm:self-auto"
                    title="Kembalikan narasi bawaan"
                  >
                    <RotateCcwIcon className="size-3" />
                    <span>Reset Narasi Baku</span>
                  </Button>
                </div>
                <textarea
                  value={kokurikulerNotes}
                  onChange={(e) => setKokurikulerNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md text-xs bg-background text-foreground resize-none leading-relaxed"
                  placeholder="Tuliskan catatan perkembangan keimanan, ketakwaan, adab, dan kokurikuler santri..."
                />
              </div>

              {/* Catatan Motivasi Wali Kelas */}
              <div>
                <label className="text-xs font-semibold block mb-1 text-muted-foreground">Catatan Motivasi Wali Kelas</label>
                <textarea
                  value={homeroomNotes}
                  onChange={(e) => setHomeroomNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-md text-xs bg-background text-foreground resize-none"
                  placeholder="Tuliskan catatan apresiasi, adab, dan motivasi untuk santri dan wali santri..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSaveHomeroom} className="gap-2 text-xs">
                  <CheckCircle2Icon className="size-4" />
                  Simpan Asesmen Santri
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: BUKU LEGER NILAI KELAS (UMUM & DINIYAH TERPISAH) */}
        {/* ======================================================== */}
        <TabsContent value="leger-nilai" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
            <div>
              <h3 className="font-semibold text-sm">
                Buku Leger Nilai Kelas {selectedClass} (Semester {semester} - {academicYear})
              </h3>
              <p className="text-xs text-muted-foreground">
                Rekapitulasi nilai mata pelajaran dengan pemisahan buku leger Umum dan Diniyah agar tidak tercampur.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-background border p-0.5 rounded h-8">
                <Button
                  type="button"
                  size="sm"
                  variant={legerFilter === "all" ? "default" : "ghost"}
                  onClick={() => setLegerFilter("all")}
                  className="h-7 text-xs px-2.5"
                >
                  Semua Mapel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={legerFilter === "umum" ? "default" : "ghost"}
                  onClick={() => setLegerFilter("umum")}
                  className="h-7 text-xs px-2.5"
                >
                  Leger Umum
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={legerFilter === "diniyah" ? "default" : "ghost"}
                  onClick={() => setLegerFilter("diniyah")}
                  className="h-7 text-xs px-2.5"
                >
                  Leger Diniyah
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success("Mengekspor data leger nilai ke format spreadsheet...");
                }}
                className="gap-2 text-xs"
              >
                <DownloadIcon className="size-4" />
                Ekspor Leger Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/70 border-b text-center font-bold">
                  <th className="p-2 border-r w-10">No</th>
                  <th className="p-2 border-r w-24">NISN</th>
                  <th className="p-2 border-r text-left min-w-40">Nama Santri</th>
                  {legerSubjects.map((s) => (
                    <th key={s.code} className="p-2 border-r w-14 font-semibold text-[11px]">
                      {s.code}
                    </th>
                  ))}
                  <th className="p-2 border-r w-16 bg-muted/80">Total</th>
                  <th className="p-2 border-r w-16 bg-muted/80">Rerata</th>
                  <th className="p-2 w-14 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold">
                    Rank
                  </th>
                </tr>
              </thead>
              <tbody>
                {!classLeger || classLeger.students.length === 0 ? (
                  <tr>
                    <td colSpan={legerSubjects.length + 6} className="p-6 text-center text-muted-foreground italic">
                      Belum ada data nilai tersimpan untuk kelas ini.
                    </td>
                  </tr>
                ) : (
                  classLeger.students.map((st) => {
                    let subsetTotal = 0
                    let subsetCount = 0
                    legerSubjects.forEach((s) => {
                      const sc =
                        st.subjectScores[s.code] ||
                        (s.code === "BARAB" ? st.subjectScores["B_ARAB"] : 0) ||
                        0
                      if (sc > 0) {
                        subsetTotal += sc
                        subsetCount++
                      }
                    })
                    const subsetAvg = subsetCount > 0 ? Math.round((subsetTotal / subsetCount) * 10) / 10 : 0

                    return (
                      <tr key={st.santriId} className="border-b hover:bg-muted/30 text-center">
                        <td className="p-2 border-r text-muted-foreground">{st.no}</td>
                        <td className="p-2 border-r font-mono text-[11px]">{st.nisn}</td>
                        <td className="p-2 border-r text-left font-medium">{cleanStudentName(st.studentName)}</td>
                        {legerSubjects.map((s) => {
                          const val =
                            st.subjectScores[s.code] ||
                            (s.code === "BARAB" ? st.subjectScores["B_ARAB"] : 0) ||
                            0
                          return (
                            <td key={s.code} className="p-2 border-r font-medium">
                              {val > 0 ? val : "-"}
                            </td>
                          )
                        })}
                        <td className="p-2 border-r font-bold text-foreground bg-muted/20">
                          {legerFilter === "all" ? st.totalScore : subsetTotal}
                        </td>
                        <td className="p-2 border-r font-bold text-foreground bg-muted/20">
                          {legerFilter === "all" ? st.averageScore : subsetAvg}
                        </td>
                        <td className="p-2 font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                          {st.rank}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: CETAK & UNDUH RAPOR SANTRI BER-KOP SIPAKSA */}
        {/* ======================================================== */}
        <TabsContent value="cetak-rapor" className="space-y-4 pt-2">
          {/* Baris Kontrol Filter: Santri, Jenis Rapor, dan Periode STS / SAS */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-muted/40 p-4 rounded-lg border">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Pilih Santri</label>
                <select
                  aria-label="Pilih Santri"
                  value={effectiveSantriId}
                  onChange={(e) => setSelectedSantriId(e.target.value)}
                  className="h-8 px-2 border rounded bg-background text-foreground text-xs font-semibold"
                >
                  {editableGrades.length === 0 ? (
                    <option value="">-- Belum ada santri --</option>
                  ) : (
                    editableGrades.map((g) => (
                      <option key={g.santriId} value={g.santriId}>
                        {cleanStudentName(g.studentName)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Jenis Rapor</label>
                <div className="flex items-center gap-1 bg-background border p-0.5 rounded h-8">
                  <Button
                    type="button"
                    size="sm"
                    variant={reportType === "umum" ? "default" : "ghost"}
                    onClick={() => setReportType("umum")}
                    className="h-7 text-xs px-2.5"
                  >
                    Rapor Umum (Kurmer)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={reportType === "diniyah" ? "default" : "ghost"}
                    onClick={() => setReportType("diniyah")}
                    className="h-7 text-xs px-2.5"
                  >
                    Rapor Diniyah &amp; Tahfidz
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Periode Asesmen</label>
                <div className="flex items-center gap-1 bg-background border p-0.5 rounded h-8">
                  <Button
                    type="button"
                    size="sm"
                    variant={assessmentPeriod === "STS" ? "default" : "ghost"}
                    onClick={() => setAssessmentPeriod("STS")}
                    className="h-7 text-xs px-2.5"
                  >
                    STS (Tengah Semester)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={assessmentPeriod === "SAS" ? "default" : "ghost"}
                    onClick={() => setAssessmentPeriod("SAS")}
                    className="h-7 text-xs px-2.5"
                  >
                    SAS (Akhir Semester)
                  </Button>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none pl-1">
                  <input
                    type="checkbox"
                    checked={showKop}
                    onChange={(e) => setShowKop(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-muted-foreground font-medium">KOP Lembaga</span>
                </label>
              </div>
            </div>

            {/* Aksi Cetak Peramban & Pengaturan */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClassSettingsModalOpen(true)}
                className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
              >
                <SlidersHorizontal className="size-3.5" />
                Pengaturan Wali Kelas & Tanggal Dokumen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintSingle}
                className="gap-1.5 text-xs h-8"
              >
                <PrinterIcon className="size-3.5" />
                Cetak Santri Ini
              </Button>
              <Button
                size="sm"
                onClick={handlePrintClass}
                className="gap-1.5 text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <PrinterIcon className="size-3.5" />
                Cetak 1 Kelas Sekaligus
              </Button>
            </div>
          </div>

          {/* Baris Tombol Unduh Berkas PDF & ZIP */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-lg border text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Opsi Pengunduhan Berkas:</span>
              {isExportingPdf && (
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <RefreshCwIcon className="size-3.5 animate-spin" />
                  {exportProgress || "Memproses berkas..."}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isExportingPdf || !singleReport}
                onClick={handleDownloadSinglePdf}
                className="gap-1.5 text-xs h-8"
              >
                <DownloadIcon className="size-3.5" />
                Unduh PDF Santri
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isExportingPdf || !classReports || classReports.length === 0}
                onClick={handleDownloadZip}
                className="gap-1.5 text-xs h-8"
              >
                <FileArchiveIcon className="size-3.5" />
                Unduh ZIP Kelas (File Terpisah)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isExportingPdf || !classReports || classReports.length === 0}
                onClick={handleDownloadClassCombinedPdf}
                className="gap-1.5 text-xs h-8"
              >
                <FileTextIcon className="size-3.5" />
                Unduh 1 PDF Kelas (Gabungan)
              </Button>
            </div>
          </div>

          {/* Pratinjau Lembar Cetak Rapor Ber-KOP SiPAKSa */}
          {singleReport ? (
            <div className="border rounded-xl p-4 md:p-8 bg-muted/20">
              <div id="single-report-card-view">
                <ReportCardPrintView
                  type={reportType}
                  period={assessmentPeriod}
                  student={singleReport.student}
                  academicYear={academicYear}
                  semester={semester}
                  grades={singleReport.grades}
                  homeroom={singleReport.homeroom}
                  homeroomTeacherName={singleReport.classSetting?.homeroomTeacherName}
                  homeroomTeacherNiy={singleReport.classSetting?.homeroomTeacherNiy}
                  reportDate={singleReport.classSetting?.reportDate}
                  principalName={singleReport.classSetting?.principalName}
                  principalNiy={singleReport.classSetting?.principalNiy}
                  showKop={showKop}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground italic border rounded-lg">
              Pilih santri untuk menampilkan pratinjau lembar rapor.
            </div>
          )}

          {/* Wadah Render Dokumen Seluruh Siswa Kelas untuk Capture html2canvas */}
          {classReports && classReports.length > 0 && (
            <div
              id="batch-reports-render-container"
              className="fixed -left-[9999px] top-0 pointer-events-none opacity-0 w-[800px]"
              aria-hidden="true"
            >
              {classReports.map((cr) => (
                <div key={cr.student.santriId} className="bg-white p-6 mb-6">
                  <ReportCardPrintView
                    type={reportType}
                    period={assessmentPeriod}
                    student={cr.student}
                    academicYear={academicYear}
                    semester={semester}
                    grades={cr.grades}
                    homeroom={cr.homeroom}
                    homeroomTeacherName={cr.classSetting?.homeroomTeacherName}
                    homeroomTeacherNiy={cr.classSetting?.homeroomTeacherNiy}
                    reportDate={cr.classSetting?.reportDate}
                    principalName={cr.classSetting?.principalName}
                    principalNiy={cr.classSetting?.principalNiy}
                    showKop={showKop}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tampilan Cetak Khusus Peramban (@media print) */}
      <div className="hidden print:block w-full">
        {printMode === "single" && singleReport && (
          <ReportCardPrintView
            type={reportType}
            period={assessmentPeriod}
            student={singleReport.student}
            academicYear={academicYear}
            semester={semester}
            grades={singleReport.grades}
            homeroom={singleReport.homeroom}
            homeroomTeacherName={singleReport.classSetting?.homeroomTeacherName}
            homeroomTeacherNiy={singleReport.classSetting?.homeroomTeacherNiy}
            reportDate={singleReport.classSetting?.reportDate}
            principalName={singleReport.classSetting?.principalName}
            principalNiy={singleReport.classSetting?.principalNiy}
            showKop={showKop}
          />
        )}
        {printMode === "class" && classReports && classReports.length > 0 && (
          <div>
            {classReports.map((cr, idx) => (
              <div
                key={cr.student.santriId}
                className={cn(
                  "break-after-page",
                  idx < classReports.length - 1 && "page-break-after-always"
                )}
                style={{ pageBreakAfter: idx < classReports.length - 1 ? "always" : "auto" }}
              >
                <ReportCardPrintView
                  type={reportType}
                  period={assessmentPeriod}
                  student={cr.student}
                  academicYear={academicYear}
                  semester={semester}
                  grades={cr.grades}
                  homeroom={cr.homeroom}
                  homeroomTeacherName={cr.classSetting?.homeroomTeacherName}
                  homeroomTeacherNiy={cr.classSetting?.homeroomTeacherNiy}
                  reportDate={cr.classSetting?.reportDate}
                  principalName={cr.classSetting?.principalName}
                  principalNiy={cr.classSetting?.principalNiy}
                  showKop={showKop}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog: Tarik Nilai dari Sesi CBT */}
      <Dialog open={isPullModalOpen} onOpenChange={setIsPullModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-5 text-emerald-600" />
              Tarik Nilai dari Sesi Ujian CBT
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nilai dari peserta ujian CBT yang sudah selesai dinilai akan disalin otomatis ke lembar nilai rapor kelas {selectedClass}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">Pilih Sesi Ujian Sumber</label>
              <select
                aria-label="Pilih Sesi Ujian"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full h-8 px-2 border rounded bg-background text-foreground text-xs"
              >
                <option value="">-- Pilih Sesi CBT Tersedia --</option>
                {availableSessions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.title} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">Petakan ke Kolom Nilai Rapor</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={pullTargetColumn === "midterm" ? "default" : "outline"}
                  onClick={() => setPullTargetColumn("midterm")}
                  className="h-8 text-xs"
                >
                  Kolom STS / PTS
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={pullTargetColumn === "finalExam" ? "default" : "outline"}
                  onClick={() => setPullTargetColumn("finalExam")}
                  className="h-8 text-xs"
                >
                  Kolom SAS / PAS
                </Button>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-muted-foreground">
                Capaian Pembelajaran (CP/TP) yang Diujikan
              </label>
              <Input
                value={cpDescriptionForPull}
                onChange={(e) => setCpDescriptionForPull(e.target.value)}
                placeholder="Contoh: memahami tata cara sholat dan thoharoh"
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Deskripsi narasi kompetensi akan otomatis terbuat berdasarkan skor nilai yang ditarik.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPullModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handlePullGrades} disabled={isPulling} className="gap-1.5">
              {isPulling ? <RefreshCwIcon className="size-3.5 animate-spin" /> : <ArrowRightIcon className="size-3.5" />}
              Tarik Nilai Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GradeImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        subjectName={
          availableSubjectsList.all.find((s) => s.code === selectedSubject)?.name ?? selectedSubject
        }
        subjectCode={selectedSubject}
        className={selectedClass}
        students={editableGrades.map((g) => ({
          santriId: g.santriId,
          nisn: g.nisn,
          name: g.studentName,
          institution: g.institution,
        }))}
        onConfirm={handleImportConfirm}
      />

      <ClassSettingsModal
        isOpen={isClassSettingsModalOpen}
        onClose={() => setIsClassSettingsModalOpen(false)}
        academicYear={academicYear}
        semester={semester}
        currentClass={selectedClass}
        availableClasses={classOptions}
      />

      <DailyAssessmentsModal
        open={isDailyAssessmentsModalOpen}
        onOpenChange={setIsDailyAssessmentsModalOpen}
        subjectName={
          availableSubjectsList.all.find((s) => s.code === selectedSubject)?.name ?? selectedSubject
        }
        subjectCode={selectedSubject}
        className={selectedClass}
        kkm={isDiniyahSubject(selectedSubject) ? 70 : 75}
        students={editableGrades.map((g) => ({
          santriId: g.santriId,
          nisn: g.nisn,
          studentName: g.studentName,
          dailyAssessments: g.dailyAssessments,
          currentDailyScore: g.dailyScore,
        }))}
        onSave={handleSaveDailyAssessments}
      />

      <Dialog
        open={Boolean(narrativeModalSantriId)}
        onOpenChange={(open) => {
          if (!open) setNarrativeModalSantriId(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeNarrativeStudent && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pr-6">
                  <DialogTitle className="text-base font-semibold">
                    Sunting Narasi Capaian Kompetensi
                  </DialogTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    {activeNarrativeIndex + 1} / {editableGrades.length}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  {activeNarrativeStudent.studentName} ({activeNarrativeStudent.nisn || "Tanpa NISN"}) &bull; {selectedSubject} &bull; Kelas {selectedClass}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Info Capaian Santri & Navigasi */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-muted-foreground">Nilai Akhir:</span>{" "}
                      <span className="font-bold text-foreground">
                        {activeNarrativeStudent.finalScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Predikat:</span>{" "}
                      <Badge
                        variant={
                          activeNarrativeStudent.predicate === "A"
                            ? "default"
                            : activeNarrativeStudent.predicate === "B"
                              ? "secondary"
                              : activeNarrativeStudent.predicate === "C"
                                ? "outline"
                                : "destructive"
                        }
                        className="font-bold text-[10px] ml-1"
                      >
                        {activeNarrativeStudent.predicate}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrevNarrative}
                      disabled={!canPrevNarrative}
                      className="h-7 px-2 text-xs gap-1"
                      title="Santri Sebelumnya"
                    >
                      <ChevronLeftIcon className="size-3.5" />
                      Sebelumnya
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNextNarrative}
                      disabled={!canNextNarrative}
                      className="h-7 px-2 text-xs gap-1"
                      title="Santri Selanjutnya"
                    >
                      Selanjutnya
                      <ChevronRightIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Textarea Lega */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Teks Narasi Capaian</span>
                    <span className="font-normal text-muted-foreground">
                      {(activeNarrativeStudent.competencyNarrative || "").length} karakter
                    </span>
                  </div>
                  <Textarea
                    value={activeNarrativeStudent.competencyNarrative || ""}
                    onChange={(e) =>
                      handleNarrativeChange(activeNarrativeStudent.santriId, e.target.value)
                    }
                    placeholder="Tuliskan deskripsi capaian pembelajaran santri ini..."
                    rows={5}
                    className="min-h-[130px] text-xs md:text-sm leading-relaxed p-3 rounded-lg"
                  />
                </div>

                {/* Prasetel Rekomendasi Cepat */}
                <div className="space-y-2 rounded-lg border p-3 bg-muted/20">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Prasetel Kalimat Rekomendasi (berdasarkan Capaian Pembelajaran aktif):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Sangat baik", "Baik", "Cukup", "Perlu ditingkatkan"].map((level) => {
                      const cp = currentCp.trim() || getDefaultCpForSubject(selectedSubject)
                      const presetText = `${level} dalam ${cp}`
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            handleNarrativeChange(activeNarrativeStudent.santriId, presetText)
                          }
                          className="text-[11px] py-1 px-2.5 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {presetText}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Aksi Massal ke Predikat Sama */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Salin teks ini ke seluruh santri berpredikat <strong>{activeNarrativeStudent.predicate}</strong> di kelas ini
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleApplyNarrativeToSamePredicate(
                        activeNarrativeStudent.predicate,
                        activeNarrativeStudent.competencyNarrative || ""
                      )
                    }
                    disabled={!activeNarrativeStudent.competencyNarrative?.trim()}
                    className="h-7 text-xs gap-1.5 shrink-0 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <CopyCheckIcon className="size-3.5" />
                    Terapkan ke Predikat {activeNarrativeStudent.predicate}
                  </Button>
                </div>
              </div>

              <DialogFooter className="gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => setNarrativeModalSantriId(null)}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  Selesai
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
