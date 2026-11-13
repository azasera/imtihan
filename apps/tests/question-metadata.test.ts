import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  THINKING_LEVELS,
  THINKING_LEVEL_LABELS,
  UNTAGGED_THINKING_LEVEL_LABEL,
  ACHIEVEMENT_REF_MAX_LENGTH,
  isThinkingLevel,
  normalizeThinkingLevel,
  thinkingLevelLabel,
} = (await import(new URL("../convex/model/thinkingLevels.ts", import.meta.url).href)) as typeof import("../convex/model/thinkingLevels")

const {
  ACHIEVEMENT_REF_MAX_LENGTH: IMPORT_ACHIEVEMENT_MAX,
  FORMAT_HINTS,
  IMPORT_EXAMPLE,
  normalizeImportThinkingLevel,
  importThinkingLevelLabel,
  parseQuestionImport,
  toImportPayload,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

/** Tubuh satu fungsi, dipakai sebagai penjaga agar aturan tidak longgar diam-diam. */
function functionBody(source: string, name: string): string {
  const match = new RegExp(`(?:export )?(?:const ${name} =|async function ${name}\\(|function ${name}\\()`).exec(source)
  assert.ok(match, `fungsi ${name} harus ada`)
  const rest = source.slice(match.index)
  const next = rest.slice(1).search(/\n(?:export )?(?:function|async function|const) \w+/)
  return next === -1 ? rest : rest.slice(0, next + 1)
}

const schema = read("convex/schema.ts")
const bankMutations = read("convex/bank/public/mutations.ts")
const bankQueries = read("convex/bank/public/queries.ts")
const examQueries = read("convex/examSession/public/queries.ts")
const editorPage = read("app/(main)/bank-soal/[id]/page.tsx")
const gradingPage = read("app/(main)/rekap-nilai/koreksi/[id]/page.tsx")
const previewComponent = read("components/bank-soal/question-import-preview.tsx")

describe("Kosakata tingkat berpikir", () => {
  it("empat tingkat berpikir berurutan dari mengingat sampai menganalisis", () => {
    assert.deepEqual([...THINKING_LEVELS], ["mengingat", "memahami", "mengaplikasikan", "menganalisis"])
    assert.deepEqual(
      THINKING_LEVELS.map((level) => THINKING_LEVEL_LABELS[level]),
      ["Mengingat", "Memahami", "Mengaplikasikan", "Menganalisis"]
    )
  })

  it("label berupa nama, bukan kode angka atau chip huruf besar", () => {
    for (const level of THINKING_LEVELS) {
      const label = THINKING_LEVEL_LABELS[level]
      assert.match(label, /^[A-Z][a-z]+$/, `"${label}" harus berupa satu kata berhuruf awal besar`)
    }
    assert.equal(UNTAGGED_THINKING_LEVEL_LABEL, "Belum ditandai")
  })

  it("ketikan pengajar diseragamkan, nilai asing ditolak", () => {
    assert.equal(normalizeThinkingLevel("  MENGINGAT "), "mengingat")
    assert.equal(normalizeThinkingLevel("Mengaplikasikan"), "mengaplikasikan")
    assert.equal(normalizeThinkingLevel("mengaplikasi"), null)
    assert.equal(normalizeThinkingLevel("sulit"), null)
    assert.equal(normalizeThinkingLevel(""), null)
    assert.equal(isThinkingLevel("menganalisis"), true)
    assert.equal(isThinkingLevel("analisis"), false)
  })

  it("butir tanpa penanda dibaca sebagai belum ditandai", () => {
    assert.equal(thinkingLevelLabel(undefined), UNTAGGED_THINKING_LEVEL_LABEL)
    assert.equal(thinkingLevelLabel(null), UNTAGGED_THINKING_LEVEL_LABEL)
    assert.equal(thinkingLevelLabel("memahami"), "Memahami")
  })

  it("batas label capaian sama antara server, penafsir, dan modul kosakata", () => {
    assert.equal(ACHIEVEMENT_REF_MAX_LENGTH, 80)
    assert.equal(IMPORT_ACHIEVEMENT_MAX, ACHIEVEMENT_REF_MAX_LENGTH)
  })

  it("modul kosakata tidak mengimpor apa pun agar bisa dipakai klien dan tes node", () => {
    const source = read("convex/model/thinkingLevels.ts")
    assert.doesNotMatch(source, /^import\s/m)
  })
})

describe("Penanda pengajar pada tempelan teks", () => {
  it("contoh format pada layar memuat pembahasan, berpikir, dan capaian tanpa alasan", () => {
    const parsed = parseQuestionImport(IMPORT_EXAMPLE, 5)
    assert.equal(parsed.items.length, 5)
    assert.equal(parsed.problemCount, 0)

    const first = parsed.items[0]
    assert.match(first.explanation, /Rukun pertama wudhu|rukun pertama wudhu/i)
    assert.equal(first.thinkingLevel, "memahami")
    assert.equal(first.achievementRef, "Thaharah — rukun wudhu")

    const essay = parsed.items.find((item) => item.type === "essay")
    assert.ok(essay)
    assert.equal(essay.thinkingLevel, "menganalisis")
    assert.equal(essay.achievementRef, "Thaharah — pembatal wudhu")
  })

  it("tingkat berpikir di luar empat pilihan menjadi baris bermasalah yang menunjuk baris sumber", () => {
    const parsed = parseQuestionImport(
      "1. Apa hukum thaharah?\nA. Wajib*\nB. Sunnah\nberpikir: sulit sekali",
      5
    )
    const item = parsed.items[0]
    assert.ok(item.problems.length > 0)
    assert.ok(item.problems.some((problem) => /baris ke-4/.test(problem)))
    assert.ok(item.problems.some((problem) => /tidak dikenal/.test(problem)))
    assert.equal(item.thinkingLevel, null)
  })

  it("label capaian yang terlalu panjang ditolak sebelum disimpan", () => {
    const longLabel = "x".repeat(85)
    const parsed = parseQuestionImport(`1. Apa hukum thaharah?\nA. Wajib*\nB. Sunnah\ncapaian: ${longLabel}`, 5)
    const item = parsed.items[0]
    assert.ok(item.problems.some((problem) => /melebihi 80 karakter/.test(problem)))
    assert.ok(item.problems.some((problem) => /baris ke-4/.test(problem)))
  })

  it("penanda hanya dikenali sebagai baris utuh, bukan potongan kalimat soal", () => {
    const parsed = parseQuestionImport(
      "1. Jelaskan makna pembahasan: adab bertanya dalam majelis.\nA. Benar*\nB. Salah",
      5
    )
    assert.equal(parsed.items[0].explanation, "")
    assert.match(parsed.items[0].questionText, /pembahasan: adab bertanya/)
  })

  it("payload impor membawa ketiga kolom hanya bila terisi", () => {
    const parsed = parseQuestionImport(
      "1. Apa hukum thaharah?\nA. Wajib*\nB. Sunnah\npembahasan: Karena thaharah syarat sah shalat.\nberpikir: Mengingat\ncapaian: Thaharah — dasar",
      5
    )
    const payload = toImportPayload(parsed.items[0])
    assert.equal(payload.explanation, "Karena thaharah syarat sah shalat.")
    assert.equal(payload.thinkingLevel, "mengingat")
    assert.equal(payload.achievementRef, "Thaharah — dasar")

    const polos = parseQuestionImport("1. Apa hukum thaharah?\nA. Wajib*\nB. Sunnah", 5)
    const polosPayload = toImportPayload(polos.items[0])
    assert.equal(polosPayload.explanation, undefined)
    assert.equal(polosPayload.thinkingLevel, undefined)
    assert.equal(polosPayload.achievementRef, undefined)
  })

  it("teks Arab berharakat pada pembahasan tetap utuh", () => {
    const arabic = "وَلَا تَقْرَبُوا الزِّنَا ۖ إِنَّهُ كَانَ فَاحِشَةً"
    const parsed = parseQuestionImport(`1. Apa hukumnya?\nA. Haram*\nB. Halal\npembahasan: ${arabic}`, 5)
    assert.equal(parsed.items[0].explanation, arabic)
  })

  it("petunjuk format menyebut ketiga penanda baru", () => {
    const hints = FORMAT_HINTS.join(" ")
    assert.match(hints, /pembahasan/i)
    assert.match(hints, /berpikir: memahami/i)
    assert.match(hints, /capaian:/i)
  })

  it("penafsir tetap mengenali nilai berpikir tanpa peduli besar-kecil huruf", () => {
    assert.equal(normalizeImportThinkingLevel("  Memahami "), "memahami")
    assert.equal(normalizeImportThinkingLevel("ANALISIS"), null)
    assert.equal(importThinkingLevelLabel(null), "Belum ditandai")
    assert.equal(importThinkingLevelLabel("mengaplikasikan"), "Mengaplikasikan")
  })

  it("pratinjau menampilkan kolom pembahasan, berpikir, dan capaian pada tabel dan kartu", () => {
    for (const label of ["Pembahasan", "Berpikir", "Capaian"]) {
      assert.ok(previewComponent.includes(label), `kolom ${label} harus ada pada pratinjau`)
    }
    assert.match(previewComponent, /importThinkingLevelLabel\(item\.thinkingLevel\)/)
    assert.match(previewComponent, /item\.explanation/)
    assert.match(previewComponent, /item\.achievementRef/)
  })
})

describe("Jalur simpan metadata butir", () => {
  it("skema menyimpan ketiga kolom secara opsional sehingga butir lama tetap sah", () => {
    const questionsTable = schema.slice(schema.indexOf("questions: defineTable"), schema.indexOf("// Sesi Ujian"))
    assert.match(questionsTable, /explanation: v\.optional\(v\.string\(\)\)/)
    assert.match(questionsTable, /achievementRef: v\.optional\(v\.string\(\)\)/)
    assert.match(questionsTable, /thinkingLevel: v\.optional\(/)
    for (const level of THINKING_LEVELS) {
      assert.ok(questionsTable.includes(`v.literal("${level}")`), `skema harus memuat ${level}`)
    }
  })

  it("tambah, sunting, dan impor memakai kolom body yang sama", () => {
    const bodyFields = bankMutations.slice(
      bankMutations.indexOf("const questionBodyFields"),
      bankMutations.indexOf("type QuestionBodyArgs")
    )
    for (const field of ["explanation", "thinkingLevel", "achievementRef"]) {
      assert.ok(bodyFields.includes(`${field}:`), `questionBodyFields harus memuat ${field}`)
    }

    for (const name of ["createQuestion", "updateQuestion"]) {
      const body = functionBody(bankMutations, name)
      assert.match(body, /explanation: optionalText\(args\.explanation\)/)
      assert.match(body, /thinkingLevel: args\.thinkingLevel/)
      assert.match(body, /achievementRef: optionalText\(args\.achievementRef\)/)
    }

    const importBody = functionBody(bankMutations, "importQuestions")
    assert.match(importBody, /explanation: optionalText\(item\.explanation\)/)
    assert.match(importBody, /achievementRef: optionalText\(item\.achievementRef\)/)
  })

  it("gandakan menyalin metadata tanpa mengubah isi butir", () => {
    const body = functionBody(bankMutations, "duplicateQuestion")
    assert.match(body, /explanation: question\.explanation/)
    assert.match(body, /thinkingLevel: question\.thinkingLevel/)
    assert.match(body, /achievementRef: question\.achievementRef/)
    assert.doesNotMatch(body, /orderNumber: question\.orderNumber/)
  })

  it("label capaian divalidasi panjangnya di server, bukan hanya di layar", () => {
    const validate = functionBody(bankMutations, "validateQuestionBody")
    assert.match(validate, /ACHIEVEMENT_REF_MAX_LENGTH/)
    assert.match(validate, /Rujukan capaian materi maksimal/)
  })

  it("saran capaian diambil dari label mapel yang sama dan wajib login", () => {
    const body = functionBody(bankQueries, "listAchievementLabels")
    assert.match(body, /requireAuthenticatedUser\(ctx\)/)
    assert.match(body, /by_subject/)
    assert.match(body, /achievementRef/)
    assert.match(body, /localeCompare/)
  })
})

describe("Pembahasan tidak pernah sampai ke santri", () => {
  it("lembar ujian santri memetakan kolom satu per satu tanpa metadata pengajar", () => {
    const body = functionBody(examQueries, "getStudentExamSheet")
    for (const field of ["explanation", "thinkingLevel", "achievementRef"]) {
      assert.ok(!body.includes(field), `lembar santri tidak boleh memuat ${field}`)
    }
    assert.match(body, /displayNumber/)
    assert.match(body, /questionText: q\.questionText/)
  })

  it("lembar koreksi pengajar memuat ketiga kolom", () => {
    const body = functionBody(examQueries, "getParticipantAnswersForGrading")
    assert.match(body, /explanation: q\.explanation/)
    assert.match(body, /thinkingLevel: q\.thinkingLevel/)
    assert.match(body, /achievementRef: q\.achievementRef/)
    assert.match(body, /creatorTokenIdentifier !== identity\.tokenIdentifier/)
  })

  it("simulasi Live Preview di editor tidak merender pembahasan", () => {
    const start = editorPage.indexOf("{/* VIEW 1: LIVE PREVIEW SISWA */}")
    const end = editorPage.indexOf("{/* VIEW 2: DAFTAR SOAL TERSIMPAN */}")
    assert.ok(start > 0 && end > start)
    const previewSection = editorPage.slice(start, end)
    assert.ok(!previewSection.includes("explanation"), "panel simulasi santri tidak boleh memuat pembahasan")
    assert.ok(!previewSection.includes("thinkingLevel"), "panel simulasi santri tidak boleh memuat tingkat berpikir")
  })

  it("halaman koreksi menampilkan pembahasan, tingkat berpikir, dan capaian", () => {
    assert.match(gradingPage, /Pembahasan:/)
    assert.match(gradingPage, /thinkingLevelLabel\(q\.thinkingLevel\)/)
    assert.match(gradingPage, /q\.achievementRef/)
  })
})

describe("Formulir butir memuat kolom pengajar", () => {
  it("formulir punya tiga kolom dengan label yang jelas", () => {
    assert.match(editorPage, /id="q-explanation"/)
    assert.match(editorPage, /Pembahasan \(tidak dilihat santri\)/)
    assert.match(editorPage, /id="q-thinking-level"/)
    assert.match(editorPage, /UNTAGGED_THINKING_LEVEL_LABEL/)
    assert.match(editorPage, /<SelectItem value="untagged">/)
    assert.match(editorPage, /id="q-achievement"/)
    assert.match(editorPage, /listAchievementLabels/)
  })

  it("tingkat berpikir memakai Select shadcn dengan empat pilihan baku", () => {
    assert.match(editorPage, /THINKING_LEVELS\.map/)
    assert.match(editorPage, /THINKING_LEVEL_LABELS\[level\]/)
    assert.ok(!editorPage.includes("<select"), "tidak boleh memakai select polos")
  })

  it("menyimpan dan membuka ulang mengembalikan ketiga nilai; kosong menjadi absen", () => {
    assert.match(editorPage, /setExplanation\(question\.explanation \?\? ""\)/)
    assert.match(editorPage, /setThinkingLevel\(question\.thinkingLevel \?\? "untagged"\)/)
    assert.match(editorPage, /setAchievementRef\(question\.achievementRef \?\? ""\)/)
    assert.match(editorPage, /explanation: explanation\.trim\(\) \|\| undefined/)
    assert.match(editorPage, /thinkingLevel: thinkingLevel === "untagged" \? undefined : thinkingLevel/)
    assert.match(editorPage, /achievementRef: achievementRef\.trim\(\) \|\| undefined/)
  })

  it("formulir dikosongkan setelah simpan agar butir berikutnya tidak mewarisi penanda", () => {
    const start = editorPage.indexOf("function resetForm()")
    const end = editorPage.indexOf("function startEdit(")
    assert.ok(start > 0 && end > start)
    const body = editorPage.slice(start, end)
    assert.match(body, /setExplanation\(""\)/)
    assert.match(body, /setThinkingLevel\("untagged"\)/)
    assert.match(body, /setAchievementRef\(""\)/)
  })
})
