import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

function read(relativePath: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relativePath), "utf-8")
}

function matchingTags(source: string, tagName: string): string[] {
  return source.match(new RegExp(`<${tagName}\\b[^>]*>`, "g")) ?? []
}

describe("Print layout excludes application chrome", () => {
  it("marks both site header variants as print hidden", () => {
    const tags = matchingTags(read("components/site-header.tsx"), "header")

    assert.equal(tags.length, 2)
    for (const tag of tags) {
      assert.match(tag, /print:hidden/, `Header belum print:hidden: ${tag}`)
    }
  })

  it("marks every sidebar surface as print hidden", () => {
    const source = read("components/ui/sidebar.tsx")
    const occurrences = source.match(/print:hidden/g) ?? []

    // Pembungkus desktop, kontainer tetap, dan sheet ponsel.
    assert.ok(
      occurrences.length >= 3,
      "Sidebar desktop, kontainer, dan sheet ponsel harus memakai print:hidden"
    )
  })

  it("keeps the analysis print block printable while screen controls stay hidden", () => {
    const source = read("app/(main)/rekap-nilai/analisis/[idSesi]/page.tsx")

    assert.ok(source.includes("hidden print:block"))
    assert.ok(source.includes("print:hidden"))
  })
})
