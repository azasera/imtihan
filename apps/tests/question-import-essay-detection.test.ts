import assert from "node:assert/strict"
import { describe, it } from "node:test"

const {
  convertNoOptionItemsToEssay,
  parseQuestionImport,
  setItemType,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

describe("Question Import - Essay Detection and Type Switching", () => {
  const sampleEssayText = `1. Sebutkan organ-organ utama yang menyusun saluran pencernaan manusia secara berurutan mulai dari rongga mulut hingga anus!
2. Jelaskan fungsi enzim ptialin (amilase) yang terdapat di dalam rongga mulut dalam proses pencernaan karbohidrat!
3. Lambung menghasilkan asam klorida (HCl). Jelaskan minimal dua fungsi penting asam lambung dalam proses pencernaan makanan!
4. Mengapa usus halus memiliki struktur berupa vili (jonjot usus) dan mikrovili? Jelaskan kaitannya dengan fungsi penyerapan sari-sari makanan!
5. Jelaskan perbedaan proses pencernaan mekanik dan pencernaan kimiawi, serta sebutkan contoh terjadinya kedua proses tersebut di dalam tubuh!`

  it("parses numbered questions directly as essay when defaultType is 'essay' without needing '(essay)' text marker", () => {
    const result = parseQuestionImport(sampleEssayText, 5, "essay")

    assert.equal(result.items.length, 5)
    for (const item of result.items) {
      assert.equal(item.type, "essay", `Item #${item.number} should have type 'essay'`)
      assert.equal(item.options.length, 0, `Item #${item.number} should have no options`)
      assert.deepEqual(item.problems, [], `Item #${item.number} should have zero problems`)
    }
  })

  it("setItemType changes an item to essay and clears option-missing problems", () => {
    // If parsed as multiple_choice by default
    const result = parseQuestionImport(sampleEssayText, 5, "multiple_choice")
    assert.equal(result.items.length, 5)

    const firstItem = result.items[0]
    assert.equal(firstItem.type, "multiple_choice")
    assert.ok(firstItem.problems.length > 0, "Should have option-related problems as multiple choice")

    // Switch type to essay
    const converted = setItemType(firstItem, "essay")
    assert.equal(converted.type, "essay")
    assert.deepEqual(converted.problems, [], "Problems should be cleared when converted to essay")
  })

  it("convertNoOptionItemsToEssay converts all multiple choice items without options into ready essay items", () => {
    const result = parseQuestionImport(sampleEssayText, 5, "multiple_choice")
    assert.equal(result.items.every(it => it.type === "multiple_choice"), true)

    const convertedList = convertNoOptionItemsToEssay(result.items)
    assert.equal(convertedList.length, 5)
    for (const item of convertedList) {
      assert.equal(item.type, "essay")
      assert.deepEqual(item.problems, [])
    }
  })

  it("convertNoOptionItemsToEssay preserves genuine multiple choice items that have options", () => {
    const mixedText = `1. Ibu kota Indonesia adalah...
A. Bandung
B. Jakarta *
C. Surabaya
D. Medan

2. Jelaskan proses terjadinya fotosintesis pada tumbuhan!`

    const result = parseQuestionImport(mixedText, 5, "multiple_choice")
    assert.equal(result.items.length, 2)
    assert.equal(result.items[0].options.length, 4)
    assert.equal(result.items[1].options.length, 0)

    const converted = convertNoOptionItemsToEssay(result.items)
    assert.equal(converted[0].type, "multiple_choice")
    assert.equal(converted[0].options.length, 4)
    assert.equal(converted[1].type, "essay")
    assert.equal(converted[1].options.length, 0)
    assert.deepEqual(converted[1].problems, [])
  })
})
