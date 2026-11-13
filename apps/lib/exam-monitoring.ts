/**
 * Logika murni layar monitoring sesi ujian.
 * Sumber kebutuhan: SESI-FR-004, SESI-FR-005, SESI-AC-005.
 */

export type MonitoringParticipant = {
  _id: string
  studentName: string
  nisn: string
  className?: string
  status: "in_progress" | "submitted"
  startedAt: number
  finishedAt?: number
  tabViolations?: number
  totalScore?: number
  gradingStatus?: "pending_essay" | "graded"
  lockedAt?: number
  savedAnswerCount?: number
  unlockEvents?: { unlockedAt: number; unlockedBy: string }[]
}

export type MonitoringSummary = {
  entered: number
  inProgress: number
  submitted: number
  violationsTotal: number
  flaggedCount: number
}

export type ViolationTier = "none" | "watch" | "alert"

const MINUTE_MS = 60_000

/** Ringkasan hitung peserta pada satu sesi. Santri yang belum masuk tidak terhitung di sini. */
export function summarizeParticipants(
  participants: readonly MonitoringParticipant[]
): MonitoringSummary {
  const submitted = participants.filter((p) => p.status === "submitted").length
  const violationsTotal = participants.reduce((total, p) => total + (p.tabViolations ?? 0), 0)

  return {
    entered: participants.length,
    inProgress: participants.length - submitted,
    submitted,
    violationsTotal,
    flaggedCount: participants.filter((p) => (p.tabViolations ?? 0) > 0).length,
  }
}

/**
 * Sisa waktu pengerjaan peserta. Null untuk peserta yang sudah selesai atau
 * yang waktu masuknya tidak tercatat, supaya antarmuka menampilkan tanda hubung
 * dan bukan angka nol palsu.
 */
export function remainingTimeMs(
  participant: MonitoringParticipant,
  durationMinutes: number,
  nowMs: number
): number | null {
  if (participant.status === "submitted") return null
  if (!Number.isFinite(participant.startedAt) || !Number.isFinite(durationMinutes)) return null

  return Math.max(0, participant.startedAt + durationMinutes * MINUTE_MS - nowMs)
}

/** Peserta masih mengerjakan tetapi batas waktunya sudah terlampaui. */
export function isOvertime(
  participant: MonitoringParticipant,
  durationMinutes: number,
  nowMs: number
): boolean {
  if (participant.status === "submitted") return false

  const remaining = remainingTimeMs(participant, durationMinutes, nowMs)
  return remaining !== null && remaining <= 0
}

/**
 * Peserta yang mengerjakan ditampilkan lebih dulu, paling mepet waktu paling atas.
 * Peserta selesai mengikuti urutan paling baru mengumpulkan.
 */
export function sortForMonitoring(
  participants: readonly MonitoringParticipant[]
): MonitoringParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1

    if (a.status === "in_progress") return a.startedAt - b.startedAt

    return (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt)
  })
}

/** Jenjang badge pelanggaran tab: nol tidak menonjol, 1-2 waspada, 3+ peringatan tinggi. */
export function violationTier(count: number | undefined): ViolationTier {
  const violations = count ?? 0

  if (violations === 0) return "none"
  if (violations <= 2) return "watch"
  return "alert"
}

/** Format mm:ss, atau h:mm:ss bila sisa waktu lebih dari satu jam. Nilai null tampil sebagai tanda hubung. */
export function formatCountdown(ms: number | null): string {
  if (ms === null) return "-"

  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => value.toString().padStart(2, "0")

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`
}

/** Waktu masuk/pengumpulan per menit mengikuti zona waktu perangkat pengajar. */
export function formatTimeOfDay(timestamp: number | undefined): string {
  if (timestamp === undefined || !Number.isFinite(timestamp)) return "-"

  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Jumlah santri yang belum masuk hanya diketahui bila sesi ditautkan ke daftar kelas.
 * Tanpa tautan itu, angkanya tidak boleh dikarang.
 */
export function formatNotEnteredCount(rosterSize: number | null, entered: number): string {
  if (rosterSize === null || rosterSize < entered) return "Belum terhitung"

  return `${rosterSize - entered} santri`
}
