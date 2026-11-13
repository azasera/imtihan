import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

function getDeclaredTokenCharacters(): string {
  const helpersContent = read("convex/examSession/private/helpers.ts")
  const match = helpersContent.match(/export const TOKEN_CHARACTERS\s*=\s*"([^"]+)"/)
  assert.ok(match, "TOKEN_CHARACTERS must be declared in helpers.ts")
  return match[1]
}

const TOKEN_CHARACTERS = getDeclaredTokenCharacters()

const TECHNICAL_LEAK_REGEX =
  /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/

function read(relativePath: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relativePath), "utf-8")
}

function assertNoTechnicalLeak(relativePath: string): void {
  const leaks = read(relativePath)
    .split("\n")
    .map((text, index) => ({ line: index + 1, text }))
    .filter(({ text }) => !text.includes("//") && !text.includes("data-testid"))
    .flatMap(({ line, text }) => {
      const match = text.match(TECHNICAL_LEAK_REGEX)
      return match ? [{ line, match: match[0] }] : []
    })

  assert.deepEqual(
    leaks,
    [],
    `Technical specification leak in ${relativePath}: ${JSON.stringify(leaks)}`
  )
}

describe("Penyempurnaan Token Ujian: Karakter Bersih Non-Ambigu", () => {
  it("excludes ambiguous characters 0, 1, 8, O, I, L, B from TOKEN_CHARACTERS", () => {
    assert.equal(TOKEN_CHARACTERS.includes("0"), false, "Must not include 0")
    assert.equal(TOKEN_CHARACTERS.includes("1"), false, "Must not include 1")
    assert.equal(TOKEN_CHARACTERS.includes("8"), false, "Must not include 8")
    assert.equal(TOKEN_CHARACTERS.includes("O"), false, "Must not include O")
    assert.equal(TOKEN_CHARACTERS.includes("I"), false, "Must not include I")
    assert.equal(TOKEN_CHARACTERS.includes("L"), false, "Must not include L")
    assert.equal(TOKEN_CHARACTERS.includes("B"), false, "Must not include B")
    assert.ok(TOKEN_CHARACTERS.length >= 25, "Must retain adequate randomness space")
  })
})

describe("Penyempurnaan Antarmuka Masuk Santri (/ujian)", () => {
  const pageContent = read("app/ujian/page.tsx")

  it("simplifies opening description to a single directive sentence", () => {
    assert.ok(
      pageContent.includes(
        "Masukkan nomor induk dan token dari pengawas."
      ),
      "Must have concise opening directive matching reference design"
    )
  })

  it("removes decorative Pintu Ujian badge", () => {
    assert.equal(
      pageContent.includes("Pintu Ujian"),
      false,
      "Pintu Ujian badge must be removed from the card header"
    )
  })

  it("uses soft token placeholder without bold font styling", () => {
    assert.ok(
      pageContent.includes('placeholder="Misal: 7K2M3P"'),
      "Must have a soft, clear example token placeholder"
    )
    assert.equal(
      pageContent.includes("MASUKKAN TOKEN (MISAL: 8K2M3P)"),
      false,
      "Heavy uppercase instruction placeholder must be removed"
    )
    assert.ok(
      pageContent.includes("placeholder:font-normal"),
      "Token placeholder must have normal font weight"
    )
    assert.ok(
      pageContent.includes(
        "6 huruf token dari pengawas + 2 angka terakhir nomor induk Anda."
      ),
      "Must provide helper text below token field"
    )
  })

  it("provides persistent error alert banner for submission failures", () => {
    assert.ok(pageContent.includes("submitError"), "Must track submit error state")
  })

  it("provides explicit disabled reason indicator above or around the submit button", () => {
    assert.ok(pageContent.includes("disabledReason"), "Must compute reason when button is disabled")
  })

  it("renders verified student card when master data is looked up", () => {
    assert.ok(pageContent.includes("Santri Terverifikasi:"), "Must display verified student notice")
  })

  it("keeps app/ujian/page.tsx free of technical specification codes", () => {
    assertNoTechnicalLeak("app/ujian/page.tsx")
  })
})
