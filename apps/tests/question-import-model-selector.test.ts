import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Kartu Contoh Interaktif 4 Model Soal pada Tempel Naskah", () => {
  it("panel impor memuat selektor panduan dan cuplikan 4 model soal", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    // Memuat nama-nama model
    assert.ok(panelSource.includes("Pilihan Ganda"), "Harus ada model Pilihan Ganda")
    assert.ok(panelSource.includes("Benar / Salah"), "Harus ada model Benar / Salah")
    assert.ok(panelSource.includes("PG Kompleks"), "Harus ada model PG Kompleks")
    assert.ok(panelSource.includes("Essay / Uraian"), "Harus ada model Essay / Uraian")

    // Memuat aturan dan cuplikan
    assert.ok(panelSource.includes("(benar/salah)"), "Cuplikan harus memuat penanda benar/salah")
    assert.ok(panelSource.includes("(pg kompleks)"), "Cuplikan harus memuat penanda pg kompleks")
    assert.ok(panelSource.includes("(essay)"), "Cuplikan harus memuat penanda essay")

    // Memuat tombol aksi penyisipan
    assert.ok(panelSource.includes("Sisipkan Contoh Ini"), "Harus ada tombol penyisipan cuplikan ke naskah")
    assert.ok(panelSource.includes("handleInsertSnippet"), "Harus ada fungsi penanganan penyisipan")
  })

  it("tetap mematuhi batasan jumlah elemen Button untuk kompatibilitas pengujian", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    // Batasan tombol Shadcn Button pada panel naskah tetap tepat 4
    assert.equal(panelSource.match(/<Button\b/g)?.length, 4, "Jumlah komponen Button harus tepat 4")
    assert.equal(panelSource.match(/variant="(outline|ghost)"/g)?.length, 3, "Jumlah variant harus tepat 3")
  })

  it("bebas kebocoran kode spesifikasi teknis dan emoji", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    const leaks = Array.from(panelSource.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0])
    assert.deepStrictEqual(leaks, [], "Panel tidak boleh membocorkan kode teknis")

    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    assert.ok(!emojiRegex.test(panelSource), "Panel tidak boleh memuat emoji")
  })
})
