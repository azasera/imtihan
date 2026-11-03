import test, { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

// Regex to detect technical specification codes in user-facing UI
const TECHNICAL_LEAK_REGEX = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g

describe("Student Exam Entry & Verification (TASK-005 & TASK-010)", () => {
  it("confirms examParticipants table is properly defined in schema.ts", () => {
    const schemaPath = path.join(APPS_ROOT, "convex", "schema.ts")
    assert.ok(fs.existsSync(schemaPath), "convex/schema.ts must exist")
    const content = fs.readFileSync(schemaPath, "utf-8")

    assert.ok(
      content.includes("examParticipants: defineTable({"),
      "schema.ts should define examParticipants table"
    )
    assert.ok(content.includes('sessionId: v.id("examSessions")'))
    assert.ok(content.includes("nisn: v.string()"))
    assert.ok(content.includes("studentName: v.string()"))
    assert.ok(content.includes("tokenUsed: v.string()"))
    assert.ok(content.includes("startedAt: v.number()"))
    assert.ok(content.includes('.index("by_session_and_nisn", ["sessionId", "nisn"])'))
  })

  it("confirms enterExamSession mutation validates institution, class, and student identity from database", () => {
    const mutationsPath = path.join(APPS_ROOT, "convex", "examSession", "public", "mutations.ts")
    assert.ok(fs.existsSync(mutationsPath), "mutations.ts must exist")
    const content = fs.readFileSync(mutationsPath, "utf-8")

    assert.ok(
      content.includes("export const enterExamSession = mutation("),
      "enterExamSession mutation must be exported"
    )
    assert.ok(content.includes("cleanToken.length !== 6"))
    assert.ok(content.includes("institution: v.optional(v.union(v.literal(\"SMPITA\"), v.literal(\"SMAITA\"), v.literal(\"MTA\")))"))
    assert.ok(content.includes("className: v.optional(v.string())"))
    assert.ok(content.includes("student.jenjang !== args.institution"))
    assert.ok(content.includes("verifiedName = student.nama"))
  })

  it("confirms getClassesByLembaga query filters classes according to official ranges", () => {
    const queriesPath = path.join(APPS_ROOT, "convex", "students", "public", "queries.ts")
    assert.ok(fs.existsSync(queriesPath), "convex/students/public/queries.ts must exist")
    const content = fs.readFileSync(queriesPath, "utf-8")

    assert.ok(content.includes("export const getClassesByLembaga = query("))
    // SMPITA: kelas 7 s.d. 9
    assert.ok(content.includes("/^(kelas\\s*)?[7-9]/i"))
    // SMAITA: kelas 10 s.d. 12
    assert.ok(content.includes("/^(kelas\\s*)?(10|11|12)/i"))
    // MTA: MTA 1 s.d. MTA 6
    assert.ok(content.includes("/^mta\\s*[1-6]/i"))
  })

  it("confirms student exam entry page follows the strict 6-step form order", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    assert.ok(fs.existsSync(pagePath), "app/ujian/page.tsx must exist")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Urutan Form:
    // 1. Nomor Induk Santri (NISN / NIS / ID Santri)
    // 2. Pilih Lembaga
    // 3. Pilih Kelas
    // 4. Nama Lengkap Santri
    // 5. Token Ujian 6 Karakter
    // 6. Tombol Konfirmasi & Masuk Ruang Ujian
    const idxNisn = content.indexOf("1. Nomor Induk Santri")
    const idxLembaga = content.indexOf("2. Pilih Lembaga")
    const idxKelas = content.indexOf("3. Pilih Kelas")
    const idxNama = content.indexOf("4. Nama Lengkap Santri")
    const idxToken = content.indexOf("5. Token Ujian 6 Karakter")
    const idxTombol = content.indexOf("Konfirmasi & Masuk Ruang Ujian")

    assert.ok(idxNisn !== -1, "Field 1 (Nomor Induk Santri) must exist")
    assert.ok(idxLembaga !== -1, "Field 2 (Pilih Lembaga) must exist")
    assert.ok(idxKelas !== -1, "Field 3 (Pilih Kelas) must exist")
    assert.ok(idxNama !== -1, "Field 4 (Nama Lengkap Santri) must exist")
    assert.ok(idxToken !== -1, "Field 5 (Token Ujian) must exist")
    assert.ok(idxTombol !== -1, "Button 6 (Konfirmasi & Masuk) must exist")

    assert.ok(idxNisn < idxLembaga, "Nomor Induk must precede Lembaga")
    assert.ok(idxLembaga < idxKelas, "Lembaga must precede Kelas")
    assert.ok(idxKelas < idxNama, "Kelas must precede Nama Lengkap")
    assert.ok(idxNama < idxToken, "Nama Lengkap must precede Token")
    assert.ok(idxToken < idxTombol, "Token must precede Submit Button")
  })

  it("confirms dynamic institution and class behaviors (disabled when unselected, reset on change, empty class alert)", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    // Pilihan Lembaga: SMPITA, SMAITA, MTA
    assert.ok(content.includes('value="SMPITA"'))
    assert.ok(content.includes('value="SMAITA"'))
    assert.ok(content.includes('value="MTA"'))

    // Kelas dinonaktifkan sebelum lembaga dipilih
    assert.ok(content.includes("disabled={!institution}") || content.includes("disabled={!!lookedUpStudent || !institution}"))

    // Pergantian lembaga mengosongkan pilihan kelas
    assert.ok(content.includes('setClassNameInput("")'))

    // Master data santri menang atas isian manual (diturunkan, bukan disalin lewat efek)
    assert.ok(content.includes("lookedUpStudent?.jenjang || institutionInput"))
    assert.ok(content.includes("lookedUpStudent?.kelas || classNameInput"))
    assert.ok(content.includes("lookedUpStudent?.nama || studentNameInput"))
    assert.ok(!content.includes("React.useEffect"), "gerbang ujian tidak boleh menyinkronkan form lewat efek")

    // Ketika cocok dengan data santri di database: nama, lembaga, kelas terkunci
    assert.ok(content.includes("disabled={!!lookedUpStudent}"))
    assert.ok(content.includes("disabled={!!lookedUpStudent || !institution}"))
    assert.ok(content.includes("readOnly={!!lookedUpStudent}"))

    // Pada nama terverifikasi tidak ada lagi info kelas yang menempel
    assert.ok(content.includes("Santri Terverifikasi: <strong>{lookedUpStudent.nama}</strong>\n                    </span>"))
    assert.ok(!content.includes("Santri Terverifikasi: <strong>{lookedUpStudent.nama}</strong> ({lookedUpStudent.jenjang} - {lookedUpStudent.kelas})"))

    // Pesan jika kelas belum tersedia di database dan tidak membuat kelas fiktif
    assert.ok(content.includes("belum tersedia di basis data"))
  })

  it("ensures zero technical specification leaks in app/ujian/page.tsx", () => {
    const pagePath = path.join(APPS_ROOT, "app", "ujian", "page.tsx")
    const content = fs.readFileSync(pagePath, "utf-8")

    const lines = content.split("\n")
    const leakMatches: Array<{ line: number; match: string }> = []

    lines.forEach((line, idx) => {
      if (line.includes("//") || line.includes("data-testid")) return
      const matches = line.match(TECHNICAL_LEAK_REGEX)
      if (matches) {
        matches.forEach((m) => leakMatches.push({ line: idx + 1, match: m }))
      }
    })

    assert.equal(
      leakMatches.length,
      0,
      `Detected technical specification leaks in app/ujian/page.tsx: ${JSON.stringify(leakMatches)}`
    )
  })
})
