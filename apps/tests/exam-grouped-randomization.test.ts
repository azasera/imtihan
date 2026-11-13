import assert from "node:assert/strict"
import { describe, it } from "node:test"

const { groupAndShuffleQuestions } = (await import(
  new URL("../lib/question-randomization.ts", import.meta.url).href
)) as typeof import("../lib/question-randomization")

interface MockQuestion {
  _id: string
  orderNumber: number
  type: "multiple_choice" | "essay" | "true_false" | "pg_kompleks"
  questionText: string
}

describe("Pengacakan Butir Soal Terkelompok (Grouped Question Randomization)", () => {
  // Simulasi paket soal persis seperti milik pengguna: 20 PG (nomor 1-20) dan 5 Essay (nomor 21-25)
  const mockBank: MockQuestion[] = [
    ...Array.from({ length: 20 }, (_, i) => ({
      _id: `q_pg_${i + 1}`,
      orderNumber: i + 1,
      type: "multiple_choice" as const,
      questionText: `Soal PG Nomor ${i + 1}`,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      _id: `q_essay_${i + 21}`,
      orderNumber: i + 21,
      type: "essay" as const,
      questionText: `Soal Esai Nomor ${i + 21}`,
    })),
  ]

  it("saat pengacakan nonaktif, soal terurut tepat sesuai orderNumber asli", () => {
    const ordered = groupAndShuffleQuestions(mockBank, "student_1", false)

    assert.equal(ordered.length, 25)
    for (let i = 0; i < 25; i++) {
      assert.equal(ordered[i].orderNumber, i + 1)
    }
    // 20 pertama PG, 5 terakhir Essay
    assert.ok(ordered.slice(0, 20).every((q) => q.type === "multiple_choice"))
    assert.ok(ordered.slice(20, 25).every((q) => q.type === "essay"))
  })

  it("saat pengacakan aktif, soal PG selalu berada di nomor 1-20 dan soal Essay selalu di nomor 21-25", () => {
    const shuffled = groupAndShuffleQuestions(mockBank, "student_test_123", true)

    assert.equal(shuffled.length, 25)

    // Indeks 0 s.d. 19 (soal nomor 1 s.d. 20) SELALU soal objektif/PG
    const first20 = shuffled.slice(0, 20)
    assert.equal(first20.every((q) => q.type === "multiple_choice"), true)

    // Indeks 20 s.d. 24 (soal nomor 21 s.d. 25) SELALU soal Esai
    const last5 = shuffled.slice(20, 25)
    assert.equal(last5.every((q) => q.type === "essay"), true)

    // Buktikan pengacakan benar-benar terjadi di dalam kelompok masing-masing (urutan tidak 100% sama dengan aslinya)
    const isPgShuffled = first20.some((q, idx) => q.orderNumber !== idx + 1)
    assert.ok(isPgShuffled, "Kelompok soal PG harus teracak")
  })

  it("pengacakan bersifat deterministik dan tahan refresh untuk santri yang sama", () => {
    const firstCall = groupAndShuffleQuestions(mockBank, "participant_santri_ali", true)
    const secondCall = groupAndShuffleQuestions(mockBank, "participant_santri_ali", true)

    assert.deepEqual(
      firstCall.map((q) => q._id),
      secondCall.map((q) => q._id),
      "Urutan soal harus identik untuk santri yang sama saat refresh halaman"
    )
  })

  it("santri yang berbeda mendapatkan urutan acak yang bervariasi namun tetap terkelompok", () => {
    const santriA = groupAndShuffleQuestions(mockBank, "participant_santri_A", true)
    const santriB = groupAndShuffleQuestions(mockBank, "participant_santri_B", true)

    // Keduanya tetap menjamin 20 pertama PG dan 5 terakhir Essay
    assert.ok(santriA.slice(0, 20).every((q) => q.type === "multiple_choice"))
    assert.ok(santriA.slice(20, 25).every((q) => q.type === "essay"))

    assert.ok(santriB.slice(0, 20).every((q) => q.type === "multiple_choice"))
    assert.ok(santriB.slice(20, 25).every((q) => q.type === "essay"))

    // Namun urutan antar santri berbeda
    const isDifferent = santriA.some((q, idx) => q._id !== santriB[idx]._id)
    assert.ok(isDifferent, "Urutan butir soal santri A dan B harus berbeda")
  })

  it("menangani paket yang hanya berisi soal esai atau hanya soal pilihan ganda", () => {
    const onlyEssay = mockBank.filter((q) => q.type === "essay")
    const shuffledEssay = groupAndShuffleQuestions(onlyEssay, "student_x", true)
    assert.equal(shuffledEssay.length, 5)
    assert.ok(shuffledEssay.every((q) => q.type === "essay"))

    const onlyPg = mockBank.filter((q) => q.type === "multiple_choice")
    const shuffledPg = groupAndShuffleQuestions(onlyPg, "student_y", true)
    assert.equal(shuffledPg.length, 20)
    assert.ok(shuffledPg.every((q) => q.type === "multiple_choice"))
  })
})
