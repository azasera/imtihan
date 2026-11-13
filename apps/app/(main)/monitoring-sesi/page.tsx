"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQuery } from "convex/react"
import {
  ActivityIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  ClockIcon,
  FileEditIcon,
  GitBranchIcon,
  LayersIcon,
  ListChecksIcon,
  Loader2Icon,
  LockIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UnlockIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Input } from "@/components/ui/input"
import {
  formatCountdown,
  formatNotEnteredCount,
  formatTimeOfDay,
  isOvertime,
  remainingTimeMs,
  sortForMonitoring,
  summarizeParticipants,
  violationTier,
  type MonitoringParticipant,
} from "@/lib/exam-monitoring"
import { formatSavedAnswerCount } from "@/lib/session-integrity"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SessionContinuationDialog,
  type ContinuationSource,
} from "@/components/sesi-ujian/session-continuation-dialog"
import { SessionTokenCard } from "@/components/sesi-ujian/session-token-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function SessionStatusBadge({ status }: { status: "draft" | "active" | "ended" }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1">
        <span className="size-1.5 rounded-full bg-white animate-pulse" />
        Sedang Aktif
      </Badge>
    )
  }

  if (status === "draft") {
    return (
      <Badge variant="secondary" className="text-[11px]">
        Draf (Belum Aktif)
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-[11px] text-muted-foreground">
      Telah Berakhir
    </Badge>
  )
}

function ViolationBadge({ count }: { count: number | undefined }) {
  const violations = count ?? 0
  const tier = violationTier(violations)

  if (tier === "none") {
    return <span className="font-mono text-muted-foreground">0</span>
  }

  if (tier === "watch") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 text-amber-700 bg-amber-50 dark:bg-amber-950/20 text-[10px]"
      >
        {violations}x Waspada
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="text-[10px]">
      {violations}x Pelanggaran
    </Badge>
  )
}

function ParticipantStatusBadge({ participant }: { participant: MonitoringParticipant }) {
  if (participant.status === "submitted") {
    return (
      <Badge
        variant="outline"
        className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-[10px]"
      >
        Selesai
      </Badge>
    )
  }

  if (participant.lockedAt !== undefined) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/40 text-destructive bg-destructive/5 text-[10px] gap-1"
      >
        <LockIcon className="size-3" />
        Terkunci
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/20"
    >
      Sedang Mengerjakan
    </Badge>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  onClick,
  isActive,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
  onClick?: () => void
  isActive?: boolean
}) {
  return (
    <Card
      onClick={onClick}
      className={`border shadow-2xs transition-all ${
        onClick ? "cursor-pointer hover:border-primary/50 hover:shadow-xs" : ""
      } ${isActive ? "ring-2 ring-primary border-primary bg-primary/5" : ""}`}
    >
      <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
        <CardDescription className="text-xs font-medium">{label}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  )
}

function GradingBadge({ gradingStatus }: { gradingStatus: MonitoringParticipant["gradingStatus"] }) {
  if (gradingStatus === "pending_essay") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-700 text-[10px]">
        Perlu Koreksi Essay
      </Badge>
    )
  }

  if (gradingStatus === "graded") {
    return (
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 text-[10px]">
        Selesai Dinilai
      </Badge>
    )
  }

  return <span className="text-muted-foreground">-</span>
}

export default function MonitoringSesiPage() {
  const { data: authSession, isPending: isAuthPending } = authClient.useSession()
  const sessions = useQuery(api.examSession.public.queries.listExamSessions, {})
  const unlockParticipant = useMutation(api.examSession.public.mutations.unlockParticipant)
  const removeParticipant = useMutation(api.examSession.public.mutations.removeSessionParticipant)

  const [pickedSessionId, setPickedSessionId] = React.useState("")
  const [continuationSource, setContinuationSource] = React.useState<ContinuationSource | null>(null)
  const [unlockingId, setUnlockingId] = React.useState<string | null>(null)
  const [removingId, setRemovingId] = React.useState<string | null>(null)

  // Sesi aktif menjadi pilihan awal selama pengajar belum memilih sendiri.
  const defaultSessionId = React.useMemo(() => {
    if (!sessions || sessions.length === 0) return ""
    return sessions.find((s) => s.status === "active")?._id ?? sessions[0]._id
  }, [sessions])

  const selectedSessionId = pickedSessionId || defaultSessionId
  const selectedSession = sessions?.find((s) => s._id === selectedSessionId)

  const participants = useQuery(
    api.examSession.public.queries.listSessionParticipants,
    selectedSessionId ? { sessionId: selectedSessionId as Id<"examSessions"> } : "skip"
  )

  // Jam server dan jam perangkat pengajar bisa berbeda zona, jadi angka jam serta
  // hitung mundur baru dirender setelah komponen hidup di browser. Semua setState
  // terjadi di callback penghitung waktu, tidak sinkron di badan efek.
  const [clientClock, setClientClock] = React.useState<number | null>(null)
  const hasLiveWork = (participants?.filter((p) => p.status === "in_progress").length ?? 0) > 0

  React.useEffect(() => {
    const seed = setTimeout(() => setClientClock(Date.now()), 0)
    return () => clearTimeout(seed)
  }, [])

  React.useEffect(() => {
    if (!hasLiveWork) return

    const tick = setInterval(() => setClientClock(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [hasLiveWork])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "in_progress" | "submitted" | "locked">("all")
  const [classFilter, setClassFilter] = React.useState<string>("all")

  const ordered = React.useMemo(
    () => sortForMonitoring((participants ?? []) as MonitoringParticipant[]),
    [participants]
  )
  const summary = summarizeParticipants(ordered)

  const availableClasses = React.useMemo(() => {
    if (!participants) return []
    const classes = new Set<string>()
    for (const p of participants) {
      if (p.className && p.className.trim()) {
        classes.add(p.className.trim())
      }
    }
    return Array.from(classes).sort()
  }, [participants])

  const lockedCount = React.useMemo(() => {
    return ordered.filter((p) => p.lockedAt !== undefined || (p.tabViolations ?? 0) > 0).length
  }, [ordered])

  const filtered = React.useMemo(() => {
    return ordered.filter((p) => {
      if (statusFilter === "in_progress" && p.status !== "in_progress") return false
      if (statusFilter === "submitted" && p.status !== "submitted") return false
      if (statusFilter === "locked" && p.lockedAt === undefined && (p.tabViolations ?? 0) === 0) return false

      if (classFilter !== "all" && (p.className ?? "") !== classFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = p.studentName.toLowerCase().includes(q)
        const matchNisn = p.nisn.toLowerCase().includes(q)
        const matchClass = (p.className ?? "").toLowerCase().includes(q)
        if (!matchName && !matchNisn && !matchClass) return false
      }

      return true
    })
  }, [ordered, statusFilter, classFilter, searchQuery])

  // Durasi hanya dibaca ketika sesi terpilih dan jam klien sudah tersedia.
  const timeLeftFor = (p: MonitoringParticipant) =>
    selectedSession && clientClock !== null
      ? remainingTimeMs(p, selectedSession.durationMinutes, clientClock)
      : null
  const overtimeFor = (p: MonitoringParticipant) =>
    selectedSession && clientClock !== null
      ? isOvertime(p, selectedSession.durationMinutes, clientClock)
      : false
  const clockText = (timestamp: number | undefined) =>
    clientClock === null ? "-" : formatTimeOfDay(timestamp)

  const handleUnlockParticipant = async (participant: MonitoringParticipant) => {
    const savedAnswers = formatSavedAnswerCount(participant.savedAnswerCount)
    if (
      !confirm(
        `Buka kunci lembar ${participant.studentName}? ${savedAnswers} tetap utuh dan santri dapat melanjutkan pengerjaan.`
      )
    ) {
      return
    }

    setUnlockingId(participant._id)
    try {
      await unlockParticipant({
        participantId: participant._id as Id<"examParticipants">,
      })
      toast.success(`Kunci lembar ${participant.studentName} dibuka. Jawaban tersimpan tetap utuh.`)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal membuka kunci lembar peserta.")
    } finally {
      setUnlockingId(null)
    }
  }

  const handleRemoveParticipant = async (participant: MonitoringParticipant) => {
    if (
      !confirm(
        `Keluarkan santri "${participant.studentName}" (${participant.nisn}) dari sesi ini? Seluruh lembar jawaban santri pada sesi ini akan dihapus permanen.`
      )
    ) {
      return
    }

    setRemovingId(participant._id)
    try {
      await removeParticipant({
        participantId: participant._id as Id<"examParticipants">,
      })
      toast.success(`Santri "${participant.studentName}" berhasil dikeluarkan dari sesi.`)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal mengeluarkan santri dari sesi.")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Monitoring Sesi Ujian</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau santri yang sedang mengikuti ujian Anda tanpa menunggu ujian berakhir.
          </p>
        </div>

        {selectedSession && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SessionStatusBadge status={selectedSession.status} />
            <Badge variant="outline" className="text-xs font-mono">
              {selectedSession.gradeLevel}
            </Badge>
            {participants?.some(
              (participant) =>
                participant.status === "submitted" && participant.gradingStatus === "graded"
            ) && (
              <Link
                href={`/rekap-nilai/analisis/${selectedSession._id}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "text-xs gap-1.5",
                })}
              >
                <BarChart3Icon className="size-3.5" />
                Analisis Butir
              </Link>
            )}
            {selectedSession.status === "ended" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => setContinuationSource(selectedSession)}
              >
                <GitBranchIcon className="size-3.5" />
                Buat Remedial / Susulan
              </Button>
            )}
          </div>
        )}
      </div>

      {!isAuthPending && !authSession?.user && (
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Masuk sebagai pengajar untuk melihat daftar peserta sesi ujian Anda.
            </p>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Login Pengajar
            </Link>
          </CardContent>
        </Card>
      )}

      {sessions?.length === 0 && !isAuthPending && authSession?.user && (
        <Card className="border shadow-2xs">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Anda belum punya sesi ujian. Jadwalkan satu sesi untuk dapat memantaunya.
            </p>
            <Link href="/sesi-ujian" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Buat Sesi Ujian
            </Link>
          </CardContent>
        </Card>
      )}

      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 lg:col-span-5">
            <Select
              items={sessions?.map((session) => ({
                value: session._id,
                label: `${session.title} (${session.subjectCode} - ${session.gradeLevel})`,
              }))}
              value={selectedSessionId}
              onValueChange={(val) => setPickedSessionId(val ?? "")}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm" aria-label="Pilih sesi ujian">
                <SelectValue placeholder="Pilih sesi ujian..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.title} ({s.subjectCode} - {s.gradeLevel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSession && (
            <div className="sm:col-span-6 lg:col-span-7 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5 shrink-0" />
                {selectedSession.durationMinutes} menit per santri
              </span>
              <span className="flex items-center gap-1.5">
                <LayersIcon className="size-3.5 shrink-0" />
                {selectedSession.totalQuestions} soal ({selectedSession.totalPoints} poin)
              </span>
            </div>
          )}
        </div>
      )}

      {selectedSession && (
        <SessionTokenCard key={`session-token-${selectedSession._id}`} session={selectedSession} />
      )}

      {selectedSession && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Sudah Masuk"
            value={String(summary.entered)}
            hint="Tampilkan semua santri"
            icon={<UsersIcon className="size-4 text-primary" />}
            onClick={() => setStatusFilter("all")}
            isActive={statusFilter === "all"}
          />
          <SummaryCard
            label="Sedang Mengerjakan"
            value={String(summary.inProgress)}
            hint="Saring yang aktif ujian"
            icon={<ActivityIcon className="size-4 text-amber-600" />}
            onClick={() => setStatusFilter("in_progress")}
            isActive={statusFilter === "in_progress"}
          />
          <SummaryCard
            label="Telah Selesai"
            value={String(summary.submitted)}
            hint="Saring yang sudah kumpul"
            icon={<ListChecksIcon className="size-4 text-primary" />}
            onClick={() => setStatusFilter("submitted")}
            isActive={statusFilter === "submitted"}
          />
          <SummaryCard
            label="Pelanggaran Tab"
            value={String(summary.violationsTotal)}
            hint={`${summary.flaggedCount} santri terindikasi`}
            icon={<ShieldAlertIcon className="size-4 text-destructive" />}
            onClick={() => setStatusFilter("locked")}
            isActive={statusFilter === "locked"}
          />
        </div>
      )}

      <Card className="border shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <UsersIcon className="size-4 text-primary" />
              Peserta {selectedSession ? selectedSession.title : "Ujian"}
            </CardTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {filtered.length} / {summary.entered} Santri
            </Badge>
          </div>

          {participants && participants.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setStatusFilter("all")}
              >
                Semua ({summary.entered})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "in_progress" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setStatusFilter("in_progress")}
              >
                Sedang Ujian ({summary.inProgress})
              </Button>
              <Button
                type="button"
                variant={statusFilter === "submitted" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setStatusFilter("submitted")}
              >
                Selesai ({summary.submitted})
              </Button>
              {lockedCount > 0 && (
                <Button
                  type="button"
                  variant={statusFilter === "locked" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2.5 text-destructive border-destructive/30"
                  onClick={() => setStatusFilter("locked")}
                >
                  Terkunci ({lockedCount})
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        {/* Bilah Toolbar Pencarian & Filter Kelas */}
        {participants && participants.length > 0 && (
          <div className="p-3 bg-muted/20 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama santri, NISN, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>

            {availableClasses.length > 0 && (
              <div className="w-full sm:w-48 shrink-0">
                <Select
                  items={[
                    { value: "all", label: "Semua Kelas" },
                    ...availableClasses.map((cls) => ({ value: cls, label: `Kelas ${cls}` })),
                  ]}
                  value={classFilter}
                  onValueChange={(val) => setClassFilter(val ?? "all")}
                >
                  <SelectTrigger className="h-8 text-xs bg-card" aria-label="Filter kelas santri">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        Kelas {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(searchQuery || statusFilter !== "all" || classFilter !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setClassFilter("all")
                }}
                className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        )}

        <CardContent className="p-0">
          {selectedSessionId === "" ? (
            <p className="p-12 text-center text-xs text-muted-foreground">
              {sessions && sessions.length === 0
                ? "Belum ada sesi untuk dipantau."
                : "Pilih sesi ujian untuk melihat daftarnya."}
            </p>
          ) : participants === undefined ? (
            <p className="p-12 text-center text-xs text-muted-foreground animate-pulse">
              Memuat daftar peserta...
            </p>
          ) : participants.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-1">
              <p>Belum ada santri yang masuk ke sesi ini.</p>
              {selectedSession && (
                <p>
                  Bagikan token <span className="font-mono font-semibold">{selectedSession.token}</span>{" "}
                  kepada santri di ruang ujian.
                </p>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
              <p>Tidak ada santri yang sesuai dengan filter atau kata kunci pencarian.</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setClassFilter("all")
                }}
              >
                Reset Semua Filter
              </Button>
            </div>
          ) : (
            <>
              {/* Tabel untuk layar menengah ke atas */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Nama Santri</TableHead>
                      <TableHead>Nomor Induk</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Masuk</TableHead>
                      <TableHead className="text-center">Sisa Waktu</TableHead>
                      <TableHead className="text-center">Selesai</TableHead>
                      <TableHead className="text-center">Pelanggaran Tab</TableHead>
                      <TableHead className="text-center">Nilai</TableHead>
                      <TableHead className="text-center">Koreksi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {filtered.map((p) => {
                      const remaining = timeLeftFor(p)
                      const overtime = overtimeFor(p)

                      return (
                        <TableRow key={p._id}>
                          <TableCell className="font-semibold">{p.studentName}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{p.nisn}</TableCell>
                          <TableCell className="text-muted-foreground">{p.className ?? "-"}</TableCell>
                          <TableCell>
                            <ParticipantStatusBadge participant={p} />
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {clockText(p.startedAt)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {p.status === "in_progress" ? (
                              <span className={overtime ? "text-destructive" : "text-foreground"}>
                                {overtime ? "Waktu habis" : formatCountdown(remaining)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {clockText(p.finishedAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            <ViolationBadge count={p.tabViolations} />
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-primary">
                            {p.totalScore !== undefined ? p.totalScore : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <GradingBadge gradingStatus={p.gradingStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status === "submitted" ? (
                                <Link
                                  href={`/rekap-nilai/koreksi/${p._id}`}
                                  className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                    className: "h-7 text-xs gap-1",
                                  })}
                                >
                                  <FileEditIcon className="size-3" />
                                  Buka Koreksi
                                </Link>
                              ) : p.lockedAt !== undefined ? (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  disabled={unlockingId === p._id}
                                  onClick={() => handleUnlockParticipant(p)}
                                >
                                  {unlockingId === p._id ? (
                                    <Loader2Icon className="size-3 animate-spin" />
                                  ) : (
                                    <UnlockIcon className="size-3" />
                                  )}
                                  Buka Kunci
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">
                                  Menunggu santri
                                </span>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:bg-destructive/10 shrink-0"
                                disabled={removingId === p._id}
                                onClick={() => handleRemoveParticipant(p)}
                                title={`Keluarkan ${p.studentName}`}
                                aria-label={`Keluarkan ${p.studentName} dari sesi`}
                              >
                                {removingId === p._id ? (
                                  <Loader2Icon className="size-3.5 animate-spin" />
                                ) : (
                                  <Trash2Icon className="size-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Kartu untuk layar kecil */}
              <div className="md:hidden divide-y">
                {filtered.map((p) => {
                  const remaining = timeLeftFor(p)
                  const overtime = overtimeFor(p)

                  return (
                    <div key={p._id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{p.studentName}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {p.nisn} • {p.className ?? "-"}
                          </p>
                        </div>
                        <ParticipantStatusBadge participant={p} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Masuk {clockText(p.startedAt)}</span>
                        {p.status === "in_progress" ? (
                          <span
                            className={
                              overtime
                                ? "font-mono font-bold text-destructive"
                                : "font-mono font-bold text-foreground"
                            }
                          >
                            {overtime ? "Waktu habis" : formatCountdown(remaining)}
                          </span>
                        ) : (
                          <span>Selesai {clockText(p.finishedAt)}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <AlertTriangleIcon className="size-3" />
                          <ViolationBadge count={p.tabViolations} />
                        </span>
                        {p.totalScore !== undefined && (
                          <span className="font-mono font-bold text-primary">{p.totalScore}</span>
                        )}
                        {p.gradingStatus && <GradingBadge gradingStatus={p.gradingStatus} />}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {p.status === "submitted" ? (
                          <Link
                            href={`/rekap-nilai/koreksi/${p._id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "flex-1 gap-1",
                            })}
                          >
                            <FileEditIcon className="size-3" />
                            Buka Koreksi
                          </Link>
                        ) : p.lockedAt !== undefined ? (
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            disabled={unlockingId === p._id}
                            onClick={() => handleUnlockParticipant(p)}
                          >
                            {unlockingId === p._id ? (
                              <Loader2Icon className="size-3 animate-spin" />
                            ) : (
                              <UnlockIcon className="size-3" />
                            )}
                            Buka Kunci
                          </Button>
                        ) : (
                          <p className="flex-1 text-[11px] text-muted-foreground">
                            Menunggu santri mengumpulkan
                          </p>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 text-xs gap-1 shrink-0"
                          disabled={removingId === p._id}
                          onClick={() => handleRemoveParticipant(p)}
                          title={`Keluarkan ${p.studentName}`}
                          aria-label={`Keluarkan ${p.studentName} dari sesi`}
                        >
                          {removingId === p._id ? (
                            <Loader2Icon className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2Icon className="size-3.5" />
                          )}
                          Keluarkan
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {continuationSource && (
        <SessionContinuationDialog
          key={`session-continuation-${continuationSource._id}`}
          source={continuationSource}
          onClose={() => setContinuationSource(null)}
        />
      )}
    </div>
  )
}
