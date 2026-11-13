import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "..", "..")
const SOAL_DOCX_PATH = path.join(PROJECT_ROOT, "soal", "IPA 8A SOAL.docx")

const {
  convertDocxParagraphsToImportText,
  extractDocxToImportText,
} = (await import(new URL("../lib/docx-extractor.ts", import.meta.url).href)) as typeof import("../lib/docx-extractor")

const {
  parseQuestionImport,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

describe("Ekstraktor Berkas Dokumen Word (.docx) Bank Soal", () => {
  it("berhasil mengekstrak berkas riil IPA 8A SOAL.docx secara lengkap", async () => {
    assert.ok(fs.existsSync(SOAL_DOCX_PATH), "Berkas soal IPA 8A SOAL.docx harus ada di direktori soal")
    const buffer = fs.readFileSync(SOAL_DOCX_PATH)
    const result = await extractDocxToImportText(buffer)

    assert.ok(result.questionCount >= 25, `Jumlah soal harus minimal 25, ditemukan: ${result.questionCount}`)
    assert.equal(result.multipleChoiceCount, 20, "Harus terdapat 20 soal pilihan ganda")
    assert.ok(result.essayCount >= 5, "Harus terdapat minimal 5 soal essay/uraian")

    // Memverifikasi teks hasil ekstraksi dapat langsung diparsing oleh parseQuestionImport
    const parsed = parseQuestionImport(result.text, 5)
    assert.ok(parsed.items.length >= 25, "Seluruh butir harus terbaca oleh penafsir e-IMTIHAN")
    assert.equal(parsed.items.filter((item) => item.type === "multiple_choice").length, 20)
    assert.ok(parsed.items.filter((item) => item.type === "essay").length >= 5)
  })

  it("memecah opsi jawaban inline yang menempel tanpa enter menjadi 4 opsi terpisah", () => {
    const rawParagraphs = [
      "A. Pilihlah Jawaban Yang Benar!",
      "Zat yang terkandung dalam makanan disebut ….a. Enzimb. Nutrien c. Hormond. Elektrolit",
      "Gas yang dibutuhkan respirasi seluler adalah ....a. karbon dioksidab. nitrogenc. oksigend. karbon monoksida",
    ]

    const result = convertDocxParagraphsToImportText(rawParagraphs)
    assert.equal(result.multipleChoiceCount, 2)
    assert.equal(result.essayCount, 0)

    const parsed = parseQuestionImport(result.text, 5)
    assert.equal(parsed.items.length, 2)

    const item1 = parsed.items[0]
    assert.deepEqual(
      item1.options.map((o) => o.label),
      ["A", "B", "C", "D"]
    )
    assert.equal(item1.options[0].text, "Enzim")
    assert.equal(item1.options[1].text, "Nutrien")
    assert.equal(item1.options[2].text, "Hormon")
    assert.equal(item1.options[3].text, "Elektrolit")
  })

  it("mengenali bagian soal uraian/essay saat menemukan judul Bagian B", () => {
    const rawParagraphs = [
      "A. Pilihlah Jawaban Yang Benar",
      "1. Berapakah 2 + 2? a. 1 b. 2 c. 3 d. 4",
      "B. Jawablah pertanyaan di bawah ini dengan baik dan benar !",
      "Sebutkan organ-organ utama yang menyusun saluran pencernaan manusia!",
      "Sebutkan empat organ yang berperan dalam sistem ekskresi manusia!",
    ]

    const result = convertDocxParagraphsToImportText(rawParagraphs)
    assert.equal(result.multipleChoiceCount, 1)
    assert.equal(result.essayCount, 2)

    const parsed = parseQuestionImport(result.text, 5)
    assert.equal(parsed.items.length, 3)
    assert.equal(parsed.items[0].type, "multiple_choice")
    assert.equal(parsed.items[1].type, "essay")
    assert.equal(parsed.items[2].type, "essay")
  })

  it("menangani kasus opsi di paragraf berbeda setelah teks soal", () => {
    const rawParagraphs = [
      "Setelah berolahraga tubuh Andi berkeringat. Ini menunjukkan fungsi kulit dalam hal ....",
      "a. mengeluarkan CO2 b. mengeluarkan keringat c. mengeluarkan urine d. mengeluarkan empedu",
    ]

    const result = convertDocxParagraphsToImportText(rawParagraphs)
    assert.equal(result.questionCount, 1)
    assert.equal(result.multipleChoiceCount, 1)

    const parsed = parseQuestionImport(result.text, 5)
    assert.equal(parsed.items.length, 1)
    assert.deepEqual(
      parsed.items[0].options.map((o) => o.label),
      ["A", "B", "C", "D"]
    )
  })

  it("menolak berkas yang bukan .docx dengan galat yang jelas", async () => {
    const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    await assert.rejects(
      async () => {
        await extractDocxToImportText(invalidBuffer)
      },
      /bukan dokumen Word/
    )
  })
})
