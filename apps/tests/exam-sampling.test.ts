import assert from "node:assert/strict"
import { describe, it } from "node:test"

const {
  validateQuestionComposition,
  sampleQuestionsByComposition,
  calculateNormalizedPgScore,
  calculateNormalizedEssayScore,
  calculateCompositeFinalScore,
  COMPOSITION_PRESETS,
  autoBalanceWeights,
} = (await import(
  new URL("../lib/exam-sampling.ts", import.meta.url).href
)) as typeof import("../lib/exam-sampling")

interface MockQuestion {
  _id: string
  type: "multiple_choice" | "essay" | "true_false" | "pg_kompleks"
  points: number
}

describe("Sistem Sampling Soal & Normalisasi Bobot Kategori (PG 70% & Esai 30%)", () => {
  describe("validateQuestionComposition", () => {
    it("menerima konfigurasi 20 PG (70%) dan 5 Esai (30%) saat stok mencukupi", () => {
      const result = validateQuestionComposition(
        {
          enabled: true,
          pgCount: 20,
          pgWeight: 70,
          essayCount: 5,
          essayWeight: 30,
        },
        400, // stok PG tersedia
        100  // stok Esai tersedia
      )
      assert.equal(result.valid, true)
      assert.equal(result.error, undefined)
    })

    it("menolak jika total bobot tidak sama dengan 100%", () => {
      const result = validateQuestionComposition(
        {
          enabled: true,
          pgCount: 20,
          pgWeight: 60,
          essayCount: 5,
          essayWeight: 30, // total 90%
        },
        400,
        100
      )
      assert.equal(result.valid, false)
      assert.ok(result.error?.includes("100%"))
    })

    it("menolak jika kuota PG melebihi stok yang tersedia di bank soal", () => {
      const result = validateQuestionComposition(
        {
          enabled: true,
          pgCount: 50,
          pgWeight: 70,
          essayCount: 5,
          essayWeight: 30,
        },
        30, // stok PG hanya 30
        100
      )
      assert.equal(result.valid, false)
      assert.ok(result.error?.includes("Pilihan Ganda melebihi stok"))
    })

    it("menolak jika kuota Esai melebihi stok yang tersedia di bank soal", () => {
      const result = validateQuestionComposition(
        {
          enabled: true,
          pgCount: 20,
          pgWeight: 70,
          essayCount: 15,
          essayWeight: 30,
        },
        100,
        10 // stok Esai hanya 10
      )
      assert.equal(result.valid, false)
      assert.ok(result.error?.includes("Esai melebihi stok"))
    })

    it("menerima jika mode komposisi dinonaktifkan (disabled)", () => {
      const result = validateQuestionComposition(
        {
          enabled: false,
          pgCount: 0,
          pgWeight: 0,
          essayCount: 0,
          essayWeight: 0,
        },
        0,
        0
      )
      assert.equal(result.valid, true)
    })
  })

  describe("sampleQuestionsByComposition", () => {
    // Buat koleksi 500 soal: 420 PG dan 80 Esai
    const mock500Questions: MockQuestion[] = [
      ...Array.from({ length: 420 }, (_, i) => ({
        _id: `q_pg_${i + 1}`,
        type: "multiple_choice" as const,
        points: 2,
      })),
      ...Array.from({ length: 80 }, (_, i) => ({
        _id: `q_essay_${i + 1}`,
        type: "essay" as const,
        points: 10,
      })),
    ]

    it("mengambil tepat 20 butir PG dan 5 butir Esai dari 500 butir soal", () => {
      const sampled = sampleQuestionsByComposition(
        mock500Questions,
        {
          enabled: true,
          pgCount: 20,
          pgWeight: 70,
          essayCount: 5,
          essayWeight: 30,
        },
        "test_seed_123"
      )

      assert.equal(sampled.length, 25)

      const pgSampled = sampled.filter((q) => q.type !== "essay")
      const essaySampled = sampled.filter((q) => q.type === "essay")

      assert.equal(pgSampled.length, 20)
      assert.equal(essaySampled.length, 5)

      // Pastikan tidak ada ID soal yang duplikat
      const uniqueIds = new Set(sampled.map((q) => q._id))
      assert.equal(uniqueIds.size, 25)
    })

    it("menghasilkan sampel deterministik jika diberikan seedStr yang sama", () => {
      const config = {
        enabled: true,
        pgCount: 20,
        pgWeight: 70,
        essayCount: 5,
        essayWeight: 30,
      }
      const run1 = sampleQuestionsByComposition(mock500Questions, config, "seed_tetap")
      const run2 = sampleQuestionsByComposition(mock500Questions, config, "seed_tetap")

      assert.deepEqual(
        run1.map((q) => q._id),
        run2.map((q) => q._id)
      )
    })
  })

  describe("Kalkulasi Normalisasi Skor (PG 70% & Esai 30%)", () => {
    it("menghitung skor PG maksimal 70 secara proporsional", () => {
      // 20 benar dari 20 butir -> 70.00
      assert.equal(calculateNormalizedPgScore(20, 20, 70), 70)
      // 10 benar dari 20 butir -> 35.00
      assert.equal(calculateNormalizedPgScore(10, 20, 70), 35)
      // 16 benar dari 20 butir -> 56.00
      assert.equal(calculateNormalizedPgScore(16, 20, 70), 56)
      // 0 benar -> 0
      assert.equal(calculateNormalizedPgScore(0, 20, 70), 0)
    })

    it("menghitung skor Esai maksimal 30 secara proporsional", () => {
      // Skor maksimal esai 50 poin (5 nomor x 10 poin)
      // Santri dapat 50 dari 50 -> 30.00
      assert.equal(calculateNormalizedEssayScore(50, 50, 30), 30)
      // Santri dapat 25 dari 50 -> 15.00
      assert.equal(calculateNormalizedEssayScore(25, 50, 30), 15)
      // Santri dapat 40 dari 50 -> 24.00
      assert.equal(calculateNormalizedEssayScore(40, 50, 30), 24)
      // Santri dapat 0 -> 0
      assert.equal(calculateNormalizedEssayScore(0, 50, 30), 0)
    })

    it("mengakumulasi skor komposit total menjadi skala 100", () => {
      // PG 56.00 + Esai 24.00 -> 80.00
      assert.equal(calculateCompositeFinalScore(56, 24), 80)
      // PG 70.00 + Esai 30.00 -> 100.00
      assert.equal(calculateCompositeFinalScore(70, 30), 100)
      // PG 35.00 + Esai 15.00 -> 50.00
      assert.equal(calculateCompositeFinalScore(35, 15), 50)
    })
  })

  describe("Sistem Smart Auto-Balance & Bobot Cerdas", () => {
    it("menolkan butir esai otomatis memindahkan 100% bobot ke objektif", () => {
      const res = autoBalanceWeights("essayCount", {
        pgCount: 25,
        essayCount: 5,
        pgWeight: 70,
        essayWeight: 30,
      }, 0)
      assert.equal(res.pgWeight, 100)
      assert.equal(res.essayWeight, 0)
    })

    it("menolkan butir objektif otomatis memindahkan 100% bobot ke esai", () => {
      const res = autoBalanceWeights("pgCount", {
        pgCount: 20,
        essayCount: 5,
        pgWeight: 70,
        essayWeight: 30,
      }, 0)
      assert.equal(res.pgWeight, 0)
      assert.equal(res.essayWeight, 100)
    })

    it("mengubah bobot objektif ke 80% otomatis melengkapi esai ke 20%", () => {
      const res = autoBalanceWeights("pgWeight", {
        pgCount: 20,
        essayCount: 5,
        pgWeight: 70,
        essayWeight: 30,
      }, 80)
      assert.equal(res.pgWeight, 80)
      assert.equal(res.essayWeight, 20)
    })

    it("mengubah bobot esai ke 45% otomatis melengkapi objektif ke 55%", () => {
      const res = autoBalanceWeights("essayWeight", {
        pgCount: 20,
        essayCount: 5,
        pgWeight: 70,
        essayWeight: 30,
      }, 45)
      assert.equal(res.pgWeight, 55)
      assert.equal(res.essayWeight, 45)
    })

    it("mengubah bobot esai ke 0% otomatis melengkapi objektif ke 100%", () => {
      const res = autoBalanceWeights("essayWeight", {
        pgCount: 25,
        essayCount: 0,
        pgWeight: 70,
        essayWeight: 30,
      }, 0)
      assert.equal(res.pgWeight, 100)
      assert.equal(res.essayWeight, 0)
    })

    it("COMPOSITION_PRESETS menyediakan 4 preset dan semuanya berjumlah tepat 100%", () => {
      assert.equal(COMPOSITION_PRESETS.length, 4)
      for (const p of COMPOSITION_PRESETS) {
        assert.equal(p.pgWeight + p.essayWeight, 100, `Preset ${p.id} harus total 100%`)
      }
    })
  })
})
