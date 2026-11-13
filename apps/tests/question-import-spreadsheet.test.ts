import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  IMPORT_SPREADSHEET_COLUMNS,
  IMPORT_TEMPLATE_EXAMPLE,
  SPREADSHEET_FORMAT_HINTS,
  buildImportTemplateText,
  parseQuestionImport,
  toImportPayload,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

type Column = (typeof IMPORT_SPREADSHEET_COLUMNS)[number]

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

/** Satu baris lembar kerja dengan urutan kolom bawaan; sel yang tidak disebut dibiarkan kosong. */
function defaultRow(values: Partial<Record<Column, string>>): string {
  return IMPORT_SPREADSHEET_COLUMNS.map((column) => values[column] ?? "").join("\t")
}

const HEADER = IMPORT_SPREADSHEET_COLUMNS.join("\t")

describe("Tempelan lembar kerja: bentuk dikenali tanpa tombol pilihan", () => {
  it("template unduhan berisi baris judul dan satu contoh butir yang dapat ditempel balik", () => {
    const template = buildImportTemplateText()
    const lines = template.split("\n")
    assert.equal(lines.length, 2, "template memuat baris judul dan satu contoh butir")
    assert.equal(lines[0], HEADER)

    const parsed = parseQuestionImport(template, 5)
    assert.equal(parsed.format, "spreadsheet")
    assert.equal(parsed.headerDetected, true)
    assert.deepEqual(parsed.ignoredColumns, [])
    assert.equal(parsed.items.length, 1)
    assert.equal(parsed.readyCount, 1)
    assert.equal(parsed.problemCount, 0)

    const [item] = parsed.items
    assert.equal(item.type, "multiple_choice")
    assert.equal(item.questionText, IMPORT_TEMPLATE_EXAMPLE.soal)
    assert.equal(item.points, 5)
    assert.deepEqual(
      item.options.map((option) => [option.label, option.text, option.isCorrect]),
      [
        ["A", IMPORT_TEMPLATE_EXAMPLE.a, true],
        ["B", IMPORT_TEMPLATE_EXAMPLE.b, false],
        ["C", IMPORT_TEMPLATE_EXAMPLE.c, false],
        ["D", IMPORT_TEMPLATE_EXAMPLE.d, false],
      ]
    )
    assert.equal(item.explanation, IMPORT_TEMPLATE_EXAMPLE.pembahasan)
    assert.equal(item.thinkingLevel, "memahami")
    assert.equal(item.achievementRef, IMPORT_TEMPLATE_EXAMPLE.capaian)
    assert.equal(item.stimulusText, "")
  })

  it("tanpa baris judul, urutan kolom template tetap terbaca", () => {
    const parsed = parseQuestionImport(
      defaultRow({
        soal: "Ibu kota provinsi Jawa Timur?",
        tipe: "pg",
        a: "Surabaya",
        b: "Malang",
        c: "Kediri",
        d: "Madiun",
        kunci: "A",
        poin: "4",
      }),
      5
    )

    assert.equal(parsed.format, "spreadsheet")
    assert.equal(parsed.headerDetected, false)
    assert.deepEqual(parsed.ignoredColumns, [])
    assert.equal(parsed.readyCount, 1)
    assert.equal(parsed.items[0].points, 4)
    assert.equal(parsed.items[0].options.find((option) => option.isCorrect)?.label, "A")
  })

  it("baris judul dikenali tanpa peduli besar-kecil huruf dan boleh berurutan lain", () => {
    const text = [
      "SOAL\tKUNCI\tTipe\tB\tA\tPoin",
      "Sebutkan rukun Islam pertama?\tA\tPG\tMembaca Quran\tDua kalimat syahadat\t3",
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.format, "spreadsheet")
    assert.equal(parsed.headerDetected, true)
    assert.equal(parsed.readyCount, 1)
    const [item] = parsed.items
    assert.equal(item.type, "multiple_choice")
    assert.equal(item.points, 3)
    assert.deepEqual(
      item.options.map((option) => [option.label, option.text, option.isCorrect]),
      [
        ["A", "Dua kalimat syahadat", true],
        ["B", "Membaca Quran", false],
      ]
    )
  })

  it("kolom tak dikenal diabaikan dan disebut pada ringkasan, bukan menggagalkan impor", () => {
    const text = [
      "soal\ttipe\ta\tb\tkunci\tcatatan",
      "Siapa nabi terakhir?\tpg\tMuhammad\tIsa\tA\tdicek ulang",
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.readyCount, 1)
    assert.deepEqual(parsed.ignoredColumns, ["catatan"])
    assert.equal(parsed.items[0].explanation, "")
    assert.ok(!parsed.items[0].questionText.includes("dicek ulang"))
  })

  it("baris dengan jumlah kolom berlebih menjadi butir bermasalah yang menyebut baris dan jumlah kolom", () => {
    const text = [
      "soal\ttipe\ta\tb\tkunci",
      "Siapa nabi terakhir?\tpg\tMuhammad\tIsa\tA\tcatatan tambahan",
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.items.length, 1)
    assert.equal(parsed.problemCount, 1)
    const reasons = parsed.items[0].problems.join(" ")
    assert.match(reasons, /baris ke-2 memuat 6 kolom, sedangkan bentuk yang dikenali 5 kolom/)
  })

  it("baris kosong dilewati dan nomor baris sumber tetap menunjuk baris aslinya", () => {
    const text = [
      HEADER,
      defaultRow({ soal: "Soal pertama", a: "A1", b: "B1", kunci: "A" }),
      "",
      defaultRow({ soal: "Soal kedua", a: "A2", b: "B2", kunci: "B" }),
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.items.length, 2)
    assert.equal(parsed.items[0].sourceLine, 2)
    assert.equal(parsed.items[1].sourceLine, 4)
    assert.equal(parsed.readyCount, 2)
  })

  it("naskah bernomor dengan satu baris bertab tetap dibaca bernomor, bukan lembar kerja", () => {
    const text = ["1. Soal bernomor?", "A. Satu", "B. Dua*", "catatan\tkolom"].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.format, "numbered")
    assert.equal(parsed.headerDetected, false)
    assert.deepEqual(parsed.ignoredColumns, [])
    assert.ok(parsed.items[0].problems.some((problem) => /berpisahkan tab/.test(problem)))
  })
})

describe("Tempelan lembar kerja: aturan isi sejalan dengan bentuk bernomor", () => {
  it("tipenya mengenali pg, pg kompleks, benar/salah, essay beserta variasi penulisan", () => {
    const text = [
      "soal\ttipe\ta\tb\tc\td\tkunci",
      "Soal pg\tPG\tA1\tB1\tC1\tD1\tB",
      "Soal kompleks\tPG KOMPLEKS\tA2\tB2\tC2\tD2\tA, C",
      "Soal b/s\tbenar/salah\t\t\t\t\tS",
      "Soal essay\tEsai\t\t\t\t\t",
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.deepEqual(
      parsed.items.map((item) => item.type),
      ["multiple_choice", "pg_kompleks", "true_false", "essay"]
    )
    assert.equal(parsed.readyCount, 4)
    assert.equal(parsed.items[1].options.filter((option) => option.isCorrect).length, 2)
    assert.equal(parsed.items[2].trueFalseKey, "Salah")
    assert.deepEqual(
      parsed.items[2].options.map((option) => [option.label, option.isCorrect]),
      [
        ["Benar", false],
        ["Salah", true],
      ]
    )
  })

  it("tipe yang tidak dikenal menjadi butir bermasalah dengan alasan berbaris", () => {
    const text = ["soal\ttipe\ta\tb\tkunci", "Soal isian\tisian\tSatu\tDua\tA"].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.problemCount, 1)
    assert.match(parsed.items[0].problems.join(" "), /tipe "isian" pada baris ke-2 tidak dikenal/)
  })

  it("kunci pilihan ganda menerima satu huruf, huruf kecil, dan menolak huruf di luar A-E", () => {
    const text = [
      "soal\ttipe\ta\tb\tc\tkunci",
      "Huruf kecil\tpg\tSatu\tDua\tTiga\tb",
      "Huruf asing\tpg\tSatu\tDua\tTiga\tZ",
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.items[0].options.find((option) => option.isCorrect)?.label, "B")
    assert.equal(parsed.readyCount, 1)
    assert.match(parsed.items[1].problems.join(" "), /kunci "Z" pada baris ke-3 tidak dikenal/)
  })

  it("kunci yang menunjuk opsi kosong ditolak dengan alasan yang menyebut hurufnya", () => {
    const text = ["soal\ttipe\ta\tb\tkunci", "Dua opsi\tpg\tSatu\tDua\tC"].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.match(
      parsed.items[0].problems.join(" "),
      /kunci "C" pada baris ke-2 menunjuk opsi yang kosong/
    )
  })

  it("kunci benar/salah menerima B, S, Benar, Salah dan menolak nilai lain", () => {
    const text = [
      "soal\ttipe\tkunci",
      "Pernyataan satu\tbenar/salah\tbenar",
      "Pernyataan dua\tb/s\tS",
      "Pernyataan tiga\tbenar/salah\tX",
      "Pernyataan empat\tbenar/salah\t",
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.items[0].trueFalseKey, "Benar")
    assert.equal(parsed.items[1].trueFalseKey, "Salah")
    assert.match(parsed.items[2].problems.join(" "), /bukan B atau S/)
    assert.match(parsed.items[3].problems.join(" "), /kolom kunci pada baris ke-5 kosong/)
  })

  it("soal essay membawa kolom kunci ditandai, bukan disimpan diam-diam", () => {
    const text = ["soal\ttipe\tkunci", "Jelaskan wudhu\tessay\tA"].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.items[0].type, "essay")
    assert.match(
      parsed.items[0].problems.join(" "),
      /kunci "A" pada baris ke-2 tidak dipakai untuk soal essay/
    )
  })

  it("bobot, tingkat berpikir, dan capaian diperiksa dengan alasan per baris", () => {
    const text = [
      "soal\ttipe\ta\tb\tkunci\tpoin\tberpikir\tcapaian",
      ["Bobot salah", "pg", "Satu", "Dua", "A", "0", "hapalan", "x".repeat(81)].join("\t"),
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    const reasons = parsed.items[0].problems.join(" ")
    assert.match(reasons, /bobot "0" pada baris ke-2 bukan angka lebih besar dari nol/)
    assert.match(reasons, /tingkat berpikir "hapalan" pada baris ke-2 tidak dikenal/)
    assert.match(reasons, /rujukan capaian pada baris ke-2 melebihi 80 karakter/)
    assert.equal(parsed.items[0].points, 5)
  })

  it("kolom wacana berlaku untuk baris itu dan baris sesudahnya sampai isinya berubah", () => {
    const text = [
      "soal\ttipe\ta\tb\tkunci\twacana",
      ["Butir satu", "pg", "A1", "B1", "A", "Wacana pertama"].join("\t"),
      ["Butir dua", "pg", "A2", "B2", "B", ""].join("\t"),
      ["Butir tiga", "pg", "A3", "B3", "A", "Wacana kedua"].join("\t"),
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.deepEqual(
      parsed.items.map((item) => item.stimulusText),
      ["Wacana pertama", "Wacana pertama", "Wacana kedua"]
    )
  })

  it("BOM lembar kerja dilepas tanpa merusak teks Arab", () => {
    const arabicQuestion = "ما هي أول فروض الوضوء؟"
    const text = [
      `\uFEFFsoal\ttipe\ta\tb\tkunci`,
      `${arabicQuestion}\tpg\tالنية\tالوضوء\tA`,
    ].join("\n")
    const parsed = parseQuestionImport(text, 5)

    assert.equal(parsed.format, "spreadsheet")
    assert.equal(parsed.headerDetected, true)
    assert.equal(parsed.items[0].questionText, arabicQuestion)
    assert.equal(parsed.items[0].options[0].text, "النية")
    assert.equal(parsed.readyCount, 1)
  })

  it("badan butir hasil tempelan memakai kolom yang sama dengan jalur tulis satu per satu", () => {
    const parsed = parseQuestionImport(buildImportTemplateText(), 5)
    const payload = toImportPayload(parsed.items[0])

    assert.deepEqual(payload, {
      type: "multiple_choice",
      questionText: IMPORT_TEMPLATE_EXAMPLE.soal,
      points: 5,
      options: parsed.items[0].options,
      explanation: IMPORT_TEMPLATE_EXAMPLE.pembahasan,
      thinkingLevel: "memahami",
      achievementRef: IMPORT_TEMPLATE_EXAMPLE.capaian,
    })
  })
})

describe("Tempelan lembar kerja: langkah besar", () => {
  it("dua ratus baris tertafsir selesai jauh sebelum ada panggilan server", () => {
    const rows = Array.from({ length: 200 }, (_, index) =>
      defaultRow({
        soal: `Soal nomor ${index + 1}?`,
        tipe: "pg",
        a: "Opsi A",
        b: "Opsi B",
        c: "Opsi C",
        d: "Opsi D",
        kunci: "A",
        poin: "5",
      })
    )
    const text = [HEADER, ...rows].join("\n")

    const started = performance.now()
    const parsed = parseQuestionImport(text, 5)
    const elapsed = performance.now() - started

    assert.equal(parsed.items.length, 200)
    assert.equal(parsed.readyCount, 200)
    assert.equal(parsed.problemCount, 0)
    assert.ok(elapsed < 800, `penafsiran 200 baris memakan ${elapsed.toFixed(1)} ms`)
  })
})

describe("Layar impor: unduhan template dan keterangan bentuk", () => {
  const panel = read(path.join("components", "bank-soal", "question-import-panel.tsx"))
  const preview = read(path.join("components", "bank-soal", "question-import-preview.tsx"))

  it("panel menyediakan unduhan template kolom berformat tab", () => {
    assert.match(panel, /Unduh template kolom/)
    assert.match(panel, /buildImportTemplateText\(\)/)
    assert.match(panel, /template-impor-soal\.tsv/)
    assert.match(panel, /text\/tab-separated-values;charset=utf-8/)
  })

  it("petunjuk lembar kerja tampil sebagai kelompok tersendiri dan menyebut urutan kolom", () => {
    assert.match(panel, /SPREADSHEET_FORMAT_HINTS\.map/)
    const hints = SPREADSHEET_FORMAT_HINTS.join(" ")
    for (const column of IMPORT_SPREADSHEET_COLUMNS) {
      assert.ok(hints.includes(column), `petunjuk lembar kerja harus menyebut kolom ${column}`)
    }
    assert.match(hints, /baris judul boleh ada atau tidak/i)
    assert.match(hints, /kolom lain diabaikan/i)
    assert.match(hints, /nomor barisnya/i)
  })

  it("pratinjau menyebut bentuk yang dikenali dan kolom yang diabaikan", () => {
    assert.match(preview, /format === "spreadsheet"/)
    assert.match(preview, /baris judul dikenali/)
    assert.match(preview, /tanpa baris judul, urutan kolom template/)
    assert.match(preview, /kolom diabaikan: /)
    assert.match(panel, /format=\{parsed\.format\}/)
    assert.match(panel, /headerDetected=\{parsed\.headerDetected\}/)
    assert.match(panel, /ignoredColumns=\{parsed\.ignoredColumns\}/)
  })

  it("tidak ada kode spesifikasi teknis pada teks antarmuka impor lembar kerja", () => {
    const leak = /\b(SCR-[A-Z0-9-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/
    for (const source of [panel, preview, SPREADSHEET_FORMAT_HINTS.join(" "), buildImportTemplateText()]) {
      assert.ok(!leak.test(source), "teks antarmuka tidak boleh memuat kode spesifikasi")
      assert.ok(!source.includes(".md"), "teks antarmuka tidak boleh menunjuk berkas dokumen internal")
    }
  })
})
