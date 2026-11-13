"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  GitBranchIcon,
  KeyRoundIcon,
  LayersIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShuffleIcon,
  StopCircleIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { parsePassingScoreInput, sessionKindLabel } from "@/lib/session-continuation"
import {
  DEFAULT_VIOLATION_THRESHOLD,
  enforcementSummary,
  parseViolationThresholdInput,
  violationThresholdHint,
  type EnforcementMode,
} from "@/lib/session-integrity"
import {
  TOKEN_ROTATION_OPTIONS,
  estimateTokenRotations,
} from "@/lib/session-token"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  SessionContinuationDialog,
  type ContinuationSource,
} from "@/components/sesi-ujian/session-continuation-dialog"

export default function SesiUjianPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const sessions = useQuery(api.examSession.public.queries.listExamSessions, {})
  const questionBanks = useQuery(api.bank.public.queries.listQuestionBanks, {})

  const createSession = useMutation(api.examSession.public.mutations.createExamSession)
  const regenerateToken = useMutation(api.examSession.public.mutations.regenerateSessionToken)
  const setSessionStatus = useMutation(api.examSession.public.mutations.setSessionStatus)
  const deleteSession = useMutation(api.examSession.public.mutations.deleteExamSession)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Form states untuk pembuatan sesi
  const [title, setTitle] = React.useState("")
  const [selectedBankId, setSelectedBankId] = React.useState<string>("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [durationMinutes, setDurationMinutes] = React.useState<number>(60)
  const [passingScoreInput, setPassingScoreInput] = React.useState<string>("")
  const [randomizeQuestions, setRandomizeQuestions] = React.useState<boolean>(true)
  const [randomizeOptions, setRandomizeOptions] = React.useState<boolean>(true)
  const [enforcementMode, setEnforcementMode] = React.useState<EnforcementMode>("record")
  const [violationThresholdInput, setViolationThresholdInput] = React.useState<string>(
    String(DEFAULT_VIOLATION_THRESHOLD)
  )
  const [rotationEnabled, setRotationEnabled] = React.useState<boolean>(false)
  const [rotationMinutes, setRotationMinutes] = React.useState<number>(15)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [continuationSource, setContinuationSource] = React.useState<ContinuationSource | null>(null)

  // State feedback copy token & regenerate
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null)
  const [regeneratingId, setRegeneratingId] = React.useState<string | null>(null)

  // Nilai awal form dihitung saat dialog dibuka, bukan lewat efek: daftar bank soal
  // bisa termuat setelah dialog terbuka dan akan ikut mereset judul yang sedang diketik.
  const openCreateSessionDialog = () => {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, "0")
    const localStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const localEnd = `${twoHoursLater.getFullYear()}-${pad(twoHoursLater.getMonth() + 1)}-${pad(twoHoursLater.getDate())}T${pad(twoHoursLater.getHours())}:${pad(twoHoursLater.getMinutes())}`

    setStartTime(localStart)
    setEndTime(localEnd)
    setTitle("")
    const defaultBankId = questionBanks && questionBanks.length > 0 ? questionBanks[0]._id : ""
    const defaultBank = questionBanks?.find((bank) => bank._id === defaultBankId)
    setSelectedBankId(defaultBankId)
    setPassingScoreInput(
      defaultBank?.passingScore === undefined || defaultBank.passingScore === null
        ? ""
        : String(defaultBank.passingScore)
    )
    setDurationMinutes(60)
    setRandomizeQuestions(true)
    setRandomizeOptions(true)
    setEnforcementMode("record")
    setViolationThresholdInput(String(DEFAULT_VIOLATION_THRESHOLD))
    setRotationEnabled(false)
    setRotationMinutes(15)
    setIsDialogOpen(true)
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user) {
      toast.error("Silakan login terlebih dahulu sebagai pengajar untuk membuat sesi ujian.")
      router.push("/login")
      return
    }

    if (!title.trim()) {
      toast.error("Judul sesi ujian wajib diisi.")
      return
    }

    if (!selectedBankId) {
      toast.error("Silakan pilih paket bank soal rujukan.")
      return
    }

    if (!startTime || !endTime) {
      toast.error("Waktu mulai dan batas akhir ujian wajib ditentukan.")
      return
    }

    if (durationMinutes <= 0) {
      toast.error("Durasi pengerjaan harus lebih besar dari 0 menit.")
      return
    }

    const passingScore = parsePassingScoreInput(passingScoreInput)
    if (!passingScore.ok) {
      toast.error(passingScore.message)
      return
    }

    let violationThreshold: number | undefined
    if (enforcementMode === "lock") {
      const parsedThreshold = parseViolationThresholdInput(violationThresholdInput)
      if (!parsedThreshold.ok) {
        toast.error(parsedThreshold.message)
        return
      }
      violationThreshold = parsedThreshold.value
    }

    setIsSubmitting(true)
    try {
      const result = await createSession({
        title: title.trim(),
        bankId: selectedBankId as Id<"questionBanks">,
        startTime,
        endTime,
        durationMinutes,
        randomizeQuestions,
        randomizeOptions,
        passingScore: passingScore.value ?? undefined,
        ...(enforcementMode === "lock"
          ? { enforcementMode: "lock" as const, violationThreshold }
          : {}),
        tokenRotationMinutes: rotationEnabled ? rotationMinutes : undefined,
      })

      toast.success(`Sesi ujian berhasil dijadwalkan dengan Token: ${result.token}`)
      setIsDialogOpen(false)
    } catch (err: unknown) {
      const error = err as Error
      const msg = error.message || "Gagal membuat sesi ujian."
      if (msg.includes("login") || msg.includes("Akses ditolak")) {
        toast.error("Sesi login Anda telah berakhir atau belum aktif. Silakan login kembali.")
        router.push("/login")
        return
      }
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyToken = (token: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token)
    }
    setCopiedToken(token)
    toast.success(`Token ${token} disalin ke clipboard!`)
    setTimeout(() => {
      setCopiedToken(null)
    }, 2500)
  }

  const handleRegenerateToken = async (sessionId: Id<"examSessions">, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengacak ulang token untuk sesi "${title}"? Token sebelumnya tidak akan berlaku lagi.`)) {
      return
    }

    setRegeneratingId(sessionId)
    try {
      const result = await regenerateToken({ sessionId })
      toast.success(`Token baru berhasil dibuat: ${result.token}`)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal mengacak ulang token.")
    } finally {
      setRegeneratingId(null)
    }
  }

  const handleToggleStatus = async (
    sessionId: Id<"examSessions">,
    newStatus: "draft" | "active" | "ended",
    title: string
  ) => {
    const actionLabel =
      newStatus === "active" ? "mengaktifkan" : newStatus === "ended" ? "menutup" : "mengembalikan ke draf"

    if (!confirm(`Konfirmasi: Apakah Anda ingin ${actionLabel} sesi "${title}"?`)) {
      return
    }

    try {
      await setSessionStatus({ sessionId, status: newStatus })
      const statusMessage =
        newStatus === "active"
          ? "Sesi ujian kini aktif dan dapat diakses santri menggunakan token."
          : newStatus === "ended"
            ? "Sesi ujian telah ditutup."
            : "Sesi ujian dikembalikan ke status draf."
      toast.success(statusMessage)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal mengubah status sesi ujian.")
    }
  }

  const handleDeleteSession = async (sessionId: Id<"examSessions">, title: string) => {
    if (
      !confirm(
        `Hapus sesi ujian "${title}"? Seluruh data peserta dan lembar jawaban pada sesi ini akan dihapus permanen.`
      )
    ) {
      return
    }

    try {
      await deleteSession({ sessionId })
      toast.success("Sesi ujian beserta data peserta berhasil dihapus.")
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal menghapus sesi ujian.")
    }
  }

  // Filter daftar sesi
  const filteredSessions = React.useMemo(() => {
    if (!sessions) return []

    return sessions.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.bankTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.token.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || s.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [sessions, searchQuery, statusFilter])

  const rotationEstimate = rotationEnabled
    ? estimateTokenRotations(startTime, endTime, rotationMinutes)
    : null

  const rotationEstimateText =
    rotationEstimate === null
      ? "Isi waktu mulai dan batas akhir untuk melihat perkiraan pergantian."
      : rotationEstimate === 0
        ? "Interval lebih panjang dari jendela sesi, jadi token mungkin belum berganti."
        : `Token diperkirakan berganti ${rotationEstimate} kali sebelum sesi berakhir.`

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Jadwal & Sesi Ujian
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Jadwalkan sesi ujian santri, bagikan token akses 6 digit, dan kontrol status pelaksanaan ujian secara langsung.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (open && !session?.user) {
              toast.error("Silakan login terlebih dahulu sebagai pengajar untuk membuat sesi ujian.")
              router.push("/login")
              return
            }
            if (open) {
              openCreateSessionDialog()
              return
            }
            setIsDialogOpen(false)
          }}
        >
          <DialogTrigger
            render={
              <Button className="shrink-0 gap-1.5">
                <PlusIcon className="size-4" />
                Jadwalkan Sesi Ujian
              </Button>
            }
          />
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Jadwal Sesi Ujian Baru</DialogTitle>
              <DialogDescription>
                Tentukan rincian sesi ujian, rujukan bank soal, durasi waktu pengerjaan, dan opsi acak soal.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSession} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="session-title">Judul Sesi Ujian *</Label>
                <Input
                  id="session-title"
                  placeholder="Misal: Ujian Akhir Semester Fiqih Ibadah"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="session-bank">Paket Bank Soal Rujukan *</Label>
                <Select
                  items={questionBanks?.map((bank) => ({
                    value: bank._id,
                    label: `${bank.title} (${bank.subjectCode} - ${bank.gradeLevel})`,
                  }))}
                  value={selectedBankId}
                  onValueChange={(val) => setSelectedBankId(val ?? "")}
                >
                  <SelectTrigger id="session-bank" className="w-full">
                    <SelectValue placeholder="Pilih paket bank soal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {questionBanks?.map((bank) => (
                      <SelectItem key={bank._id} value={bank._id}>
                        {bank.title} ({bank.subjectCode} - {bank.gradeLevel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionBanks && questionBanks.length === 0 && (
                  <p className="text-[11px] text-destructive">
                    Belum ada paket bank soal. Silakan buat bank soal terlebih dahulu.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="session-start" className="text-xs">Waktu Mulai Pelaksanaan *</Label>
                  <Input
                    id="session-start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="session-end" className="text-xs">Batas Akhir Pelaksanaan *</Label>
                  <Input
                    id="session-end"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <Label htmlFor="session-duration">Batas Durasi Santri (Menit) *</Label>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {durationMinutes} Menit ({Math.floor(durationMinutes / 60)} Jam {durationMinutes % 60} Menit)
                    </span>
                  </div>
                  <Input
                    id="session-duration"
                    type="number"
                    min={5}
                    max={300}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="session-passing-score">Batas Nilai Tuntas</Label>
                  <Input
                    id="session-passing-score"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={passingScoreInput}
                    onChange={(e) => setPassingScoreInput(e.target.value)}
                    placeholder="Kosongkan bila tidak ada"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dipakai menandai tuntas atau belum pada rekap. Kosong berarti tanpa penanda.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-3 border">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-rand-q" className="text-xs font-semibold cursor-pointer">
                      Acak Urutan Butir Soal
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Urutan nomor pertanyaan tiap santri diacak otomatis.
                    </p>
                  </div>
                  <Switch
                    id="switch-rand-q"
                    checked={randomizeQuestions}
                    onCheckedChange={(checked) => setRandomizeQuestions(checked)}
                    className="shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-2.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="switch-rand-opt" className="text-xs font-semibold cursor-pointer">
                      Acak Urutan Opsi Pilihan Ganda
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Pilihan A, B, C, D diacak per butir pertanyaan.
                    </p>
                  </div>
                  <Switch
                    id="switch-rand-opt"
                    checked={randomizeOptions}
                    onCheckedChange={(checked) => setRandomizeOptions(checked)}
                    className="shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Penegakan Integritas</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Tentukan tindakan saat santri berpindah tab. Lembar yang terkunci hanya dapat
                    dibuka pengajar dari layar monitoring.
                  </p>
                </div>
                <ToggleGroup
                  multiple={false}
                  value={[enforcementMode]}
                  onValueChange={(value) =>
                    setEnforcementMode((value[0] ?? "record") as EnforcementMode)
                  }
                  variant="outline"
                  className="w-full"
                  aria-label="Mode penegakan integritas"
                >
                  <ToggleGroupItem value="record" className="flex-1 text-xs">
                    Catat saja
                  </ToggleGroupItem>
                  <ToggleGroupItem value="lock" className="flex-1 text-xs">
                    Kunci setelah ambang
                  </ToggleGroupItem>
                </ToggleGroup>
                {enforcementMode === "lock" && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="session-violation-threshold" className="text-xs">
                      Ambang Pelanggaran
                    </Label>
                    <Input
                      id="session-violation-threshold"
                      type="number"
                      min={1}
                      max={20}
                      step={1}
                      value={violationThresholdInput}
                      onChange={(e) => setViolationThresholdInput(e.target.value)}
                      className="w-full sm:w-40"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {violationThresholdHint(violationThresholdInput)}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Masa Berlaku Token</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Token dipakai santri untuk masuk. Rotasi otomatis hanya berjalan selama sesi
                    berstatus aktif.
                  </p>
                </div>
                <ToggleGroup
                  multiple={false}
                  value={[rotationEnabled ? "rotate" : "fixed"]}
                  onValueChange={(value) =>
                    setRotationEnabled((value[0] ?? "fixed") === "rotate")
                  }
                  variant="outline"
                  className="w-full"
                  aria-label="Masa berlaku token"
                >
                  <ToggleGroupItem value="fixed" className="flex-1 text-xs">
                    Tetap sampai diganti
                  </ToggleGroupItem>
                  <ToggleGroupItem value="rotate" className="flex-1 text-xs">
                    Berganti berkala
                  </ToggleGroupItem>
                </ToggleGroup>
                {rotationEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div className="space-y-1.5">
                      <Label htmlFor="session-token-rotation" className="text-xs">
                        Interval Pergantian
                      </Label>
                      <Select
                        items={TOKEN_ROTATION_OPTIONS.map((minutes) => ({
                          value: String(minutes),
                          label: `Tiap ${minutes} menit`,
                        }))}
                        value={String(rotationMinutes)}
                        onValueChange={(value) => setRotationMinutes(Number(value ?? 15))}
                      >
                        <SelectTrigger id="session-token-rotation" className="w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOKEN_ROTATION_OPTIONS.map((minutes) => (
                            <SelectItem key={minutes} value={String(minutes)}>
                              Tiap {minutes} menit
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-[11px] text-muted-foreground sm:pt-6">
                      {rotationEstimateText}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-1.5 w-full sm:w-auto">
                  <PlusIcon className="size-4" />
                  {isSubmitting ? "Menyimpan Sesi..." : "Simpan & Buat Sesi"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!isSessionPending && !session?.user && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Anda belum login sebagai Pengajar</p>
            <p className="text-xs text-muted-foreground">
              Untuk menjadwalkan sesi ujian dan membagikan token santri, silakan login dengan akun pengajar Anda.
            </p>
          </div>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Login Pengajar
          </Link>
        </div>
      )}

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul sesi, bank soal, atau token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            items={{
              all: "Semua Status",
              active: "Sedang Aktif",
              draft: "Draf (Belum Aktif)",
              ended: "Telah Berakhir",
            }}
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Sedang Aktif</SelectItem>
              <SelectItem value="draft">Draf (Belum Aktif)</SelectItem>
              <SelectItem value="ended">Telah Berakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Daftar Kartu Sesi Ujian */}
      {sessions === undefined ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Memuat jadwal sesi ujian...
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card className="border-dashed p-10 text-center flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <CalendarIcon className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base">Belum Ada Sesi Ujian Terjadwal</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Buat jadwal sesi ujian baru untuk menghasilkan token akses dan mengaktifkan ujian santri.
            </p>
          </div>
          <Button onClick={openCreateSessionDialog} size="sm" className="mt-2 gap-1.5">
            <PlusIcon className="size-4" />
            Jadwalkan Sesi Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const isRegenerating = regeneratingId === session._id
            const isCopied = copiedToken === session.token

            return (
              <Card
                key={session._id}
                className={`border flex flex-col justify-between transition-all shadow-xs ${
                  session.status === "active"
                    ? "border-primary/60 ring-1 ring-primary/20 bg-primary/2"
                    : "hover:border-primary/40"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    {session.status === "active" ? (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1">
                        <span className="size-1.5 rounded-full bg-white animate-pulse" />
                        Sedang Aktif
                      </Badge>
                    ) : session.status === "draft" ? (
                      <Badge variant="secondary" className="text-[11px]">
                        Draf (Belum Aktif)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        Telah Berakhir
                      </Badge>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {session.kind !== "reguler" && (
                        <Badge
                          variant="outline"
                          className="text-[11px] border-primary/40 text-primary"
                        >
                          {sessionKindLabel(session.kind)}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs font-mono">
                        {session.gradeLevel}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-base font-heading mt-2 line-clamp-2">
                    {session.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-1">
                    Bank Soal: {session.bankTitle} ({session.subjectCode})
                  </CardDescription>
                  {session.sourceTitle && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      Sesi sumber: {session.sourceTitle}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pb-3 text-xs">
                  {/* Token Box */}
                  <div className="p-2.5 rounded-lg border bg-card flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <KeyRoundIcon className="size-3 text-primary" />
                        Token Akses Santri
                      </div>
                      <div className="text-lg font-mono font-bold tracking-wider text-foreground">
                        {session.token}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => handleCopyToken(session.token)}
                        title="Salin token ke clipboard"
                      >
                        {isCopied ? (
                          <CheckIcon className="size-3.5 text-emerald-600" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        disabled={isRegenerating}
                        onClick={() => handleRegenerateToken(session._id, session.title)}
                        title="Acak ulang token ujian"
                      >
                        <RefreshCwIcon
                          className={`size-3.5 ${isRegenerating ? "animate-spin text-primary" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>

                  {/* Ringkasan Durasi & Butir Soal */}
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
                      <span>{session.durationMinutes} Menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <LayersIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
                      <span>{session.totalQuestions} Soal ({session.totalPoints} Poin)</span>
                    </div>
                  </div>

                  {/* Opsi Keamanan */}
                  {(session.randomizeQuestions || session.randomizeOptions) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <ShuffleIcon className="size-3 text-primary shrink-0" />
                      <span>
                        Acak: {session.randomizeQuestions ? "Soal" : ""}{" "}
                        {session.randomizeQuestions && session.randomizeOptions ? "&" : ""}{" "}
                        {session.randomizeOptions ? "Opsi Jawaban" : ""}
                      </span>
                    </div>
                  )}

                  {session.passingScore !== null && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <TargetIcon className="size-3 text-primary shrink-0" />
                      <span>Batas tuntas {session.passingScore}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldAlertIcon className="size-3 text-primary shrink-0 mt-0.5" />
                    <span>{enforcementSummary(session.enforcementMode, session.violationThreshold)}</span>
                  </div>

                  {session.status === "ended" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => setContinuationSource(session)}
                    >
                      <GitBranchIcon className="size-3.5" />
                      Buat Remedial / Susulan
                    </Button>
                  )}
                </CardContent>

                <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                  {/* Status Toggle Action */}
                  {session.status === "draft" && (
                    <Button
                      size="sm"
                      className="flex-1 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleToggleStatus(session._id, "active", session.title)}
                    >
                      <PlayIcon className="size-3.5" />
                      Aktifkan Sesi
                    </Button>
                  )}

                  {session.status === "active" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 text-xs gap-1.5"
                      onClick={() => handleToggleStatus(session._id, "ended", session.title)}
                    >
                      <StopCircleIcon className="size-3.5" />
                      Tutup Sesi
                    </Button>
                  )}

                  {session.status === "ended" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5"
                      onClick={() => handleToggleStatus(session._id, "active", session.title)}
                    >
                      <RotateCcwIcon className="size-3.5" />
                      Buka Kembali
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDeleteSession(session._id, session.title)}
                    title="Hapus sesi ujian"
                    aria-label={`Hapus sesi ujian ${session.title}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {continuationSource && (
        <SessionContinuationDialog
          key={continuationSource._id}
          source={continuationSource}
          onClose={() => setContinuationSource(null)}
        />
      )}
    </div>
  )
}
