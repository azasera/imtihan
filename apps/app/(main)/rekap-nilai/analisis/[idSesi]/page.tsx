"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import {
  ActivityIcon,
  ArrowDownRightIcon,
  ArrowLeftIcon,
  AwardIcon,
  DownloadIcon,
  InfoIcon,
  PrinterIcon,
  TargetIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { AchievementBreakdown } from "@/components/rekap-nilai/achievement-breakdown"
import { ItemQualityTable } from "@/components/rekap-nilai/item-quality-table"
import { RemedialGroups } from "@/components/rekap-nilai/remedial-groups"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildItemAnalysisCsv,
  sessionKindLabel,
  type SessionAnalysis,
} from "@/lib/item-analysis"

const KIND_BADGE_CLASS: Record<SessionAnalysis["session"]["kind"], string> = {
  reguler: "text-[10px]",
  remedial: "text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-300",
  susulan: "text-[10px] border-sky-500/40 text-sky-700 dark:text-sky-300",
}

export default function AnalisisButirPage() {
  const params = useParams<{ idSesi: string }>()
  const sessionId = params?.idSesi

  const rawAnalysis = useQuery(
    api.analysis.public.queries.getSessionAnalysis,
    sessionId ? { sessionId: sessionId as Id<"examSessions"> } : "skip"
  )
  const analysis = rawAnalysis as unknown as SessionAnalysis | null | undefined

  const handleDownload = () => {
    if (!analysis || analysis.items.length === 0) {
      toast.error("Belum ada tabel mutu butir untuk diunduh.")
      return
    }

    const blob = new Blob([buildItemAnalysisCsv(analysis)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const cleanTitle = analysis.session.title.replace(/[^a-zA-Z0-9]/g, "-")
    link.href = url
    link.setAttribute("download", `Analisis-Butir-${cleanTitle}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success("Tabel mutu butir berhasil diunduh.")
  }

  if (analysis === undefined) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-lg border bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg border bg-muted/40 animate-pulse" />
      </div>
    )
  }

  if (analysis === null) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 md:p-16 max-w-xl mx-auto w-full text-center">
        <InfoIcon className="size-8 text-muted-foreground/60" />
        <h1 className="text-lg font-semibold font-heading">Analisis butir tidak tersedia</h1>
        <p className="text-sm text-muted-foreground">
          Sesi ini tidak ditemukan atau bukan milik akun pengajar yang sedang masuk.
        </p>
        <Link href="/rekap-nilai" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Kembali ke rekap nilai
        </Link>
      </div>
    )
  }

  const { session, summary, groups } = analysis
  const hasParticipants = analysis.totalParticipantCount > 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full print:p-0 print:max-w-none">
      <div className="hidden print:block text-center pb-4 mb-2 border-b-2 border-black space-y-1">
        <h2 className="text-xl font-bold tracking-wide uppercase font-heading">
          Pondok Pesantren At-Tauhid
        </h2>
        <h3 className="text-sm font-semibold uppercase">Laporan Analisis Mutu Butir Soal</h3>
        <p className="text-xs">
          {session.subjectCode} · {session.gradeLevel} · {session.title}
        </p>
      </div>

      <div className="flex flex-col gap-3 pb-3 border-b print:hidden">
        <Link
          href="/rekap-nilai"
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Kembali ke rekap nilai
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight font-heading">{session.title}</h1>
              <Badge variant="outline" className={KIND_BADGE_CLASS[session.kind]}>
                {sessionKindLabel(session.kind)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {session.subjectCode} · {session.gradeLevel} · {session.questionCount} butir ·{" "}
              {analysis.gradedParticipantCount} peserta dinilai
              {session.passingScore !== null && ` · batas tuntas ${session.passingScore}`}
            </p>
            {session.sourceTitle && (
              <p className="text-xs text-muted-foreground">Sesi sumber: {session.sourceTitle}</p>
            )}
            {session.kind === "remedial" && (
              <p className="text-xs text-muted-foreground">
                {session.capAtPassingScore && session.passingScore !== null
                  ? `Nilai dibatasi sampai batas tuntas ${session.passingScore}.`
                  : "Pembatasan nilai remedial dimatikan untuk sesi ini."}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs gap-1.5"
              disabled={analysis.items.length === 0}
            >
              <PrinterIcon className="size-3.5" />
              Cetak
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              className="text-xs gap-1.5"
              disabled={analysis.items.length === 0}
            >
              <DownloadIcon className="size-3.5" />
              Unduh tabel
            </Button>
          </div>
        </div>
      </div>

      {analysis.pendingGradingCount > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          {analysis.pendingGradingCount} peserta masih menunggu koreksi essay dan belum dihitung dalam metrik ini.
        </div>
      )}

      {!hasParticipants ? (
        <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Belum ada peserta pada sesi ini.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border shadow-2xs">
              <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Rata-rata Kelas</p>
                <ActivityIcon className="size-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold font-mono tracking-tight">
                  {summary ? summary.averageScore : "-"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Dari {analysis.gradedParticipantCount} peserta dinilai
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-2xs">
              <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Nilai Tertinggi</p>
                <AwardIcon className="size-4 text-emerald-600" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
                  {summary ? summary.highestScore : "-"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Skor maksimum kelas</p>
              </CardContent>
            </Card>

            <Card className="border shadow-2xs">
              <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Nilai Terendah</p>
                <ArrowDownRightIcon className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold font-mono text-amber-600 tracking-tight">
                  {summary ? summary.lowestScore : "-"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Skor minimum kelas</p>
              </CardContent>
            </Card>

            <Card className="border shadow-2xs">
              <CardHeader className="p-4 pb-1.5 flex flex-row items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Peserta Tuntas</p>
                <TargetIcon className="size-4 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold font-mono tracking-tight">
                  {summary?.passingCount ?? "-"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {session.passingScore === null
                    ? "Batas tuntas sesi belum diisi"
                    : `Dari batas tuntas ${session.passingScore}` +
                      (summary?.passingPercentage !== null && summary?.passingPercentage !== undefined
                        ? ` · ${summary.passingPercentage}%`
                        : "")}
                </p>
              </CardContent>
            </Card>
          </div>

          {analysis.hasEnoughData ? (
            <>
              <Card className="border shadow-xs print:border-none print:shadow-none">
                <CardHeader className="p-4 border-b flex flex-row items-center justify-between print:hidden">
                  <CardTitle className="text-base font-heading">Mutu tiap butir</CardTitle>
                  <span className="text-[11px] text-muted-foreground">
                    Daya serap &lt; 30% atau daya beda tidak positif ditandai perlu ditinjau
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  <ItemQualityTable items={analysis.items} />
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <AchievementBreakdown
                  title="Capaian menurut tingkat berpikir"
                  description="Rata-rata daya serap butir yang sudah ditandai tingkat berpikirnya."
                  rows={analysis.achievements.thinkingLevels}
                />
                <AchievementBreakdown
                  title="Capaian menurut rujukan capaian materi"
                  description="Rata-rata daya serap butir yang sudah diberi rujukan capaian."
                  rows={analysis.achievements.achievementRefs}
                />
              </div>
            </>
          ) : (
            <div className="rounded-lg border p-6 text-center space-y-1">
              <p className="text-sm font-medium">Data belum cukup</p>
              <p className="text-xs text-muted-foreground">
                Metrik butir baru ditampilkan setelah minimal {analysis.minimumGradedParticipants} peserta dinilai.
                Saat ini {analysis.gradedParticipantCount} peserta sudah dinilai.
              </p>
            </div>
          )}

          <RemedialGroups
            remedial={groups.remedial}
            enrichment={groups.enrichment}
            passingScore={session.passingScore}
          />
        </>
      )}
    </div>
  )
}
