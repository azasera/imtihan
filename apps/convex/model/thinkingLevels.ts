/**
 * Kosakata baku tingkat berpikir butir soal.
 * Sengaja tanpa impor agar dipakai bersama oleh fungsi Convex, bundel klien, dan tes node.
 */

export type ThinkingLevel = "mengingat" | "memahami" | "mengaplikasikan" | "menganalisis"

/** Urutan baku pada dropdown: dari mengingat sampai menganalisis. */
export const THINKING_LEVELS: readonly ThinkingLevel[] = [
  "mengingat",
  "memahami",
  "mengaplikasikan",
  "menganalisis",
]

export const THINKING_LEVEL_LABELS: Record<ThinkingLevel, string> = {
  mengingat: "Mengingat",
  memahami: "Memahami",
  mengaplikasikan: "Mengaplikasikan",
  menganalisis: "Menganalisis",
}

export const UNTAGGED_THINKING_LEVEL_LABEL = "Belum ditandai"

/** Batas panjang label capaian agar tetap berupa rujukan pendek, bukan paragraf. */
export const ACHIEVEMENT_REF_MAX_LENGTH = 80

export function isThinkingLevel(value: string): value is ThinkingLevel {
  return (THINKING_LEVELS as readonly string[]).includes(value)
}

/** Menyeragamkan ketikan pengajar; nilai di luar empat pilihan menghasilkan null. */
export function normalizeThinkingLevel(value: string): ThinkingLevel | null {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ")
  return isThinkingLevel(key) ? key : null
}

export function thinkingLevelLabel(level: string | null | undefined): string {
  return level && isThinkingLevel(level) ? THINKING_LEVEL_LABELS[level] : UNTAGGED_THINKING_LEVEL_LABEL
}
