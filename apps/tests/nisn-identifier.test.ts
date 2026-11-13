import test, { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { canonicalIdentifier, identifierMatches, officialNisn } from "../convex/model/nisn.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Nomor induk santri toleran nol depan", () => {
  it("menormalkan nomor digit dengan atau tanpa nol depan menjadi bentuk sama", () => {
    assert.equal(canonicalIdentifier("0127121695"), "127121695")
    assert.equal(canonicalIdentifier("127121695"), "127121695")
    assert.equal(canonicalIdentifier("  0127121695  "), "127121695")
    assert.equal(canonicalIdentifier("000127121695"), "127121695")
  })

  it("membiarkan identitas non-numerik apa adanya selain spasi tepi dan besar-kecil huruf", () => {
    assert.equal(canonicalIdentifier("24.02.001"), "24.02.001")
    assert.equal(canonicalIdentifier("024.02.001"), "024.02.001")
    assert.equal(canonicalIdentifier(" MTA-6 "), "mta-6")
  })

  it("menangani nilai tepi tanpa membuang seluruh digit", () => {
    assert.equal(canonicalIdentifier(""), "")
    assert.equal(canonicalIdentifier("0"), "0")
    assert.equal(canonicalIdentifier("000"), "0")
  })

  it("mencocokkan nomor induk lintas format tetapi tidak lintas nomor", () => {
    assert.equal(identifierMatches("127121695", "0127121695"), true)
    assert.equal(identifierMatches("0127121695", "127121695"), true)
    assert.equal(identifierMatches("24.02.001", "24.02.001"), true)
    assert.equal(identifierMatches("127121695", "1271216950"), false)
    assert.equal(identifierMatches("127121695", "127121696"), false)
    assert.equal(identifierMatches("012345", "123456"), false)
  })

  it("mengabaikan kolom identitas yang tidak diisi", () => {
    assert.equal(identifierMatches(undefined, "0127121695"), false)
    assert.equal(identifierMatches("", "0127121695"), false)
  })
})

describe("Bentuk resmi NISN untuk data master", () => {
  it("memulihkan nol depan sampai 10 digit seperti kartu peserta", () => {
    assert.equal(officialNisn("127121695"), "0127121695")
    assert.equal(officialNisn("  127121695  "), "0127121695")
    assert.equal(officialNisn("12455677"), "0012455677")
  })

  it("tidak mengubah nilai yang sudah 10 digit ke atas atau identitas non-digit", () => {
    assert.equal(officialNisn("3142990266"), "3142990266")
    assert.equal(officialNisn("0127121695"), "0127121695")
    assert.equal(officialNisn("12345678901"), "12345678901")
    assert.equal(officialNisn("24.02.001"), "24.02.001")
  })

  it("memperlakukan nilai kosong sebagai tidak ada NISN", () => {
    assert.equal(officialNisn(""), undefined)
    assert.equal(officialNisn("   "), undefined)
    assert.equal(officialNisn(null), undefined)
    assert.equal(officialNisn(undefined), undefined)
  })

  it("pulihan ini tidak mengubah hasil pencocokan nomor induk", () => {
    for (const raw of ["127121695", "3142990266", "12455677"]) {
      assert.equal(canonicalIdentifier(officialNisn(raw)!), canonicalIdentifier(raw))
      assert.equal(identifierMatches(officialNisn(raw), `0${raw}`), true)
    }
  })
})

describe("Gerbang santri memakai pencocokan nomor induk yang sama", () => {
  it("lookupStudent membandingkan lewat identifierMatches pada pemindaian fallback", () => {
    const queries = read("convex/students/public/queries.ts")

    assert.match(queries, /import \{[^}]*identifierMatches[^}]*\} from "\.\.\/\.\.\/model\/nisn"/)
    assert.match(queries, /identifierMatches\(s\.santriId, clean\)/)
    assert.match(queries, /identifierMatches\(s\.nis, clean\)/)
    assert.match(queries, /identifierMatches\(s\.nisn, clean\)/)
  })

  it("enterExamSession membandingkan lewat identifierMatches dan menyimpan bentuk resmi", () => {
    const mutations = read("convex/examSession/public/mutations.ts")

    assert.match(mutations, /import \{ identifierMatches \} from "\.\.\/\.\.\/model\/nisn"/)
    assert.match(mutations, /identifierMatches\(s\.nisn, cleanNisn\)/)
    assert.match(
      mutations,
      /const officialNisn = student \? \(student\.nisn \?\? student\.nis \?\? student\.santriId\) : cleanNisn/
    )
    assert.match(mutations, /\.eq\("nisn", officialNisn\)/)
    assert.match(mutations, /nisn: officialNisn,/)
  })

  it("roster sesi lanjutan dinormalisasi lewat helper yang sama", () => {
    const helpers = read("convex/examSession/private/helpers.ts")

    assert.match(helpers, /import \{ canonicalIdentifier \} from "\.\.\/\.\.\/model\/nisn"/)
    assert.match(helpers, /export function normalizeNisn\(value: string\): string \{\s*return canonicalIdentifier\(value\)/)
  })
})

test("sinkronisasi SiPAKSa menyimpan NISN dalam bentuk resmi 10 digit", () => {
  const actions = read("convex/students/public/actions.ts")

  assert.match(actions, /import \{ officialNisn \} from "\.\.\/\.\.\/model\/nisn"/)
  assert.match(actions, /nisn: officialNisn\(String\(s\.nisn \?\? ""\)\)/)
})
