import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  FORMAT_HINTS,
  IMPORT_EXAMPLE,
  chunkImportItems,
  importTypeLabel,
  parseQuestionImport,
  toImportPayload,
} = (await import(new URL("../lib/question-import.ts", import.meta.url).href)) as typeof import("../lib/question-import")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

/** Alasan wajib menunjuk baris teks sumber, bukan hanya menyebut kesalahannya. */
function assertPointsAtLine(reason: string, message = "alasan harus menunjuk baris sumber") {
  assert.match(reason, /baris ke-\d+/, message)
}

describe("Penafsir tempelan teks: empat tipe soal dan status per butir", () => {
  const parsed = parseQuestionImport(IMPORT_EXAMPLE, 5)

  it("contoh format pada layar menafsir bersih tanpa satu pun alasan", () => {
    assert.equal(parsed.items.length, 5)
    assert.equal(parsed.readyCount, 5)
    assert.equal(parsed.problemCount, 0)
    assert.deepEqual(
      parsed.items.map((item) => item.type),
      ["multiple_choice", "true_false", "essay", "multiple_choice", "pg_kompleks"]
    )
  })

  it("setiap butir menyorongkan nomor urut tafsiran, tipe, bobot, opsi, dan kunci", () => {
    for (const item of parsed.items) {
      assert.ok(item.number >= 1)
      assert.ok(item.type)
      assert.ok(item.points > 0)
      assert.ok(Array.isArray(item.options))
      assert.ok(Array.isArray(item.problems))
    }
    const mc = parsed.items[0]
    assert.deepEqual(mc.options.map((o) => o.label), ["A", "B", "C", "D"])
    assert.deepEqual(mc.options.filter((o) => o.isCorrect).map((o) => o.label), ["A"])
    const kompleks = parsed.items[4]
    assert.deepEqual(kompleks.options.filter((o) => o.isCorrect).map((o) => o.label), ["A", "C"])
  })

  it("penanda tipe dikenali dan hilang dari teks soal, tanpa penanda berarti pilihan ganda", () => {
    const r = parseQuestionImport(
      [
        "1. Manakah yang tepat?",
        "A. satu*",
        "B. dua",
        "",
        "2. (pg kompleks) Manakah yang benar?",
        "A. satu*",
        "B. dua*",
        "C. tiga",
        "",
        "3. (benar/salah) Wudhu wajib sebelum salat.",
        "B",
        "",
        "4. (essay) Jelaskan rukun wudhu.",
        "",
        "5. [essay] Sebutkan pembatal wudhu.",
      ].join("\n"),
      5
    )
    assert.deepEqual(
      r.items.map((item) => item.type),
      ["multiple_choice", "pg_kompleks", "true_false", "essay", "essay"]
    )
    assert.equal(r.items[1].questionText, "Manakah yang benar?")
    assert.equal(r.items[2].questionText, "Wudhu wajib sebelum salat.")
    assert.ok(!r.items[3].questionText.includes("(essay)"))
    // essay tanpa opsi dan tanpa rubrik tetap siap: rubrik bukan syarat simpan.
    assert.deepEqual(r.items[3].problems, [])
    assert.equal(r.items[3].options.length, 0)
  })

  it("soal benar/salah merakit dua opsi baku dengan satu kunci", () => {
    const ben = parseQuestionImport("1. (benar/salah) Pernyataan benar.\nB", 5).items[0]
    assert.equal(ben.trueFalseKey, "Benar")
    assert.deepEqual(ben.options.map((o) => o.label), ["Benar", "Salah"])
    assert.equal(ben.options.filter((o) => o.isCorrect).length, 1)

    const salah = parseQuestionImport("1. (benar/salah) Pernyataan keliru.\ns", 5).items[0]
    assert.equal(salah.trueFalseKey, "Salah")
    assert.equal(salah.options.find((o) => o.label === "Salah")?.isCorrect, true)
  })

  it("opsi berhenti di huruf E dan huruf yang tertulis dua kali dilaporkan", () => {
    const beyond = parseQuestionImport(
      "1. Manakah tepat?\nA. satu*\nB. dua\nC. tiga\nD. empat\nE. lima\nF. enam",
      5
    ).items[0]
    assert.equal(beyond.options.length, 5)
    assert.equal(beyond.problems.length, 1)
    assert.match(beyond.problems[0], /melebihi huruf E/)
    assertPointsAtLine(beyond.problems[0])

    const dup = parseQuestionImport("1. Manakah tepat?\nA. satu*\nA. duplikat\nB. tiga", 5).items[0]
    assert.match(dup.problems[0], /tertulis dua kali/)
    assertPointsAtLine(dup.problems[0])
  })

  it("opsi berhuruf tanpa teks tidak menyatu ke teks soal", () => {
    const item = parseQuestionImport("1. Manakah tepat?\nA. \nB. dua*\nC. tiga", 5).items[0]
    assert.equal(item.questionText, "Manakah tepat?", "baris \"A.\" tidak boleh dianggap lanjutan teks soal")
    assert.equal(item.options.length, 2)
    assert.match(item.problems[0], /tidak ada teksnya/)
    assert.match(item.problems[0], /baris ke-2/)
  })

  it("opsi berbintang tanpa teks menghasilkan butir yang tidak lolos", () => {
    const item = parseQuestionImport("1. Manakah tepat?\nA. *\nB. dua*\nC. tiga", 5).items[0]
    assert.ok(item.problems.length > 0)
    assert.match(item.problems.join(" "), /kosong teksnya/)
  })

  it("kunci pilihan ganda tepat satu dan pg kompleks minimal dua", () => {
    const noKey = parseQuestionImport("1. Manakah tepat?\nA. satu\nB. dua", 5).items[0]
    assert.match(noKey.problems.join(" "), /belum ada kunci jawaban/)
    assertPointsAtLine(noKey.problems[0])

    const twoKeys = parseQuestionImport("1. Manakah tepat?\nA. satu*\nB. dua*\nC. tiga", 5).items[0]
    assert.match(twoKeys.problems.join(" "), /seharusnya tepat satu/)

    const kompleksSatu = parseQuestionImport(
      "1. (pg kompleks) Manakah tepat?\nA. satu*\nB. dua\nC. tiga",
      5
    ).items[0]
    assert.match(kompleksSatu.problems.join(" "), /minimal 2 kunci jawaban/)
  })

  it("opsi dan kunci yang tidak cocok dengan tipenya dilaporkan beserta baris sumbernya", () => {
    const essayWithOps = parseQuestionImport("1. (essay) Jelaskan.\nA. satu", 5).items[0]
    assert.match(essayWithOps.problems.join(" "), /soal essay .* ikut membawa 1 opsi/)
    assertPointsAtLine(essayWithOps.problems[0], "alasan opsi essay menunjuk baris soal")

    const tfWithOps = parseQuestionImport("1. (benar/salah) Pernyataan.\nA. satu\nB", 5).items[0]
    assert.match(tfWithOps.problems.join(" "), /membawa opsi berhuruf/)

    const kunciDuaKali = parseQuestionImport("1. (benar/salah) Pernyataan.\nB\nS", 5).items[0]
    assert.match(kunciDuaKali.problems.join(" "), /ditulis lebih dari sekali/)
    assert.match(kunciDuaKali.problems.join(" "), /baris ke-2, ke-3/)

    // Huruf B lepas di soal pilihan ganda adalah lanjutan opsi terakhir, bukan kunci.
    const mc = parseQuestionImport("1. Manakah tepat?\nA. satu*\nB. dua\nB\nC. tiga", 5).items[0]
    assert.equal(mc.options[1].text, "dua B")
    assert.equal(mc.trueFalseKey, null)
  })

  it("butir tanpa teks soal dan benar/salah tanpa kunci ditolak dengan alasan", () => {
    const tanpaTeks = parseQuestionImport("1.\nA. satu*\nB. dua", 5).items[0]
    assert.match(tanpaTeks.problems.join(" "), /teks soal tidak ditemukan/)
    assertPointsAtLine(tanpaTeks.problems[0])

    const tanpaKunci = parseQuestionImport("1. (benar/salah) Pernyataan.", 5).items[0]
    assert.match(tanpaKunci.problems.join(" "), /kunci B atau Salah belum ditulis/)
    assertPointsAtLine(tanpaKunci.problems[0])
  })

  it("bobot memakai baris poin, nilai bawaan layar, atau ditolak bila bukan angka", () => {
    const withPoints = parseQuestionImport("1. Manakah tepat?\nA. satu*\nB. dua\npoin: 3", 7).items[0]
    assert.equal(withPoints.points, 3)

    const builtin = parseQuestionImport("1. Manakah tepat?\nA. satu*\nB. dua", 7).items[0]
    assert.equal(builtin.points, 7)

    const decimal = parseQuestionImport("1. Manakah tepat?\nA. satu*\nB. dua\npoin: 2,5", 7).items[0]
    assert.equal(decimal.points, 2.5)

    const rusak = parseQuestionImport("1. Manakah tepat?\nA. satu*\nB. dua\npoin: banyak", 7).items[0]
    assert.equal(rusak.points, 7, "bobot rusak memakai nilai bawaan, bukan NaN")
    assert.match(rusak.problems[0], /bukan angka lebih besar dari nol/)
    assert.match(rusak.problems[0], /baris ke-4/)
  })

  it("rubrik essay tersimpan dan tidak dianggap teks soal", () => {
    const item = parseQuestionImport(
      "1. (essay) Jelaskan tiga pembatal wudhu.\nrubrik: Nilai penuh bila menyebut tiga pembatal.",
      5
    ).items[0]
    assert.equal(item.questionText, "Jelaskan tiga pembatal wudhu.")
    assert.equal(item.rubric, "Nilai penuh bila menyebut tiga pembatal.")
  })

  it("baris kosong memisahkan butir dan angka di awal baris hanya penanda pemisah", () => {
    const r = parseQuestionImport(
      ["9. Butir pertama?", "A. satu*", "B. dua", "", "3. Butir kedua?", "A. sep*", "B. dua"].join("\n"),
      5
    )
    assert.deepEqual(
      r.items.map((item) => item.number),
      [1, 2],
      "nomor tafsiran berurutan, bukan menuruti angka yang ditulis pengajar"
    )
    assert.deepEqual(
      r.items.map((item) => item.sourceLine),
      [1, 5]
    )
    assert.equal(r.items[0].questionText, "Butir pertama?")
  })

  it("wacana berlaku untuk butir sesudahnya sampai blok wacana berikutnya", () => {
    const r = parseQuestionImport(
      [
        "WACANA: Kolam ikan di halaman pesantren berukuran 8 meter kali 5 meter.",
        "1. Berapa luas kolam?",
        "A. 40 m*",
        "B. 13 m",
        "",
        "2. Berapa keliling kolam?",
        "A. 26 m*",
        "B. 40 m",
        "",
        "WACANA: Santri lain membaca kitab di serambi.",
        "3. Siapa yang membaca?",
        "A. Santri*",
        "B. Ustadz",
      ].join("\n"),
      5
    )
    assert.equal(r.items[0].stimulusText, "Kolam ikan di halaman pesantren berukuran 8 meter kali 5 meter.")
    assert.equal(r.items[1].stimulusText, r.items[0].stimulusText, "wacana tetap dipakai butir berikutnya")
    assert.equal(r.items[2].stimulusText, "Santri lain membaca kitab di serambi.")
    assert.equal(r.readyCount, 3)
  })

  it("wacana multi-baris dirakit dan tidak dianggap soal baru", () => {
    const r = parseQuestionImport(
      [
        "WACANA: Baris pertama wacana.",
        "Baris kedua wacana yang masih satu blok.",
        "1. Apa simpulannya?",
        "A. Tepat*",
        "B. Keliru",
      ].join("\n"),
      5
    )
    assert.equal(r.items.length, 1)
    assert.equal(r.items[0].stimulusText, "Baris pertama wacana.\nBaris kedua wacana yang masih satu blok.")
  })

  it("baris lanjutan dirakit ke teks soal atau ke opsi terakhir", () => {
    const r = parseQuestionImport(
      ["1. Perhatikan dua pernyataan berikut.", "Pernyataan kedua ada di baris ini.", "A. satu*", "B. dua lanjutannya"].join("\n"),
      5
    ).items[0]
    assert.equal(r.questionText, "Perhatikan dua pernyataan berikut.\nPernyataan kedua ada di baris ini.")
    assert.equal(r.options[1].text, "dua lanjutannya")
  })

  it("tempelan kosong atau tak bernomor tidak menghasilkan butir", () => {
    const kosong = parseQuestionImport("   \n\n  \t \n", 5)
    assert.deepEqual(kosong.items, [])
    assert.equal(kosong.readyCount, 0)
    assert.equal(kosong.lineCount, 0)
  })

  it("teks Arab berharakat lolos tanpa rusak", () => {
    const naskah = [
      "1. Perhatikan firman Allah: ﴿وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ﴾ Lalu tentukan hukumnya?",
      "A. وَاجِبٌ على كل مسلم*",
      "B. سُنَّةٌ مُؤَكَّدَة",
      "C. مُبَاحٌ",
    ].join("\n")
    const item = parseQuestionImport(naskah, 5).items[0]
    assert.ok(item.questionText.includes("وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ"), "harakat pada teks soal utuh")
    assert.ok(item.questionText.includes("﴿"), "tanda kutip Arab utuh")
    assert.equal(item.options[0].text, "وَاجِبٌ على كل مسلم")
    assert.equal(item.options[0].isCorrect, true, "bintang tetap terbaca walau teksnya Arab")
    assert.equal(item.options[2].text, "مُبَاحٌ")
    assert.deepEqual(item.problems, [])
  })

  it("tempelan dari peramban dengan akhiran CRLF ditafsir sama", () => {
    const r = parseQuestionImport("1. Manakah tepat?\r\nA. satu*\r\nB. dua\r\n\r\n2. Manakah tepat lagi?\r\nA. satu*\r\nB. dua", 5)
    assert.equal(r.items.length, 2)
    assert.equal(r.readyCount, 2)
    assert.ok(!r.items[0].questionText.includes("\r"))
  })

  it("baris lembar kerja dikenali sebagai bentuk sendiri, bukan dilebur ke teks bernomor", () => {
    const sheet = parseQuestionImport(
      ["soal\ttipe\ta\tb\tkunci", "Manakah tepat?\tpg\tsatu\tdua\tA", "", "Soal kedua\tpg\tsatu\tdua\tB"].join("\n"),
      5
    )
    assert.equal(sheet.format, "spreadsheet")
    assert.equal(sheet.headerDetected, true)
    assert.equal(sheet.items.length, 2, "baris kosong dilewati, bukan menjadi butir rusak")
    assert.equal(sheet.readyCount, 2)

    const campuran = parseQuestionImport(
      ["1. Manakah tepat?", "A. satu*", "B. dua", "2\tBaris tab selip", "3. Manakah lagi?", "A. satu*", "B. dua"].join("\n"),
      5
    )
    // Satu baris bertab saja tidak membalik seluruh naskah menjadi bentuk lembar kerja.
    assert.equal(campuran.format, "numbered")
    assert.equal(campuran.items.length, 2, "naskah campuran tetap menghasilkan pratinjau per baris")
    assert.match(campuran.items[0].problems.join(" "), /berpisahkan tab/)
    assert.deepEqual(campuran.items[1].problems, [])
    assert.equal(campuran.readyCount, 1)
  })

  it("menghitung butir siap dan perlu perbaikan sekaligus", () => {
    const r = parseQuestionImport(
      ["1. Manakah tepat?", "A. satu*", "B. dua", "", "2. Manakah tepat?", "A. satu", "B. dua"].join("\n"),
      5
    )
    assert.equal(r.items.length, 2)
    assert.equal(r.readyCount, 1)
    assert.equal(r.problemCount, 1)
    assert.equal(r.lineCount, 6)
  })

  it("dua ratus butir dalam satu tempelan tetap terbaca dan penafsirannya cepat", () => {
    const blok = (i: number) =>
      `${i}. Butir nomor ${i}, manakah yang tepat?\nA. satu*\nB. dua\nC. tiga\nD. empat\n`
    const r = parseQuestionImport(Array.from({ length: 200 }, (_, k) => blok(k + 1)).join("\n"), 5)
    assert.equal(r.items.length, 200)
    assert.equal(r.readyCount, 200)
    assert.equal(r.problemCount, 0)
    assert.equal(r.items[199].number, 200)
    // Batas longgar: penafsiran 200 butir terukur sekitar 2 ms, jadi angka ini hanya menangkap regresi besar.
    const mulai = performance.now()
    parseQuestionImport(Array.from({ length: 200 }, (_, k) => blok(k + 1)).join("\n"), 5)
    assert.ok(performance.now() - mulai < 400, "penafsiran 200 butir harus jauh di bawah setengah detik")
  })
})

describe("Badan butir dan tahap penyimpanan", () => {
  it("payload essay membawa rubrik tanpa opsi, pilihan ganda membawa opsi", () => {
    const parsed = parseQuestionImport(IMPORT_EXAMPLE, 5)
    const essay = parsed.items.find((item) => item.type === "essay")!
    const essayPayload = toImportPayload(essay)
    assert.equal(essayPayload.type, "essay")
    assert.ok(essayPayload.rubric)
    assert.equal(essayPayload.options, undefined)

    const mc = toImportPayload(parsed.items[0])
    assert.equal(mc.options?.length, 4)
    assert.equal(mc.rubric, undefined)
    assert.equal(mc.stimulusText, undefined)
  })

  it("payload benar/salah memakai dua opsi baku dan wacana ikut terkirim", () => {
    const parsed = parseQuestionImport(IMPORT_EXAMPLE, 5)
    const tf = toImportPayload(parsed.items[1])
    assert.deepEqual(tf.options?.map((o) => o.label), ["Benar", "Salah"])
    assert.equal(tf.options?.filter((o) => o.isCorrect).length, 1)

    const wacana = toImportPayload(parsed.items[3])
    assert.match(wacana.stimulusText ?? "", /santri membaca Quran/)
  })

  it("membagi 200 butir menjadi tahap berisi 25 butir", () => {
    const items = Array.from({ length: 200 }, (_, i) => i)
    const stages = chunkImportItems(items)
    assert.equal(stages.length, 8)
    assert.deepEqual(stages[0].length, 25)
    assert.deepEqual(stages[7], [175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199])
  })

  it("tahap terakhir memotong sisa dan masukan kosong tidak menghasilkan tahap", () => {
    assert.deepEqual(chunkImportItems([1, 2, 3], 2), [[1, 2], [3]])
    assert.deepEqual(chunkImportItems([]), [])
    assert.deepEqual(chunkImportItems(["a"], 10), [["a"]])
  })

  it("ukuran tahap default tidak pernah melewati batas satu mutasi", () => {
    const mutations = read(path.join("convex", "bank", "public", "mutations.ts"))
    const limit = Number(/const IMPORT_BATCH_LIMIT = (\d+)/.exec(mutations)?.[1])
    assert.ok(Number.isFinite(limit) && limit > 0, "batas tahap impor harus berupa angka")
    const ukuran = chunkImportItems(Array.from({ length: limit })).reduce(
      (max, stage) => Math.max(max, stage.length),
      0
    )
    assert.ok(ukuran <= limit, "satu tahap tidak boleh melebihi batas mutasi")
  })

  it("label tipe soal memakai nama yang tampil di daftar butir", () => {
    assert.equal(importTypeLabel("multiple_choice"), "Pilihan Ganda")
    assert.equal(importTypeLabel("pg_kompleks"), "PG Kompleks")
    assert.equal(importTypeLabel("true_false"), "Benar / Salah")
    assert.equal(importTypeLabel("essay"), "Essay")
  })
})

describe("Jalur tulis massal di backend", () => {
  const mutations = read(path.join("convex", "bank", "public", "mutations.ts"))
  const body = mutations.slice(
    mutations.indexOf("export const importQuestions"),
    mutations.indexOf("\n})", mutations.indexOf("export const importQuestions")) + 3
  )

  it("impor adalah mutasi ber-argumen paket dan daftar butir", () => {
    assert.match(body, /export const importQuestions = mutation\(\{/)
    assert.match(body, /bankId: v\.id\("questionBanks"\)/)
    assert.match(body, /items: v\.array\(v\.object\(questionBodyFields\)\)/)
  })

  it("hanya dapat menulis ke paket milik pengajar yang masuk dan tidak sedang diujikan", () => {
    assert.ok(body.indexOf("await requireAuthenticatedUser(ctx)") < body.indexOf("ctx.db.insert"), "gerbang identitas harus di depan")
    assert.ok(body.indexOf("await requireBankEditable(ctx, user, args.bankId)") < body.indexOf("ctx.db.insert"), "gerbang kepemilikan dan sesi harus di depan")
    assert.ok(!/userId|ownerId|authorTokenIdentifier:\s*v\./.test(body), "kepemilikan tidak diambil dari argumen pemanggil")
    const editable = read(path.join("convex", "bank", "private", "helpers.ts"))
    const gate = editable.slice(
      editable.indexOf("export async function getActiveSessionForBank"),
      editable.indexOf("export async function requireEditableQuestion")
    )
    assert.match(gate, /status === "active"/, "kunci membaca sesi yang masih berjalan")
    assert.match(gate, /await requireOwnedBank\(ctx, user, bankId\)/, "impor mewarisi pemeriksaan pemilik")
    assert.match(gate, /throw new Error\(/, "sesi berjalan ditolak dengan pesan")
  })

  it("menolak tempelan kosong dan tempelan yang melewati batas satu tahap", () => {
    assert.match(body, /args\.items\.length === 0/)
    assert.match(body, /Tidak ada butir soal yang dapat disimpan dari tempelan ini\./)
    assert.match(body, /args\.items\.length > IMPORT_BATCH_LIMIT/)
    assert.match(body, /Satu tahap impor maksimal \$\{IMPORT_BATCH_LIMIT\} butir soal\./)
  })

  it("memeriksa seluruh butir sebelum satu butir pun ditulis", () => {
    assert.ok(body.indexOf("validateQuestionBody(item)") < body.indexOf("ctx.db.insert"), "validasi harus mendahului penulisan")
    assert.match(body, /Butir ke-\$\{index \+ 1\} pada tahap ini tidak dapat disimpan/)
    assert.match(body, /args\.items\.forEach\(\(item, index\) => \{/)
  })

  it("nomor urut melanjutkan butir terakhir paket", () => {
    assert.match(body, /let orderNumber = await nextOrderNumber\(ctx, args\.bankId\)/)
    assert.match(body, /const firstOrderNumber = orderNumber/)
    assert.match(body, /orderNumber \+= 1/)
    assert.match(body, /lastOrderNumber: orderNumber - 1/)
    assert.ok(!body.includes("existing.length"), "penomoran tidak memakai jumlah butir")
  })

  it("mengembalikan berapa butir yang masuk agar kegagalan dapat dilaporkan", () => {
    assert.match(body, /inserted: args\.items\.length/)
    assert.match(body, /firstOrderNumber,/)
  })

  it("memakai badan butir yang sama dengan jalur tulis satu per satu", () => {
    const create = mutations.slice(
      mutations.indexOf("export const createQuestion = mutation({"),
      mutations.indexOf("export const importQuestions")
    )
    assert.match(create, /\.\.\.questionBodyFields/)
    for (const field of ["type", "questionText", "points", "options", "rubric", "stimulusText", "stimulusMediaUrl"]) {
      assert.ok(body.includes(field), `impor harus menyalin ${field}`)
    }
  })
})

describe("Layar penulisan cepat: penafsiran dulu, penulisan belakangan", () => {
  const panel = read(path.join("components", "bank-soal", "question-import-panel.tsx"))
  const preview = read(path.join("components", "bank-soal", "question-import-preview.tsx"))
  const page = read(path.join("app", "(main)", "bank-soal", "[id]", "page.tsx"))

  it("penafsiran berjalan di perangkat pengajar sebelum ada panggilan ke server", () => {
    assert.ok(panel.indexOf("parseQuestionImport(") < panel.indexOf("await importQuestions("), "menafsir harus mendahului menulis")
    assert.equal(panel.match(/await importQuestions\(/g)?.length, 1, "hanya satu panggilan tulis")
    assert.match(panel, /for \(const chunk of chunkImportItems\(payloads\)\)/)
    assert.ok(!panel.includes("useEffect"), "penafsiran tidak boleh dipicu otomatis oleh efek")
  })

  it("tidak ada butir yang dibuka pratinjau atau tersimpan bila naskah tidak terbaca", () => {
    assert.match(panel, /result\.items\.length === 0/)
    assert.match(panel, /setParsed\(null\)/)
    assert.match(panel, /Tidak ada butir yang terbaca\./)
    assert.match(panel, /kolom yang dikenali/)
    assert.match(panel, /Unduh template kolom di atas lalu tempel kembali hasilnya\./)
  })

  it("satu pemicu di kolom tempel: periksa tulisan, dan nonaktif bila kolom kosong", () => {
    assert.match(panel, /Periksa tulisan/)
    assert.match(panel, /onClick=\{handleCheck\}/)
    assert.match(panel, /disabled=\{text\.trim\(\) === ""\}/)
    // Hanya satu tombol utama di layar tempel: tombol lain memakai variant explisit.
    assert.equal(panel.match(/<Button\b/g)?.length, 4)
    assert.equal(panel.match(/variant="(outline|ghost)"/g)?.length, 3)
  })

  it("petunjuk format menuliskan seluruh aturan penafsiran di layar", () => {
    assert.match(panel, /\{FORMAT_HINTS\.map\(\(hint\) => \(/)
    assert.match(panel, /<ol className=/)
    const hints = FORMAT_HINTS.join(" ")
    for (const aturan of ["(pg kompleks)", "(benar/salah)", "(essay)", "WACANA:", "poin: 3", "rubrik:", "B atau S"]) {
      assert.ok(hints.includes(aturan), `petunjuk harus memuat ${aturan}`)
    }
    assert.match(hints, /Tanpa penanda tipe, butir dianggap Pilihan Ganda/)
    assert.match(hints, /nomor urut mengikuti urutan paket/)
  })

  it("contoh format dapat disalin dan kolom bobot bawaan ada", () => {
    assert.match(panel, /navigator\.clipboard\.writeText\(IMPORT_EXAMPLE\)/)
    assert.match(panel, /Salin contoh format/)
    assert.match(panel, /id="import-default-points"/)
    assert.match(panel, /parseQuestionImport\(text, defaultPoints/)
  })

  it("panel menyediakan unduhan template kolom dan petunjuk lembar kerja", () => {
    assert.match(panel, /Unduh template kolom/)
    assert.match(panel, /buildImportTemplateText\(\)/)
    assert.match(panel, /template-impor-soal\.tsv/)
    assert.match(panel, /SPREADSHEET_FORMAT_HINTS\.map/)
    assert.match(preview, /format === "spreadsheet"/)
    assert.match(preview, /kolom diabaikan/)
  })

  it("pratinjau menyatakan jumlah butir dan nomor urut awal sebelum konfirmasi", () => {
    assert.match(preview, /\{readyCount\} butir siap disimpan/)
    assert.match(preview, /\{problemCount\} butir perlu perbaikan/)
    assert.match(preview, /masuk mulai nomor urut #\{startOrderNumber\}/)
    assert.match(preview, /const saveLabel = `Simpan \$\{items\.length\} butir soal`/)
    assert.match(preview, /Simpan \$\{readyCount\} butir yang siap/)
  })

  it("status per butir berupa label teks, bukan hanya warna", () => {
    assert.match(preview, /label: "Siap"/)
    assert.match(preview, /label: "Perlu perbaikan"/)
    assert.match(preview, /\{status\.label\}/)
    assert.match(preview, /\{item\.problems\.map\(\(problem\) => \(/)
  })

  it("menyimpan sebagian adalah tekanan sengaja dan tombol utama menunggu naskah bersih", () => {
    assert.match(preview, /problemCount > 0 && readyCount > 0 && \(/)
    assert.match(preview, /disabled=\{isSaving \|\| problemCount > 0 \|\| readyCount === 0\}/)
    assert.match(preview, /Tombol utama menunggu sampai semua baris valid\./)
    assert.match(preview, /Menyimpan \$\{savedCount\} dari \$\{readyCount\}\.\.\./)
  })

  it("tabel pada layar sedang ke atas dan kartu pada layar kecil", () => {
    assert.match(preview, /className="hidden md:block/)
    assert.match(preview, /<table className="w-full text-xs">/)
    assert.match(preview, /className="md:hidden space-y-2"/)
    for (const header of ["Tipe", "Bobot", "Status"]) {
      assert.ok(preview.includes(`>${header}</th>`), `kepala tabel ${header} harus ada`)
    }
  })

  it("dapat kembali ke naskah dan pratinjau tidak menulis apa pun", () => {
    assert.match(preview, /Periksa ulang naskah/)
    assert.match(preview, /onClick=\{onBackToText\}/)
    assert.ok(!preview.includes("useMutation"), "pratinjau tidak memanggil server sendiri")
    // Layar berganti dari kolom tempel ke pratinjau: ringkasan menerima fokus dengan cincin terlihat.
    assert.match(preview, /summaryRef\.current\?\.focus\(\)/)
    assert.match(preview, /ref=\{summaryRef\}/)
    assert.match(preview, /tabIndex=\{-1\}/)
    assert.match(preview, /focus:ring-2/)
  })

  it("kegagalan di tengah melaporkan berapa butir yang sudah masuk", () => {
    assert.match(panel, /\$\{entered\} butir sudah masuk\. \$\{remaining\.length\} butir belum tersimpan\./)
    assert.match(panel, /butir sudah masuk ke paket\./)
    assert.match(panel, /setParsed\(\(current\) =>/)
    assert.match(panel, /items: remaining/)
  })

  it("mode tulis dua jalur dan panel impor memakai nomor urut paket", () => {
    assert.match(page, /React\.useState<"single" \| "bulk">\("single"\)/)
    assert.match(page, /const showSingleForm = writeMode === "single" \|\| editingId !== null/)
    assert.match(page, /<QuestionImportPanel/)
    assert.match(page, /startOrderNumber=\{upcomingOrderNumber\}/)
    assert.match(page, /onSaved=\{handleImportSaved\}/)
    assert.match(page, /Tempel Banyak Butir Sekaligus/)
    assert.match(page, /\$\{count\} butir soal tersimpan dan sudah tampil di daftar\./)
  })

  it("tidak ada kode spesifikasi teknis pada teks antarmuka impor", () => {
    const leak = /\b(SCR-[A-Z0-9-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|CHG-\d+|Fase\s+\d+)\b/
    const sources: Array<[string, string]> = [
      ["question-import.ts", read(path.join("lib", "question-import.ts"))],
      ["question-import-panel.tsx", panel],
      ["question-import-preview.tsx", preview],
      ["page.tsx", page],
    ]
    for (const [name, content] of sources) {
      assert.ok(!leak.test(content), `${name} memuat kode spesifikasi teknis`)
    }
  })

  it("tidak ada emoji pada teks antarmuka impor", () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    for (const [name, content] of [
      ["question-import.ts", read(path.join("lib", "question-import.ts"))],
      ["question-import-panel.tsx", panel],
      ["question-import-preview.tsx", preview],
    ] as Array<[string, string]>) {
      assert.ok(!emoji.test(content), `${name} memuat emoji`)
    }
  })
})

describe("Tempelan Markdown: nomor bergaris miring dan pemisah baris paksa", () => {
  const BENAR = "1\\. (Benar/Salah) Menuntut ilmu wajib bagi setiap Muslim.\\\nB\\\npoin: 5"
  const SALAH = "2\\. (Benar/Salah) Ilmu shalat termasuk Fardhu Kifayah.\\\nS\\\npoin: 5"

  it("butir benar/salah tetap terpecah dan kuncinya terbaca", () => {
    const r = parseQuestionImport(`${BENAR}\n\n${SALAH}`, 5)
    assert.equal(r.items.length, 2)
    assert.equal(r.readyCount, 2)
    assert.equal(r.problemCount, 0)
    assert.deepEqual(r.items.map((i) => i.type), ["true_false", "true_false"])
    assert.deepEqual(r.items.map((i) => i.trueFalseKey), ["Benar", "Salah"])
    assert.deepEqual(r.items.map((i) => i.points), [5, 5])
  })

  it("butir terpecah walau tidak ada baris kosong di antaranya", () => {
    const r = parseQuestionImport(`${BENAR}\n${SALAH}`, 5)
    assert.equal(r.items.length, 2, "naskah berescape tidak boleh menyatu menjadi satu butir")
    assert.deepEqual(r.items.map((i) => i.type), ["true_false", "true_false"])
  })

  it("escape tidak meninggalkan jejak pada teks soal", () => {
    const item = parseQuestionImport(BENAR, 5).items[0]
    assert.equal(item.questionText, "Menuntut ilmu wajib bagi setiap Muslim.")
    assert.ok(!item.questionText.includes("\\"), "garis miring escape tidak ikut tersimpan")
    assert.ok(!/^\d/.test(item.questionText), "nomor pemisah tidak menjadi isi soal")
  })

  it("penanda kunci bintang pada pilihan ganda tetap bekerja di naskah berescape", () => {
    const r = parseQuestionImport("1\\. Berapakah 2 + 2?\nA. 3\nB. 4*\npoin: 4", 5)
    const item = r.items[0]
    assert.equal(item.type, "multiple_choice")
    assert.deepEqual(item.problems, [])
    assert.deepEqual(item.options.filter((o) => o.isCorrect).map((o) => o.label), ["B"])
    assert.equal(item.points, 4)
  })

  it("garis miring di tengah teks soal dibiarkan apa adanya", () => {
    const naskah = String.raw`1\. Hitung luas bangun \propto ABC berikut.`
    const item = parseQuestionImport(naskah, 5).items[0]
    assert.equal(item.questionText, String.raw`Hitung luas bangun \propto ABC berikut.`)
  })

  it("tempelan lembar kerja tidak diubah oleh pembersihan ini", () => {
    const tab = "soal\ttipe\tkunci\tpoin\nWudhu cukup membasuh wajah.\tbenar/salah\tS\t5"
    const r = parseQuestionImport(tab, 5)
    assert.equal(r.items.length, 1)
    assert.equal(r.items[0].type, "true_false")
    assert.equal(r.items[0].trueFalseKey, "Salah")
    assert.equal(r.items[0].questionText, "Wudhu cukup membasuh wajah.")
  })

  it("baris kosong antar opsi dan baris metadata dalam satu butir tetap dirakit utuh", () => {
    const naskah = [
      "1. Apa pengertian iman menurut Ahlus Sunnah wal Jamaah?",
      "",
      "A. Membenarkan dengan hati saja",
      "",
      "B. Mengucapkan dengan lisan saja",
      "",
      "C. Keyakinan dalam hati, ucapan dengan lisan, dan amalan anggota badan*",
      "",
      "D. Amalan anggota badan saja",
      "",
      "pembahasan: Iman menurut Ahlus Sunnah wal Jamaah mencakup keyakinan hati, ucapan lisan, dan amalan anggota badan. Iman dapat bertambah dan berkurang.",
      "",
      "berpikir: memahami",
      "",
      "capaian: Aqidah — pengertian iman menurut Ahlus Sunnah wal Jamaah",
    ].join("\n")

    const r = parseQuestionImport(naskah, 5)
    assert.equal(r.items.length, 1)
    assert.equal(r.readyCount, 1)
    assert.equal(r.problemCount, 0)
    const item = r.items[0]
    assert.equal(item.questionText, "Apa pengertian iman menurut Ahlus Sunnah wal Jamaah?")
    assert.equal(item.options.length, 4)
    assert.equal(item.options.find((o) => o.label === "C")?.isCorrect, true)
    assert.equal(item.thinkingLevel, "memahami")
    assert.equal(item.achievementRef, "Aqidah — pengertian iman menurut Ahlus Sunnah wal Jamaah")
    assert.ok(item.explanation.includes("Iman menurut Ahlus Sunnah wal Jamaah"))
    assert.deepEqual(item.problems, [])
  })
})
