export const TOKEN_ROTATION_OPTIONS = [5, 15, 30] as const

export type TokenRotationMinutes = (typeof TOKEN_ROTATION_OPTIONS)[number]

export function formatTokenRotationInterval(minutes: number | null | undefined): string {
  return typeof minutes === "number" ? `Berganti tiap ${minutes} menit` : "Tetap sampai diganti"
}

export function formatTokenCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0")
  const seconds = (safe % 60).toString().padStart(2, "0")
  return `Berganti dalam ${minutes}:${seconds}`
}

/**
 * Perkiraan jumlah pergantian token sampai batas akhir sesi. Jendela waktu memakai
 * waktu mulai sampai batas akhir yang diisi pengajar, bukan durasi pengerjaan santri.
 */
export function estimateTokenRotations(
  startTime: string,
  endTime: string,
  minutes: number
): number | null {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || minutes <= 0) {
    return null
  }

  return Math.floor((end - start) / 60_000 / minutes)
}
