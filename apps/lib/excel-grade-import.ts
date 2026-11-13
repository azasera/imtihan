/**
 * Utilitas parsing file Excel / CSV untuk import nilai rapor.
 *
 * Mendukung dua format input:
 *   A. Template bawaan aplikasi (kolom: No, NISN, Nama, Nilai)
 *   B. Excel bebas guru (sistem mendeteksi kolom NISN, Nama, dan Nilai otomatis)
 *
 * Pencocokan santri dilakukan by NISN terlebih dahulu; jika tidak ada atau
 * tidak cocok, fallback ke pencocokan nama (lowercase + strip spasi ganda).
 */

import * as XLSX from "xlsx"

/** Satu baris hasil parse dari file Excel/CSV sebelum dicocokkan ke santri */
export interface ParsedExcelRow {
  nisn: string
  name: string
  /** Nilai mentah yang ditemukan; NaN jika kolom nilai tidak terbaca */
  rawValue: number
}

/** Santri dari database (minimal yang diperlukan untuk matching) */
export interface StudentRecord {
  santriId: string
  nisn: string
  name: string
  institution: "SMPITA" | "SMAITA" | "MTA"
}

/** Hasil pencocokan satu santri dengan baris Excel */
export type MatchStatus = "matched_nisn" | "matched_name" | "no_value" | "unmatched"

export interface ImportMatchResult {
  santriId: string
  nisn: string
  studentName: string
  institution: "SMPITA" | "SMAITA" | "MTA"
  value: number | null
  status: MatchStatus
  /** Nama yang ditemukan di file Excel (untuk debugging/preview) */
  excelName?: string
}

// ---------------------------------------------------------------------------
// Helpers normalisasi
// ---------------------------------------------------------------------------

function normalizeNisn(raw: unknown): string {
  if (raw == null) return ""
  return String(raw).trim().replace(/[^0-9]/g, "")
}

function normalizeName(raw: unknown): string {
  if (raw == null) return ""
  return String(raw)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function tryParseScore(raw: unknown): number {
  if (raw == null) return NaN
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", "."))
  return isNaN(n) ? NaN : n
}

// ---------------------------------------------------------------------------
// Deteksi kolom otomatis
// ---------------------------------------------------------------------------

/**
 * Heuristik untuk mendeteksi indeks kolom NISN, Nama, dan Nilai dari
 * header row (baris pertama sheet yang berisi teks).
 *
 * Jika header tidak ditemukan, coba tebak dari pola data baris pertama data.
 */
function detectColumns(rows: unknown[][]): {
  nisnCol: number
  nameCol: number
  valueCol: number
} {
  if (rows.length === 0) return { nisnCol: 1, nameCol: 2, valueCol: 3 }

  const headerRow = rows[0].map((c) => String(c ?? "").toLowerCase())

  // Coba cocokkan header
  const nisnIdx = headerRow.findIndex(
    (h) => h.includes("nisn") || h.includes("nis") || h.includes("nomor induk")
  )
  const nameIdx = headerRow.findIndex(
    (h) => h.includes("nama") || h.includes("siswa") || h.includes("santri") || h.includes("murid")
  )
  const valueIdx = headerRow.findIndex(
    (h) =>
      h.includes("nilai") ||
      h.includes("score") ||
      h.includes("skor") ||
      h.includes("ph") ||
      h.includes("pts") ||
      h.includes("pas") ||
      h.includes("sts") ||
      h.includes("sas")
  )

  // Jika header terdeteksi dengan baik, gunakan itu
  if (nisnIdx !== -1 && nameIdx !== -1 && valueIdx !== -1) {
    return { nisnCol: nisnIdx, nameCol: nameIdx, valueCol: valueIdx }
  }

  // Fallback: scan baris data pertama (baris index 1 jika ada header, atau 0 jika tidak)
  const dataStartIdx = headerRow.some((h) => h.includes("nama") || h.includes("nisn")) ? 1 : 0
  const dataRow = rows[dataStartIdx] ?? []

  let guessedNisn = -1
  let guessedName = -1
  let guessedValue = -1

  for (let i = 0; i < dataRow.length; i++) {
    const cell = dataRow[i]
    const str = String(cell ?? "").trim()
    if (/^\d{10,}$/.test(str) && guessedNisn === -1) {
      guessedNisn = i
    } else if (/^\d{1,3}(\.\d+)?$/.test(str) && guessedValue === -1) {
      guessedValue = i
    } else if (str.length > 3 && /[a-zA-Z]/.test(str) && guessedName === -1) {
      guessedName = i
    }
  }

  return {
    nisnCol: nisnIdx !== -1 ? nisnIdx : guessedNisn !== -1 ? guessedNisn : 1,
    nameCol: nameIdx !== -1 ? nameIdx : guessedName !== -1 ? guessedName : 2,
    valueCol: valueIdx !== -1 ? valueIdx : guessedValue !== -1 ? guessedValue : 3,
  }
}

// ---------------------------------------------------------------------------
// Parse file Excel / CSV → array ParsedExcelRow
// ---------------------------------------------------------------------------

export async function parseExcelFile(file: File): Promise<ParsedExcelRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })

  // Ambil sheet pertama
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  // Konversi ke array of arrays
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  })

  if (rawRows.length < 2) return []

  const { nisnCol, nameCol, valueCol } = detectColumns(rawRows)

  // Tentukan baris data (lewati header jika baris pertama berisi teks)
  const firstRowIsHeader = rawRows[0].some((c) => {
    const s = String(c ?? "").toLowerCase()
    return s.includes("nama") || s.includes("nisn") || s.includes("nilai") || s.includes("no")
  })
  const dataRows = firstRowIsHeader ? rawRows.slice(1) : rawRows

  const result: ParsedExcelRow[] = []

  for (const row of dataRows) {
    const nisn = normalizeNisn(row[nisnCol])
    const name = String(row[nameCol] ?? "").trim()
    const rawValue = tryParseScore(row[valueCol])

    // Lewati baris kosong
    if (!nisn && !name) continue

    result.push({ nisn, name, rawValue })
  }

  return result
}

// ---------------------------------------------------------------------------
// Pencocokan hasil parse → santri database
// ---------------------------------------------------------------------------

/**
 * Cocokkan baris Excel ke daftar santri.
 * Mengembalikan satu entri per santri (bukan per baris Excel).
 */
export function matchExcelToStudents(
  parsedRows: ParsedExcelRow[],
  students: StudentRecord[]
): ImportMatchResult[] {
  // Bangun map lookup
  const byNisn = new Map<string, ParsedExcelRow>()
  const byName = new Map<string, ParsedExcelRow>()

  for (const row of parsedRows) {
    if (row.nisn) byNisn.set(row.nisn, row)
    if (row.name) {
      const normalKey = normalizeName(row.name)
      if (normalKey) byName.set(normalKey, row)
    }
  }

  return students.map((student) => {
    const studentNisn = normalizeNisn(student.nisn)
    const studentNameNorm = normalizeName(student.name)

    // 1. Cocokkan by NISN
    const nisnMatch = studentNisn ? byNisn.get(studentNisn) : undefined
    if (nisnMatch) {
      return {
        santriId: student.santriId,
        nisn: student.nisn,
        studentName: student.name,
        institution: student.institution,
        value: isNaN(nisnMatch.rawValue) ? null : nisnMatch.rawValue,
        status: isNaN(nisnMatch.rawValue) ? "no_value" : "matched_nisn",
        excelName: nisnMatch.name || undefined,
      } satisfies ImportMatchResult
    }

    // 2. Fallback cocokkan by nama (exact setelah normalisasi)
    const nameMatch = byName.get(studentNameNorm)
    if (nameMatch) {
      return {
        santriId: student.santriId,
        nisn: student.nisn,
        studentName: student.name,
        institution: student.institution,
        value: isNaN(nameMatch.rawValue) ? null : nameMatch.rawValue,
        status: isNaN(nameMatch.rawValue) ? "no_value" : "matched_name",
        excelName: nameMatch.name || undefined,
      } satisfies ImportMatchResult
    }

    // 3. Tidak cocok — tampil di preview sebagai peringatan
    return {
      santriId: student.santriId,
      nisn: student.nisn,
      studentName: student.name,
      institution: student.institution,
      value: null,
      status: "unmatched",
    } satisfies ImportMatchResult
  })
}

/** Hanya baris yang berhasil dicocokkan dan memiliki nilai */
export function filterMatchedResults(results: ImportMatchResult[]): ImportMatchResult[] {
  return results.filter(
    (r) => (r.status === "matched_nisn" || r.status === "matched_name") && r.value !== null
  )
}
