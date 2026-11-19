/**
 * Utilitas parsing file Excel / CSV untuk import nilai rapor.
 *
 * Mendukung format:
 *   A. Template 3-in-1 (kolom: No, NISN, Nama Santri, PH, STS, SAS) - 1 file untuk 3 nilai sekaligus
 *   B. Template legacy 1 kolom nilai (kolom: No, NISN, Nama, Nilai)
 *   C. File bebas guru (deteksi otomatis kolom NISN, Nama, dan nilai)
 *
 * Pencocokan santri dilakukan by NISN terlebih dahulu; jika tidak ada atau
 * tidak cocok, fallback ke pencocokan nama (lowercase + strip spasi ganda).
 */

import * as XLSX from "xlsx"

/** Satu baris hasil parse dari file Excel/CSV sebelum dicocokkan ke santri */
export interface ParsedExcelRow {
  nisn: string
  name: string
  /** Nilai mentah tunggal jika berkas berformat 1 kolom nilai (legacy/fallback) */
  rawValue?: number
  /** Nilai Penilaian Harian (PH) */
  ph?: number | null
  /** Nilai Sumatif Tengah Semester (STS) */
  sts?: number | null
  /** Nilai Sumatif Akhir Semester (SAS) */
  sas?: number | null
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
  /** Nilai PH (null jika kosong/tidak diisi di Excel) */
  ph: number | null
  /** Nilai STS (null jika kosong/tidak diisi di Excel) */
  sts: number | null
  /** Nilai SAS (null jika kosong/tidak diisi di Excel) */
  sas: number | null
  /** Nilai tunggal untuk backward compatibility */
  value: number | null
  status: MatchStatus
  /** Nama yang ditemukan di file Excel (untuk debugging/preview) */
  excelName?: string
}

// ---------------------------------------------------------------------------
// Helpers normalisasi
// ---------------------------------------------------------------------------

export function normalizeNisn(raw: unknown): string {
  if (raw == null) return ""
  return String(raw).trim().replace(/[^0-9]/g, "")
}

export function normalizeName(raw: unknown): string {
  if (raw == null) return ""
  return String(raw)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function tryParseScore(raw: unknown): number {
  if (raw == null) return NaN
  const str = String(raw).trim()
  if (str === "" || str === "-" || str === "—") return NaN
  const n = typeof raw === "number" ? raw : parseFloat(str.replace(",", "."))
  if (isNaN(n) || n < 0 || n > 100) return NaN
  return Math.round(n * 100) / 100
}

// ---------------------------------------------------------------------------
// Deteksi kolom otomatis
// ---------------------------------------------------------------------------

export interface DetectedColumns {
  nisnCol: number
  nameCol: number
  phCol: number
  stsCol: number
  sasCol: number
  valueCol: number
  isMultiColumn: boolean
}

/**
 * Heuristik untuk mendeteksi indeks kolom NISN, Nama, dan Nilai (PH, STS, SAS)
 * dari header row.
 */
export function detectColumns(rows: unknown[][]): DetectedColumns {
  const fallback: DetectedColumns = {
    nisnCol: 1,
    nameCol: 2,
    phCol: 3,
    stsCol: 4,
    sasCol: 5,
    valueCol: 3,
    isMultiColumn: true,
  }

  if (rows.length === 0) return fallback

  const headerRow = rows[0].map((c) => String(c ?? "").trim().toLowerCase())

  // Coba cocokkan header NISN
  const nisnIdx = headerRow.findIndex(
    (h) => h === "nisn" || h.includes("nisn") || h.includes("nis") || h.includes("nomor induk")
  )

  // Coba cocokkan header Nama
  const nameIdx = headerRow.findIndex(
    (h) => h.includes("nama") || h.includes("siswa") || h.includes("santri") || h.includes("murid")
  )

  // Coba cocokkan header 3 Nilai (PH, STS, SAS)
  const phIdx = headerRow.findIndex(
    (h) =>
      h === "ph" ||
      h.startsWith("ph ") ||
      h.includes("ph /") ||
      h.includes("ph/") ||
      h.includes("harian") ||
      h.includes("tugas")
  )

  const stsIdx = headerRow.findIndex(
    (h) =>
      h === "sts" ||
      h.startsWith("sts ") ||
      h.includes("sts /") ||
      h.includes("sts/") ||
      h.includes("pts") ||
      h.includes("tengah semester") ||
      h.includes("mid")
  )

  const sasIdx = headerRow.findIndex(
    (h) =>
      h === "sas" ||
      h.startsWith("sas ") ||
      h.includes("sas /") ||
      h.includes("sas/") ||
      h.includes("pas") ||
      h.includes("akhir semester") ||
      h.includes("uas") ||
      h.includes("final")
  )

  const isMultiColumn = phIdx !== -1 || stsIdx !== -1 || sasIdx !== -1

  // Coba cocokkan header single nilai (fallback format lama)
  const valueIdx = headerRow.findIndex(
    (h) =>
      h.includes("nilai") ||
      h.includes("score") ||
      h.includes("skor") ||
      h.includes("angka")
  )

  if (nisnIdx !== -1 || nameIdx !== -1) {
    return {
      nisnCol: nisnIdx !== -1 ? nisnIdx : 1,
      nameCol: nameIdx !== -1 ? nameIdx : 2,
      phCol: phIdx !== -1 ? phIdx : (isMultiColumn ? 3 : -1),
      stsCol: stsIdx !== -1 ? stsIdx : (isMultiColumn ? 4 : -1),
      sasCol: sasIdx !== -1 ? sasIdx : (isMultiColumn ? 5 : -1),
      valueCol: valueIdx !== -1 ? valueIdx : 3,
      isMultiColumn: isMultiColumn || (!isMultiColumn && valueIdx === -1 && (rows[0].length >= 6)),
    }
  }

  // Fallback: scan data row pertama
  const dataStartIdx = 1
  const dataRow = rows[dataStartIdx] ?? []

  if (dataRow.length >= 6) {
    return {
      nisnCol: 1,
      nameCol: 2,
      phCol: 3,
      stsCol: 4,
      sasCol: 5,
      valueCol: 3,
      isMultiColumn: true,
    }
  }

  return fallback
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

  const detected = detectColumns(rawRows)

  // Tentukan baris data (lewati header jika baris pertama berisi teks pengenal)
  const firstRowIsHeader = rawRows[0].some((c) => {
    const s = String(c ?? "").toLowerCase()
    return (
      s.includes("nama") ||
      s.includes("nisn") ||
      s.includes("nilai") ||
      s.includes("no") ||
      s === "ph" ||
      s === "sts" ||
      s === "sas"
    )
  })
  const dataRows = firstRowIsHeader ? rawRows.slice(1) : rawRows

  const result: ParsedExcelRow[] = []

  for (const row of dataRows) {
    const nisn = normalizeNisn(row[detected.nisnCol])
    const name = String(row[detected.nameCol] ?? "").trim()

    // Lewati baris kosong
    if (!nisn && !name) continue

    if (detected.isMultiColumn) {
      const rawPh = detected.phCol !== -1 ? tryParseScore(row[detected.phCol]) : NaN
      const rawSts = detected.stsCol !== -1 ? tryParseScore(row[detected.stsCol]) : NaN
      const rawSas = detected.sasCol !== -1 ? tryParseScore(row[detected.sasCol]) : NaN

      const ph = isNaN(rawPh) ? null : rawPh
      const sts = isNaN(rawSts) ? null : rawSts
      const sas = isNaN(rawSas) ? null : rawSas

      const firstValid = ph ?? sts ?? sas
      const rawValue = firstValid !== null ? firstValid : NaN

      result.push({ nisn, name, ph, sts, sas, rawValue })
    } else {
      const rawValue = tryParseScore(row[detected.valueCol])
      result.push({ nisn, name, rawValue, ph: null, sts: null, sas: null })
    }
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
  students: StudentRecord[],
  targetColumn?: "PH" | "STS" | "SAS"
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
    // 2. Fallback cocokkan by nama (exact setelah normalisasi)
    const match = nisnMatch ?? byName.get(studentNameNorm)
    const isNisnMatched = Boolean(nisnMatch)

    if (!match) {
      return {
        santriId: student.santriId,
        nisn: student.nisn,
        studentName: student.name,
        institution: student.institution,
        ph: null,
        sts: null,
        sas: null,
        value: null,
        status: "unmatched",
      } satisfies ImportMatchResult
    }

    const hasPh = match.ph !== null && match.ph !== undefined && !isNaN(match.ph)
    const hasSts = match.sts !== null && match.sts !== undefined && !isNaN(match.sts)
    const hasSas = match.sas !== null && match.sas !== undefined && !isNaN(match.sas)
    const hasRaw = match.rawValue !== undefined && !isNaN(match.rawValue)

    const hasAnyScore = hasPh || hasSts || hasSas || hasRaw

    if (!hasAnyScore) {
      return {
        santriId: student.santriId,
        nisn: student.nisn,
        studentName: student.name,
        institution: student.institution,
        ph: null,
        sts: null,
        sas: null,
        value: null,
        status: "no_value",
        excelName: match.name || undefined,
      } satisfies ImportMatchResult
    }

    // Hitung nilai ph, sts, sas
    let phVal: number | null = hasPh ? match.ph! : null
    let stsVal: number | null = hasSts ? match.sts! : null
    let sasVal: number | null = hasSas ? match.sas! : null

    // Jika single-column format lama dan targetColumn diberikan
    if (!hasPh && !hasSts && !hasSas && hasRaw) {
      if (targetColumn === "PH") phVal = match.rawValue!
      else if (targetColumn === "STS") stsVal = match.rawValue!
      else if (targetColumn === "SAS") sasVal = match.rawValue!
    }

    const primaryValue = hasRaw ? match.rawValue! : (phVal ?? stsVal ?? sasVal ?? null)

    return {
      santriId: student.santriId,
      nisn: student.nisn,
      studentName: student.name,
      institution: student.institution,
      ph: phVal,
      sts: stsVal,
      sas: sasVal,
      value: primaryValue,
      status: isNisnMatched ? "matched_nisn" : "matched_name",
      excelName: match.name || undefined,
    } satisfies ImportMatchResult
  })
}

/** Hanya baris yang berhasil dicocokkan dan memiliki minimal 1 nilai valid */
export function filterMatchedResults(results: ImportMatchResult[]): ImportMatchResult[] {
  return results.filter(
    (r) =>
      (r.status === "matched_nisn" || r.status === "matched_name") &&
      (r.ph !== null || r.sts !== null || r.sas !== null || r.value !== null)
  )
}
