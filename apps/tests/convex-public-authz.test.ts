import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")
const CONVEX_ROOT = path.join(APPS_ROOT, "convex")

// Fungsi publik yang memang dirancang untuk dipanggil santri tanpa akun.
// Setiap nama di sini adalah keputusan sadar; fungsi lain wajib mengautentikasi pemanggil.
const ANONYMOUS_ALLOWED = new Set([
  "students/public/queries:lookupStudent",
  "students/public/queries:getClassesByLembaga",
  "bank/public/queries:listSubjects",
  "examSession/public/queries:verifySessionToken",
  "examSession/public/queries:getStudentExamSheet",
  "examSession/public/mutations:enterExamSession",
  "examSession/public/mutations:saveStudentAnswer",
  "examSession/public/mutations:recordTabViolation",
  "examSession/public/mutations:submitStudentExam",
])

const FUNCTION_RE = /export const (\w+) = (query|mutation|action)\(\s*\{/g

/** Buang komentar dan isi string agar scan tidak kena false positive. */
function codeOnly(source: string): string {
  const out: string[] = []
  let i = 0
  let mode: "code" | "line" | "block" | "string" | "template" = "code"
  while (i < source.length) {
    const two = source.slice(i, i + 2)
    const ch = source[i]
    if (mode === "code") {
      if (two === "//") { mode = "line"; i += 2; continue }
      if (two === "/*") { mode = "block"; i += 2; continue }
      if (ch === '"' || ch === "'" || ch === "`") {
        mode = ch === "`" ? "template" : "string"
        out.push("X")
        i++
        continue
      }
      out.push(ch)
      i++
      continue
    }
    if (mode === "line") {
      if (ch === "\n") { mode = "code"; out.push("\n") }
      i++
      continue
    }
    if (mode === "block") {
      if (two === "*/") { mode = "code"; i += 2; continue }
      i++
      continue
    }
    // string / template: lewati escape lalu tutup
    if (ch === "\\") { i += 2; continue }
    if ((mode === "string" && (ch === '"' || ch === "'")) || (mode === "template" && ch === "`")) {
      mode = "code"
    }
    i++
  }
  return out.join("")
}

/** Ambil tubuh fungsi (sampai kurung kurawal penutup) mulai dari `{` pertama. */
function functionBody(code: string, openBraceIndex: number): string {
  let depth = 0
  for (let i = openBraceIndex; i < code.length; i++) {
    if (code[i] === "{") depth++
    else if (code[i] === "}") {
      depth--
      if (depth === 0) return code.slice(openBraceIndex, i + 1)
    }
  }
  return code.slice(openBraceIndex)
}

interface PublicFn {
  key: string
  file: string
  name: string
  kind: string
  authenticated: boolean
}

function scanPublicFunctions(code: string, fileLabel: string): PublicFn[] {
  const found: PublicFn[] = []
  FUNCTION_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = FUNCTION_RE.exec(code)) !== null) {
    const [, name, kind] = match
    const openBraceIndex = match.index + match[0].length - 1
    const body = functionBody(code, openBraceIndex)
    const authenticated = /\bctx\.auth\b/.test(body) || /\brequireAuthenticatedUser\(/.test(body)
    found.push({ key: `${fileLabel}:${name}`, file: fileLabel, name, kind, authenticated })
  }
  return found
}

function collectPublicFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "_generated" || entry.name === "node_modules") continue
      results.push(...collectPublicFiles(full))
    } else if (entry.name.endsWith(".ts") && full.includes(`${path.sep}public${path.sep}`)) {
      results.push(full)
    }
  }
  return results.sort()
}

function labelFor(file: string): string {
  return path
    .relative(CONVEX_ROOT, file)
    .replace(/\\/g, "/")
    .replace(/\.ts$/, "")
}

describe("Convex public function authentication policy", () => {
  it("mendeteksi fungsi publik tanpa autentikasi pada fixture", () => {
    const fixture = `
      import { mutation, query } from "../../_generated/server"
      export const dropTables = mutation({
        args: {},
        handler: async (ctx) => {
          await ctx.db.delete("students", args.id)
        },
      })
      export const listSafe = query({
        args: {},
        handler: async (ctx) => {
          const user = await requireAuthenticatedUser(ctx)
          return ctx.db.query("subjects").collect()
        },
      })
      export const listBanks = query({
        args: {},
        handler: async (ctx) => {
          const identity = await ctx.auth.getUserIdentity()
          if (!identity) return []
          return ctx.db.query("questionBanks").collect()
        },
      })
    `
    const fns = scanPublicFunctions(codeOnly(fixture), "fixture")
    assert.equal(fns.length, 3)
    assert.deepEqual(
      fns.map((fn) => [fn.key, fn.authenticated]),
      [
        ["fixture:dropTables", false],
        ["fixture:listSafe", true],
        ["fixture:listBanks", true],
      ]
    )
  })

  it("tidak menganggap komentar atau string sebagai bukti autentikasi", () => {
    const fixture = `
      export const sneaky = mutation({
        args: {},
        handler: async (ctx) => {
          // ctx.auth.getUserIdentity() tidak dipanggil di sini
          const note = "ctx.auth"
          return note
        },
      })
    `
    const fns = scanPublicFunctions(codeOnly(fixture), "fixture")
    assert.equal(fns.length, 1)
    assert.equal(fns[0].authenticated, false)
  })

  it("setiap fungsi Convex publik di repo terautentikasi atau terdaftar sebagai gerbang santri", () => {
    const violations: string[] = []
    const seenAnonymousAllowlist: string[] = []

    for (const file of collectPublicFiles(CONVEX_ROOT)) {
      const label = labelFor(file)
      for (const fn of scanPublicFunctions(codeOnly(fs.readFileSync(file, "utf-8")), label)) {
        if (fn.authenticated) continue
        if (ANONYMOUS_ALLOWED.has(fn.key)) {
          seenAnonymousAllowlist.push(fn.key)
          continue
        }
        violations.push(fn.key)
      }
    }

    assert.deepEqual(violations, [], `Fungsi publik tanpa autentikasi: ${violations.join(", ")}`)

    // Allowlist tidak boleh menyimpan nama yang sudah tidak ada (penjaga drift).
    const stale = [...ANONYMOUS_ALLOWED].filter((k) => !seenAnonymousAllowlist.includes(k))
    assert.deepEqual(stale, [], `Entri allowlist tidak lagi ada di kode: ${stale.join(", ")}`)
  })
})

describe("Master santri: sumber data dan ekspos PII", () => {
  const actionsPath = path.join(CONVEX_ROOT, "students", "public", "actions.ts")
  const queriesPath = path.join(CONVEX_ROOT, "students", "public", "queries.ts")

  it("sync SiPAKSa dikunci ke endpoint server dan wajib login", () => {
    const content = fs.readFileSync(actionsPath, "utf-8")
    assert.ok(!content.includes("sourceUrl"), "pemanggil tidak boleh menentukan URL sumber")
    assert.ok(
      content.includes("await requireAuthenticatedUser(ctx)"),
      "action wajib mengautentikasi pemanggil"
    )
    assert.match(
      content,
      /fetch\(SIPAKSA_ENDPOINT\)/,
      "fetch wajib memakai endpoint konstanta internal"
    )
  })

  it("daftar dan statistik santri hanya untuk pemanggil login", () => {
    const content = fs.readFileSync(queriesPath, "utf-8")
    const fns = scanPublicFunctions(codeOnly(content), "students/public/queries")
    const byName = new Map(fns.map((fn) => [fn.name, fn]))

    assert.equal(byName.get("getStudents")?.authenticated, true)
    assert.equal(byName.get("getStudentStats")?.authenticated, true)
  })

  it("lookupStudent hanya mengembalikan identitas minimal untuk gerbang ujian", () => {
    const content = fs.readFileSync(queriesPath, "utf-8")
    assert.ok(
      !/return byId\b|return byNisn\b|return byNis\b|return found \|\| null/.test(content),
      "dokumen lengkap santri tidak boleh dikembalikan apa adanya"
    )
    const projection = content.slice(
      content.indexOf("function studentGateProfile"),
      content.indexOf("export const getStudents")
    )
    assert.ok(projection.includes("nama"))
    assert.ok(projection.includes("jenjang"))
    assert.ok(projection.includes("kelas"))
    for (const leaked of ["nisn", "nis:", "dormitory", "guruHalaqah", "totalHafalan", "jenisKelamin"]) {
      assert.ok(
        !projection.includes(leaked),
        `lookupStudent tidak boleh mengekspos ${leaked}`
      )
    }
  })
})
