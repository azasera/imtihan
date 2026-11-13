/**
 * Logika murni pengaturan mode penegakan integritas sesi ujian.
 * Sumber kebutuhan: SESI-FR-010, SESI-AC-009.
 */

export type EnforcementMode = "record" | "lock"

export const DEFAULT_VIOLATION_THRESHOLD = 3

export const MIN_VIOLATION_THRESHOLD = 1
export const MAX_VIOLATION_THRESHOLD = 20

export type ViolationThresholdParseResult =
  | { ok: true; value: number }
  | { ok: false; message: string }

/** Ambang hanya dipakai mode kunci, jadi isian wajib bilangan bulat 1 sampai 20. */
export function parseViolationThresholdInput(input: string): ViolationThresholdParseResult {
  const trimmed = input.trim()

  if (trimmed.length === 0) {
    return { ok: false, message: "Ambang pelanggaran wajib diisi saat mode kunci dipilih." }
  }

  const value = Number(trimmed)
  if (!Number.isInteger(value) || value < MIN_VIOLATION_THRESHOLD || value > MAX_VIOLATION_THRESHOLD) {
    return {
      ok: false,
      message: `Ambang pelanggaran harus bilangan bulat antara ${MIN_VIOLATION_THRESHOLD} dan ${MAX_VIOLATION_THRESHOLD}.`,
    }
  }

  return { ok: true, value }
}

/** Ringkasan pendek yang tampil pada kartu sesi dan ringkasan sesi lanjutan. */
export function enforcementSummary(
  mode: EnforcementMode | undefined,
  threshold: number | undefined
): string {
  if (mode !== "lock") {
    return "Catat saja: pelanggaran tab dicatat tanpa mengunci lembar."
  }

  return `Kunci setelah ${threshold ?? DEFAULT_VIOLATION_THRESHOLD} kali pindah tab.`
}

/** Kalimat bantuan di bawah isian ambang, memakai nilai yang sedang diketik bila valid. */
export function violationThresholdHint(input: string): string {
  const parsed = parseViolationThresholdInput(input)

  if (!parsed.ok) return parsed.message

  return `Lembar terkunci setelah pelanggaran melewati ${parsed.value} kali. Jawaban tersimpan tetap utuh saat dibuka.`
}

/** Jumlah jawaban tersimpan pada panel terkunci dan konfirmasi pengajar. */
export function formatSavedAnswerCount(count: number | undefined): string {
  return `${count ?? 0} jawaban tersimpan`
}
