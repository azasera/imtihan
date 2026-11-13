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

describe("Keterlihatan dan Integrasi Menonjol Asisten AI", () => {
  it("tombol header Asisten AI memiliki latar bergradien dan lencana penanda", () => {
    const pageContent = read("app/(main)/bank-soal/[id]/page.tsx")

    assert.ok(pageContent.includes("Asisten AI"), "Tombol Asisten AI harus ada di header")
    assert.ok(pageContent.includes("bg-gradient-to-r"), "Tombol harus menggunakan latar bergradien")
    assert.ok(pageContent.includes("Pintar"), "Tombol harus memiliki lencana penanda Pintar")
    assert.ok(pageContent.includes("setIsAiDialogOpen(true)"), "Mengklik tombol harus membuka dialog generator")
  })

  it("bilah mode kartu editor menyertakan opsi pemicu Bantuan AI", () => {
    const pageContent = read("app/(main)/bank-soal/[id]/page.tsx")

    assert.ok(pageContent.includes("Bantuan AI"), "Bilah mode harus menyertakan opsi Bantuan AI")
    assert.ok(pageContent.includes("Tulis satu per satu"), "Harus tetap ada mode single")
    assert.ok(pageContent.includes("Tempel banyak sekaligus"), "Harus tetap ada mode bulk")
  })

  it("tampil banner sambutan Asisten AI saat paket soal masih kosong", () => {
    const pageContent = read("app/(main)/bank-soal/[id]/page.tsx")

    assert.ok(
      pageContent.includes("Mulai Lebih Cepat dengan Asisten AI"),
      "Harus ada banner ajakan saat bank soal 0 butir"
    )
    assert.ok(
      pageContent.includes("Buka Asisten AI"),
      "Banner harus memiliki tombol aksi cepat Buka Asisten AI"
    )
  })

  it("bebas dari kebocoran kode spesifikasi teknis", () => {
    const pageContent = read("app/(main)/bank-soal/[id]/page.tsx")
    const leaks = Array.from(pageContent.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0])
    assert.deepStrictEqual(leaks, [], "Halaman editor tidak boleh membocorkan kode teknis")
  })
})
