import { describe, it } from "node:test"
import assert from "node:assert/strict"

const { playIntegrityAlert } = (await import(
  new URL("../lib/audio-alert.ts", import.meta.url).href
)) as typeof import("../lib/audio-alert")

describe("Audio Alert for Exam Integrity", () => {
  it("safely handles server-side / node environment without throwing", () => {
    // Di lingkungan Node / SSR, window tidak ada
    const result = playIntegrityAlert()
    assert.strictEqual(result, false, "harus mengembalikan false tanpa melempar pengecualian")
  })

  it("handles custom options gracefully", () => {
    const result = playIntegrityAlert({
      frequency: 500,
      duration: 0.3,
      volume: 0.5,
    })
    assert.strictEqual(typeof result, "boolean")
  })
})
