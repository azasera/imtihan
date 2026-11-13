"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowDownRightIcon,
  AwardIcon,
  BarChart3Icon,
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  FileEditIcon,
  GraduationCapIcon,
  PrinterIcon,
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { passingStatusLabel, sessionKindLabel } from "@/lib/item-analysis"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function RekapNilaiPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const sessions = useQuery(api.examSession.public.queries.listExamSessions, {})

  const [pickedSessionId, setPickedSessionId] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState("")

  // Sesi pertama menjadi default selama pengajar belum memilih sendiri.
  const selectedSessionId = pickedSessionId || sessions?.[0]?._id || ""

  const participants = useQuery(
    api.examSession.public.queries.listSessionParticipants,
    selectedSessionId ? { sessionId: selectedSessionId as Id<"examSessions"> } : "skip"
  )

  const selectedSession = React.useMemo(() => {
    return sessions?.find((s) => s._id === selectedSessionId)
  }, [sessions, selectedSessionId])

  // Batas tuntas milik sesi; sesi tanpa batas tuntas tidak menampilkan penanda apa pun.
  const passingScore = selectedSession?.passingScore ?? null

  // Perhitungan statistik nilai kelas
  const stats = React.useMemo(() => {
    if (!participants || participants.length === 0) {
      return {
        totalParticipants: 0,
        submittedCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passingCount: 0,
        passingPercentage: null,
      }
    }

    const submitted = participants.filter((p) => p.status === "submitted" && p.totalScore !== undefined)

    if (submitted.length === 0) {
      return {
        totalParticipants: participants.length,
        submittedCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passingCount: 0,
        passingPercentage: null,
      }
    }

    const scores = submitted.map((p) => p.totalScore ?? 0)
    const total = scores.reduce((acc, curr) => acc + curr, 0)
    const avg = total / scores.length
    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const passing =
      passingScore === null
        ? 0
        : submitted.filter((p) => (p.totalScore ?? 0) >= passingScore).length
    const passingPct =
      passingScore === null ? null : Number(((passing / submitted.length) * 100).toFixed(1))

    return {
      totalParticipants: participants.length,
      submittedCount: submitted.length,
      averageScore: Number(avg.toFixed(1)),
      highestScore: max,
      lowestScore: min,
      passingCount: passing,
      passingPercentage: passingPct,
    }
  }, [participants, passingScore])

  // Filter daftar santri berdasarkan pencarian
  const filteredParticipants = React.useMemo(() => {
    if (!participants) return []

    return participants.filter((p) => {
      const matchName = p.studentName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchNisn = p.nisn.toLowerCase().includes(searchQuery.toLowerCase())
      return matchName || matchNisn
    })
  }, [participants, searchQuery])

  // Ekspor CSV dengan BOM UTF-8
  const handleExportCSV = () => {
    if (!participants || participants.length === 0 || !selectedSession) {
      toast.error("Tidak ada data santri untuk diekspor.")
      return
    }

    const headers = [
      "No",
      "Nomor Induk / NISN",
      "Nama Santri",
      "Kelas",
      "Status Ujian",
      "Jenis Sesi",
      "Pelanggaran Tab",
      "Nilai Pilihan Ganda",
      "Nilai Essay",
      "Nilai Sebelum Pembatasan",
      "Total Nilai Akhir",
      "Batas Tuntas",
      "Ketuntasan",
    ]

    const rows = filteredParticipants.map((p, idx) => {
      const isSubmitted = p.status === "submitted"
      const total = p.totalScore !== undefined ? p.totalScore : ""
      const pg = p.multipleChoiceScore !== undefined ? p.multipleChoiceScore : ""
      const essay = p.essayScore !== undefined ? p.essayScore : ""
      const violations = p.tabViolations ?? 0
      const rawTotal = p.rawTotalScore ?? (typeof total === "number" ? total : "")
      const ketuntasan =
        isSubmitted && typeof total === "number" && passingScore !== null
          ? total >= passingScore
            ? "Tuntas"
            : "Belum Tuntas"
          : "-"

      return [
        idx + 1,
        `"${p.nisn}"`,
        `"${p.studentName.replace(/"/g, '""')}"`,
        `"${p.className || selectedSession.gradeLevel}"`,
        isSubmitted ? "Selesai" : "Sedang Mengerjakan",
        sessionKindLabel(selectedSession.kind),
        violations,
        pg,
        essay,
        rawTotal,
        total,
        passingScore ?? "",
        ketuntasan,
      ].join(",")
    })

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const cleanTitle = selectedSession.title.replace(/[^a-zA-Z0-9]/g, "-")
    link.href = url
    link.setAttribute("download", `Rekap-Nilai-${cleanTitle}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Rekap nilai santri berhasil diunduh dalam format CSV!")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
      {/* Kop Resmi Pesantren untuk Mode Cetak */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b-2 border-black space-y-1">
        <h2 className="text-xl font-bold tracking-wide uppercase font-heading">
          Pondok Pesantren At-Tauhid
        </h2>
        <h3 className="text-sm font-semibold uppercase">
          Laporan Rekapitulasi Hasil Evaluasi Ujian Santri
        </h3>
        {selectedSession && (
          <p className="text-xs text-muted-foreground">
            Mata Pelajaran: <strong>{selectedSession.subjectCode}</strong> • Kelas:{" "}
            <strong>{selectedSession.gradeLevel}</strong> • Sesi: <strong>{selectedSession.title}</strong>
          </p>
        )}
      </div>

      {/* Header Halaman Web */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Rekap Nilai & Koreksi Ujian
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Hasil evaluasi ujian santri, analisis statistik kelas, dan ekspor laporan nilai resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedSession && participants && participants.length > 0 && (
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

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5"
            disabled={!participants || participants.length === 0}
          >
            <PrinterIcon className="size-3.5" />
            Cetak Laporan
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5"
            disabled={!participants || participants.length === 0}
          >
            <DownloadIcon className="size-3.5" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {!isSessionPending && !session?.user && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 print:hidden">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Anda belum login sebagai Pengajar</p>
            <p className="text-xs text-muted-foreground">
              Untuk melihat rekapitulasi nilai dan mengoreksi ujian santri, silakan login dengan akun pengajar Anda.
            </p>
          </div>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Login Pengajar
          </Link>
        </div>
      )}

      {/* Kontrol Pemilihan Sesi & Pencarian */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center print:hidden">
        <div className="sm:col-span-6 lg:col-span-5">
          <Select
            items={sessions?.map((session) => ({
              value: session._id,
              label: `${session.title} (${session.subjectCode} - ${session.gradeLevel})`,
            }))}
            value={selectedSessionId}
            onValueChange={(val) => setPickedSessionId(val ?? "")}
          >
            <SelectTrigger className="w-full text-xs sm:text-sm">
              <SelectValue placeholder="Pilih sesi ujian..." />
            </SelectTrigger>
            <SelectContent>
              {sessions?.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.title} ({s.subjectCode} - {s.gradeLevel})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-6 lg:col-span-7 relative">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama santri atau NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Panel 4 Kartu Statistik Nilai Kelas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-2xs">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Rata-rata Kelas</CardDescription>
            <ActivityIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono tracking-tight">
              {stats.submittedCount > 0 ? stats.averageScore : "-"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dari {stats.submittedCount} santri selesai
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Nilai Tertinggi</CardDescription>
            <AwardIcon className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
              {stats.submittedCount > 0 ? stats.highestScore : "-"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Skor maksimum kelas
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Nilai Terendah</CardDescription>
            <ArrowDownRightIcon className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-amber-600 tracking-tight">
              {stats.submittedCount > 0 ? stats.lowestScore : "-"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Skor minimum kelas
            </p>
          </CardContent>
        </Card>

        <Card className="border shadow-2xs">
          <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Ketuntasan KKM</CardDescription>
            <CheckCircle2Icon className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold font-mono text-primary tracking-tight">
              {stats.passingPercentage === null ? "-" : `${stats.passingPercentage}%`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {passingScore === null
                ? "Batas tuntas sesi belum diisi"
                : `${stats.passingCount} santri tuntas KKM (${passingScore})`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Hasil & Koreksi Santri */}
      <Card className="border shadow-xs print:border-none print:shadow-none">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between print:hidden">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <UsersIcon className="size-4 text-primary" />
            Daftar Nilai & Evaluasi Santri
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredParticipants.length} Data Santri
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {participants === undefined ? (
            <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
              Memuat data hasil ujian santri...
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <GraduationCapIcon className="size-8 mx-auto text-muted-foreground/60" />
              <p>Belum ada santri yang masuk atau mengumpulkan ujian pada sesi ini.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Nama Santri</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Status Ujian</TableHead>
                  <TableHead>Jenis Sesi</TableHead>
                  <TableHead className="text-center">Pelanggaran Tab</TableHead>
                  <TableHead className="text-center">Nilai PG</TableHead>
                  <TableHead className="text-center">Nilai Essay</TableHead>
                  <TableHead className="text-center">Total Nilai</TableHead>
                  <TableHead className="text-center">Ketuntasan</TableHead>
                  <TableHead className="text-center">Status Koreksi</TableHead>
                  <TableHead className="text-right print:hidden">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredParticipants.map((p, idx) => {
                  const isSubmitted = p.status === "submitted"
                  const isGraded = p.gradingStatus === "graded"
                  const violations = p.tabViolations ?? 0
                  const passingLabel = passingStatusLabel(
                    isSubmitted ? p.totalScore : undefined,
                    passingScore
                  )

                  return (
                    <TableRow key={p._id}>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold">{p.studentName}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{p.nisn}</TableCell>
                      <TableCell>
                        {isSubmitted ? (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-[10px]">
                            Selesai
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/20">
                            Mengerjakan
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {sessionKindLabel(selectedSession?.kind)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {violations === 0 ? (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 text-[10px]">
                            0 (Tertib)
                          </Badge>
                        ) : violations <= 2 ? (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-50 dark:bg-amber-950/20 text-[10px]">
                            {violations}x Waspada
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            {violations}x Pelanggaran
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {p.multipleChoiceScore !== undefined ? p.multipleChoiceScore : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {p.essayScore !== undefined ? p.essayScore : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-primary">
                        {p.totalScore !== undefined ? p.totalScore : "-"}
                        {isSubmitted &&
                          p.rawTotalScore !== undefined &&
                          p.totalScore !== undefined &&
                          p.rawTotalScore > p.totalScore && (
                            <div className="text-[10px] font-normal text-muted-foreground">
                              sebelum batas: {p.rawTotalScore}
                            </div>
                          )}
                      </TableCell>
                      <TableCell className="text-center">
                        {passingLabel === null ? (
                          <span className="text-muted-foreground text-[10px]">-</span>
                        ) : passingLabel === "Tuntas" ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px]"
                          >
                            Tuntas
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px]"
                          >
                            Belum tuntas
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.gradingStatus === "pending_essay" ? (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-[10px]">
                            Perlu Koreksi Essay
                          </Badge>
                        ) : isGraded ? (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px]">
                            Selesai Dinilai
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        {isSubmitted ? (
                          <Link
                            href={`/rekap-nilai/koreksi/${p._id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "h-7 text-xs gap-1",
                            })}
                          >
                            <FileEditIcon className="size-3" />
                            Koreksi Essay
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Belum submit</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
