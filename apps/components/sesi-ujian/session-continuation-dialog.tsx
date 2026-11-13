"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { CalendarClockIcon, ClipboardListIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  buildContinuationTitle,
  parsePassingScoreInput,
  sessionKindLabel,
  type ContinuationKind,
} from "@/lib/session-continuation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

export type ContinuationSource = {
  _id: Id<"examSessions">
  title: string
  bankId: Id<"questionBanks">
  durationMinutes: number
  randomizeQuestions: boolean
  randomizeOptions: boolean
  passingScore?: number | null
  enforcementMode?: "record" | "lock"
  violationThreshold?: number
}

function toLocalInputValue(offsetMinutes: number): string {
  const date = new Date(Date.now() + offsetMinutes * 60_000)
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function SessionContinuationDialog({
  source,
  onClose,
}: {
  source: ContinuationSource
  onClose: () => void
}) {
  const createContinuation = useMutation(api.examSession.public.mutations.createContinuationSession)
  const participants = useQuery(api.examSession.public.queries.listSessionParticipants, {
    sessionId: source._id,
  })
  const questionBanks = useQuery(api.bank.public.queries.listQuestionBanks, {})

  const [kind, setKind] = React.useState<ContinuationKind>("remedial")
  const [title, setTitle] = React.useState(() => buildContinuationTitle(source.title, "remedial"))
  const [startTime, setStartTime] = React.useState(() => toLocalInputValue(0))
  const [endTime, setEndTime] = React.useState(() => toLocalInputValue(120))
  const [bankId, setBankId] = React.useState<string>(source.bankId)
  const [durationMinutes, setDurationMinutes] = React.useState<number>(source.durationMinutes)
  const [randomizeQuestions, setRandomizeQuestions] = React.useState(source.randomizeQuestions)
  const [randomizeOptions, setRandomizeOptions] = React.useState(source.randomizeOptions)
  const [passingScoreInput, setPassingScoreInput] = React.useState(
    source.passingScore === null || source.passingScore === undefined
      ? ""
      : String(source.passingScore)
  )
  const [enforcementMode, setEnforcementMode] = React.useState<"record" | "lock">(
    source.enforcementMode ?? "record"
  )
  const [violationThreshold, setViolationThreshold] = React.useState<number>(
    source.violationThreshold ?? 3
  )
  const [capAtPassingScore, setCapAtPassingScore] = React.useState(true)
  const [pickedNisns, setPickedNisns] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Peserta sumber ditampilkan sekali per nomor induk dan diurutkan menurut nama.
  const candidates = React.useMemo(() => {
    if (!participants) return []

    const seen = new Set<string>()
    return participants
      .filter((participant) => {
        const key = participant.nisn.trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName, "id"))
  }, [participants])

  const handleKindChange = (nextKind: ContinuationKind) => {
    setKind(nextKind)
    setTitle((current) =>
      current === buildContinuationTitle(source.title, kind)
        ? buildContinuationTitle(source.title, nextKind)
        : current
    )
  }

  const toggleParticipant = (nisn: string, checked: boolean) => {
    setPickedNisns((current) =>
      checked ? [...current, nisn] : current.filter((value) => value !== nisn)
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      toast.error("Judul sesi lanjutan wajib diisi.")
      return
    }

    if (!bankId) {
      toast.error("Silakan pilih paket bank soal rujukan.")
      return
    }

    if (!startTime || !endTime) {
      toast.error("Waktu mulai dan batas akhir sesi wajib ditentukan.")
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

    if (enforcementMode === "lock" && (violationThreshold < 1 || violationThreshold > 20)) {
      toast.error("Ambang pelanggaran harus bilangan bulat antara 1 dan 20.")
      return
    }

    if (pickedNisns.length === 0) {
      toast.error("Pilih paling sedikit satu santri sebagai peserta sesi lanjutan.")
      return
    }

    // Nilai ambang yang tidak sah tidak pernah dipakai saat mode mencatat.
    const safeViolationThreshold =
      Number.isInteger(violationThreshold) && violationThreshold >= 1 && violationThreshold <= 20
        ? violationThreshold
        : 3

    setIsSubmitting(true)
    try {
      const result = await createContinuation({
        sourceSessionId: source._id,
        kind,
        title: title.trim(),
        startTime,
        endTime,
        participantNisns: pickedNisns,
        bankId: bankId as Id<"questionBanks">,
        durationMinutes,
        randomizeQuestions,
        randomizeOptions,
        passingScore: passingScore.value,
        enforcementMode,
        violationThreshold: safeViolationThreshold,
        capAtPassingScore: kind === "remedial" ? capAtPassingScore : undefined,
      })

      toast.success(
        `Sesi ${sessionKindLabel(result.kind).toLowerCase()} berhasil dibuat dengan Token: ${result.token}`
      )
      onClose()
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || "Gagal membuat sesi lanjutan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const kindLabel = sessionKindLabel(kind)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Buat Sesi {kindLabel}</DialogTitle>
          <DialogDescription>
            Pengaturan disalin dari &quot;{source.title}&quot; dan masih dapat diubah. Sesi sumber
            tidak berubah, dan peserta dipilih manual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="continuation-kind">Jenis Sesi *</Label>
              <Select
                items={{ remedial: "Remedial", susulan: "Susulan" }}
                value={kind}
                onValueChange={(value) => handleKindChange((value ?? "remedial") as ContinuationKind)}
              >
                <SelectTrigger id="continuation-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remedial">Remedial</SelectItem>
                  <SelectItem value="susulan">Susulan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="continuation-title">Judul Sesi *</Label>
              <Input
                id="continuation-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Judul sesi lanjutan..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="continuation-start" className="text-xs">
                Waktu Mulai *
              </Label>
              <Input
                id="continuation-start"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="continuation-end" className="text-xs">
                Batas Akhir *
              </Label>
              <Input
                id="continuation-end"
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <ClipboardListIcon className="size-3.5 text-primary" />
              Pengaturan yang Tersalin
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="continuation-bank" className="text-xs">
                Paket Bank Soal *
              </Label>
              <Select
                items={questionBanks?.map((bank) => ({
                  value: bank._id,
                  label: `${bank.title} (${bank.subjectCode} - ${bank.gradeLevel})`,
                }))}
                value={bankId}
                onValueChange={(value) => setBankId(value ?? "")}
              >
                <SelectTrigger id="continuation-bank" className="w-full text-xs">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="continuation-duration" className="text-xs">
                  Durasi (Menit) *
                </Label>
                <Input
                  id="continuation-duration"
                  type="number"
                  min={5}
                  max={300}
                  step={5}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(Number(event.target.value))}
                  required
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="continuation-passing" className="text-xs">
                  Batas Nilai Tuntas
                </Label>
                <Input
                  id="continuation-passing"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={passingScoreInput}
                  onChange={(event) => setPassingScoreInput(event.target.value)}
                  placeholder="Kosongkan bila tidak ada"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 border-t pt-2.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="continuation-rand-q" className="text-xs font-medium cursor-pointer">
                  Acak urutan butir soal
                </Label>
                <Switch
                  id="continuation-rand-q"
                  checked={randomizeQuestions}
                  onCheckedChange={(checked) => setRandomizeQuestions(checked)}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="continuation-rand-opt" className="text-xs font-medium cursor-pointer">
                  Acak urutan opsi jawaban
                </Label>
                <Switch
                  id="continuation-rand-opt"
                  checked={randomizeOptions}
                  onCheckedChange={(checked) => setRandomizeOptions(checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="continuation-enforcement" className="text-xs">
                  Penegakan Integritas
                </Label>
                <Select
                  items={{ record: "Catat saja", lock: "Kunci setelah ambang" }}
                  value={enforcementMode}
                  onValueChange={(value) =>
                    setEnforcementMode((value ?? "record") as "record" | "lock")
                  }
                >
                  <SelectTrigger id="continuation-enforcement" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="record">Catat saja</SelectItem>
                    <SelectItem value="lock">Kunci setelah ambang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {enforcementMode === "lock" && (
                <div className="space-y-1.5">
                  <Label htmlFor="continuation-threshold" className="text-xs">
                    Ambang Pelanggaran
                  </Label>
                  <Input
                    id="continuation-threshold"
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    value={violationThreshold}
                    onChange={(event) => setViolationThreshold(Number(event.target.value))}
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            {kind === "remedial" && passingScoreInput.trim() !== "" && (
              <div className="flex items-center justify-between gap-2 border-t pt-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="continuation-cap" className="text-xs font-medium cursor-pointer">
                    Nilai maksimal dibatasi sampai batas tuntas
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Nilai remedial yang melampaui batas tuntas akan dipotong.
                  </p>
                </div>
                <Switch
                  id="continuation-cap"
                  checked={capAtPassingScore}
                  onCheckedChange={(checked) => setCapAtPassingScore(checked)}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <UsersIcon className="size-3.5 text-primary" />
                Peserta Sesi Lanjutan
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {pickedNisns.length} dipilih
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Semua kotak centang mulai kosong. Hanya santri yang dicentang yang dapat masuk sesi ini.
            </p>

            {participants === undefined ? (
              <p className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                Memuat peserta sesi sumber...
              </p>
            ) : candidates.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                Belum ada santri yang masuk ke sesi sumber, sehingga belum ada peserta yang dapat dipilih.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y rounded-md border bg-card">
                {candidates.map((participant) => {
                  const checkboxId = `continuation-participant-${participant._id}`
                  return (
                    <div key={participant._id} className="flex items-start gap-2.5 p-2.5">
                      <Checkbox
                        id={checkboxId}
                        checked={pickedNisns.includes(participant.nisn)}
                        onCheckedChange={(checked) =>
                          toggleParticipant(participant.nisn, checked === true)
                        }
                        className="mt-0.5 size-4 shrink-0 cursor-pointer"
                      />
                      <Label
                        htmlFor={checkboxId}
                        className="flex-1 cursor-pointer space-y-0.5 text-xs font-normal"
                      >
                        <span className="block font-semibold">{participant.studentName}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {participant.nisn}
                          {participant.className ? ` · ${participant.className}` : ""}
                        </span>
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || pickedNisns.length === 0}
              className="gap-1.5"
            >
              <CalendarClockIcon className="size-4" />
              {isSubmitting ? "Membuat Sesi..." : `Buat Sesi ${kindLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
