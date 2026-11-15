import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
  calculateEffectivePhScore,
  calculateAveragePh,
  calculateAverageTasks,
  calculateCompositeDailyScore,
  calculateNAR,
  getGradePredicate,
  type DailyAssessments,
} from "../lib/rapor-utils.ts"

describe("Integrasi Alur Buku Nilai Harian Guru (PH 1-4 & Tugas)", () => {
  it("mensimulasikan input bertahap guru sepanjang semester dengan hasil akurat", () => {
    // Skenario 1: Pekan ke-2, Guru baru selesai melaksanakan PH-1
    // Santri A: N=60, R=75 (Remedial tuntas)
    // Santri B: N=88 (Tuntas tanpa remedial)
    const santriA_PH1 = { score: 60, remedial: 75 }
    const santriB_PH1 = { score: 88 }

    const dailyA_pekan2 = calculateCompositeDailyScore([santriA_PH1], [])
    const dailyB_pekan2 = calculateCompositeDailyScore([santriB_PH1], [])

    assert.equal(dailyA_pekan2, 75, "Santri A harus bernilai 75 dari hasil remedial")
    assert.equal(dailyB_pekan2, 88, "Santri B harus bernilai 88 dari nilai murni")

    // Skenario 2: Pekan ke-6, Guru menginput PH-2
    // Santri A: PH-2 dapat 85
    // Santri B: PH-2 dapat 92
    const santriA_PH2 = { score: 85 }
    const santriB_PH2 = { score: 92 }

    const assessA_pekan6: DailyAssessments = {
      ph: [santriA_PH1, santriA_PH2],
      tasks: [],
    }
    const assessB_pekan6: DailyAssessments = {
      ph: [santriB_PH1, santriB_PH2],
      tasks: [],
    }

    const dailyA_pekan6 = calculateCompositeDailyScore(assessA_pekan6.ph, assessA_pekan6.tasks)
    const dailyB_pekan6 = calculateCompositeDailyScore(assessB_pekan6.ph, assessB_pekan6.tasks)

    // Santri A: (75 + 85) / 2 = 80
    assert.equal(dailyA_pekan6, 80)
    // Santri B: (88 + 92) / 2 = 90
    assert.equal(dailyB_pekan6, 90)

    // Skenario 3: Pekan ke-10, Guru menginput nilai Tugas 1
    // Santri A dapat tugas = 90
    // Komposit = 60% PH (80) + 40% Tugas (90) = 48 + 36 = 84
    const assessA_pekan10: DailyAssessments = {
      ph: [santriA_PH1, santriA_PH2],
      tasks: [90],
    }
    const dailyA_pekan10 = calculateCompositeDailyScore(assessA_pekan10.ph, assessA_pekan10.tasks)
    assert.equal(dailyA_pekan10, 84)

    // Skenario 4: Akhir Semester, STS=80 dan SAS=86
    // NAR = (2 * daily + STS + SAS) / 4 = (2 * 84 + 80 + 86) / 4 = (168 + 166) / 4 = 334 / 4 = 83.5
    const nar = calculateNAR(dailyA_pekan10, 80, 86)
    assert.equal(nar, 83.5)
    assert.equal(getGradePredicate(nar), "B")
  })

  it("memastikan DailyAssessmentsModal bebas dari emoji dan kebocoran kode teknis", () => {
    const baseDir = process.cwd().endsWith("apps") ? process.cwd() : path.join(process.cwd(), "apps")
    const modalPath = path.resolve(baseDir, "components/rapor/DailyAssessmentsModal.tsx")
    assert.ok(fs.existsSync(modalPath), "Berkas DailyAssessmentsModal.tsx harus ada")

    const content = fs.readFileSync(modalPath, "utf-8")

    // Pengecekan emoji
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    assert.ok(!emojiRegex.test(content), "Komponen DailyAssessmentsModal tidak boleh memuat emoji")

    // Pengecekan kebocoran kode spesifikasi teknis
    const forbiddenPatterns = [
      /SCR-\d+/i,
      /[A-Z]+-FR-\d+/i,
      /[A-Z]+-AC-\d+/i,
      /TASK-\d+/i,
      /Fase\s*\d+/i,
      /\.planora/i,
    ]

    for (const pattern of forbiddenPatterns) {
      assert.ok(
        !pattern.test(content),
        `Ditemukan kebocoran kode spesifikasi teknis: ${pattern.toString()}`
      )
    }
  })

  it("memastikan skema Convex reportGrades memuat field dailyAssessments", () => {
    const baseDir = process.cwd().endsWith("apps") ? process.cwd() : path.join(process.cwd(), "apps")
    const schemaPath = path.resolve(baseDir, "convex/schema.ts")
    const schemaContent = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(
      schemaContent.includes("dailyAssessments: v.optional("),
      "Skema harus memuat dailyAssessments"
    )
    assert.ok(
      schemaContent.includes("score: v.optional(v.number())"),
      "Skema harus memuat score murni PH"
    )
    assert.ok(
      schemaContent.includes("remedial: v.optional(v.number())"),
      "Skema harus memuat remedial PH"
    )
    assert.ok(
      schemaContent.includes("tasks: v.optional(v.array(v.number()))"),
      "Skema harus memuat array tasks"
    )
  })

  it("memastikan DailyAssessmentsModal menerapkan dialog lebar dan sticky columns untuk ergonomi tabel santri", () => {
    const baseDir = process.cwd().endsWith("apps") ? process.cwd() : path.join(process.cwd(), "apps")
    const modalPath = path.resolve(baseDir, "components/rapor/DailyAssessmentsModal.tsx")
    const content = fs.readFileSync(modalPath, "utf-8")

    // Memastikan kelas dialog responsif lebar diterapkan untuk menimpa sm:max-w-sm bawaan dialog
    assert.ok(
      content.includes("sm:max-w-[96vw]") || content.includes("md:max-w-[95vw]"),
      "Modal harus menggunakan kelas dialog lebar agar tidak terpasung pada lebar sempit"
    )

    // Memastikan freeze panes / sticky columns pada No dan Daftar Santri
    assert.ok(
      content.includes("sticky left-0") && content.includes("sticky left-12"),
      "Kolom nomor dan daftar santri harus berposisi sticky di kiri agar tetap terlihat saat scroll horizontal"
    )

    // Memastikan spin buttons bawaan browser dimatikan agar rapi
    assert.ok(
      content.includes("[appearance:textfield]"),
      "Input angka harus menonaktifkan spin button bawaan agar tampilan rapi"
    )
  })
})
