import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  INSTITUTIONS,
  INSTITUTION_LABELS,
  INSTITUTION_LEVELS,
  institutionForLevel,
  isInstitution,
  levelsForInstitution,
  matchInstitutionLevel,
  normalizeSubjectCode,
  resolveBankLevelPair,
} = (await import(new URL("../convex/model/institutions.ts", import.meta.url).href)) as typeof import("../convex/model/institutions")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

/** Tubuh satu fungsi Convex, dipakai sebagai penjaga aturan agar tidak longgar diam-diam. */
function functionBody(source: string, name: string): string {
  const match = new RegExp(`export (?:const ${name} =|async function ${name}\\(|function ${name}\\()`).exec(source)
  assert.ok(match, `fungsi ${name} harus ada`)
  const rest = source.slice(match.index)
  const next = rest.slice(1).search(/\nexport (?:const|async function|function) /)
  return next === -1 ? rest : rest.slice(0, next + 1)
}

const mutations = read("convex/bank/public/mutations.ts")
const queries = read("convex/bank/public/queries.ts")
const helpers = read("convex/bank/private/helpers.ts")
const schema = read("convex/schema.ts")
const kelolaPage = read("app/(main)/mata-pelajaran/page.tsx")
const renameDialog = read("components/bank-soal/rename-subject-dialog.tsx")
const bankListPage = read("app/(main)/bank-soal/page.tsx")
const bankEditorPage = read("app/(main)/bank-soal/[id]/page.tsx")

describe("Kosakata lembaga dan tingkat resmi paket", () => {
  it("mencakup tiga lembaga dengan jenjang yang sama dengan data santri", () => {
    assert.deepEqual([...INSTITUTIONS], ["SMPITA", "SMAITA", "MTA"])
    assert.deepEqual([...INSTITUTION_LEVELS.SMPITA], ["Kelas 7", "Kelas 8", "Kelas 9"])
    assert.deepEqual([...INSTITUTION_LEVELS.SMAITA], ["Kelas 10", "Kelas 11", "Kelas 12"])
    assert.deepEqual([...INSTITUTION_LEVELS.MTA], ["MTA 1", "MTA 2", "MTA 3", "MTA 4", "MTA 5", "MTA 6"])
  })

  it("setiap label tingkat lolos validasi kelas santri yang sudah berlaku", () => {
    const kelasRe = { SMPITA: /^(kelas\s*)?[7-9]/i, SMAITA: /^(kelas\s*)?(10|11|12)/i, MTA: /^mta\s*[1-6]/i } as const
    for (const institution of INSTITUTIONS) {
      for (const level of levelsForInstitution(institution)) {
        assert.match(level, kelasRe[institution], `${level} harus dikenali sebagai kelas ${institution}`)
      }
    }
  })

  it("label lembaga menyebut nama induknya", () => {
    assert.match(INSTITUTION_LABELS.SMPITA, /Sekolah Menengah Pertama Islam Tahfizh Al Qur'an/i)
    assert.match(INSTITUTION_LABELS.SMAITA, /Sekolah Menengah Atas Islam Tahfizh Al Qur'an/i)
    assert.match(INSTITUTION_LABELS.MTA, /Manzhumah Takhoshush Al-Qur'an/i)
  })

  it("lembaga dikenali hanya dari kosakata resmi", () => {
    assert.equal(isInstitution("SMPITA"), true)
    assert.equal(isInstitution("MTA"), true)
    for (const salah of ["", "smpita", "SMP", "Madrasah", "Kelas 7"]) {
      assert.equal(isInstitution(salah), false, `"${salah}" bukan lembaga resmi`)
    }
  })

  it("tingkat lama tetap dapat dipetakan ke lembaga, dan nilai warisan tidak dipaksa masuk", () => {
    assert.equal(institutionForLevel("Kelas 7"), "SMPITA")
    assert.equal(institutionForLevel("kelas 12"), "SMAITA")
    assert.equal(institutionForLevel("MTA 6"), "MTA")
    assert.equal(institutionForLevel("Tarbiyah / Takhassus"), null)
    assert.equal(institutionForLevel("   "), null)
  })

  it("tulisan longgar dikembalikan sebagai label baku, tulisan asing ditolak", () => {
    assert.equal(matchInstitutionLevel("SMPITA", "kelas 7"), "Kelas 7")
    assert.equal(matchInstitutionLevel("SMAITA", "11"), "Kelas 11")
    assert.equal(matchInstitutionLevel("MTA", "mta3"), "MTA 3")
    assert.equal(matchInstitutionLevel("SMPITA", "Kelas 10"), null, "kelas 10 bukan jenjang SMPITA")
    assert.equal(matchInstitutionLevel("SMPITA", "7A"), null, "rombel bukan tingkat paket")
    assert.equal(matchInstitutionLevel("MTA", "Kelas 7"), null)
    assert.equal(matchInstitutionLevel("SMAITA", "Kelas 7 / Ula 1"), null)
  })

  it("pasangan lembaga dan tingkat menghasilkan nilai siap simpan", () => {
    assert.deepEqual(resolveBankLevelPair("mta", "MTA 2"), { institution: "MTA", gradeLevel: "MTA 2" })
    assert.deepEqual(resolveBankLevelPair("SMPITA", "8"), { institution: "SMPITA", gradeLevel: "Kelas 8" })
  })

  it("pasangan yang salah ditolak dengan kalimat yang menyebut pilihan yang benar", () => {
    assert.throws(() => resolveBankLevelPair("SMP", "Kelas 7"), /bukan lembaga resmi/)
    assert.throws(() => resolveBankLevelPair("", ""), /bukan lembaga resmi/)
    assert.throws(() => resolveBankLevelPair("SMPITA", "   "), /Tingkat \/ kelas paket belum dipilih/)
    assert.throws(
      () => resolveBankLevelPair("SMPITA", "Marhalah Ula"),
      /bukan jenjang resmi lembaga SMPITA\. Pilihan yang tersedia: Kelas 7, Kelas 8, Kelas 9\./
    )
  })

  it("modul kosakata tidak mengimpor apa pun supaya satu sumber dipakai server dan klien", () => {
    const source = read("convex/model/institutions.ts")
    assert.ok(!/^\s*import\s/m.test(source), "modul bersama harus bebas impor")
  })

  it("kode mata pelajaran dibakukan huruf besar dan bergaris bawah", () => {
    assert.equal(normalizeSubjectCode("fiqih ibadah"), "FIQIH_IBADAH")
    assert.equal(normalizeSubjectCode("  B-Arab "), "B_ARAB")
    assert.equal(normalizeSubjectCode("TAHFIDZ"), "TAHFIDZ")
    assert.equal(normalizeSubjectCode("a  -  b"), "A_B")
    assert.equal(normalizeSubjectCode("  _  "), "")
    assert.equal(normalizeSubjectCode(""), "")
  })
})

describe("Jalur tulis mata pelajaran di backend", () => {
  for (const name of ["addSubject", "renameSubject", "setSubjectActive", "deleteSubject"]) {
    it(`${name} hanya untuk pengajar yang sudah masuk`, () => {
      assert.match(functionBody(mutations, name), /await requireAuthenticatedUser\(ctx\)/)
    })
  }

  it("penambahan memuat nama dan kode, dan menolak kode yang sudah dipakai", () => {
    const body = functionBody(mutations, "addSubject")
    assert.match(body, /Nama mata pelajaran harus diisi\./)
    assert.match(body, /normalizeSubjectCode\(args\.code\)/)
    assert.match(body, /withIndex\("by_code"/)
    assert.match(body, /sudah dipakai oleh mata pelajaran/)
    assert.match(body, /Pakai kode lain/)
    assert.match(body, /isActive: true/)
  })

  it("ganti nama mendukung pembaruan kode dengan pembaruan beruntun ke paket bank soal", () => {
    const body = functionBody(mutations, "renameSubject")
    assert.match(body, /ctx\.db\.patch\("subjects", subject\._id,/)
    assert.match(body, /normalizeSubjectCode\(args\.code\)/)
    assert.match(body, /withIndex\("by_subject"/)
    assert.match(body, /ctx\.db\.patch\("questionBanks", bank\._id/)
  })

  it("penonaktifan menulis status, bukan menghapus baris", () => {
    const body = functionBody(mutations, "setSubjectActive")
    assert.match(body, /isActive: args\.isActive/)
    assert.ok(!body.includes("ctx.db.delete"), "penonaktifan tidak menghapus data")
  })

  it("hapus permanen ditolak selama masih ada paket yang memakai", () => {
    const body = functionBody(mutations, "deleteSubject")
    assert.match(body, /withIndex\("by_subject"/)
    assert.match(body, /usingBanks\.length > 0/)
    assert.match(body, /masih dipakai \$\{usingBanks\.length\} paket/)
    assert.match(body, /Nonaktifkan saja/)
    assert.match(body, /ctx\.db\.delete\("subjects"/)
  })

  it("daftar kelola membaca jumlah pemakaian dari indeks paket dan menormalkan status", () => {
    const body = functionBody(queries, "listSubjectsWithUsage")
    assert.match(body, /await requireAuthenticatedUser\(ctx\)/)
    assert.match(body, /withIndex\("by_subject"/)
    assert.match(body, /isActive: subject\.isActive !== false/)
    assert.match(body, /bankCount: banks\.length/)
  })

  it("paket lama tetap membaca nama mata pelajaran lewat kode", () => {
    const body = functionBody(queries, "getQuestionBank")
    assert.match(body, /withIndex\("by_code"/)
    assert.match(body, /subjectName: subject\?\.name \?\? bank\.subjectCode/)
  })

  it("daftar mata pelajaran biasa tetap dapat dibaca tanpa login dan menyertakan yang nonaktif", () => {
    const body = functionBody(queries, "listSubjects")
    assert.ok(!body.includes("requireAuthenticatedUser"), "listSubjects dipakai untuk membaca label paket lama")
    assert.match(body, /ctx\.db\.query\("subjects"\)\.collect\(\)/)
  })

  it("mata pelajaran nonaktif atau tak dikenal tidak dapat dipakai pada paket baru", () => {
    const body = functionBody(helpers, "requireSelectableSubject")
    assert.match(body, /belum ada di daftar/)
    assert.match(body, /Kelola Mata Pelajaran/)
    assert.match(body, /subject\.isActive === false/)
    assert.match(body, /sudah dinonaktifkan/)
    assert.ok(mutations.includes("await requireSelectableSubject(ctx, args.subjectCode)"))
  })

  it("tingkat paket bukan teks bebas lagi saat membuat dan memperbarui paket", () => {
    const create = functionBody(mutations, "createQuestionBank")
    assert.match(create, /resolveBankLevelPair\(args\.institution, args\.gradeLevel\)/)
    assert.match(create, /institution: level\.institution/)
    assert.match(create, /gradeLevel: level\.gradeLevel/)
    assert.ok(!create.includes("gradeLevel: args.gradeLevel.trim()"), "nilai kiriman klien tidak boleh langsung tersimpan")

    const update = functionBody(mutations, "updateQuestionBank")
    assert.match(update, /requireOwnedBank\(ctx, user, args\.bankId\)/)
    assert.match(update, /resolveBankLevelPair\(institution, gradeLevel\)/)
    assert.ok(!update.includes("gradeLevel: args.gradeLevel.trim()"))
    assert.ok(
      update.includes("args.institution !== undefined || args.gradeLevel !== undefined"),
      "pasangan lembaga dan tingkat diperbarui bersama-sama"
    )
  })

  it("skema menambahkan kolom baru secara opsional agar baris lama tidak perlu dimigrasi", () => {
    const subjectsTable = schema.slice(schema.indexOf("subjects: defineTable"), schema.indexOf("questionBanks: defineTable"))
    assert.match(subjectsTable, /isActive: v\.optional\(v\.boolean\(\)\)/)
    assert.match(subjectsTable, /updatedAt: v\.optional\(v\.number\(\)\)/)
    assert.match(subjectsTable, /\.index\("by_code", \["code"\]\)/)

    const banksTable = schema.slice(schema.indexOf("questionBanks: defineTable"), schema.indexOf("questions: defineTable"))
    assert.match(
      banksTable,
      /institution: v\.optional\(v\.union\(v\.literal\("SMPITA"\), v\.literal\("SMAITA"\), v\.literal\("MTA"\)\)\)/
    )
    assert.match(banksTable, /\.index\("by_subject", \["subjectCode"\]\)/)
  })
})

describe("Layar kelola mata pelajaran", () => {
  it("membaca daftar beserta jumlah paket dan memanggil seluruh aksi kelola", () => {
    assert.match(kelolaPage, /api\.bank\.public\.queries\.listSubjectsWithUsage/)
    for (const name of ["addSubject", "renameSubject", "setSubjectActive", "deleteSubject"]) {
      assert.ok(kelolaPage.includes(`api.bank.public.mutations.${name}`), `layar memakai mutasi ${name}`)
    }
  })

  it("daftar hanya dimuat bila pengajar sudah masuk", () => {
    assert.match(kelolaPage, /isLoggedIn \? \{\} : "skip"/)
    assert.match(kelolaPage, /Daftar mata pelajaran terbuka untuk pengajar yang sudah login/)
  })

  it("satu ajakan utama dan kode yang ikut terbentuk dari nama", () => {
    assert.match(kelolaPage, /Tambah Mata Pelajaran/)
    assert.match(kelolaPage, /normalizeSubjectCode\(value\)/)
    assert.match(kelolaPage, /if \(!codeTouched\) setCode/)
    assert.equal((kelolaPage.match(/<Button type="submit"/g) ?? []).length, 1)
  })

  it("status memakai label teks, bukan warna saja", () => {
    assert.ok(kelolaPage.includes('"Aktif"'))
    assert.ok(kelolaPage.includes('"Nonaktif"'))
    assert.match(kelolaPage, /\{status\.label\}/)
  })

  it("hapus dinonaktifkan disertai alasan yang menyebut jumlah paket, dan butuh konfirmasi", () => {
    assert.match(kelolaPage, /disabled=\{subject\.bankCount > 0/)
    assert.match(kelolaPage, /Belum bisa dihapus, masih dipakai \{subject\.bankCount\} paket/)
    assert.match(kelolaPage, /confirm\(/)
  })

  it("keadaan muat tidak menampilkan angka nol yang menyesatkan", () => {
    assert.match(kelolaPage, /subjects === undefined/)
    assert.match(kelolaPage, /Memuat daftar mata pelajaran\.\.\./)
    assert.match(kelolaPage, /<Spinner/)
    const emptyState = kelolaPage.slice(
      kelolaPage.indexOf("Belum ada mata pelajaran"),
      kelolaPage.indexOf("Belum ada mata pelajaran") + 200
    )
    assert.match(emptyState, /formulir di atas/)
    assert.ok(!emptyState.includes("<Button"), "keadaan kosong tidak menumpuk ajakan")
  })

  it("tabel berubah menjadi kartu pada layar kecil", () => {
    assert.match(kelolaPage, /className="hidden md:block/)
    assert.match(kelolaPage, /className="md:hidden space-y-2"/)
  })

  it("aksi disusun dari penangan peristiwa, bukan dari efek", () => {
    assert.ok(!kelolaPage.includes("React.useEffect"), "tidak ada setState dalam efek pada layar ini")
    assert.ok(!renameDialog.includes("React.useEffect"), "dialog mengisi ulang lewat penangan buka")
    assert.match(renameDialog, /function handleOpenChange/)
  })

  it("dialog sunting menyediakan isian kode dengan normalisasi dan informasi dampak paket", () => {
    assert.match(renameDialog, /normalizeSubjectCode\(code\)/)
    assert.match(renameDialog, /\{subject\.code\}/)
    assert.match(renameDialog, /setCode\(e\.target\.value\)/)
    assert.match(renameDialog, /edit-subject-code-/)
  })

  it("kolom kode dibatasi huruf besar pada layar", () => {
    assert.match(kelolaPage, /className="font-mono uppercase"/)
  })

  it("penambahan yang gagal tidak mengosongkan isian", () => {
    const handler = kelolaPage.slice(kelolaPage.indexOf("async function handleAddSubject"))
    const resetBlock = handler.slice(0, handler.indexOf("catch"))
    const catchBlock = handler.slice(handler.indexOf("catch"), handler.indexOf("finally"))
    assert.match(resetBlock, /setName\(""\)/)
    assert.ok(!catchBlock.includes("setName("), "isian tetap ada saat penyimpanan gagal")
  })
})

describe("Integrasi layar paket bank soal", () => {
  it("daftar paket menautkan layar kelola sebagai pintu masuk sekunder", () => {
    assert.match(bankListPage, /href="\/mata-pelajaran"/)
    assert.match(bankListPage, /Kelola Mata Pelajaran/)
  })

  it("tingkat diambil dari kosakata lembaga, bukan daftar karangan", () => {
    assert.match(bankListPage, /INSTITUTION_LEVELS\[institution\]/)
    assert.match(bankListPage, /from "@\/convex\/model\/institutions"/)
    for (const labelLama of ["Ula 1", "Wustha 2", "Tarbiyah / Takhassus"]) {
      assert.ok(!bankListPage.includes(labelLama), `label lama "${labelLama}" tidak lagi ditawarkan`)
    }
  })

  it("lembaga harus dipilih lebih dulu dan menggantinya mengosongkan tingkat", () => {
    assert.match(bankListPage, /function handleInstitutionChange/)
    const handler = bankListPage.slice(bankListPage.indexOf("function handleInstitutionChange"))
    assert.match(handler.slice(0, 300), /setGradeLevel\(""\)/)
    assert.match(bankListPage, /disabled=\{!institution\}/)
    assert.match(bankListPage, /Pilih lembaga terlebih dahulu/)
    assert.match(bankListPage, /Silakan pilih lembaga terlebih dahulu sebelum memilih tingkat\./)
  })

  it("hanya mata pelajaran aktif yang ditawarkan pada paket baru", () => {
    assert.match(bankListPage, /s\.isActive !== false/)
    assert.match(bankListPage, /selectableSubjects\.map/)
    assert.match(bankListPage, /institution,\s*\n\s*gradeLevel,/)
  })

  it("nama mata pelajaran, bukan kode, yang tampil pada kartu paket dan header editor", () => {
    assert.match(bankListPage, /subjectNameByCode\.get\(bank\.subjectCode\)/)
    assert.match(bankEditorPage, /\{bank\.subjectName\}/)
    assert.ok(!bankEditorPage.includes("{bank.subjectCode}"), "editor tidak menampilkan kode mentah")
  })

  it("filter paket tetap memakai daftar lengkap supaya paket bermata pelajaran nonaktif ketemu", () => {
    const filterBlock = bankListPage.slice(bankListPage.indexOf("Semua Mata Pelajaran"))
    assert.match(filterBlock.slice(0, 400), /subjects\?\.map/)
    assert.ok(!filterBlock.slice(0, 400).includes("selectableSubjects"))
  })

  it("tidak ada emoji pada layar baru dan teksnya memakai label lembaga resmi", () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u
    assert.ok(!emoji.test(kelolaPage), "layar memakai ikon Lucide, bukan emoji")
    assert.ok(!emoji.test(renameDialog), "dialog memakai ikon Lucide, bukan emoji")
    // Pemindaian kebocoran kode spesifikasi seluruh repo sudah dilakukan tests/ui-leakage.test.ts,
    // jadi di sini hanya dipastikan kosakata layar berasal dari modul bersama, bukan karangan.
    assert.match(bankListPage, /INSTITUTIONS\.map\(/)
    assert.match(kelolaPage, /BookOpenIcon|LayersIcon|Trash2Icon/)
  })

  it("layar baru memakai primitif komponen yang sudah ada, bukan tiruan", () => {
    for (const primitif of ["@/components/ui/table", "@/components/ui/spinner", "@/components/ui/card"]) {
      assert.ok(kelolaPage.includes(primitif), `${primitif} dipakai sebagai primitif`)
    }
    assert.ok(renameDialog.includes("@/components/ui/dialog"), "dialog ganti nama memakai primitif Dialog")
    assert.ok(bankListPage.includes("@/components/ui/select"), "pemilih lembaga dan tingkat memakai Select")
    assert.ok(!/<select/.test(kelolaPage + bankListPage), "tidak ada elemen select mentah")
  })
})
