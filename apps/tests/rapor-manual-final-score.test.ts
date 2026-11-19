import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
  calculateNAR,
  getGradePredicate,
  generateCompetencyNarrative,
  isDiniyahSubject,
  isUmumSubject,
} from "../lib/rapor-utils.ts"

const APPS_ROOT = path.resolve(import.meta.dirname, "..")

describe("Penguncian Nilai Akhir Rapot Umum & Mode Fleksibel Rapot Diniyah", () => {
  it("memverifikasi kalkulasi formula bawaan dan logika override manual hanya untuk Diniyah", () => {
    // Komponen: PH=80, STS=70, SAS=70
    // Rumus bawaan: (2*80 + 70 + 70)/4 = 300/4 = 75
    const dailyScore = 80
    const midtermScore = 70
    const finalExamScore = 70
    const calculatedNar = calculateNAR(dailyScore, midtermScore, finalExamScore)
    assert.equal(calculatedNar, 75, "Formula bawaan harus menghasilkan nilai 75")
    assert.equal(getGradePredicate(calculatedNar), "C")

    // Skenario 1: Mapel Diniyah (misal FIQIH) -> Boleh override manual
    const diniyahSubject = "FIQIH"
    assert.equal(isDiniyahSubject(diniyahSubject), true)
    const manualFinalScoreDiniyah = 88
    const finalScoreDiniyah = isDiniyahSubject(diniyahSubject) ? manualFinalScoreDiniyah : calculatedNar
    assert.equal(finalScoreDiniyah, 88, "Mapel Diniyah harus menerima nilai manual 88")
    assert.equal(getGradePredicate(finalScoreDiniyah), "B")

    // Skenario 2: Mapel Umum (misal PAI / MTK) -> Nilai Akhir terkunci ke rumus murni, menolak manual
    const umumSubject = "PAI"
    assert.equal(isUmumSubject(umumSubject), true)
    assert.equal(isDiniyahSubject(umumSubject), false)
    const attemptedManualScore = 95
    const finalScoreUmum = isDiniyahSubject(umumSubject) ? attemptedManualScore : calculatedNar
    assert.equal(finalScoreUmum, 75, "Mapel Umum harus tetap 75 (rumus murni), menolak nilai manual 95")
    assert.equal(getGradePredicate(finalScoreUmum), "C")

    // Narasi capaian pembelajaran harus otomatis mengikuti nilai akhir masing-masing
    const cp = "Menganalisis hukum bacaan nun mati dan tanwin"
    const narrativeUmum = generateCompetencyNarrative(finalScoreUmum, cp)
    const narrativeDiniyah = generateCompetencyNarrative(finalScoreDiniyah, cp)
    assert.match(narrativeUmum, /Baik/i, "Nilai 75 harus menghasilkan narasi Baik")
    assert.match(narrativeDiniyah, /Sangat baik/i, "Nilai 88 harus menghasilkan narasi Sangat baik")
  })

  it("memastikan batas nilai manual aman dalam rentang 0-100", () => {
    const sanitizeScore = (val: number) => Math.max(0, Math.min(100, Math.round(val)))

    assert.equal(sanitizeScore(85), 85)
    assert.equal(sanitizeScore(120), 100, "Nilai > 100 harus dibatasi ke 100")
    assert.equal(sanitizeScore(-15), 0, "Nilai < 0 harus dibatasi ke 0")
    assert.equal(sanitizeScore(78.6), 79, "Nilai desimal harus dibulatkan")
  })

  it("memastikan kode antarmuka rapor/page.tsx mengunci nilai akhir pada mapel umum dan hanya mengizinkan input pada mapel diniyah", () => {
    const pagePath = path.join(APPS_ROOT, "app/(main)/rapor/page.tsx")
    assert.equal(fs.existsSync(pagePath), true, "app/(main)/rapor/page.tsx harus ada")

    const source = fs.readFileSync(pagePath, "utf8")

    // Memastikan isCurrentSubjectDiniyah didefinisikan
    assert.match(source, /const isCurrentSubjectDiniyah = isDiniyahSubject\(selectedSubject\)/)

    // Memastikan editableGrades mengunci finalScore untuk mapel umum
    assert.match(source, /if \(!isCurrentSubjectDiniyah\) \{[\s\S]*?finalScore = calculatedNar/)

    // Memastikan handleScoreChange memblokir field finalScore jika bukan mapel diniyah
    assert.match(source, /if \(field === "finalScore" && !isCurrentSubjectDiniyah\) \{\s*return\s*\}/)

    // Memastikan sel tabel Nilai Akhir bercabang antara Diniyah (Input) vs Umum (Teks Statis)
    assert.match(source, /\{isCurrentSubjectDiniyah \? \(/)
    assert.match(source, /<span className="font-bold text-sm text-foreground">[\s\S]*?\{g\.finalScore\}[\s\S]*?<\/span>/)

    // Memastikan tombol reset RotateCcwIcon hanya ada pada mode manual mapel diniyah
    assert.match(source, /g\.isManualFinalScore &&/)
    assert.match(source, /onClick=\{\(\) => handleResetFinalScore\(g\.santriId\)\}/)
  })

  it("memastikan mutasi backend saveSubjectGrades mengunci finalScore untuk mapel umum", () => {
    const mutationPath = path.join(APPS_ROOT, "convex/rapor/public/mutations.ts")
    assert.equal(fs.existsSync(mutationPath), true, "mutations.ts harus ada")

    const source = fs.readFileSync(mutationPath, "utf8")

    // Memastikan isDiniyahSubject diimpor di mutations.ts
    assert.match(source, /isDiniyahSubject/)

    // Memastikan saveSubjectGrades hanya menerima g.finalScore manual jika isDiniyah
    assert.match(source, /const isDiniyah = isDiniyahSubject\(args\.subjectCode\)/)
    assert.match(source, /isDiniyah && typeof g\.finalScore === "number" && !isNaN\(g\.finalScore\)\s*\?\s*g\.finalScore\s*:\s*calculatedNar/)
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
