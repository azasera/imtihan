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

describe("Elevasi dan Identitas Visual Tabs Editor Butir Soal", () => {
  it("editor memuat bilah segmented control dengan ikon representatif untuk setiap jenis soal", () => {
    const editorContent = read("app/(main)/bank-soal/[id]/page.tsx")

    // Memuat keempat jenis soal
    assert.ok(editorContent.includes("Pilihan Ganda"), "Harus ada tab Pilihan Ganda")
    assert.ok(editorContent.includes("PG Kompleks"), "Harus ada tab PG Kompleks")
    assert.ok(editorContent.includes("Benar / Salah"), "Harus ada tab Benar / Salah")
    assert.ok(editorContent.includes("Essay"), "Harus ada tab Essay")

    // Memuat ikon fungsional untuk masing-masing tab
    assert.ok(editorContent.includes("<CircleDotIcon"), "Pilihan Ganda harus menggunakan CircleDotIcon")
    assert.ok(editorContent.includes("<ListChecksIcon"), "PG Kompleks harus menggunakan ListChecksIcon")
    assert.ok(editorContent.includes("<CheckCheckIcon"), "Benar / Salah harus menggunakan CheckCheckIcon")
    assert.ok(editorContent.includes("<FileTextIcon"), "Essay harus menggunakan FileTextIcon")

    // Memuat ikon mode penulisan
    assert.ok(editorContent.includes("<PenLineIcon"), "Tulis satu per satu harus menggunakan PenLineIcon")
    assert.ok(editorContent.includes("<FileSpreadsheetIcon"), "Tempel massal harus menggunakan FileSpreadsheetIcon")

    // Memuat banner panduan format aktif
    assert.ok(
      editorContent.includes("Format {QUESTION_TYPE_LABELS[questionType]}:"),
      "Harus ada banner petunjuk dinamis saat tab dipilih"
    )

    // Memuat styling elevasi modern (segmented control)
    assert.ok(
      editorContent.includes("data-active:shadow-sm") || editorContent.includes("data-active:shadow-xs"),
      "Tab aktif harus memiliki elevasi bayangan halus"
    )
  })

  it("selektor kunci benar / salah menggunakan ikon tegas dan proteksi autofill", () => {
    const editorContent = read("app/(main)/bank-soal/[id]/page.tsx")

    assert.ok(editorContent.includes("Pernyataan Benar"))
    assert.ok(editorContent.includes("Pernyataan Salah"))
    assert.ok(editorContent.includes("<CheckCircle2Icon"), "Benar menggunakan ikon centang")
    assert.ok(editorContent.includes("<XIcon"), "Salah menggunakan ikon silang tegas")
    assert.ok(editorContent.includes('data-1p-ignore="true"'), "Tombol selektor memiliki proteksi autofill")
  })

  it("bebas kebocoran kode spesifikasi teknis", () => {
    const editorContent = read("app/(main)/bank-soal/[id]/page.tsx")
    const leaks = Array.from(editorContent.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0])
    assert.deepStrictEqual(leaks, [], "Editor tidak boleh membocorkan kode teknis")
  })
})
