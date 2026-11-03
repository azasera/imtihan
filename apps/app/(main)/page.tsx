"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import {
  ActivityIcon,
  ArrowRightIcon,
  BarChart3Icon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
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

export default function HomePage() {
  const questionBanks = useQuery(api.bank.public.queries.listQuestionBanks, {})
  const sessions = useQuery(api.examSession.public.queries.listExamSessions, {})

  const activeSessionsCount = React.useMemo(() => {
    return sessions ? sessions.filter((s) => s.status === "active").length : 0
  }, [sessions])

  const totalBanksCount = questionBanks ? questionBanks.length : 0
  const totalSessionsCount = sessions ? sessions.length : 0

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Banner Sambutan */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 sm:p-8">
        <div className="max-w-2xl space-y-2">
          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
            Sistem Ujian Pesantren Terpadu
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            E-Imtihan At-Tauhid
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Platform asesmen berbasis komputer (CBA) Pondok Pesantren At-Tauhid. Susun paket bank soal terstandar, jadwalkan sesi ujian santri, pantau pelaksanaan, dan kelola rekapitulasi nilai secara efisien.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link
            href="/bank-soal"
            className={buttonVariants({ size: "sm", className: "gap-1.5 text-xs" })}
          >
            <PlusIcon className="size-3.5" />
            Kelola Bank Soal
          </Link>
          <Link
            href="/sesi-ujian"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}
          >
            <CalendarIcon className="size-3.5" />
            Jadwal Sesi Ujian
          </Link>
          <Link
            href="/ujian"
            target="_blank"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 text-xs text-primary" })}
          >
            <GraduationCapIcon className="size-3.5" />
            Buka Pintu Santri
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </div>

      {/* Ringkasan Metrik Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="border shadow-xs hover:border-primary/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Bank Soal Tersimpan</CardDescription>
            <FileTextIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold font-mono tracking-tight">
              {totalBanksCount} Paket
            </div>
            <p className="text-xs text-muted-foreground">
              Paket butir pertanyaan pilihan ganda & essay
            </p>
          </CardContent>
          <CardFooter className="pt-2 border-t text-xs">
            <Link
              href="/bank-soal"
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
            >
              Lihat seluruh paket bank soal
              <ArrowRightIcon className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-all">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Sesi Ujian Terjadwal</CardDescription>
            <CalendarIcon className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold font-mono text-emerald-600 tracking-tight">
              {activeSessionsCount} Aktif
            </div>
            <p className="text-xs text-muted-foreground">
              Dari total {totalSessionsCount} jadwal sesi ujian
            </p>
          </CardContent>
          <CardFooter className="pt-2 border-t text-xs">
            <Link
              href="/sesi-ujian"
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
            >
              Kelola sesi dan token akses santri
              <ArrowRightIcon className="size-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="border shadow-xs hover:border-primary/40 transition-all sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription className="text-xs font-medium">Rekapitulasi & Koreksi</CardDescription>
            <BarChart3Icon className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-3xl font-bold font-mono tracking-tight">
              Nilai Santri
            </div>
            <p className="text-xs text-muted-foreground">
              Koreksi otomatis PG, evaluasi essay, dan ekspor CSV
            </p>
          </CardContent>
          <CardFooter className="pt-2 border-t text-xs">
            <Link
              href="/rekap-nilai"
              className="text-primary hover:underline flex items-center gap-1 text-[11px]"
            >
              Buka rekapitulasi nilai dan laporan
              <ArrowRightIcon className="size-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Alur Kerja Evaluasi Pesantren */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-heading">
            Alur Pelaksanaan Ujian Santri
          </CardTitle>
          <CardDescription className="text-xs">
            Tahapan penyelenggaraan ujian dari penyusunan materi hingga pelaporan hasil nilai santri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="size-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs font-mono">
                1
              </div>
              <h4 className="font-semibold text-foreground">Susun Bank Soal</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tulis butir pertanyaan pilihan ganda & essay lengkap dengan bobot dan rubrik.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="size-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs font-mono">
                2
              </div>
              <h4 className="font-semibold text-foreground">Jadwalkan & Token</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tentukan durasi pengerjaan, aktifkan sesi, dan bagikan token unik 6 digit ke santri.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="size-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs font-mono">
                3
              </div>
              <h4 className="font-semibold text-foreground">Ujian CBA Santri</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Santri mengerjakan ujian dengan auto-save aman dan timer hitung mundur.
              </p>
            </div>

            <div className="p-3.5 rounded-lg border bg-muted/20 space-y-1.5">
              <div className="size-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs font-mono">
                4
              </div>
              <h4 className="font-semibold text-foreground">Rekap & Laporan</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Skor PG instan, koreksi cepat essay, dan cetak laporan hasil nilai resmi kelas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
