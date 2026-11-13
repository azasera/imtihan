import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  MAX_CHOICE_OPTIONS,
  MIN_CHOICE_OPTIONS,
  addChoiceOption,
  defaultChoiceOptions,
  normalizeSingleKey,
  optionLabel,
  removeChoiceOption,
  resolveChoiceOptions,
  resolveTrueFalseAnswer,
  toStoredOptions,
} = (await import(new URL("../lib/question-options.ts", import.meta.url).href)) as typeof import("../lib/question-options")

type QuestionOptionDraft = ReturnType<typeof defaultChoiceOptions>[number]

function draft(label: string, text: string, isCorrect = false): QuestionOptionDraft {
  return { id: label.toLowerCase(), label, text, isCorrect }
}

describe("Pengatur jumlah opsi jawaban (A sampai E)", () => {
  it("memulai dengan empat baris kosong dan kunci pada baris pertama", () => {
    const options = defaultChoiceOptions()
    assert.equal(options.length, 4)
    assert.deepEqual(options.map((o) => o.label), ["A", "B", "C", "D"])
    assert.equal(options.filter((o) => o.isCorrect).length, 1)
    assert.equal(options[0].isCorrect, true)
  })

  it("menambah opsi sampai lima lalu berhenti di batas atas", () => {
    let options = defaultChoiceOptions(3)
    options = addChoiceOption(options)
    assert.equal(options.length, 4)
    options = addChoiceOption(options)
    assert.equal(options.length, MAX_CHOICE_OPTIONS)
    assert.deepEqual(options.map((o) => o.label), ["A", "B", "C", "D", "E"])

    const capped = addChoiceOption(options)
    assert.equal(capped.length, MAX_CHOICE_OPTIONS, "melebihi lima opsi tidak boleh bertambah")
  })

  it("mengurangi opsi sampai dua lalu berhenti di batas bawah", () => {
    const options = defaultChoiceOptions(4)
    assert.equal(removeChoiceOption(options, 3).length, 3)

    const two = removeChoiceOption(removeChoiceOption(options, 3), 2)
    assert.equal(two.length, MIN_CHOICE_OPTIONS)
    assert.equal(removeChoiceOption(two, 1).length, MIN_CHOICE_OPTIONS, "dua opsi adalah batas minimal")
  })

  it("memindahkan kunci ke opsi terdekat saat opsi kunci dihapus", () => {
    const options = [
      draft("A", "satu"),
      draft("B", "dua", true),
      draft("C", "tiga"),
      draft("D", "empat"),
    ]
    const next = removeChoiceOption(options, 1)

    assert.equal(next.length, 3)
    assert.equal(next.filter((o: { isCorrect: boolean }) => o.isCorrect).length, 1)
    assert.equal(next[1].text, "tiga", "huruf mengikuti posisi setelah baris dihapus")
    assert.equal(next[1].isCorrect, true)
    assert.deepEqual(next.map((o: { label: string }) => o.label), ["A", "B", "C"])
  })

  it("menolak menghapus baris di luar daftar tanpa mengubah kunci", () => {
    const options = defaultChoiceOptions(3)
    assert.equal(removeChoiceOption(options, 99).length, 3)
    assert.equal(removeChoiceOption(options, -1).length, 3)
    assert.equal(options.filter((o) => o.isCorrect).length, 1)
  })

  it("hanya mengirim baris berisi teks ke server dan menomori ulang hurufnya", () => {
    const options = [
      draft("A", ""),
      draft("B", "  dua  ", true),
      draft("C", ""),
      draft("D", "empat"),
    ]
    const stored = toStoredOptions(options)

    assert.equal(stored.length, 2)
    assert.deepEqual(
      stored.map((o: { id: string; label: string; text: string }) => [o.id, o.label, o.text]),
      [
        ["a", "A", "dua"],
        ["b", "B", "empat"],
      ]
    )
    assert.equal(stored[0].isCorrect, true, "kunci ikut berpindah ke baris pertama yang tersimpan")
  })

  it("memastikan selalu ada satu kunci walau baris kuncinya kosong", () => {
    const stored = normalizeSingleKey([
      draft("A", "", true),
      draft("B", "isi"),
    ])
    assert.equal(stored.length, 1)
    assert.equal(stored[0].isCorrect, true)
  })

  it("label huruf tersedia sampai opsi kelima", () => {
    assert.equal(optionLabel(0), "A")
    assert.equal(optionLabel(4), "E")
  })

  it("butir tersimpan dapat diisi ulang ke formulir sunting", () => {
    const stored = [
      { id: "a", label: "A", text: "satu", isCorrect: false },
      { id: "b", label: "B", text: "dua", isCorrect: true },
    ]
    const filled = resolveChoiceOptions(stored)
    assert.equal(filled.length, 2)
    assert.equal(filled[1].isCorrect, true)

    // Essay dan butir lama tanpa opsi tidak memunculkan baris opsi dan tidak melempar galat.
    assert.equal(resolveChoiceOptions(undefined).length, 4)
    assert.equal(resolveChoiceOptions([]).length, 4)
    assert.equal(resolveTrueFalseAnswer([{ id: "false", isCorrect: true }]), "false")
    assert.equal(resolveTrueFalseAnswer([{ id: "true", isCorrect: true }]), "true")
    assert.equal(resolveTrueFalseAnswer(undefined), "true")
  })
})

describe("Jalur tulis butir soal di backend", () => {
  const mutationsPath = path.join(APPS_ROOT, "convex", "bank", "public", "mutations.ts")
  const helpersPath = path.join(APPS_ROOT, "convex", "bank", "private", "helpers.ts")
  const queriesPath = path.join(APPS_ROOT, "convex", "bank", "public", "queries.ts")
  const mutations = fs.readFileSync(mutationsPath, "utf-8")
  const helpers = fs.readFileSync(helpersPath, "utf-8")
  const queries = fs.readFileSync(queriesPath, "utf-8")

  it("sunting dan gandakan butir adalah fungsi publik yang mengautentikasi pemanggil", () => {
    for (const name of ["updateQuestion", "duplicateQuestion"]) {
      assert.ok(mutations.includes(`export const ${name} = mutation({`), `${name} harus ada`)
      const body = mutations.slice(mutations.indexOf(`export const ${name} = mutation({`))
      const block = body.slice(0, body.indexOf("\n})") + 3)
      assert.match(block, /await requireAuthenticatedUser\(ctx\)/, `${name} wajib login`)
      assert.match(block, /requireEditableQuestion\(ctx, user/, `${name} memeriksa pemilik dan sesi aktif`)
    }
  })

  it("sunting butir tidak menyentuh nomor urut maupun paket induk", () => {
    const body = mutations.slice(
      mutations.indexOf("export const updateQuestion"),
      mutations.indexOf("export const duplicateQuestion")
    )
    assert.ok(!body.includes("orderNumber:"), "nomor urut tidak boleh ikut dipatch")
    assert.ok(!body.includes("bankId:"), "butir tidak boleh berpindah paket")
    assert.match(body, /ctx\.db\.patch\("questions"/)
    assert.match(body, /validateQuestionBody\(args\)/, "aturan kunci berlaku sama saat sunting")
  })

  it("gandakan menulis salinan utuh dengan nomor urut terakhir", () => {
    const body = mutations.slice(
      mutations.indexOf("export const duplicateQuestion"),
      mutations.indexOf("export const deleteQuestion")
    )
    assert.match(body, /await nextOrderNumber\(ctx, question\.bankId\)/)
    for (const field of ["stimulusText", "stimulusMediaUrl", "questionText", "points", "options", "rubric", "type"]) {
      assert.ok(body.includes(`${field}: question.${field}`), `salinan harus membawa ${field}`)
    }
  })

  it("penomoran memakai nomor terakhir, bukan jumlah butir", () => {
    assert.ok(!mutations.includes("existing.length + 1"), "jumlah butir tidak dapat dipakai untuk penomoran")
    assert.match(helpers, /by_bank_and_order/, "nomor terakhir dibaca lewat indeks penomoran")
    assert.match(helpers, /\.order\("desc"\)[\s\S]{0,80}\.first\(\)/)
    assert.match(helpers, /\(last\?\.orderNumber \?\? 0\) \+ 1/)
    assert.ok(!/fetchRange|\.all\(\)/.test(helpers), "penomoran tidak boleh memuat seluruh butir")
  })

  it("sesi yang masih berjalan menutup aksi sunting, gandakan, dan hapus", () => {
    assert.match(helpers, /status === "active"/)
    assert.match(helpers, /masih berjalan/)
    // Gerbangnya tunggal: tiga aksi butir memanggil jalur yang sama.
    const gated = ["updateQuestion", "duplicateQuestion", "deleteQuestion"]
    for (const name of gated) {
      const body = mutations.slice(mutations.indexOf(`export const ${name} = mutation({`))
      assert.match(body.slice(0, body.indexOf("\n})") + 3), /requireEditableQuestion\(/, `${name} belum tergaransi sesi aktif`)
    }
  })

  it("kunci sunting hanya terbaca oleh pemilik paket", () => {
    const body = queries.slice(queries.indexOf("export const getBankActiveLock"))
    assert.match(body, /ctx\.auth\.getUserIdentity\(\)/)
    assert.match(body, /authorTokenIdentifier !== identity\.tokenIdentifier/)
    assert.match(body, /return null/)
    assert.ok(!body.includes("questions"), "kunci sunting tidak memulangkan butir soal")
  })
})

describe("Layar sunting, gandakan, dan pengatur opsi", () => {
  const page = fs.readFileSync(
    path.join(APPS_ROOT, "app", "(main)", "bank-soal", "[id]", "page.tsx"),
    "utf-8"
  )
  const row = fs.readFileSync(
    path.join(APPS_ROOT, "components", "bank-soal", "question-row.tsx"),
    "utf-8"
  )
  const editor = fs.readFileSync(
    path.join(APPS_ROOT, "components", "bank-soal", "question-options-editor.tsx"),
    "utf-8"
  )

  it("judul kartu dan tombol utama berubah saat mode sunting", () => {
    assert.ok(page.includes('"Sunting Butir Soal"'))
    assert.ok(page.includes('"Simpan perubahan"'))
    assert.ok(page.includes("Batal sunting"))
    assert.ok(page.includes("cardTitleRef"), "fokus dipindahkan ke judul kartu")
  })

  it("pengatur opsi menonaktifkan tombol pada batas, bukan menghilangkannya", () => {
    assert.ok(editor.includes("MIN_CHOICE_OPTIONS"))
    assert.ok(editor.includes("MAX_CHOICE_OPTIONS"))
    assert.match(editor, /disabled=\{options\.length <= MIN_CHOICE_OPTIONS\}/)
    assert.match(editor, /disabled=\{options\.length >= MAX_CHOICE_OPTIONS\}/)
    assert.ok(editor.includes("Tambah Opsi"))
    assert.match(editor, /title=\{/, "alasan nonaktif dijelaskan lewat title")
    // Tombol nonaktif tidak menerima hover, jadi batasnya juga harus terbaca sebagai teks.
    assert.match(editor, /\{MIN_CHOICE_OPTIONS\}-\{MAX_CHOICE_OPTIONS\} opsi \(A sampai E\)/)
  })

  it("judul kartu dapat menerima fokus dengan cincin yang terlihat", () => {
    const focusable = page.slice(page.indexOf("ref={cardTitleRef}"))
    const span = focusable.slice(0, focusable.indexOf(">"))
    assert.ok(/className="[^"]*focus:ring-2/.test(span), "cincin fokus harus memakai focus:, bukan focus-visible:")
    assert.ok(/tabIndex=\{-1\}/.test(span))
  })

  it("aksi per baris tersedia untuk sunting, gandakan, dan hapus", () => {
    for (const label of ["Sunting butir nomor", "Gandakan butir nomor", "Hapus butir nomor"]) {
      assert.ok(row.includes(label), `${label} harus ada sebagai label aksesibel`)
    }
    assert.ok(row.includes("disabled={locked}"))
    assert.ok(row.includes("lockedReason"))
    assert.ok(row.includes("Sedang disunting"), "baris yang sedang disunting ditandai dengan label teks")
  })

  it("opsi butir benar/salah tidak merender awalan label huruf agar tidak bertumpukan", () => {
    assert.ok(row.includes('question.type === "true_false"'))
    assert.ok(row.includes("!isTrueFalse &&"))
    assert.ok(row.includes("min-w-5 shrink-0 font-mono"))
  })

  it("tidak ada kode spesifikasi teknis pada teks antarmuka baru", () => {
    const leak = /\b(SCR-[A-Z0-9-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/
    for (const [name, content] of [
      ["page.tsx", page],
      ["question-row.tsx", row],
      ["question-options-editor.tsx", editor],
    ]) {
      assert.ok(!leak.test(content), `${name} memuat kode spesifikasi teknis`)
    }
  })
})
