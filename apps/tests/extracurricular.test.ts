import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const {
  OFFICIAL_EXTRACURRICULARS,
  EXTRACURRICULAR_PREDICATES,
  getExtracurricularNarrative,
  normalizeEkskulName,
  OFFICIAL_CLASSES,
} = (await import(
  new URL("../lib/extracurricular-constants.ts", import.meta.url).href
)) as typeof import("../lib/extracurricular-constants")

const { EKSKUL_ROSTER_DATA } = (await import(
  new URL("../lib/extracurricular-roster.ts", import.meta.url).href
)) as typeof import("../lib/extracurricular-roster")

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

describe("Fitur Pengelolaan & Penilaian Ekstrakurikuler Rapor", () => {
  it("memverifikasi pilihan predikat adalah A, B, dan C secara lengkap", () => {
    const values = EXTRACURRICULAR_PREDICATES.map((p) => p.value)
    assert.deepEqual(values, ["A", "B", "C"])
    assert.equal(EXTRACURRICULAR_PREDICATES[0].label, "A (Sangat Baik)")
    assert.equal(EXTRACURRICULAR_PREDICATES[1].label, "B (Baik)")
    assert.equal(EXTRACURRICULAR_PREDICATES[2].label, "C (Cukup)")
  })

  it("memverifikasi ekskul wajib Rohis dan cabang-cabang ekskul pilihan terdaftar", () => {
    assert.ok(OFFICIAL_EXTRACURRICULARS["Rohis"], "Ekskul Rohis harus terdaftar")
    assert.equal(OFFICIAL_EXTRACURRICULARS["Rohis"].category, "wajib")

    const expectedPilihan = [
      "Futsal",
      "Badminton",
      "Pingpong",
      "Panahan",
      "Volly",
      "Agrobisnis",
      "TIK",
      "Tata Boga",
      "Jurnalis",
      "IPA",
      "IPS",
      "Matematika",
    ]

    for (const name of expectedPilihan) {
      assert.ok(OFFICIAL_EXTRACURRICULARS[name], `Ekskul ${name} harus terdaftar`)
      assert.equal(OFFICIAL_EXTRACURRICULARS[name].category, "pilihan")
    }
  })

  it("memverifikasi generator narasi menghasilkan deskripsi berbeda dan bermakna untuk predikat A, B, dan C", () => {
    for (const [name, def] of Object.entries(OFFICIAL_EXTRACURRICULARS)) {
      const narA = getExtracurricularNarrative(name, "A")
      const narB = getExtracurricularNarrative(name, "B")
      const narC = getExtracurricularNarrative(name, "C")

      assert.ok(narA.length > 20, `Narasi A untuk ${name} harus memadai`)
      assert.ok(narB.length > 20, `Narasi B untuk ${name} harus memadai`)
      assert.ok(narC.length > 20, `Narasi C untuk ${name} harus memadai`)

      assert.notEqual(narA, narB, `Narasi A dan B untuk ${name} tidak boleh sama`)
      assert.notEqual(narB, narC, `Narasi B dan C untuk ${name} tidak boleh sama`)
    }
  })

  it("memverifikasi normalisasi nama ekskul dari ragam penulisan sheet Excel", () => {
    assert.equal(normalizeEkskulName("Jurnalis Akhwat"), "Jurnalis")
    assert.equal(normalizeEkskulName("TIK Akhwat"), "TIK")
    assert.equal(normalizeEkskulName("Tataboga"), "Tata Boga")
    assert.equal(normalizeEkskulName("Tata Boga"), "Tata Boga")
    assert.equal(normalizeEkskulName("Bulutangkis"), "Badminton")
    assert.equal(normalizeEkskulName("Tenis Meja"), "Pingpong")
  })

  it("memverifikasi roster data dari ABSEN EKSKUL 2026-2027.xlsx termuat lengkap tanpa data kosong", () => {
    assert.ok(EKSKUL_ROSTER_DATA.length >= 330, "Roster data harus mencakup minimal 330 entri")
    for (const item of EKSKUL_ROSTER_DATA) {
      assert.ok(item.studentName.trim().length > 0, "Nama santri tidak boleh kosong")
      assert.ok(item.className.trim().length > 0, "Kelas santri tidak boleh kosong")
      assert.ok(item.ekskul.trim().length > 0, "Nama ekskul tidak boleh kosong")
    }
  })

  it("memverifikasi mutasi backend batchUpsertExtracurriculars dan saveHomeroomAssessment di Convex", () => {
    const mutationsSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/rapor/public/mutations.ts"),
      "utf8"
    )

    assert.match(mutationsSource, /export const batchUpsertExtracurriculars/)
    assert.match(mutationsSource, /export const saveHomeroomAssessment/)
    assert.match(mutationsSource, /extracurriculars:\s*item\.extracurriculars/)
  })

  it("memverifikasi antarmuka ReportCardPrintView menampilkan baris ekskul tanpa fallback 6 baris strip", () => {
    const printViewSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/rapor/ReportCardPrintView.tsx"),
      "utf8"
    )

    // Tidak boleh lagi ada fallback strip Tahsin / Rohis / Pramuka dengan strip '-'
    assert.doesNotMatch(
      printViewSource,
      /\{ name: "Tahsin", score: "A", description: "Baik dalam menerapkan hukum nun mati/
    )
    assert.match(printViewSource, /name:\s*"Rohis"/)
    assert.match(printViewSource, /activeExtracurriculars\.map/)
  })

  it("memverifikasi kontrol UI di Tab Asesmen Wali Kelas mencakup tombol sinkronisasi dan form ekskul", () => {
    const pageSource = fs.readFileSync(
      path.join(APPS_ROOT, "app/(main)/rapor/page.tsx"),
      "utf8"
    )

    assert.match(pageSource, /Sinkronkan Ekskul dari Excel/)
    assert.match(pageSource, /handleSyncAllExtracurricularsFromExcel/)
    assert.match(pageSource, /Penilaian Ekstrakurikuler/)
    assert.match(pageSource, /handleEkskulScoreChange/)
    assert.match(pageSource, /handleAddOptionalEkskul/)
    assert.match(pageSource, /handleRemoveEkskul/)
    assert.match(pageSource, /EXTRACURRICULAR_PREDICATES/)
  })

  it("memverifikasi OFFICIAL_CLASSES mencakup seluruh rombel SMP, SMA, dan MTA 1 s.d. MTA 6", () => {
    const mtaClasses = OFFICIAL_CLASSES.filter((c) => c.startsWith("MTA"))
    assert.deepEqual(mtaClasses, [
      "MTA 1",
      "MTA 2",
      "MTA 3",
      "MTA 4",
      "MTA 5",
      "MTA 6",
    ])
    // Memastikan kelas SMP dan SMA juga ada
    assert.ok(OFFICIAL_CLASSES.includes("7A"))
    assert.ok(OFFICIAL_CLASSES.includes("9C"))
    assert.ok(OFFICIAL_CLASSES.includes("10A"))
    assert.ok(OFFICIAL_CLASSES.includes("12B"))
  })

  it("memverifikasi mutasi createGroup di Convex dan komponen CreateGroupModal", () => {
    const mutationsSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/extracurricular/public/mutations.ts"),
      "utf8"
    )

    assert.match(mutationsSource, /export const createGroup = mutation\(/)
    assert.match(mutationsSource, /name:\s*v\.string\(\)/)
    assert.match(mutationsSource, /category:\s*v\.optional\(\s*v\.union/)
    assert.match(mutationsSource, /coaches:\s*v\.optional\(/)

    const modalPath = path.join(APPS_ROOT, "components/ekstrakurikuler/CreateGroupModal.tsx")
    assert.ok(fs.existsSync(modalPath), "File CreateGroupModal.tsx harus ada")
    const modalSource = fs.readFileSync(modalPath, "utf8")
    assert.match(modalSource, /export function CreateGroupModal/)
    assert.match(modalSource, /createGroupMutation/)
    assert.match(modalSource, /ROLE_PRESETS/)

    const pagePath = path.join(APPS_ROOT, "app/(main)/ekstrakurikuler/page.tsx")
    const pageSource = fs.readFileSync(pagePath, "utf8")
    assert.match(pageSource, /CreateGroupModal/)
    assert.match(pageSource, /isCreateGroupOpen/)
    assert.match(pageSource, /Tambah Cabang Ekskul/)
  })
})
