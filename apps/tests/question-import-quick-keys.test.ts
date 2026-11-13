import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "..", "..")
const SOAL_DOCX_PATH = path.join(PROJECT_ROOT, "soal", "IPA 8A SOAL.docx")

const {
  applyBulkKeyString,
  parseQuestionImport,
  setItemOptionKey,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

const {
  extractDocxToImportText,
} = (await import(new URL("../lib/docx-extractor.ts", import.meta.url).href)) as typeof import("../lib/docx-extractor")

describe("Fitur Penentuan Kunci Cepat (Opsi 1 Interaktif & Opsi 2 Kunci Massal)", () => {
  it("Opsi 1: setItemOptionKey menetapkan kunci PG tunggal dan menghapus keluhan kunci", () => {
    const rawText = `1. Rukun wudhu yang pertama adalah?
A. Membasuh kedua telinga
B. Membasuh muka
C. Mengusap kaki
D. Tertib`

    const parsed = parseQuestionImport(rawText, 5)
    assert.equal(parsed.items.length, 1)
    const initialItem = parsed.items[0]
    assert.equal(initialItem.problems.length, 1)
    assert.ok(initialItem.problems[0].includes("belum ada kunci jawaban"))

    // Guru mengklik tombol B
    const updated = setItemOptionKey(initialItem, "B")
    assert.equal(updated.problems.length, 0, "Keluhan belum ada kunci harus hilang")
    const correctOption = updated.options.find((o) => o.isCorrect)
    assert.ok(correctOption)
    assert.equal(correctOption.label, "B")
    assert.equal(correctOption.text, "Membasuh muka")

    // Guru mengubah ke opsi D
    const changed = setItemOptionKey(updated, "D")
    assert.equal(changed.problems.length, 0)
    assert.equal(changed.options.find((o) => o.isCorrect)?.label, "D")
    assert.equal(changed.options.find((o) => o.label === "B")?.isCorrect, false)
  })

  it("Opsi 1: setItemOptionKey menetapkan kunci Benar/Salah secara instan", () => {
    const rawText = `1. (benar/salah) Shalat Isya berjumlah empat rakaat.`
    const parsed = parseQuestionImport(rawText, 5)
    const initialItem = parsed.items[0]
    assert.ok(initialItem.problems.length > 0)

    const updated = setItemOptionKey(initialItem, "Benar")
    assert.equal(updated.problems.length, 0)
    assert.equal(updated.trueFalseKey, "Benar")
  })

  it("Opsi 1: setItemOptionKey mendukung multi-kunci pada PG Kompleks", () => {
    const rawText = `1. (pg kompleks) Rukun shalat berikut:
A. Niat
B. Ruku
C. Doa Iftitah
D. Sujud`
    const parsed = parseQuestionImport(rawText, 5)
    const item = parsed.items[0]

    // Pilih opsi A
    const step1 = setItemOptionKey(item, "A")
    assert.ok(step1.problems.length > 0, "Minimal 2 kunci dibutuhkan")

    // Pilih opsi B -> sekarang ada 2 kunci
    const step2 = setItemOptionKey(step1, "B")
    assert.equal(step2.problems.length, 0, "2 kunci sudah terpenuhi")
    assert.equal(step2.options.filter((o) => o.isCorrect).length, 2)
  })

  it("Opsi 2: applyBulkKeyString memetakan kunci bernomor (1.A, 2.B, 3.C...)", () => {
    const rawText = `1. Soal nomor satu
A. Satu A
B. Satu B

2. Soal nomor dua
A. Dua A
B. Dua B

3. Soal nomor tiga
A. Tiga A
B. Tiga B`

    const parsed = parseQuestionImport(rawText, 5)
    assert.equal(parsed.items.length, 3)
    assert.equal(parsed.problemCount, 3)

    const bulkInput = "1. B, 2. A, 3. B"
    const { items: updatedItems, appliedCount } = applyBulkKeyString(parsed.items, bulkInput)

    assert.equal(appliedCount, 3)
    assert.equal(updatedItems.filter((i) => i.problems.length === 0).length, 3)
    assert.equal(updatedItems[0].options.find((o) => o.isCorrect)?.label, "B")
    assert.equal(updatedItems[1].options.find((o) => o.isCorrect)?.label, "A")
    assert.equal(updatedItems[2].options.find((o) => o.isCorrect)?.label, "B")
  })

  it("Opsi 2: applyBulkKeyString memetakan deretan huruf sekuensial (A B C D...)", () => {
    const rawText = `1. Soal satu
A. A1
B. B1

2. Soal dua
A. A2
B. B2

3. (benar/salah) Pernyataan tiga

4. Soal empat
A. A4
B. B4`

    const parsed = parseQuestionImport(rawText, 5)
    const bulkInput = "B A Benar B"
    const { items: updatedItems, appliedCount } = applyBulkKeyString(parsed.items, bulkInput)

    assert.equal(appliedCount, 4)
    assert.equal(updatedItems.filter((i) => i.problems.length === 0).length, 4)
    assert.equal(updatedItems[0].options.find((o) => o.isCorrect)?.label, "B")
    assert.equal(updatedItems[1].options.find((o) => o.isCorrect)?.label, "A")
    assert.equal(updatedItems[2].trueFalseKey, "Benar")
    assert.equal(updatedItems[3].options.find((o) => o.isCorrect)?.label, "B")
  })

  it("Kombinasi Sinergis: Berkas riil Word 20 PG + 6 Essay dapat diberi kunci massal lalu disunting satu butir", async () => {
    assert.ok(fs.existsSync(SOAL_DOCX_PATH))
    const buf = fs.readFileSync(SOAL_DOCX_PATH)
    const extracted = await extractDocxToImportText(buf)
    const parsed = parseQuestionImport(extracted.text, 5)

    assert.equal(parsed.items.length, 26)
    assert.equal(parsed.readyCount, 6, "Awalnya hanya 6 soal essay yang siap")
    assert.equal(parsed.problemCount, 20, "20 soal PG awalnya belum punya kunci")

    // Guru menerapkan kunci massal 20 butir PG
    const bulkKeys = "A B C D A B C D A B C D A B C D A B C D"
    const { items: withKeys, appliedCount } = applyBulkKeyString(parsed.items, bulkKeys)
    assert.equal(appliedCount, 20)
    assert.equal(withKeys.filter((i) => i.problems.length === 0).length, 26, "Seluruh 26 butir kini siap")

    // Guru memeriksa nomor 2 dan mengganti kuncinya dari B menjadi D lewat Opsi 1
    const editedItem2 = setItemOptionKey(withKeys[1], "D")
    assert.equal(editedItem2.options.find((o) => o.isCorrect)?.label, "D")
    assert.equal(editedItem2.problems.length, 0)
  })

  it("Komponen UI bebas dari kebocoran kode spesifikasi teknis dan nihil emoji", () => {
    const previewSource = fs.readFileSync(
      path.join(PROJECT_ROOT, "apps", "components", "bank-soal", "question-import-preview.tsx"),
      "utf-8"
    )

    // Bebas kebocoran teknis
    assert.ok(!previewSource.includes("TASK-"), "Tidak boleh membocorkan TASK-*")
    assert.ok(!previewSource.includes("CHG-"), "Tidak boleh membocorkan CHG-*")
    assert.ok(!previewSource.includes("BANK-"), "Tidak boleh membocorkan BANK-*")

    // Nihil emoji di UI copy
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    assert.ok(!emojiRegex.test(previewSource), "Tidak boleh mengandung karakter emoji")
  })

  it("Mempertahankan batasan jumlah elemen Button pada question-import-panel.tsx", () => {
    const panelSource = fs.readFileSync(
      path.join(PROJECT_ROOT, "apps", "components", "bank-soal", "question-import-panel.tsx"),
      "utf-8"
    )
    assert.equal(panelSource.match(/<Button\b/g)?.length, 4, "Jumlah komponen Button harus tetap 4")
  })
})
