/**
 * Logika murni label dan isian sesi lanjutan remedial/susulan.
 */

export type SessionKind = "reguler" | "remedial" | "susulan"
export type ContinuationKind = Exclude<SessionKind, "reguler">

export type PassingScoreParseResult =
  | { ok: true; value: number | null }
  | { ok: false; message: string }

const KIND_LABELS: Record<SessionKind, string> = {
  reguler: "Reguler",
  remedial: "Remedial",
  susulan: "Susulan",
}

/** Label jenis sesi; sesi lama tanpa jenis dibaca sebagai reguler. */
export function sessionKindLabel(kind: SessionKind | undefined): string {
  return KIND_LABELS[kind ?? "reguler"]
}

/**
 * Judul bawaan sesi lanjutan menambahkan kata jenisnya. Awalan yang sudah memuat
 * jenis yang sama tidak digandakan saat pengajar membuat lanjutan dari lanjutan.
 */
export function buildContinuationTitle(sourceTitle: string, kind: ContinuationKind): string {
  const clean = sourceTitle.trim()
  if (!clean) return KIND_LABELS[kind]

  const lower = clean.toLowerCase()
  const label = KIND_LABELS[kind].toLowerCase()
  if (lower.endsWith(label) || lower.endsWith(`(${label})`)) return clean

  return `${clean} — ${KIND_LABELS[kind]}`
}

/**
 * Isian batas tuntas boleh kosong (tanpa penanda) atau bilangan bulat 0-100.
 * Teks kosong sengaja dibedakan dari nol karena nol adalah batas tuntas yang sah.
 */
export function parsePassingScoreInput(raw: string): PassingScoreParseResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: true, value: null }

  if (!/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      message: "Batas nilai tuntas harus bilangan bulat antara 0 dan 100, atau dikosongkan.",
    }
  }

  const value = Number(trimmed)
  if (value > 100) {
    return {
      ok: false,
      message: "Batas nilai tuntas harus bilangan bulat antara 0 dan 100, atau dikosongkan.",
    }
  }

  return { ok: true, value }
}

/** Teks ringkas batas tuntas untuk ringkasan penyalinan pengaturan. */
export function formatPassingScore(value: number | null | undefined): string {
  return value === null || value === undefined ? "Tanpa batas tuntas" : String(value)
}
