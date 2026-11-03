"use client"

import * as React from "react"
import { useAction, useQuery } from "convex/react"
import {
  ArrowDownToLineIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  LayersIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SantriManagementPage() {
  const [selectedJenjang, setSelectedJenjang] = React.useState<"ALL" | "SMPITA" | "SMAITA" | "MTA">("ALL")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isSyncing, setIsSyncing] = React.useState(false)

  const stats = useQuery(api.students.public.queries.getStudentStats)
  const students = useQuery(api.students.public.queries.getStudents, {
    jenjang: selectedJenjang,
    searchQuery: searchQuery.trim() || undefined,
  })

  const syncStudents = useAction(api.students.public.actions.syncStudentsFromSipaksa)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await syncStudents({})
      toast.success(
        `Sinkronisasi berhasil! ${res.totalFiltered} santri aktif (SMP: ${res.byJenjang.SMPITA}, SMA: ${res.byJenjang.SMAITA}, MTA: ${res.byJenjang.MTA}) siap digunakan.`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menghubungi SiPAKSa"
      toast.error(msg)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return "Belum pernah disinkronkan"
    const d = new Date(timestamp)
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GraduationCapIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Data Master Santri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Data santri resmi terintegrasi dengan SiPAKSa untuk jenjang SMPITA, SMAITA, dan Ma&apos;had Tahfidz (MTA).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
          >
            {isSyncing ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Sinkronisasi SiPAKSa...
              </>
            ) : (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Tarik Data dari SiPAKSa
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Santri Aktif
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats ? stats.total : <Loader2Icon className="h-5 w-5 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Santri terdaftar di sistem ujian
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SMPITA
            </CardTitle>
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
              SMP
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats ? stats.SMPITA : <Loader2Icon className="h-5 w-5 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              10 Rombel (Kelas 7, 8, 9)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SMAITA
            </CardTitle>
            <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
              SMA
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats ? stats.SMAITA : <Loader2Icon className="h-5 w-5 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              4 Rombel (Kelas 10, 11, 12)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MTA (Tahfidz)
            </CardTitle>
            <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
              MTA
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats ? stats.MTA : <Loader2Icon className="h-5 w-5 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              6 Tingkatan (MTA 1 s.d. 6)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Tabel Data */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={selectedJenjang}
              onValueChange={(v) => setSelectedJenjang(v as "ALL" | "SMPITA" | "SMAITA" | "MTA")}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-muted/60 p-1">
                <TabsTrigger value="ALL">Semua Lembaga</TabsTrigger>
                <TabsTrigger value="SMPITA">SMPITA</TabsTrigger>
                <TabsTrigger value="SMAITA">SMAITA</TabsTrigger>
                <TabsTrigger value="MTA">MTA</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NISN, NIS, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>ID Santri</TableHead>
                  <TableHead>Nama Santri</TableHead>
                  <TableHead>Lembaga</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>NISN / NIS</TableHead>
                  <TableHead>Asrama</TableHead>
                  <TableHead>Halaqah</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students === undefined ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2Icon className="h-5 w-5 animate-spin" />
                        <span>Memuat data santri...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UsersIcon className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium">Belum ada data santri yang dimuat</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Klik tombol &quot;Tarik Data dari SiPAKSa&quot; di atas untuk menyinkronkan 346 santri nyata jenjang SMP, SMA, dan MTA.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s, idx) => (
                    <TableRow key={s._id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {s.santriId}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {s.nama}
                      </TableCell>
                      <TableCell>
                        {s.jenjang === "SMPITA" && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            SMPITA
                          </Badge>
                        )}
                        {s.jenjang === "SMAITA" && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                            SMAITA
                          </Badge>
                        )}
                        {s.jenjang === "MTA" && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                            MTA
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.kelas}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {s.nisn ? s.nisn : s.nis ? s.nis : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.dormitory || "Non Asrama"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.guruHalaqah || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {stats && stats.lastSyncedAt > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs text-muted-foreground bg-muted/10">
              <span className="flex items-center gap-1.5">
                <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                Terakhir disinkronkan: {formatLastSync(stats.lastSyncedAt)}
              </span>
              <span>Menampilkan {students?.length || 0} santri</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
