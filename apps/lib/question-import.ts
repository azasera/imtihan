/**
 * Penafsir tempelan teks bernomor menjadi calon butir soal.
 * Seluruh penafsiran berjalan di perangkat pengajar sebelum ada panggilan ke server,
 * sehingga pengajar dapat memperbaiki naskahnya tanpa menyimpan apa pun.
 */

export type ImportQuestionType = "multiple_choice" | "pg_kompleks" | "true_false" | "essay"

export type ImportThinkingLevel = "mengingat" | "memahami" | "mengaplikasikan" | "menganalisis"

/** Batas panjang label capaian, sejalan dengan validasi server. */
export const ACHIEVEMENT_REF_MAX_LENGTH = 80

export interface ParsedImportOption {
  id: string
  label: string
  text: string
  isCorrect: boolean
}

export interface ParsedImportItem {
  /** Posisi hasil tafsiran pada pratinjau, mulai dari 1. */
  number: number
  /** Baris teks sumber tempat butir ini dimulai, mulai dari 1. */
  sourceLine: number
  type: ImportQuestionType
  stimulusText: string
  questionText: string
  points: number
  options: ParsedImportOption[]
  /** Kunci soal benar/salah; null bila belum ditulis. */
  trueFalseKey: "Benar" | "Salah" | null
  rubric: string
  /** Pembahasan untuk pengajar; tidak pernah dikirim ke perangkat santri. */
  explanation: string
  /** null berarti butir belum ditandai. */
  thinkingLevel: ImportThinkingLevel | null
  achievementRef: string
  /** Alasan butir ini belum layak simpan. Kosong berarti siap. */
  problems: string[]
}

export interface ImportParseResult {
  items: ParsedImportItem[]
  readyCount: number
  problemCount: number
  lineCount: number
  /** Bentuk naskah yang dikenali: teks bernomor atau baris hasil salinan lembar kerja. */
  format: "numbered" | "spreadsheet"
  /** Baris judul kolom dikenali pada bentuk lembar kerja. */
  headerDetected: boolean
  /** Nama kolom pada baris judul yang tidak dikenal dan dilewati. */
  ignoredColumns: string[]
}

/** Badan butir siap kirim ke server, memakai kolom yang sama dengan jalur tulis satu per satu. */
export interface ImportPayloadItem {
  type: ImportQuestionType
  stimulusText?: string
  questionText: string
  points: number
  options?: ParsedImportOption[]
  rubric?: string
  explanation?: string
  thinkingLevel?: ImportThinkingLevel
  achievementRef?: string
}

const THINKING_LEVEL_KEYS: readonly ImportThinkingLevel[] = [
  "mengingat",
  "memahami",
  "mengaplikasikan",
  "menganalisis",
]

export const UNTAGGED_THINKING_LEVEL_LABEL = "Belum ditandai"

/** Menyeragamkan ketikan; nilai di luar empat pilihan menghasilkan null. */
export function normalizeImportThinkingLevel(value: string): ImportThinkingLevel | null {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ")
  return (THINKING_LEVEL_KEYS as readonly string[]).includes(key)
    ? (key as ImportThinkingLevel)
    : null
}

export function importThinkingLevelLabel(level: ImportThinkingLevel | null): string {
  if (!level) return UNTAGGED_THINKING_LEVEL_LABEL
  return level.charAt(0).toUpperCase() + level.slice(1)
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"]

const ITEM_START_RE = /^(\d{1,3})[.)]\s*(.*)$/
const OPTION_RE = /^([A-Za-z])[.)]\s+(.*)$/
const STIMULUS_RE = /^wacana\s*[:=-]\s*(.*)$/i
const POINTS_RE = /^poin\s*[:=]\s*(.*)$/i
const RUBRIC_RE = /^rubrik\s*[:=]\s*(.*)$/i
const EXPLANATION_RE = /^pembahasan\s*[:=]\s*(.*)$/i
const THINKING_LEVEL_RE = /^berpikir\s*[:=]\s*(.*)$/i
const ACHIEVEMENT_RE = /^capaian\s*[:=]\s*(.*)$/i
const TRUE_FALSE_KEY_RE = /^([BbSs])[.)]?$/
const EMPTY_OPTION_RE = /^([A-Za-z])[.)]$/
const TYPE_MARKER_RE = /[([]\s*(pg\s*kompleks|benar\s*\/\s*salah|essay)\s*[)\]]/i

export const FORMAT_HINTS: string[] = [
  "Satu baris kosong memisahkan satu butir dari butir berikutnya.",
  "Baris yang diawali angka dan titik, misalnya \"1.\", memulai butir baru. Angkanya hanya penanda pemisah; nomor urut mengikuti urutan paket.",
  "Naskah dari editor Markdown juga dikenali: nomor yang ditulis dengan garis miring dan garis miring di akhir baris diabaikan.",
  "Opsi jawaban ditulis \"A. teks opsi\" sampai \"E.\". Kunci jawaban ditandai tanda bintang di akhir teksnya: \"B. Tiga*\".",
  "Tanpa penanda tipe, butir dianggap Pilihan Ganda. Penanda tipe ditulis setelah nomor: \"(pg kompleks)\", \"(benar/salah)\", \"(essay)\".",
  "Pada soal benar/salah, kunci ditulis pada baris sendiri berisi B atau S.",
  "Pada soal essay, baris \"rubrik: ...\" setelah teks soal menjadi pedoman penilaian.",
  "Baris \"poin: 3\" menentukan bobot butir itu. Bila tidak ditulis, bobot memakai nilai bawaan di atas kolom tempel.",
  "Baris \"WACANA:\" mengawali wacana; baris turunannya ikut menjadi wacana sampai baris kosong atau butir bernomor berikutnya, lalu berlaku untuk butir-butir sesudahnya.",
  "Baris \"pembahasan: ...\" menyimpan alasan jawaban untuk pengajar; isinya tidak pernah tampil pada perangkat santri.",
  "Baris \"berpikir: memahami\" menandai tingkat berpikir. Pilihannya: mengingat, memahami, mengaplikasikan, menganalisis. Nilai lain membuat butir perlu perbaikan.",
  "Baris \"capaian: ...\" menyimpan label pendek rujukan capaian materi (maksimal 80 karakter).",
  "Baris biasa setelah teks soal dianggap lanjutan teks soal, dan baris biasa setelah sebuah opsi dianggap lanjutan opsi terakhir.",
]

export const IMPORT_EXAMPLE = `1. Niat dalam wudhu dilakukan pada saat?
A. Sebelum basuhan pertama*
B. Setelah basuhan ketiga
C. Saat mengusap kaki
D. Saat air mengenai wajah
pembahasan: Niat adalah rukun pertama wudhu, dilakukan bersamaan dengan basuhan pertama.
berpikir: memahami
capaian: Thaharah — rukun wudhu

2. (benar/salah) Wudhu batal apabila keluar sesuatu dari dua jalan.
B
poin: 5

3. (essay) Jelaskan tiga hal yang membatalkan wudhu beserta dalilnya.
rubrik: Nilai penuh bila santri menyebut tiga pembatal dan satu dalil yang tepat.
poin: 10
berpikir: menganalisis
capaian: Thaharah — pembatal wudhu

WACANA: Seorang santri membaca Quran di atas kursi karena kakinya cedera.
4. Hukum membaca Quran di atas kursi bagi santri tersebut adalah?
A. Boleh karena ada uzur*
B. Makruh jika mampu berdiri
C. Haram mutlak
D. Wajib

5. (pg kompleks) Manakah yang termasuk sunnah wudhu?
A. Membaca bismillah*
B. Mengucap dua kalimat syahadat
C. Membasuh anggota tiga kali*
D. Berbicara saat berwudhu`;

/** Urutan kolom bawaan untuk tempelan baris lembar kerja tanpa baris judul. */
export const IMPORT_SPREADSHEET_COLUMNS = [
  "soal",
  "tipe",
  "a",
  "b",
  "c",
  "d",
  "e",
  "kunci",
  "poin",
  "pembahasan",
  "berpikir",
  "capaian",
  "wacana",
] as const

export type ImportSpreadsheetColumn = (typeof IMPORT_SPREADSHEET_COLUMNS)[number]

/** Satu contoh butir lengkap yang menemani baris judul pada template unduhan. */
export const IMPORT_TEMPLATE_EXAMPLE: Record<ImportSpreadsheetColumn, string> = {
  soal: "Niat dalam wudhu dilakukan pada saat?",
  tipe: "pg",
  a: "Sebelum basuhan pertama",
  b: "Setelah basuhan ketiga",
  c: "Saat mengusap kaki",
  d: "Saat air mengenai wajah",
  e: "",
  kunci: "A",
  poin: "5",
  pembahasan: "Niat adalah rukun pertama wudhu, dilakukan bersamaan dengan basuhan pertama.",
  berpikir: "memahami",
  capaian: "Thaharah — rukun wudhu",
  wacana: "",
}

/** Template kolom berpisahkan tab: baris judul plus satu contoh butir yang bisa ditempel balik. */
export function buildImportTemplateText(): string {
  const header = IMPORT_SPREADSHEET_COLUMNS.join("\t")
  const example = IMPORT_SPREADSHEET_COLUMNS.map((column) => IMPORT_TEMPLATE_EXAMPLE[column]).join("\t")
  return `${header}\n${example}`
}

export const SPREADSHEET_FORMAT_HINTS: string[] = [
  "Salin baris dari Excel atau Google Sheets; kolom dipisahkan tab dan satu baris menjadi satu butir.",
  "Kolom yang dikenali: soal, tipe, a, b, c, d, e, kunci, poin, pembahasan, berpikir, capaian, wacana. Tanpa baris judul, urutan itu yang dipakai.",
  "Baris judul boleh ada atau tidak; nama kolom dikenali tanpa peduli besar-kecil huruf. Kolom lain diabaikan dan disebut pada ringkasan pratinjau.",
  "Isi kunci dengan satu huruf untuk pilihan ganda, beberapa huruf berpisah koma untuk pg kompleks, atau B/S untuk benar/salah.",
  "Kolom wacana berlaku untuk baris itu dan baris sesudahnya sampai isinya berubah; kosongkan bila butir tidak memakai wacana.",
  "Baris yang memuat kolom lebih banyak daripada bentuk yang dikenali ditandai bermasalah beserta nomor barisnya.",
]

function trimEdges(value: string): string {
  return value.trim()
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n")
}

function optionLetterRank(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0)
}

/** Menafsirkan "B."/"S." pada butir benar/salah; huruf lain menghasilkan null. */
function readTrueFalseKey(line: string): "Benar" | "Salah" | null {
  const match = TRUE_FALSE_KEY_RE.exec(line)
  if (!match) return null
  return match[1].toUpperCase() === "B" ? "Benar" : "Salah"
}

/**
 * Naskah yang disalin dari editor Markdown atau percakapan memakai escape yang tidak
 * dimaksudkan sebagai isi soal: "1\." untuk nomor dan "\" di akhir baris sebagai pemisah
 * baris paksa. Tanpa dibersihkan, keduanya membuat butir tidak dikenali dan nomornya
 * ikut masuk ke teks soal, jadi escape itu dilepas sebelum baris ditafsirkan.
 */
function stripMarkdownLineEscapes(line: string): string {
  return line.replace(/^(\d{1,3})\\\./, "$1.").replace(/\\+$/, "").trimEnd()
}

interface DraftItem {
  sourceLine: number
  type: ImportQuestionType
  typeMarkerSeen: boolean
  questionLines: string[]
  options: ParsedImportOption[]
  extraProblems: string[]
  rubricLines: string[]
  explanationLines: string[]
  thinkingLevelRaw: string | null
  thinkingLevelLine: number | null
  achievementRef: string
  achievementLine: number | null
  points: number | null
  pointsLine: number | null
  trueFalseKey: "Benar" | "Salah" | null
  trueFalseKeyLines: number[]
  stimulusText: string
}

function newDraft(
  sourceLine: number,
  stimulusText: string,
  defaultType: ImportQuestionType = "multiple_choice"
): DraftItem {
  return {
    sourceLine,
    type: defaultType,
    typeMarkerSeen: false,
    questionLines: [],
    options: [],
    extraProblems: [],
    rubricLines: [],
    explanationLines: [],
    thinkingLevelRaw: null,
    thinkingLevelLine: null,
    achievementRef: "",
    achievementLine: null,
    points: null,
    pointsLine: null,
    trueFalseKey: null,
    trueFalseKeyLines: [],
    stimulusText,
  }
}

function applyTypeMarker(draft: DraftItem, text: string): string {
  const match = TYPE_MARKER_RE.exec(text)
  if (!match) return text
  draft.typeMarkerSeen = true
  const marker = match[1].toLowerCase().replace(/\s+/g, " ")
  if (marker.includes("kompleks")) draft.type = "pg_kompleks"
  else if (marker.includes("benar")) draft.type = "true_false"
  else draft.type = "essay"
  return text.replace(match[0], " ").trim()
}

/** Memisahkan sel hasil salinan lembar kerja; BOM lembar kerja dilepas dari sel pertama. */
function splitSpreadsheetCells(line: string): string[] {
  return line.split("\t").map((cell) => cell.replace(/^\uFEFF/, "").trim())
}

function normalizeHeaderName(cell: string): string {
  return cell.replace(/^\uFEFF/, "").trim().toLowerCase()
}

/**
 * Bentuk lembar kerja dipakai bila baris pertama berkolom tab, atau bila paling sedikit
 * dua baris tidak kosong memuat tab. Selain itu naskah dibaca sebagai teks bernomor.
 */
function isSpreadsheetPaste(lines: string[]): boolean {
  const nonEmpty = lines.filter((line) => line.trim() !== "")
  if (nonEmpty.length === 0) return false

  const firstCells = splitSpreadsheetCells(nonEmpty[0])
  if (firstCells.length > 1 && readSpreadsheetHeader(firstCells) !== null) {
    return true
  }

  // Jika naskah memuat baris-baris opsi bernomor/huruf terpisah (a., b., A., B.),
  // naskah ini adalah dokumen bernomor (Word/Docs), bukan lembar kerja.
  const hasSeparateOptionLines = nonEmpty.some((line) => OPTION_RE.test(line.trim()))
  if (hasSeparateOptionLines) {
    return false
  }

  // Untuk lembar kerja tanpa baris judul:
  // Harus memiliki baris berkolom banyak (minimal 3 sel berpisahkan tab: soal, tipe/opsi, kunci/opsi)
  // dan sebagian besar baris bertab memenuhi format tabel ini.
  const multiCellRows = nonEmpty.filter((line) => splitSpreadsheetCells(line).length >= 3)
  if (multiCellRows.length > 0 && multiCellRows.length >= nonEmpty.length * 0.5) {
    return true
  }

  return false
}

/** Baris judul dikenali bila memuat minimal dua nama kolom yang dikenal. */
function readSpreadsheetHeader(
  cells: string[]
): { order: (ImportSpreadsheetColumn | null)[]; ignoredColumns: string[] } | null {
  const order = cells.map((cell) => {
    const name = normalizeHeaderName(cell)
    return (IMPORT_SPREADSHEET_COLUMNS as readonly string[]).includes(name)
      ? (name as ImportSpreadsheetColumn)
      : null
  })
  if (order.filter((column) => column !== null).length < 2) return null

  const ignoredColumns = cells
    .map((cell) => cell.replace(/^\uFEFF/, "").trim())
    .filter((cell, index) => cell !== "" && order[index] === null)
  return { order, ignoredColumns }
}

function parseSpreadsheetType(cell: string): ImportQuestionType | null {
  const key = cell.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ")
  if (key === "" || key === "pg" || key === "pilihan ganda") return "multiple_choice"
  if (key === "pg kompleks" || key === "pilihan ganda kompleks") return "pg_kompleks"
  if (key === "benar/salah" || key === "benar salah" || key === "b/s" || key === "bs") return "true_false"
  if (key === "essay" || key === "esai" || key === "uraian") return "essay"
  return null
}

function parseSpreadsheetTrueFalseKey(cell: string): "Benar" | "Salah" | null {
  const key = cell.trim().toLowerCase().replace(/[.)]+$/, "").trim()
  if (key === "b" || key === "benar") return "Benar"
  if (key === "s" || key === "salah") return "Salah"
  return null
}

/** Huruf kunci boleh dipisah koma, spasi, titik koma, atau garis miring. */
function parseSpreadsheetKeyLetters(cell: string): { letters: string[]; invalid: string[] } {
  const parts = cell
    .split(/[\s,;/]+/)
    .map((part) => part.replace(/[.)]+$/, "").trim().toUpperCase())
    .filter((part) => part !== "")
  const letters: string[] = []
  const invalid: string[] = []
  for (const part of parts) {
    if (/^[A-E]$/.test(part)) {
      if (!letters.includes(part)) letters.push(part)
    } else {
      invalid.push(part)
    }
  }
  return { letters, invalid }
}

/**
 * Menafsirkan baris hasil salinan lembar kerja, satu baris menjadi satu butir.
 * Aturan isi mengikuti tempelan bernomor agar kedua bentuk berperilaku sama.
 */
function parseSpreadsheetImport(lines: string[], defaultPoints: number): ImportParseResult {
  const nonEmpty = lines
    .map((line, index) => ({ line, sourceLine: index + 1 }))
    .filter((row) => row.line.trim() !== "")

  const firstCells = nonEmpty.length > 0 ? splitSpreadsheetCells(nonEmpty[0].line) : []
  const header = firstCells.length > 1 ? readSpreadsheetHeader(firstCells) : null
  const order = header?.order ?? ([...IMPORT_SPREADSHEET_COLUMNS] as (ImportSpreadsheetColumn | null)[])
  const dataRows = header ? nonEmpty.slice(1) : nonEmpty
  const expectedCells = header
    ? firstCells.length
    : dataRows.length > 0
      ? splitSpreadsheetCells(dataRows[0].line).length
      : IMPORT_SPREADSHEET_COLUMNS.length

  const columnIndex = (column: ImportSpreadsheetColumn) => order.indexOf(column)
  let stimulus = ""
  const items: ParsedImportItem[] = []

  for (const row of dataRows) {
    const cells = splitSpreadsheetCells(row.line)
    const value = (column: ImportSpreadsheetColumn): string => {
      const index = columnIndex(column)
      return index === -1 ? "" : (cells[index] ?? "")
    }
    const lineNo = row.sourceLine
    const problems: string[] = []

    if (cells.length > expectedCells) {
      problems.push(
        `baris ke-${lineNo} memuat ${cells.length} kolom, sedangkan bentuk yang dikenali ${expectedCells} kolom; periksa sel tergabung atau tab di tengah teks.`
      )
    }

    // Kolom wacana berlaku sejak baris yang mengisinya sampai isinya berubah.
    const stimulusCell = value("wacana").trim()
    if (stimulusCell) stimulus = stimulusCell

    const rawType = value("tipe")
    const parsedType = parseSpreadsheetType(rawType)
    if (parsedType === null) {
      problems.push(
        `tipe "${rawType}" pada baris ke-${lineNo} tidak dikenal; pilih pg, pg kompleks, benar/salah, atau essay.`
      )
    }
    const type = parsedType ?? "multiple_choice"

    const questionText = value("soal").trim()
    if (!questionText) problems.push(`teks soal pada baris ke-${lineNo} kosong, jadi butir ini tidak dapat disimpan.`)

    const options: ParsedImportOption[] = []
    for (const letter of OPTION_LETTERS) {
      const text = value(letter.toLowerCase() as ImportSpreadsheetColumn).trim()
      if (text) options.push({ id: letter.toLowerCase(), label: letter, text, isCorrect: false })
    }

    const rawKey = value("kunci").trim()
    let trueFalseKey: "Benar" | "Salah" | null = null

    if (type === "essay") {
      if (rawKey) {
        problems.push(
          `kunci "${rawKey}" pada baris ke-${lineNo} tidak dipakai untuk soal essay; kosongkan kolom kunci.`
        )
      }
    } else if (type === "true_false") {
      trueFalseKey = parseSpreadsheetTrueFalseKey(rawKey)
      if (!rawKey) {
        problems.push(`kolom kunci pada baris ke-${lineNo} kosong; tulis B untuk Benar atau S untuk Salah.`)
      } else if (trueFalseKey === null) {
        problems.push(`kunci "${rawKey}" pada baris ke-${lineNo} bukan B atau S untuk soal benar/salah.`)
      }
    } else {
      const { letters, invalid } = parseSpreadsheetKeyLetters(rawKey)
      if (!rawKey) {
        problems.push(`kolom kunci pada baris ke-${lineNo} kosong; tulis huruf opsi yang benar, misalnya B.`)
      }
      if (invalid.length > 0) {
        problems.push(
          `kunci "${invalid.join(", ")}" pada baris ke-${lineNo} tidak dikenal; gunakan huruf A sampai E.`
        )
      }
      for (const letter of letters) {
        const option = options.find((candidate) => candidate.label === letter)
        if (option) option.isCorrect = true
        else
          problems.push(
            `kunci "${letter}" pada baris ke-${lineNo} menunjuk opsi yang kosong; isi teks opsi ${letter} atau ganti kuncinya.`
          )
      }

      const keys = options.filter((option) => option.isCorrect).length
      if (type === "multiple_choice") {
        if (options.length < 2)
          problems.push(`soal pilihan ganda pada baris ke-${lineNo} membutuhkan minimal 2 opsi jawaban (kolom a sampai e).`)
        if (keys > 1)
          problems.push(
            `soal pilihan ganda pada baris ke-${lineNo} hanya menerima satu kunci jawaban, ditemukan ${keys}.`
          )
      } else {
        if (options.length < 3)
          problems.push(`soal pg kompleks pada baris ke-${lineNo} membutuhkan minimal 3 opsi jawaban (kolom a sampai e).`)
        if (keys < 2)
          problems.push(
            `soal pg kompleks pada baris ke-${lineNo} membutuhkan minimal 2 kunci jawaban, baru ${keys} dipilih.`
          )
      }
    }

    const rawPoints = value("poin")
    let points = defaultPoints
    if (rawPoints) {
      const parsedPoints = Number(rawPoints.replace(",", "."))
      if (Number.isFinite(parsedPoints) && parsedPoints > 0) points = parsedPoints
      else
        problems.push(
          `bobot "${rawPoints}" pada baris ke-${lineNo} bukan angka lebih besar dari nol; memakai bobot bawaan.`
        )
    }

    const rawLevel = value("berpikir").trim()
    let thinkingLevel: ImportThinkingLevel | null = null
    if (rawLevel) {
      thinkingLevel = normalizeImportThinkingLevel(rawLevel)
      if (!thinkingLevel) {
        problems.push(
          `tingkat berpikir "${rawLevel}" pada baris ke-${lineNo} tidak dikenal; pilih mengingat, memahami, mengaplikasikan, atau menganalisis.`
        )
      }
    }

    const achievementRef = value("capaian").trim()
    if (achievementRef.length > ACHIEVEMENT_REF_MAX_LENGTH) {
      problems.push(
        `rujukan capaian pada baris ke-${lineNo} melebihi ${ACHIEVEMENT_REF_MAX_LENGTH} karakter; ringkas menjadi label pendek.`
      )
    }

    items.push({
      number: items.length + 1,
      sourceLine: lineNo,
      type,
      stimulusText: stimulus,
      questionText,
      points,
      options: type === "true_false" ? trueFalseOptions(trueFalseKey) : options,
      trueFalseKey: type === "true_false" ? trueFalseKey : null,
      rubric: "",
      explanation: value("pembahasan").trim(),
      thinkingLevel,
      achievementRef,
      problems,
    })
  }

  return {
    items,
    readyCount: items.filter((item) => item.problems.length === 0).length,
    problemCount: items.filter((item) => item.problems.length > 0).length,
    lineCount: lines.filter((line) => line.trim() !== "").length,
    format: "spreadsheet",
    headerDetected: header !== null,
    ignoredColumns: header?.ignoredColumns ?? [],
  }
}

/**
 * Menafsirkan naskah tempelan menjadi daftar calon butir beserta statusnya.
 * Tidak ada butir yang tersimpan di tahap ini.
 */
function isLineBelongingToDraft(draft: DraftItem, line: string): boolean {
  if (ITEM_START_RE.test(line) || STIMULUS_RE.test(line)) return false
  if (OPTION_RE.test(line) || EMPTY_OPTION_RE.test(line)) return true
  if (
    POINTS_RE.test(line) ||
    RUBRIC_RE.test(line) ||
    EXPLANATION_RE.test(line) ||
    THINKING_LEVEL_RE.test(line) ||
    ACHIEVEMENT_RE.test(line)
  ) {
    return true
  }
  if (draft.type === "true_false" && draft.options.length === 0 && readTrueFalseKey(line) !== null) {
    return true
  }
  if (draft.options.length === 0 && draft.trueFalseKey === null && draft.rubricLines.length === 0) {
    return true
  }
  return false
}

export function parseQuestionImport(
  text: string,
  defaultPoints: number,
  defaultType: ImportQuestionType = "multiple_choice"
): ImportParseResult {
  const lines = normalizeNewlines(text).split("\n")

  if (isSpreadsheetPaste(lines)) {
    return parseSpreadsheetImport(lines, defaultPoints)
  }

  const drafts: DraftItem[] = []
  const state = {
    current: null as DraftItem | null,
    stimulus: "",
    stimulusLines: null as string[] | null,
  }

  function closeItem() {
    if (state.current) {
      drafts.push(state.current)
      state.current = null
    }
  }

  function startItem(sourceLine: number): DraftItem {
    closeItem()
    const draft = newDraft(sourceLine, state.stimulus, defaultType)
    state.current = draft
    return draft
  }

  function flushStimulusBlock() {
    if (state.stimulusLines) {
      state.stimulus = state.stimulusLines.join("\n").trim()
      state.stimulusLines = null
    }
  }

  for (let index = 0; index < lines.length; index++) {
    const sourceLine = index + 1
    const rawLine = stripMarkdownLineEscapes(trimEdges(lines[index]))
    // Normalisasi tab setelah nomor soal atau huruf opsi dari hasil salinan Word / Google Docs
    const line = rawLine
      .replace(/^(\d{1,3}[.)])\t+/, "$1 ")
      .replace(/^([A-Za-z][.)])\t+/, "$1 ")

    if (line === "") {
      flushStimulusBlock()
      if (state.current) {
        let nextLine: string | null = null
        for (let j = index + 1; j < lines.length; j++) {
          const trimmed = stripMarkdownLineEscapes(trimEdges(lines[j]))
          if (trimmed !== "") {
            nextLine = trimmed
            break
          }
        }
        if (!nextLine || !isLineBelongingToDraft(state.current, nextLine)) {
          closeItem()
        }
      }
      continue
    }

    // Baris bertab yang tersisa di naskah bernomor diberi alasan per baris, bukan dilebur
    // menjadi teks soal panjang atau ditolak tanpa keterangan.
    if (line.includes("\t")) {
      const draft = state.current ?? startItem(sourceLine)
      draft.extraProblems.push(
        `baris ke-${sourceLine} berpisahkan tab seperti hasil salinan lembar kerja; naskah ini dibaca sebagai teks bernomor, jadi barisnya belum dijadikan butir.`
      )
      continue
    }

    const stimulusStart = STIMULUS_RE.exec(line)
    if (stimulusStart) {
      flushStimulusBlock()
      closeItem()
      state.stimulusLines = [stimulusStart[1]]
      continue
    }

    if (state.stimulusLines) {
      // Blok wacana berhenti pada baris kosong atau pada butir bernomor berikutnya.
      if (ITEM_START_RE.test(line)) flushStimulusBlock()
      else {
        state.stimulusLines.push(line)
        continue
      }
    }

    const itemStart = ITEM_START_RE.exec(line)
    if (itemStart) {
      const draft = startItem(sourceLine)
      const rest = applyTypeMarker(draft, itemStart[2])
      if (rest) draft.questionLines.push(rest)
      continue
    }

    const pointsMatch = POINTS_RE.exec(line)
    if (pointsMatch) {
      const draft = state.current ?? startItem(sourceLine)
      draft.pointsLine = sourceLine
      draft.points = Number(pointsMatch[1].replace(",", "."))
      continue
    }

    const rubricMatch = RUBRIC_RE.exec(line)
    if (rubricMatch) {
      const draft = state.current ?? startItem(sourceLine)
      draft.rubricLines.push(rubricMatch[1])
      continue
    }

    const explanationMatch = EXPLANATION_RE.exec(line)
    if (explanationMatch) {
      const draft = state.current ?? startItem(sourceLine)
      draft.explanationLines.push(explanationMatch[1])
      continue
    }

    const thinkingLevelMatch = THINKING_LEVEL_RE.exec(line)
    if (thinkingLevelMatch) {
      const draft = state.current ?? startItem(sourceLine)
      draft.thinkingLevelRaw = thinkingLevelMatch[1]
      draft.thinkingLevelLine = sourceLine
      continue
    }

    const achievementMatch = ACHIEVEMENT_RE.exec(line)
    if (achievementMatch) {
      const draft = state.current ?? startItem(sourceLine)
      draft.achievementRef = achievementMatch[1]
      draft.achievementLine = sourceLine
      continue
    }

    const optionMatch = OPTION_RE.exec(line)
    if (optionMatch) {
      const draft = state.current ?? startItem(sourceLine)
      const label = optionMatch[1].toUpperCase()
      const rawText = optionMatch[2]
      const isCorrect = /\*\s*$/.test(rawText)

      if (optionLetterRank(label) >= OPTION_LETTERS.length) {
        draft.extraProblems.push(
          `opsi "${label}." pada baris ke-${sourceLine} melebihi huruf E dan tidak didukung.`
        )
        continue
      }
      if (draft.options.some((o) => o.label === label)) {
        draft.extraProblems.push(`huruf opsi "${label}." tertulis dua kali (baris ke-${sourceLine}).`)
        continue
      }
      draft.options.push({
        id: label.toLowerCase(),
        label,
        text: trimEdges(isCorrect ? rawText.replace(/\*+\s*$/, "") : rawText),
        isCorrect,
      })
      continue
    }

    const current = state.current
    if (current && current.type === "true_false" && current.options.length === 0) {
      const key = readTrueFalseKey(line)
      if (key) {
        if (current.trueFalseKey === null) current.trueFalseKey = key
        current.trueFalseKeyLines.push(sourceLine)
        continue
      }
    }

    // Huruf dan titik saja berarti opsinya sengaja ditulis tapi teksnya lupa diisi.
    // Tanpa diperiksa, baris ini akan menyatu ke teks soal dan butirnya lolos sebagai "siap".
    const emptyOption = EMPTY_OPTION_RE.exec(line)
    if (emptyOption) {
      const draft = current ?? startItem(sourceLine)
      draft.extraProblems.push(
        `opsi "${emptyOption[1].toUpperCase()}." pada baris ke-${sourceLine} tidak ada teksnya; isi jawaban opsi itu sesudah hurufnya.`
      )
      continue
    }

    const draft = state.current ?? startItem(sourceLine)
    const lastOption = draft.options[draft.options.length - 1]
    if (lastOption) lastOption.text = `${lastOption.text} ${line}`.trim()
    else draft.questionLines.push(line)
  }

  flushStimulusBlock()
  closeItem()

  const items: ParsedImportItem[] = drafts
    .filter(
      (draft) =>
        draft.questionLines.length > 0 ||
        draft.options.length > 0 ||
        draft.rubricLines.length > 0 ||
        draft.explanationLines.length > 0 ||
        draft.thinkingLevelRaw !== null ||
        draft.achievementRef.trim() !== "" ||
        draft.extraProblems.length > 0 ||
        draft.points !== null ||
        draft.typeMarkerSeen
    )
    .map((draft, i) => finalizeDraft(draft, i + 1, defaultPoints))

  return {
    items,
    readyCount: items.filter((item) => item.problems.length === 0).length,
    problemCount: items.filter((item) => item.problems.length > 0).length,
    lineCount: lines.filter((line) => line.trim() !== "").length,
    format: "numbered",
    headerDetected: false,
    ignoredColumns: [],
  }
}

function finalizeDraft(draft: DraftItem, number: number, defaultPoints: number): ParsedImportItem {
  const questionText = draft.questionLines.join("\n").trim()
  const rubric = draft.rubricLines.join("\n").trim()
  const explanation = draft.explanationLines.join("\n").trim()
  const achievementRef = draft.achievementRef.trim()
  const problems: string[] = []
  const at = (reason: string) => problems.push(`${reason} (baris ke-${draft.sourceLine})`)

  let thinkingLevel: ImportThinkingLevel | null = null
  if (draft.thinkingLevelRaw !== null) {
    thinkingLevel = normalizeImportThinkingLevel(draft.thinkingLevelRaw)
    if (!thinkingLevel) {
      problems.push(
        `tingkat berpikir "${draft.thinkingLevelRaw.trim() || "(kosong)"}" pada baris ke-${draft.thinkingLevelLine} tidak dikenal; pilih mengingat, memahami, mengaplikasikan, atau menganalisis.`
      )
    }
  }

  if (achievementRef.length > ACHIEVEMENT_REF_MAX_LENGTH) {
    problems.push(
      `rujukan capaian pada baris ke-${draft.achievementLine} melebihi ${ACHIEVEMENT_REF_MAX_LENGTH} karakter; ringkas menjadi label pendek.`
    )
  }

  let points = defaultPoints
  if (draft.points !== null) {
    if (Number.isFinite(draft.points) && draft.points > 0) points = draft.points
    else
      problems.push(
        `bobot "poin: ${draft.points}" pada baris ke-${draft.pointsLine} bukan angka lebih besar dari nol; memakai bobot bawaan.`
      )
  }

  problems.push(...draft.extraProblems)

  // Baris yang tidak terbaca sudah cukup menjelaskan dirinya sendiri; keluhan isi
  // (teks soal, opsi, kunci) hanya membingungkan pada calon butir penampung alasan.
  if (draft.extraProblems.length > 0 && !questionText && draft.options.length === 0 && draft.rubricLines.length === 0) {
    return buildItem(draft, number, points, questionText, rubric, [], problems, {
      explanation,
      thinkingLevel,
      achievementRef,
    })
  }

  if (!questionText) at("teks soal tidak ditemukan, jadi butir ini tidak dapat disimpan")

  if (draft.type === "true_false") {
    if (draft.trueFalseKey === null) at("baris kunci B atau Salah belum ditulis")
    else if (draft.trueFalseKeyLines.length > 1)
      problems.push(
        `kunci benar/salah ditulis lebih dari sekali (baris ke-${draft.trueFalseKeyLines.join(", ke-")}).`
      )
  }

  if (draft.type === "true_false" && draft.options.length > 0) {
    problems.push(
      `soal benar/salah pada baris ke-${draft.sourceLine} membawa opsi berhuruf; cukup tulis kunci B atau S pada baris sendiri.`
    )
  }

  if (draft.type === "essay" && draft.options.length > 0) {
    problems.push(
      `soal essay pada baris ke-${draft.sourceLine} ikut membawa ${draft.options.length} opsi jawaban; hilangkan opsinya atau ubah tipenya.`
    )
  }

  const options = draft.options.filter((o) => o.text !== "")
  const droppedBlank = draft.options.length - options.length
  if (droppedBlank > 0) {
    problems.push(`${droppedBlank} opsi jawaban kosong teksnya dan tidak akan ikut tersimpan.`)
  }

  if (draft.type === "multiple_choice") {
    if (options.length < 2) at("soal pilihan ganda membutuhkan minimal 2 opsi jawaban")
    if (options.length > 5) at("soal pilihan ganda maksimal 5 opsi jawaban (A sampai E)")
    const keys = options.filter((o) => o.isCorrect).length
    if (keys === 0) at("belum ada kunci jawaban; tandai satu opsi dengan tanda bintang di akhir teksnya")
    if (keys > 1) at(`kunci jawaban pilihan ganda ada ${keys}, seharusnya tepat satu`)
  }

  if (draft.type === "pg_kompleks") {
    if (options.length < 3) at("soal pg kompleks membutuhkan minimal 3 opsi jawaban")
    if (options.length > 5) at("soal pg kompleks maksimal 5 opsi jawaban (A sampai E)")
    const keys = options.filter((o) => o.isCorrect).length
    if (keys < 2) at(`soal pg kompleks membutuhkan minimal 2 kunci jawaban, baru ${keys} ditandai`)
  }

  return buildItem(draft, number, points, questionText, rubric, options, problems, {
    explanation,
    thinkingLevel,
    achievementRef,
  })
}

function buildItem(
  draft: DraftItem,
  number: number,
  points: number,
  questionText: string,
  rubric: string,
  options: ParsedImportOption[],
  problems: string[],
  extras: { explanation: string; thinkingLevel: ImportThinkingLevel | null; achievementRef: string }
): ParsedImportItem {
  const trueFalseKey = draft.type === "true_false" ? draft.trueFalseKey : null

  return {
    number,
    sourceLine: draft.sourceLine,
    type: draft.type,
    stimulusText: draft.stimulusText,
    questionText,
    points,
    options: draft.type === "true_false" ? trueFalseOptions(trueFalseKey) : options,
    trueFalseKey,
    rubric,
    explanation: extras.explanation,
    thinkingLevel: extras.thinkingLevel,
    achievementRef: extras.achievementRef,
    problems,
  }
}

function trueFalseOptions(key: "Benar" | "Salah" | null): ParsedImportOption[] {
  return [
    { id: "true", label: "Benar", text: "Pernyataan Benar", isCorrect: key === "Benar" },
    { id: "false", label: "Salah", text: "Pernyataan Salah", isCorrect: key === "Salah" },
  ]
}

/** Mengubah calon butir yang siap menjadi badan butir untuk mutasi impor. */
export function toImportPayload(item: ParsedImportItem): ImportPayloadItem {
  const payload: ImportPayloadItem = {
    type: item.type,
    questionText: item.questionText,
    points: item.points,
  }
  if (item.stimulusText) payload.stimulusText = item.stimulusText
  if (item.type !== "essay" && item.options.length > 0) payload.options = item.options
  if (item.type === "essay" && item.rubric) payload.rubric = item.rubric
  if (item.explanation) payload.explanation = item.explanation
  if (item.thinkingLevel) payload.thinkingLevel = item.thinkingLevel
  if (item.achievementRef) payload.achievementRef = item.achievementRef
  return payload
}

/** Membagi hasil tafsiran menjadi tahap-tahap kecil agar kegagalan di tengah tidak menghapus yang sudah masuk. */
export function chunkImportItems<T>(items: T[], size = 25): T[][] {
  if (items.length === 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

export function importTypeLabel(type: ImportQuestionType): string {
  if (type === "multiple_choice") return "Pilihan Ganda"
  if (type === "pg_kompleks") return "PG Kompleks"
  if (type === "true_false") return "Benar / Salah"
  return "Essay"
}

/**
 * Menetapkan atau mengubah kunci jawaban butir soal secara interaktif pada layar pratinjau.
 * Menghapus keluhan validasi kunci yang sudah terpenuhi sehingga butir langsung siap disimpan.
 */
export function setItemOptionKey(item: ParsedImportItem, keyLetterOrLabel: string): ParsedImportItem {
  const normKey = keyLetterOrLabel.trim().toUpperCase()

  if (item.type === "multiple_choice") {
    const updatedOptions = item.options.map((opt) => ({
      ...opt,
      isCorrect: opt.label.toUpperCase() === normKey,
    }))

    const remainingProblems = item.problems.filter(
      (p) =>
        !p.includes("belum ada kunci jawaban") &&
        !p.includes("kunci jawaban pilihan ganda ada") &&
        !p.includes("kolom kunci")
    )

    const hasCorrect = updatedOptions.some((o) => o.isCorrect)
    if (!hasCorrect) {
      remainingProblems.push(`opsi "${normKey}" tidak ditemukan pada butir ini.`)
    }

    return {
      ...item,
      options: updatedOptions,
      problems: remainingProblems,
    }
  }

  if (item.type === "true_false") {
    const isBenar = normKey === "B" || normKey === "BENAR"
    const isSalah = normKey === "S" || normKey === "SALAH"
    if (!isBenar && !isSalah) return item

    const chosenKey: "Benar" | "Salah" = isBenar ? "Benar" : "Salah"
    const updatedOptions = item.options.map((opt) => ({
      ...opt,
      isCorrect: opt.label === (isBenar ? "B" : "S") || opt.text.toLowerCase() === chosenKey.toLowerCase(),
    }))

    const remainingProblems = item.problems.filter(
      (p) =>
        !p.includes("kunci B atau Salah belum ditulis") &&
        !p.includes("baris kunci B atau Salah") &&
        !p.includes("kolom kunci")
    )

    return {
      ...item,
      trueFalseKey: chosenKey,
      options: updatedOptions,
      problems: remainingProblems,
    }
  }

  if (item.type === "pg_kompleks") {
    const updatedOptions = item.options.map((opt) => {
      if (opt.label.toUpperCase() === normKey) {
        return { ...opt, isCorrect: !opt.isCorrect }
      }
      return opt
    })

    const correctCount = updatedOptions.filter((o) => o.isCorrect).length
    const remainingProblems = item.problems.filter(
      (p) =>
        !p.includes("soal pg kompleks membutuhkan minimal 2 kunci") &&
        !p.includes("kolom kunci")
    )

    if (correctCount < 2) {
      remainingProblems.push("soal pg kompleks membutuhkan minimal 2 kunci jawaban benar.")
    }

    return {
      ...item,
      options: updatedOptions,
      problems: remainingProblems,
    }
  }

  return item
}

/**
 * Menerapkan deretan kunci jawaban massal ke daftar butir soal.
 * Mendukung format bernomor (1.A, 2.B, 3.C) maupun deretan huruf sekuensial (A B C D A C...).
 */
export function applyBulkKeyString(
  items: ParsedImportItem[],
  rawInput: string
): { items: ParsedImportItem[]; appliedCount: number } {
  if (!rawInput.trim()) return { items, appliedCount: 0 }

  const numberedRegex = /(?:^|[\s,;])(\d{1,3})\s*[:.)-]?\s*([A-E]|Benar|Salah|\bB\b|\bS\b)\b/gi
  const numMatches = [...rawInput.matchAll(numberedRegex)]

  let appliedCount = 0

  if (numMatches.length >= 2) {
    const keyMap = new Map<number, string>()
    for (const m of numMatches) {
      keyMap.set(parseInt(m[1], 10), m[2].toUpperCase())
    }

    const nextItems = items.map((item) => {
      const key = keyMap.get(item.number)
      if (key && (item.type === "multiple_choice" || item.type === "true_false")) {
        appliedCount++
        return setItemOptionKey(item, key)
      }
      return item
    })

    return { items: nextItems, appliedCount }
  }

  // Pemetaan sekuensial berdasarkan urutan huruf kunci A-E / B / S
  const tokenRegex = /\b([A-E]|Benar|Salah)\b|([A-E])/gi
  const tokens: string[] = []
  let m: RegExpExecArray | null
  while ((m = tokenRegex.exec(rawInput)) !== null) {
    tokens.push((m[1] || m[2]).toUpperCase())
  }

  let tokenIdx = 0
  const nextItems = items.map((item) => {
    if ((item.type === "multiple_choice" || item.type === "true_false") && tokenIdx < tokens.length) {
      const key = tokens[tokenIdx++]
      appliedCount++
      return setItemOptionKey(item, key)
    }
    return item
  })

  return { items: nextItems, appliedCount }
}

/**
 * Mengubah tipe butir soal pada pratinjau impor (misal dari Pilihan Ganda ke Essay)
 * dan menghitung ulang masalah validasi secara otomatis.
 */
export function setItemType(item: ParsedImportItem, newType: ImportQuestionType): ParsedImportItem {
  if (item.type === newType) return item

  let options = item.options
  let trueFalseKey = item.trueFalseKey
  const rubric = item.rubric

  if (newType === "essay") {
    trueFalseKey = null
    options = []
  } else if (newType === "true_false") {
    if (!trueFalseKey) {
      trueFalseKey = "Benar"
    }
    options = [
      { id: "true", label: "Benar", text: "Pernyataan Benar", isCorrect: trueFalseKey === "Benar" },
      { id: "false", label: "Salah", text: "Pernyataan Salah", isCorrect: trueFalseKey === "Salah" },
    ]
  }

  // Hitung ulang problems untuk tipe yang baru
  const problems: string[] = []
  if (!item.questionText.trim()) {
    problems.push(`teks soal tidak ditemukan, jadi butir ini tidak dapat disimpan (baris ke-${item.sourceLine})`)
  }

  if (newType === "multiple_choice") {
    const validOptions = options.filter((o) => o.text !== "")
    if (validOptions.length < 2) {
      problems.push(`soal pilihan ganda membutuhkan minimal 2 opsi jawaban (baris ke-${item.sourceLine})`)
    }
    if (validOptions.length > 5) {
      problems.push(`soal pilihan ganda maksimal 5 opsi jawaban (A sampai E) (baris ke-${item.sourceLine})`)
    }
    const keys = validOptions.filter((o) => o.isCorrect).length
    if (keys === 0) {
      problems.push(`belum ada kunci jawaban; tandai satu opsi dengan tanda bintang di akhir teksnya (baris ke-${item.sourceLine})`)
    } else if (keys > 1) {
      problems.push(`kunci jawaban pilihan ganda ada ${keys}, seharusnya tepat satu (baris ke-${item.sourceLine})`)
    }
  } else if (newType === "pg_kompleks") {
    const validOptions = options.filter((o) => o.text !== "")
    if (validOptions.length < 3) {
      problems.push(`soal pg kompleks membutuhkan minimal 3 opsi jawaban (baris ke-${item.sourceLine})`)
    }
    if (validOptions.length > 5) {
      problems.push(`soal pg kompleks maksimal 5 opsi jawaban (A sampai E) (baris ke-${item.sourceLine})`)
    }
    const keys = validOptions.filter((o) => o.isCorrect).length
    if (keys < 2) {
      problems.push(`soal pg kompleks membutuhkan minimal 2 kunci jawaban, baru ${keys} ditandai (baris ke-${item.sourceLine})`)
    }
  } else if (newType === "true_false") {
    if (trueFalseKey === null) {
      problems.push(`baris kunci B atau Salah belum ditulis (baris ke-${item.sourceLine})`)
    }
  }

  // Pertahankan masalah terkait rujukan capaian atau tingkat berpikir jika ada
  for (const p of item.problems) {
    if (p.includes("tingkat berpikir") || p.includes("rujukan capaian") || p.includes("bobot")) {
      if (!problems.includes(p)) problems.push(p)
    }
  }

  return {
    ...item,
    type: newType,
    options,
    trueFalseKey,
    rubric,
    problems,
  }
}

/**
 * Mengubah seluruh butir yang bermasalah karena ketiadaan opsi menjadi tipe Essay.
 */
export function convertNoOptionItemsToEssay(items: ParsedImportItem[]): ParsedImportItem[] {
  return items.map((item) => {
    if (item.type === "multiple_choice" && item.options.length === 0) {
      return setItemType(item, "essay")
    }
    return item
  })
}
