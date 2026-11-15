import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  calculateEffectivePhScore,
  calculateAveragePh,
  calculateAverageTasks,
  calculateCompositeDailyScore,
  type DailyAssessmentPh,
} from "../lib/rapor-utils.ts"

describe("Kalkulasi Buku Nilai Harian Guru (PH & Tugas)", () => {
  it("calculateEffectivePhScore mengembalikan nilai murni jika tidak ada remedial", () => {
    assert.equal(calculateEffectivePhScore(85, undefined), 85)
    assert.equal(calculateEffectivePhScore(70, null as any), 70)
    assert.equal(calculateEffectivePhScore(undefined, undefined), null)
  })

  it("calculateEffectivePhScore mengutamakan nilai remedial bila tersedia", () => {
    // Remedial menggantikan nilai murni jika remedial diisi
    assert.equal(calculateEffectivePhScore(55, 75), 75)
    assert.equal(calculateEffectivePhScore(60, 80), 80)
    // Jika remedial 0 atau undefined, tetap pakai nilai murni
    assert.equal(calculateEffectivePhScore(75, 0), 75)
  })

  it("calculateAveragePh membagi secara dinamis hanya untuk PH yang sudah diisi", () => {
    // Baru PH 1 diisi
    const phs1: DailyAssessmentPh[] = [{ score: 80 }]
    assert.equal(calculateAveragePh(phs1), 80)

    // PH 1 dan PH 2 diisi (80 dan 90), PH 3 & 4 belum ada -> Rata-rata 85 (bukan dibagi 4)
    const phs2: DailyAssessmentPh[] = [
      { score: 80 },
      { score: 90 },
      { score: undefined },
      { score: undefined },
    ]
    assert.equal(calculateAveragePh(phs2), 85)

    // Termasuk remedial pada salah satu PH
    const phs3: DailyAssessmentPh[] = [
      { score: 60, remedial: 75 }, // efektif 75
      { score: 85 },               // efektif 85
    ]
    assert.equal(calculateAveragePh(phs3), 80)

    // Kosong sama sekali
    assert.equal(calculateAveragePh([]), 0)
    assert.equal(calculateAveragePh(undefined), 0)
  })

  it("calculateAverageTasks membagi hanya tugas yang terisi", () => {
    assert.equal(calculateAverageTasks([80, 90]), 85)
    assert.equal(calculateAverageTasks([80, undefined, undefined]), 80)
    assert.equal(calculateAverageTasks([]), 0)
    assert.equal(calculateAverageTasks(undefined), 0)
  })

  it("calculateCompositeDailyScore menghitung gabungan PH dan Tugas secara proporsional", () => {
    // Kasus 1: Hanya PH yang terisi (100% PH)
    const phsOnly: DailyAssessmentPh[] = [{ score: 80 }, { score: 90 }]
    assert.equal(calculateCompositeDailyScore(phsOnly, []), 85)
    assert.equal(calculateCompositeDailyScore(phsOnly, undefined), 85)

    // Kasus 2: Hanya Tugas yang terisi (100% Tugas)
    assert.equal(calculateCompositeDailyScore([], [80, 90]), 85)

    // Kasus 3: Keduanya terisi (60% PH + 40% Tugas)
    // Rata-rata PH = 80, Rata-rata Tugas = 90
    // Komposit = 0.6 * 80 + 0.4 * 90 = 48 + 36 = 84
    assert.equal(
      calculateCompositeDailyScore([{ score: 80 }], [90]),
      84
    )

    // Kasus 4: Keduanya kosong
    assert.equal(calculateCompositeDailyScore([], []), 0)
  })
})
