import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

describe("Komponen & Tampilan E-Rapor At-Tauhid", () => {
  it("memastikan berkas komponen KOP SiPAKSa dan Lembar Cetak Rapor tersedia", () => {
    const letterheadPath = path.join(APPS_ROOT, "components/rapor/RaporLetterhead.tsx")
    const printViewPath = path.join(APPS_ROOT, "components/rapor/ReportCardPrintView.tsx")
    const pagePath = path.join(APPS_ROOT, "app/(main)/rapor/page.tsx")

    assert.equal(fs.existsSync(letterheadPath), true, "RaporLetterhead.tsx harus ada")
    assert.equal(fs.existsSync(printViewPath), true, "ReportCardPrintView.tsx harus ada")
    assert.equal(fs.existsSync(pagePath), true, "rapor/page.tsx harus ada")
  })

  it("memverifikasi KOP SiPAKSa mencantumkan Yayasan dan Lembaga resmi secara dinamis", () => {
    const letterheadSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/rapor/RaporLetterhead.tsx"),
      "utf8"
    )

    // Memastikan KOP memanggil getInstitutionHeader dan getInstitutionLogos
    assert.match(letterheadSource, /getInstitutionHeader/)
    assert.match(letterheadSource, /getInstitutionLogos/)
    assert.match(letterheadSource, /header\.foundation/)
    assert.match(letterheadSource, /header\.institutionName/)
    assert.match(letterheadSource, /header\.city/)
    assert.match(letterheadSource, /logos\.leftLogo/)
    assert.match(letterheadSource, /logos\.rightLogo/)
  })

  it("memastikan lembar cetak rapor mendukung dua format (Umum Kurmer dan Diniyah) serta periode STS dan SAS", () => {
    const printViewSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/rapor/ReportCardPrintView.tsx"),
      "utf8"
    )

    // Format umum
    assert.match(printViewSource, /Laporan Hasil Sumatif Akhir Semester/)
    assert.match(printViewSource, /Laporan Hasil Sumatif Tengah Semester/)
    assert.match(printViewSource, /Kurikulum Merdeka/)
    assert.match(printViewSource, /Penguatan Karakter Profil Pelajar Pancasila/)

    // Format diniyah & tahfidz
    assert.match(printViewSource, /Laporan Hasil Sumatif Diniyah & Tahfidz/)
    assert.match(printViewSource, /Kurikulum Kepesantrenan At-Tauhid/)
    assert.match(printViewSource, /Hadits Arba['']in/)

    // Dukungan periode STS dan SAS
    assert.match(printViewSource, /period === "STS"/)
    assert.match(printViewSource, /period === "SAS"/)
  })

  it("memastikan modul unduh PDF & ZIP rapor tersedia dengan fungsi ekspor lengkap", () => {
    const pdfLibPath = path.join(APPS_ROOT, "lib/rapor-pdf.ts")
    assert.equal(fs.existsSync(pdfLibPath), true, "lib/rapor-pdf.ts harus ada")

    const pdfLibSource = fs.readFileSync(pdfLibPath, "utf8")
    assert.match(pdfLibSource, /exportSingleReportPdf/)
    assert.match(pdfLibSource, /exportSeparatedReportsZip/)
    assert.match(pdfLibSource, /exportCombinedReportsPdf/)
    assert.match(pdfLibSource, /sanitizeFilename/)
  })

  it("memastikan halaman E-Rapor menyertakan tombol aksi unduh PDF single, ZIP kelas, dan cetak batch", () => {
    const pageSource = fs.readFileSync(
      path.join(APPS_ROOT, "app/(main)/rapor/page.tsx"),
      "utf8"
    )

    // Filter periode STS / SAS
    assert.match(pageSource, /STS \(Tengah Semester\)/)
    assert.match(pageSource, /SAS \(Akhir Semester\)/)

    // Tombol Cetak & Unduh
    assert.match(pageSource, /Cetak 1 Kelas Sekaligus/)
    assert.match(pageSource, /Unduh PDF Santri/)
    assert.match(pageSource, /Unduh ZIP Kelas \(File Terpisah\)/)
    assert.match(pageSource, /Unduh 1 PDF Kelas \(Gabungan\)/)
  })

  it("memastikan navigasi bilah sisi (AppSidebar) menyertakan tautan E-Rapor", () => {
    const sidebarSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/app-sidebar.tsx"),
      "utf8"
    )

    assert.match(sidebarSource, /title:\s*"E-Rapor"/i)
    assert.match(sidebarSource, /url:\s*"\/rapor"/i)
  })

  it("memastikan seluruh berkas modul E-Rapor bebas emoji dan nol kebocoran kode spesifikasi teknis", () => {
    const filesToCheck = [
      path.join(APPS_ROOT, "lib/rapor-utils.ts"),
      path.join(APPS_ROOT, "lib/rapor-pdf.ts"),
      path.join(APPS_ROOT, "components/rapor/RaporLetterhead.tsx"),
      path.join(APPS_ROOT, "components/rapor/ReportCardPrintView.tsx"),
      path.join(APPS_ROOT, "app/(main)/rapor/page.tsx"),
    ]

    // Unicode Extended Pictographic specifically targets emojis
    const emojiRegex = /\p{Extended_Pictographic}/u

    const specLeakRegex =
      /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/

    for (const filePath of filesToCheck) {
      const content = fs.readFileSync(filePath, "utf8")

      // Cek emoji
      assert.equal(
        emojiRegex.test(content),
        false,
        `Berkas ${path.basename(filePath)} tidak boleh memuat emoji.`
      )

      // Cek kebocoran teknis pada teks UI non-komentar
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
          `Kebocoran kode teknis "${match?.[0]}" ditemukan di ${path.basename(filePath)} baris ${i + 1}`
        )
      }
    }
  })
})
