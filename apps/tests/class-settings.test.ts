import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

describe("Fitur Pengaturan Wali Kelas & Tanggal Dokumen Rapor", () => {
  it("memastikan skema Convex mendefinisikan tabel classSettings dengan indeks yang sesuai", () => {
    const schemaSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/schema.ts"),
      "utf8"
    )

    assert.match(schemaSource, /classSettings:\s*defineTable/)
    assert.match(schemaSource, /homeroomTeacherName:\s*v\.string\(\)/)
    assert.match(schemaSource, /homeroomTeacherNiy:\s*v\.string\(\)/)
    assert.match(schemaSource, /reportDate:\s*v\.string\(\)/)
    assert.match(schemaSource, /principalName:\s*v\.optional\(v\.string\(\)\)/)
    assert.match(schemaSource, /principalNiy:\s*v\.optional\(v\.string\(\)\)/)
    assert.match(schemaSource, /by_class_and_period/)
    assert.match(schemaSource, /by_period/)
  })

  it("memverifikasi fungsi mutasi dan kueri pengaturan kelas tersedia di Convex", () => {
    const mutationsSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/rapor/public/mutations.ts"),
      "utf8"
    )
    const queriesSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/rapor/public/queries.ts"),
      "utf8"
    )

    // Mutations
    assert.match(mutationsSource, /export const saveClassSetting/)
    assert.match(mutationsSource, /export const batchApplyDateAndPrincipal/)

    // Queries
    assert.match(queriesSource, /export const getClassSettings/)
    assert.match(queriesSource, /export const getAllClassSettings/)
    assert.match(queriesSource, /classSetting:\s*\{/)
  })

  it("memverifikasi komponen modal ClassSettingsModal tersedia dengan judul resmi dan bebas emoji", () => {
    const modalPath = path.join(APPS_ROOT, "components/rapor/ClassSettingsModal.tsx")
    assert.equal(fs.existsSync(modalPath), true, "ClassSettingsModal.tsx harus ada")

    const modalSource = fs.readFileSync(modalPath, "utf8")

    // Judul resmi sesuai permintaan pengguna
    assert.match(modalSource, /Pengaturan Wali Kelas & Tanggal Dokumen/)
    assert.match(modalSource, /Nama Wali Kelas/)
    assert.match(modalSource, /NIY \/ NIP Wali Kelas/)
    assert.match(modalSource, /Tanggal Dokumen Rapor/)
    assert.match(modalSource, /Terapkan ke Semua Kelas/)
    assert.match(modalSource, /Penandatangan Kepala Sekolah/)

    // Zero emoji check
    const emojiRegex = /\p{Extended_Pictographic}/u
    assert.equal(
      emojiRegex.test(modalSource),
      false,
      "ClassSettingsModal.tsx tidak boleh memuat emoji."
    )
  })

  it("memverifikasi integrasi modal dan data pengaturan kelas di halaman rapor/page.tsx", () => {
    const pageSource = fs.readFileSync(
      path.join(APPS_ROOT, "app/(main)/rapor/page.tsx"),
      "utf8"
    )

    // Tombol pemicu
    assert.match(pageSource, /Pengaturan Wali Kelas & Tanggal Dokumen/)
    assert.match(pageSource, /ClassSettingsModal/)
    assert.match(pageSource, /isClassSettingsModalOpen/)

    // Props dinamis dikirimkan ke ReportCardPrintView
    assert.match(pageSource, /homeroomTeacherName=\{singleReport\.classSetting\?\.homeroomTeacherName\}/)
    assert.match(pageSource, /homeroomTeacherNiy=\{singleReport\.classSetting\?\.homeroomTeacherNiy\}/)
    assert.match(pageSource, /reportDate=\{singleReport\.classSetting\?\.reportDate\}/)
    assert.match(pageSource, /principalName=\{singleReport\.classSetting\?\.principalName\}/)
    assert.match(pageSource, /principalNiy=\{singleReport\.classSetting\?\.principalNiy\}/)
  })

  it("memastikan seluruh berkas baru bebas dari kebocoran kode spesifikasi teknis", () => {
    const filesToCheck = [
      path.join(APPS_ROOT, "components/rapor/ClassSettingsModal.tsx"),
      path.join(APPS_ROOT, "app/(main)/rapor/page.tsx"),
    ]

    const specLeakRegex =
      /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, "utf8")
      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) {
          continue
        }
        const match = specLeakRegex.exec(line)
        assert.equal(
          match,
          null,
          `Ditemukan kebocoran kode spesifikasi teknis '${match?.[0]}' pada ${path.basename(filePath)} baris ${i + 1}`
        )
      }
    }
  })
})
