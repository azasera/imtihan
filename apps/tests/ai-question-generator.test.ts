import { describe, it } from "node:test"
import assert from "node:assert/strict"

const { buildAiQuestionPrompt, generateQuickDraftByTopic } = (await import(
  new URL("../lib/ai-question-generator.ts", import.meta.url).href
)) as typeof import("../lib/ai-question-generator")

const { parseQuestionImport } = (await import(
  new URL("../lib/question-import.ts", import.meta.url).href
)) as typeof import("../lib/question-import")

describe("AI Question Generator Utilities", () => {
  it("builds a structured prompt containing instructions, topic, and thinking levels", () => {
    const prompt = buildAiQuestionPrompt({
      subjectName: "Fiqih",
      topic: "Thaharah dan Tayammum",
      gradeLevel: "Kelas 7 SMPITA",
      questionType: "multiple_choice",
      count: 5,
      thinkingLevel: "mengaplikasikan",
      additionalInstructions: "Sertakan satu soal studi kasus kontekstual.",
    })

    assert.ok(prompt.includes("Fiqih"))
    assert.ok(prompt.includes("Thaharah dan Tayammum"))
    assert.ok(prompt.includes("Kelas 7 SMPITA"))
    assert.ok(prompt.includes("5 butir soal"))
    assert.ok(prompt.includes("mengaplikasikan"))
    assert.ok(prompt.includes("Sertakan satu soal studi kasus kontekstual."))
    assert.ok(prompt.includes("B. [Pilihan B yang benar]*"))
  })

  it("generates multiple choice draft that is 100% cleanly parseable by parseQuestionImport", () => {
    const draftText = generateQuickDraftByTopic({
      subjectName: "Fiqih",
      topic: "Shalat Berjamaah",
      questionType: "multiple_choice",
      count: 3,
    })

    const parseResult = parseQuestionImport(draftText, 5)
    assert.strictEqual(parseResult.items.length, 3, "Harus menghasilkan 3 butir soal")
    assert.strictEqual(parseResult.problemCount, 0, "Draf harus bersih tanpa masalah validasi")
    assert.strictEqual(parseResult.readyCount, 3, "Semua butir harus siap simpan")
    assert.strictEqual(parseResult.items[0].type, "multiple_choice")
    assert.strictEqual(parseResult.items[0].options.length, 4)
  })

  it("generates true/false draft that is 100% cleanly parseable", () => {
    const draftText = generateQuickDraftByTopic({
      subjectName: "Aqidah",
      topic: "Rukun Iman",
      questionType: "true_false",
      count: 2,
    })

    const parseResult = parseQuestionImport(draftText, 5)
    assert.strictEqual(parseResult.items.length, 2)
    assert.strictEqual(parseResult.problemCount, 0)
    assert.strictEqual(parseResult.items[0].type, "true_false")
    assert.strictEqual(parseResult.items[0].trueFalseKey, "Benar")
  })

  it("generates essay draft that is 100% cleanly parseable", () => {
    const draftText = generateQuickDraftByTopic({
      subjectName: "Tarikh Islam",
      topic: "Hijrah ke Madinah",
      questionType: "essay",
      count: 2,
    })

    const parseResult = parseQuestionImport(draftText, 10)
    assert.strictEqual(parseResult.items.length, 2)
    assert.strictEqual(parseResult.problemCount, 0)
    assert.strictEqual(parseResult.items[0].type, "essay")
    assert.ok(parseResult.items[0].rubric.length > 0)
  })
})
