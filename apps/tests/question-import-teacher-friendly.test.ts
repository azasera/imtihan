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

describe("Antarmuka Tempel Naskah Soal Massal Ramah Pengajar", () => {
  it("panel impor memuat panduan 3 langkah cepat", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    assert.ok(panelSource.includes("Siapkan Naskah"), "Harus ada langkah 1 Siapkan Naskah")
    assert.ok(panelSource.includes("Tempel ke Kolom"), "Harus ada langkah 2 Tempel ke Kolom")
    assert.ok(panelSource.includes("Periksa & Simpan"), "Harus ada langkah 3 Periksa & Simpan")
  })

  it("panel impor memuat 2 kartu pilihan sumber naskah (Word dan Excel)", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    // Pilihan Word
    assert.ok(panelSource.includes("Naskah Dokumen Word / Teks"), "Harus ada kartu sumber Word")
    assert.ok(panelSource.includes("Salin contoh format"), "Harus ada tombol salin contoh format Word")

    // Pilihan Excel
    assert.ok(panelSource.includes("Tabel Excel / Spreadsheet"), "Harus ada kartu sumber Excel")
    assert.ok(panelSource.includes("Unduh template kolom"), "Harus ada tombol unduh template kolom Excel")
  })

  it("panel impor menyediakan tombol latihan langsung untuk guru baru", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    assert.ok(
      panelSource.includes("Isi Contoh Latihan Langsung"),
      "Harus ada tombol cepat untuk mengisi contoh latihan"
    )
  })

  it("menyediakan tombol periksa tulisan cepat di toolbar atas textarea tanpa perlu scroll", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    // Tombol periksa tulisan di toolbar atas textarea
    assert.ok(
      panelSource.includes("Periksa tulisan"),
      "Harus ada tombol periksa tulisan"
    )
    assert.ok(
      panelSource.includes("Ctrl+Enter"),
      "Harus ada penanda pintasan keyboard Ctrl+Enter"
    )
  })

  it("menyediakan aksi cepat periksa naskah di zona unggah berkas saat teks terisi", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    assert.ok(
      panelSource.includes("Periksa naskah"),
      "Zona berkas harus menyediakan tombol periksa naskah instan saat berkas dimuat"
    )
  })

  it("mendukung pintasan keyboard Ctrl+Enter pada textarea", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    assert.ok(
      panelSource.includes("onKeyDown"),
      "Textarea harus memiliki penangan onKeyDown"
    )
    assert.ok(
      panelSource.includes("ctrlKey") && panelSource.includes("metaKey"),
      "Penangan onKeyDown harus mendukung kombinasi Ctrl atau Meta (Cmd) + Enter"
    )
  })

  it("memiliki card footer dengan posisi sticky agar aksi selalu terjangkau saat menggulir", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    assert.ok(
      panelSource.includes("sticky bottom-0"),
      "CardFooter harus memiliki posisi sticky bottom-0"
    )
  })

  it("bebas dari kode spesifikasi teknis dan emoji", () => {
    const panelSource = read("components/bank-soal/question-import-panel.tsx")

    const leaks = Array.from(panelSource.matchAll(TECHNICAL_LEAK_REGEX)).map((m) => m[0])
    assert.deepStrictEqual(leaks, [], "Panel impor tidak boleh membocorkan kode teknis")

    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    assert.ok(!emojiRegex.test(panelSource), "Panel impor tidak boleh menggunakan emoji")
  })
})
