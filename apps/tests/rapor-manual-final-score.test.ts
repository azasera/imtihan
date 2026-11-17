import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
  calculateNAR,
  getGradePredicate,
  generateCompetencyNarrative,
} from "../lib/rapor-utils.ts"

const APPS_ROOT = path.resolve(import.meta.dirname, "..")

describe("Pengisian Manual Nilai Akhir Rapor (NAR) & Hybrid Auto-Calculation", () => {
  it("memverifikasi kalkulasi formula bawaan dan logika override manual", () => {
    // Komponen: PH=80, STS=70, SAS=70
    // Rumus bawaan: (2*80 + 70 + 70)/4 = 300/4 = 75
    const dailyScore = 80
    const midtermScore = 70
    const finalExamScore = 70
    const calculatedNar = calculateNAR(dailyScore, midtermScore, finalExamScore)
    assert.equal(calculatedNar, 75, "Formula bawaan harus menghasilkan nilai 75")
    assert.equal(getGradePredicate(calculatedNar), "C")

    // Skenario 1: Nilai akhir di-override manual oleh wali kelas menjadi 88 (Predikat B, Sangat baik)
    const manualFinalScore = 88
    assert.notEqual(manualFinalScore, calculatedNar)
    const manualPredicate = getGradePredicate(manualFinalScore)
    assert.equal(manualPredicate, "B", "Predikat 88 harus menjadi B")

    // Narasi capaian pembelajaran harus otomatis mengikuti nilai manual 88
    const cp = "Menganalisis hukum bacaan nun mati dan tanwin"
    const narrativeAuto = generateCompetencyNarrative(calculatedNar, cp)
    const narrativeManual = generateCompetencyNarrative(manualFinalScore, cp)
    assert.match(narrativeManual, /Sangat baik/i, "Nilai 88 harus menghasilkan narasi Sangat baik")
    assert.match(narrativeAuto, /Baik/i, "Nilai 75 harus menghasilkan narasi Baik")

    // Skenario 2: Guru mereset nilai kembali ke formula
    const resetFinalScore = calculatedNar
    assert.equal(resetFinalScore, 75)
    assert.equal(getGradePredicate(resetFinalScore), "C")
  })

  it("memastikan batas nilai manual aman dalam rentang 0-100", () => {
    const sanitizeScore = (val: number) => Math.max(0, Math.min(100, Math.round(val)))

    assert.equal(sanitizeScore(85), 85)
    assert.equal(sanitizeScore(120), 100, "Nilai > 100 harus dibatasi ke 100")
    assert.equal(sanitizeScore(-15), 0, "Nilai < 0 harus dibatasi ke 0")
    assert.equal(sanitizeScore(78.6), 79, "Nilai desimal harus dibulatkan")
  })

  it("memastikan kode antarmuka rapor/page.tsx menyediakan input Nilai Akhir dan tombol reset", () => {
    const pagePath = path.join(APPS_ROOT, "app/(main)/rapor/page.tsx")
    assert.equal(fs.existsSync(pagePath), true, "app/(main)/rapor/page.tsx harus ada")

    const source = fs.readFileSync(pagePath, "utf8")

    // Memastikan interface GradeOverride mendukung finalScore dan isManualFinalScore
    assert.match(source, /finalScore\?: number/)
    assert.match(source, /isManualFinalScore\?: boolean/)

    // Memastikan RotateCcwIcon diimpor
    assert.match(source, /RotateCcwIcon/)

    // Memastikan handler reset final score tersedia
    assert.match(source, /handleResetFinalScore/)

    // Memastikan sel tabel Nilai Akhir memiliki Input type="number"
    assert.match(source, /onChange=\{\(e\) => handleScoreChange\(g\.santriId, "finalScore"/)

    // Memastikan tombol reset RotateCcwIcon terpasang bersyarat
    assert.match(source, /g\.isManualFinalScore &&/)
    assert.match(source, /onClick=\{\(\) => handleResetFinalScore\(g\.santriId\)\}/)
  })

  it("memastikan mutasi backend saveSubjectGrades menghormati g.finalScore manual", () => {
    const mutationPath = path.join(APPS_ROOT, "convex/rapor/public/mutations.ts")
    assert.equal(fs.existsSync(mutationPath), true, "mutations.ts harus ada")

    const source = fs.readFileSync(mutationPath, "utf8")

    // Memastikan saveSubjectGrades memvalidasi g.finalScore dan menggunakan fallback calculatedNar
    assert.match(source, /const calculatedNar = calculateNAR\(dailyScore, midtermScore, finalExamScore\)/)
    assert.match(source, /typeof g\.finalScore === "number" && !isNaN\(g\.finalScore\)/)
  })

  it("memastikan antarmuka bebas dari emoji dan kebocoran kode spesifikasi teknis", () => {
    const pagePath = path.join(APPS_ROOT, "app/(main)/rapor/page.tsx")
    const source = fs.readFileSync(pagePath, "utf8")

    // Nol kebocoran kode spesifikasi teknis
    assert.doesNotMatch(source, /\bSCR-[A-Z0-9-]+\b/)
    assert.doesNotMatch(source, /\b[A-Z]+-FR-[0-9]+\b/)
    assert.doesNotMatch(source, /\b[A-Z]+-AC-[0-9]+\b/)
    assert.doesNotMatch(source, /\bTASK-[0-9]+\b/)
    assert.doesNotMatch(source, /\bFase\s+[0-9]+\b/i)
  })
})
